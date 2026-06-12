/**
 * Auth session model — generic, backend-agnostic.
 *
 * Models the session shape and states an app needs, with no coupling to any
 * product's auth workflow. No registration logic, no roles, no business
 * identity (no seller/buyer/admin/delivery/shop/wallet/order/property…).
 */

/**
 * Canonical auth states (RN 2 hardening):
 * - `loading`         — restoring a persisted session on app start;
 * - `authenticated`   — a valid access token is held in memory;
 * - `unauthenticated` — signed out / no session;
 * - `refreshing`      — a refresh is in flight (was authenticated);
 * - `expired`         — the session could not be refreshed (re-auth required).
 */
export type AuthStatus =
  | 'loading'
  | 'authenticated'
  | 'unauthenticated'
  | 'refreshing'
  | 'expired';

/** Minimal, generic user identity. Real fields come from `GET /me` later. */
export interface AuthUser {
  readonly id: string;
  readonly displayName: string | null;
}

/**
 * Full session held INSIDE the auth engine. Tokens are opaque strings here.
 * The access token lives in memory only (ADR-015); it never enters persisted
 * storage nor the React-facing snapshot.
 */
export interface AuthSession {
  readonly accessToken: string;
  readonly refreshToken: string | null;
  readonly user: AuthUser | null;
  /** Epoch ms when the access token expires, if known. */
  readonly expiresAt: number | null;
}

/**
 * Token-free view of the session exposed to React/components. Deliberately
 * omits tokens so they never reach the component tree, logs, or dev tools.
 */
export interface SessionSnapshot {
  readonly user: AuthUser | null;
  readonly expiresAt: number | null;
}

/** Generic credentials accepted by `signIn` (email/password — API Core `LoginDto`). */
export interface SignInInput {
  readonly email: string;
  readonly password?: string;
}

export interface AuthState {
  readonly status: AuthStatus;
  readonly session: SessionSnapshot | null;
  readonly error: string | null;
}

export const initialAuthState: AuthState = {
  status: 'loading',
  session: null,
  error: null,
};
