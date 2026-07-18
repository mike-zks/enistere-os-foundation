import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';
import { mapHttpError } from '../errors/app-api-error';

// Catches HttpErrorResponse and re-throws as AppApiError.
// 401 is surfaced as code: 'Unauthorized' — no automatic refresh in this mission.
// Never logs body, tokens, or raw error messages.
export const errorInterceptor: HttpInterceptorFn = (req, next) =>
  next(req).pipe(
    catchError((err: unknown) => {
      if (err instanceof HttpErrorResponse) {
        return throwError(() => mapHttpError(err));
      }
      // Non-HTTP errors (programming mistakes, etc.) pass through unchanged
      return throwError(() => err);
    }),
  );
