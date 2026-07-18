import { plainToInstance, Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsString,
  Max,
  Min,
  validateSync,
} from 'class-validator';

class EnvironmentVariables {
  @IsIn(['development', 'test', 'staging', 'production'])
  NODE_ENV = 'development';

  // Conversion explicite : les variables d'environnement arrivent en chaîne.
  // `@Type` rend la coercition indépendante de l'émission de métadonnées de décorateur.
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  PORT = 3000;

  @IsString()
  @IsNotEmpty()
  DATABASE_URL!: string;

  @IsString()
  @IsNotEmpty()
  JWT_ACCESS_SECRET!: string;

  @IsString()
  @IsNotEmpty()
  JWT_REFRESH_SECRET!: string;

  // Durées de vie en secondes.
  @Type(() => Number)
  @IsInt()
  @Min(1)
  JWT_ACCESS_TTL = 900;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  REFRESH_TOKEN_TTL = 1209600;

  @IsString()
  @IsNotEmpty()
  REFRESH_TOKEN_HASH_SECRET!: string;

  // Paramètres Argon2id (memoryCost en KiB). Valeurs indicatives, à valider par benchmark.
  @Type(() => Number)
  @IsInt()
  @Min(8)
  ARGON2_MEMORY_COST = 19456;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  ARGON2_TIME_COST = 2;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  ARGON2_PARALLELISM = 1;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  AUTH_LOGIN_RATE_LIMIT = 5;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  AUTH_LOGIN_RATE_TTL = 60;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  AUTH_REFRESH_RATE_LIMIT = 30;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  AUTH_REFRESH_RATE_TTL = 60;

  // Politique fichiers (ADR-007). Taille max en octets.
  @Type(() => Number)
  @IsInt()
  @Min(1)
  FILE_MAX_SIZE_BYTES = 10485760;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  FILE_ORIGINAL_NAME_MAX_LENGTH = 255;

  // Stockage objet S3-compatible (MinIO/S3). Credentials requis, jamais committés.
  @IsString()
  @IsNotEmpty()
  S3_ENDPOINT!: string;

  @IsString()
  @IsNotEmpty()
  S3_REGION = 'us-east-1';

  @IsString()
  @IsNotEmpty()
  S3_ACCESS_KEY_ID!: string;

  @IsString()
  @IsNotEmpty()
  S3_SECRET_ACCESS_KEY!: string;

  @IsString()
  @IsNotEmpty()
  S3_BUCKET!: string;

  // `forcePathStyle` requis pour MinIO. Transformé explicitement (chaîne -> booléen).
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  S3_FORCE_PATH_STYLE = true;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  FILES_UPLOAD_RATE_LIMIT = 20;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  FILES_UPLOAD_RATE_TTL = 60;

  // Durée de vie des URLs signées de lecture, en SECONDES. Bornée : courte par conception,
  // jamais plusieurs heures/jours en V1 ; valeur contrôlée serveur (jamais par le client).
  @Type(() => Number)
  @IsInt()
  @Min(30)
  @Max(900)
  FILES_SIGNED_READ_URL_TTL_SECONDS = 300;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  FILES_DOWNLOAD_URL_RATE_LIMIT = 30;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  FILES_DOWNLOAD_URL_RATE_TTL = 60;

  // Cycle de vie / réconciliation (Upload 4). Durées en secondes ; batch en nombre d'éléments.
  @Type(() => Number)
  @IsInt()
  @Min(1)
  FILES_PENDING_EXPIRATION_SECONDS = 86400;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  FILES_REJECTED_RETENTION_SECONDS = 604800;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  FILES_DELETED_METADATA_RETENTION_SECONDS = 7776000;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  FILES_ORPHAN_MIN_AGE_SECONDS = 86400;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(1000)
  FILES_RECONCILIATION_BATCH_SIZE = 100;

  // Quotas par propriétaire (Upload 5). `0` = illimité (documenté). Octets comparés en BigInt.
  @Type(() => Number)
  @IsInt()
  @Min(0)
  FILES_OWNER_MAX_ACTIVE_FILES = 0;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  FILES_OWNER_MAX_TOTAL_BYTES = 0;

  @IsString()
  CORS_ORIGINS = '';

  // Sécurité HTTP transverse. Limites des body parsers (format Express : '512kb', '1mb'…).
  @IsString()
  @IsNotEmpty()
  JSON_BODY_LIMIT = '1mb';

  @IsString()
  @IsNotEmpty()
  URL_ENCODED_BODY_LIMIT = '1mb';

  // Proxys de confiance devant l'API (Traefik). 0 = aucun (X-Forwarded-For ignoré).
  @Type(() => Number)
  @IsInt()
  @Min(0)
  TRUST_PROXY_HOPS = 0;

  // Logging structuré (ADR-040).
  @IsString()
  @IsNotEmpty()
  SERVICE_NAME = 'api-nestjs-core';

  @IsIn(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'])
  LOG_LEVEL = 'info';

  // Pretty-print : développement uniquement (forcé à false en production par la config du logger).
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  LOG_PRETTY = false;

  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  LOG_HTTP_ENABLED = true;

  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  LOG_HEALTH_SUCCESS_ENABLED = false;
}

export function validateEnv(config: Record<string, unknown>): EnvironmentVariables {
  const environment = {
    NODE_ENV: config.NODE_ENV ?? 'development',
    PORT: config.PORT ?? 3000,
    DATABASE_URL: config.DATABASE_URL,
    JWT_ACCESS_SECRET: config.JWT_ACCESS_SECRET,
    JWT_REFRESH_SECRET: config.JWT_REFRESH_SECRET,
    JWT_ACCESS_TTL: config.JWT_ACCESS_TTL ?? 900,
    REFRESH_TOKEN_TTL: config.REFRESH_TOKEN_TTL ?? 1209600,
    REFRESH_TOKEN_HASH_SECRET: config.REFRESH_TOKEN_HASH_SECRET,
    ARGON2_MEMORY_COST: config.ARGON2_MEMORY_COST ?? 19456,
    ARGON2_TIME_COST: config.ARGON2_TIME_COST ?? 2,
    ARGON2_PARALLELISM: config.ARGON2_PARALLELISM ?? 1,
    AUTH_LOGIN_RATE_LIMIT: config.AUTH_LOGIN_RATE_LIMIT ?? 5,
    AUTH_LOGIN_RATE_TTL: config.AUTH_LOGIN_RATE_TTL ?? 60,
    AUTH_REFRESH_RATE_LIMIT: config.AUTH_REFRESH_RATE_LIMIT ?? 30,
    AUTH_REFRESH_RATE_TTL: config.AUTH_REFRESH_RATE_TTL ?? 60,
    FILE_MAX_SIZE_BYTES: config.FILE_MAX_SIZE_BYTES ?? 10485760,
    FILE_ORIGINAL_NAME_MAX_LENGTH: config.FILE_ORIGINAL_NAME_MAX_LENGTH ?? 255,
    S3_ENDPOINT: config.S3_ENDPOINT,
    S3_REGION: config.S3_REGION ?? 'us-east-1',
    S3_ACCESS_KEY_ID: config.S3_ACCESS_KEY_ID,
    S3_SECRET_ACCESS_KEY: config.S3_SECRET_ACCESS_KEY,
    S3_BUCKET: config.S3_BUCKET,
    S3_FORCE_PATH_STYLE: config.S3_FORCE_PATH_STYLE ?? 'true',
    FILES_UPLOAD_RATE_LIMIT: config.FILES_UPLOAD_RATE_LIMIT ?? 20,
    FILES_UPLOAD_RATE_TTL: config.FILES_UPLOAD_RATE_TTL ?? 60,
    FILES_SIGNED_READ_URL_TTL_SECONDS: config.FILES_SIGNED_READ_URL_TTL_SECONDS ?? 300,
    FILES_DOWNLOAD_URL_RATE_LIMIT: config.FILES_DOWNLOAD_URL_RATE_LIMIT ?? 30,
    FILES_DOWNLOAD_URL_RATE_TTL: config.FILES_DOWNLOAD_URL_RATE_TTL ?? 60,
    FILES_PENDING_EXPIRATION_SECONDS: config.FILES_PENDING_EXPIRATION_SECONDS ?? 86400,
    FILES_REJECTED_RETENTION_SECONDS: config.FILES_REJECTED_RETENTION_SECONDS ?? 604800,
    FILES_DELETED_METADATA_RETENTION_SECONDS: config.FILES_DELETED_METADATA_RETENTION_SECONDS ?? 7776000,
    FILES_ORPHAN_MIN_AGE_SECONDS: config.FILES_ORPHAN_MIN_AGE_SECONDS ?? 86400,
    FILES_RECONCILIATION_BATCH_SIZE: config.FILES_RECONCILIATION_BATCH_SIZE ?? 100,
    FILES_OWNER_MAX_ACTIVE_FILES: config.FILES_OWNER_MAX_ACTIVE_FILES ?? 0,
    FILES_OWNER_MAX_TOTAL_BYTES: config.FILES_OWNER_MAX_TOTAL_BYTES ?? 0,
    CORS_ORIGINS: config.CORS_ORIGINS ?? '',
    JSON_BODY_LIMIT: config.JSON_BODY_LIMIT ?? '1mb',
    URL_ENCODED_BODY_LIMIT: config.URL_ENCODED_BODY_LIMIT ?? '1mb',
    TRUST_PROXY_HOPS: config.TRUST_PROXY_HOPS ?? 0,
    SERVICE_NAME: config.SERVICE_NAME ?? 'api-nestjs-core',
    LOG_LEVEL: config.LOG_LEVEL ?? 'info',
    LOG_PRETTY: config.LOG_PRETTY ?? false,
    LOG_HTTP_ENABLED: config.LOG_HTTP_ENABLED ?? true,
    LOG_HEALTH_SUCCESS_ENABLED: config.LOG_HEALTH_SUCCESS_ENABLED ?? false,
  };

  const validatedConfig = plainToInstance(EnvironmentVariables, environment, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
    whitelist: true,
    forbidNonWhitelisted: true,
  });

  if (errors.length > 0) {
    throw new Error(`Invalid environment configuration: ${errors.toString()}`);
  }

  return validatedConfig;
}
