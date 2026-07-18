import { InjectionToken } from '@angular/core';

export interface ApiConfig {
  readonly baseUrl: string;
  // Timeout: Angular HttpClient has no built-in request timeout.
  // Use the RxJS timeout() operator per-request, or AbortController via HttpContextToken.
  // Per-request timeout support is deferred to Angular 5+.
}

// Injection token for the API base URL.
// Provide in app.config.ts (or per-test via TestBed) — never hardcode secrets here.
export const APP_BASE_URL = new InjectionToken<string>('APP_BASE_URL');
