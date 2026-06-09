/**
 * ⚠️ Adaptateur de session EN MÉMOIRE — TESTS / EXEMPLES / DÉVELOPPEMENT UNIQUEMENT.
 *
 * Ne persiste rien et ne doit JAMAIS servir en production. Les implémentations réelles (SecureStore
 * React Native, cookie httpOnly web, etc.) vivent dans les cores de plateforme.
 */
import type { AuthSessionAdapter } from './auth-session-adapter.js';
import type { AuthTokens } from './auth-types.js';

export class InMemorySessionAdapter implements AuthSessionAdapter {
  private accessToken: string | null;
  private refreshToken: string | null;
  /** Compteurs d'observabilité pour les tests (jamais la valeur d'un token). */
  public clearCount = 0;
  public updateCount = 0;

  constructor(initial?: { accessToken?: string | null; refreshToken?: string | null }) {
    this.accessToken = initial?.accessToken ?? null;
    this.refreshToken = initial?.refreshToken ?? null;
  }

  getAccessToken(): Promise<string | null> {
    return Promise.resolve(this.accessToken);
  }

  getRefreshToken(): Promise<string | null> {
    return Promise.resolve(this.refreshToken);
  }

  updateTokens(tokens: AuthTokens): Promise<void> {
    this.accessToken = tokens.accessToken;
    this.refreshToken = tokens.refreshToken;
    this.updateCount += 1;
    return Promise.resolve();
  }

  clearSession(): Promise<void> {
    this.accessToken = null;
    this.refreshToken = null;
    this.clearCount += 1;
    return Promise.resolve();
  }
}
