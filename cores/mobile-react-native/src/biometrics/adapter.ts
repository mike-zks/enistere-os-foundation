/**
 * Biometric-gate adapter contract (RN 18 — biometric gate).
 *
 * The seam between the agnostic {@link BiometricService} and the platform source
 * (a real Expo `LocalAuthentication` / Keychain wrapper:
 * `hasHardwareAsync`/`isEnrolledAsync`/`supportedAuthenticationTypesAsync` +
 * `authenticateAsync`). The foundation ships only the contract + an in-memory
 * placeholder — NO real `LocalAuthentication`, NO Keychain, NO native module
 * (mission). A derived project wires a real adapter (which SHOULD normalise via
 * the `model.ts` helpers) and decides whether to enable the gate at all
 * (ADR-015 §20: optional, never a server-auth replacement).
 *
 * Both operations are async (native biometric APIs are async). The adapter
 * returns a *raw-ish* shape; the service normalises it defensively.
 *
 * Agnostic (no React/RN import) → `node --test`-able.
 */
import type { BiometricAuthResult, BiometricAvailabilityState } from './model';

/** Optional request passed opaquely to the adapter. The `reason` (prompt text)
 * is NEVER logged or stored by the service — it is a UX string only. */
export interface BiometricAuthRequest {
  /** Localised prompt reason shown by the OS. Forwarded as-is, never logged. */
  readonly reason?: string;
}

export interface BiometricAdapter {
  /** Resolve the current device availability (hardware + enrolment). */
  getAvailability(): Promise<BiometricAvailabilityState>;
  /** Run a local biometric check; resolves to a normalisable outcome. */
  authenticate(request?: BiometricAuthRequest): Promise<BiometricAuthResult>;
}

/**
 * Controlled error for a failed adapter operation. Carries only the safe
 * `operation` — NO underlying native message/cause (no sensitive leak, §21).
 */
export class BiometricAdapterError extends Error {
  readonly operation: 'getAvailability' | 'authenticate';

  constructor(operation: 'getAvailability' | 'authenticate') {
    super(`Biometric adapter "${operation}" failed.`);
    this.name = 'BiometricAdapterError';
    this.operation = operation;
  }
}
