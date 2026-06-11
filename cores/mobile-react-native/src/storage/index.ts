/**
 * Storage module public surface.
 *
 * `secureStorage` is the default singleton used by the app; tests and alternate
 * platforms can construct their own `SecureStorage` / `TokenStore`.
 */
import { ExpoSecureStorage } from './expo-secure-storage';
import { TokenStore } from './token-store';

export { SecureStorageError } from './secure-storage';
export type { SecureStorage } from './secure-storage';
export { ExpoSecureStorage } from './expo-secure-storage';
export { STORAGE_KEYS } from './keys';
export type { StorageKey } from './keys';
export { TokenStore } from './token-store';

/** Default secure storage backed by Expo SecureStore. */
export const secureStorage = new ExpoSecureStorage();

/** Default token store composed over {@link secureStorage}. */
export const tokenStore = new TokenStore(secureStorage);
