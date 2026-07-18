/**
 * In-memory placeholder biometric adapter (RN 18 — biometric gate).
 *
 * A dependency-free {@link BiometricAdapter} for tests / wiring. It holds the
 * availability + the next programmed outcome in memory and lets a test simulate
 * the device via `setAvailability` / `setNextOutcome` — NO real
 * `LocalAuthentication`, NO Keychain, NO native module, NO persistence (mission).
 * A derived project replaces it with a real adapter; the contract and the
 * service stay identical.
 *
 * It stores NOTHING sensitive: only normalised enums (availability/type/outcome).
 * `authenticateCalls` is exposed so a test can assert the service GATES the
 * prompt (never calls `authenticate` when the device is unusable).
 *
 * Agnostic (no React/RN import) → `node --test`-able.
 */
import type { BiometricAdapter, BiometricAuthRequest } from './adapter';
import {
  normalizeAuthResult,
  normalizeAvailabilityState,
  type BiometricAuthOutcome,
  type BiometricAuthResult,
  type BiometricAvailability,
  type BiometricAvailabilityState,
  type BiometricType,
} from './model';

/** A placeholder adapter with test/wiring setters + a call counter. */
export interface PlaceholderBiometricAdapter extends BiometricAdapter {
  /** Simulate the device availability (and optional modality). */
  setAvailability(availability: BiometricAvailability, biometricType?: BiometricType): void;
  /** Program the outcome the next `authenticate` call resolves to. */
  setNextOutcome(outcome: BiometricAuthOutcome): void;
  /** Number of times `authenticate` was invoked (gate assertions). */
  readonly authenticateCalls: number;
}

export interface PlaceholderBiometricOptions {
  readonly availability?: BiometricAvailability;
  readonly biometricType?: BiometricType;
  /** Outcome returned by `authenticate` until overridden (default `success`). */
  readonly outcome?: BiometricAuthOutcome;
}

/** Create an in-memory placeholder biometric adapter (no native dependency). */
export function createPlaceholderBiometricAdapter(
  options: PlaceholderBiometricOptions = {},
): PlaceholderBiometricAdapter {
  let state: BiometricAvailabilityState = normalizeAvailabilityState({
    availability: options.availability ?? 'unknown',
    biometricType: options.biometricType ?? 'unknown',
  });
  let nextOutcome: BiometricAuthResult = normalizeAuthResult(options.outcome ?? 'success');
  let calls = 0;

  return {
    getAvailability: () => Promise.resolve(state),
    authenticate: (_request?: BiometricAuthRequest) => {
      calls += 1;
      return Promise.resolve(nextOutcome);
    },
    setAvailability: (availability, biometricType) => {
      state = normalizeAvailabilityState({
        availability,
        biometricType: biometricType ?? state.biometricType,
      });
    },
    setNextOutcome: (outcome) => {
      nextOutcome = normalizeAuthResult(outcome);
    },
    get authenticateCalls() {
      return calls;
    },
  };
}
