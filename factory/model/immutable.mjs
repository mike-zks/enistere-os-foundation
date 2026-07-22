/**
 * Deep immutability for the canonical models (ADR-046).
 *
 * A root `Object.freeze()` is insufficient: nested objects and arrays stay
 * mutable. `deepFreeze` recursively freezes every plain object and array so the
 * CSM, the ResolvedSystem and the GenerationPlan cannot be mutated after
 * construction — a mutation attempt throws in strict mode or is silently ignored,
 * and tests assert the value is unchanged.
 */

/** Recursively freezes plain objects and arrays. Returns the same reference. */
export function deepFreeze(value) {
  if (value === null || typeof value !== 'object') return value;
  if (Object.isFrozen(value)) return value;
  Object.freeze(value);
  for (const key of Object.keys(value)) deepFreeze(value[key]);
  return value;
}
