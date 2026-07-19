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

// Contrat OpenAPI de la baseline `base` : uniquement les sondes de santé.
// Les capabilities composées (Auth, ...) livrent leur propre variante de ce
// spec via leur overlay (remplacement déclaré).
const EXPECTED_OPERATION_IDS = ['health_get', 'health_live', 'health_ready'];

const FORBIDDEN_TOKENS = [
  'passwordHash',
  'tokenHash',
  'DATABASE_URL',
  'AuditLogCreate',
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

  it('exposes exactly the expected operationIds, unique and not controller-derived', () => {
    const ids = operations.map((o) => o.op.operationId as string);
    expect(ids.length).toBe(EXPECTED_OPERATION_IDS.length);
    expect(new Set(ids).size).toBe(ids.length);
    expect([...ids].sort()).toEqual([...EXPECTED_OPERATION_IDS].sort());
    for (const id of ids) {
      expect(id).not.toContain('Controller');
      expect(id).toMatch(/^health_[a-zA-Z]+$/);
    }
  });

  it('uses only the canonical tags', () => {
    const tags = new Set(operations.flatMap((o) => (o.op.tags as string[]) ?? []));
    expect([...tags].sort()).toEqual(['Health']);
  });

  it('declares no security requirement on the public health probes', () => {
    for (const { op } of operations) {
      expect(op.security).toBeUndefined();
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

  it('matches the committed canonical snapshot (freshness) and the check detects divergence', () => {
    const serialized = serializeOpenApiDocument(document);
    const snapshot = readFileSync(join(process.cwd(), 'openapi', 'openapi.json'), 'utf8');
    expect(serialized).toBe(snapshot);
    // Une divergence est bien détectée (mécanisme d'openapi:check).
    expect(serialized).not.toBe(snapshot.replace('"openapi"', '"openApi"'));
  });

  it('returns a runtime error envelope with requestId (aligned with the schema)', async () => {
    const res = await request(app.getHttpServer()).get('/unknown-route').expect(404);
    expect(res.body.success).toBe(false);
    expect(typeof res.body.requestId).toBe('string');
    expect(res.headers['x-request-id']).toBe(res.body.requestId);
  });
});
