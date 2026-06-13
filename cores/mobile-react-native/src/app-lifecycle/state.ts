/**
 * Normalised app-lifecycle state model (RN 15 — app lifecycle).
 *
 * A generic, RN-flavoured application lifecycle state + a small transition
 * machine. The foundation ships GENERIC primitives only: NO real RN `AppState`,
 * NO screen/provider, NO business logic (mission). Derived projects wire a real
 * adapter (RN `AppState`) and react to transitions (analytics flush, session
 * refresh on foreground, notification scheduling…).
 *
 * Every helper TOLERATES invalid input (returns a safe default, never throws).
 * PURE / framework-agnostic (no React/RN/ESM import) → unit-tested under
 * `node --test`.
 */

/**
 * Normalised lifecycle state.
 * - `active`     — foreground & interactive.
 * - `background` — not visible.
 * - `inactive`   — transitioning / partially obscured (iOS inactive, call…).
 * - `unknown`    — not yet determined / unrecognised.
 */
export type AppLifecycleState = 'active' | 'background' | 'inactive' | 'unknown';

const STATES: ReadonlySet<AppLifecycleState> = new Set([
  'active',
  'background',
  'inactive',
  'unknown',
]);

/** Raw (RN `AppStateStatus`) → normalised state. `extension` folds to background. */
const RAW_MAP: Readonly<Record<string, AppLifecycleState>> = {
  active: 'active',
  background: 'background',
  inactive: 'inactive',
  unknown: 'unknown',
  extension: 'background',
};

/** Type guard for a normalised {@link AppLifecycleState}. */
export function isAppLifecycleState(value: unknown): value is AppLifecycleState {
  return typeof value === 'string' && STATES.has(value as AppLifecycleState);
}

/** Fold any raw value into a normalised state. Unknown/invalid → `unknown`. */
export function normalizeAppLifecycleState(value: unknown): AppLifecycleState {
  if (typeof value !== 'string') {
    return 'unknown';
  }
  return RAW_MAP[value.trim().toLowerCase()] ?? 'unknown';
}

/** True when the app is in the foreground (`active`). */
export function isForeground(state: AppLifecycleState): boolean {
  return state === 'active';
}

/** True when the app is in the background. */
export function isBackground(state: AppLifecycleState): boolean {
  return state === 'background';
}

/**
 * Whether `from → to` is an allowed transition:
 * - same state → `true` (idempotent no-op);
 * - from `unknown` → `true` (initial determination to any real state);
 * - to `unknown` → `false` (a determined state never reverts to unknown);
 * - between the real states (`active`/`inactive`/`background`) → `true`
 *   (platform differences make any pair plausible).
 */
export function isValidTransition(from: AppLifecycleState, to: AppLifecycleState): boolean {
  if (from === to) {
    return true;
  }
  if (from === 'unknown') {
    return true;
  }
  if (to === 'unknown') {
    return false;
  }
  return true;
}

/**
 * Resolve the next state given a `current` state and a `candidate` (both
 * tolerated as `unknown` input): returns the normalised candidate when the
 * transition is valid, otherwise keeps the current state. Never throws.
 */
export function nextAppLifecycleState(current: unknown, candidate: unknown): AppLifecycleState {
  const from = normalizeAppLifecycleState(current);
  const to = normalizeAppLifecycleState(candidate);
  return isValidTransition(from, to) ? to : from;
}
