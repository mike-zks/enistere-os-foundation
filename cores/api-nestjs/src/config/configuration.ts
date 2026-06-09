export interface AppConfig {
  nodeEnv: string;
  port: number;
  databaseUrl: string;
  jwtAccessSecret: string;
  jwtRefreshSecret: string;
  // Durées de vie exprimées en SECONDES (convention unique et documentée).
  jwtAccessTtl: number;
  refreshTokenTtl: number;
  // Secret dédié à l'empreinte HMAC des refresh tokens, distinct des secrets JWT.
  refreshTokenHashSecret: string;
  // Paramètres Argon2id (centralisés). memoryCost en KiB. Indicatifs, à valider par benchmark.
  argon2MemoryCost: number;
  argon2TimeCost: number;
  argon2Parallelism: number;
  // Rate limiting du login : nombre de requêtes autorisées par fenêtre (TTL en secondes).
  authLoginRateLimit: number;
  authLoginRateTtl: number;
  // Rate limiting du refresh (fenêtre indépendante du login).
  authRefreshRateLimit: number;
  authRefreshRateTtl: number;
  // Politique fichiers (ADR-007). Taille max en OCTETS.
  fileMaxSizeBytes: number;
  fileOriginalNameMaxLength: number;
  // Stockage objet S3-compatible (MinIO/S3). Credentials secrets, jamais committés.
  s3Endpoint: string;
  s3Region: string;
  s3AccessKeyId: string;
  s3SecretAccessKey: string;
  s3Bucket: string;
  s3ForcePathStyle: boolean;
  // Rate limiting de l'upload (fenêtre dédiée).
  filesUploadRateLimit: number;
  filesUploadRateTtl: number;
  // Durée de vie des URLs signées de LECTURE, en SECONDES (bornée : courte, contrôlée serveur).
  filesSignedReadUrlTtlSeconds: number;
  // Rate limiting de la génération d'URLs signées de téléchargement (fenêtre dédiée).
  filesDownloadUrlRateLimit: number;
  filesDownloadUrlRateTtl: number;
  // Cycle de vie / réconciliation (Upload 4). Durées en SECONDES ; tailles en éléments.
  filesPendingExpirationSeconds: number;
  filesRejectedRetentionSeconds: number;
  filesDeletedMetadataRetentionSeconds: number;
  filesOrphanMinAgeSeconds: number;
  filesReconciliationBatchSize: number;
  // Quotas par propriétaire (Upload 5). `0` = illimité. Octets comparés en BigInt.
  filesOwnerMaxActiveFiles: number;
  filesOwnerMaxTotalBytes: number;
  corsOrigins: string;
  // Sécurité HTTP transverse. Limites des body parsers (format Express, ex. '1mb').
  jsonBodyLimit: string;
  urlEncodedBodyLimit: string;
  // Nombre de proxys de confiance devant l'API (Traefik). 0 = ne fait confiance à aucun proxy.
  trustProxyHops: number;
  // Logging structuré (ADR-040). Nom de service, niveau, pretty (dev), logs HTTP et santé.
  serviceName: string;
  logLevel: string;
  logPretty: boolean;
  logHttpEnabled: boolean;
  logHealthSuccessEnabled: boolean;
}

export const configuration = (): AppConfig => ({
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT ?? 3000),
  databaseUrl: process.env.DATABASE_URL ?? '',
  jwtAccessSecret: process.env.JWT_ACCESS_SECRET ?? '',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET ?? '',
  jwtAccessTtl: Number(process.env.JWT_ACCESS_TTL ?? 900),
  refreshTokenTtl: Number(process.env.REFRESH_TOKEN_TTL ?? 1209600),
  refreshTokenHashSecret: process.env.REFRESH_TOKEN_HASH_SECRET ?? '',
  argon2MemoryCost: Number(process.env.ARGON2_MEMORY_COST ?? 19456),
  argon2TimeCost: Number(process.env.ARGON2_TIME_COST ?? 2),
  argon2Parallelism: Number(process.env.ARGON2_PARALLELISM ?? 1),
  authLoginRateLimit: Number(process.env.AUTH_LOGIN_RATE_LIMIT ?? 5),
  authLoginRateTtl: Number(process.env.AUTH_LOGIN_RATE_TTL ?? 60),
  authRefreshRateLimit: Number(process.env.AUTH_REFRESH_RATE_LIMIT ?? 30),
  authRefreshRateTtl: Number(process.env.AUTH_REFRESH_RATE_TTL ?? 60),
  fileMaxSizeBytes: Number(process.env.FILE_MAX_SIZE_BYTES ?? 10485760),
  fileOriginalNameMaxLength: Number(process.env.FILE_ORIGINAL_NAME_MAX_LENGTH ?? 255),
  s3Endpoint: process.env.S3_ENDPOINT ?? '',
  s3Region: process.env.S3_REGION ?? 'us-east-1',
  s3AccessKeyId: process.env.S3_ACCESS_KEY_ID ?? '',
  s3SecretAccessKey: process.env.S3_SECRET_ACCESS_KEY ?? '',
  s3Bucket: process.env.S3_BUCKET ?? '',
  s3ForcePathStyle: (process.env.S3_FORCE_PATH_STYLE ?? 'true') === 'true',
  filesUploadRateLimit: Number(process.env.FILES_UPLOAD_RATE_LIMIT ?? 20),
  filesUploadRateTtl: Number(process.env.FILES_UPLOAD_RATE_TTL ?? 60),
  filesSignedReadUrlTtlSeconds: Number(process.env.FILES_SIGNED_READ_URL_TTL_SECONDS ?? 300),
  filesDownloadUrlRateLimit: Number(process.env.FILES_DOWNLOAD_URL_RATE_LIMIT ?? 30),
  filesDownloadUrlRateTtl: Number(process.env.FILES_DOWNLOAD_URL_RATE_TTL ?? 60),
  filesPendingExpirationSeconds: Number(process.env.FILES_PENDING_EXPIRATION_SECONDS ?? 86400),
  filesRejectedRetentionSeconds: Number(process.env.FILES_REJECTED_RETENTION_SECONDS ?? 604800),
  filesDeletedMetadataRetentionSeconds: Number(
    process.env.FILES_DELETED_METADATA_RETENTION_SECONDS ?? 7776000,
  ),
  filesOrphanMinAgeSeconds: Number(process.env.FILES_ORPHAN_MIN_AGE_SECONDS ?? 86400),
  filesReconciliationBatchSize: Number(process.env.FILES_RECONCILIATION_BATCH_SIZE ?? 100),
  filesOwnerMaxActiveFiles: Number(process.env.FILES_OWNER_MAX_ACTIVE_FILES ?? 0),
  filesOwnerMaxTotalBytes: Number(process.env.FILES_OWNER_MAX_TOTAL_BYTES ?? 0),
  corsOrigins: process.env.CORS_ORIGINS ?? '',
  jsonBodyLimit: process.env.JSON_BODY_LIMIT ?? '1mb',
  urlEncodedBodyLimit: process.env.URL_ENCODED_BODY_LIMIT ?? '1mb',
  trustProxyHops: Number(process.env.TRUST_PROXY_HOPS ?? 0),
  serviceName: process.env.SERVICE_NAME ?? 'api-nestjs-core',
  logLevel: process.env.LOG_LEVEL ?? 'info',
  logPretty: (process.env.LOG_PRETTY ?? 'false') === 'true',
  logHttpEnabled: (process.env.LOG_HTTP_ENABLED ?? 'true') === 'true',
  logHealthSuccessEnabled: (process.env.LOG_HEALTH_SUCCESS_ENABLED ?? 'false') === 'true',
});
