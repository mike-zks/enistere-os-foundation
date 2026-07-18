/**
 * Generic runtime-permission model (RN 9 — native permissions).
 *
 * A normalised, platform-agnostic view of an OS runtime permission (camera,
 * media library, notifications, foreground location…). The raw status reported
 * by a native module (Expo, RN-permissions, …) varies per platform/library;
 * {@link normalizePermissionStatus} folds those shapes into one stable enum so
 * the rest of the app branches on a single contract.
 *
 * SECURITY / governance (07_SECURITY §6, ADR-015) :
 * - A device permission is a LOCAL capability, NOT a security boundary: the API
 *   Core remains the authority for what data/actions are actually allowed.
 * - A permission status is NOT a secret, but it is NEVER persisted (no
 *   SecureStore / Zustand / TanStack Query) — always queried live (mission).
 *
 * PURE / framework-agnostic (no React/RN/ESM import) → unit-tested under
 * `node --test`.
 */

/** Runtime permission kinds the foundation models generically. */
export type PermissionKind = 'camera' | 'mediaLibrary' | 'notifications' | 'locationForeground';

/** All modelled kinds (handy for iteration / tests). */
export const PERMISSION_KINDS: readonly PermissionKind[] = [
  'camera',
  'mediaLibrary',
  'notifications',
  'locationForeground',
];

/**
 * Normalised permission status.
 * - `unknown`     — not yet determined (can prompt).
 * - `granted`     — allowed.
 * - `denied`      — refused, but the user can be asked again.
 * - `blocked`     — refused and cannot be asked again → open OS settings.
 * - `limited`     — partial access (e.g. iOS limited photos / provisional notif).
 * - `unavailable` — feature absent or restricted (parental controls, no module).
 */
export type PermissionStatus =
  | 'unknown'
  | 'granted'
  | 'denied'
  | 'blocked'
  | 'limited'
  | 'unavailable';

/** All valid normalised statuses. */
const STATUSES: ReadonlySet<PermissionStatus> = new Set([
  'unknown',
  'granted',
  'denied',
  'blocked',
  'limited',
  'unavailable',
]);

/** Raw status string → normalised status (keys stripped to alphanumerics). */
const STRING_MAP: Readonly<Record<string, PermissionStatus>> = {
  granted: 'granted',
  authorized: 'granted',
  allowed: 'granted',
  denied: 'denied',
  undetermined: 'unknown',
  notdetermined: 'unknown',
  unknown: 'unknown',
  ask: 'unknown',
  prompt: 'unknown',
  blocked: 'blocked',
  neveraskagain: 'blocked',
  limited: 'limited',
  provisional: 'limited',
  partial: 'limited',
  unavailable: 'unavailable',
  restricted: 'unavailable',
  disabled: 'unavailable',
  unsupported: 'unavailable',
};

function fromString(value: string): PermissionStatus {
  const key = value.toLowerCase().replace(/[^a-z0-9]/g, '');
  return STRING_MAP[key] ?? 'unknown';
}

/**
 * Folds a raw permission result into a {@link PermissionStatus}. Accepts a
 * normalised status (idempotent), a raw status string (`granted`/`denied`/
 * `undetermined`/`limited`/`restricted`/`never_ask_again`…), a boolean, or an
 * Expo-style object `{ status?, granted?, canAskAgain? }`. Anything unrecognised
 * → `unknown` (conservative: never assume `granted`).
 */
export function normalizePermissionStatus(value: unknown): PermissionStatus {
  if (value === null || value === undefined) {
    return 'unknown';
  }
  if (typeof value === 'boolean') {
    return value ? 'granted' : 'denied';
  }
  if (typeof value === 'string') {
    return fromString(value);
  }
  if (typeof value === 'object') {
    const obj = value as { status?: unknown; granted?: unknown; canAskAgain?: unknown };
    if (obj.granted === true) {
      return 'granted';
    }
    let base: PermissionStatus =
      typeof obj.status === 'string'
        ? fromString(obj.status)
        : obj.granted === false
          ? 'denied'
          : 'unknown';
    if (base === 'denied' && obj.canAskAgain === false) {
      base = 'blocked';
    }
    return base;
  }
  return 'unknown';
}

/** True when the OS can still be prompted for this permission. */
export function canRequestPermission(status: PermissionStatus): boolean {
  return status === 'unknown' || status === 'denied';
}

/** True only when the permission is fully granted. */
export function isPermissionGranted(status: PermissionStatus): boolean {
  return status === 'granted';
}

/** True when the permission is usable, including partial (`limited`) access. */
export function isPermissionUsable(status: PermissionStatus): boolean {
  return status === 'granted' || status === 'limited';
}

/** True when the only way forward is the OS settings screen (`blocked`). */
export function shouldOpenSettings(status: PermissionStatus): boolean {
  return status === 'blocked';
}

/** Type guard for a normalised {@link PermissionStatus}. */
export function isPermissionStatus(value: unknown): value is PermissionStatus {
  return typeof value === 'string' && STATUSES.has(value as PermissionStatus);
}
