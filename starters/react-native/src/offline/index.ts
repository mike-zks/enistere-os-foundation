/**
 * Offline-ready + network connectivity primitives (RN 3 + RN 16).
 *
 * PREPARATORY only: an abstract network-state model (RN 3) extended with a
 * generic connectivity layer (RN 16 — adapter seam, placeholder, service), a
 * neutral offline-mutation envelope, and an in-memory FIFO queue. No real
 * NetInfo detection, no persistence, no automatic replay, no sensitive data
 * (ADR-015 §19). `shouldQueueMutations` stays the CANONICAL queue decision. See
 * each module header and `ARCHITECTURE.md` §11 / §25.
 */
export {
  initialNetworkState,
  networkState,
  isOnline,
  isOffline,
  shouldQueueMutations,
  normalizeNetworkStatus,
  normalizeConnectionType,
} from './network-state';
export type {
  NetworkStatus,
  NetworkState,
  NetworkConnectionType,
  NetworkSnapshot,
} from './network-state';

export { NetworkAdapterError } from './network-adapter';
export type { NetworkAdapter } from './network-adapter';

export { createPlaceholderNetworkAdapter } from './placeholder-network-adapter';
export type { PlaceholderNetworkAdapter } from './placeholder-network-adapter';

export { createNetworkService } from './network-service';
export type { NetworkService, NetworkServiceOptions } from './network-service';

export {
  createOfflineMutation,
  isOfflineMutation,
  OfflineMutationError,
} from './mutation';
export type { OfflineMutation, CreateOfflineMutationInput } from './mutation';

export { OfflineMutationQueue } from './queue';
export type { OfflineMutationQueueOptions } from './queue';
