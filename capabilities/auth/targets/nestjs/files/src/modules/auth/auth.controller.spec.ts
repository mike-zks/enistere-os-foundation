import { CanActivate, ExecutionContext, INestApplication } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { ThrottlerModule } from '@nestjs/throttler';
import request from 'supertest';
import { App } from 'supertest/types';

import { configureApp } from '../../bootstrap/configure-app';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

const profileFixture = {
  id: 'user-1',
  email: 'user@example.com',
  status: 'ACTIVE',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-02T00:00:00.000Z',
  deactivatedAt: null,
};

// Guard stub : simule JwtAuthGuard en injectant un principal sur la requête.
class StubAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<{ user?: unknown }>();
    req.user = { userId: 'user-1', sessionId: 'sess-1' };
    return true;
  }
}

const loginResult = {
  user: {
    id: 'user-1',
    email: 'user@example.com',
    status: 'ACTIVE',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-02T00:00:00.000Z',
    deactivatedAt: null,
  },
  accessToken: 'access.jwt.token',
  refreshToken: 'sess-1.opaque-secret',
  accessTokenExpiresIn: 900,
  refreshTokenExpiresIn: 1209600,
  tokenType: 'Bearer',
};

const refreshResult = {
  accessToken: 'access.jwt.token.2',
  refreshToken: 'sess-2.new-secret',
  accessTokenExpiresIn: 900,
  refreshTokenExpiresIn: 1209600,
  tokenType: 'Bearer',
};

const validLogin = { email: 'user@example.com', password: 'Sup3rSecret!' };
const validRefresh = { refreshToken: '55555555-5555-5555-5555-555555555555.secret' };

function buildAuthServiceMock() {
  return {
    login: jest.fn().mockResolvedValue(loginResult),
    refresh: jest.fn().mockResolvedValue(refreshResult),
    logout: jest.fn().mockResolvedValue(undefined),
    getProfile: jest.fn().mockResolvedValue(profileFixture),
  };
}

describe('AuthController', () => {
  let app: INestApplication<App>;
  let authService: ReturnType<typeof buildAuthServiceMock>;

  beforeAll(async () => {
    authService = buildAuthServiceMock();
    const moduleRef = await Test.createTestingModule({
      imports: [
        ThrottlerModule.forRoot([
          { name: 'login', ttl: 60000, limit: 1000 },
          { name: 'refresh', ttl: 60000, limit: 1000 },
        ]),
      ],
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: authService }],
    }).compile();

    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /auth/login returns the login result', async () => {
    await request(app.getHttpServer())
      .post('/auth/login')
      .send(validLogin)
      .expect(200)
      .expect(({ body }) => {
        expect(body.success).toBe(true);
        expect(body.data.accessToken).toBe('access.jwt.token');
        expect(JSON.stringify(body)).not.toContain('tokenHash');
      });
  });

  it('POST /auth/login rejects an invalid payload', async () => {
    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'user@example.com' })
      .expect(400)
      .expect(({ body }) => {
        expect(body.errorCode).toBe('VALIDATION_ERROR');
      });
  });

  it('POST /auth/refresh returns a new token pair', async () => {
    await request(app.getHttpServer())
      .post('/auth/refresh')
      .send(validRefresh)
      .expect(200)
      .expect(({ body }) => {
        expect(body.success).toBe(true);
        expect(body.data.refreshToken).toBe('sess-2.new-secret');
        expect(body.data.tokenType).toBe('Bearer');
        expect(body.data).not.toHaveProperty('user');
      });
  });

  it('POST /auth/refresh rejects a payload without refreshToken', async () => {
    await request(app.getHttpServer())
      .post('/auth/refresh')
      .send({})
      .expect(400)
      .expect(({ body }) => {
        expect(body.errorCode).toBe('VALIDATION_ERROR');
      });
  });

  it('POST /auth/refresh rejects an unknown field', async () => {
    await request(app.getHttpServer())
      .post('/auth/refresh')
      .send({ ...validRefresh, extra: 'x' })
      .expect(400);
  });

  it('POST /auth/logout returns an idempotent generic response', async () => {
    await request(app.getHttpServer())
      .post('/auth/logout')
      .send(validRefresh)
      .expect(200)
      .expect(({ body }) => {
        expect(body.success).toBe(true);
        expect(body.data).toEqual({ status: 'logged_out' });
      });

    // Répétable sans effet de bord visible.
    await request(app.getHttpServer()).post('/auth/logout').send(validRefresh).expect(200);
  });
});

describe('AuthController (rate limiting)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        ThrottlerModule.forRoot([
          { name: 'login', ttl: 60000, limit: 2 },
          { name: 'refresh', ttl: 60000, limit: 2 },
        ]),
      ],
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: buildAuthServiceMock() }],
    }).compile();

    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('throttles the login route independently (429 AUTH_RATE_LIMITED)', async () => {
    await request(app.getHttpServer()).post('/auth/login').send(validLogin).expect(200);
    await request(app.getHttpServer()).post('/auth/login').send(validLogin).expect(200);
    await request(app.getHttpServer())
      .post('/auth/login')
      .send(validLogin)
      .expect(429)
      .expect(({ body }) => {
        expect(body.errorCode).toBe('AUTH_RATE_LIMITED');
      });
  });

  it('throttles the refresh route independently', async () => {
    await request(app.getHttpServer()).post('/auth/refresh').send(validRefresh).expect(200);
    await request(app.getHttpServer()).post('/auth/refresh').send(validRefresh).expect(200);
    await request(app.getHttpServer()).post('/auth/refresh').send(validRefresh).expect(429);
  });
});

describe('AuthController (me)', () => {
  let app: INestApplication<App>;
  let authService: ReturnType<typeof buildAuthServiceMock>;

  beforeAll(async () => {
    authService = buildAuthServiceMock();
    const moduleRef = await Test.createTestingModule({
      imports: [
        ThrottlerModule.forRoot([
          { name: 'login', ttl: 60000, limit: 1000 },
          { name: 'refresh', ttl: 60000, limit: 1000 },
        ]),
      ],
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: authService },
        { provide: APP_GUARD, useClass: StubAuthGuard },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /auth/me returns the authenticated public profile', async () => {
    await request(app.getHttpServer())
      .get('/auth/me')
      .expect(200)
      .expect(({ body }) => {
        expect(body.success).toBe(true);
        expect(body.data.email).toBe('user@example.com');
        expect(body.data).not.toHaveProperty('passwordHash');
        expect(JSON.stringify(body)).not.toContain('tokenHash');
      });

    expect(authService.getProfile).toHaveBeenCalledWith('user-1');
  });

});
