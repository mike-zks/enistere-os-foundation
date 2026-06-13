/**
 * Generic i18n / localization primitives (RN 11).
 *
 * A normalised locale model + direction helpers, a typed message catalog with
 * safe interpolation/pluralisation, `Intl`-based formatters, an agnostic locale
 * adapter contract, a documented dependency-free placeholder adapter, and a
 * cohesive localization service. GENERIC only — **derived projects bring their
 * own business catalogs**; no native module, no locale persistence, no UI. See
 * ARCHITECTURE §20.
 */
export {
  DEFAULT_LOCALE,
  normalizeLocale,
  getLanguageSubtag,
  getLocaleDirection,
  resolveLocale,
} from './locale';
export type { LocaleCode, LocaleDirection } from './locale';

export { interpolate, createTranslator } from './catalog';
export type { MessageCatalog, MessageParams, Translator, TranslatorOptions } from './catalog';

export { formatDate, formatNumber, formatCurrency } from './format';

export type { LocaleAdapter } from './adapter';

export { createPlaceholderLocaleAdapter } from './placeholder-adapter';
export type { PlaceholderLocaleAdapter } from './placeholder-adapter';

export { createLocalization } from './engine';
export type { Localization, LocalizationConfig } from './engine';
