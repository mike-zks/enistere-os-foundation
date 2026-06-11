/**
 * Token store — generic, secure persistence of the REFRESH TOKEN only.
 *
 * Governance (ADR-015):
 * - The access token stays IN MEMORY (held by the auth shell); it is NOT
 *   persisted here (§11: "ne pas persister l'access token si ce n'est pas
 *   nécessaire").
 * - The refresh token is a critical secret → SecureStore, never AsyncStorage
 *   (§12). On logout, every persisted secret is removed (§18).
 *
 * It carries NO business logic: only opaque token strings cross this boundary.
 * The auth shell composes this; tests can inject a fake `SecureStorage`.
 */
import { SecureStorage } from './secure-storage';
import { STORAGE_KEYS } from './keys';

export class TokenStore {
  constructor(private readonly storage: SecureStorage) {}

  /** Reads the persisted refresh token, or `null` when signed out. */
  async getRefreshToken(): Promise<string | null> {
    return this.storage.getItem(STORAGE_KEYS.refreshToken);
  }

  /** Persists the refresh token (the only secret kept at rest). */
  async saveRefreshToken(refreshToken: string): Promise<void> {
    await this.storage.setItem(STORAGE_KEYS.refreshToken, refreshToken);
  }

  /**
   * Removes every persisted secret. Call on sign-out / session expiry.
   * Also clears the `accessToken`/`session` slots defensively, in case an
   * earlier build (or a derived project) ever wrote them.
   */
  async clear(): Promise<void> {
    await this.storage.removeItem(STORAGE_KEYS.refreshToken);
    await this.storage.removeItem(STORAGE_KEYS.accessToken);
    await this.storage.removeItem(STORAGE_KEYS.session);
  }
}
