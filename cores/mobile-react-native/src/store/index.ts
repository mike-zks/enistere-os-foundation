/**
 * Local UI state (RN 6) — Zustand, generic & non-sensitive, SEPARATE from the
 * server state (TanStack Query, `src/query`). No token/profile/secret here; no
 * persistence. See ARCHITECTURE §15.
 */
export { useUiStore } from './ui-store';
export type { UiStore } from './ui-store';

export {
  initialUiState,
  resetUiState,
  withThemePreference,
  withFlag,
  getFlag,
} from './ui-state';
export type { UiState, ThemePreference } from './ui-state';
