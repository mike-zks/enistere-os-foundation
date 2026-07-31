import { registerAs } from '@nestjs/config';
import { plainToInstance, Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsString, Min, validateSync } from 'class-validator';

/**
 * Configuration namespace de la capability Auth.
 *
 * La baseline `base` ne connaît aucune variable Auth : ce module valide et
 * expose lui-même son environnement (déclaré dans `.env.example` par l'overlay)
 * via `registerAs`. La validation s'exécute au chargement du namespace : un
 * environnement invalide fait échouer le démarrage, comme pour la baseline.
 */
export interface AuthConfig {
  jwtAccessSecret: string;
  // Durées de vie exprimées en SECONDES (convention unique et documentée).
  jwtAccessTtl: number;
  refreshTokenTtl: number;
  // Secret dédié à l'empreinte HMAC des refresh tokens, distinct du secret JWT.
  refreshTokenHashSecret: string;
  // Paramètres Argon2id (centralisés). memoryCost en KiB. Indicatifs, à valider par benchmark.
  argon2MemoryCost: number;
  argon2TimeCost: number;
  argon2Parallelism: number;
}

class AuthEnvironmentVariables {
  @IsString()
  @IsNotEmpty()
  JWT_ACCESS_SECRET!: string;

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
}

export const authConfig = registerAs('auth', (): AuthConfig => {
  const environment = plainToInstance(
    AuthEnvironmentVariables,
    {
      JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET,
      JWT_ACCESS_TTL: process.env.JWT_ACCESS_TTL ?? 900,
      REFRESH_TOKEN_TTL: process.env.REFRESH_TOKEN_TTL ?? 1209600,
      REFRESH_TOKEN_HASH_SECRET: process.env.REFRESH_TOKEN_HASH_SECRET,
      ARGON2_MEMORY_COST: process.env.ARGON2_MEMORY_COST ?? 19456,
      ARGON2_TIME_COST: process.env.ARGON2_TIME_COST ?? 2,
      ARGON2_PARALLELISM: process.env.ARGON2_PARALLELISM ?? 1,
    },
    { enableImplicitConversion: true },
  );

  const errors = validateSync(environment, {
    skipMissingProperties: false,
    whitelist: true,
    forbidNonWhitelisted: true,
  });

  if (errors.length > 0) {
    throw new Error(`Invalid auth environment configuration: ${errors.toString()}`);
  }

  return {
    jwtAccessSecret: environment.JWT_ACCESS_SECRET,
    jwtAccessTtl: environment.JWT_ACCESS_TTL,
    refreshTokenTtl: environment.REFRESH_TOKEN_TTL,
    refreshTokenHashSecret: environment.REFRESH_TOKEN_HASH_SECRET,
    argon2MemoryCost: environment.ARGON2_MEMORY_COST,
    argon2TimeCost: environment.ARGON2_TIME_COST,
    argon2Parallelism: environment.ARGON2_PARALLELISM,
  };
});
