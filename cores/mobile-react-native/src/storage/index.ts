/**
 * Storage module public surface.
 *
 * `secureStorage` is the default singleton (Expo SecureStore); `sessionStore`
 * composes it. Tests / alternate platforms can construct their own
 * `SecureStorage` (e.g. {@link InMemorySecureStorage}) and `SessionStore`.
 */
import { ExpoSecureStorage } from './expo-secure-storage';
import { SessionStore } from './session-store';

export { SecureStorageError } from './secure-storage';
export type { SecureStorage } from './secure-storage';
export { ExpoSecureStorage } from './expo-secure-storage';
export { InMemorySecureStorage } from './memory-secure-storage';
export { STORAGE_KEYS } from './keys';
export type { StorageKey } from './keys';
export { SessionStore } from './session-store';
export type { PersistedSession } from './session-store';

/** Default secure storage backed by Expo SecureStore. */
export const secureStorage = new ExpoSecureStorage();

/** Default session store composed over {@link secureStorage}. */
export const sessionStore = new SessionStore(secureStorage);
