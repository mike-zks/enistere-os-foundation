import { HttpException, UnauthorizedException } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { RefreshSession, SessionRevocationReason, UserStatus } from '@prisma/client';

import { AuditService } from '../audit/audit.service';
import { AuthUser, PublicUser } from '../users/models/user.model';
import { UsersService } from '../users/users.service';
import { authConfig } from './auth.config';
import { AuthService } from './auth.service';
import {
  RefreshRotationConflictError,
  RefreshSessionService,
} from './sessions/refresh-session.service';
import { AccessTokenService } from './tokens/access-token.service';
import { RefreshTokenService } from './tokens/refresh-token.service';

function errorCode(error: unknown): string | undefined {
  if (!(error instanceof HttpException)) {
    return undefined;
  }
  const body = error.getResponse();
  if (typeof body === 'object' && body !== null && 'code' in body) {
    const code = body.code;
    return typeof code === 'string' ? code : undefined;
  }
  return undefined;
}

function recordedEvents(mock: jest.Mock): string[] {
  return mock.mock.calls.map((call) => (call[0] as { eventType: string }).eventType);
}

const authUser: AuthUser = {
  id: 'user-1',
  email: 'user@example.com',
  status: UserStatus.ACTIVE,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-02T00:00:00.000Z'),
  deactivatedAt: null,
  passwordHash: 'argon2id-hash',
};

const publicUser: PublicUser = {
  id: 'user-1',
  email: 'user@example.com',
  status: UserStatus.ACTIVE,
  createdAt: authUser.createdAt,
  updatedAt: authUser.updatedAt,
  deactivatedAt: null,
};

function buildSession(overrides: Partial<RefreshSession> = {}): RefreshSession {
  return {
    id: '55555555-5555-5555-5555-555555555555',
    userId: 'user-1',
    tokenHash: 'stored-fingerprint',
    familyId: 'family-1',
    expiresAt: new Date(Date.now() + 60_000),
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

describe('AuthService', () => {
  let usersService: { findAuthUserByEmail: jest.Mock; findById: jest.Mock };
  let passwordHasher: { hash: jest.Mock; verify: jest.Mock; needsRehash: jest.Mock };
  let accessTokenService: { sign: jest.Mock };
  let refreshTokenService: { parse: jest.Mock; matches: jest.Mock };
  let refreshSessionService: {
    createForUser: jest.Mock;
    findById: jest.Mock;
    rotate: jest.Mock;
    revokeFamily: jest.Mock;
  };
  let auditService: { record: jest.Mock };
  let service: AuthService;

  beforeEach(() => {
    usersService = { findAuthUserByEmail: jest.fn(), findById: jest.fn() };
    passwordHasher = {
      hash: jest.fn().mockResolvedValue('dummy-hash'),
      verify: jest.fn(),
      needsRehash: jest.fn(),
    };
    accessTokenService = { sign: jest.fn().mockResolvedValue('access.jwt.token') };
    refreshTokenService = { parse: jest.fn(), matches: jest.fn() };
    refreshSessionService = {
      createForUser: jest.fn().mockResolvedValue({
        sessionId: 'sess-1',
        refreshToken: 'sess-1.opaque-secret',
        familyId: 'family-1',
        expiresAt: new Date('2026-02-01T00:00:00.000Z'),
        expiresInSeconds: 1209600,
      }),
      findById: jest.fn(),
      rotate: jest.fn(),
      revokeFamily: jest.fn().mockResolvedValue(1),
    };
    auditService = { record: jest.fn().mockResolvedValue(undefined) };
    const config = { jwtAccessTtl: 900 } as ConfigType<typeof authConfig>;

    service = new AuthService(
      usersService as unknown as UsersService,
      passwordHasher,
      accessTokenService as unknown as AccessTokenService,
      refreshTokenService as unknown as RefreshTokenService,
      refreshSessionService as unknown as RefreshSessionService,
      auditService as unknown as AuditService,
      config,
    );
  });

  describe('login', () => {
    it('returns tokens and audits success', async () => {
      usersService.findAuthUserByEmail.mockResolvedValue(authUser);
      passwordHasher.verify.mockResolvedValue(true);

      const result = await service.login('User@Example.com', 'good-password');

      expect(result.accessToken).toBe('access.jwt.token');
      expect(result.refreshToken).toBe('sess-1.opaque-secret');
      expect(result.user).not.toHaveProperty('passwordHash');
      const events = recordedEvents(auditService.record);
      expect(events).toContain('AUTH_LOGIN_SUCCEEDED');
    });

    it('audits a failed login and rethrows a generic error', async () => {
      usersService.findAuthUserByEmail.mockResolvedValue(null);

      const error = await service.login('missing@example.com', 'x').catch((e: unknown) => e);

      expect(errorCode(error)).toBe('AUTH_INVALID_CREDENTIALS');
      const events = recordedEvents(auditService.record);
      expect(events).toContain('AUTH_LOGIN_FAILED');
    });
  });

  describe('validateCredentials', () => {
    it('rejects an unknown email and performs a dummy verify (anti-enumeration)', async () => {
      usersService.findAuthUserByEmail.mockResolvedValue(null);

      await expect(
        service.validateCredentials('missing@example.com', 'x'),
      ).rejects.toBeInstanceOf(UnauthorizedException);
      expect(passwordHasher.hash).toHaveBeenCalled();
      expect(passwordHasher.verify).toHaveBeenCalled();
    });

    it('rejects a wrong password generically', async () => {
      usersService.findAuthUserByEmail.mockResolvedValue(authUser);
      passwordHasher.verify.mockResolvedValue(false);

      const error = await service
        .validateCredentials('user@example.com', 'wrong')
        .catch((e: unknown) => e);

      expect(errorCode(error)).toBe('AUTH_INVALID_CREDENTIALS');
    });

    it.each([UserStatus.INACTIVE, UserStatus.SUSPENDED])(
      'rejects a %s account even with a valid password, verifying it for uniform timing',
      async (status) => {
        usersService.findAuthUserByEmail.mockResolvedValue({ ...authUser, status });
        passwordHasher.verify.mockResolvedValue(true);

        const error = await service
          .validateCredentials('user@example.com', 'good-password')
          .catch((e: unknown) => e);

        expect(error).toBeInstanceOf(UnauthorizedException);
        expect(errorCode(error)).toBe('AUTH_INVALID_CREDENTIALS');
        expect(passwordHasher.verify).toHaveBeenCalled();
      },
    );

    it('normalizes the email and returns a public user (no passwordHash) when valid', async () => {
      usersService.findAuthUserByEmail.mockResolvedValue(authUser);
      passwordHasher.verify.mockResolvedValue(true);

      const result = await service.validateCredentials('User@Example.com', 'good-password');

      expect(usersService.findAuthUserByEmail).toHaveBeenCalledWith('user@example.com');
      expect(result).not.toHaveProperty('passwordHash');
    });
  });


  describe('getProfile', () => {
    it('returns the public user when active', async () => {
      usersService.findById.mockResolvedValue(publicUser);

      const result = await service.getProfile('user-1');

      expect(result).toEqual(publicUser);
      expect(result).not.toHaveProperty('passwordHash');
    });

    it('throws 401 when the user no longer exists', async () => {
      usersService.findById.mockResolvedValue(null);

      const error = await service.getProfile('user-1').catch((e: unknown) => e);

      expect(error).toBeInstanceOf(UnauthorizedException);
      expect(errorCode(error)).toBe('AUTH_UNAUTHORIZED');
    });

    it('throws 401 when the user is not active', async () => {
      usersService.findById.mockResolvedValue({ ...publicUser, status: UserStatus.SUSPENDED });

      await expect(service.getProfile('user-1')).rejects.toBeInstanceOf(UnauthorizedException);
    });
  });

  describe('refresh', () => {
    beforeEach(() => {
      refreshTokenService.parse.mockReturnValue({ sessionId: 'sess', secret: 'secret' });
      refreshTokenService.matches.mockReturnValue(true);
      usersService.findById.mockResolvedValue(publicUser);
      refreshSessionService.rotate.mockResolvedValue({
        sessionId: 'sess-2',
        refreshToken: 'sess-2.new-secret',
        familyId: 'family-1',
        expiresAt: new Date('2026-02-01T00:00:00.000Z'),
        expiresInSeconds: 1209600,
      });
    });

    it('rotates and returns a new token pair with a new sid', async () => {
      refreshSessionService.findById.mockResolvedValue(buildSession());

      const result = await service.refresh('sess.secret');

      expect(refreshSessionService.rotate).toHaveBeenCalled();
      expect(result.refreshToken).toBe('sess-2.new-secret');
      expect(accessTokenService.sign).toHaveBeenCalledWith({
        sub: 'user-1',
        sid: 'sess-2',
        typ: 'access',
      });
      const events = recordedEvents(auditService.record);
      expect(events).toContain('AUTH_REFRESH_SUCCEEDED');
    });

    it('rejects an invalid token format without touching the database', async () => {
      refreshTokenService.parse.mockReturnValue(null);

      const error = await service.refresh('garbage').catch((e: unknown) => e);

      expect(errorCode(error)).toBe('AUTH_REFRESH_TOKEN_INVALID');
      expect(refreshSessionService.findById).not.toHaveBeenCalled();
      expect(refreshSessionService.rotate).not.toHaveBeenCalled();
      const events = recordedEvents(auditService.record);
      expect(events).toContain('AUTH_REFRESH_FAILED');
    });

    it('rejects an unknown session without revoking any family', async () => {
      refreshSessionService.findById.mockResolvedValue(null);

      await expect(service.refresh('sess.secret')).rejects.toBeInstanceOf(UnauthorizedException);
      expect(refreshSessionService.revokeFamily).not.toHaveBeenCalled();
    });

    it('rejects a fingerprint mismatch without revoking any family', async () => {
      refreshSessionService.findById.mockResolvedValue(buildSession());
      refreshTokenService.matches.mockReturnValue(false);

      await expect(service.refresh('sess.secret')).rejects.toBeInstanceOf(UnauthorizedException);
      expect(refreshSessionService.revokeFamily).not.toHaveBeenCalled();
      expect(refreshSessionService.rotate).not.toHaveBeenCalled();
    });

    it('detects reuse of a rotated token and revokes the family', async () => {
      refreshSessionService.findById.mockResolvedValue(
        buildSession({ revokedAt: new Date(), revocationReason: SessionRevocationReason.ROTATED }),
      );

      const error = await service.refresh('sess.secret').catch((e: unknown) => e);

      expect(errorCode(error)).toBe('AUTH_REFRESH_TOKEN_INVALID');
      expect(refreshSessionService.revokeFamily).toHaveBeenCalledWith(
        'family-1',
        SessionRevocationReason.REUSE_DETECTED,
      );
      const events = recordedEvents(auditService.record);
      expect(events).toContain('AUTH_REFRESH_REUSE_DETECTED');
      expect(events).toContain('AUTH_SESSION_FAMILY_REVOKED');
      expect(refreshSessionService.rotate).not.toHaveBeenCalled();
    });

    it('rejects a session revoked by logout without re-revoking the family', async () => {
      refreshSessionService.findById.mockResolvedValue(
        buildSession({ revokedAt: new Date(), revocationReason: SessionRevocationReason.LOGOUT }),
      );

      await expect(service.refresh('sess.secret')).rejects.toBeInstanceOf(UnauthorizedException);
      expect(refreshSessionService.revokeFamily).not.toHaveBeenCalled();
    });

    it('rejects an expired session without revoking the family', async () => {
      refreshSessionService.findById.mockResolvedValue(
        buildSession({ expiresAt: new Date(Date.now() - 1000) }),
      );

      await expect(service.refresh('sess.secret')).rejects.toBeInstanceOf(UnauthorizedException);
      expect(refreshSessionService.revokeFamily).not.toHaveBeenCalled();
      expect(refreshSessionService.rotate).not.toHaveBeenCalled();
    });

    it('revokes the family when the user is unavailable', async () => {
      refreshSessionService.findById.mockResolvedValue(buildSession());
      usersService.findById.mockResolvedValue({ ...publicUser, status: UserStatus.SUSPENDED });

      await expect(service.refresh('sess.secret')).rejects.toBeInstanceOf(UnauthorizedException);
      expect(refreshSessionService.revokeFamily).toHaveBeenCalledWith(
        'family-1',
        SessionRevocationReason.USER_DISABLED,
      );
      expect(refreshSessionService.rotate).not.toHaveBeenCalled();
    });

    it('fails generically on a rotation conflict and returns no token', async () => {
      refreshSessionService.findById.mockResolvedValue(buildSession());
      refreshSessionService.rotate.mockRejectedValue(new RefreshRotationConflictError());

      const error = await service.refresh('sess.secret').catch((e: unknown) => e);

      expect(errorCode(error)).toBe('AUTH_REFRESH_TOKEN_INVALID');
      expect(accessTokenService.sign).not.toHaveBeenCalled();
    });
  });

  describe('logout', () => {
    it('revokes the family of a valid session', async () => {
      refreshTokenService.parse.mockReturnValue({ sessionId: 'sess', secret: 'secret' });
      refreshSessionService.findById.mockResolvedValue(buildSession());
      refreshTokenService.matches.mockReturnValue(true);

      await expect(service.logout('sess.secret')).resolves.toBeUndefined();
      expect(refreshSessionService.revokeFamily).toHaveBeenCalledWith(
        'family-1',
        SessionRevocationReason.LOGOUT,
      );
      const events = recordedEvents(auditService.record);
      expect(events).toContain('AUTH_LOGOUT');
    });

    it('is idempotent and silent for an invalid token format', async () => {
      refreshTokenService.parse.mockReturnValue(null);

      await expect(service.logout('garbage')).resolves.toBeUndefined();
      expect(refreshSessionService.revokeFamily).not.toHaveBeenCalled();
    });

    it('does not reveal anything for an unknown session', async () => {
      refreshTokenService.parse.mockReturnValue({ sessionId: 'sess', secret: 'secret' });
      refreshSessionService.findById.mockResolvedValue(null);

      await expect(service.logout('sess.secret')).resolves.toBeUndefined();
      expect(refreshSessionService.revokeFamily).not.toHaveBeenCalled();
    });

    it('does not revoke on a fingerprint mismatch', async () => {
      refreshTokenService.parse.mockReturnValue({ sessionId: 'sess', secret: 'secret' });
      refreshSessionService.findById.mockResolvedValue(buildSession());
      refreshTokenService.matches.mockReturnValue(false);

      await expect(service.logout('sess.secret')).resolves.toBeUndefined();
      expect(refreshSessionService.revokeFamily).not.toHaveBeenCalled();
    });
  });
});
