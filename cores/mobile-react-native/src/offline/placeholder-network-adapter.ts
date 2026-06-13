/**
 * In-memory placeholder network adapter (RN 16 — network status).
 *
 * A dependency-free {@link NetworkAdapter} for tests / wiring. It holds the
 * connectivity reading in memory and lets a test simulate changes via
 * `setStatus` — NO real NetInfo, NO native module, NO persistence (mission). A
 * derived project replaces it with a real adapter; the contract and the service
 * stay identical.
 *
 * Agnostic (no React/RN import) → `node --test`-able.
 */
import type { NetworkAdapter } from './network-adapter';
import {
  normalizeConnectionType,
  normalizeNetworkStatus,
  type NetworkSnapshot,
} from './network-state';

/** A placeholder adapter with an extra `setStatus` for wiring/tests. */
export interface PlaceholderNetworkAdapter extends NetworkAdapter {
  /** Simulate an OS connectivity change (bare status or a full snapshot). */
  setStatus(input: unknown): void;
}

function toSnapshot(input: unknown): NetworkSnapshot {
  const source =
    typeof input === 'object' && input !== null
      ? (input as { status?: unknown; type?: unknown })
      : { status: input };
  return {
    status: normalizeNetworkStatus(source.status),
    type: normalizeConnectionType(source.type),
  };
}

/** Create an in-memory placeholder network adapter (no native dependency). */
export function createPlaceholderNetworkAdapter(initial: unknown = 'unknown'): PlaceholderNetworkAdapter {
  let current = toSnapshot(initial);
  const listeners = new Set<(snapshot: NetworkSnapshot) => void>();

  return {
    getStatus: () => current,
    subscribe: (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    setStatus: (input) => {
      const next = toSnapshot(input);
      if (next.status !== current.status || next.type !== current.type) {
        current = next;
        for (const listener of listeners) {
          listener(current);
        }
      }
    },
  };
}
