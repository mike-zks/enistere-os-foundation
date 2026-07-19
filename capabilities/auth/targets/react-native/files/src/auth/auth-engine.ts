/**
 * AuthEngine — framework-agnostic auth/session state machine (no React/RN).
 *
 * It owns the canonical session lifecycle so the logic is unit-testable in
 * isolation (Node `node --test`) and reusable across UI layers. React binds to
 * it via `subscribe`/`getSnapshot` (see `AuthProvider`).
 *
 * Governance:
 * - ADR-015: the ACCESS TOKEN lives in memory here (`accessToken`); only the
 *   refresh-token envelope is persisted via {@link SessionStore}. Logout purges
 *   storage + memory. Tokens never enter the React-facing snapshot.
 * - ADR-004: short access token + revocable refresh; expiry → refresh → either
 *   re-authenticated or `expired`.
 * - ADR-011: the engine exposes `getAccessToken()` to the API client's token
 *   provider; the client never stores tokens.
 *
 * Concurrency: `refreshSession()` is coalesced — concurrent callers share one
 * in-flight refresh (prevents double refresh / token stampede).
 */
import { SessionStore } from '../storage/session-store';
import { AuthApi, AuthSessionData } from './auth-api';
import { AuthState, AuthUser, SessionSnapshot, SignInInput, initialAuthState } from './session';

export interface AuthEngineDeps {
  readonly sessionStore: SessionStore;
  readonly authApi: AuthApi;
  /** Injectable clock for deterministic expiry tests. */
  readonly now?: () => number;
}

export class AuthEngine {
  private readonly sessionStore: SessionStore;
  private readonly authApi: AuthApi;
  private readonly now: () => number;

  private state: AuthState = initialAuthState;
  private readonly listeners = new Set<() => void>();

  /** In-memory only (ADR-015). */
  private accessToken: string | null = null;
  private accessTokenExpiresAt: number | null = null;
  private refreshToken: string | null = null;

  /** Coalesces concurrent refreshes into one in-flight promise. */
  private inFlightRefresh: Promise<string | null> | null = null;

  constructor(deps: AuthEngineDeps) {
    this.sessionStore = deps.sessionStore;
    this.authApi = deps.authApi;
    this.now = deps.now ?? (() => Date.now());
  }

  // --- store interface (for React useSyncExternalStore) ---

  readonly subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  readonly getSnapshot = (): AuthState => this.state;

  /**
   * The current in-memory access token, or `null` if absent OR already expired
   * (proactive expiry detection). A `null` here makes the API client send the
   * request unauthenticated → `401` → coalesced refresh.
   */
  readonly getAccessToken = (): string | null => {
    if (!this.accessToken) {
      return null;
    }
    if (this.accessTokenExpiresAt !== null && this.now() >= this.accessTokenExpiresAt) {
      return null;
    }
    return this.accessToken;
  };

  /** True when an access token is held and not past its expiry. */
  readonly hasValidAccessToken = (): boolean => this.getAccessToken() !== null;

  // --- actions ---

  /** Restores a persisted session on app start (refresh to mint a new token). */
  readonly restoreSession = async (): Promise<void> => {
    this.setState({ status: 'loading', session: null, error: null });
    const persisted = await this.sessionStore.load();
    if (!persisted) {
      this.clearMemory();
      this.setState({ status: 'unauthenticated', session: null, error: null });
      return;
    }
    this.refreshToken = persisted.refreshToken;
    // No access token survives a cold start (memory-only), so refresh to obtain
    // one. Success → authenticated; failure → expired (handled in doRefresh).
    await this.runRefresh();
  };

  /** Placeholder sign-in (no backend) — establishes a session. */
  readonly signIn = async (input: SignInInput): Promise<void> => {
    this.setState({ status: 'loading', session: null, error: null });
    try {
      const data = await this.authApi.login(input);
      await this.applyAuthenticated(data);
    } catch {
      await this.clearSession('Sign-in failed.');
    }
  };

  /**
   * Refreshes the session. Returns the new access token, or `null` if it could
   * not be refreshed (→ `expired`/`unauthenticated`). Concurrent calls share
   * one in-flight refresh.
   */
  readonly refreshSession = (): Promise<string | null> => {
    if (this.inFlightRefresh) {
      return this.inFlightRefresh;
    }
    this.inFlightRefresh = this.runRefresh().finally(() => {
      this.inFlightRefresh = null;
    });
    return this.inFlightRefresh;
  };

  /** Signs out: purge storage + memory; no backend call. */
  readonly signOut = async (): Promise<void> => {
    await this.clearSession(null);
  };

  /** Clears the session (storage + memory) and resets to unauthenticated. */
  readonly clearSession = async (error: string | null = null): Promise<void> => {
    try {
      await this.sessionStore.clear();
    } finally {
      this.clearMemory();
      this.setState({ status: 'unauthenticated', session: null, error });
    }
  };

  // --- internals ---

  private async runRefresh(): Promise<string | null> {
    const refreshToken = this.refreshToken;
    if (!refreshToken) {
      this.clearMemory();
      this.setState({ status: 'unauthenticated', session: null, error: null });
      return null;
    }
    this.setState({ status: 'refreshing', session: this.state.session, error: null });
    try {
      const data = await this.authApi.refresh(refreshToken);
      await this.applyAuthenticated(data);
      return data.accessToken;
    } catch {
      // Refresh failed → the session can no longer be recovered.
      await this.sessionStore.clear();
      this.clearMemory();
      this.setState({ status: 'expired', session: null, error: 'Session expired.' });
      return null;
    }
  }

  private async applyAuthenticated(data: AuthSessionData): Promise<void> {
    this.accessToken = data.accessToken;
    this.accessTokenExpiresAt = data.expiresAt;
    this.refreshToken = data.refreshToken;
    await this.sessionStore.save({
      refreshToken: data.refreshToken,
      expiresAt: data.expiresAt,
      user: data.user,
    });
    this.setState({
      status: 'authenticated',
      session: this.toSnapshot(data.user, data.expiresAt),
      error: null,
    });
  }

  private toSnapshot(user: AuthUser | null, expiresAt: number | null): SessionSnapshot {
    return { user, expiresAt };
  }

  private clearMemory(): void {
    this.accessToken = null;
    this.accessTokenExpiresAt = null;
    this.refreshToken = null;
  }

  private setState(next: AuthState): void {
    this.state = next;
    for (const listener of this.listeners) {
      listener();
    }
  }
}
