import { S3Client } from '@aws-sdk/client-s3';
import { ConfigService } from '@nestjs/config';

import { FilesConfig } from '../files.configuration';

/** Jeton d'injection du client S3 partagé (un seul client, via la DI NestJS). */
export const S3_CLIENT = Symbol('S3_CLIENT');

/**
 * Construit le client S3-compatible (MinIO/AWS S3) depuis la configuration validée.
 * Le scheme de l'endpoint détermine TLS. `forcePathStyle` est requis pour MinIO.
 */
export function createS3Client(configService: ConfigService<FilesConfig, true>): S3Client {
  return new S3Client({
    endpoint: configService.get('s3Endpoint', { infer: true }),
    region: configService.get('s3Region', { infer: true }),
    forcePathStyle: configService.get('s3ForcePathStyle', { infer: true }),
    credentials: {
      accessKeyId: configService.get('s3AccessKeyId', { infer: true }),
      secretAccessKey: configService.get('s3SecretAccessKey', { infer: true }),
    },
    // Checksums flexibles uniquement quand l'opération l'exige : meilleure compatibilité
    // S3-compatible (MinIO) et évite le chargement dynamique du module CRC32 (incompatible
    // avec la VM de test). L'intégrité applicative est assurée par notre SHA-256.
    requestChecksumCalculation: 'WHEN_REQUIRED',
    responseChecksumValidation: 'WHEN_REQUIRED',
  });
}
