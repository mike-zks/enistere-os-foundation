import { HttpErrorResponse } from '@angular/common/http';

export type ApiErrorCode =
  | 'BadRequest'
  | 'Unauthorized'
  | 'Forbidden'
  | 'NotFound'
  | 'Conflict'
  | 'FileTooLarge'
  | 'UnsupportedType'
  | 'ValidationError'
  | 'RateLimited'
  | 'ServerError'
  | 'NetworkError'
  | 'Unknown';

export interface AppApiError {
  readonly code: ApiErrorCode;
  readonly statusCode: number | null;
  readonly requestId: string | null;
}

export function isAppApiError(err: unknown): err is AppApiError {
  return (
    typeof err === 'object' &&
    err !== null &&
    'code' in err &&
    'statusCode' in err &&
    'requestId' in err
  );
}

export function mapHttpError(err: HttpErrorResponse): AppApiError {
  // Status 0 = network error (no HTTP response received)
  if (!err.status) {
    return { code: 'NetworkError', statusCode: null, requestId: null };
  }

  const requestId = err.headers?.get('x-request-id') ?? null;
  return { code: codeFromStatus(err.status), statusCode: err.status, requestId };
}

function codeFromStatus(status: number): ApiErrorCode {
  switch (status) {
    case 400: return 'BadRequest';
    case 401: return 'Unauthorized';
    case 403: return 'Forbidden';
    case 404: return 'NotFound';
    case 409: return 'Conflict';
    case 413: return 'FileTooLarge';
    case 415: return 'UnsupportedType';
    case 422: return 'ValidationError';
    case 429: return 'RateLimited';
    default:  return status >= 500 ? 'ServerError' : 'Unknown';
  }
}
