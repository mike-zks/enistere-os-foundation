/**
 * Auth API seam — the contract the {@link AuthEngine} depends on for login and
 * refresh. Framework-agnostic (no React/RN import).
 *
 * Governance: this is the integration point for the official client
 * `@enistere/api-client-fetch` (ADR-016). A real adapter will implement
 * `AuthApi` by POSTing to API Core (`/auth/login`, `/auth/refresh`) and reading
 * the profile (`/me`). Wiring that package requires root-workspace + Metro
 * monorepo changes that are OUT of this mission's perimeter, so RN 2 ships the
 * placeholder below behind this interface — swapping in the real adapter does
 * not touch the engine or the UI.
 */
import { AuthUser, SignInInput } from './session';

/** Tokens + identity returned by a login/refresh exchange. */
export interface AuthSessionData {
  readonly accessToken: string;
  readonly refreshToken: string;
  /** Epoch ms when the access token expires, if known. */
  readonly expiresAt: number | null;
  readonly user: AuthUser | null;
}

export interface AuthApi {
  /** Exchanges credentials for a session. */
  login(input: SignInInput): Promise<AuthSessionData>;
  /** Exchanges a refresh token for a fresh session. Throws if invalid/expired. */
  refresh(refreshToken: string): Promise<AuthSessionData>;
}

/** Error raised by the placeholder when a refresh token is not acceptable. */
export class AuthApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthApiError';
  }
}

/** Default access-token lifetime for the placeholder (15 min). */
const PLACEHOLDER_ACCESS_TTL_MS = 15 * 60_000;
const REFRESH_PREFIX = 'placeholder-refresh-token';

/**
 * PLACEHOLDER auth API — mints tokens locally, NO backend call.
 *
 * - `login` always succeeds and returns a generic session;
 * - `refresh` succeeds only for tokens it issued (prefix check), otherwise it
 *   throws {@link AuthApiError} — modelling an invalid/revoked refresh token.
 *
 * A `now` clock is injectable for deterministic tests.
 */
export class PlaceholderAuthApi implements AuthApi {
  constructor(private readonly now: () => number = () => Date.now()) {}

  async login(input: SignInInput): Promise<AuthSessionData> {
    return this.mint(input.username);
  }

  async refresh(refreshToken: string): Promise<AuthSessionData> {
    if (!refreshToken.startsWith(REFRESH_PREFIX)) {
      throw new AuthApiError('Invalid refresh token.');
    }
    return this.mint(null);
  }

  private mint(displayName: string | null): AuthSessionData {
    const issuedAt = this.now();
    return {
      accessToken: `placeholder-access-token.${issuedAt}`,
      refreshToken: `${REFRESH_PREFIX}.${issuedAt}`,
      expiresAt: issuedAt + PLACEHOLDER_ACCESS_TTL_MS,
      user: displayName ? { id: 'placeholder-user', displayName } : null,
    };
  }
}
