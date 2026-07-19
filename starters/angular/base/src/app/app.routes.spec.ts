import { APP_ROUTES, routes } from './app.routes';

describe('App routes configuration', () => {
  it('defines a lazy home route at the empty path', () => {
    const homeRoute = routes.find((route) => route.path === APP_ROUTES.HOME);
    expect(homeRoute?.loadComponent).toBeTruthy();
    expect(homeRoute?.canActivate).toBeUndefined();
  });

  it('redirects unknown paths to home', () => {
    const wildcardRoute = routes.find((route) => route.path === '**');
    expect(wildcardRoute?.redirectTo).toBe(APP_ROUTES.HOME);
  });

  it('contains no Auth route in the base starter', () => {
    expect(routes.some((route) => route.path === 'login')).toBeFalse();
    expect(routes.some((route) => route.path === 'dashboard')).toBeFalse();
  });
});
