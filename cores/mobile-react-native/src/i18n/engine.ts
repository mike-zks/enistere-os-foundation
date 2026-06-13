/**
 * Localization service (RN 11 — i18n).
 *
 * Ties a {@link LocaleAdapter}, a set of per-locale catalogs and the `Intl`
 * formatters into one cohesive, generic entry point. It resolves the active
 * locale (adapter → best available → fallback), binds a {@link Translator}, and
 * pre-binds the formatters to that locale. **No business catalog, no native
 * module, no locale persistence** (mission).
 *
 * The active locale is read at creation (a snapshot). A host that needs to react
 * to locale changes re-creates the service on the adapter's `subscribe`.
 *
 * PURE / framework-agnostic (no React/RN import) → `node --test`-able.
 */
import type { LocaleAdapter } from './adapter';
import {
  createTranslator,
  type MessageCatalog,
  type MessageParams,
} from './catalog';
import { formatCurrency, formatDate, formatNumber } from './format';
import {
  DEFAULT_LOCALE,
  getLocaleDirection,
  normalizeLocale,
  resolveLocale,
  type LocaleCode,
  type LocaleDirection,
} from './locale';

export interface LocalizationConfig {
  readonly adapter: LocaleAdapter;
  /** Per-locale catalogs (keys are normalised internally). */
  readonly catalogs: Readonly<Record<LocaleCode, MessageCatalog>>;
  /** Locale used when the requested one is unavailable (default `en`). */
  readonly fallbackLocale?: LocaleCode;
}

export interface Localization {
  /** Resolved active locale (normalised). */
  readonly locale: LocaleCode;
  /** Text direction of the active locale. */
  readonly direction: LocaleDirection;
  t(key: string, params?: MessageParams): string;
  plural(key: string, count: number, params?: MessageParams): string;
  formatDate(value: Date | number, options?: Intl.DateTimeFormatOptions): string;
  formatNumber(value: number, options?: Intl.NumberFormatOptions): string;
  formatCurrency(value: number, currency: string, options?: Intl.NumberFormatOptions): string;
}

/** Build a {@link Localization} from an adapter + catalogs. */
export function createLocalization(config: LocalizationConfig): Localization {
  const fallback = normalizeLocale(config.fallbackLocale ?? DEFAULT_LOCALE);

  const catalogs: Record<LocaleCode, MessageCatalog> = {};
  for (const [key, value] of Object.entries(config.catalogs)) {
    catalogs[normalizeLocale(key)] = value;
  }

  const locale = resolveLocale(config.adapter.getLocale(), Object.keys(catalogs), fallback);
  const direction = getLocaleDirection(locale);
  const translator = createTranslator({
    catalog: catalogs[locale] ?? catalogs[fallback] ?? {},
    fallbackCatalog: catalogs[fallback],
    locale,
  });

  return {
    locale,
    direction,
    t: translator.t,
    plural: translator.plural,
    formatDate: (value, options) => formatDate(value, locale, options),
    formatNumber: (value, options) => formatNumber(value, locale, options),
    formatCurrency: (value, currency, options) => formatCurrency(value, currency, locale, options),
  };
}
