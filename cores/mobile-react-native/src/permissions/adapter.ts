/**
 * Permission adapter contract (RN 9 — native permissions).
 *
 * The seam between the framework-agnostic {@link PermissionService} and a
 * platform implementation (Expo `expo-camera`/`expo-media-library`/
 * `expo-notifications`/`expo-location`, RN-permissions, …). The foundation
 * ships only the contract + a documented placeholder; a derived project wires a
 * real adapter (which SHOULD return statuses via `normalizePermissionStatus`).
 *
 * No React/RN import here → agnostic, `node --test`-able.
 */
import type { PermissionKind, PermissionStatus } from './status';

export interface PermissionAdapter {
  /** Current OS status for `kind` (no prompt). */
  getStatus(kind: PermissionKind): Promise<PermissionStatus>;
  /** Trigger the OS prompt for `kind` and return the resulting status. */
  request(kind: PermissionKind): Promise<PermissionStatus>;
  /** Optionally open the OS settings screen (for a `blocked` permission). */
  openSettings?(): Promise<void>;
}
