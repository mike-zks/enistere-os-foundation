import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';

import { AppConfig } from '../../config/configuration';

/**
 * Configuration centralisée et globale des throttlers nommés (TTL en millisecondes).
 *
 * - `login` / `refresh` : endpoints d'authentification ;
 * - `upload` : endpoint d'upload de fichiers ;
 * - `download` : génération d'URLs signées de téléchargement.
 *
 * Chaque route sélectionne le throttler pertinent via `@SkipThrottle`. Stockage en mémoire
 * (mono-instance) ; une stratégie Redis distribuée sera requise en multi-instances.
 */
@Global()
@Module({
  imports: [
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<AppConfig, true>) => [
        {
          name: 'login',
          ttl: config.get('authLoginRateTtl', { infer: true }) * 1000,
          limit: config.get('authLoginRateLimit', { infer: true }),
        },
        {
          name: 'refresh',
          ttl: config.get('authRefreshRateTtl', { infer: true }) * 1000,
          limit: config.get('authRefreshRateLimit', { infer: true }),
        },
        {
          name: 'upload',
          ttl: config.get('filesUploadRateTtl', { infer: true }) * 1000,
          limit: config.get('filesUploadRateLimit', { infer: true }),
        },
        {
          name: 'download',
          ttl: config.get('filesDownloadUrlRateTtl', { infer: true }) * 1000,
          limit: config.get('filesDownloadUrlRateLimit', { infer: true }),
        },
      ],
    }),
  ],
  exports: [ThrottlerModule],
})
export class ThrottlingModule {}
