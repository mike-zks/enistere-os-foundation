/**
 * Normalised biometric-gate model (RN 18 — biometric gate).
 *
 * Generic primitives for a **local biometric UX gate** (ADR-015 §20): a normalised
 * device availability, a bounded biometric type, and a normalised authentication
 * outcome — plus small, tolerant pure helpers. The foundation ships GENERIC
 * primitives only: NO real Expo `LocalAuthentication`, NO Keychain, NO native
 * module, NO screen/provider, NO business logic (mission).
 *
 * GOVERNANCE (ADR-015 §20/§21) — the biometric gate is a **local UX gate ONLY**:
 * it MAY protect a local action, it NEVER replaces server login/refresh/session,
 * NEVER compensates a weak token strategy, MUST stay optional and leave room for a
 * project-defined fallback. It stores NOTHING (no secret/token/biometric/result/
 * profile) and logs NOTHING sensitive (no prompt/user message, no raw native
 * failure cause) — only the enums below.
 *
 * Every helper TOLERATES invalid input (returns a safe default, never throws).
 * PURE / framework-agnostic (no React/RN/ESM import; no `Date.now()`) → unit-tested
 * under `node --test`.
 */

/**
 * Normalised device availability for the biometric gate.
 * - `available`   — hardware present AND a biometric is enrolled → gate usable.
 * - `notEnrolled` — hardware present but no biometric enrolled → gate unusable.
 * - `unsupported` — no biometric hardware on this device → gate unusable.
 * - `unknown`     — not yet determined / unrecognised → treated as unusable.
 */
export type BiometricAvailability = 'available' | 'notEnrolled' | 'unsupported' | 'unknown';

/**
 * Bounded biometric modality. Deliberately coarse (never an identifying native
 * descriptor): `fingerprint` / `facial` / `iris` / `unknown`.
 */
export type BiometricType = 'fingerprint' | 'facial' | 'iris' | 'unknown';

/**
 * Normalised outcome of a local biometric authentication attempt.
 * - `success`     — the local check passed (UX gate only — NOT a server session).
 * - `refused`     — the user failed / refused (non-matching biometric).
 * - `cancelled`   — the user dismissed the prompt.
 * - `lockout`     — too many attempts; biometric temporarily locked by the OS.
 * - `unavailable` — gate not usable at attempt time (unsupported/notEnrolled…).
 * - `error`       — a controlled, unknown failure (no native cause is exposed).
 *
 * There is NO "false success": only `success` is a pass; everything else is a
 * non-pass the derived project handles with its own fallback.
 */
export type BiometricAuthOutcome =
  | 'success'
  | 'refused'
  | 'cancelled'
  | 'lockout'
  | 'unavailable'
  | 'error';

/** Normalised, immutable availability state. */
export interface BiometricAvailabilityState {
  readonly availability: BiometricAvailability;
  readonly biometricType: BiometricType;
}

/** Normalised, immutable authentication result (carries NO message/cause). */
export interface BiometricAuthResult {
  readonly outcome: BiometricAuthOutcome;
}

/** Safe log descriptor for an availability state — enums only. */
export interface SafeBiometricAvailabilityDescriptor {
  readonly availability: BiometricAvailability;
  readonly type: BiometricType;
}

/** Safe log descriptor for an auth result — enum only. */
export interface SafeBiometricResultDescriptor {
  readonly outcome: BiometricAuthOutcome;
}

const AVAILABILITIES: ReadonlySet<BiometricAvailability> = new Set([
  'available',
  'notEnrolled',
  'unsupported',
  'unknown',
]);

const TYPES: ReadonlySet<BiometricType> = new Set([
  'fingerprint',
  'facial',
  'iris',
  'unknown',
]);

const OUTCOMES: ReadonlySet<BiometricAuthOutcome> = new Set([
  'success',
  'refused',
  'cancelled',
  'lockout',
  'unavailable',
  'error',
]);

/** Common raw → normalised availability aliases (tolerant). */
const AVAILABILITY_ALIASES: Readonly<Record<string, BiometricAvailability>> = {
  available: 'available',
  enrolled: 'available',
  ready: 'available',
  notenrolled: 'notEnrolled',
  not_enrolled: 'notEnrolled',
  unenrolled: 'notEnrolled',
  unsupported: 'unsupported',
  unavailable: 'unsupported',
  nohardware: 'unsupported',
  no_hardware: 'unsupported',
  none: 'unsupported',
  unknown: 'unknown',
};

/** Common raw → normalised biometric-type aliases (tolerant). */
const TYPE_ALIASES: Readonly<Record<string, BiometricType>> = {
  fingerprint: 'fingerprint',
  touchid: 'fingerprint',
  touch_id: 'fingerprint',
  facial: 'facial',
  face: 'facial',
  faceid: 'facial',
  face_id: 'facial',
  iris: 'iris',
  unknown: 'unknown',
};

/** Common raw → normalised outcome aliases (tolerant). */
const OUTCOME_ALIASES: Readonly<Record<string, BiometricAuthOutcome>> = {
  success: 'success',
  succeeded: 'success',
  authenticated: 'success',
  refused: 'refused',
  failed: 'refused',
  rejected: 'refused',
  mismatch: 'refused',
  cancelled: 'cancelled',
  canceled: 'cancelled',
  dismissed: 'cancelled',
  user_cancel: 'cancelled',
  lockout: 'lockout',
  locked: 'lockout',
  lockedout: 'lockout',
  too_many_attempts: 'lockout',
  unavailable: 'unavailable',
  notavailable: 'unavailable',
  not_available: 'unavailable',
  error: 'error',
  unknown: 'error',
};

/** Type guard for a normalised {@link BiometricAvailability}. */
export function isBiometricAvailability(value: unknown): value is BiometricAvailability {
  return typeof value === 'string' && AVAILABILITIES.has(value as BiometricAvailability);
}

/** Type guard for a normalised {@link BiometricType}. */
export function isBiometricType(value: unknown): value is BiometricType {
  return typeof value === 'string' && TYPES.has(value as BiometricType);
}

/** Type guard for a normalised {@link BiometricAuthOutcome}. */
export function isBiometricAuthOutcome(value: unknown): value is BiometricAuthOutcome {
  return typeof value === 'string' && OUTCOMES.has(value as BiometricAuthOutcome);
}

/** Fold any raw value into a normalised availability. Unknown/invalid → `unknown`. */
export function normalizeBiometricAvailability(value: unknown): BiometricAvailability {
  if (typeof value === 'boolean') {
    return value ? 'available' : 'unsupported';
  }
  if (typeof value !== 'string') {
    return 'unknown';
  }
  const key = value.trim().toLowerCase();
  if (AVAILABILITIES.has(key as BiometricAvailability)) {
    return key as BiometricAvailability;
  }
  return AVAILABILITY_ALIASES[key] ?? 'unknown';
}

/** Fold any raw value into a normalised biometric type. Unknown/invalid → `unknown`. */
export function normalizeBiometricType(value: unknown): BiometricType {
  if (typeof value !== 'string') {
    return 'unknown';
  }
  const key = value.trim().toLowerCase();
  if (TYPES.has(key as BiometricType)) {
    return key as BiometricType;
  }
  return TYPE_ALIASES[key] ?? 'unknown';
}

/**
 * Fold any raw value into a normalised outcome. Unknown/invalid → `error`
 * (never `success` — there is no false success from junk input).
 */
export function normalizeBiometricAuthOutcome(value: unknown): BiometricAuthOutcome {
  if (typeof value !== 'string') {
    return 'error';
  }
  const key = value.trim().toLowerCase();
  if (OUTCOMES.has(key as BiometricAuthOutcome)) {
    return key as BiometricAuthOutcome;
  }
  return OUTCOME_ALIASES[key] ?? 'error';
}

/**
 * Build a frozen {@link BiometricAvailabilityState} from a raw snapshot
 * `{ availability?, biometricType? }` (any shape tolerated). A non-`available`
 * device reports `unknown` type unless it explicitly provides one.
 */
export function normalizeAvailabilityState(value: unknown): BiometricAvailabilityState {
  const source = (value ?? {}) as { availability?: unknown; biometricType?: unknown };
  return Object.freeze({
    availability: normalizeBiometricAvailability(source.availability),
    biometricType: normalizeBiometricType(source.biometricType),
  });
}

/** Build a frozen {@link BiometricAuthResult} from a raw outcome/snapshot. */
export function normalizeAuthResult(value: unknown): BiometricAuthResult {
  if (typeof value === 'string') {
    return Object.freeze({ outcome: normalizeBiometricAuthOutcome(value) });
  }
  const source = (value ?? {}) as { outcome?: unknown };
  return Object.freeze({ outcome: normalizeBiometricAuthOutcome(source.outcome) });
}

/** True only when the gate is usable (`available`). Everything else → `false`. */
export function isAvailabilityUsable(value: unknown): boolean {
  return normalizeBiometricAvailability(value) === 'available';
}

/** True only for a genuine pass (`success`). No outcome else counts. */
export function isAuthSuccess(value: unknown): boolean {
  return normalizeBiometricAuthOutcome(value) === 'success';
}

/** Safe log view of an availability state — enums ONLY (never identity/cause). */
export function describeAvailabilityForLog(
  state: BiometricAvailabilityState,
): SafeBiometricAvailabilityDescriptor {
  return { availability: state.availability, type: state.biometricType };
}

/** Safe log view of an auth result — enum ONLY (never prompt/message/cause). */
export function describeAuthResultForLog(
  result: BiometricAuthResult,
): SafeBiometricResultDescriptor {
  return { outcome: result.outcome };
}
