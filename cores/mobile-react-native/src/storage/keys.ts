/**
 * Storage keys.
 *
 * Keys are intentionally GENERIC (`accessToken`, `refreshToken`, `session`) —
 * no business/domain terms. A namespace prefix keeps them isolated from other
 * apps that may share the device keychain.
 */

const NAMESPACE = 'enistere';

function namespaced(key: string): string {
  return `${NAMESPACE}.${key}`;
}

export const STORAGE_KEYS = {
  accessToken: namespaced('accessToken'),
  refreshToken: namespaced('refreshToken'),
  session: namespaced('session'),
} as const;

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];
