import {
  ConflictException,
  Inject,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FileStatus, FileVisibility } from '@prisma/client';

import { AuditService } from '../../audit/audit.service';
import { FILES_AUDIT_EVENTS, AuditEventType } from '../../audit/files-audit-events';
import { FILE_ERROR_CODES } from '../../common/errors/files-error-codes';
import { FilesConfig } from '../../config/files.configuration';
import { PublicStoredFile } from '../contracts/public-stored-file';
import { SignedDownloadResult } from '../contracts/signed-download-result';
import { StoredFileView } from '../contracts/stored-file-view';
import { FilesService } from '../files.service';
import { ObjectStorage } from '../storage/object-storage';
import { OBJECT_STORAGE } from '../storage/object-storage.token';
import { buildContentDisposition } from './content-disposition';

/** Visibilités pour lesquelles un accès signé contrôlé est autorisé (jamais PUBLIC/INTERNAL). */
const SIGNABLE_VISIBILITIES: ReadonlySet<FileVisibility> = new Set([
  FileVisibility.PRIVATE,
  FileVisibility.SIGNED,
]);

/**
 * Service d'ACCÈS aux fichiers (Upload 3) : consultation sécurisée des métadonnées et
 * génération d'URLs signées de LECTURE courtes. Distinct de `FilesService` (domaine) et de
 * `FileUploadService` (écriture) : il concentre ownership + statut + existence objet +
 * signature + audit, sans exposer la moindre donnée interne au controller.
 *
 * Garanties de sécurité :
 * - ownership obligatoire (anti-énumération : 404 si absent/non possédé/supprimé) ;
 * - seuls les fichiers `VALIDATED` et de visibilité signable produisent une URL ;
 * - le client ne contrôle ni la clé, ni le bucket, ni la durée, ni le content-type ;
 * - l'URL signée n'est jamais journalisée ni auditée.
 */
@Injectable()
export class FileAccessService {
  private readonly signedReadUrlTtlSeconds: number;

  constructor(
    private readonly filesService: FilesService,
    private readonly auditService: AuditService,
    @Inject(OBJECT_STORAGE) private readonly objectStorage: ObjectStorage,
    configService: ConfigService<FilesConfig, true>,
  ) {
    this.signedReadUrlTtlSeconds = configService.get('filesSignedReadUrlTtlSeconds', {
      infer: true,
    });
  }

  /**
   * Métadonnées publiques d'un fichier possédé et non supprimé (statut inclus). 404 si absent
   * ou non possédé (anti-énumération). Pas d'audit : lecture banale, volume potentiellement élevé.
   */
  getMetadata(fileId: string, userId: string): Promise<PublicStoredFile> {
    return this.filesService.getOwnedFile(fileId, userId);
  }

  /**
   * Génère une URL signée de lecture courte pour un fichier possédé, validé et présent dans le
   * stockage. La durée est imposée par la configuration serveur. Audite l'émission (sans URL).
   */
  async issueDownloadUrl(fileId: string, userId: string): Promise<SignedDownloadResult> {
    // Une seule requête DB : ownership + anti-énumération (404 si absent/non possédé/supprimé).
    const file = await this.filesService.findOwnedFile(fileId, userId);

    // Seuls les fichiers réellement lisibles produisent une URL. Visibilité restreinte
    // (jamais PUBLIC/INTERNAL en V1). On révèle le refus au propriétaire uniquement (409).
    if (file.status !== FileStatus.VALIDATED || !SIGNABLE_VISIBILITIES.has(file.visibility)) {
      await this.audit(FILES_AUDIT_EVENTS.FILE_DOWNLOAD_URL_DENIED, file, 'not_downloadable');
      throw new ConflictException({
        code: FILE_ERROR_CODES.FILE_NOT_DOWNLOADABLE,
        message: 'File is not downloadable.',
      });
    }

    // Vérifie l'existence réelle de l'objet AVANT de signer (cohérence DB/stockage). Une absence
    // n'est pas exposée : erreur générique + audit technique pour la réconciliation future.
    if (!(await this.objectIsPresent(file))) {
      await this.audit(FILES_AUDIT_EVENTS.FILE_STORAGE_OBJECT_MISSING, file, 'storage_object_missing');
      throw new ServiceUnavailableException({
        code: FILE_ERROR_CODES.FILE_SIGNED_URL_GENERATION_FAILED,
        message: 'Could not generate a download URL.',
      });
    }

    let signed: SignedDownloadResult;
    try {
      signed = await this.objectStorage.createSignedReadUrl({
        bucket: file.bucket,
        storageKey: file.storageKey,
        expiresInSeconds: this.signedReadUrlTtlSeconds,
        // Content-type imposé = MIME réel enregistré à l'upload (jamais un MIME client).
        responseContentType: file.mimeType,
        responseContentDisposition: buildContentDisposition(file.originalName),
      });
    } catch {
      await this.audit(FILES_AUDIT_EVENTS.FILE_DOWNLOAD_URL_DENIED, file, 'signing_failed');
      throw new ServiceUnavailableException({
        code: FILE_ERROR_CODES.FILE_SIGNED_URL_GENERATION_FAILED,
        message: 'Could not generate a download URL.',
      });
    }

    await this.audit(FILES_AUDIT_EVENTS.FILE_DOWNLOAD_URL_ISSUED, file);
    // Réponse strictement minimale : ni bucket, ni clé, ni checksum.
    return { url: signed.url, expiresAt: signed.expiresAt };
  }

  /** Existence objet tolérante : une erreur de stockage est traitée comme une absence (générique). */
  private async objectIsPresent(file: StoredFileView): Promise<boolean> {
    try {
      return await this.objectStorage.objectExists(file.bucket, file.storageKey);
    } catch {
      return false;
    }
  }

  private audit(
    eventType: AuditEventType,
    file: StoredFileView,
    reasonCode?: string,
  ): Promise<void> {
    // Jamais d'URL signée, de query de signature, de storageKey, de bucket ni de checksum.
    const metadata: Record<string, string | number | boolean | null> = {
      category: file.category,
      status: file.status,
    };
    if (reasonCode) {
      metadata.reasonCode = reasonCode;
    }
    if (eventType === FILES_AUDIT_EVENTS.FILE_DOWNLOAD_URL_ISSUED) {
      metadata.expiresInSeconds = this.signedReadUrlTtlSeconds;
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
