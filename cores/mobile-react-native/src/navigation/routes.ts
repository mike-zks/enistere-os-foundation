/**
 * Route constants + auth-based redirect resolution (spec §16).
 *
 * Expo Router is file-based: the `(public)` and `(app)` groups under `app/`
 * express the public vs authenticated navigation stacks. These constants keep
 * route strings out of components, and `resolveAuthRedirect` centralizes the
 * "where should this auth state land" rule used by the layouts.
 */
import type { AuthStatus } from '../auth';

export const ROUTES = {
  /** Public placeholder screen (unauthenticated stack). */
  signIn: '/sign-in',
  /** Authenticated placeholder screen (protected stack). */
  home: '/home',
} as const;

export type AppRoute = (typeof ROUTES)[keyof typeof ROUTES];

/**
 * Target route for a given auth state, or `null` while still loading (caller
 * should render a loading state and not redirect yet).
 */
export function resolveAuthRedirect(status: AuthStatus): AppRoute | null {
  switch (status) {
    case 'authenticated':
      return ROUTES.home;
    case 'unauthenticated':
      return ROUTES.signIn;
    case 'loading':
    default:
      return null;
  }
}
