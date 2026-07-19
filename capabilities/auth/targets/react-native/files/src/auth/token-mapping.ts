/**
 * Maps the API Core token payload (`LoginResponseDto` / `RefreshResponseDto`,
 * captured structurally) to the engine-facing {@link AuthSessionData}.
 *
 * Pure and framework-agnostic (NO `@enistere/*` import) so it is unit-testable
 * under `node --test`. `accessTokenExpiresIn` is in SECONDS (API Core: 900 =
 * 15 min, ADR-004) and is converted to an absolute epoch-ms expiry.
 */
import type { AuthSessionData } from './auth-api';

/** The token fields RN reads from a login/refresh response (subset of the DTO). */
export interface ApiTokenPayload {
  readonly accessToken: string;
  readonly refreshToken: string;
  /** Access-token lifetime in SECONDS. */
  readonly accessTokenExpiresIn: number;
}

const SECONDS_TO_MS = 1000;

/**
 * Builds {@link AuthSessionData} from a token payload at instant `nowMs`. The
 * `user` is left `null` — profile hydration (`GET /auth/me`) is a separate,
 * generic concern and is intentionally not coupled here.
 */
export function toAuthSessionData(payload: ApiTokenPayload, nowMs: number): AuthSessionData {
  const ttl = payload.accessTokenExpiresIn;
  const expiresAt = Number.isFinite(ttl) && ttl > 0 ? nowMs + ttl * SECONDS_TO_MS : null;
  return {
    accessToken: payload.accessToken,
    refreshToken: payload.refreshToken,
    expiresAt,
    user: null,
  };
}
