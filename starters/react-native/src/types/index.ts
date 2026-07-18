/**
 * Shared, framework-agnostic helper types used across the starter.
 *
 * Keep this module generic: no business/domain types belong here.
 */

/** A value that may be absent. */
export type Nullable<T> = T | null;

/** A value that may be absent or undefined. */
export type Maybe<T> = T | null | undefined;

/** Discriminated async state used by UI and hooks for loading/error/data. */
export type AsyncState<TData, TError = Error> =
  | { readonly status: 'idle' }
  | { readonly status: 'loading' }
  | { readonly status: 'success'; readonly data: TData }
  | { readonly status: 'error'; readonly error: TError };
