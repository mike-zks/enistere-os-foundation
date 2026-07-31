/**
 * Session store — generic, secure persistence of the session envelope.
 *
 * Governance (ADR-015):
 * - persists ONLY the non-secret-at-rest envelope needed to recover a session:
 *   `refreshToken` (the critical secret → SecureStore), `expiresAt`, and a
 *   minimal generic `user`. The ACCESS TOKEN is never persisted (§11); it is
 *   re-minted in memory by refreshing on restore.
 * - `load()` validates the restored format and fails soft (returns `null`) on
 *   corruption — a bad entry must never crash app boot (§hardening).
 * - `clear()` purges the envelope and any legacy token slots on logout (§18).
 *
 * No business fields cross this boundary.
 */
import { AuthUser } from './session';
import { SecureStorage } from '../../storage/secure-storage';
import { STORAGE_KEYS } from './storage-keys';

export interface PersistedSession {
  readonly refreshToken: string;
  readonly expiresAt: number | null;
  readonly user: AuthUser | null;
}

export class SessionStore {
  constructor(private readonly storage: SecureStorage) {}

  /** Reads and validates the persisted session, or `null` when absent/invalid. */
  async load(): Promise<PersistedSession | null> {
    const raw = await this.storage.getItem(STORAGE_KEYS.session);
    if (!raw) {
      return null;
    }
    try {
      const parsed: unknown = JSON.parse(raw);
      return isPersistedSession(parsed) ? parsed : null;
    } catch {
      // Corrupt entry — treat as no session rather than crashing.
      return null;
    }
  }

  /** Persists the session envelope (refresh token + expiry + minimal user). */
  async save(session: PersistedSession): Promise<void> {
    await this.storage.setItem(STORAGE_KEYS.session, JSON.stringify(session));
  }

  /** Removes the envelope and any legacy token slots. Call on logout/expiry. */
  async clear(): Promise<void> {
    await this.storage.removeItem(STORAGE_KEYS.session);
    await this.storage.removeItem(STORAGE_KEYS.refreshToken);
    await this.storage.removeItem(STORAGE_KEYS.accessToken);
  }
}

function isAuthUser(value: unknown): value is AuthUser {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const user = value as Record<string, unknown>;
  return (
    typeof user.id === 'string' &&
    (user.displayName === null || typeof user.displayName === 'string')
  );
}

function isPersistedSession(value: unknown): value is PersistedSession {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const session = value as Record<string, unknown>;
  const refreshOk = typeof session.refreshToken === 'string' && session.refreshToken.length > 0;
  const expiresOk = session.expiresAt === null || typeof session.expiresAt === 'number';
  const userOk = session.user === null || isAuthUser(session.user);
  return refreshOk && expiresOk && userOk;
}
