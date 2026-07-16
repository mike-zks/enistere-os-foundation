import { ApplicationConfig, inject, provideAppInitializer } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { routes } from './app.routes';
import { APP_BASE_URL } from './core/config/api-config';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { errorInterceptor } from './core/interceptors/error.interceptor';
import { logInterceptor } from './core/interceptors/log.interceptor';
import { AuthService } from './core/auth/auth.service';

// Interceptor order: auth (outermost) → log → error (innermost).
// On request:  auth adds Bearer  → log starts timer  → error passes through.
// On response: error maps errors → log records result → auth sees typed AppApiError.
export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(
      withFetch(),
      withInterceptors([authInterceptor, logInterceptor, errorInterceptor]),
    ),
    provideAnimationsAsync(),
    provideAppInitializer(() => {
      inject(AuthService).restoreSession();
    }),
    // Relative URLs by default — override per-environment via Angular fileReplacements (Angular 5+).
    { provide: APP_BASE_URL, useValue: '' },
  ],
};
