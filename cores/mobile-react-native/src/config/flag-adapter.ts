/**
 * Feature-flag adapter contract (RN 17 — feature flags / config).
 *
 * The seam between the agnostic {@link FlagService} and a local/remote-config
 * source (a bundled JSON, a remote-config SDK, …). The foundation ships only the
 * contract + an in-memory placeholder — NO real remote-config SDK, NO network,
 * NO persistence, NO real user targeting (mission). A derived project wires a
 * real adapter (which SHOULD sanitise via `sanitizeFlagSet`).
 *
 * Agnostic (no React/RN import) → `node --test`-able.
 */
import type { FlagSet } from './flag-model';

export interface FlagAdapter {
  /** Current flags (synchronous snapshot). */
  getFlags(): FlagSet;
  /** Observe flag-source changes; returns an unsubscribe function. */
  subscribe?(listener: (flags: FlagSet) => void): () => void;
  /** Optionally fetch a fresh set (e.g. remote refresh). Best-effort. */
  refresh?(): Promise<FlagSet>;
}

/**
 * Controlled error for a failed adapter operation. Carries only the safe
 * `operation` (no underlying message/cause → no sensitive leak).
 */
export class FlagAdapterError extends Error {
  readonly operation: 'getFlags' | 'subscribe' | 'refresh';

  constructor(operation: 'getFlags' | 'subscribe' | 'refresh') {
    super(`Flag adapter "${operation}" failed.`);
    this.name = 'FlagAdapterError';
    this.operation = operation;
  }
}
