import { Injectable, computed, inject, signal } from '@angular/core';
import { AuthApi } from './auth-api';
import { CREDENTIAL_STORE } from './credential-store.token';
import { ANONYMOUS, type AuthSession, type AuthSnapshot } from './auth-session';

/**
 * Owns the session. The only place that holds tokens.
 *
 * The access token lives in a private field, never in a signal: a signal is
 * observable by any component, which would turn "the UI can render the session"
 * into "the UI can read the credential". What the UI observes is the snapshot,
 * and the snapshot carries no token.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  readonly #api = inject(AuthApi);
  readonly #store = inject(CREDENTIAL_STORE);

  readonly #snapshot = signal<AuthSnapshot>(ANONYMOUS);
  /** Token-free view for templates and guards. */
  readonly snapshot = this.#snapshot.asReadonly();
  readonly isAuthenticated = computed(() => this.#snapshot().status === 'authenticated');

  #accessToken: string | null = null;
  #inFlightRefresh: Promise<string | null> | null = null;

  /** The access token, for the interceptor only. Never exposed to templates. */
  get accessToken(): string | null {
    return this.#accessToken;
  }

  async signIn(email: string, password: string): Promise<void> {
    this.#adopt(await this.#api.login(email, password));
  }

  /**
   * Refreshes at most once for any number of concurrent callers.
   *
   * Two requests failing with 401 at the same instant would otherwise each spend
   * the refresh token; since the authority rotates on every use and treats a
   * replay as reuse, the second call would revoke the whole family and sign the
   * user out. Coalescing is a correctness requirement here, not an optimisation.
   */
  refresh(): Promise<string | null> {
    this.#inFlightRefresh ??= this.#refreshOnce().finally(() => {
      this.#inFlightRefresh = null;
    });
    return this.#inFlightRefresh;
  }

  /**
   * Signs out: asks the authority to revoke, then purges locally whatever the
   * answer. A failed revocation must not leave a local session behind.
   */
  async signOut(): Promise<void> {
    const refreshToken = this.#store.read();
    try {
      if (refreshToken) {
        await this.#api.logout(refreshToken);
      }
    } catch {
      // The guarantee lives here, not in the API layer: whatever the transport
      // does, a sign-out must end signed out locally. Relying on the client to
      // swallow failures would break the moment it is swapped.
    } finally {
      this.#purge();
    }
  }

  async #refreshOnce(): Promise<string | null> {
    const refreshToken = this.#store.read();
    if (!refreshToken) {
      this.#purge();
      return null;
    }
    try {
      const session = await this.#api.refresh(refreshToken);
      this.#adopt(session);
      return session.accessToken;
    } catch {
      // A refresh that fails is a session that no longer exists. Keeping the
      // local state would show a signed-in shell over an expired session.
      this.#purge();
      return null;
    }
  }

  #adopt(session: AuthSession): void {
    this.#accessToken = session.accessToken;
    this.#store.write(session.refreshToken);
    this.#snapshot.set({ status: 'authenticated', user: session.user });
  }

  #purge(): void {
    this.#accessToken = null;
    this.#store.clear();
    this.#snapshot.set(ANONYMOUS);
  }
}
