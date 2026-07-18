/**
 * In-memory {@link SecureStorage} implementation.
 *
 * Two uses:
 * - a deterministic fixture for unit tests (no native module needed);
 * - a safe fallback if a platform secure store is unavailable (values are then
 *   non-persistent, which is acceptable for a degraded session — see ADR-015
 *   "comportement prévisible si storage indisponible").
 *
 * It is framework-agnostic (no React Native / Expo import).
 */
import { SecureStorage } from './secure-storage';

export class InMemorySecureStorage implements SecureStorage {
  private readonly store = new Map<string, string>();

  async getItem(key: string): Promise<string | null> {
    return this.store.has(key) ? (this.store.get(key) as string) : null;
  }

  async setItem(key: string, value: string): Promise<void> {
    this.store.set(key, value);
  }

  async removeItem(key: string): Promise<void> {
    this.store.delete(key);
  }
}
