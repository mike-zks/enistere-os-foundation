import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';

import { AuditService } from '../../audit/audit.service';
import { AUTH_AUDIT_EVENTS } from '../auth-audit-events';
import { authConfig } from '../auth.config';
import { AUTH_ERROR_CODES } from '../auth-error-codes';
import { AuthenticatedPrincipal } from '../contracts/authenticated-principal';
import { RefreshSessionService } from '../sessions/refresh-session.service';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface AccessTokenPayload {
  sub: string;
  sid: string;
  typ: 'access';
}

function isValidAccessPayload(payload: unknown): payload is AccessTokenPayload {
  if (typeof payload !== 'object' || payload === null) {
    return false;
  }
  const claims = payload as Record<string, unknown>;
  return (
    typeof claims.sub === 'string' &&
    UUID_PATTERN.test(claims.sub) &&
    typeof claims.sid === 'string' &&
    UUID_PATTERN.test(claims.sid) &&
    claims.typ === 'access'
  );
}

/**
 * Stratégie Passport JWT pour l'access token.
 *
 * Extraction stricte `Authorization: Bearer <token>` (jamais query/URL). La signature
 * et l'expiration sont vérifiées par passport-jwt ; cette stratégie vérifie en plus la
 * conformité des claims (UUID `sub`/`sid`, `typ === "access"`) puis l'état de la session
 * référencée par `sid`. Toute défaillance produit une 401 générique.
 */
@Injectable()
export class JwtAccessStrategy extends PassportStrategy(Strategy, 'jwt-access') {
  constructor(
    @Inject(authConfig.KEY) config: ConfigType<typeof authConfig>,
    private readonly refreshSessionService: RefreshSessionService,
    private readonly auditService: AuditService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: config.jwtAccessSecret,
      algorithms: ['HS256'],
      ignoreExpiration: false,
      passReqToCallback: true,
    });
  }

  async validate(request: Request, payload: unknown): Promise<AuthenticatedPrincipal> {
    if (!isValidAccessPayload(payload)) {
      await this.auditService.record({
        eventType: AUTH_AUDIT_EVENTS.AUTH_ACCESS_TOKEN_REJECTED,
        ipAddress: request.ip ?? null,
        userAgent: request.headers['user-agent'] ?? null,
        metadata: { reason: 'invalid_claims' },
      });
      throw this.unauthorized();
    }

    const sessionValid = await this.refreshSessionService.validateAccessSession(
      payload.sid,
      payload.sub,
    );

    if (!sessionValid) {
      await this.auditService.record({
        eventType: AUTH_AUDIT_EVENTS.AUTH_SESSION_REJECTED,
        subjectId: payload.sub,
        ipAddress: request.ip ?? null,
        userAgent: request.headers['user-agent'] ?? null,
        metadata: { reason: 'session_invalid' },
      });
      throw this.unauthorized();
    }

    return { userId: payload.sub, sessionId: payload.sid };
  }

  private unauthorized(): UnauthorizedException {
    return new UnauthorizedException({
      code: AUTH_ERROR_CODES.AUTH_UNAUTHORIZED,
      message: 'Authentication required.',
    });
  }
}
