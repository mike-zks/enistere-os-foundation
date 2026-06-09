import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';

import { AppModule } from '../src/app.module';
import { configureApp } from '../src/bootstrap/configure-app';

describe('API Core NestJS (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    // Les variables d'environnement de test sont positionnées dans test/setup-e2e.ts
    // (setupFiles), avant le chargement d'AppModule et la validation d'environnement.
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    // Réutilise la configuration applicative commune (centralisation bootstrap).
    configureApp(app);

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/health (GET)', async () => {
    await request(app.getHttpServer())
      .get('/health')
      .expect(200)
      .expect(({ body }) => {
        expect(body.success).toBe(true);
        expect(body.data).toEqual(
          expect.objectContaining({
            status: 'ok',
            service: 'api-nestjs-core',
          }),
        );
      });
  });

  it('/health/live (GET) — liveness without external dependencies', async () => {
    await request(app.getHttpServer())
      .get('/health/live')
      .expect(200)
      .expect(({ body }) => expect(body.data.status).toBe('live'));
  });

  it('/health/ready (GET) — readiness checks PostgreSQL', async () => {
    await request(app.getHttpServer())
      .get('/health/ready')
      .expect(200)
      .expect(({ body }) => {
        expect(body.data.status).toBe('ready');
        expect(body.data.checks.database).toBe('up');
      });
  });

  it('applies security headers and hides the stack', async () => {
    const res = await request(app.getHttpServer()).get('/health').expect(200);
    expect(res.headers['x-powered-by']).toBeUndefined();
    // Helmet en-tête représentatif.
    expect(res.headers['x-content-type-options']).toBe('nosniff');
  });

  it('echoes a generated X-Request-Id and regenerates one for an invalid incoming value', async () => {
    const generated = await request(app.getHttpServer()).get('/health').expect(200);
    expect(generated.headers['x-request-id']).toMatch(/^[0-9a-f-]{36}$/);

    // Valeur entrante invalide selon le format borné (espaces/caractères interdits) mais valide
    // comme en-tête HTTP : rejetée → UUID régénéré. (Le cas CR/LF est couvert par le spec unitaire
    // du middleware ; un client HTTP refuse d'émettre un en-tête contenant CR/LF.)
    const invalid = await request(app.getHttpServer())
      .get('/health')
      .set('X-Request-Id', 'bad id with spaces & !')
      .expect(200);
    expect(invalid.headers['x-request-id']).toMatch(/^[0-9a-f-]{36}$/);

    const accepted = await request(app.getHttpServer())
      .get('/health')
      .set('X-Request-Id', 'trace-abcdef12345')
      .expect(200);
    expect(accepted.headers['x-request-id']).toBe('trace-abcdef12345');
  });
});
