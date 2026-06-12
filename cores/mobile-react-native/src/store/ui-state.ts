/**
 * Pure UI-state model + transitions (RN 6 — local UI state).
 *
 * GENERIC, NON-SENSITIVE local UI state ONLY: a theme preference (enum) and a
 * map of boolean UI flags. The shape STRUCTURALLY forbids sensitive data — it
 * holds only a {@link ThemePreference} enum and `boolean` flags, so a token,
 * user profile, signed URL or any server payload simply CANNOT be stored here
 * (ADR-015 ; spec §57: server state lives in TanStack Query, NOT in the local
 * store). Keep new fields to non-sensitive UI primitives.
 *
 * Pure and framework-agnostic (no `zustand` import) → unit-testable under
 * `node --test`. The Zustand binding lives in `ui-store.ts`.
 */

/** Non-sensitive theme preference. `system` follows the OS scheme. */
export type ThemePreference = 'system' | 'light' | 'dark';

/** The whole local UI state — ONLY non-sensitive UI primitives. */
export interface UiState {
  readonly themePreference: ThemePreference;
  /** Ephemeral boolean UI flags (e.g. a dismissed banner). Booleans ONLY. */
  readonly flags: Readonly<Record<string, boolean>>;
}

/** The default UI state — also what `reset()` restores (e.g. on logout). */
export const initialUiState: UiState = {
  themePreference: 'system',
  flags: {},
};

/** Returns a new state with `themePreference` set. */
export function withThemePreference(state: UiState, preference: ThemePreference): UiState {
  return { ...state, themePreference: preference };
}

/** Returns a new state with the boolean UI `flag` set. */
export function withFlag(state: UiState, key: string, value: boolean): UiState {
  return { ...state, flags: { ...state.flags, [key]: value } };
}

/** Reads a UI flag (absent → `false`). */
export function getFlag(state: UiState, key: string): boolean {
  return state.flags[key] ?? false;
}

/** A fresh default state — use to reset ephemeral UI (e.g. on logout). */
export function resetUiState(): UiState {
  return { themePreference: 'system', flags: {} };
}
