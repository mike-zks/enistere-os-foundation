import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FileStatus, StoredFile } from '@prisma/client';

import { AuditService } from '../../audit/audit.service';
import { FILES_AUDIT_EVENTS } from '../../audit/files-audit-events';
import { FilesConfig } from '../../config/files.configuration';
import { FilesRepository } from '../files.repository';
import { ObjectStorage } from '../storage/object-storage';
import { OBJECT_STORAGE } from '../storage/object-storage.token';
import { ReconciliationOptions, ReconciliationReport } from './file-reconciliation.service';

/**
 * Purge PHYSIQUE contrôlée des métadonnées (Upload 5). Supprime les lignes `DELETED`/`REJECTED`
 * dont la **rétention est dépassée** ET dont **aucun objet n'est présent** dans le stockage.
 *
 * Garanties (Étape 22) : statut purgeable, rétention écoulée, objet absent, exécution sous verrou
 * de maintenance (un seul processus). Si l'objet existe encore → **on ne purge pas** (incohérence
 * signalée : la réconciliation doit passer d'abord). Les `AuditLog` ne sont **jamais** supprimés.
 * Dry-run par défaut, batch borné, rapport JSON sans secret, aucune exécution automatique.
 */
@Injectable()
export class FilePurgeService {
  private readonly rejectedRetentionSeconds: number;
  private readonly deletedRetentionSeconds: number;
  private readonly batchSize: number;

  constructor(
    private readonly repository: FilesRepository,
    private readonly auditService: AuditService,
    @Inject(OBJECT_STORAGE) private readonly objectStorage: ObjectStorage,
    configService: ConfigService<FilesConfig, true>,
  ) {
    this.rejectedRetentionSeconds = configService.get('filesRejectedRetentionSeconds', { infer: true });
    this.deletedRetentionSeconds = configService.get('filesDeletedMetadataRetentionSeconds', {
      infer: true,
    });
    this.batchSize = configService.get('filesReconciliationBatchSize', { infer: true });
  }

  async purgeMetadata(options: ReconciliationOptions): Promise<ReconciliationReport> {
    const { dryRun } = options;
    const limit = this.resolveLimit(options.maxItems);
    const report: ReconciliationReport = {
      dryRun,
      scannedDb: 0,
      scannedObjects: 0,
      actions: [],
      counts: {},
    };

    await this.auditService.record({
      eventType: FILES_AUDIT_EVENTS.FILE_RECONCILIATION_STARTED,
      resourceType: 'stored_file',
      metadata: { dryRun, mode: 'purge' },
    });

    const deletedCutoff = new Date(Date.now() - this.deletedRetentionSeconds * 1000);
    await this.purge(report, dryRun, await this.repository.findPurgeableDeleted(deletedCutoff, limit), FileStatus.DELETED, 'purge_deleted');

    const rejectedCutoff = new Date(Date.now() - this.rejectedRetentionSeconds * 1000);
    await this.purge(report, dryRun, await this.repository.findPurgeableRejected(rejectedCutoff, limit), FileStatus.REJECTED, 'purge_rejected');

    await this.auditService.record({
      eventType: FILES_AUDIT_EVENTS.FILE_RECONCILIATION_COMPLETED,
      resourceType: 'stored_file',
      metadata: { dryRun, mode: 'purge', scannedDb: report.scannedDb, ...report.counts },
    });
    return report;
  }

  private async purge(
    report: ReconciliationReport,
    dryRun: boolean,
    rows: StoredFile[],
    status: FileStatus,
    type: string,
  ): Promise<void> {
    for (const file of rows) {
      report.scannedDb++;

      // Ne JAMAIS purger une ligne dont l'objet existe encore (ou dont l'existence est incertaine) :
      // on signale l'incohérence pour réconciliation préalable.
      let objectPresent = true;
      try {
        objectPresent = await this.objectStorage.objectExists(file.bucket, file.storageKey);
      } catch {
        objectPresent = true;
      }
      if (objectPresent) {
        this.addAction(report, `${type}_object_present`, file.id, 'report_only', false);
        continue;
      }

      if (!dryRun) {
        await this.repository.hardDeletePurgeable(file.id, status);
      }
      this.addAction(report, type, file.id, 'purge_row', !dryRun);
    }
  }

  private resolveLimit(maxItems?: number): number {
    if (maxItems === undefined || maxItems <= 0) {
      return this.batchSize;
    }
    return Math.min(maxItems, this.batchSize);
  }

  private addAction(
    report: ReconciliationReport,
    type: string,
    resource: string,
    action: ReconciliationReport['actions'][number]['action'],
    applied: boolean,
  ): void {
    report.actions.push({ type, resource, action, applied });
    report.counts[type] = (report.counts[type] ?? 0) + 1;
  }
}
