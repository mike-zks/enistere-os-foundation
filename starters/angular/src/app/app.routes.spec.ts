import { CAPABILITY_ROUTES } from './core/composition/capability-routes';
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

  it('contributes no route of its own beyond home and the wildcard', () => {
    // The baseline owns exactly two routes. Anything else in `routes` came from
    // a composed capability through the seam — asserting their absence here
    // would make the baseline test fail the moment composition does its job.
    const ownRoutes = routes.filter((route) => !CAPABILITY_ROUTES.includes(route));
    expect(ownRoutes.map((route) => route.path)).toEqual([APP_ROUTES.HOME, '**']);
  });

  it('places contributed routes before the wildcard', () => {
    // After the wildcard they would be unreachable: every path would redirect
    // home before ever matching.
    const wildcardIndex = routes.findIndex((route) => route.path === '**');
    for (const contributed of CAPABILITY_ROUTES) {
      expect(routes.indexOf(contributed)).toBeLessThan(wildcardIndex);
    }
  });
});
