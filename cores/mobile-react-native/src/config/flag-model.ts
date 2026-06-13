/**
 * Feature-flag / config value model (RN 17 — feature flags / config).
 *
 * Generic, typed feature flags (boolean/string/number) with **safe defaults** and
 * bounded keys/values. This is GENERIC config plumbing — NOT the RN 6 Zustand UI
 * `flags` (ephemeral UI booleans). The foundation ships the model + a placeholder
 * adapter; a derived project plugs a real local/remote-config source (under its
 * own ADR/privacy review).
 *
 * SECURITY / governance (07_SECURITY / ADR-015/040, mission) : a flag value is
 * config — it must NOT carry a secret/token/signed URL/server payload/PII (caller
 * responsibility). Values are length-bounded and **never logged**
 * ({@link describeFlagsForLog} exposes a `count` only). No network, no
 * persistence, no real user targeting here.
 *
 * Every helper TOLERATES invalid/nullish input (returns a safe default/empty,
 * never throws). PURE / framework-agnostic → unit-tested under `node --test`.
 */

/** Allowed flag value primitives. */
export type FlagValue = boolean | string | number;

/** A resolved set of flags (stable key → value). */
export type FlagSet = Readonly<Record<string, FlagValue>>;

/** Max kept length of a flag key. */
export const MAX_FLAG_KEY_LENGTH = 64;
/** Max kept length of a string flag value. */
export const MAX_FLAG_VALUE_LENGTH = 256;
/** Max kept number of flags. */
export const MAX_FLAGS = 200;

/** True when `key` is a valid flag identifier (e.g. `feature.newCheckout`). */
export function isValidFlagKey(key: unknown): key is string {
  return (
    typeof key === 'string' &&
    key.length > 0 &&
    key.length <= MAX_FLAG_KEY_LENGTH &&
    /^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(key)
  );
}

/**
 * Fold a raw value into a valid {@link FlagValue}, or `undefined` when it is not a
 * supported primitive. Strings are length-bounded; non-finite numbers are
 * dropped. Never throws.
 */
export function normalizeFlagValue(value: unknown): FlagValue | undefined {
  if (typeof value === 'boolean') {
    return value;
  }
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : undefined;
  }
  if (typeof value === 'string') {
    return value.slice(0, MAX_FLAG_VALUE_LENGTH);
  }
  return undefined;
}

/**
 * Coerce arbitrary input into a bounded {@link FlagSet} — keeps only valid keys
 * with supported primitive values, caps the count. Never throws.
 */
export function sanitizeFlagSet(input: unknown): FlagSet {
  if (typeof input !== 'object' || input === null) {
    return {};
  }
  const out: Record<string, FlagValue> = {};
  let kept = 0;
  for (const [key, raw] of Object.entries(input as Record<string, unknown>)) {
    if (kept >= MAX_FLAGS) {
      break;
    }
    if (!isValidFlagKey(key)) {
      continue;
    }
    const value = normalizeFlagValue(raw);
    if (value !== undefined) {
      out[key] = value;
      kept += 1;
    }
  }
  return out;
}

function matchesType(value: FlagValue | undefined, sample: FlagValue): boolean {
  if (typeof value !== typeof sample) {
    return false;
  }
  return typeof value === 'number' ? Number.isFinite(value) : true;
}

/** Read a boolean flag, falling back to `defaultValue` when absent/mistyped. */
export function getBooleanFlag(set: FlagSet, key: string, defaultValue: boolean): boolean {
  const value = set[key];
  return typeof value === 'boolean' ? value : defaultValue;
}

/** Read a string flag, falling back to `defaultValue` when absent/mistyped. */
export function getStringFlag(set: FlagSet, key: string, defaultValue: string): string {
  const value = set[key];
  return typeof value === 'string' ? value : defaultValue;
}

/** Read a number flag, falling back to `defaultValue` when absent/mistyped. */
export function getNumberFlag(set: FlagSet, key: string, defaultValue: number): number {
  const value = set[key];
  return typeof value === 'number' && Number.isFinite(value) ? value : defaultValue;
}

/** Generic typed read: returns the flag only when it matches `defaultValue`'s type. */
export function getFlagValue<T extends FlagValue>(set: FlagSet, key: string, defaultValue: T): T {
  const value = set[key];
  return value !== undefined && matchesType(value, defaultValue) ? (value as T) : defaultValue;
}

/** Safe, value-free descriptor of a flag set for logs — the `count` ONLY. */
export interface SafeFlagsDescriptor {
  readonly count: number;
}

/** Reduce a flag set to non-sensitive log metadata (NEVER keys or values). */
export function describeFlagsForLog(set: FlagSet): SafeFlagsDescriptor {
  return { count: Object.keys(set).length };
}
