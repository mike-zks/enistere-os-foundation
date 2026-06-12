/**
 * Server-state data layer (RN 5) — generic TanStack Query (ADR-012) over the
 * official client. No business endpoints, no domain schema.
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

export { useAuthedQuery } from './use-authed-query';
export type { AuthedQueryOptions } from './use-authed-query';
export { useAuthedMutation } from './use-authed-mutation';
export type { AuthedMutationOptions } from './use-authed-mutation';

export { invalidateScope, removeScope, purgeServerState } from './invalidation';
