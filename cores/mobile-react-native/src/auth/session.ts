/**
 * Auth session model — generic, backend-agnostic.
 *
 * This is a SHELL: it models the session shape and states an app needs, with no
 * coupling to any product's auth workflow. No registration logic, no roles, no
 * business identity.
 */

/** The three canonical auth states. */
export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

/** Minimal, generic user identity. Real fields come from `GET /me` later. */
export interface AuthUser {
  readonly id: string;
  readonly displayName: string | null;
}

/** An authenticated session. Tokens are opaque strings to this layer. */
export interface AuthSession {
  readonly accessToken: string;
  readonly refreshToken: string | null;
  readonly user: AuthUser | null;
  /** Epoch ms when the access token expires, if known. */
  readonly expiresAt: number | null;
}

/** Generic credentials accepted by the placeholder `signIn`. */
export interface SignInInput {
  readonly username: string;
  readonly password?: string;
}

export interface AuthState {
  readonly status: AuthStatus;
  readonly session: AuthSession | null;
  readonly error: string | null;
}

export const initialAuthState: AuthState = {
  status: 'loading',
  session: null,
  error: null,
};
