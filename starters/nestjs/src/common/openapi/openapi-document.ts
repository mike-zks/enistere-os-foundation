import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, OpenAPIObject, SwaggerModule } from '@nestjs/swagger';

/**
 * Construction CANONIQUE du document OpenAPI (source de vérité). Centralisée pour garantir un
 * contrat identique entre `main.ts` (Swagger UI dev), la commande `openapi:generate`/`openapi:check`
 * et les tests contractuels. Déterministe : aucun serveur en dur, aucune URL locale, aucun
 * timestamp dynamique ; `info.version` provient de la version du package.
 */
export const OPENAPI_TITLE = 'Enistere API Core NestJS';
export const OPENAPI_DESCRIPTION =
  'Contrat OpenAPI canonique du API Core NestJS V1 — source de vérité des API publiques (ADR-016).';

export function getPackageVersion(): string {
  const raw = readFileSync(join(process.cwd(), 'package.json'), 'utf8');
  const parsed = JSON.parse(raw) as { version?: string };
  return typeof parsed.version === 'string' ? parsed.version : '0.0.0';
}

export function buildOpenApiDocument(app: INestApplication): OpenAPIObject {
  const config = new DocumentBuilder()
    .setTitle(OPENAPI_TITLE)
    .setDescription(OPENAPI_DESCRIPTION)
    .setVersion(getPackageVersion())
    .addBearerAuth()
    .build();
  return SwaggerModule.createDocument(app, config);
}

/** Sérialisation stable du document (pour snapshot canonique et comparaison reproductible). */
export function serializeOpenApiDocument(document: OpenAPIObject): string {
  return `${JSON.stringify(document, null, 2)}\n`;
}
