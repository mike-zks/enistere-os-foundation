/**
 * AuthProvider — thin React binding over {@link AuthEngine}.
 *
 * The provider owns no auth logic: it subscribes to the engine's state via
 * `useSyncExternalStore`, runs `restoreSession` on mount, and bridges the
 * official client's Bearer injection to the engine's in-memory access token (via
 * {@link mobileAuthSession}). This keeps the auth/session logic framework-
 * agnostic and unit-testable (see `test/`).
 *
 * Governance: the default engine uses the REAL {@link EnistereAuthApi} (official
 * `@enistere/api-client-fetch`, ADR-016); the access token stays in the engine's
 * memory (ADR-015), the client reads it lazily, and the engine owns the coalesced
 * refresh on 401/expiry (ADR-004/011).
 */
import { useEffect, useMemo, useSyncExternalStore, type PropsWithChildren } from 'react';

import { apiClient } from '../api';
import { purgeServerState, queryClient } from '../query';
import { sessionStore } from '../storage';
import { AuthContext, type AuthContextValue } from './auth-context';
import { AuthEngine } from './auth-engine';
import { EnistereAuthApi } from './enistere-auth-api';
import { mobileAuthSession } from './session-adapter';

/**
 * Default app-wide engine: SecureStore-backed session store + the REAL auth API
 * over the official typed client. Inject a custom engine in tests.
 */
const defaultEngine = new AuthEngine({
  sessionStore,
  authApi: new EnistereAuthApi(apiClient),
});

export interface AuthProviderProps extends PropsWithChildren {
  /** Inject a custom engine (tests / alternate transports). */
  readonly engine?: AuthEngine;
}

export function AuthProvider({ engine, children }: AuthProviderProps): React.JSX.Element {
  const authEngine = engine ?? defaultEngine;
  const state = useSyncExternalStore(authEngine.subscribe, authEngine.getSnapshot);

  useEffect(() => {
    // Bridge the official client to the engine: Bearer injection reads the
    // in-memory access token; the 401 bridge (authedRequest) uses the engine's
    // COALESCED refresh. The client never stores a token, never refreshes itself.
    mobileAuthSession.bind({
      getAccessToken: authEngine.getAccessToken,
      refreshSession: authEngine.refreshSession,
    });
    void authEngine.restoreSession();
    return () => {
      mobileAuthSession.unbind();
    };
  }, [authEngine]);

  // Purge ALL server state whenever the session ends — logout (`signOut`) OR
  // expiry/internal `clearSession` (both resolve to `unauthenticated`/`expired`).
  // No previous user's cached data survives (ADR-015 §18). `purgeServerState` is
  // deterministic (awaits `cancelQueries` then `clear`). AuthEngine is unchanged.
  useEffect(() => {
    if (state.status === 'unauthenticated' || state.status === 'expired') {
      void purgeServerState(queryClient);
    }
  }, [state.status]);

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
