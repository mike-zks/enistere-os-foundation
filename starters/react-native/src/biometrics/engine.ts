/**
 * Framework-agnostic biometric-gate service (RN 18 — biometric gate).
 *
 * A thin, **best-effort and non-intrusive** wrapper over a {@link BiometricAdapter}:
 * it normalises device availability and runs a **local** biometric check. It is
 * stateless (holds NO secret/token/biometric/result/profile — ADR-015 §20/§21)
 * and request/response (no streams, no listeners). Returned objects are frozen,
 * so a caller cannot mutate the service's view.
 *
 * GOVERNANCE (ADR-015 §20): this is a **local UX gate ONLY**. A `success` here
 * means the *device* check passed — it is NOT a server session and NEVER replaces
 * login/refresh/session (the API Core stays the authority, §21/§27). The gate
 * stays optional; a derived project supplies its own fallback for every non-pass
 * outcome (`unavailable`/`refused`/`cancelled`/`lockout`/`error`).
 *
 * Safety guarantees:
 * - **No false success**: `authenticate` checks availability first and returns
 *   `unavailable` WITHOUT prompting when the device is unusable; a thrown adapter
 *   yields `error`; junk outcomes normalise to `error` — never `success`.
 * - **Never throws**: every adapter failure is caught and surfaced as a safe
 *   outcome / default availability.
 * - **Safe logs** (ADR-040 / RN 8): optional injected logger; logs ONLY enums
 *   (`{ availability, type }` / `{ outcome }` / `{ operation }`) — never the
 *   prompt/reason, never a raw native cause.
 *
 * PURE / framework-agnostic (no React/RN import; no `Date.now()`) → `node --test`.
 */
import type { Logger } from '../logger/logger';
import { BiometricAdapterError, type BiometricAdapter, type BiometricAuthRequest } from './adapter';
import {
  describeAuthResultForLog,
  describeAvailabilityForLog,
  isAvailabilityUsable,
  normalizeAuthResult,
  normalizeAvailabilityState,
  type BiometricAuthResult,
  type BiometricAvailabilityState,
} from './model';

export interface BiometricService {
  /** Resolve the current device availability (frozen, normalised). */
  getAvailability(): Promise<BiometricAvailabilityState>;
  /** Convenience: `true` only when the gate is usable (`available`). */
  isAvailable(): Promise<boolean>;
  /**
   * Run the local biometric gate. Resolves to a frozen result; never throws and
   * never returns a false `success` (returns `unavailable` if the device is not
   * usable — without prompting).
   */
  authenticate(request?: BiometricAuthRequest): Promise<BiometricAuthResult>;
}

export interface BiometricServiceOptions {
  readonly adapter: BiometricAdapter;
  /** Optional RN 8 logger (enum fields only — never prompt/cause). */
  readonly logger?: Logger;
}

const UNKNOWN_AVAILABILITY: BiometricAvailabilityState = normalizeAvailabilityState({
  availability: 'unknown',
  biometricType: 'unknown',
});

const UNAVAILABLE_RESULT: BiometricAuthResult = normalizeAuthResult('unavailable');
const ERROR_RESULT: BiometricAuthResult = normalizeAuthResult('error');

/** Build a {@link BiometricService} over an adapter (+ optional safe logger). */
export function createBiometricService(options: BiometricServiceOptions): BiometricService {
  const { adapter, logger } = options;

  async function getAvailability(): Promise<BiometricAvailabilityState> {
    try {
      const state = normalizeAvailabilityState(await adapter.getAvailability());
      logger?.debug('biometric availability', { ...describeAvailabilityForLog(state) });
      return state;
    } catch {
      logger?.warn('biometric getAvailability failed', {
        operation: new BiometricAdapterError('getAvailability').operation,
      });
      return UNKNOWN_AVAILABILITY;
    }
  }

  async function authenticate(request?: BiometricAuthRequest): Promise<BiometricAuthResult> {
    // Gate first: never prompt — and never return success — when unusable.
    const availability = await getAvailability();
    if (!isAvailabilityUsable(availability.availability)) {
      logger?.debug('biometric gate skipped', { ...describeAuthResultForLog(UNAVAILABLE_RESULT) });
      return UNAVAILABLE_RESULT;
    }
    try {
      const result = normalizeAuthResult(await adapter.authenticate(request));
      logger?.debug('biometric result', { ...describeAuthResultForLog(result) });
      return result;
    } catch {
      logger?.warn('biometric authenticate failed', {
        operation: new BiometricAdapterError('authenticate').operation,
      });
      return ERROR_RESULT;
    }
  }

  return {
    getAvailability,
    isAvailable: async () => isAvailabilityUsable((await getAvailability()).availability),
    authenticate,
  };
}
