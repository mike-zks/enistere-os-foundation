/**
 * Offline-ready primitives (RN 3).
 *
 * PREPARATORY only: an abstract network-state model, a neutral offline-mutation
 * envelope, and an in-memory FIFO queue. No connectivity detection, no
 * persistence, no automatic replay, no sensitive data (ADR-015 §19). See each
 * module header and `ARCHITECTURE.md` §11.
 */
export {
  initialNetworkState,
  networkState,
  isOnline,
  isOffline,
  shouldQueueMutations,
} from './network-state';
export type { NetworkStatus, NetworkState } from './network-state';

export {
  createOfflineMutation,
  isOfflineMutation,
  OfflineMutationError,
} from './mutation';
export type { OfflineMutation, CreateOfflineMutationInput } from './mutation';

export { OfflineMutationQueue } from './queue';
export type { OfflineMutationQueueOptions } from './queue';
