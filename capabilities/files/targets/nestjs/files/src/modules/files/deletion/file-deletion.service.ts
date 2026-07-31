import {
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { FileStatus, StoredFile } from '@prisma/client';

import { AuditService } from '../../../audit/audit.service';
import { FILES_AUDIT_EVENTS, AuditEventType } from '../files-audit-events';
import { FILE_ERROR_CODES } from '../files-error-codes';
import { FilesRepository } from '../files.repository';
import { ObjectStorage } from '../storage/object-storage';
import { OBJECT_STORAGE } from '../storage/object-storage.token';

/**
 * Suppression applicative complète (Upload 4) : **objet d'abord, puis base** (Option B —
 * priorité à la confidentialité : un objet supprimé ne reste pas accessible via une ancienne
 * URL ; une référence DB active vers un objet absent est détectable et réconciliable).
 *
 * Pas de transaction distribuée. Idempotente (un fichier déjà `DELETED` renvoie un succès).
 * Ownership obligatoire (404 anti-énumération). Aucun bypass administrateur dans cette mission.
 */
@Injectable()
export class FileDeletionService {
  constructor(
    private readonly repository: FilesRepository,
    private readonly auditService: AuditService,
    @Inject(OBJECT_STORAGE) private readonly objectStorage: ObjectStorage,
  ) {}

  async delete(fileId: string, userId: string): Promise<void> {
    // Inclut les fichiers supprimés pour garantir l'idempotence (pas un 404 sur re-suppression).
    const file = await this.repository.findByIdAndOwnerIncludingDeleted(fileId, userId);
    if (!file) {
      throw new NotFoundException({ code: FILE_ERROR_CODES.FILE_NOT_FOUND, message: 'File not found.' });
    }
    if (file.status === FileStatus.DELETED) {
      return; // succès idempotent : suppression déjà effectuée.
    }

    // Marque l'intention AVANT de toucher l'objet : la réconciliation saura qu'une suppression
    // était initiée (→ DELETED) plutôt qu'une simple incohérence (→ REJECTED).
    await this.repository.markDeletionRequested(file.id);
    await this.audit(FILES_AUDIT_EVENTS.FILE_DELETION_REQUESTED, file);

    let objectWasPresent = true;
    try {
      objectWasPresent = await this.objectStorage.objectExists(file.bucket, file.storageKey);
    } catch {
      // Existence indéterminée : on tente quand même la suppression (idempotente).
      objectWasPresent = true;
    }

    // 1. Suppression de l'objet (idempotente). Échec stockage → on NE marque PAS DELETED.
    try {
      await this.objectStorage.deleteObject(file.bucket, file.storageKey);
    } catch {
      await this.audit(FILES_AUDIT_EVENTS.FILE_DELETION_FAILED, file, 'storage_unavailable');
      throw new ServiceUnavailableException({
        code: FILE_ERROR_CODES.FILE_DELETE_FAILED,
        message: 'Could not delete the file.',
      });
    }

    if (objectWasPresent) {
      await this.audit(FILES_AUDIT_EVENTS.FILE_OBJECT_DELETED, file);
    } else {
      // Objet déjà absent : objectif atteint, on audite l'incohérence et on poursuit.
      await this.audit(FILES_AUDIT_EVENTS.FILE_STORAGE_OBJECT_MISSING, file, 'object_already_missing');
    }

    // 2. Marquage DELETED conditionnel (anti-concurrence). Échec DB après suppression S3 = critique.
    try {
      await this.repository.markDeletedConditional(file.id);
    } catch {
      await this.audit(FILES_AUDIT_EVENTS.FILE_DATABASE_FINALIZATION_FAILED, file);
      await this.audit(FILES_AUDIT_EVENTS.FILE_STORAGE_OBJECT_MISSING, file, 'db_finalization_failed');
      throw new InternalServerErrorException({
        code: FILE_ERROR_CODES.FILE_DATABASE_FINALIZATION_FAILED,
        message: 'File deletion could not be finalized.',
      });
    }

    await this.audit(FILES_AUDIT_EVENTS.FILE_DELETED, file);
  }

  private audit(
    eventType: AuditEventType,
    file: StoredFile,
    reasonCode?: string,
  ): Promise<void> {
    // Jamais de storageKey/bucket/checksum/contenu/URL dans l'audit.
    const metadata: Record<string, string | number | boolean | null> = {
      category: file.category,
      status: file.status,
    };
    if (reasonCode) {
      metadata.reasonCode = reasonCode;
    }
    return this.auditService.record({
      eventType,
      actorId: file.ownerId,
      subjectId: file.ownerId,
      resourceType: 'stored_file',
      resourceId: file.id,
      metadata,
    });
  }
}
