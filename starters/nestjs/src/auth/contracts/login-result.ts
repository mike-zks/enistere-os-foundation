import { PublicUser } from '../../users/models/user.model';

/**
 * Résultat de connexion retourné au client (mobile/API en priorité).
 *
 * Ne contient jamais `passwordHash`, `tokenHash` ni aucun secret de configuration.
 * L'enveloppe `{ success, data, timestamp }` est ajoutée par le ResponseInterceptor.
 * Le placement éventuel du refresh token en cookie web HttpOnly relève d'une étape
 * web dédiée (ADR-005).
 */
export interface LoginResult {
  user: PublicUser;
  accessToken: string;
  refreshToken: string;
  /** Durée de vie de l'access token, en secondes. */
  accessTokenExpiresIn: number;
  /** Durée de vie du refresh token, en secondes. */
  refreshTokenExpiresIn: number;
  tokenType: 'Bearer';
}
