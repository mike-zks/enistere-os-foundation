import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { filesConfiguration } from './files.configuration';

import { FileAccessService } from './access/file-access.service';
import { FileDeletionService } from './deletion/file-deletion.service';
import { FileQuarantineService } from './quarantine/file-quarantine.service';
import { FileReconciliationService } from './reconciliation/file-reconciliation.service';
import { FilePurgeService } from './reconciliation/file-purge.service';
import { FileQuotaService } from './quota/file-quota.service';
import { MaintenanceLockService } from './maintenance/maintenance-lock.service';
import { FilesController } from './files.controller';
import { FilesRepository } from './files.repository';
import { FilesService } from './files.service';
import { OBJECT_STORAGE } from './storage/object-storage.token';
import { S3_CLIENT, createS3Client } from './storage/s3-client.factory';
import { S3ObjectStorage } from './storage/s3-object-storage';
import { StorageKeyGenerator } from './storage/storage-key-generator';
import { ChecksumService } from './upload/checksum.service';
import { ContentTypeDetector } from './upload/content-type-detector';
import { FileUploadService } from './upload/file-upload.service';
import { FileValidationPolicy } from './validation/file-validation-policy';

/**
 * Domaine fichier (ADR-007) — Upload 2/3 : multipart sécurisé + stockage objet S3/MinIO,
 * consultation sécurisée et URLs signées de lecture courtes.
 *
 * `OBJECT_STORAGE` est lié à `S3ObjectStorage` (client S3 partagé via `S3_CLIENT`).
 * Buckets privés, contenu inspecté, flux compensatoire DB/S3. `PrismaService`, `AuditService`
 * et la configuration des throttlers sont fournis globalement.
 */
@Module({
  imports: [ConfigModule.forFeature(filesConfiguration)],
  controllers: [FilesController],
  providers: [
    FilesService,
    FilesRepository,
    StorageKeyGenerator,
    FileValidationPolicy,
    FileUploadService,
    FileAccessService,
    FileDeletionService,
    FileQuarantineService,
    FileReconciliationService,
    FilePurgeService,
    FileQuotaService,
    MaintenanceLockService,
    ContentTypeDetector,
    ChecksumService,
    {
      provide: S3_CLIENT,
      inject: [ConfigService],
      useFactory: createS3Client,
    },
    { provide: OBJECT_STORAGE, useClass: S3ObjectStorage },
  ],
  exports: [FilesService],
})
export class FilesModule {}
