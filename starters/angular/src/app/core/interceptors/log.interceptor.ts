import { HttpEventType, HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { tap } from 'rxjs';
import { isAppApiError } from '../errors/app-api-error';
import {
  createRequestContext,
  runtimeLogger,
  runtimeTelemetry,
} from '../platform/runtime-contract';

// Extracts only the pathname from a URL, stripping query params and fragment.
// Prevents signed URL parameters, tokens, or sensitive query params from being logged.
function sanitizePath(url: string): string {
  try {
    // Handles both absolute (http://host/path?q=1) and relative (/path?q=1) URLs
    const parsed = new URL(url, 'http://placeholder');
    return parsed.pathname;
  } catch {
    // If URL parsing fails, strip everything after the first '?'
    const qIndex = url.indexOf('?');
    return qIndex === -1 ? url : url.slice(0, qIndex);
  }
}

export const logInterceptor: HttpInterceptorFn = (req, next) => {
  const started = Date.now();
  const method = req.method;
  const path = sanitizePath(req.url);
  const context = createRequestContext({
    requestId: req.headers.get('x-request-id'),
    traceparent: req.headers.get('traceparent'),
  });

  return next(req).pipe(
    tap({
      next: (event) => {
        if (event.type === HttpEventType.Response) {
          const status = (event as HttpResponse<unknown>).status;
          const duration = Date.now() - started;
          // NEVER log: body, Authorization header, query params, signed URLs, tokens.
          runtimeLogger.write('info', 'http.request.completed', {
            method,
            path,
            status,
            durationMs: duration,
            requestId: context.requestId,
            traceparent: context.traceparent,
          });
          runtimeTelemetry.recordRequest(context, 'success', duration);
        }
      },
      error: (err: unknown) => {
        const duration = Date.now() - started;
        // AppApiError arrives here (error interceptor is innermost, runs first on errors).
        // Log statusCode only — never body, headers, or raw error details.
        const statusCode = isAppApiError(err) ? err.statusCode ?? 'network' : 'unknown';
        runtimeLogger.write('error', 'http.request.failed', {
          method,
          path,
          statusCode,
          durationMs: duration,
          requestId: context.requestId,
          traceparent: context.traceparent,
        });
        runtimeTelemetry.recordRequest(context, 'error', duration);
      },
    }),
  );
};
