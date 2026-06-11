/**
 * AuthProvider — generic auth SHELL. NO backend, NO business workflow.
 *
 * Governance:
 * - ADR-004: access token short + refresh token revocable; logout invalidates.
 * - ADR-015: the access token is held IN MEMORY here; only the refresh token is
 *   persisted (SecureStore via `tokenStore`). Logout clears the refresh token,
 *   drops the in-memory access token, and clears the TanStack Query cache
 *   (§17/§18 — no stale data from a previous user).
 * - ADR-011: the API client receives the access token through a provider; the
 *   client never stores tokens itself.
 *
 * `signIn`/`restoreSession` are PLACEHOLDERS: they establish a session without
 * calling any backend. A real implementation will POST credentials to API Core
 * (login) / exchange the refresh token (refresh) and hydrate the user via /me.
 */
import { useCallback, useEffect, useMemo, useReducer, useRef, type PropsWithChildren } from 'react';

import { apiClient } from '../api';
import { queryClient } from '../query';
import { tokenStore } from '../storage';
import { AuthContext, type AuthContextValue } from './auth-context';
import { initialAuthState, type AuthSession, type AuthState, type SignInInput } from './session';

type AuthAction =
  | { type: 'restoring' }
  | { type: 'authenticated'; session: AuthSession }
  | { type: 'unauthenticated' }
  | { type: 'error'; message: string };

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'restoring':
      return { status: 'loading', session: null, error: null };
    case 'authenticated':
      return { status: 'authenticated', session: action.session, error: null };
    case 'unauthenticated':
      return { status: 'unauthenticated', session: null, error: null };
    case 'error':
      return { status: 'unauthenticated', session: null, error: action.message };
    default:
      return state;
  }
}

/** PLACEHOLDER token minting — replace with a real API Core login/refresh call. */
function placeholderAccessToken(): string {
  return `placeholder-access-token.${Date.now()}`;
}

export function AuthProvider({ children }: PropsWithChildren): React.JSX.Element {
  const [state, dispatch] = useReducer(authReducer, initialAuthState);

  // The token provider must always read the freshest access token, so mirror it
  // into a ref rather than capturing it in a closure.
  const accessTokenRef = useRef<string | null>(null);
  accessTokenRef.current = state.session?.accessToken ?? null;

  const restoreSession = useCallback(async (): Promise<void> => {
    dispatch({ type: 'restoring' });
    try {
      const refreshToken = await tokenStore.getRefreshToken();
      if (!refreshToken) {
        dispatch({ type: 'unauthenticated' });
        return;
      }
      // PLACEHOLDER: a real app would exchange the refresh token for a fresh
      // access token and load the profile (GET /me). The shell mints a local,
      // in-memory placeholder access token instead.
      dispatch({
        type: 'authenticated',
        session: {
          accessToken: placeholderAccessToken(),
          refreshToken,
          user: null,
          expiresAt: null,
        },
      });
    } catch {
      dispatch({ type: 'error', message: 'Failed to restore the session.' });
    }
  }, []);

  const signIn = useCallback(async (input: SignInInput): Promise<void> => {
    dispatch({ type: 'restoring' });
    try {
      // PLACEHOLDER: no backend call. A real impl POSTs `input` to API Core and
      // stores the returned tokens. We keep the access token in memory and
      // persist only the refresh token (ADR-015).
      const issuedAt = Date.now();
      const session: AuthSession = {
        accessToken: placeholderAccessToken(),
        refreshToken: `placeholder-refresh-token.${issuedAt}`,
        user: { id: 'placeholder-user', displayName: input.username },
        expiresAt: issuedAt + 15 * 60_000,
      };
      await tokenStore.saveRefreshToken(session.refreshToken!);
      dispatch({ type: 'authenticated', session });
    } catch {
      dispatch({ type: 'error', message: 'Sign-in failed.' });
    }
  }, []);

  const signOut = useCallback(async (): Promise<void> => {
    try {
      await tokenStore.clear();
    } finally {
      // Drop server cache so no previous-user data survives the logout (ADR-015 §17/§18).
      queryClient.clear();
      dispatch({ type: 'unauthenticated' });
    }
  }, []);

  // Wire the API client's token provider once; it reads the in-memory token.
  useEffect(() => {
    apiClient.setTokenProvider(() => accessTokenRef.current);
    return () => apiClient.setTokenProvider(undefined);
  }, []);

  // Restore any persisted session on app start.
  useEffect(() => {
    void restoreSession();
  }, [restoreSession]);

  const value = useMemo<AuthContextValue>(
    () => ({ ...state, signIn, signOut, restoreSession }),
    [state, signIn, signOut, restoreSession],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
