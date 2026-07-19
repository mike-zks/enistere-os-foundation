/**
 * Server-state data layer (RN 5) — generic TanStack Query (ADR-012) over the
 * official client. No business endpoints, no domain schema.
 *
 * Baseline `base` : couche générique uniquement (QueryProvider, QueryClient, clés,
 * invalidation, normalisation d'erreurs). Les hooks authentifiés
 * (`useAuthedQuery`/`useAuthedMutation`, pont 401) sont apportés par la capability
 * Auth composée, qui remplace ce fichier via son overlay.
 *
 * Rules (see ARCHITECTURE §14):
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

export { invalidateScope, removeScope, purgeServerState } from './invalidation';
