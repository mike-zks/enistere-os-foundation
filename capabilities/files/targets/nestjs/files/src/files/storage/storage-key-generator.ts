import { randomUUID } from 'node:crypto';

import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FileCategory } from '@prisma/client';

import { ERROR_CODES } from '../../common/errors/error-codes';
import { AppConfig } from '../../config/configuration';
import { EXTENSION_PATTERN } from '../files.constants';

/**
 * Génère une clé de stockage sûre côté serveur, indépendante du fournisseur.
 *
 * Format : `<environment>/<category>/<yyyy>/<mm>/<uuid>.<extension>`.
 * N'utilise JAMAIS `originalName`. Interdit `..`, slashs injectés et caractères dangereux
 * via la normalisation stricte de l'extension.
 */
@Injectable()
export class StorageKeyGenerator {
  private readonly environment: string;

  constructor(configService: ConfigService<AppConfig, true>) {
    this.environment = configService.get('nodeEnv', { infer: true });
  }

  generate(category: FileCategory, extension: string): string {
    const ext = this.normalizeExtension(extension);
    const now = new Date();
    const year = now.getUTCFullYear();
    const month = String(now.getUTCMonth() + 1).padStart(2, '0');

    return `${this.environment}/${category.toLowerCase()}/${year}/${month}/${randomUUID()}.${ext}`;
  }

  private normalizeExtension(extension: string): string {
    const cleaned = extension.trim().toLowerCase().replace(/^\.+/, '');

    if (!EXTENSION_PATTERN.test(cleaned)) {
      throw new BadRequestException({
        code: ERROR_CODES.FILE_INVALID_EXTENSION,
        message: 'Invalid file extension.',
      });
    }

    return cleaned;
  }
}
