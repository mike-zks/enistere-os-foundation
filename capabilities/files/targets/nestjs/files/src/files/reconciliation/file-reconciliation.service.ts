import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FileStatus, StoredFile } from '@prisma/client';

import { AuditService } from '../../audit/audit.service';
import { FILES_AUDIT_EVENTS, AuditEventType } from '../../audit/files-audit-events';
import { FilesConfig } from '../../config/files.configuration';
import { FilesRepository } from '../files.repository';
import { ObjectStorage } from '../storage/object-storage';
import { OBJECT_STORAGE } from '../storage/object-storage.token';

export type ReconciliationActionKind =
  | 'mark_rejected'
  | 'mark_deleted'
  | 'delete_object'
  | 'purge_row'
  | 'report_only';

export interface ReconciliationAction {
  type: string;
  resource: string;
  action: ReconciliationActionKind;
  applied: boolean;
}

export interface ReconciliationReport {
  dryRun: boolean;
  scannedDb: number;
  scannedObjects: number;
  actions: ReconciliationAction[];
  counts: Record<string, number>;
}

export interface ReconciliationOptions {
  dryRun: boolean;
  maxItems?: number;
}

type ObjectPresence = 'present' | 'missing' | 'unknown';

/**
 * Réconciliation DB ↔ stockage (Upload 4).
 *
 * SOURCE DE VÉRITÉ : la comparaison DIRECTE entre les lignes `StoredFile` (PostgreSQL) et les
 * objets réellement présents dans S3/MinIO (`objectExists`/`listObjects`). Les audit logs
 * (`FILE_ORPHANED_OBJECT_DETECTED`, `FILE_STORAGE_OBJECT_MISSING`) ne sont qu'un signal de
 * diagnostic — jamais la seule entrée du processus.
 *
 * Toujours **scopée par préfixe applicatif** (`<environment>/`), **bornée** (`maxItems`) et
 * **dry-run par défaut** côté CLI. Aucune exécution automatique au démarrage de l'API.
 */
@Injectable()
export class FileReconciliationService {
  private readonly bucket: string;
  private readonly prefix: string;
  private readonly pendingExpirationSeconds: number;
  private readonly orphanMinAgeSeconds: number;
  private readonly batchSize: number;

  constructor(
    private readonly repository: FilesRepository,
    private readonly auditService: AuditService,
    @Inject(OBJECT_STORAGE) private readonly objectStorage: ObjectStorage,
    configService: ConfigService<FilesConfig, true>,
  ) {
    this.bucket = configService.get('s3Bucket', { infer: true });
    // Même préfixe que `StorageKeyGenerator` (`<environment>/…`) : jamais le bucket entier.
    this.prefix = `${configService.get('nodeEnv', { infer: true })}/`;
    this.pendingExpirationSeconds = configService.get('filesPendingExpirationSeconds', { infer: true });
    this.orphanMinAgeSeconds = configService.get('filesOrphanMinAgeSeconds', { infer: true });
    this.batchSize = configService.get('filesReconciliationBatchSize', { infer: true });
  }

  /** Réconciliation complète (DB→stockage puis orphelins stockage→DB). */
  async reconcile(options: ReconciliationOptions): Promise<ReconciliationReport> {
    const { dryRun } = options;
    const limit = this.resolveLimit(options.maxItems);
    const report = this.emptyReport(dryRun);

    await this.audit(FILES_AUDIT_EVENTS.FILE_RECONCILIATION_STARTED, { dryRun, prefix: this.prefix });

    await this.handleValidatedMissing(report, dryRun, limit);
    await this.handleExpiredPending(report, dryRun, limit);
    await this.handleObjectPresentForStatus(report, dryRun, limit, FileStatus.REJECTED, 'rejected_object_present');
    await this.handleObjectPresentForStatus(report, dryRun, limit, FileStatus.DELETED, 'deleted_object_present');
    await this.handleOrphans(report, dryRun, limit);

    await this.audit(FILES_AUDIT_EVENTS.FILE_RECONCILIATION_COMPLETED, {
      dryRun,
      scannedDb: report.scannedDb,
      scannedObjects: report.scannedObjects,
      ...report.counts,
    });
    return report;
  }

  /** Nettoyage ciblé des `PENDING` abandonnés (utilisable seul via une commande dédiée). */
  async cleanupExpiredPending(options: ReconciliationOptions): Promise<ReconciliationReport> {
    const { dryRun } = options;
    const limit = this.resolveLimit(options.maxItems);
    const report = this.emptyReport(dryRun);

    await this.audit(FILES_AUDIT_EVENTS.FILE_RECONCILIATION_STARTED, { dryRun, mode: 'cleanup_pending' });
    await this.handleExpiredPending(report, dryRun, limit);
    await this.audit(FILES_AUDIT_EVENTS.FILE_RECONCILIATION_COMPLETED, {
      dryRun,
      mode: 'cleanup_pending',
      scannedDb: report.scannedDb,
      ...report.counts,
    });
    return report;
  }

  // --- Cas A : ligne VALIDATED, objet absent ---
  private async handleValidatedMissing(report: ReconciliationReport, dryRun: boolean, limit: number): Promise<void> {
    const rows = await this.repository.findActiveByStatus(FileStatus.VALIDATED, limit);
    for (const file of rows) {
      report.scannedDb++;
      if ((await this.presence(file)) !== 'missing') {
        continue;
      }
      // Politique : si une suppression avait été initiée → DELETED ; sinon → REJECTED.
      const target = file.deletionRequestedAt ? FileStatus.DELETED : FileStatus.REJECTED;
      if (!dryRun) {
        if (target === FileStatus.DELETED) {
          await this.repository.markDeletedConditional(file.id);
        } else {
          await this.repository.rejectConditional(file.id, [FileStatus.VALIDATED]);
        }
        await this.auditAction(file, 'validated_object_missing', target);
      }
      this.addAction(
        report,
        'validated_object_missing',
        file.id,
        target === FileStatus.DELETED ? 'mark_deleted' : 'mark_rejected',
        !dryRun,
      );
    }
  }

  // --- Cas B : ligne PENDING ancienne ---
  private async handleExpiredPending(report: ReconciliationReport, dryRun: boolean, limit: number): Promise<void> {
    const cutoff = new Date(Date.now() - this.pendingExpirationSeconds * 1000);
    const rows = await this.repository.findExpiredPending(cutoff, limit);
    for (const file of rows) {
      report.scannedDb++;
      const presence = await this.presence(file);
      if (presence === 'missing') {
        if (!dryRun) {
          await this.repository.rejectConditional(file.id, [FileStatus.PENDING]);
          await this.audit(FILES_AUDIT_EVENTS.FILE_PENDING_EXPIRED, { category: file.category }, file);
        }
        this.addAction(report, 'pending_expired_no_object', file.id, 'mark_rejected', !dryRun);
      } else if (presence === 'present') {
        // Objet présent mais jamais finalisé : on ne valide PAS automatiquement (preuve
        // insuffisante). On signale pour intervention/politique déterministe.
        if (!dryRun) {
          await this.auditAction(file, 'pending_expired_with_object', FileStatus.PENDING);
        }
        this.addAction(report, 'pending_expired_with_object', file.id, 'report_only', false);
      }
    }
  }

  // --- Cas C/D : ligne REJECTED/DELETED mais objet présent → supprimer l'objet, garder le statut ---
  private async handleObjectPresentForStatus(
    report: ReconciliationReport,
    dryRun: boolean,
    limit: number,
    status: FileStatus,
    type: string,
  ): Promise<void> {
    const rows = await this.repository.findActiveByStatus(status, limit);
    for (const file of rows) {
      report.scannedDb++;
      if ((await this.presence(file)) !== 'present') {
        continue;
      }
      if (!dryRun) {
        await this.objectStorage.deleteObject(file.bucket, file.storageKey);
        await this.auditAction(file, type, status);
      }
      this.addAction(report, type, file.id, 'delete_object', !dryRun);
    }
  }

  // --- Cas E : objet S3 sans ligne PostgreSQL (orphelin réel) ---
  private async handleOrphans(report: ReconciliationReport, dryRun: boolean, limit: number): Promise<void> {
    const cutoff = Date.now() - this.orphanMinAgeSeconds * 1000;
    let continuationToken: string | undefined;
    let processed = 0;

    do {
      const remaining = limit - processed;
      if (remaining <= 0) {
        break;
      }
      const page = await this.objectStorage.listObjects({
        bucket: this.bucket,
        prefix: this.prefix,
        continuationToken,
        maxKeys: Math.min(this.batchSize, remaining),
      });
      if (page.objects.length === 0) {
        break;
      }
      for (const object of page.objects) {
        if (processed >= limit) {
          break;
        }
        processed++;
        report.scannedObjects++;

        if (await this.repository.findByStorageKey(object.key)) {
          continue; // une ligne existe : pas un orphelin.
        }
        const lastModified = object.lastModified?.getTime();
        if (lastModified === undefined || lastModified > cutoff) {
          // Trop récent (ou âge inconnu) : on ne supprime jamais — prudence.
          this.addAction(report, 'orphan_too_recent', object.key, 'report_only', false);
          continue;
        }
        if (!dryRun) {
          await this.objectStorage.deleteObject(this.bucket, object.key);
          await this.audit(FILES_AUDIT_EVENTS.FILE_ORPHAN_DELETED, { category: this.objectCategory(object.key) });
        }
        this.addAction(report, 'orphan', object.key, 'delete_object', !dryRun);
      }
      continuationToken = page.nextContinuationToken;
    } while (continuationToken && processed < limit);
  }

  private async presence(file: StoredFile): Promise<ObjectPresence> {
    try {
      return (await this.objectStorage.objectExists(file.bucket, file.storageKey)) ? 'present' : 'missing';
    } catch {
      // Erreur de stockage (possiblement transitoire) : ne JAMAIS prendre d'action destructive.
      return 'unknown';
    }
  }

  /** Segment de catégorie de la clé (`<env>/<category>/…`) — étiquette non sensible pour l'audit. */
  private objectCategory(key: string): string {
    return key.split('/')[1] ?? 'unknown';
  }

  private resolveLimit(maxItems?: number): number {
    if (maxItems === undefined || maxItems <= 0) {
      return this.batchSize;
    }
    return Math.min(maxItems, this.batchSize);
  }

  private emptyReport(dryRun: boolean): ReconciliationReport {
    return { dryRun, scannedDb: 0, scannedObjects: 0, actions: [], counts: {} };
  }

  private addAction(
    report: ReconciliationReport,
    type: string,
    resource: string,
    action: ReconciliationActionKind,
    applied: boolean,
  ): void {
    report.actions.push({ type, resource, action, applied });
    report.counts[type] = (report.counts[type] ?? 0) + 1;
  }

  private audit(
    eventType: AuditEventType,
    metadata: Record<string, string | number | boolean | null>,
    file?: StoredFile,
  ): Promise<void> {
    return this.auditService.record({
      eventType,
      resourceType: 'stored_file',
      resourceId: file?.id ?? null,
      metadata,
    });
  }

  private auditAction(file: StoredFile, reasonCode: string, targetStatus: FileStatus): Promise<void> {
    // Jamais de storageKey/bucket/checksum dans l'audit ; identifiants ciblés pour incident.
    return this.audit(
      FILES_AUDIT_EVENTS.FILE_RECONCILIATION_ACTION,
      { category: file.category, status: file.status, reasonCode, targetStatus },
      file,
    );
  }
}
