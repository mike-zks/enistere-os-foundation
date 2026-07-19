import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FileCategory } from '@prisma/client';

import { FILE_ERROR_CODES } from '../../common/errors/files-error-codes';
import { FilesConfig } from '../../config/files.configuration';
import { ALLOWED_MIME_BY_CATEGORY, EXTENSION_PATTERN, EXTENSIONS_BY_MIME } from '../files.constants';

// Retire les caractères de contrôle ASCII (C0 + DEL) sans regex de contrôle (lint-safe).
function stripControlChars(value: string): string {
  let result = '';
  for (const char of value) {
    const code = char.codePointAt(0) ?? 0;
    if (code > 0x1f && code !== 0x7f) {
      result += char;
    }
  }
  return result;
}

/**
 * Politique de validation déclarative des fichiers (ADR-007 §16).
 *
 * Upload 1 ne reçoit pas le binaire : on valide les métadonnées DÉCLARÉES (nom, MIME,
 * extension, taille, catégorie). Le MIME déclaré n'est pas une preuve ; l'inspection du
 * contenu relèvera d'Upload 2.
 */
@Injectable()
export class FileValidationPolicy {
  private readonly maxSizeBytes: number;
  private readonly originalNameMaxLength: number;

  constructor(configService: ConfigService<FilesConfig, true>) {
    this.maxSizeBytes = configService.get('fileMaxSizeBytes', { infer: true });
    this.originalNameMaxLength = configService.get('fileOriginalNameMaxLength', { infer: true });
  }

  /** Nettoie (caractères de contrôle), borne la longueur ; rejette un nom vide/trop long. */
  normalizeOriginalName(originalName: string): string {
    const cleaned = stripControlChars(originalName).trim();

    if (cleaned.length === 0 || cleaned.length > this.originalNameMaxLength) {
      throw new BadRequestException({
        code: FILE_ERROR_CODES.FILE_INVALID_NAME,
        message: 'Invalid file name.',
      });
    }

    return cleaned;
  }

  assertSizeWithinLimit(size: bigint): void {
    if (size <= 0n || size > BigInt(this.maxSizeBytes)) {
      throw new BadRequestException({
        code: FILE_ERROR_CODES.FILE_SIZE_EXCEEDED,
        message: 'File size not allowed.',
      });
    }
  }

  /** Vérifie MIME autorisé pour la catégorie + extension cohérente avec le MIME. */
  assertMimeAndExtension(category: FileCategory, mimeType: string, extension: string): void {
    const allowedMimes = ALLOWED_MIME_BY_CATEGORY[category];
    if (!allowedMimes.includes(mimeType)) {
      throw new BadRequestException({
        code: FILE_ERROR_CODES.FILE_INVALID_MIME_TYPE,
        message: 'File type not allowed.',
      });
    }

    if (!EXTENSION_PATTERN.test(extension)) {
      throw new BadRequestException({
        code: FILE_ERROR_CODES.FILE_INVALID_EXTENSION,
        message: 'Invalid file extension.',
      });
    }

    const expectedExtensions = EXTENSIONS_BY_MIME[mimeType] ?? [];
    if (!expectedExtensions.includes(extension)) {
      throw new BadRequestException({
        code: FILE_ERROR_CODES.FILE_INVALID_EXTENSION,
        message: 'File extension does not match its type.',
      });
    }
  }
}
