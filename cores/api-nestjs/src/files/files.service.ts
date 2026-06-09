import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FileStatus, FileVisibility, Prisma, StoredFile } from '@prisma/client';

import { AuditService } from '../audit/audit.service';
import { AUDIT_EVENT_TYPES, AuditEventType } from '../audit/audit.types';
import { ERROR_CODES } from '../common/errors/error-codes';
import { AppConfig } from '../config/configuration';
import { PublicStoredFile } from './contracts/public-stored-file';
import { StoredFileView } from './contracts/stored-file-view';
import { CreatePendingFileInput } from './dto/create-pending-file.input';
import { toPublicStoredFile, toStoredFileView } from './files.mapper';
import { FilesRepository, OwnerQuotaCreateOutcome } from './files.repository';
import { FileQuotaService } from './quota/file-quota.service';
import { StorageKeyGenerator } from './storage/storage-key-generator';
import { FileValidationPolicy } from './validation/file-validation-policy';

/**
 * Domaine fichier (ADR-007) — intention `PENDING`, validation déclarative, génération de clé
 * sûre, ownership et mapping public/interne. Depuis Upload 5, la création d'un `PENDING` possédé
 * est **atomique sous quota** (verrou advisory par propriétaire). Privé par défaut ; ne fait
 * jamais confiance au MIME/à la taille déclarés par le client.
 */
@Injectable()
export class FilesService {
  private readonly bucket: string;

  constructor(
    private readonly repository: FilesRepository,
    private readonly storageKeyGenerator: StorageKeyGenerator,
    private readonly validationPolicy: FileValidationPolicy,
    private readonly auditService: AuditService,
    private readonly quotaService: FileQuotaService,
    configService: ConfigService<AppConfig, true>,
  ) {
    this.bucket = configService.get('s3Bucket', { infer: true });
  }

  /** Crée une intention de fichier `PENDING` (métadonnées validées, clé générée serveur). */
  async createPendingFile(
    ownerId: string | null,
    input: CreatePendingFileInput,
  ): Promise<StoredFileView> {
    const originalName = this.validationPolicy.normalizeOriginalName(input.originalName);
    const mimeType = input.mimeType.trim().toLowerCase();
    const extension = input.extension.trim().toLowerCase().replace(/^\.+/, '');
    const size = BigInt(input.size);

    this.validationPolicy.assertMimeAndExtension(input.category, mimeType, extension);
    this.validationPolicy.assertSizeWithinLimit(size);

    const storageKey = this.storageKeyGenerator.generate(input.category, extension);
    const data: Prisma.StoredFileCreateInput = {
      owner: ownerId ? { connect: { id: ownerId } } : undefined,
      subjectId: input.subjectId ?? null,
      originalName,
      storageKey,
      bucket: this.bucket,
      mimeType,
      extension,
      size,
      visibility: input.visibility ?? FileVisibility.PRIVATE,
      status: FileStatus.PENDING,
      category: input.category,
    };

    // Propriétaire connu → création atomique sous quota ; sinon création simple (sans quota).
    const file =
      ownerId === null
        ? await this.createUnowned(storageKey, data)
        : await this.createOwnedWithinQuota(ownerId, storageKey, size, data);

    await this.audit(AUDIT_EVENT_TYPES.FILE_PENDING_CREATED, file);
    return toStoredFileView(file);
  }

  private async createUnowned(
    storageKey: string,
    data: Prisma.StoredFileCreateInput,
  ): Promise<StoredFile> {
    if (await this.repository.existsByStorageKey(storageKey)) {
      throw new ConflictException({
        code: ERROR_CODES.FILE_STORAGE_KEY_CONFLICT,
        message: 'Storage key conflict.',
      });
    }
    try {
      return await this.repository.create(data);
    } catch {
      throw new InternalServerErrorException({
        code: ERROR_CODES.FILE_CREATION_FAILED,
        message: 'Could not create file.',
      });
    }
  }

  private async createOwnedWithinQuota(
    ownerId: string,
    storageKey: string,
    size: bigint,
    data: Prisma.StoredFileCreateInput,
  ): Promise<StoredFile> {
    const limits = this.quotaService.getLimits();
    let result: OwnerQuotaCreateOutcome;
    try {
      result = await this.repository.createPendingWithinOwnerQuota({
        ownerId,
        storageKey,
        newSize: size,
        maxActiveFiles: limits.maxActiveFiles,
        maxTotalBytes: limits.maxTotalBytes,
        data,
      });
    } catch {
      throw new InternalServerErrorException({
        code: ERROR_CODES.FILE_CREATION_FAILED,
        message: 'Could not create file.',
      });
    }

    switch (result.outcome) {
      case 'created':
        return result.file;
      case 'key_conflict':
        throw new ConflictException({
          code: ERROR_CODES.FILE_STORAGE_KEY_CONFLICT,
          message: 'Storage key conflict.',
        });
      default:
        // count_exceeded / size_exceeded → audit + 409 (ne revient jamais).
        return this.quotaService.rejectQuotaOutcome(result.outcome, ownerId, size);
    }
  }

  /** Métadonnées publiques d'un fichier possédé. 404 si absent ou non possédé (anti-énumération). */
  async getOwnedFile(fileId: string, userId: string): Promise<PublicStoredFile> {
    return toPublicStoredFile(await this.requireOwnedFile(fileId, userId));
  }

  /** Variante interne (orchestration Upload 2) retournant la vue complète. */
  async findOwnedFile(fileId: string, userId: string): Promise<StoredFileView> {
    return toStoredFileView(await this.requireOwnedFile(fileId, userId));
  }

  async rejectFile(fileId: string, reasonCode: string): Promise<StoredFileView> {
    const file = await this.repository.findById(fileId);
    if (!file || file.status === FileStatus.DELETED) {
      throw new NotFoundException({ code: ERROR_CODES.FILE_NOT_FOUND, message: 'File not found.' });
    }

    const updated = await this.repository.reject(fileId);
    await this.audit(AUDIT_EVENT_TYPES.FILE_REJECTED, updated, { reasonCode });
    return toStoredFileView(updated);
  }

  /** Suppression logique d'un fichier possédé (anti-énumération si non possédé). */
  async markFileDeleted(fileId: string, userId: string): Promise<void> {
    const file = await this.requireOwnedFile(fileId, userId);
    await this.repository.markDeleted(fileId);
    await this.audit(AUDIT_EVENT_TYPES.FILE_MARKED_DELETED, file);
  }

  private async requireOwnedFile(fileId: string, userId: string): Promise<StoredFile> {
    const file = await this.repository.findByIdAndOwner(fileId, userId);
    if (!file) {
      throw new NotFoundException({ code: ERROR_CODES.FILE_NOT_FOUND, message: 'File not found.' });
    }
    return file;
  }

  private audit(
    eventType: AuditEventType,
    file: StoredFile,
    extra: Record<string, string | number | boolean | null> = {},
  ): Promise<void> {
    // Jamais de storageKey/originalName/checksum/contenu dans l'audit.
    return this.auditService.record({
      eventType,
      actorId: file.ownerId,
      subjectId: file.ownerId,
      resourceType: 'stored_file',
      resourceId: file.id,
      metadata: { category: file.category, status: file.status, ...extra },
    });
  }
}
