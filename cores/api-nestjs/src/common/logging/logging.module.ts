import { Global, MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { APP_INTERCEPTOR } from '@nestjs/core';

import { AppConfig } from '../../config/configuration';
import { createPinoLogger } from './logging.config';
import { AppLogger } from './logging.service';
import { RequestContextMiddleware } from './request-context.middleware';
import { RequestUserContextInterceptor } from './request-user-context.interceptor';

/**
 * Module de logging structuré (ADR-040). Fournit l'`AppLogger` officiel (moteur Pino) globalement,
 * applique le middleware de contexte de requête (corrélation + log HTTP unique) et l'intercepteur
 * d'enrichissement utilisateur après authentification. La destination (stdout HTTP / stderr CLI)
 * est résolue au démarrage via `LOG_STDERR` ; la configuration provient de `ConfigService` (validée).
 */
@Global()
@Module({
  providers: [
    {
      provide: AppLogger,
      inject: [ConfigService],
      useFactory: (config: ConfigService<AppConfig, true>): AppLogger =>
        new AppLogger(
          createPinoLogger({
            level: config.get('logLevel', { infer: true }),
            serviceName: config.get('serviceName', { infer: true }),
            environment: config.get('nodeEnv', { infer: true }),
            pretty: config.get('logPretty', { infer: true }),
            toStderr: process.env.LOG_STDERR === '1',
          }),
        ),
    },
    RequestContextMiddleware,
    { provide: APP_INTERCEPTOR, useClass: RequestUserContextInterceptor },
  ],
  exports: [AppLogger],
})
export class LoggingModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RequestContextMiddleware).forRoutes('*');
  }
}
