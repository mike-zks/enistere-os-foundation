import { createContext } from 'react';

import type { AuthState, SignInInput } from './session';

/** Auth context: current state + the three placeholder actions. */
export interface AuthContextValue extends AuthState {
  /** Placeholder sign-in — establishes a session WITHOUT calling a backend. */
  signIn(input: SignInInput): Promise<void>;
  /** Clears the session and all persisted tokens. */
  signOut(): Promise<void>;
  /** Restores a session from secure storage on app start. */
  restoreSession(): Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
