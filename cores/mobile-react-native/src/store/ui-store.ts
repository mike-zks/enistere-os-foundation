/**
 * Local UI store (RN 6) — Zustand binding over the pure {@link UiState} model.
 *
 * Governance:
 * - **Zustand = approved** for SIMPLE LOCAL UI state (spec §23 ; strategy 06 —
 *   "Local state: Approved"), kept STRICTLY SEPARATE from server state (TanStack
 *   Query, ADR-012 ; anti-pattern spec §57: never store server state here).
 * - **No sensitive data**: holds ONLY non-sensitive UI primitives — NO token,
 *   profile, signed URL, server payload or secret (ADR-015 ; the {@link UiState}
 *   type enforces this structurally).
 * - **In-memory only**: NO persistence (mission ; ADR-015 §16) — the store
 *   resets on app restart, and {@link UiStore.reset} clears it on logout.
 */
import { create } from 'zustand';

import {
  getFlag,
  initialUiState,
  resetUiState,
  withFlag,
  withThemePreference,
  type ThemePreference,
  type UiState,
} from './ui-state';

export interface UiStore extends UiState {
  setThemePreference(preference: ThemePreference): void;
  setFlag(key: string, value: boolean): void;
  /** Reads a UI flag (absent → `false`). */
  readFlag(key: string): boolean;
  /** Resets ephemeral UI state to defaults (e.g. on logout). */
  reset(): void;
}

/** App-wide local UI store. Use selectors to subscribe to a slice. */
export const useUiStore = create<UiStore>((set, get) => ({
  ...initialUiState,
  setThemePreference: (preference) => set((state) => withThemePreference(state, preference)),
  setFlag: (key, value) => set((state) => withFlag(state, key, value)),
  readFlag: (key) => getFlag(get(), key),
  reset: () => set(resetUiState()),
}));
