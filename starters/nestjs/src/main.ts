import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { SwaggerModule } from '@nestjs/swagger';

import { AppModule } from './app.module';
import { configureApp } from './bootstrap/configure-app';
import { AppLogger } from './common/logging/logging.service';
import { buildOpenApiDocument } from './common/openapi/openapi-document';
import { AppConfig } from './config/configuration';

function parseCorsOrigins(value: string | undefined): string[] {
  if (!value) {
    return [];
  }

  const origins = value
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  // `*` + credentials est interdit (et inutile) : échec rapide plutôt que CORS permissif silencieux.
  if (origins.includes('*')) {
    throw new Error('CORS_ORIGINS must not contain "*" with credentials enabled. List explicit origins.');
  }

  return origins;
}

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
  });

  // Le logger structuré officiel remplace le logger NestJS (logs de bootstrap inclus, via bufferLogs).
  const logger = app.get(AppLogger);
  app.useLogger(logger);

  const configService = app.get(ConfigService<AppConfig, true>);
  const port = configService.get('port', { infer: true });
  const nodeEnv = configService.get('nodeEnv', { infer: true });
  const serviceName = configService.get('serviceName', { infer: true });
  const corsOrigins = parseCorsOrigins(configService.get('corsOrigins', { infer: true }));

  app.enableCors({
    // Liste blanche explicite par environnement ; `false` = aucune origine web autorisée (les
    // clients mobiles natifs n'envoient pas d'Origin et ne sont donc pas concernés par le CORS).
    origin: corsOrigins.length > 0 ? corsOrigins : false,
    credentials: true,
    // Méthodes/headers minimisés (le starter n'expose ni PUT ni en-têtes exotiques).
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Authorization', 'Content-Type', 'X-Request-Id'],
  });

  // Configuration applicative commune (pipes, filtre, interceptor) — voir bootstrap/configure-app.ts.
  configureApp(app);

  // Swagger n'est pas exposé en production par défaut (CORE_SPECIFICATION §13/§26/§44).
  // Le document est construit par le helper canonique partagé (cohérence avec openapi:generate/check).
  if (nodeEnv !== 'production') {
    SwaggerModule.setup('docs', app, buildOpenApiDocument(app));
  }

  await app.listen(port);

  // Log de démarrage : aucun secret (ni DATABASE_URL, ni endpoint/credentials, ni config complète).
  logger.info(
    { service: serviceName, environment: nodeEnv, port, swagger: nodeEnv !== 'production' },
    'API Core started',
  );
}

void bootstrap();
