import { randomUUID } from 'node:crypto';

import {
  Inject,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { SessionRevocationReason, UserStatus } from '@prisma/client';

import { AuditService } from '../../audit/audit.service';
import { AuthUser, PublicUser } from '../users/models/user.model';
import { UsersService } from '../users/users.service';
import { AUTH_AUDIT_EVENTS, AuthAuditEvent } from './auth-audit-events';
import { AUTH_ERROR_CODES } from './auth-error-codes';
import { LoginResult } from './contracts/login-result';
import { RefreshResult } from './contracts/refresh-result';
import { authConfig } from './auth.config';
import { PASSWORD_HASHER, PasswordHasher } from './password/password-hasher';
import { RefreshSessionMetadata, RefreshSessionService } from './sessions/refresh-session.service';
import { AccessTokenService } from './tokens/access-token.service';
import { RefreshTokenService } from './tokens/refresh-token.service';

type AuditDetails = {
  actorId?: string | null;
  subjectId?: string | null;
  data?: Record<string, string | number | boolean | null>;
};

/**
 * Service d'authentification — login (Auth 2), refresh/rotation/logout (Auth 3).
 *
 * Les réponses d'erreur restent génériques ; le diagnostic précis vit dans les
 * audit logs. Aucun token, hash ou secret n'est journalisé.
 */
@Injectable()
export class AuthService {
  private readonly accessTtlSeconds: number;
  private dummyHashPromise: Promise<string> | null = null;

  constructor(
    private readonly usersService: UsersService,
    @Inject(PASSWORD_HASHER) private readonly passwordHasher: PasswordHasher,
    private readonly accessTokenService: AccessTokenService,
    private readonly refreshTokenService: RefreshTokenService,
    private readonly refreshSessionService: RefreshSessionService,
    private readonly auditService: AuditService,
    @Inject(authConfig.KEY) config: ConfigType<typeof authConfig>,
  ) {
    this.accessTtlSeconds = config.jwtAccessTtl;
  }

  /**
   * Valide les identifiants et retourne un utilisateur public (sans hash).
   * Toute cause d'échec produit la même erreur générique `AUTH_INVALID_CREDENTIALS`.
   */
  async validateCredentials(email: string, password: string): Promise<PublicUser> {
    const normalizedEmail = UsersService.normalizeEmail(email);
    const user = await this.usersService.findAuthUserByEmail(normalizedEmail);

    if (!user) {
      await this.passwordHasher.verify(await this.getDummyHash(), password);
      throw this.invalidCredentials();
    }

    // Le mot de passe est vérifié AVANT le statut : le temps de réponse reste uniforme
    // qu'un compte connu soit inactif/suspendu ou que le mot de passe soit incorrect
    // (pas d'oracle de timing distinguant ces cas). Erreur toujours générique.
    const passwordValid = await this.passwordHasher.verify(user.passwordHash, password);

    if (!passwordValid || user.status !== UserStatus.ACTIVE) {
      throw this.invalidCredentials();
    }

    return AuthService.toPublicUser(user);
  }

  async login(
    email: string,
    password: string,
    metadata: RefreshSessionMetadata = {},
  ): Promise<LoginResult> {
    let user: PublicUser;
    try {
      user = await this.validateCredentials(email, password);
    } catch (error) {
      await this.recordAudit(AUTH_AUDIT_EVENTS.AUTH_LOGIN_FAILED, metadata, {});
      throw error;
    }

    let session;
    try {
      session = await this.refreshSessionService.createForUser(user.id, metadata);
    } catch {
      throw new InternalServerErrorException({
        code: AUTH_ERROR_CODES.AUTH_SESSION_CREATION_FAILED,
        message: 'Could not establish a session.',
      });
    }

    const accessToken = await this.accessTokenService.sign({
      sub: user.id,
      sid: session.sessionId,
      typ: 'access',
    });

    await this.recordAudit(AUTH_AUDIT_EVENTS.AUTH_LOGIN_SUCCEEDED, metadata, {
      actorId: user.id,
      subjectId: user.id,
      data: { sessionId: session.sessionId },
    });

    return {
      user,
      accessToken,
      refreshToken: session.refreshToken,
      accessTokenExpiresIn: this.accessTtlSeconds,
      refreshTokenExpiresIn: session.expiresInSeconds,
      tokenType: 'Bearer',
    };
  }

  /**
   * Profil public de l'utilisateur authentifié (`GET /auth/me`). Revérifie que
   * l'utilisateur existe et reste ACTIVE ; sinon 401 générique. Ne renvoie jamais
   * de donnée sensible (`PublicUser`, sans `passwordHash`).
   */
  async getProfile(userId: string): Promise<PublicUser> {
    const user = await this.usersService.findById(userId);

    if (!user || user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException({
        code: AUTH_ERROR_CODES.AUTH_UNAUTHORIZED,
        message: 'Authentication required.',
      });
    }

    return user;
  }


  async refresh(refreshToken: string, metadata: RefreshSessionMetadata = {}): Promise<RefreshResult> {
    const parsed = this.refreshTokenService.parse(refreshToken);
    if (!parsed) {
      await this.recordAudit(AUTH_AUDIT_EVENTS.AUTH_REFRESH_FAILED, metadata, {
        data: { reason: 'invalid_format' },
      });
      throw this.refreshInvalid();
    }

    const session = await this.refreshSessionService.findById(parsed.sessionId);
    if (!session) {
      await this.recordAudit(AUTH_AUDIT_EVENTS.AUTH_REFRESH_FAILED, metadata, {
        data: { reason: 'session_not_found' },
      });
      throw this.refreshInvalid();
    }

    // Empreinte d'abord : ne jamais révoquer de famille sur un token non fiable.
    if (!this.refreshTokenService.matches(parsed.secret, session.tokenHash)) {
      await this.recordAudit(AUTH_AUDIT_EVENTS.AUTH_REFRESH_FAILED, metadata, {
        subjectId: session.userId,
        data: { reason: 'fingerprint_mismatch' },
      });
      throw this.refreshInvalid();
    }

    if (session.revokedAt) {
      if (session.revocationReason === SessionRevocationReason.ROTATED) {
        // Réutilisation d'un token déjà tourné → suspicion de compromission.
        await this.refreshSessionService.revokeFamily(
          session.familyId,
          SessionRevocationReason.REUSE_DETECTED,
        );
        await this.recordAudit(AUTH_AUDIT_EVENTS.AUTH_REFRESH_REUSE_DETECTED, metadata, {
          subjectId: session.userId,
          data: { familyId: session.familyId },
        });
        await this.recordAudit(AUTH_AUDIT_EVENTS.AUTH_SESSION_FAMILY_REVOKED, metadata, {
          subjectId: session.userId,
          data: { familyId: session.familyId, reason: SessionRevocationReason.REUSE_DETECTED },
        });
      } else {
        await this.recordAudit(AUTH_AUDIT_EVENTS.AUTH_REFRESH_FAILED, metadata, {
          subjectId: session.userId,
          data: { reason: 'revoked' },
        });
      }
      throw this.refreshInvalid();
    }

    if (session.expiresAt.getTime() <= Date.now()) {
      await this.recordAudit(AUTH_AUDIT_EVENTS.AUTH_REFRESH_FAILED, metadata, {
        subjectId: session.userId,
        data: { reason: 'expired' },
      });
      throw this.refreshInvalid();
    }

    const user = await this.usersService.findById(session.userId);
    if (!user || user.status !== UserStatus.ACTIVE) {
      await this.refreshSessionService.revokeFamily(
        session.familyId,
        SessionRevocationReason.USER_DISABLED,
      );
      await this.recordAudit(AUTH_AUDIT_EVENTS.AUTH_REFRESH_FAILED, metadata, {
        subjectId: session.userId,
        data: { reason: 'user_unavailable' },
      });
      await this.recordAudit(AUTH_AUDIT_EVENTS.AUTH_SESSION_FAMILY_REVOKED, metadata, {
        subjectId: session.userId,
        data: { familyId: session.familyId, reason: SessionRevocationReason.USER_DISABLED },
      });
      throw this.refreshInvalid();
    }

    let rotated;
    try {
      rotated = await this.refreshSessionService.rotate(session, metadata);
    } catch {
      // Conflit de rotation concurrente : un seul refresh gagne, l'autre échoue.
      await this.recordAudit(AUTH_AUDIT_EVENTS.AUTH_REFRESH_FAILED, metadata, {
        subjectId: session.userId,
        data: { reason: 'rotation_conflict' },
      });
      throw this.refreshInvalid();
    }

    const accessToken = await this.accessTokenService.sign({
      sub: user.id,
      sid: rotated.sessionId,
      typ: 'access',
    });

    await this.recordAudit(AUTH_AUDIT_EVENTS.AUTH_REFRESH_SUCCEEDED, metadata, {
      actorId: user.id,
      subjectId: user.id,
      data: { sessionId: rotated.sessionId },
    });

    return {
      accessToken,
      refreshToken: rotated.refreshToken,
      accessTokenExpiresIn: this.accessTtlSeconds,
      refreshTokenExpiresIn: rotated.expiresInSeconds,
      tokenType: 'Bearer',
    };
  }

  /**
   * Logout idempotent et non révélateur : révoque la famille de la session
   * courante si le token est valide ; sinon ne fait rien. Réussit toujours.
   */
  async logout(refreshToken: string, metadata: RefreshSessionMetadata = {}): Promise<void> {
    const parsed = this.refreshTokenService.parse(refreshToken);

    if (parsed) {
      const session = await this.refreshSessionService.findById(parsed.sessionId);
      if (session && this.refreshTokenService.matches(parsed.secret, session.tokenHash)) {
        await this.refreshSessionService.revokeFamily(
          session.familyId,
          SessionRevocationReason.LOGOUT,
        );
        await this.recordAudit(AUTH_AUDIT_EVENTS.AUTH_LOGOUT, metadata, {
          actorId: session.userId,
          subjectId: session.userId,
          data: { familyId: session.familyId },
        });
        await this.recordAudit(AUTH_AUDIT_EVENTS.AUTH_SESSION_FAMILY_REVOKED, metadata, {
          subjectId: session.userId,
          data: { familyId: session.familyId, reason: SessionRevocationReason.LOGOUT },
        });
        return;
      }
    }

    // Token inconnu/invalide : ne pas révéler l'existence d'une session.
    await this.recordAudit(AUTH_AUDIT_EVENTS.AUTH_LOGOUT, metadata, {});
  }

  private invalidCredentials(): UnauthorizedException {
    return new UnauthorizedException({
      code: AUTH_ERROR_CODES.AUTH_INVALID_CREDENTIALS,
      message: 'Invalid credentials.',
    });
  }

  private refreshInvalid(): UnauthorizedException {
    return new UnauthorizedException({
      code: AUTH_ERROR_CODES.AUTH_REFRESH_TOKEN_INVALID,
      message: 'Invalid refresh token.',
    });
  }

  private recordAudit(
    eventType: AuthAuditEvent,
    metadata: RefreshSessionMetadata,
    details: AuditDetails,
  ): Promise<void> {
    return this.auditService.record({
      eventType,
      actorId: details.actorId ?? null,
      subjectId: details.subjectId ?? null,
      resourceType: 'refresh_session',
      metadata: details.data ?? null,
      ipAddress: metadata.ipAddress ?? null,
      userAgent: metadata.userAgent ?? null,
    });
  }

  private getDummyHash(): Promise<string> {
    this.dummyHashPromise ??= this.passwordHasher.hash(randomUUID());
    return this.dummyHashPromise;
  }

  private static toPublicUser(user: AuthUser): PublicUser {
    return {
      id: user.id,
      email: user.email,
      status: user.status,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      deactivatedAt: user.deactivatedAt,
    };
  }
}
