import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { RouterTestingHarness } from '@angular/router/testing';
import { routes } from './app.routes';
import { AuthApi, PlaceholderAuthApi } from './core/auth/auth.api';

describe('App Navigation Integration (RouterTestingHarness)', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [
        provideRouter(routes),
        provideNoopAnimations(),
        { provide: AuthApi, useClass: PlaceholderAuthApi },
      ],
    }).compileComponents();
  });

  it('renders HomeComponent at "/"', async () => {
    const harness = await RouterTestingHarness.create('/');
    expect(harness.routeNativeElement?.tagName.toLowerCase()).toBe('app-home');
  });

  it('renders LoginComponent at "/login" for a guest', async () => {
    const harness = await RouterTestingHarness.create('/login');
    expect(harness.routeNativeElement?.tagName.toLowerCase()).toBe('app-login');
  });

  it('redirects "/dashboard" to "/login" when unauthenticated', async () => {
    await RouterTestingHarness.create('/dashboard');
    const router = TestBed.inject(Router);
    expect(router.url).toContain('/login');
  });

  it('includes returnUrl query param when redirected from "/dashboard"', async () => {
    await RouterTestingHarness.create('/dashboard');
    const router = TestBed.inject(Router);
    expect(router.url).toContain('returnUrl');
  });

  it('redirects unknown wildcard path to "/"', async () => {
    await RouterTestingHarness.create('/page-inconnue');
    const router = TestBed.inject(Router);
    expect(router.url).toBe('/');
  });
});
