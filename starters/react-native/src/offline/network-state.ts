/**
 * Abstract network-state model (RN 3 — offline-ready primitives).
 *
 * Governance / scope:
 * - This is a PREPARATORY primitive only. It defines an abstract connectivity
 *   model and pure helpers — it does NOT detect connectivity. No NetInfo,
 *   `expo-network`, `navigator.onLine`, polling or background listener is
 *   wired here (mission RN 3 — out of scope). A future mission/project binds a
 *   real source (e.g. `@react-native-community/netinfo`) to push updates; this
 *   model is the seam it would feed.
 * - Framework-agnostic (no React/RN imports) so it is unit-testable under
 *   `node --test`, like the auth engine.
 */

/**
 * Connectivity status.
 * - `online`  — connectivity is believed available.
 * - `offline` — connectivity is believed unavailable.
 * - `unknown` — not yet determined (initial state, before any probe).
 */
export type NetworkStatus = 'online' | 'offline' | 'unknown';

/**
 * Optional, bounded connection type (RN 16). Generic — never a carrier/SSID/IP
 * or any device-identifying value. `unknown` when undetermined.
 */
export type NetworkConnectionType = 'wifi' | 'cellular' | 'ethernet' | 'other' | 'none' | 'unknown';

/** Abstract, serialisable snapshot of connectivity. Carries no device/PII data. */
export interface NetworkState {
  readonly status: NetworkStatus;
  /** Epoch ms of the last status change, or `null` while still `unknown`. */
  readonly changedAt: number | null;
  /** Optional connection type (RN 16). Absent on RN 3 states. */
  readonly type?: NetworkConnectionType;
}

/**
 * A lightweight connectivity reading emitted by a {@link NetworkAdapter} (RN 16):
 * a normalised status + optional type, WITHOUT a timestamp (the service stamps
 * `changedAt` via its injected clock).
 */
export interface NetworkSnapshot {
  readonly status: NetworkStatus;
  readonly type?: NetworkConnectionType;
}

/** The starting state: connectivity is not yet known. */
export const initialNetworkState: NetworkState = {
  status: 'unknown',
  changedAt: null,
};

/** Builds a {@link NetworkState} for a status at a given (injected) instant. */
export function networkState(
  status: unknown,
  changedAt: unknown = null,
  type?: unknown,
): NetworkState {
  const normalisedStatus = normalizeNetworkStatus(status);
  const normalisedChangedAt = typeof changedAt === 'number' && Number.isFinite(changedAt) ? changedAt : null;
  const normalisedType = type === undefined ? undefined : normalizeConnectionType(type);
  return normalisedType !== undefined
    ? { status: normalisedStatus, changedAt: normalisedChangedAt, type: normalisedType }
    : { status: normalisedStatus, changedAt: normalisedChangedAt };
}

/** True only when connectivity is positively known to be available. */
export function isOnline(state: unknown): boolean {
  return readNetworkStatus(state) === 'online';
}

/** True only when connectivity is positively known to be unavailable. */
export function isOffline(state: unknown): boolean {
  return readNetworkStatus(state) === 'offline';
}

/**
 * Whether mutations should be queued instead of sent now.
 *
 * Conservative by design: queue while `offline` AND while `unknown` (we have no
 * positive proof of connectivity yet), send only when positively `online`.
 */
export function shouldQueueMutations(state: unknown): boolean {
  return readNetworkStatus(state) !== 'online';
}

// --- RN 16: connectivity normalisation (additive; RN 3 contract unchanged) ---

const STATUS_MAP: Readonly<Record<string, NetworkStatus>> = {
  online: 'online',
  connected: 'online',
  reachable: 'online',
  offline: 'offline',
  disconnected: 'offline',
  notconnected: 'offline',
  none: 'offline',
  unknown: 'unknown',
};

const CONNECTION_TYPE_MAP: Readonly<Record<string, NetworkConnectionType>> = {
  wifi: 'wifi',
  wlan: 'wifi',
  cellular: 'cellular',
  cell: 'cellular',
  mobile: 'cellular',
  ethernet: 'ethernet',
  wired: 'ethernet',
  none: 'none',
  unknown: 'unknown',
};

/**
 * Fold a raw connectivity value into a {@link NetworkStatus}. Accepts a boolean
 * (`true`→online, `false`→offline) or a status-like string
 * (`online`/`connected`/`offline`/`disconnected`/`none`…). Anything else →
 * `unknown` (conservative). Never throws.
 */
export function normalizeNetworkStatus(value: unknown): NetworkStatus {
  if (typeof value === 'boolean') {
    return value ? 'online' : 'offline';
  }
  if (typeof value === 'string') {
    return STATUS_MAP[value.trim().toLowerCase()] ?? 'unknown';
  }
  return 'unknown';
}

/**
 * Fold a raw connection-type value into a {@link NetworkConnectionType}.
 * Unknown/nullish → `unknown`; an unrecognised non-empty string → `other`.
 * Never throws.
 */
export function normalizeConnectionType(value: unknown): NetworkConnectionType {
  if (typeof value !== 'string') {
    return 'unknown';
  }
  const key = value.trim().toLowerCase();
  if (key.length === 0) {
    return 'unknown';
  }
  return CONNECTION_TYPE_MAP[key] ?? 'other';
}

function readNetworkStatus(state: unknown): NetworkStatus {
  if (typeof state === 'object' && state !== null && 'status' in state) {
    return normalizeNetworkStatus((state as { status?: unknown }).status);
  }
  return normalizeNetworkStatus(state);
}
