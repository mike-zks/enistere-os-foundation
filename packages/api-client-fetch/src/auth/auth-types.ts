/**
 * Contrats de session, DÉRIVÉS du contrat canonique autant que possible (jamais ré-écrits à la main).
 */
import type { SchemaOf } from '@enistere/api-contracts';

/** Paire de tokens + durées, dérivée de `LoginResponseDto` (identique au corps de refresh). */
export type AuthTokens = Pick<
  SchemaOf<'LoginResponseDto'>,
  'accessToken' | 'refreshToken' | 'accessTokenExpiresIn' | 'refreshTokenExpiresIn' | 'tokenType'
>;
