import { routes, APP_ROUTES } from './app.routes';
import { authGuard } from './core/auth/auth.guard';
import { guestGuard } from './core/auth/guest.guard';

describe('App routes configuration', () => {
  it('defines a home route at empty path', () => {
    const homeRoute = routes.find((r) => r.path === APP_ROUTES.HOME);
    expect(homeRoute).toBeTruthy();
    expect(homeRoute?.loadComponent).toBeTruthy();
  });

  it('defines a login route', () => {
    const loginRoute = routes.find((r) => r.path === APP_ROUTES.LOGIN);
    expect(loginRoute).toBeTruthy();
    expect(loginRoute?.loadComponent).toBeTruthy();
  });

  it('login route is protected by guestGuard', () => {
    const loginRoute = routes.find((r) => r.path === APP_ROUTES.LOGIN);
    expect(loginRoute?.canActivate).toContain(guestGuard);
  });

  it('defines a dashboard route', () => {
    const dashboardRoute = routes.find((r) => r.path === APP_ROUTES.DASHBOARD);
    expect(dashboardRoute).toBeTruthy();
    expect(dashboardRoute?.loadComponent).toBeTruthy();
  });

  it('dashboard route is protected by authGuard', () => {
    const dashboardRoute = routes.find((r) => r.path === APP_ROUTES.DASHBOARD);
    expect(dashboardRoute?.canActivate).toContain(authGuard);
  });

  it('defines a wildcard route as safe fallback', () => {
    const wildcardRoute = routes.find((r) => r.path === '**');
    expect(wildcardRoute).toBeTruthy();
    expect(wildcardRoute?.redirectTo).toBeDefined();
  });

  it('wildcard route redirects to home (not login)', () => {
    const wildcardRoute = routes.find((r) => r.path === '**');
    expect(wildcardRoute?.redirectTo).toBe(APP_ROUTES.HOME);
  });
});
