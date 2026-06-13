/**
 * Locale adapter contract (RN 11 — i18n).
 *
 * The seam between the agnostic localization layer and the device/app locale
 * source (Expo `expo-localization`, RN `NativeModules`, …). The foundation ships
 * only the contract + a documented placeholder — NO native module, NO locale
 * persistence (mission).
 *
 * Agnostic (no React/RN import) → `node --test`-able.
 */
import type { LocaleCode } from './locale';

export interface LocaleAdapter {
  /** Current device/app locale (synchronous). */
  getLocale(): LocaleCode;
  /** Optionally observe locale changes; returns an unsubscribe function. */
  subscribe?(listener: (locale: LocaleCode) => void): () => void;
}
