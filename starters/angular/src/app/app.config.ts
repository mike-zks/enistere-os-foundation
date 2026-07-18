import { ApplicationConfig, inject, provideAppInitializer } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { routes } from './app.routes';
import { APP_BASE_URL } from './core/config/api-config';
import { AuthApi, PlaceholderAuthApi } from './core/auth/auth.api';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { refreshInterceptor } from './core/interceptors/refresh.interceptor';
import { logInterceptor } from './core/interceptors/log.interceptor';
import { errorInterceptor } from './core/interceptors/error.interceptor';
import { AuthService } from './core/auth/auth.service';

// Interceptor array order: auth → refresh → log → error.
// On request:  auth adds Bearer → refresh passes through → log starts timer → error passes through.
// On response: error maps errors → log records result → refresh retries on 401 → auth sees result.
export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(
      withFetch(),
      withInterceptors([authInterceptor, refreshInterceptor, logInterceptor, errorInterceptor]),
    ),
    provideAnimationsAsync(),
    provideAppInitializer(() => {
      inject(AuthService).restoreSession();
    }),
    // Relative URLs by default — override per-environment via Angular fileReplacements (Angular 5+).
    { provide: APP_BASE_URL, useValue: '' },
    // Placeholder auth API — projects can replace this seam with a real backend adapter.
    { provide: AuthApi, useClass: PlaceholderAuthApi },
  ],
};
