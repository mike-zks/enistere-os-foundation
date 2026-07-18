import { Observable, catchError, map, of, startWith } from 'rxjs';
import { isAppApiError, type AppApiError } from '../errors/app-api-error';

export type RequestStatus = 'idle' | 'loading' | 'success' | 'error';

export interface RequestState<T> {
  readonly status: RequestStatus;
  readonly data: T | null;
  readonly error: AppApiError | null;
}

export function idleState<T>(): RequestState<T> {
  return { status: 'idle', data: null, error: null };
}

export function loadingState<T>(): RequestState<T> {
  return { status: 'loading', data: null, error: null };
}

export function successState<T>(data: T): RequestState<T> {
  return { status: 'success', data, error: null };
}

export function errorState<T>(error: AppApiError): RequestState<T> {
  return { status: 'error', data: null, error };
}

// Wraps a source Observable into a RequestState stream:
// emits loadingState immediately, then successState(data) or errorState(appError).
// If the source error is not an AppApiError, it falls back to code: 'Unknown'.
export function createRequestState<T>(
  source$: Observable<T>,
): Observable<RequestState<T>> {
  return source$.pipe(
    map((data) => successState<T>(data)),
    startWith(loadingState<T>()),
    catchError((err: unknown) => {
      const appError: AppApiError = isAppApiError(err)
        ? err
        : { code: 'Unknown', statusCode: null, requestId: null };
      return of(errorState<T>(appError));
    }),
  );
}
