/**
 * Server-state data layer — composition `base + auth`. Ce fichier REMPLACE
 * (remplacement déclaré par l'overlay Auth) l'index de la baseline pour ré-exposer
 * les hooks authentifiés (`useAuthedQuery`/`useAuthedMutation`) qui s'appuient sur
 * le pont 401 possédé par l'AuthEngine (`../api`).
 *
 * Rules (see ARCHITECTURE §14):
 * - authenticated reads/writes go through `useAuthedQuery`/`useAuthedMutation`
 *   (which wrap the request in `authedRequest` → the RN 4B 401 bridge);
 * - the `QueryClient` never retries a `401`; mutations never retry by default;
 * - keys come from `createQueryKeys` (never put a secret in a key);
 * - errors are normalised for the UI with `toQueryError` (no sensitive data);
 * - on logout the auth layer calls `purgeServerState(queryClient)`.
 */
export { createQueryClient, queryClient } from './query-client';
export { QueryProvider } from './QueryProvider';

export { createQueryKeys, normalizeParams } from './query-keys';
export type { QueryKey, QueryKeyId, QueryKeyParams, QueryKeys } from './query-keys';

export { toQueryError } from './query-errors';
export type { QueryError, QueryErrorKind } from './query-errors';

export { useAuthedQuery } from '../features/auth/use-authed-query';
export type { AuthedQueryOptions } from '../features/auth/use-authed-query';
export { useAuthedMutation } from '../features/auth/use-authed-mutation';
export type { AuthedMutationOptions } from '../features/auth/use-authed-mutation';

export { invalidateScope, removeScope, purgeServerState } from './invalidation';
