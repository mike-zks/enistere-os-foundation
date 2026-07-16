import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  provideRouter,
  Router,
  RouterStateSnapshot,
  UrlTree,
} from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { authGuard } from './auth.guard';
import { guestGuard } from './guest.guard';
import { AuthService } from './auth.service';

function fakeState(url: string): RouterStateSnapshot {
  return { url } as unknown as RouterStateSnapshot;
}

const fakeRoute = {} as ActivatedRouteSnapshot;

describe('authGuard', () => {
  let authService: AuthService;
  let router: Router;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideRouter([]), provideNoopAnimations()],
    });
    authService = TestBed.inject(AuthService);
    router = TestBed.inject(Router);
  });

  it('returns true when authenticated', () => {
    authService.login('user@example.com', 'pass');
    const result = TestBed.runInInjectionContext(() =>
      authGuard(fakeRoute, fakeState('/dashboard')),
    );
    expect(result).toBeTrue();
  });

  it('returns a UrlTree redirecting to /login when unauthenticated', () => {
    const result = TestBed.runInInjectionContext(() =>
      authGuard(fakeRoute, fakeState('/dashboard')),
    );
    expect(result).toBeInstanceOf(UrlTree);
    expect(router.serializeUrl(result as UrlTree)).toContain('/login');
  });

  it('includes internal returnUrl in redirect query params', () => {
    const result = TestBed.runInInjectionContext(() =>
      authGuard(fakeRoute, fakeState('/dashboard/settings')),
    );
    const serialized = router.serializeUrl(result as UrlTree);
    expect(serialized).toContain('returnUrl');
    expect(serialized).toContain('dashboard');
  });

  it('sanitizes protocol-relative returnUrl (anti open-redirect)', () => {
    const result = TestBed.runInInjectionContext(() =>
      authGuard(fakeRoute, fakeState('//evil.com/steal')),
    );
    const serialized = router.serializeUrl(result as UrlTree);
    expect(serialized).not.toContain('evil.com');
  });

  it('sanitizes external https returnUrl (anti open-redirect)', () => {
    const result = TestBed.runInInjectionContext(() =>
      authGuard(fakeRoute, fakeState('https://evil.com')),
    );
    const serialized = router.serializeUrl(result as UrlTree);
    expect(serialized).not.toContain('evil.com');
  });
});

describe('guestGuard', () => {
  let authService: AuthService;
  let router: Router;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideRouter([]), provideNoopAnimations()],
    });
    authService = TestBed.inject(AuthService);
    router = TestBed.inject(Router);
  });

  it('returns true when not authenticated', () => {
    const result = TestBed.runInInjectionContext(() =>
      guestGuard(fakeRoute, fakeState('/login')),
    );
    expect(result).toBeTrue();
  });

  it('returns a UrlTree redirecting to /dashboard when authenticated', () => {
    authService.login('user@example.com', 'pass');
    const result = TestBed.runInInjectionContext(() =>
      guestGuard(fakeRoute, fakeState('/login')),
    );
    expect(result).toBeInstanceOf(UrlTree);
    expect(router.serializeUrl(result as UrlTree)).toContain('/dashboard');
  });

  it('returns true after logout (user is no longer authenticated)', () => {
    authService.login('user@example.com', 'pass');
    authService.logout();
    const result = TestBed.runInInjectionContext(() =>
      guestGuard(fakeRoute, fakeState('/login')),
    );
    expect(result).toBeTrue();
  });
});
