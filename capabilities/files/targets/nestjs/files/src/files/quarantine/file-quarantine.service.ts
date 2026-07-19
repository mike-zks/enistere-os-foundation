import { ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { FileStatus, StoredFile } from '@prisma/client';

import { AuditService } from '../../audit/audit.service';
import { FILES_AUDIT_EVENTS, AuditEventType } from '../../audit/files-audit-events';
import { FILE_ERROR_CODES } from '../../common/errors/files-error-codes';
import { QuarantineReasonCode } from '../dto/quarantine-file.dto';
import { FilesRepository } from '../files.repository';
import { ObjectStorage } from '../storage/object-storage';
import { OBJECT_STORAGE } from '../storage/object-storage.token';

/**
 * Quarantaine ADMINISTRATIVE (Upload 4). `QUARANTINED` signifie : l'objet existe peut-être dans
 * le stockage, mais **aucun accès utilisateur ni URL signée** n'est autorisé (protection assurée
 * par `FileAccessService`). Opérations réservées à un principal authentifié disposant de la
 * permission dédiée (`files.quarantine`/`files.restore`) — **sans condition d'ownership**, à la
 * différence des endpoints utilisateur. Aucun antivirus n'est exécuté : la décision est manuelle.
 *
 * Transitions appliquées via des updates CONDITIONNELS (anti-concurrence) : une suppression
 * concurrente l'emporte (un fichier `DELETED` ne peut pas redevenir `QUARANTINED`/`VALIDATED`).
 */
@Injectable()
export class FileQuarantineService {
  constructor(
    private readonly repository: FilesRepository,
    private readonly auditService: AuditService,
    @Inject(OBJECT_STORAGE) private readonly objectStorage: ObjectStorage,
  ) {}

  async quarantine(fileId: string, actorId: string, reasonCode: QuarantineReasonCode): Promise<void> {
    const file = await this.repository.findById(fileId);
    if (!file) {
      throw new NotFoundException({ code: FILE_ERROR_CODES.FILE_NOT_FOUND, message: 'File not found.' });
    }
    if (file.status === FileStatus.QUARANTINED) {
      return; // idempotent : déjà en quarantaine.
    }
    if (file.status !== FileStatus.VALIDATED) {
      // Seul VALIDATED → QUARANTINED (un PENDING/REJECTED/DELETED ne se met pas en quarantaine).
      throw new ConflictException({
        code: FILE_ERROR_CODES.FILE_QUARANTINE_INVALID_STATUS,
        message: 'File cannot be quarantined from its current status.',
      });
    }

    const updated = await this.repository.quarantineConditional(fileId, reasonCode);
    if (updated === 0) {
      // Le statut a changé entre la lecture et l'update (concurrence) : transition refusée.
      throw new ConflictException({
        code: FILE_ERROR_CODES.FILE_QUARANTINE_INVALID_STATUS,
        message: 'File cannot be quarantined from its current status.',
      });
    }

    await this.audit(FILES_AUDIT_EVENTS.FILE_QUARANTINED, file, actorId, reasonCode);
  }

  async restore(fileId: string, actorId: string): Promise<void> {
    const file = await this.repository.findById(fileId);
    if (!file) {
      throw new NotFoundException({ code: FILE_ERROR_CODES.FILE_NOT_FOUND, message: 'File not found.' });
    }
    if (file.status === FileStatus.VALIDATED) {
      return; // idempotent : déjà restauré.
    }
    if (file.status !== FileStatus.QUARANTINED) {
      throw new ConflictException({
        code: FILE_ERROR_CODES.FILE_RESTORE_INVALID_STATUS,
        message: 'File cannot be restored from its current status.',
      });
    }

    // Restauration prudente : ne revenir à VALIDATED que si l'objet existe ET le checksum est connu.
    // Aucune analyse antivirus n'est (re)faite : décision administrative manuelle (V1).
    if (!file.checksum) {
      throw new ConflictException({
        code: FILE_ERROR_CODES.FILE_RESTORE_INVALID_STATUS,
        message: 'File cannot be restored.',
      });
    }
    let objectPresent = false;
    try {
      objectPresent = await this.objectStorage.objectExists(file.bucket, file.storageKey);
    } catch {
      objectPresent = false;
    }
    if (!objectPresent) {
      await this.audit(FILES_AUDIT_EVENTS.FILE_STORAGE_OBJECT_MISSING, file, actorId, 'restore_object_missing');
      throw new ConflictException({
        code: FILE_ERROR_CODES.FILE_RESTORE_INVALID_STATUS,
        message: 'File cannot be restored.',
      });
    }

    const updated = await this.repository.restoreConditional(fileId);
    if (updated === 0) {
      throw new ConflictException({
        code: FILE_ERROR_CODES.FILE_RESTORE_INVALID_STATUS,
        message: 'File cannot be restored from its current status.',
      });
    }

    await this.audit(FILES_AUDIT_EVENTS.FILE_QUARANTINE_RELEASED, file, actorId);
  }

  private audit(
    eventType: AuditEventType,
    file: StoredFile,
    actorId: string,
    reasonCode?: string,
  ): Promise<void> {
    const metadata: Record<string, string | number | boolean | null> = {
      category: file.category,
      status: file.status,
    };
    if (reasonCode) {
      metadata.reasonCode = reasonCode;
    }
    return this.auditService.record({
      eventType,
      actorId, // acteur administratif (pas nécessairement le propriétaire).
      subjectId: file.ownerId,
      resourceType: 'stored_file',
      resourceId: file.id,
      metadata,
    });
  }
}
