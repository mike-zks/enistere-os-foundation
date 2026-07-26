import { HttpInterceptorFn } from '@angular/common/http';
import { createRequestContext } from '../platform/runtime-contract';

export const correlationInterceptor: HttpInterceptorFn = (request, next) => {
  const context = createRequestContext({
    requestId: request.headers.get('x-request-id'),
    traceparent: request.headers.get('traceparent'),
  });
  return next(request.clone({
    setHeaders: {
      'X-Request-Id': context.requestId,
      traceparent: context.traceparent,
    },
  }));
};
