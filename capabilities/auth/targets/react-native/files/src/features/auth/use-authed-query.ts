/**
 * useAuthedQuery — a TanStack Query `useQuery` for AUTHENTICATED reads.
 *
 * It is the MANDATORY way to read authenticated server state (RN 5): the caller
 * provides a plain async `queryFn` that calls the official client (e.g.
 * `() => apiClient.auth.getProfile()`), and this hook wraps it in
 * {@link authedRequest} (RN 4B) so the 401 bridge applies automatically —
 * `401 → AuthEngine.refreshSession() (coalesced) → one retry → purge on failure`.
 * Callers therefore CANNOT forget the auth/refresh path.
 *
 * Retry: the `QueryClient` already never retries a `401` (it surfaces the raw
 * `ApiClientError` for that decision) and bounds other retries. This hook does
 * NOT normalise the error (so the retry policy keeps seeing `ApiClientError`);
 * normalise for display with `toQueryError(query.error)`.
 *
 * Public (unauthenticated) reads use plain `useQuery` — not this hook.
 */
import {
  useQuery,
  type QueryFunctionContext,
  type QueryKey,
  type UseQueryOptions,
  type UseQueryResult,
} from '@tanstack/react-query';

import { authedRequest } from '../../features/auth/api-client';

export type AuthedQueryOptions<TData, TKey extends QueryKey> = Omit<
  UseQueryOptions<TData, Error, TData, TKey>,
  'queryFn'
> & {
  readonly queryKey: TKey;
  readonly queryFn: (context: QueryFunctionContext<TKey>) => Promise<TData>;
};

export function useAuthedQuery<TData, TKey extends QueryKey = QueryKey>(
  options: AuthedQueryOptions<TData, TKey>,
): UseQueryResult<TData, Error> {
  const { queryFn, ...rest } = options;
  return useQuery<TData, Error, TData, TKey>({
    ...rest,
    queryFn: (context) => authedRequest(() => queryFn(context)),
  });
}
