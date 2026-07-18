/**
 * Typed message catalog + safe interpolation/pluralisation (RN 11 — i18n).
 *
 * A catalog is a flat `key → template` map. The foundation provides the GENERIC
 * machinery only; **derived projects bring their own business catalogs**
 * (mission). A missing key NEVER throws — it falls back to a fallback catalog,
 * a custom handler, or the key itself (debuggable).
 *
 * PURE / framework-agnostic (no React/RN/ESM import) → `node --test`-able.
 */
import { DEFAULT_LOCALE, type LocaleCode } from './locale';

/** Interpolation parameters (`{name}` → value). */
export type MessageParams = Readonly<Record<string, string | number>>;

/** A flat message catalog: stable keys → templates. */
export type MessageCatalog = Readonly<Record<string, string>>;

/**
 * Replace `{name}` placeholders with `params.name`. A placeholder with no
 * matching param is LEFT AS-IS (predictable/debuggable). Pure, no ReDoS risk.
 */
export function interpolate(template: string, params?: MessageParams): string {
  if (!params) {
    return template;
  }
  return template.replace(/\{(\w+)\}/g, (match, key: string) => {
    const value = params[key];
    return value === undefined ? match : String(value);
  });
}

export interface TranslatorOptions {
  readonly catalog: MessageCatalog;
  /** Consulted when a key is absent from `catalog`. */
  readonly fallbackCatalog?: MessageCatalog;
  /** Locale used for plural-category selection (default `en`). */
  readonly locale?: LocaleCode;
  /** Called when a key is missing everywhere (default: return the key). */
  readonly onMissing?: (key: string) => string;
}

export interface Translator {
  /** Translate `key`, interpolating `params`. Never throws. */
  t(key: string, params?: MessageParams): string;
  /** True when `key` exists in the catalog or the fallback catalog. */
  has(key: string): boolean;
  /**
   * Pluralised translation: selects `${key}.${category}` (CLDR category via
   * `Intl.PluralRules`), falling back to `${key}.other` then `${key}`. `count`
   * is always available as `{count}`. Never throws.
   */
  plural(key: string, count: number, params?: MessageParams): string;
}

function safePluralRules(locale: LocaleCode | undefined): Intl.PluralRules {
  try {
    return new Intl.PluralRules(locale ?? DEFAULT_LOCALE);
  } catch {
    return new Intl.PluralRules(DEFAULT_LOCALE);
  }
}

/** Build a {@link Translator} over a catalog (+ optional fallback catalog). */
export function createTranslator(options: TranslatorOptions): Translator {
  const { catalog, fallbackCatalog, locale, onMissing } = options;
  const pluralRules = safePluralRules(locale);

  function lookup(key: string): string | undefined {
    if (Object.prototype.hasOwnProperty.call(catalog, key)) {
      return catalog[key];
    }
    if (fallbackCatalog && Object.prototype.hasOwnProperty.call(fallbackCatalog, key)) {
      return fallbackCatalog[key];
    }
    return undefined;
  }

  function resolve(key: string): string {
    const found = lookup(key);
    if (found !== undefined) {
      return found;
    }
    return onMissing ? onMissing(key) : key;
  }

  return {
    t: (key, params) => interpolate(resolve(key), params),
    has: (key) => lookup(key) !== undefined,
    plural: (key, count, params) => {
      const category = pluralRules.select(count);
      const template = lookup(`${key}.${category}`) ?? lookup(`${key}.other`) ?? resolve(key);
      return interpolate(template, { count, ...params });
    },
  };
}
