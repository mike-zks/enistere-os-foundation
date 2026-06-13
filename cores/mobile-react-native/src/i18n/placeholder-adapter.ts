/**
 * Documented placeholder locale adapter (RN 11 — i18n).
 *
 * A dependency-free {@link LocaleAdapter} for wiring and tests. It holds the
 * locale IN MEMORY — NO native module (e.g. `expo-localization`), NO persistence
 * (mission). A derived project replaces it with a real adapter; the contract and
 * the localization service stay identical.
 *
 * `setLocale` normalises the code and notifies subscribers. In-memory only.
 *
 * Agnostic (no React/RN import) → `node --test`-able.
 */
import type { LocaleAdapter } from './adapter';
import { DEFAULT_LOCALE, normalizeLocale, type LocaleCode } from './locale';

/** A placeholder adapter with an extra `setLocale` for wiring/tests. */
export interface PlaceholderLocaleAdapter extends LocaleAdapter {
  setLocale(locale: LocaleCode): void;
}

/** Create an in-memory placeholder locale adapter (no native dependency). */
export function createPlaceholderLocaleAdapter(
  initial: LocaleCode = DEFAULT_LOCALE,
): PlaceholderLocaleAdapter {
  let current = normalizeLocale(initial);
  const listeners = new Set<(locale: LocaleCode) => void>();

  return {
    getLocale: () => current,
    setLocale: (locale) => {
      current = normalizeLocale(locale);
      for (const listener of listeners) {
        listener(current);
      }
    },
    subscribe: (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}
