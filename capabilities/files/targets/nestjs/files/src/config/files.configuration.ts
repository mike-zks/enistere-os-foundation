import { plainToInstance, Transform, Type } from 'class-transformer';
import { IsBoolean, IsIn, IsInt, IsNotEmpty, IsString, Max, Min, validateSync } from 'class-validator';

/** Configuration owned and validated by the Files capability. */
export interface FilesConfig {
  nodeEnv: string;
  fileMaxSizeBytes: number;
  fileOriginalNameMaxLength: number;
  s3Endpoint: string;
  s3Region: string;
  s3AccessKeyId: string;
  s3SecretAccessKey: string;
  s3Bucket: string;
  s3ForcePathStyle: boolean;
  filesSignedReadUrlTtlSeconds: number;
  filesPendingExpirationSeconds: number;
  filesRejectedRetentionSeconds: number;
  filesDeletedMetadataRetentionSeconds: number;
  filesOrphanMinAgeSeconds: number;
  filesReconciliationBatchSize: number;
  filesOwnerMaxActiveFiles: number;
  filesOwnerMaxTotalBytes: number;
}

class FilesEnvironmentVariables {
  @IsIn(['development', 'test', 'staging', 'production'])
  NODE_ENV = 'development';

  @Type(() => Number) @IsInt() @Min(1)
  FILE_MAX_SIZE_BYTES = 10485760;

  @Type(() => Number) @IsInt() @Min(1)
  FILE_ORIGINAL_NAME_MAX_LENGTH = 255;

  @IsString() @IsNotEmpty()
  S3_ENDPOINT!: string;

  @IsString() @IsNotEmpty()
  S3_REGION = 'us-east-1';

  @IsString() @IsNotEmpty()
  S3_ACCESS_KEY_ID!: string;

  @IsString() @IsNotEmpty()
  S3_SECRET_ACCESS_KEY!: string;

  @IsString() @IsNotEmpty()
  S3_BUCKET!: string;

  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  S3_FORCE_PATH_STYLE = true;

  @Type(() => Number) @IsInt() @Min(30) @Max(900)
  FILES_SIGNED_READ_URL_TTL_SECONDS = 300;

  @Type(() => Number) @IsInt() @Min(1)
  FILES_PENDING_EXPIRATION_SECONDS = 86400;

  @Type(() => Number) @IsInt() @Min(1)
  FILES_REJECTED_RETENTION_SECONDS = 604800;

  @Type(() => Number) @IsInt() @Min(1)
  FILES_DELETED_METADATA_RETENTION_SECONDS = 7776000;

  @Type(() => Number) @IsInt() @Min(1)
  FILES_ORPHAN_MIN_AGE_SECONDS = 86400;

  @Type(() => Number) @IsInt() @Min(1) @Max(1000)
  FILES_RECONCILIATION_BATCH_SIZE = 100;

  @Type(() => Number) @IsInt() @Min(0)
  FILES_OWNER_MAX_ACTIVE_FILES = 0;

  @Type(() => Number) @IsInt() @Min(0)
  FILES_OWNER_MAX_TOTAL_BYTES = 0;
}

/**
 * Plain ConfigFactory intentionally merges only Files-owned keys into Nest's
 * ConfigService. Base/Auth/RBAC remain unaware of this capability.
 */
export const filesConfiguration = (): FilesConfig => {
  const environment = plainToInstance(FilesEnvironmentVariables, process.env, {
    enableImplicitConversion: true,
    exposeDefaultValues: true,
  });
  const errors = validateSync(environment, {
    skipMissingProperties: false,
    whitelist: true,
    forbidNonWhitelisted: false,
  });
  if (errors.length > 0) {
    throw new Error(`Invalid files environment configuration: ${errors.toString()}`);
  }
  return {
    nodeEnv: environment.NODE_ENV,
    fileMaxSizeBytes: environment.FILE_MAX_SIZE_BYTES,
    fileOriginalNameMaxLength: environment.FILE_ORIGINAL_NAME_MAX_LENGTH,
    s3Endpoint: environment.S3_ENDPOINT,
    s3Region: environment.S3_REGION,
    s3AccessKeyId: environment.S3_ACCESS_KEY_ID,
    s3SecretAccessKey: environment.S3_SECRET_ACCESS_KEY,
    s3Bucket: environment.S3_BUCKET,
    s3ForcePathStyle: environment.S3_FORCE_PATH_STYLE,
    filesSignedReadUrlTtlSeconds: environment.FILES_SIGNED_READ_URL_TTL_SECONDS,
    filesPendingExpirationSeconds: environment.FILES_PENDING_EXPIRATION_SECONDS,
    filesRejectedRetentionSeconds: environment.FILES_REJECTED_RETENTION_SECONDS,
    filesDeletedMetadataRetentionSeconds: environment.FILES_DELETED_METADATA_RETENTION_SECONDS,
    filesOrphanMinAgeSeconds: environment.FILES_ORPHAN_MIN_AGE_SECONDS,
    filesReconciliationBatchSize: environment.FILES_RECONCILIATION_BATCH_SIZE,
    filesOwnerMaxActiveFiles: environment.FILES_OWNER_MAX_ACTIVE_FILES,
    filesOwnerMaxTotalBytes: environment.FILES_OWNER_MAX_TOTAL_BYTES,
  };
};
