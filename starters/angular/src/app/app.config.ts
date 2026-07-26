import { ApplicationConfig } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { routes } from './app.routes';
import { APP_BASE_URL } from './core/config/api-config';
import { WEB_RUNTIME_PROVIDERS } from './core/platform/runtime.providers';
import { correlationInterceptor } from './core/interceptors/correlation.interceptor';
import { logInterceptor } from './core/interceptors/log.interceptor';
import { errorInterceptor } from './core/interceptors/error.interceptor';

// Base interceptor order: log starts the request timer → error maps failures to the
// canonical AppApiError. The auth/refresh interceptors belong to the Auth capability.
export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(
      withFetch(),
      withInterceptors([correlationInterceptor, logInterceptor, errorInterceptor]),
    ),
    provideAnimationsAsync(),
    // Relative URLs by default — override per-environment via Angular fileReplacements.
    { provide: APP_BASE_URL, useValue: '' },
    ...WEB_RUNTIME_PROVIDERS,
  ],
};
