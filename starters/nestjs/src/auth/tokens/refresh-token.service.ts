import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { AppConfig } from '../../config/configuration';

export interface ParsedRefreshToken {
  sessionId: string;
  secret: string;
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SECRET_PATTERN = /^[A-Za-z0-9_-]+$/;
const SECRET_MIN_LENGTH = 40;
const SECRET_MAX_LENGTH = 100;

/**
 * Génération, parsing et empreinte des refresh tokens opaques.
 *
 * Format du token : `<sessionId>.<secretAléatoire>`.
 * - le `sessionId` (UUID) localise la session sans parcourir les empreintes ;
 * - seul le secret est haché ; le token brut n'est jamais persisté ni journalisé.
 *
 * L'empreinte est déterministe (HMAC-SHA-256 avec un secret serveur dédié,
 * distinct des secrets JWT) afin de permettre une vérification en temps constant.
 */
@Injectable()
export class RefreshTokenService {
  private readonly hashSecret: string;

  constructor(configService: ConfigService<AppConfig, true>) {
    this.hashSecret = configService.get('refreshTokenHashSecret', { infer: true });
  }

  /** Secret aléatoire cryptographiquement sûr, encodé URL-safe (256 bits d'entropie). */
  generateSecret(): string {
    return randomBytes(32).toString('base64url');
  }

  /** Assemble le token opaque remis au client (jamais stocké). */
  buildToken(sessionId: string, secret: string): string {
    return `${sessionId}.${secret}`;
  }

  /** Empreinte déterministe du secret, seule valeur persistée dans `RefreshSession.tokenHash`. */
  fingerprint(secret: string): string {
    return createHmac('sha256', this.hashSecret).update(secret).digest('hex');
  }

  /**
   * Parse strict du token `<sessionId>.<secret>`.
   * Retourne `null` pour tout format invalide, sans révéler la partie fautive.
   */
  parse(token: string): ParsedRefreshToken | null {
    if (typeof token !== 'string' || token.length === 0 || /\s/.test(token)) {
      return null;
    }

    const segments = token.split('.');
    if (segments.length !== 2) {
      return null;
    }

    const [sessionId, secret] = segments;

    if (!UUID_PATTERN.test(sessionId)) {
      return null;
    }

    if (
      secret.length < SECRET_MIN_LENGTH ||
      secret.length > SECRET_MAX_LENGTH ||
      !SECRET_PATTERN.test(secret)
    ) {
      return null;
    }

    return { sessionId, secret };
  }

  /**
   * Compare le secret fourni à une empreinte stockée, en temps constant
   * (après vérification de longueur). Ne logge jamais le secret ni l'empreinte.
   */
  matches(secret: string, expectedFingerprint: string): boolean {
    const actual = Buffer.from(this.fingerprint(secret), 'utf8');
    const expected = Buffer.from(expectedFingerprint, 'utf8');

    if (actual.length !== expected.length) {
      return false;
    }

    return timingSafeEqual(actual, expected);
  }
}
