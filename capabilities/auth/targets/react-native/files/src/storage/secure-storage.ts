/**
 * Secure storage abstraction.
 *
 * This is the INTERFACE only — it is deliberately decoupled from any concrete
 * implementation (Expo SecureStore, Keychain, an in-memory fake for tests…).
 * Consumers depend on `SecureStorage`, never on a platform module directly.
 */

/** Error thrown when a secure-storage operation fails irrecoverably. */
export class SecureStorageError extends Error {
  readonly operation: 'get' | 'set' | 'remove';
  override readonly cause?: unknown;

  constructor(operation: 'get' | 'set' | 'remove', message: string, cause?: unknown) {
    super(message);
    this.name = 'SecureStorageError';
    this.operation = operation;
    this.cause = cause;
  }
}

/**
 * Minimal async key/value contract for sensitive values.
 *
 * Implementations MUST:
 * - persist values in a platform-secure store (Keychain / Keystore);
 * - never log the stored values;
 * - resolve `getItem` to `null` when a key is absent.
 */
export interface SecureStorage {
  /** Returns the stored value, or `null` if the key is absent. */
  getItem(key: string): Promise<string | null>;
  /** Persists `value` under `key`, overwriting any previous value. */
  setItem(key: string, value: string): Promise<void>;
  /** Removes `key`. A no-op if the key is absent. */
  removeItem(key: string): Promise<void>;
}
