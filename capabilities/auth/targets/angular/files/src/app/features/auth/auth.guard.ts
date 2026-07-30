import { inject } from '@angular/core';
import { type CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

/**
 * Guards a route behind an authenticated session.
 *
 * Client-side only, and deliberately so: this decides what to *render*, never
 * what is *allowed*. The authority remains the sole authorization on every
 * request — a guard that could be bypassed by editing the URL must never be the
 * thing standing between a caller and data.
 */
export const authGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.isAuthenticated()) {
    return true;
  }
  // `returnTo` stays an internal path: accepting an absolute URL here would make
  // the login page an open redirector.
  return router.createUrlTree(['/login'], {
    queryParams: { returnTo: state.url.startsWith('/') ? state.url : '/' },
  });
};
