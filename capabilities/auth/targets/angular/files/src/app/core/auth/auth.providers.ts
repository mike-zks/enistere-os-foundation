import { type EnvironmentProviders, makeEnvironmentProviders } from '@angular/core';

/**
 * Providers contributed by the Auth capability.
 *
 * Deliberately **one** value, not an array. The `angular.provider` integration
 * declares a single symbol, and the composition file lists it as one element:
 * a capability exporting an array would either break the element type or rely on
 * Angular flattening nested arrays — which `EnvironmentProviders` does not allow.
 * `makeEnvironmentProviders` is Angular's supported way to bundle any number of
 * providers behind one value, and it is what `provideX()` functions return.
 *
 * The bundle is empty today: `AuthService`, `AuthApi` and the credential store
 * are all `providedIn: 'root'`, so the composition needs no registration. The
 * seam is declared anyway — a deployment overriding `CREDENTIAL_STORE` (an
 * HttpOnly cookie transport, for instance) has a documented place to do it.
 */
export const AUTH_PROVIDERS: EnvironmentProviders = makeEnvironmentProviders([]);
