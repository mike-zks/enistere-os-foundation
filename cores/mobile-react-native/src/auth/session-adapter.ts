/**
 * MobileAuthSessionAdapter — bridges the official `@enistere/api-client-fetch`
 * client to the mobile auth layer (ADR-015/016 §27).
 *
 * Two responsibilities, both backed by the AuthEngine (lazily bound by
 * `AuthProvider` via {@link bind}/{@link unbind}):
 * - **Bearer injection** — `getAccessToken()` returns the engine's in-memory
 *   access token, so authenticated requests carry `Authorization: Bearer <token>`
 *   without the client ever holding a token.
 * - **Reactive refresh handle** — `refreshSession()` exposes the engine's
 *   COALESCED refresh to the 401 bridge (`withAuthRetry`). The official client's
 *   own refresh stays disabled (`enableRefresh: false`), so there is a single
 *   refresh strategy, owned by the AuthEngine. No second concurrent strategy.
 *
 * The `getRefreshToken`/`updateTokens`/`clearSession` hooks of the
 * `AuthSessionAdapter` contract are never invoked in this configuration (the
 * client does not refresh); they are documented no-ops. The `AuthSessionAdapter`
 * import is TYPE-ONLY → no runtime dependency on the ESM package. No token ever
 * enters logs, errors, or the React snapshot.
 */
import type { AuthSessionAdapter } from '@enistere/api-client-fetch';

/** The engine capabilities the adapter bridges. */
export interface AuthEngineBinding {
  /** The current in-memory access token (or `null` if absent/expired). */
  readonly getAccessToken: () => string | null;
  /** The engine's coalesced refresh; resolves to a new token or `null`. */
  readonly refreshSession: () => Promise<string | null>;
}

export class MobileAuthSessionAdapter implements AuthSessionAdapter {
  private binding: AuthEngineBinding | null = null;

  /** Wires the engine (called by `AuthProvider` on mount). */
  bind(binding: AuthEngineBinding): void {
    this.binding = binding;
  }

  /** Unwires the engine (`AuthProvider` cleanup). */
  unbind(): void {
    this.binding = null;
  }

  async getAccessToken(): Promise<string | null> {
    return this.binding?.getAccessToken() ?? null;
  }

  /**
   * The engine's coalesced refresh, for the 401 bridge ({@link withAuthRetry}).
   * Resolves to `null` when unbound or when the session can't be recovered.
   */
  readonly refreshSession = (): Promise<string | null> => {
    return this.binding ? this.binding.refreshSession() : Promise.resolve(null);
  };

  async getRefreshToken(): Promise<string | null> {
    // Refresh is owned by the AuthEngine (enableRefresh:false) → unused here.
    return null;
  }

  async updateTokens(): Promise<void> {
    // The AuthEngine persists tokens via its AuthApi flow → no-op here.
  }

  async clearSession(): Promise<void> {
    // The AuthEngine purges the session (logout/expiry) → no-op here.
  }
}

/** App-wide singleton, bridged to the default AuthEngine by `AuthProvider`. */
export const mobileAuthSession = new MobileAuthSessionAdapter();
