/**
 * Generic biometric-gate primitives (RN 18).
 *
 * A normalised availability model (`available`/`notEnrolled`/`unsupported`/
 * `unknown`), a bounded biometric type, a normalised auth outcome
 * (`success`/`refused`/`cancelled`/`lockout`/`unavailable`/`error`) with tolerant
 * pure helpers, an agnostic adapter contract (seam for Expo `LocalAuthentication`
 * / Keychain), an in-memory placeholder adapter, and a best-effort service
 * (availability check + local gate, safe RN 8 logging — enum fields only).
 *
 * GENERIC only — NO real `LocalAuthentication`, NO Keychain, NO secret/biometric/
 * result/profile storage, NO screen/mandatory provider/hook, NO business logic.
 * It is a **local UX gate** and NEVER replaces server auth (ADR-015 §20/§21).
 * See ARCHITECTURE §27.
 */
export {
  isBiometricAvailability,
  isBiometricType,
  isBiometricAuthOutcome,
  normalizeBiometricAvailability,
  normalizeBiometricType,
  normalizeBiometricAuthOutcome,
  normalizeAvailabilityState,
  normalizeAuthResult,
  isAvailabilityUsable,
  isAuthSuccess,
  describeAvailabilityForLog,
  describeAuthResultForLog,
} from './model';
export type {
  BiometricAvailability,
  BiometricType,
  BiometricAuthOutcome,
  BiometricAvailabilityState,
  BiometricAuthResult,
  SafeBiometricAvailabilityDescriptor,
  SafeBiometricResultDescriptor,
} from './model';

export { BiometricAdapterError } from './adapter';
export type { BiometricAdapter, BiometricAuthRequest } from './adapter';

export { createPlaceholderBiometricAdapter } from './placeholder-adapter';
export type {
  PlaceholderBiometricAdapter,
  PlaceholderBiometricOptions,
} from './placeholder-adapter';

export { createBiometricService } from './engine';
export type { BiometricService, BiometricServiceOptions } from './engine';
