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

/** Abstract, serialisable snapshot of connectivity. Carries no device/PII data. */
export interface NetworkState {
  readonly status: NetworkStatus;
  /** Epoch ms of the last status change, or `null` while still `unknown`. */
  readonly changedAt: number | null;
}

/** The starting state: connectivity is not yet known. */
export const initialNetworkState: NetworkState = {
  status: 'unknown',
  changedAt: null,
};

/** Builds a {@link NetworkState} for a status at a given (injected) instant. */
export function networkState(status: NetworkStatus, changedAt: number | null = null): NetworkState {
  return { status, changedAt };
}

/** True only when connectivity is positively known to be available. */
export function isOnline(state: NetworkState): boolean {
  return state.status === 'online';
}

/** True only when connectivity is positively known to be unavailable. */
export function isOffline(state: NetworkState): boolean {
  return state.status === 'offline';
}

/**
 * Whether mutations should be queued instead of sent now.
 *
 * Conservative by design: queue while `offline` AND while `unknown` (we have no
 * positive proof of connectivity yet), send only when positively `online`.
 */
export function shouldQueueMutations(state: NetworkState): boolean {
  return state.status !== 'online';
}
