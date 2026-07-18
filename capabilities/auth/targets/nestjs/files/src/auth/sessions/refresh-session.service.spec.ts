import { ConfigType } from '@nestjs/config';
import { Prisma, RefreshSession, SessionRevocationReason } from '@prisma/client';

import { authConfig } from '../auth.config';
import { PrismaService } from '../../database/prisma.service';
import { RefreshTokenService } from '../tokens/refresh-token.service';
import { RefreshSessionRepository } from './refresh-session.repository';
import { RefreshRotationConflictError, RefreshSessionService } from './refresh-session.service';

function baseSession(overrides: Partial<RefreshSession> = {}): RefreshSession {
  return {
    id: 'new-sess-1',
    userId: 'user-1',
    tokenHash: 'fp(the-secret)',
    familyId: 'family-1',
    expiresAt: new Date('2026-02-01T00:00:00.000Z'),
    revokedAt: null,
    revocationReason: null,
    replacedBySessionId: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    lastUsedAt: null,
    userAgent: null,
    ipAddress: null,
    ...overrides,
  };
}

describe('RefreshSessionService', () => {
  let repository: {
    create: jest.Mock;
    findById: jest.Mock;
    findByIdWithUser: jest.Mock;
    revokeIfActive: jest.Mock;
    revokeFamily: jest.Mock;
  };
  let refreshTokenService: {
    generateSecret: jest.Mock;
    fingerprint: jest.Mock;
    buildToken: jest.Mock;
  };
  let service: RefreshSessionService;

  beforeEach(() => {
    repository = {
      create: jest.fn().mockResolvedValue(baseSession()),
      findById: jest.fn(),
      findByIdWithUser: jest.fn(),
      revokeIfActive: jest.fn().mockResolvedValue(1),
      revokeFamily: jest.fn().mockResolvedValue(1),
    };
    refreshTokenService = {
      generateSecret: jest.fn(() => 'the-secret'),
      fingerprint: jest.fn((secret: string) => `fp(${secret})`),
      buildToken: jest.fn((id: string, secret: string) => `${id}.${secret}`),
    };
    const prisma = {
      $transaction: jest.fn(
        (cb: (tx: Prisma.TransactionClient) => Promise<unknown>) =>
          cb({} as unknown as Prisma.TransactionClient),
      ),
    } as unknown as PrismaService;
    const config = { refreshTokenTtl: 1000 } as ConfigType<typeof authConfig>;

    service = new RefreshSessionService(
      repository as unknown as RefreshSessionRepository,
      refreshTokenService as unknown as RefreshTokenService,
      prisma,
      config,
    );
  });

  describe('createForUser', () => {
    it('stores only the fingerprint and returns the opaque token with a fresh family', async () => {
      const result = await service.createForUser('user-1');
      const createArg = repository.create.mock.calls[0][0];

      expect(createArg.tokenHash).toBe('fp(the-secret)');
      expect(createArg.tokenHash).not.toBe('the-secret');
      expect(createArg.familyId).toMatch(/^[0-9a-f-]{36}$/);
      expect(result.refreshToken).toBe('new-sess-1.the-secret');
      expect(result.expiresInSeconds).toBe(1000);
    });
  });

  describe('rotate', () => {
    const previous = baseSession({ id: 'old-sess', familyId: 'family-1', userId: 'user-1' });

    it('creates a new session keeping the familyId and revokes the previous one', async () => {
      const result = await service.rotate(previous);

      const createArg = repository.create.mock.calls[0][0];
      expect(createArg.familyId).toBe('family-1');
      expect(repository.revokeIfActive).toHaveBeenCalledWith(
        'old-sess',
        SessionRevocationReason.ROTATED,
        { replacedBySessionId: 'new-sess-1' },
        expect.anything(),
      );
      expect(result.refreshToken).toBe('new-sess-1.the-secret');
      expect(result.familyId).toBe('family-1');
    });

    it('throws a conflict error when the previous session is no longer active', async () => {
      repository.revokeIfActive.mockResolvedValue(0);

      await expect(service.rotate(previous)).rejects.toBeInstanceOf(RefreshRotationConflictError);
    });
  });

  describe('revokeFamily', () => {
    it('delegates to the repository', async () => {
      await service.revokeFamily('family-1', SessionRevocationReason.LOGOUT);

      expect(repository.revokeFamily).toHaveBeenCalledWith('family-1', SessionRevocationReason.LOGOUT);
    });
  });

  describe('validateAccessSession', () => {
    function withUser(overrides: Partial<RefreshSession> = {}, status = 'ACTIVE'): unknown {
      return { ...baseSession({ expiresAt: new Date(Date.now() + 60_000), ...overrides }), user: { status } };
    }

    it('accepts an active session belonging to the user', async () => {
      repository.findByIdWithUser.mockResolvedValue(withUser());

      await expect(service.validateAccessSession('new-sess-1', 'user-1')).resolves.toBe(true);
    });

    it('rejects a missing session', async () => {
      repository.findByIdWithUser.mockResolvedValue(null);

      await expect(service.validateAccessSession('x', 'user-1')).resolves.toBe(false);
    });

    it('rejects a session belonging to another user', async () => {
      repository.findByIdWithUser.mockResolvedValue(withUser({ userId: 'someone-else' }));

      await expect(service.validateAccessSession('new-sess-1', 'user-1')).resolves.toBe(false);
    });

    it('rejects a revoked session', async () => {
      repository.findByIdWithUser.mockResolvedValue(withUser({ revokedAt: new Date() }));

      await expect(service.validateAccessSession('new-sess-1', 'user-1')).resolves.toBe(false);
    });

    it('rejects an expired session', async () => {
      repository.findByIdWithUser.mockResolvedValue(withUser({ expiresAt: new Date(Date.now() - 1000) }));

      await expect(service.validateAccessSession('new-sess-1', 'user-1')).resolves.toBe(false);
    });

    it('rejects a session whose user is not active', async () => {
      repository.findByIdWithUser.mockResolvedValue(withUser({}, 'SUSPENDED'));

      await expect(service.validateAccessSession('new-sess-1', 'user-1')).resolves.toBe(false);
    });
  });
});
