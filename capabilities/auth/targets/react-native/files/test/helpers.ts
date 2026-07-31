/**
 * Test helpers (compiled by tsconfig.test.json, run via `node --test`).
 * Not a test file itself (no `.test.ts` suffix).
 */
import type { AuthApi, AuthSessionData } from '../src/features/auth/auth-api';
import type { SignInInput } from '../src/features/auth/session';

/**
 * Controllable {@link AuthApi} mock:
 * - counts login/refresh/logout calls (assert coalescing & wiring);
 * - `failLogin`/`failRefresh`/`failLogout` simulate backend failures;
 * - an optional gate lets a test hold a refresh in-flight to prove coalescing;
 * - issues `expiresAt` from an injectable clock to drive proactive-expiry tests.
 */
export class MockAuthApi implements AuthApi {
  loginCalls = 0;
  refreshCalls = 0;
  logoutCalls = 0;
  failLogin = false;
  failRefresh = false;
  failLogout = false;
  lastLogoutToken: string | null = null;

  private gate: { promise: Promise<void>; resolve: () => void } | null = null;

  constructor(
    private readonly clock: () => number = () => 0,
    private readonly expiresIn: number | null = null,
  ) {}

  /** Holds the next refresh until {@link releaseGate} is called. */
  useGate(): void {
    let resolve!: () => void;
    const promise = new Promise<void>((r) => {
      resolve = r;
    });
    this.gate = { promise, resolve };
  }

  releaseGate(): void {
    this.gate?.resolve();
  }

  async login(input: SignInInput): Promise<AuthSessionData> {
    this.loginCalls += 1;
    if (this.failLogin) {
      throw new Error('login failed');
    }
    return this.mint(input.email);
  }

  async refresh(_refreshToken: string): Promise<AuthSessionData> {
    this.refreshCalls += 1;
    if (this.gate) {
      await this.gate.promise;
    }
    if (this.failRefresh) {
      throw new Error('refresh failed');
    }
    return this.mint(null);
  }

  async logout(refreshToken: string): Promise<void> {
    this.logoutCalls += 1;
    this.lastLogoutToken = refreshToken;
    if (this.failLogout) {
      throw new Error('logout failed');
    }
  }

  private mint(displayName: string | null): AuthSessionData {
    const n = this.loginCalls + this.refreshCalls;
    return {
      accessToken: `access-${n}`,
      refreshToken: `placeholder-refresh-token.${n}`,
      expiresAt: this.expiresIn === null ? null : this.clock() + this.expiresIn,
      user: displayName ? { id: 'u', displayName } : null,
    };
  }
}
