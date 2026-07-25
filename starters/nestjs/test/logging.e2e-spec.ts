import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';

import { AppModule } from '../src/app.module';
import { configureApp } from '../src/bootstrap/configure-app';
import { disableLogCapture, enableLogCapture } from '../src/common/logging/logging.config';

const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Logging structuré du Platform Baseline (ADR-040) : logs JSON, log HTTP de fin
 * de requête avec route normalisée, propagation du X-Request-Id, sondes santé en
 * succès non loguées par défaut. Les scénarios authentifiés/fichiers vivent avec
 * leurs capabilities respectives.
 */
describe('Structured logging (e2e, PostgreSQL)', () => {
  let app: INestApplication<App>;
  let sink: string[];
  let previousLevel: string | undefined;
  let previousHealthSuccess: string | undefined;

  function logs(): Record<string, unknown>[] {
    return sink
      .join('')
      .trim()
      .split('\n')
      .filter(Boolean)
      .map((line) => JSON.parse(line) as Record<string, unknown>);
  }
  function httpLogs(): Record<string, unknown>[] {
    return logs().filter((l) => l.message === 'http request completed');
  }
  function byRoute(route: string): Record<string, unknown>[] {
    return httpLogs().filter((l) => l.route === route);
  }

  beforeAll(async () => {
    // Capture en mémoire + niveau info : posés AVANT le boot (la fabrique du logger les lit à l'init).
    previousLevel = process.env.LOG_LEVEL;
    previousHealthSuccess = process.env.LOG_HEALTH_SUCCESS_ENABLED;
    // Les succès /health/* sont logués au niveau debug lorsqu'ils sont activés.
    process.env.LOG_LEVEL = 'debug';
    // Le spec s'appuie sur les routes santé : activer leur log de succès pour observer le format.
    process.env.LOG_HEALTH_SUCCESS_ENABLED = 'true';
    sink = enableLogCapture();

    const moduleFixture: TestingModule = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleFixture.createNestApplication();
    configureApp(app);
    await app.init();
  }, 60000);

  afterAll(async () => {
    await app.close();
    disableLogCapture();
    if (previousLevel === undefined) delete process.env.LOG_LEVEL;
    else process.env.LOG_LEVEL = previousLevel;
    if (previousHealthSuccess === undefined) delete process.env.LOG_HEALTH_SUCCESS_ENABLED;
    else process.env.LOG_HEALTH_SUCCESS_ENABLED = previousHealthSuccess;
  });

  it('logs one structured HTTP completion per request with route, status and duration', async () => {
    await request(app.getHttpServer()).get('/health/live').expect(200);
    await sleep(30);
    const live = byRoute('/health/live');
    expect(live.length).toBeGreaterThanOrEqual(1);
    const log = live[live.length - 1];
    expect(log.method).toBe('GET');
    expect(log.statusCode).toBe(200);
    expect(typeof log.durationMs).toBe('number');
    expect(typeof log.requestId).toBe('string');
    expect(log.service).toBe('api-nestjs-core');
  });

  it('propagates a provided X-Request-Id into the HTTP log', async () => {
    await request(app.getHttpServer())
      .get('/health/live')
      .set('X-Request-Id', 'trace-correlate-1')
      .expect(200);
    await sleep(30);
    const match = httpLogs().find((l) => l.requestId === 'trace-correlate-1');
    expect(match).toBeDefined();
    expect(match?.route).toBe('/health/live');
  });

  it('logs a 404 completion without leaking internals', async () => {
    await request(app.getHttpServer()).get('/definitely-unknown-route').expect(404);
    await sleep(30);
    expect(httpLogs().some((l) => l.statusCode === 404)).toBe(true);
    const raw = sink.join('');
    expect(raw).not.toContain('DATABASE_URL');
    expect(raw).not.toContain(process.env.DATABASE_URL ?? 'postgresql://');
  });

  it('emits only valid JSON lines', () => {
    // logs() lève si une ligne n'est pas du JSON valide.
    expect(logs().length).toBeGreaterThan(0);
  });
});
