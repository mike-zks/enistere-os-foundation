/**
 * Locale-aware formatters via the built-in `Intl` (RN 11 — i18n).
 *
 * Thin, dependency-free wrappers over `Intl.DateTimeFormat`/`Intl.NumberFormat`.
 * Each NEVER throws — an invalid locale/options/currency yields a safe fallback
 * string. There is **no default business currency**: `formatCurrency` requires
 * the caller to pass a currency code (mission).
 *
 * PURE / framework-agnostic (no React/RN/ESM import; no `Date.now()` — values
 * are passed in) → `node --test`-able.
 */
import { DEFAULT_LOCALE, type LocaleCode } from './locale';

/** Format a number for `locale`. Falls back to `String(value)` on error. */
export function formatNumber(
  value: number,
  locale?: LocaleCode,
  options?: Intl.NumberFormatOptions,
): string {
  try {
    return new Intl.NumberFormat(locale ?? DEFAULT_LOCALE, options).format(value);
  } catch {
    return String(value);
  }
}

/** Format a `Date`/epoch-ms for `locale`. Falls back to `''` on error. */
export function formatDate(
  value: Date | number,
  locale?: LocaleCode,
  options?: Intl.DateTimeFormatOptions,
): string {
  try {
    return new Intl.DateTimeFormat(locale ?? DEFAULT_LOCALE, options).format(value);
  } catch {
    return '';
  }
}

/**
 * Format a currency amount. `currency` is REQUIRED (no business default) — an
 * ISO-4217 code (`USD`, `EUR`, `XOF`…). Falls back to `String(value)` on error
 * (e.g. an invalid currency code).
 */
export function formatCurrency(
  value: number,
  currency: string,
  locale?: LocaleCode,
  options?: Intl.NumberFormatOptions,
): string {
  try {
    return new Intl.NumberFormat(locale ?? DEFAULT_LOCALE, {
      ...options,
      style: 'currency',
      currency,
    }).format(value);
  } catch {
    return String(value);
  }
}
