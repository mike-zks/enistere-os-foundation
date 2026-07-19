import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { FileCategory } from '@prisma/client';

import { AuditService } from '../../audit/audit.service';
import { FILES_AUDIT_EVENTS, AuditEventType } from '../../audit/files-audit-events';
import { FILE_ERROR_CODES } from '../../common/errors/files-error-codes';
import { PublicStoredFile } from '../contracts/public-stored-file';
import { UploadFileDto } from '../dto/upload-file.dto';
import { ALLOWED_MIME_BY_CATEGORY, EXTENSIONS_BY_MIME } from '../files.constants';
import { toPublicStoredFile } from '../files.mapper';
import { FilesRepository } from '../files.repository';
import { FilesService } from '../files.service';
import { OBJECT_STORAGE } from '../storage/object-storage.token';
import { ObjectStorage } from '../storage/object-storage';
import { FileValidationPolicy } from '../validation/file-validation-policy';
import { ChecksumService } from './checksum.service';
import { ContentTypeDetector } from './content-type-detector';

function declaredExtension(originalName: string): string {
  const dot = originalName.lastIndexOf('.');
  if (dot < 0 || dot === originalName.length - 1) {
    return '';
  }
  return originalName.slice(dot + 1).toLowerCase();
}

/**
 * Orchestration de l'upload multipart (Upload 2) : inspection du contenu réel, validation,
 * checksum, création `PENDING`, écriture objet privée, finalisation `VALIDATED`, avec
 * compensation en cas d'incohérence DB/stockage. `FilesService` garde le domaine fichier.
 */
@Injectable()
export class FileUploadService {
  constructor(
    private readonly filesService: FilesService,
    private readonly filesRepository: FilesRepository,
    private readonly detector: ContentTypeDetector,
    private readonly checksumService: ChecksumService,
    private readonly validationPolicy: FileValidationPolicy,
    private readonly auditService: AuditService,
    @Inject(OBJECT_STORAGE) private readonly objectStorage: ObjectStorage,
  ) {}

  async upload(
    ownerId: string,
    buffer: Buffer,
    declaredOriginalName: string,
    dto: UploadFileDto,
  ): Promise<PublicStoredFile> {
    // 1. Validations synchrones peu coûteuses, AVANT la création PENDING.
    const originalName = this.validationPolicy.normalizeOriginalName(declaredOriginalName);

    const detected = this.detector.detect(buffer);
    if (!detected) {
      await this.auditAttemptFailure(ownerId, dto.category, 'content_type_undetected');
      throw new BadRequestException({
        code: FILE_ERROR_CODES.FILE_CONTENT_TYPE_UNDETECTED,
        message: 'Unsupported or unrecognized file content.',
      });
    }

    if (!ALLOWED_MIME_BY_CATEGORY[dto.category].includes(detected.mimeType)) {
      await this.auditAttemptFailure(ownerId, dto.category, 'content_type_mismatch');
      throw new BadRequestException({
        code: FILE_ERROR_CODES.FILE_CONTENT_TYPE_MISMATCH,
        message: 'File content does not match the declared category.',
      });
    }

    // Refuse une extension déclarée dangereuse/incompatible avec le type réel détecté.
    const declared = declaredExtension(originalName);
    const allowedExtensions = EXTENSIONS_BY_MIME[detected.mimeType] ?? [];
    if (declared.length > 0 && !allowedExtensions.includes(declared)) {
      await this.auditAttemptFailure(ownerId, dto.category, 'extension_mismatch');
      throw new BadRequestException({
        code: FILE_ERROR_CODES.FILE_INVALID_EXTENSION,
        message: 'File extension does not match its content.',
      });
    }

    const size = BigInt(buffer.length);
    this.validationPolicy.assertSizeWithinLimit(size);
    const checksum = this.checksumService.sha256Hex(buffer);

    // 2. Création PENDING (avec le type RÉEL détecté, jamais le MIME/extension déclarés).
    const pending = await this.filesService.createPendingFile(ownerId, {
      originalName,
      mimeType: detected.mimeType,
      extension: detected.extension,
      size: buffer.length,
      category: dto.category,
      subjectId: dto.subjectId,
    });

    // 3. Écriture de l'objet privé.
    try {
      await this.objectStorage.putObject({
        bucket: pending.bucket,
        storageKey: pending.storageKey,
        body: buffer,
        contentType: detected.mimeType,
      });
    } catch {
      await this.safeReject(pending.id);
      await this.audit(FILES_AUDIT_EVENTS.FILE_UPLOAD_FAILED, pending.id, dto.category, 'storage_unavailable', size);
      throw new ServiceUnavailableException({
        code: FILE_ERROR_CODES.FILE_STORAGE_UNAVAILABLE,
        message: 'File storage is unavailable.',
      });
    }

    // 4. Finalisation DB ; compensation de l'objet si elle échoue.
    try {
      const finalized = await this.filesRepository.finalize(pending.id, { checksum, size });
      await this.audit(FILES_AUDIT_EVENTS.FILE_UPLOADED, finalized.id, dto.category, undefined, size);
      return toPublicStoredFile(finalized);
    } catch {
      await this.compensateOrphan(pending.id, pending.bucket, pending.storageKey, dto.category, size);
      throw new InternalServerErrorException({
        code: FILE_ERROR_CODES.FILE_FINALIZATION_FAILED,
        message: 'File could not be finalized.',
      });
    }
  }

  private async compensateOrphan(
    fileId: string,
    bucket: string,
    storageKey: string,
    category: FileCategory,
    size: bigint,
  ): Promise<void> {
    try {
      await this.objectStorage.deleteObject(bucket, storageKey);
      await this.safeReject(fileId);
      await this.audit(FILES_AUDIT_EVENTS.FILE_UPLOAD_FAILED, fileId, category, 'finalization_failed', size);
    } catch {
      // L'objet écrit n'a pas pu être supprimé : on signale un orphelin pour réconciliation future.
      await this.audit(FILES_AUDIT_EVENTS.FILE_STORAGE_COMPENSATION_FAILED, fileId, category, 'compensation_failed', size);
      await this.audit(FILES_AUDIT_EVENTS.FILE_ORPHANED_OBJECT_DETECTED, fileId, category, 'orphaned_object', size);
    }
  }

  private async safeReject(fileId: string): Promise<void> {
    try {
      await this.filesRepository.reject(fileId);
    } catch {
      // Best-effort : ne pas masquer l'erreur principale.
    }
  }

  private auditAttemptFailure(
    ownerId: string,
    category: FileCategory,
    reasonCode: string,
  ): Promise<void> {
    // Tentative invalide AVANT création : aucun StoredFile, audit sans fileId.
    return this.auditService.record({
      eventType: FILES_AUDIT_EVENTS.FILE_UPLOAD_FAILED,
      actorId: ownerId,
      subjectId: ownerId,
      resourceType: 'stored_file',
      metadata: { category, reasonCode },
    });
  }

  private audit(
    eventType: AuditEventType,
    fileId: string,
    category: FileCategory,
    reasonCode: string | undefined,
    size: bigint,
  ): Promise<void> {
    const metadata: Record<string, string | number | boolean | null> = {
      category,
      size: size.toString(),
    };
    if (reasonCode) {
      metadata.reasonCode = reasonCode;
    }
    return this.auditService.record({
      eventType,
      resourceType: 'stored_file',
      resourceId: fileId,
      metadata,
    });
  }
}
