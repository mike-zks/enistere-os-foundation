/**
 * useAuthedMutation — a TanStack Query `useMutation` for AUTHENTICATED writes.
 *
 * Like {@link useAuthedQuery}, it wraps the caller's `mutationFn` in
 * {@link authedRequest} (RN 4B) so the `401 → refresh → one retry → purge`
 * bridge applies. The official client never stores tokens; the in-memory access
 * token is injected by the session adapter.
 *
 * Mutations DO NOT retry by default (RN 5 constraint): a failed write must not be
 * silently replayed. `retry: false` is set here and can be overridden explicitly
 * per call if a caller really needs it. No optimistic logic and no business
 * payloads live here — those belong to feature modules in consuming apps.
 */
import {
  useMutation,
  type UseMutationOptions,
  type UseMutationResult,
} from '@tanstack/react-query';

import { authedRequest } from '../api';

export type AuthedMutationOptions<TData, TVariables, TContext> = Omit<
  UseMutationOptions<TData, Error, TVariables, TContext>,
  'mutationFn'
> & {
  readonly mutationFn: (variables: TVariables) => Promise<TData>;
};

export function useAuthedMutation<TData, TVariables = void, TContext = unknown>(
  options: AuthedMutationOptions<TData, TVariables, TContext>,
): UseMutationResult<TData, Error, TVariables, TContext> {
  const { mutationFn, ...rest } = options;
  return useMutation<TData, Error, TVariables, TContext>({
    retry: false,
    ...rest,
    mutationFn: (variables) => authedRequest(() => mutationFn(variables)),
  });
}
