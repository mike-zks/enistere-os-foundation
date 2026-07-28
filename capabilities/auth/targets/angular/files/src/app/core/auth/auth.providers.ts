import type { EnvironmentProviders, Provider } from '@angular/core';

/**
 * Providers contributed by the Auth capability.
 *
 * Empty today: `AuthService`, `AuthApi` and the credential store are all
 * `providedIn: 'root'`, so the composition needs no registration. The seam is
 * declared anyway — a deployment overriding CREDENTIAL_STORE (an HttpOnly cookie
 * transport, for instance) has a documented place to do it.
 */
export const AUTH_PROVIDERS: readonly (Provider | EnvironmentProviders)[] = [];
