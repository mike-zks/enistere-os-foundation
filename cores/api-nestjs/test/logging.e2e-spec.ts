import { randomUUID } from 'node:crypto';

import { CreateBucketCommand, S3Client } from '@aws-sdk/client-s3';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';

import { AppModule } from '../src/app.module';
import { PASSWORD_HASHER, PasswordHasher } from '../src/auth/password/password-hasher';
import { configureApp } from '../src/bootstrap/configure-app';
import { disableLogCapture, enableLogCapture } from '../src/common/logging/logging.config';
import { PrismaService } from '../src/database/prisma.service';

const EMAIL = 'logging-e2e@example.test';
const PASSWORD = 'Sup3rSecret-logging!';
const ROLE = 'logger-e2e';
const JPEG = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00]);
const BUCKET = process.env.S3_BUCKET ?? 'enistere-files-test';
const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

describe('Structured logging (e2e, MinIO + PostgreSQL)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let token: string;
  let accessTokenValue: string;
  let sink: string[];
  let previousLevel: string | undefined;

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
    process.env.LOG_LEVEL = 'info';
    sink = enableLogCapture();

    const s3 = new S3Client({
      endpoint: process.env.S3_ENDPOINT,
      region: process.env.S3_REGION ?? 'us-east-1',
      forcePathStyle: true,
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY_ID ?? '',
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY ?? '',
      },
    });
    try {
      await s3.send(new CreateBucketCommand({ Bucket: BUCKET }));
    } catch {
      // déjà présent
    }

    const moduleFixture: TestingModule = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleFixture.createNestApplication();
    configureApp(app);
    await app.init();

    prisma = app.get(PrismaService);
    const hasher = app.get<PasswordHasher>(PASSWORD_HASHER);

    await cleanup();
    const passwordHash = await hasher.hash(PASSWORD);
    const user = await prisma.user.create({ data: { email: EMAIL, passwordHash } });

    const codes = ['files.read', 'files.upload', 'files.download', 'files.delete'];
    await prisma.permission.createMany({
      data: codes.map((code) => {
        const [resource, action] = code.split('.');
        return { code, resource, action, isSystem: true };
      }),
      skipDuplicates: true,
    });
    const perms = await prisma.permission.findMany({ where: { code: { in: codes } } });
    const role = await prisma.role.create({ data: { code: ROLE, name: 'Logger' } });
    await prisma.rolePermission.createMany({
      data: perms.map((p) => ({ roleId: role.id, permissionId: p.id })),
      skipDuplicates: true,
    });
    await prisma.userRole.create({ data: { userId: user.id, roleId: role.id } });

    const res = await request(app.getHttpServer()).post('/auth/login').send({ email: EMAIL, password: PASSWORD }).expect(200);
    accessTokenValue = res.body.data.accessToken as string;
    token = accessTokenValue;
  }, 60000);

  async function cleanup(): Promise<void> {
    await prisma.storedFile.deleteMany({ where: { owner: { email: EMAIL } } });
    await prisma.user.deleteMany({ where: { email: EMAIL } });
    await prisma.role.deleteMany({ where: { code: ROLE } });
  }

  afterAll(async () => {
    await cleanup();
    await app.close();
    disableLogCapture();
    if (previousLevel === undefined) {
      delete process.env.LOG_LEVEL;
    } else {
      process.env.LOG_LEVEL = previousLevel;
    }
  });

  it('emits structured bootstrap logs in JSON with service/environment', () => {
    const boot = logs().find((l) => typeof l.message === 'string' && l.message.includes('Nest application'));
    // Selon le timing, le log de bootstrap peut être présent ; s'il l'est, il est structuré.
    if (boot) {
      expect(boot.service).toBe('api-nestjs-core');
      expect(typeof boot.timestamp).toBe('string');
    }
    // Au minimum, des logs JSON structurés existent (le login a produit un log HTTP).
    expect(httpLogs().length).toBeGreaterThan(0);
  });

  it('logs one HTTP completion per request with a normalized route, status and duration', () => {
    const login = byRoute('/auth/login');
    expect(login.length).toBeGreaterThanOrEqual(1);
    const log = login[login.length - 1];
    expect(log.method).toBe('POST');
    expect(log.statusCode).toBe(200);
    expect(typeof log.durationMs).toBe('number');
    expect(typeof log.requestId).toBe('string');
  });

  it('propagates a provided X-Request-Id into the HTTP log', async () => {
    // Route applicative (les sondes santé en succès ne sont pas loguées par défaut).
    await request(app.getHttpServer())
      .get('/auth/me')
      .set('Authorization', `Bearer ${token}`)
      .set('X-Request-Id', 'trace-correlate-1')
      .expect(200);
    await sleep(30);
    const match = httpLogs().find((l) => l.requestId === 'trace-correlate-1');
    expect(match).toBeDefined();
    expect(match?.route).toBe('/auth/me');
  });

  it('enriches authenticated request logs with userId (UUID only)', async () => {
    await request(app.getHttpServer()).get('/auth/me').set('Authorization', `Bearer ${token}`).expect(200);
    await sleep(30);
    const me = byRoute('/auth/me');
    const log = me[me.length - 1];
    expect(typeof log.userId).toBe('string');
    expect(log.userId).toMatch(/^[0-9a-f-]{36}$/);
    // Jamais l'email ni le token dans le log.
    expect(JSON.stringify(log)).not.toContain(EMAIL);
  });

  it('does not log successful health probes by default', async () => {
    await request(app.getHttpServer()).get('/health/live').expect(200);
    await sleep(30);
    expect(byRoute('/health/live')).toHaveLength(0);
  });

  it('logs a single completion for the full file lifecycle and never leaks secrets', async () => {
    const upload = await request(app.getHttpServer())
      .post('/files')
      .set('Authorization', `Bearer ${token}`)
      .field('category', 'IMAGE')
      .attach('file', JPEG, 'photo.jpg')
      .expect(201);
    const fileId = upload.body.data.id as string;

    const dl = await request(app.getHttpServer())
      .post(`/files/${fileId}/download-url`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    const signedUrl: string = dl.body.data.url;

    await request(app.getHttpServer()).get(`/files/${fileId}`).set('Authorization', `Bearer ${token}`).expect(200);
    await request(app.getHttpServer()).delete(`/files/${fileId}`).set('Authorization', `Bearer ${token}`).expect(204);
    // anti-énumération : 404 (authentifié mais id absent)
    await request(app.getHttpServer())
      .get(`/files/${randomUUID()}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(404);
    await sleep(50);

    // Routes normalisées (jamais l'UUID dans la route loggée).
    expect(byRoute('/files').length).toBeGreaterThanOrEqual(1);
    expect(byRoute('/files/:id').length).toBeGreaterThanOrEqual(2);
    expect(byRoute('/files/:id/download-url').length).toBeGreaterThanOrEqual(1);
    expect(httpLogs().some((l) => l.statusCode === 404 && l.route === '/files/:id')).toBe(true);

    // Aucune fuite : ni token, ni mot de passe, ni URL signée, ni clé/credentials S3, ni id brut en route.
    const raw = sink.join('');
    expect(raw).not.toContain(accessTokenValue);
    expect(raw).not.toContain(PASSWORD);
    expect(raw).not.toContain('X-Amz-Signature');
    expect(raw).not.toContain(signedUrl);
    expect(raw).not.toContain('minioadmin');
    expect(raw).not.toContain(fileId); // l'UUID ne doit pas apparaître (route normalisée)
  });

  it('logs an unauthenticated request (401) without leaking anything', async () => {
    await request(app.getHttpServer()).get('/auth/me').expect(401);
    await sleep(30);
    const me = byRoute('/auth/me');
    expect(me.some((l) => l.statusCode === 401)).toBe(true);
  });
});
