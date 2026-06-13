/**
 * Framework-agnostic network connectivity service (RN 16 — network status).
 *
 * Tracks a normalised {@link NetworkState} (the RN 3 model + optional connection
 * type) on top of a {@link NetworkAdapter}: it reads the initial reading,
 * normalises every change (adapter-driven or manual via
 * {@link NetworkService.transition}), stamps `changedAt` on a STATUS change via
 * an injected clock, and fans the result out to its own subscribers.
 *
 * Integration with RN 3 : `getStatus()` returns a `NetworkState`, so the
 * CANONICAL `shouldQueueMutations(service.getStatus())` keeps working unchanged
 * (queue unless positively `online`). A `shouldQueue()` convenience mirrors it.
 *
 * Best-effort / non-intrusive : a failing adapter never breaks the app flow
 * (caught + safe `warn`, state defaults to `unknown`); a throwing listener is
 * isolated. Logging (ADR-040 / RN 8) : enum metadata ONLY (`{ from, to, type }`
 * / `{ operation }`) — never device/PII/payload data.
 *
 * PURE / framework-agnostic (no React/RN import; clock injected) → `node --test`.
 */
import type { Logger } from '../logger/logger';
import { NetworkAdapterError, type NetworkAdapter } from './network-adapter';
import {
  initialNetworkState,
  normalizeConnectionType,
  normalizeNetworkStatus,
  shouldQueueMutations,
  type NetworkConnectionType,
  type NetworkState,
  type NetworkStatus,
} from './network-state';

export interface NetworkService {
  /** Current (normalised) connectivity state — feeds `shouldQueueMutations`. */
  getStatus(): NetworkState;
  /** Convenience: `shouldQueueMutations(getStatus())` (queue unless online). */
  shouldQueue(): boolean;
  /** Observe connectivity changes; returns an unsubscribe function. */
  subscribe(listener: (state: NetworkState) => void): () => void;
  /** Push a candidate reading (bare status or `{ status, type }`); returns the state. */
  transition(input: unknown): NetworkState;
  /** Tear down the adapter subscription and drop all listeners. */
  dispose(): void;
}

export interface NetworkServiceOptions {
  readonly adapter: NetworkAdapter;
  /** Optional RN 8 logger (enum metadata only). */
  readonly logger?: Logger;
  /** Injected clock for `changedAt` (default `Date.now`). */
  readonly clock?: () => number;
}

function readStatus(input: unknown): { status: NetworkStatus; type: NetworkConnectionType } {
  const source =
    typeof input === 'object' && input !== null
      ? (input as { status?: unknown; type?: unknown })
      : { status: input };
  return {
    status: normalizeNetworkStatus(source.status),
    type: normalizeConnectionType(source.type),
  };
}

/** Build a {@link NetworkService} over a network adapter (+ optional logger/clock). */
export function createNetworkService(options: NetworkServiceOptions): NetworkService {
  const { adapter, logger } = options;
  const clock = options.clock ?? (() => Date.now());

  let current: NetworkState;
  try {
    const initial = readStatus(adapter.getStatus());
    current =
      initial.status === 'unknown'
        ? { ...initialNetworkState, type: initial.type }
        : { status: initial.status, changedAt: clock(), type: initial.type };
  } catch {
    logger?.warn('network getStatus failed', {
      operation: new NetworkAdapterError('getStatus').operation,
    });
    current = { ...initialNetworkState, type: 'unknown' };
  }

  const listeners = new Set<(state: NetworkState) => void>();

  function apply(input: unknown): NetworkState {
    const { status, type } = readStatus(input);
    const statusChanged = status !== current.status;
    if (!statusChanged && type === current.type) {
      return current;
    }
    const from = current.status;
    current = {
      status,
      // `changedAt` tracks the last STATUS change (RN 3 contract); a type-only
      // change keeps the previous timestamp.
      changedAt: statusChanged ? clock() : current.changedAt,
      type,
    };
    logger?.debug('network transition', { from, to: status, type });
    for (const listener of listeners) {
      try {
        listener(current);
      } catch {
        logger?.warn('network listener failed');
      }
    }
    return current;
  }

  let adapterUnsubscribe: (() => void) | null = null;
  try {
    adapterUnsubscribe = adapter.subscribe((snapshot) => {
      apply(snapshot);
    });
  } catch {
    logger?.warn('network subscribe failed', {
      operation: new NetworkAdapterError('subscribe').operation,
    });
  }

  return {
    getStatus: () => current,
    shouldQueue: () => shouldQueueMutations(current),
    subscribe: (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    transition: (input) => apply(input),
    dispose: () => {
      if (adapterUnsubscribe) {
        try {
          adapterUnsubscribe();
        } catch {
          /* ignore teardown errors */
        }
        adapterUnsubscribe = null;
      }
      listeners.clear();
    },
  };
}
