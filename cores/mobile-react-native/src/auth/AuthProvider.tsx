/**
 * AuthProvider — thin React binding over {@link AuthEngine}.
 *
 * The provider owns no auth logic: it subscribes to the engine's state via
 * `useSyncExternalStore`, runs `restoreSession` on mount, and wires the API
 * client's token provider + 401 handler to the engine. This keeps the auth/
 * session logic framework-agnostic and unit-testable (see `test/`).
 *
 * Governance: access token stays in the engine's memory (ADR-015); the client
 * reads it lazily and triggers a coalesced refresh on 401 (ADR-011/004).
 */
import { useEffect, useMemo, useSyncExternalStore, type PropsWithChildren } from 'react';

import { apiClient } from '../api';
import { sessionStore } from '../storage';
import { AuthContext, type AuthContextValue } from './auth-context';
import { PlaceholderAuthApi } from './auth-api';
import { AuthEngine } from './auth-engine';

/**
 * Default app-wide engine. Uses the SecureStore-backed session store and the
 * PLACEHOLDER auth API (no backend) — swap the API for the real
 * `@enistere/api-client-fetch` adapter in a later mission.
 */
const defaultEngine = new AuthEngine({
  sessionStore,
  authApi: new PlaceholderAuthApi(),
});

export interface AuthProviderProps extends PropsWithChildren {
  /** Inject a custom engine (tests / alternate transports). */
  readonly engine?: AuthEngine;
}

export function AuthProvider({ engine, children }: AuthProviderProps): React.JSX.Element {
  const authEngine = engine ?? defaultEngine;
  const state = useSyncExternalStore(authEngine.subscribe, authEngine.getSnapshot);

  useEffect(() => {
    // The client reads the in-memory access token and asks the engine to
    // refresh on 401 (engine coalesces concurrent refreshes).
    apiClient.setTokenProvider(authEngine.getAccessToken);
    apiClient.setUnauthorizedHandler(authEngine.refreshSession);
    void authEngine.restoreSession();
    return () => {
      apiClient.setTokenProvider(undefined);
      apiClient.setUnauthorizedHandler(undefined);
    };
  }, [authEngine]);

  const value = useMemo<AuthContextValue>(
    () => ({
      ...state,
      signIn: authEngine.signIn,
      signOut: authEngine.signOut,
      restoreSession: authEngine.restoreSession,
      refreshSession: authEngine.refreshSession,
      clearSession: authEngine.clearSession,
    }),
    [state, authEngine],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
