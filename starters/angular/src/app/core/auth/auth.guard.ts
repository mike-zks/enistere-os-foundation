import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';
import { sanitizeReturnUrl } from './return-url.utils';

export const authGuard: CanActivateFn = (_route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    return true;
  }

  const returnUrl = sanitizeReturnUrl(state.url);
  return router.createUrlTree(['/login'], { queryParams: { returnUrl } });
};
