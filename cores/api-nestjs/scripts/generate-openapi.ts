/* eslint-disable */
/**
 * Génère / vérifie le **snapshot OpenAPI canonique versionné** (ADR-016).
 *
 *   npm run openapi:generate   → (ré)écrit cores/api-nestjs/openapi/openapi.json
 *   npm run openapi:check      → échoue (RC=1) si le snapshot diverge du code (diff strict, sans outil externe)
 *
 * Déterministe : `info.version` = version du package, aucun serveur en dur, aucune URL locale, aucun
 * timestamp dynamique. Respecte ADR-040 : résultat machine sur stdout, logs techniques sur stderr.
 * Le document n'expose aucun secret ni modèle Prisma interne.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

import { NestFactory } from '@nestjs/core';

import { AppModule } from '../src/app.module';
import { AppLogger } from '../src/common/logging/logging.service';
import { buildOpenApiDocument, serializeOpenApiDocument } from '../src/common/openapi/openapi-document';

const SNAPSHOT_PATH = join(process.cwd(), 'openapi', 'openapi.json');

async function main(): Promise<void> {
  const check = process.argv.includes('--check');
  process.env.LOG_STDERR = '1';

  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.useLogger(app.get(AppLogger));
  await app.init();
  try {
    const document = buildOpenApiDocument(app);
    const serialized = serializeOpenApiDocument(document);

    if (check) {
      let current = '';
      try {
        current = readFileSync(SNAPSHOT_PATH, 'utf8');
      } catch {
        current = '';
      }
      if (current !== serialized) {
        console.error('OpenAPI snapshot is out of date or missing. Run: npm run openapi:generate');
        process.exitCode = 1;
        return;
      }
      console.log(JSON.stringify({ mode: 'check', status: 'up-to-date', path: SNAPSHOT_PATH }, null, 2));
    } else {
      mkdirSync(dirname(SNAPSHOT_PATH), { recursive: true });
      writeFileSync(SNAPSHOT_PATH, serialized);
      const paths = Object.keys(document.paths ?? {}).length;
      const schemas = Object.keys(document.components?.schemas ?? {}).length;
      console.log(
        JSON.stringify({ mode: 'generate', path: SNAPSHOT_PATH, openapi: document.openapi, paths, schemas }, null, 2),
      );
    }
    process.exitCode = process.exitCode ?? 0;
  } finally {
    await app.close();
  }
}

void main().catch((error) => {
  console.error('OpenAPI generation failed.', error?.message ?? error);
  process.exit(1);
});
