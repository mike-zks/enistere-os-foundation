import { HttpErrorResponse, type HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, from, switchMap, throwError } from 'rxjs';
import { AUTH_ENDPOINT } from './auth-api';
import { AuthService } from './auth.service';

/**
 * Attaches the access token and recovers from a single expiry.
 *
 * Composed AFTER the baseline interceptors so the error it inspects is already
 * the canonical envelope. It never touches authentication endpoints themselves:
 * retrying a failed refresh through this interceptor is how a client loops.
 */
export const authInterceptor: HttpInterceptorFn = (request, next) => {
  if (request.context.get(AUTH_ENDPOINT)) {
    return next(request);
  }

  const auth = inject(AuthService);
  const withToken = (token: string | null) => (token
    ? request.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : request);

  return next(withToken(auth.accessToken)).pipe(
    catchError((error: unknown) => {
      if (!(error instanceof HttpErrorResponse) || error.status !== 401) {
        return throwError(() => error);
      }
      // Exactly one retry. A second 401 after a fresh token means the session is
      // genuinely gone, and retrying again would just loop against the authority.
      return from(auth.refresh()).pipe(
        switchMap((token) => (token
          ? next(withToken(token))
          : throwError(() => error))),
      );
    }),
  );
};
