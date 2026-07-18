/**
 * Network connectivity adapter contract (RN 16 — network status).
 *
 * The seam between the agnostic {@link NetworkService} and the platform source
 * (RN `@react-native-community/netinfo` : `fetch()` + `addEventListener`). The
 * foundation ships only the contract + an in-memory placeholder — NO real
 * NetInfo, NO native module (mission). A derived project wires a real adapter
 * (which SHOULD map its raw shape via `normalizeNetworkStatus`/
 * `normalizeConnectionType`).
 *
 * The adapter emits a {@link NetworkSnapshot} (status + optional type, no
 * timestamp); the service stamps `changedAt` via its injected clock.
 *
 * Agnostic (no React/RN import) → `node --test`-able.
 */
import type { NetworkSnapshot } from './network-state';

export interface NetworkAdapter {
  /** Current connectivity reading (synchronous). */
  getStatus(): NetworkSnapshot;
  /** Observe connectivity changes; returns an unsubscribe function. */
  subscribe(listener: (snapshot: NetworkSnapshot) => void): () => void;
}

/**
 * Controlled error for a failed adapter operation. Carries only the safe
 * `operation` (no underlying message/cause → no sensitive leak).
 */
export class NetworkAdapterError extends Error {
  readonly operation: 'getStatus' | 'subscribe';

  constructor(operation: 'getStatus' | 'subscribe') {
    super(`Network adapter "${operation}" failed.`);
    this.name = 'NetworkAdapterError';
    this.operation = operation;
  }
}
