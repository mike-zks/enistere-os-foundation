import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { UserStatus } from '@prisma/client';
import request from 'supertest';
import { App } from 'supertest/types';

import { AppModule } from '../src/app.module';
import { configureApp } from '../src/bootstrap/configure-app';
import { PASSWORD_HASHER, PasswordHasher } from '../src/modules/auth/password/password-hasher';
import { PrismaService } from '../src/database/prisma.service';

const ACTIVE_EMAIL = 'auth-login-active@example.test';
const INACTIVE_EMAIL = 'auth-login-inactive@example.test';
const PASSWORD = 'Sup3rSecret-e2e!';

describe('Auth login (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    configureApp(app);
    await app.init();

    prisma = app.get(PrismaService);
    const hasher = app.get<PasswordHasher>(PASSWORD_HASHER);

    await prisma.user.deleteMany({ where: { email: { in: [ACTIVE_EMAIL, INACTIVE_EMAIL] } } });

    const passwordHash = await hasher.hash(PASSWORD);
    await prisma.user.create({ data: { email: ACTIVE_EMAIL, passwordHash } });
    await prisma.user.create({
      data: { email: INACTIVE_EMAIL, passwordHash, status: UserStatus.INACTIVE },
    });
  }, 30000);

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email: { in: [ACTIVE_EMAIL, INACTIVE_EMAIL] } } });
    await app.close();
  });

  it('logs in a valid user and persists a session with the hash only', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: ACTIVE_EMAIL, password: PASSWORD })
      .expect(200);

    expect(response.body.success).toBe(true);
    const refreshToken: string = response.body.data.refreshToken;
    const accessToken: string = response.body.data.accessToken;

    expect(typeof accessToken).toBe('string');
    expect(response.body.data.tokenType).toBe('Bearer');
    expect(response.body.data.user.email).toBe(ACTIVE_EMAIL);
    expect(response.body.data.user).not.toHaveProperty('passwordHash');

    const raw = JSON.stringify(response.body);
    expect(raw).not.toContain('passwordHash');
    expect(raw).not.toContain('tokenHash');

    const [sessionId, secret] = refreshToken.split('.');
    const session = await prisma.refreshSession.findUnique({ where: { id: sessionId } });

    expect(session).not.toBeNull();
    expect(session?.tokenHash).toMatch(/^[0-9a-f]{64}$/);
    expect(session?.tokenHash).not.toBe(secret);
    expect(session?.tokenHash).not.toBe(refreshToken);
  });

  it('rejects a wrong password with a generic error', async () => {
    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: ACTIVE_EMAIL, password: 'definitely-wrong' })
      .expect(401)
      .expect(({ body }) => {
        expect(body.errorCode).toBe('AUTH_INVALID_CREDENTIALS');
      });
  });

  it('rejects an unknown email with the same generic error', async () => {
    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'does-not-exist@example.test', password: PASSWORD })
      .expect(401)
      .expect(({ body }) => {
        expect(body.errorCode).toBe('AUTH_INVALID_CREDENTIALS');
      });
  });

  it('rejects an inactive account without revealing the reason', async () => {
    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: INACTIVE_EMAIL, password: PASSWORD })
      .expect(401)
      .expect(({ body }) => {
        expect(body.errorCode).toBe('AUTH_INVALID_CREDENTIALS');
      });
  });

  it('rejects an unknown field', async () => {
    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: ACTIVE_EMAIL, password: PASSWORD, role: 'admin' })
      .expect(400)
      .expect(({ body }) => {
        expect(body.errorCode).toBe('VALIDATION_ERROR');
      });
  });

  it('rejects a payload missing the password', async () => {
    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: ACTIVE_EMAIL })
      .expect(400);
  });
});
