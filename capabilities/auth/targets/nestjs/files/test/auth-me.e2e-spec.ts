import { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { UserStatus } from '@prisma/client';
import request from 'supertest';
import { App } from 'supertest/types';

import { PASSWORD_HASHER, PasswordHasher } from '../src/modules/auth/password/password-hasher';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/bootstrap/configure-app';
import { PrismaService } from '../src/database/prisma.service';

const EMAIL = 'auth-me-e2e@example.test';
const PASSWORD = 'Sup3rSecret-me!';

interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

describe('Auth /auth/me & protection (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let jwtService: JwtService;
  let userId: string;

  async function login(): Promise<TokenPair> {
    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: EMAIL, password: PASSWORD })
      .expect(200);
    return { accessToken: res.body.data.accessToken, refreshToken: res.body.data.refreshToken };
  }

  function me(token: string | null): request.Test {
    const req = request(app.getHttpServer()).get('/auth/me');
    return token ? req.set('Authorization', `Bearer ${token}`) : req;
  }

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    configureApp(app);
    await app.init();

    prisma = app.get(PrismaService);
    jwtService = app.get(JwtService);
    const hasher = app.get<PasswordHasher>(PASSWORD_HASHER);

    await prisma.user.deleteMany({ where: { email: EMAIL } });
    const passwordHash = await hasher.hash(PASSWORD);
    const user = await prisma.user.create({ data: { email: EMAIL, passwordHash } });
    userId = user.id;
  }, 30000);

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email: EMAIL } });
    await app.close();
  });

  it('keeps /health, /auth/login, /auth/refresh, /auth/logout public', async () => {
    await request(app.getHttpServer()).get('/health').expect(200);
    await request(app.getHttpServer()).post('/auth/login').send({ email: EMAIL, password: 'wrong' }).expect(401);
    await request(app.getHttpServer()).post('/auth/refresh').send({ refreshToken: 'x' }).expect(401);
    await request(app.getHttpServer())
      .post('/auth/logout')
      .send({ refreshToken: 'x'.repeat(20) })
      .expect(200);
  });

  it('rejects /auth/me without a token', async () => {
    await me(null)
      .expect(401)
      .expect(({ body }) => {
        expect(body.errorCode).toBe('AUTH_UNAUTHORIZED');
      });
  });

  it('rejects /auth/me with a malformed token', async () => {
    await me('not.a.valid.jwt').expect(401);
  });

  it('rejects /auth/me with an expired token', async () => {
    const expired = jwtService.sign(
      { sub: userId, sid: '99999999-9999-9999-9999-999999999999', typ: 'access' },
      { expiresIn: '-10s' },
    );
    await me(expired).expect(401);
  });

  it('returns the public profile for a valid token', async () => {
    const { accessToken } = await login();

    await me(accessToken)
      .expect(200)
      .expect(({ body }) => {
        expect(body.success).toBe(true);
        expect(body.data.email).toBe(EMAIL);
        expect(body.data.status).toBe('ACTIVE');
        const raw = JSON.stringify(body);
        expect(raw).not.toContain('passwordHash');
        expect(raw).not.toContain('tokenHash');
        expect(raw).not.toContain('refreshToken');
      });
  });

  it('refuses an access token after logout (session check via sid)', async () => {
    const { accessToken, refreshToken } = await login();
    await me(accessToken).expect(200);

    await request(app.getHttpServer()).post('/auth/logout').send({ refreshToken }).expect(200);

    await me(accessToken).expect(401);
  });

  it('refuses the old access token after a refresh and accepts the new one', async () => {
    const initial = await login();
    await me(initial.accessToken).expect(200);

    const refreshed = await request(app.getHttpServer())
      .post('/auth/refresh')
      .send({ refreshToken: initial.refreshToken })
      .expect(200);
    const newAccess: string = refreshed.body.data.accessToken;

    // Ancien access token lié à la session rotée → refusé.
    await me(initial.accessToken).expect(401);
    // Nouveau access token lié à la nouvelle session → accepté.
    await me(newAccess).expect(200);
  });

  it('refuses the new access token after reuse-driven family revocation', async () => {
    const initial = await login();
    const refreshed = await request(app.getHttpServer())
      .post('/auth/refresh')
      .send({ refreshToken: initial.refreshToken })
      .expect(200);
    const newAccess: string = refreshed.body.data.accessToken;

    // Réutilisation de l'ancien refresh token → révocation de la famille.
    await request(app.getHttpServer())
      .post('/auth/refresh')
      .send({ refreshToken: initial.refreshToken })
      .expect(401);

    // L'access token de la nouvelle session est désormais refusé.
    await me(newAccess).expect(401);
  });

  it('refuses an access token once the user is suspended', async () => {
    const { accessToken } = await login();
    await me(accessToken).expect(200);

    await prisma.user.update({ where: { id: userId }, data: { status: UserStatus.SUSPENDED } });
    try {
      await me(accessToken).expect(401);
    } finally {
      await prisma.user.update({ where: { id: userId }, data: { status: UserStatus.ACTIVE } });
    }
  });
});
