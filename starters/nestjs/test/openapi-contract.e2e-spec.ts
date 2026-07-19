import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { OpenAPIObject } from '@nestjs/swagger';
import request from 'supertest';
import { App } from 'supertest/types';

import { AppModule } from '../src/app.module';
import { configureApp } from '../src/bootstrap/configure-app';
import { buildOpenApiDocument, serializeOpenApiDocument } from '../src/common/openapi/openapi-document';

/**
 * Invariants du contrat OpenAPI, valables pour **toute composition** (base seule ou
 * avec des capabilities). La surface exacte attendue (jeu d'`operationId` par
 * capability) n'est PAS figée ici : elle est déclarée par chaque overlay
 * (`contract.openapiOperations`) et vérifiée sur le document RÉELLEMENT généré par
 * l'application composée (Factory Golden Runtime) — aucun snapshot n'est recopié.
 */

// Jamais exposés, quelle que soit la composition : secrets et modèles de persistance.
const FORBIDDEN_TOKENS = [
  'passwordHash',
  'tokenHash',
  'DATABASE_URL',
  'JWT_ACCESS_SECRET',
  'REFRESH_TOKEN_HASH_SECRET',
  'S3_SECRET_ACCESS_KEY',
  'UserUnchecked',
  'RefreshSession',
  'UserRole',
  'RolePermission',
  'StoredFileCreate',
];

describe('OpenAPI contract (e2e)', () => {
  let app: INestApplication<App>;
  let document: OpenAPIObject;
  let operations: { method: string; path: string; op: Record<string, unknown> }[];

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleFixture.createNestApplication();
    configureApp(app);
    await app.init();
    document = buildOpenApiDocument(app);
    operations = [];
    for (const [path, methods] of Object.entries(document.paths)) {
      for (const [method, op] of Object.entries(methods as Record<string, Record<string, unknown>>)) {
        operations.push({ method, path, op });
      }
    }
  });

  afterAll(async () => {
    await app.close();
  });

  it('is OpenAPI 3.0.x with a package-derived version', () => {
    expect(document.openapi).toMatch(/^3\.0\.\d+$/);
    expect(typeof document.info.version).toBe('string');
    expect(document.info.version).not.toBe('');
  });

  it('always publishes the baseline health probes', () => {
    const ids = operations.map((o) => o.op.operationId as string);
    for (const id of ['health_get', 'health_live', 'health_ready']) expect(ids).toContain(id);
  });

  it('uses unique, explicit operationIds (never controller-derived)', () => {
    const ids = operations.map((o) => o.op.operationId as string);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) {
      expect(id).not.toContain('Controller');
      expect(id).toMatch(/^[a-z][a-zA-Z0-9]*_[a-zA-Z]+$/);
    }
  });

  it('leaves the public health probes unauthenticated', () => {
    for (const { op } of operations) {
      if ((op.operationId as string).startsWith('health_')) expect(op.security).toBeUndefined();
    }
  });

  it('schematizes the common error envelope (with requestId)', () => {
    const err = document.components?.schemas?.ApiErrorResponseDto as { properties?: Record<string, unknown> };
    expect(err.properties).toBeDefined();
    for (const field of ['success', 'statusCode', 'message', 'errorCode', 'path', 'timestamp', 'requestId']) {
      expect(err.properties).toHaveProperty(field);
    }
  });

  it('never exposes Prisma models, internal fields or secrets', () => {
    const raw = JSON.stringify(document);
    for (const token of FORBIDDEN_TOKENS) {
      expect(raw.includes(token)).toBe(false);
    }
    // L'enveloppe de succès référence toujours un DTO typé (jamais un objet vide non typé).
    expect(raw).not.toContain('"data":{"type":"object"}');
  });

  it('matches the committed canonical snapshot of this composition', () => {
    const serialized = serializeOpenApiDocument(document);
    const snapshot = readFileSync(join(process.cwd(), 'openapi', 'openapi.json'), 'utf8');
    expect(serialized).toBe(snapshot);
    // Une divergence est bien détectée (mécanisme d'openapi:check).
    expect(serialized).not.toBe(snapshot.replace('"openapi"', '"openApi"'));
  });

  it('returns a runtime error envelope with requestId (aligned with the schema)', async () => {
    const res = await request(app.getHttpServer()).get('/definitely-unknown-route').expect(404);
    expect(res.body.success).toBe(false);
    expect(typeof res.body.requestId).toBe('string');
    expect(res.headers['x-request-id']).toBe(res.body.requestId);
  });
});
