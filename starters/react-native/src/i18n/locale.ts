/**
 * Locale model (RN 11 — i18n / localisation).
 *
 * A normalised BCP-47 locale + direction helpers. The foundation ships only
 * GENERIC primitives — no business catalog, no locale persistence, no native
 * module (mission). Canonicalisation reuses the built-in `Intl` (no dependency).
 *
 * PURE / framework-agnostic (no React/RN/ESM import) → unit-tested under
 * `node --test`.
 */

/** A BCP-47 locale code, e.g. `en`, `fr-FR`, `zh-Hant-TW`. */
export type LocaleCode = string;

/** Text direction of a locale. */
export type LocaleDirection = 'ltr' | 'rtl';

/** Default/fallback locale when none can be resolved. */
export const DEFAULT_LOCALE: LocaleCode = 'en';

/** Right-to-left language subtags. */
const RTL_LANGUAGES: ReadonlySet<string> = new Set([
  'ar',
  'he',
  'fa',
  'ur',
  'ps',
  'sd',
  'ug',
  'yi',
  'dv',
  'ckb',
]);

/**
 * Canonicalise an arbitrary locale input (case, separators) into a valid BCP-47
 * code. Accepts `_` or `-` separators; anything invalid → `fallback` (never
 * throws). Uses `Intl.getCanonicalLocales` for correct case/script handling.
 */
export function normalizeLocale(input: unknown, fallback: LocaleCode = DEFAULT_LOCALE): LocaleCode {
  if (typeof input !== 'string') {
    return fallback;
  }
  const cleaned = input.trim().replace(/_/g, '-');
  if (cleaned.length === 0) {
    return fallback;
  }
  try {
    const [canonical] = Intl.getCanonicalLocales(cleaned);
    return canonical ?? fallback;
  } catch {
    return fallback;
  }
}

/** The (lowercased) primary language subtag of a locale, e.g. `fr` from `fr-FR`. */
export function getLanguageSubtag(locale: LocaleCode): string {
  return (normalizeLocale(locale).split('-')[0] ?? '').toLowerCase();
}

/** Text direction (`rtl` for Arabic/Hebrew/… else `ltr`). */
export function getLocaleDirection(locale: LocaleCode): LocaleDirection {
  return RTL_LANGUAGES.has(getLanguageSubtag(locale)) ? 'rtl' : 'ltr';
}

/**
 * Pick the best available locale for a requested one: exact match, then a
 * language-only match, then `fallback` (or the first available). Returns a
 * NORMALISED code drawn from `available`. Never throws.
 */
export function resolveLocale(
  requested: unknown,
  available: readonly LocaleCode[],
  fallback: LocaleCode = DEFAULT_LOCALE,
): LocaleCode {
  const normalizedFallback = normalizeLocale(fallback);
  const avail = available.map((a) => normalizeLocale(a));
  if (avail.length === 0) {
    return normalizedFallback;
  }
  const req = normalizeLocale(requested, normalizedFallback);
  if (avail.includes(req)) {
    return req;
  }
  const lang = req.split('-')[0];
  const byLanguage = avail.find((a) => a.split('-')[0] === lang);
  if (byLanguage) {
    return byLanguage;
  }
  return avail.includes(normalizedFallback) ? normalizedFallback : (avail[0] ?? normalizedFallback);
}
