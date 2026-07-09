import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Header,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UploadedFile,
  UseFilters,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { memoryStorage } from 'multer';

import { ERROR_CODES } from '../common/errors/error-codes';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthThrottlerGuard } from '../auth/guards/auth-throttler.guard';
import {
  ApiErrorResponse,
  ApiNoBodyResponse,
  ApiSuccessNoDataResponse,
  ApiSuccessResponse,
} from '../common/openapi/decorators/api-response.decorators';
import { Permissions } from '../permissions/decorators/permissions.decorator';
import { FileAccessService } from './access/file-access.service';
import { PublicStoredFile } from './contracts/public-stored-file';
import { SignedDownloadResult } from './contracts/signed-download-result';
import { FileDeletionService } from './deletion/file-deletion.service';
import { FileListQueryDto } from './dto/file-list-query.dto';
import { FileListResponseDto } from './dto/file-list-response.dto';
import { PublicStoredFileDto } from './dto/public-stored-file.dto';
import { DEFAULT_QUARANTINE_REASON, QuarantineFileDto } from './dto/quarantine-file.dto';
import { SignedDownloadResponseDto } from './dto/signed-download-response.dto';
import { UploadFileDto } from './dto/upload-file.dto';
import { FileQuarantineService } from './quarantine/file-quarantine.service';
import { MulterExceptionFilter } from './upload/multer-exception.filter';
import { FileUploadService } from './upload/file-upload.service';
import { FilesService } from './files.service';

// Multer protège la mémoire AVANT traitement : un seul fichier, taille bornée (lue au boot).
const MULTER_OPTIONS = {
  storage: memoryStorage(),
  limits: {
    files: 1,
    fileSize: Number(process.env.FILE_MAX_SIZE_BYTES ?? 10485760),
    fields: 10,
    parts: 12,
    headerPairs: 50,
  },
};

@ApiTags('Files')
@Controller('files')
export class FilesController {
  constructor(
    private readonly filesService: FilesService,
    private readonly fileUploadService: FileUploadService,
    private readonly fileAccessService: FileAccessService,
    private readonly fileDeletionService: FileDeletionService,
    private readonly fileQuarantineService: FileQuarantineService,
  ) {}

  /**
   * Liste paginée des fichiers du propriétaire courant, triés par createdAt desc.
   * Les fichiers DELETED sont exclus. Aucun champ interne n'est exposé.
   * La pagination est offset-based avec un `limit` borné (max 50).
   */
  @Get()
  @Permissions('files.read')
  @ApiBearerAuth()
  @ApiOperation({
    operationId: 'files_list',
    summary: 'Liste paginée des fichiers possédés (permission files.read ; ownership ; sans DELETED ; triés createdAt desc).',
  })
  @ApiSuccessResponse(FileListResponseDto, {
    description: 'Page de fichiers possédés. nextOffset est null à la dernière page.',
  })
  @ApiErrorResponse(400, 'Paramètres de pagination invalides (limit 1–50, offset ≥ 0).')
  @ApiErrorResponse(401, 'Authentification requise.')
  @ApiErrorResponse(403, 'Permission files.read absente.')
  @ApiErrorResponse(500, 'Erreur interne.')
  listFiles(
    @Query() query: FileListQueryDto,
    @CurrentUser('userId') userId: string,
  ): Promise<FileListResponseDto> {
    return this.filesService.listOwnedFiles(userId, query.limit, query.offset);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Permissions('files.upload')
  @UseGuards(AuthThrottlerGuard)
  @SkipThrottle({ login: true, refresh: true })
  @UseFilters(MulterExceptionFilter)
  @UseInterceptors(FileInterceptor('file', MULTER_OPTIONS))
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    operationId: 'files_upload',
    summary: 'Upload multipart d’un fichier privé (permission files.upload, ownership = utilisateur courant).',
    description:
      'Compatible `fetch + FormData` (web et React Native `{ uri, name, type }`). Le client NE force PAS ' +
      '`Content-Type: multipart/form-data` (boundary auto). Taille max = FILE_MAX_SIZE_BYTES ; types réels ' +
      'inspectés par signatures. Le client ne fournit ni ownerId ni clé de stockage.',
  })
  @ApiBody({
    required: true,
    schema: {
      type: 'object',
      required: ['file', 'category'],
      properties: {
        file: { type: 'string', format: 'binary', description: 'Contenu binaire (requis).' },
        category: {
          type: 'string',
          enum: ['IMAGE', 'DOCUMENT', 'AVATAR', 'MEDIA', 'VIDEO', 'AUDIO', 'IDENTITY_DOCUMENT', 'ATTACHMENT', 'OTHER'],
          description: 'Catégorie générique (requise).',
        },
        subjectId: { type: 'string', maxLength: 255, description: 'Rattachement métier générique optionnel.' },
      },
    },
  })
  @ApiSuccessResponse(PublicStoredFileDto, { status: 201, description: 'Fichier stocké et validé.' })
  @ApiErrorResponse(400, 'Multipart invalide / contenu non détecté / extension incohérente.')
  @ApiErrorResponse(401, 'Authentification requise.')
  @ApiErrorResponse(403, 'Permission files.upload absente.')
  @ApiErrorResponse(409, 'Quota propriétaire dépassé (nombre/octets).')
  @ApiErrorResponse(413, 'Fichier trop volumineux.')
  @ApiErrorResponse(429, 'Trop de requêtes d’upload.')
  @ApiErrorResponse(500, 'Erreur interne.')
  @ApiErrorResponse(503, 'Stockage objet indisponible.')
  upload(
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body() dto: UploadFileDto,
    @CurrentUser('userId') userId: string,
  ): Promise<PublicStoredFile> {
    if (!file) {
      throw new BadRequestException({ code: ERROR_CODES.FILE_REQUIRED, message: 'File is required.' });
    }
    return this.fileUploadService.upload(userId, file.buffer, file.originalname, dto);
  }

  // --- Upload 3 : consultation sécurisée + URLs signées de lecture ---

  @Get(':id')
  @Permissions('files.read')
  @ApiBearerAuth()
  @ApiOperation({
    operationId: 'files_getMetadata',
    summary: 'Métadonnées publiques d’un fichier possédé (permission files.read + ownership).',
  })
  @ApiSuccessResponse(PublicStoredFileDto, { description: 'Métadonnées publiques du fichier possédé (statut inclus).' })
  @ApiErrorResponse(400, 'Identifiant invalide (UUID attendu).')
  @ApiErrorResponse(401, 'Authentification requise.')
  @ApiErrorResponse(403, 'Permission files.read absente.')
  @ApiErrorResponse(404, 'Fichier absent ou non possédé (anti-énumération).')
  @ApiErrorResponse(500, 'Erreur interne.')
  getMetadata(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('userId') userId: string,
  ): Promise<PublicStoredFile> {
    // Ownership vérifié côté service : 404 si absent, non possédé ou supprimé.
    return this.fileAccessService.getMetadata(id, userId);
  }

  /**
   * Génère une URL signée de LECTURE courte. C'est une COMMANDE auditée d'émission d'accès
   * temporaire sensible — d'où POST (et non un GET cacheable). La réponse n'est jamais mise en
   * cache (`no-store`) et l'URL signée n'est ni journalisée ni stockée. Le client ne fournit
   * aucune donnée : durée, clé, bucket et content-type sont déterminés par le serveur.
   */
  @Post(':id/download-url')
  @HttpCode(HttpStatus.OK)
  @Permissions('files.download')
  @UseGuards(AuthThrottlerGuard)
  @SkipThrottle({ login: true, refresh: true, upload: true })
  @Header('Cache-Control', 'no-store')
  @Header('Pragma', 'no-cache')
  @Header('Referrer-Policy', 'no-referrer')
  @ApiBearerAuth()
  @ApiOperation({
    operationId: 'files_createDownloadUrl',
    summary: 'Émet une URL signée de lecture courte (permission files.download + ownership ; non cacheable).',
  })
  @ApiSuccessResponse(SignedDownloadResponseDto, {
    description: 'URL signée temporaire (url + expiresAt). Réponse non mise en cache (no-store).',
  })
  @ApiErrorResponse(400, 'Identifiant invalide (UUID attendu).')
  @ApiErrorResponse(401, 'Authentification requise.')
  @ApiErrorResponse(403, 'Permission files.download absente.')
  @ApiErrorResponse(404, 'Fichier absent ou non possédé (anti-énumération).')
  @ApiErrorResponse(409, 'Fichier non téléchargeable (statut/visibilité).')
  @ApiErrorResponse(429, 'Trop de demandes d’URL de téléchargement.')
  @ApiErrorResponse(503, 'Génération d’URL indisponible (objet manquant / signature).')
  issueDownloadUrl(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('userId') userId: string,
  ): Promise<SignedDownloadResult> {
    return this.fileAccessService.issueDownloadUrl(id, userId);
  }

  /**
   * Suppression applicative complète (Upload 4) : objet S3 puis marquage `DELETED`. Possédé
   * uniquement (404 anti-énumération si non possédé) ; **idempotente** (re-suppression → 204).
   * Le client ne fournit ni bucket ni storageKey.
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Permissions('files.delete')
  @ApiBearerAuth()
  @ApiOperation({
    operationId: 'files_delete',
    summary: 'Supprime un fichier (objet S3 puis DELETED ; permission files.delete + ownership ; idempotent).',
  })
  @ApiNoBodyResponse('Fichier supprimé (objet S3 + marquage DELETED), idempotent.')
  @ApiErrorResponse(400, 'Identifiant invalide (UUID attendu).')
  @ApiErrorResponse(401, 'Authentification requise.')
  @ApiErrorResponse(403, 'Permission files.delete absente.')
  @ApiErrorResponse(404, 'Fichier absent ou non possédé (anti-énumération).')
  @ApiErrorResponse(500, 'Finalisation DB impossible après suppression.')
  @ApiErrorResponse(503, 'Stockage objet indisponible.')
  deleteFile(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('userId') userId: string,
  ): Promise<void> {
    return this.fileDeletionService.delete(id, userId);
  }

  // --- Upload 4 : quarantaine administrative (permission dédiée, SANS ownership) ---

  /**
   * Met un fichier en quarantaine (opération **administrative** : `files.quarantine`, sans
   * condition d'ownership — à la différence des endpoints utilisateur). Bloque tout accès/URL
   * signée tant que la quarantaine dure. Le client ne fournit qu'un `reasonCode` borné.
   */
  @Post(':id/quarantine')
  @HttpCode(HttpStatus.OK)
  @Permissions('files.quarantine')
  @ApiBearerAuth()
  @ApiOperation({
    operationId: 'files_quarantine',
    summary: 'Met un fichier en quarantaine (administratif : permission files.quarantine, sans ownership).',
  })
  @ApiSuccessNoDataResponse({ description: 'Fichier mis en quarantaine (aucun accès/URL tant que la quarantaine dure).' })
  @ApiErrorResponse(400, 'Identifiant invalide / raison hors valeurs.')
  @ApiErrorResponse(401, 'Authentification requise.')
  @ApiErrorResponse(403, 'Permission files.quarantine absente.')
  @ApiErrorResponse(404, 'Fichier introuvable.')
  @ApiErrorResponse(409, 'Transition de statut invalide.')
  @ApiErrorResponse(500, 'Erreur interne.')
  quarantine(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: QuarantineFileDto,
    @CurrentUser('userId') actorId: string,
  ): Promise<void> {
    return this.fileQuarantineService.quarantine(id, actorId, dto.reasonCode ?? DEFAULT_QUARANTINE_REASON);
  }

  /**
   * Lève la quarantaine (administrative : `files.restore`, sans ownership). Ne revient à
   * `VALIDATED` que si l'objet existe et que le checksum est connu. Aucune ré-analyse automatique.
   */
  @Post(':id/restore')
  @HttpCode(HttpStatus.OK)
  @Permissions('files.restore')
  @ApiBearerAuth()
  @ApiOperation({
    operationId: 'files_restore',
    summary: 'Lève la quarantaine (administratif : permission files.restore, sans ownership).',
  })
  @ApiSuccessNoDataResponse({ description: 'Quarantaine levée ; le propriétaire retrouve l’accès normal.' })
  @ApiErrorResponse(400, 'Identifiant invalide (UUID attendu).')
  @ApiErrorResponse(401, 'Authentification requise.')
  @ApiErrorResponse(403, 'Permission files.restore absente.')
  @ApiErrorResponse(404, 'Fichier introuvable.')
  @ApiErrorResponse(409, 'Transition de statut invalide (objet présent et empreinte d’intégrité requis).')
  @ApiErrorResponse(500, 'Erreur interne.')
  restore(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('userId') actorId: string,
  ): Promise<void> {
    return this.fileQuarantineService.restore(id, actorId);
  }
}
