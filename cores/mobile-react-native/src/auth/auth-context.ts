import { createContext } from 'react';

import type { AuthState, SignInInput } from './session';

/** Auth context: current state + the session actions (RN 2 hardening). */
export interface AuthContextValue extends AuthState {
  /** Sign in (email/password) via the official client (`EnistereAuthApi`). */
  signIn(input: SignInInput): Promise<void>;
  /** Clears the session and all persisted secrets. */
  signOut(): Promise<void>;
  /** Restores a session from secure storage on app start. */
  restoreSession(): Promise<void>;
  /** Refreshes the session; resolves to the new access token or `null`. */
  refreshSession(): Promise<string | null>;
  /** Purges the session (storage + memory) without a backend call. */
  clearSession(): Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
