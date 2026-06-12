/**
 * MobileAuthSessionAdapter — bridges the official `@enistere/api-client-fetch`
 * client to the mobile auth layer for **Bearer injection** (ADR-015/016 §27).
 *
 * The official client never stores tokens: it asks this adapter for the access
 * token on each request. We back `getAccessToken` with the AuthEngine's
 * in-memory token (lazily bound by `AuthProvider`), so authenticated requests
 * carry `Authorization: Bearer <token>` without the client ever holding a token.
 * A token never enters logs, errors, or the React snapshot.
 *
 * Refresh is **owned by the AuthEngine** (coalesced — ADR-004/011), so the
 * client is created with `enableRefresh: false`. The refresh/clear hooks below
 * are therefore never called by the client in this configuration; they are
 * implemented as documented no-ops so the class remains a correct
 * `AuthSessionAdapter` (and so `enableRefresh` could be flipped later).
 *
 * The `AuthSessionAdapter` import is TYPE-ONLY (erased at runtime), so this file
 * carries no runtime dependency on the ESM package.
 */
import type { AuthSessionAdapter } from '@enistere/api-client-fetch';

/** Resolves the current in-memory access token (or `null`). */
export type AccessTokenProvider = () => string | null;

export class MobileAuthSessionAdapter implements AuthSessionAdapter {
  private accessTokenProvider: AccessTokenProvider | null = null;

  /** Wires the engine's access-token getter (called by `AuthProvider` on mount). */
  bind(provider: AccessTokenProvider): void {
    this.accessTokenProvider = provider;
  }

  /** Unwires the provider (`AuthProvider` cleanup). */
  unbind(): void {
    this.accessTokenProvider = null;
  }

  async getAccessToken(): Promise<string | null> {
    return this.accessTokenProvider?.() ?? null;
  }

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
