import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';

import { AppModule } from '../src/app.module';
import { PASSWORD_HASHER, PasswordHasher } from '../src/modules/auth/password/password-hasher';
import { configureApp } from '../src/bootstrap/configure-app';
import { PrismaService } from '../src/database/prisma.service';

const EMAIL = 'auth-refresh-e2e@example.test';
const PASSWORD = 'Sup3rSecret-refresh!';

interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

describe('Auth refresh / rotation / logout (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

  async function login(): Promise<TokenPair> {
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: EMAIL, password: PASSWORD })
      .expect(200);
    const data = response.body.data;
    return { accessToken: data.accessToken, refreshToken: data.refreshToken };
  }

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    configureApp(app);
    await app.init();

    prisma = app.get(PrismaService);
    const hasher = app.get<PasswordHasher>(PASSWORD_HASHER);

    await prisma.user.deleteMany({ where: { email: EMAIL } });
    const passwordHash = await hasher.hash(PASSWORD);
    await prisma.user.create({ data: { email: EMAIL, passwordHash } });
  }, 30000);

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email: EMAIL } });
    await app.close();
  });

  it('rotates the refresh token, revokes the old session, and detects reuse', async () => {
    const first = await login();

    // 1) Refresh réussi → nouveau token (rotation).
    const refreshed = await request(app.getHttpServer())
      .post('/auth/refresh')
      .send({ refreshToken: first.refreshToken })
      .expect(200);
    const second: string = refreshed.body.data.refreshToken;
    expect(second).not.toBe(first.refreshToken);
    expect(JSON.stringify(refreshed.body)).not.toContain('tokenHash');

    // 2) L'ancienne session est révoquée (ROTATED), la nouvelle est active.
    const firstSessionId = first.refreshToken.split('.')[0];
    const oldSession = await prisma.refreshSession.findUnique({ where: { id: firstSessionId } });
    expect(oldSession?.revokedAt).not.toBeNull();
    expect(oldSession?.revocationReason).toBe('ROTATED');

    // 3) Réutilisation de l'ancien token → 401 + révocation de la famille.
    await request(app.getHttpServer())
      .post('/auth/refresh')
      .send({ refreshToken: first.refreshToken })
      .expect(401)
      .expect(({ body }) => {
        expect(body.errorCode).toBe('AUTH_REFRESH_TOKEN_INVALID');
      });

    // 4) Le token rotaté (second) est désormais refusé : la famille est compromise.
    await request(app.getHttpServer())
      .post('/auth/refresh')
      .send({ refreshToken: second })
      .expect(401);

    const familyId = oldSession?.familyId;
    const active = await prisma.refreshSession.count({
      where: { familyId, revokedAt: null },
    });
    expect(active).toBe(0);

    // Un audit de réutilisation a été produit.
    const reuse = await prisma.auditLog.count({ where: { eventType: 'AUTH_REFRESH_REUSE_DETECTED' } });
    expect(reuse).toBeGreaterThanOrEqual(1);
  });

  it('logs out idempotently and refuses subsequent refresh', async () => {
    const pair = await login();

    await request(app.getHttpServer())
      .post('/auth/logout')
      .send({ refreshToken: pair.refreshToken })
      .expect(200)
      .expect(({ body }) => {
        expect(body.data).toEqual({ status: 'logged_out' });
      });

    // Refresh après logout → refusé.
    await request(app.getHttpServer())
      .post('/auth/refresh')
      .send({ refreshToken: pair.refreshToken })
      .expect(401);

    // Logout répété → toujours 200, sans fuite.
    await request(app.getHttpServer())
      .post('/auth/logout')
      .send({ refreshToken: pair.refreshToken })
      .expect(200);

    // Token inconnu → réponse générique de succès (pas d'oracle).
    await request(app.getHttpServer())
      .post('/auth/logout')
      .send({ refreshToken: '00000000-0000-0000-0000-000000000000.unknown-secret-value-padding-1234567890' })
      .expect(200);
  });

  it('handles two concurrent refreshes: exactly one succeeds', async () => {
    const pair = await login();
    const sessionId = pair.refreshToken.split('.')[0];
    const session = await prisma.refreshSession.findUnique({ where: { id: sessionId } });
    const familyId = session?.familyId;

    const [a, b] = await Promise.all([
      request(app.getHttpServer()).post('/auth/refresh').send({ refreshToken: pair.refreshToken }),
      request(app.getHttpServer()).post('/auth/refresh').send({ refreshToken: pair.refreshToken }),
    ]);

    const statuses = [a.status, b.status].sort((x, y) => x - y);
    expect(statuses).toEqual([200, 401]);

    // Exactement un refresh gagne (200), l'autre échoue (401) — déterministe.
    // Pour le nombre de sessions actives restantes, DEUX issues sont sûres et
    // acceptables, selon l'entrelacement (au moment du 2e refresh l'état serveur
    // est identique à une réutilisation, donc indistinguable) :
    //   • le perdant lit l'ancien token ENCORE actif → CONFLIT de rotation →
    //     la session gagnante subsiste                                → 1 active ;
    //   • le perdant lit l'ancien token DÉJÀ tourné → la réutilisation
    //     quasi-simultanée déclenche la révocation fail-closed de la famille
    //     (réponse de sécurité conservatrice)                          → 0 active.
    // On exige donc « au plus une » (jamais deux), sans dépendre du timing. Cas
    // rare en pratique : les bons clients coalescent les refresh (cf. AuthEngine
    // mobile). La détection de réutilisation séquentielle reste stricte (cf. test
    // « rotates the refresh token … and detects reuse »).
    const active = await prisma.refreshSession.count({
      where: { familyId, revokedAt: null },
    });
    expect(active).toBeGreaterThanOrEqual(0);
    expect(active).toBeLessThanOrEqual(1);
  });

  it('never exposes passwordHash, tokenHash or secrets in responses', async () => {
    const pair = await login();
    const refreshed = await request(app.getHttpServer())
      .post('/auth/refresh')
      .send({ refreshToken: pair.refreshToken })
      .expect(200);

    const raw = JSON.stringify(refreshed.body);
    expect(raw).not.toContain('passwordHash');
    expect(raw).not.toContain('tokenHash');
    expect(raw).not.toContain('revocationReason');
  });
});
