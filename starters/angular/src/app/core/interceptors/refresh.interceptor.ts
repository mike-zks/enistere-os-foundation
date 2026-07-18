import { inject } from '@angular/core';
import { HttpInterceptorFn } from '@angular/common/http';
import { catchError, switchMap, throwError } from 'rxjs';
import { isAppApiError } from '../errors/app-api-error';
import { AuthService } from '../auth/auth.service';
import { isAuthEndpoint } from './auth.interceptor';

export const refreshInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);

  return next(req).pipe(
    catchError((err: unknown) => {
      if (
        isAppApiError(err) &&
        err.code === 'Unauthorized' &&
        authService.getAccessToken() !== null &&
        !isAuthEndpoint(req.url)
      ) {
        return authService.refreshSession().pipe(
          catchError((_refreshErr: unknown) => {
            authService.logout();
            return throwError(() => err);
          }),
          switchMap((newToken) => {
            const retryReq = req.clone({
              setHeaders: { Authorization: `Bearer ${newToken}` },
            });
            return next(retryReq);
          }),
        );
      }
      return throwError(() => err);
    }),
  );
};
