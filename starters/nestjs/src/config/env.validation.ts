import { plainToInstance, Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsString,
  Min,
  validateSync,
} from 'class-validator';

/**
 * Variables d'environnement de la baseline `base` : runtime HTTP, base de
 * données, CORS et logging. Les capabilities composées (Auth, ...) valident
 * leurs propres variables dans leur configuration namespace (`registerAs`),
 * chargée par leur module — jamais ici.
 */
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
