/**
 * Expo SecureStore implementation of {@link SecureStorage}.
 *
 * Wraps `expo-secure-store` (Keychain on iOS, Keystore-backed on Android) and
 * normalizes its behaviour:
 * - reads fail soft (return `null`) so a corrupt/locked entry never crashes boot;
 * - writes/removes throw a typed {@link SecureStorageError} so callers can react.
 *
 * The choice SecureStore vs Keychain is documented in ARCHITECTURE.md; swapping
 * implementations only requires another `SecureStorage` class.
 */
import * as SecureStore from 'expo-secure-store';

import { SecureStorage, SecureStorageError } from './secure-storage';

export class ExpoSecureStorage implements SecureStorage {
  async getItem(key: string): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(key);
    } catch (error) {
      // Fail soft on reads: a missing/locked entry must not block app boot.
      // We never log the value, only the key name.
      if (__DEV__) {
        console.warn(`[secure-storage] read failed for key "${key}"`, error);
      }
      return null;
    }
  }

  async setItem(key: string, value: string): Promise<void> {
    try {
      await SecureStore.setItemAsync(key, value);
    } catch (error) {
      throw new SecureStorageError('set', `Failed to persist key "${key}"`, error);
    }
  }

  async removeItem(key: string): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(key);
    } catch (error) {
      throw new SecureStorageError('remove', `Failed to remove key "${key}"`, error);
    }
  }
}
