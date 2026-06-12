/**
 * Documented placeholder permission adapter (RN 9 — native permissions).
 *
 * A dependency-free {@link PermissionAdapter} for wiring, tests and degraded
 * environments. It simulates the OS in memory — NO native module, NO Expo
 * dependency added (mission objective 5). A derived project replaces it with a
 * real adapter over `expo-camera`/`expo-media-library`/`expo-notifications`/
 * `expo-location`; the contract and `usePermission` hook stay identical.
 *
 * Behaviour: holds an in-memory `kind → status` map (default `unknown`).
 * `request` transitions via `onRequest` (default: grant unless `blocked`/
 * `unavailable`). `openSettings` is a documented no-op (no real settings screen).
 * In-memory only — NOT persistence of a permission (mission / ADR-015): the map
 * is a local simulation, never written to SecureStore / Zustand / a cache.
 *
 * Agnostic (no React/RN import) → `node --test`-able.
 */
import type { PermissionAdapter } from './adapter';
import { normalizePermissionStatus, type PermissionKind, type PermissionStatus } from './status';

export interface PlaceholderPermissionConfig {
  /** Seed statuses per kind (default `unknown`). */
  readonly initial?: Partial<Record<PermissionKind, PermissionStatus>>;
  /** Decide the result of a `request` given the current status (default: grant). */
  readonly onRequest?: (kind: PermissionKind, current: PermissionStatus) => PermissionStatus;
}

const defaultDecision = (_kind: PermissionKind, current: PermissionStatus): PermissionStatus =>
  current === 'blocked' || current === 'unavailable' ? current : 'granted';

/** Create an in-memory placeholder adapter (no native dependency). */
export function createPlaceholderPermissionAdapter(
  config: PlaceholderPermissionConfig = {},
): PermissionAdapter {
  const state = new Map<PermissionKind, PermissionStatus>();
  for (const [kind, status] of Object.entries(config.initial ?? {})) {
    state.set(kind as PermissionKind, normalizePermissionStatus(status));
  }
  const decide = config.onRequest ?? defaultDecision;

  return {
    async getStatus(kind: PermissionKind): Promise<PermissionStatus> {
      return state.get(kind) ?? 'unknown';
    },
    async request(kind: PermissionKind): Promise<PermissionStatus> {
      const current = state.get(kind) ?? 'unknown';
      const next = normalizePermissionStatus(decide(kind, current));
      state.set(kind, next);
      return next;
    },
    async openSettings(): Promise<void> {
      // Documented no-op: a placeholder has no OS settings screen to open.
    },
  };
}
