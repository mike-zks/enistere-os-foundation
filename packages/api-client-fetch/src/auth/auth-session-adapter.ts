/**
 * Contrat de session — délégué aux plateformes (SecureStore RN, cookie httpOnly web, etc.).
 *
 * API **asynchrone** (compatible SecureStore et stockages asynchrones). Aucune implémentation de
 * production n'est fournie par ce package : seules les plateformes savent où/comment stocker.
 */
import type { AuthTokens } from './auth-types.js';

export interface AuthSessionAdapter {
  getAccessToken(): Promise<string | null>;
  getRefreshToken(): Promise<string | null>;
  /** Mise à jour atomique de la paire de tokens (l'implémentation garantit la cohérence). */
  updateTokens(tokens: AuthTokens): Promise<void>;
  clearSession(): Promise<void>;
}
