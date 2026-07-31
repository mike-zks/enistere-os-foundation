import { ConflictException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { AuditService } from '../../../audit/audit.service';
import { FILES_AUDIT_EVENTS } from '../files-audit-events';
import { FILE_ERROR_CODES } from '../files-error-codes';
import { FilesConfig } from '../files.configuration';
import { OwnerUsage } from '../contracts/owner-usage';
import { FilesRepository } from '../files.repository';

export interface OwnerQuotaLimits {
  /** `0` = illimité. */
  maxActiveFiles: number;
  /** `0n` = illimité. */
  maxTotalBytes: bigint;
}

/**
 * Quotas par propriétaire (Upload 5), simples, génériques et configurables.
 *
 * Comptent les fichiers **actifs** (`PENDING`/`UPLOADED`/`VALIDATED`/`QUARANTINED`) ; les
 * `REJECTED`/`DELETED` **ne consomment plus** le quota (décision documentée). `0`/`0n` = illimité.
 * La vérification est **atomique avec la création** du `PENDING` (verrou advisory par propriétaire,
 * côté repository) : aucun dépassement par concurrence. Aucune confiance dans une taille textuelle
 * du client — la taille réelle reçue est utilisée. L'audit n'a lieu **que** sur dépassement.
 */
@Injectable()
export class FileQuotaService {
  private readonly maxActiveFiles: number;
  private readonly maxTotalBytes: bigint;

  constructor(
    private readonly repository: FilesRepository,
    private readonly auditService: AuditService,
    configService: ConfigService<FilesConfig, true>,
  ) {
    this.maxActiveFiles = configService.get('filesOwnerMaxActiveFiles', { infer: true });
    this.maxTotalBytes = BigInt(configService.get('filesOwnerMaxTotalBytes', { infer: true }));
  }

  getLimits(): OwnerQuotaLimits {
    return { maxActiveFiles: this.maxActiveFiles, maxTotalBytes: this.maxTotalBytes };
  }

  /** Usage actif d'un propriétaire (lecture seule), délégué au repository (pas de duplication). */
  async getOwnerUsage(ownerId: string): Promise<OwnerUsage> {
    const [activeCount, totalSize] = await Promise.all([
      this.repository.countActiveByOwner(ownerId),
      this.repository.sumActiveSizeByOwner(ownerId),
    ]);
    return { activeCount, totalSize: totalSize.toString() };
  }

  /**
   * Audite le dépassement puis lève l'erreur publique 409 adaptée. Ne révèle pas la limite exacte.
   * `Promise<never>` : ne revient jamais normalement.
   */
  async rejectQuotaOutcome(
    outcome: 'count_exceeded' | 'size_exceeded',
    ownerId: string,
    requestedSize: bigint,
  ): Promise<never> {
    const quotaType = outcome === 'count_exceeded' ? 'count' : 'storage';
    await this.auditService.record({
      eventType: FILES_AUDIT_EVENTS.FILE_QUOTA_EXCEEDED,
      actorId: ownerId,
      subjectId: ownerId,
      resourceType: 'stored_file',
      metadata: { quotaType, requestedSize: requestedSize.toString() },
    });

    if (outcome === 'count_exceeded') {
      throw new ConflictException({
        code: FILE_ERROR_CODES.FILE_COUNT_QUOTA_EXCEEDED,
        message: 'Active file count quota exceeded.',
      });
    }
    throw new ConflictException({
      code: FILE_ERROR_CODES.FILE_STORAGE_QUOTA_EXCEEDED,
      message: 'Storage quota exceeded.',
    });
  }
}
