/**
 * Locale model (RN 11 — i18n) — `node --test`.
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  DEFAULT_LOCALE,
  getLanguageSubtag,
  getLocaleDirection,
  normalizeLocale,
  resolveLocale,
} from '../src/i18n/locale';

test('normalizeLocale canonicalises case and separators', () => {
  assert.equal(normalizeLocale('EN'), 'en');
  assert.equal(normalizeLocale('fr_FR'), 'fr-FR');
  assert.equal(normalizeLocale('en-us'), 'en-US');
  assert.equal(normalizeLocale('  fr  '), 'fr');
  assert.equal(normalizeLocale('zh_hant_tw'), 'zh-Hant-TW');
});

test('normalizeLocale falls back (never throws) on invalid input', () => {
  assert.equal(normalizeLocale(''), DEFAULT_LOCALE);
  assert.equal(normalizeLocale('   '), DEFAULT_LOCALE);
  assert.equal(normalizeLocale('!!!'), DEFAULT_LOCALE);
  assert.equal(normalizeLocale(null), DEFAULT_LOCALE);
  assert.equal(normalizeLocale(42), DEFAULT_LOCALE);
  assert.equal(normalizeLocale('xx'), 'xx'); // syntactically valid subtag passes through
  assert.equal(normalizeLocale(123, 'fr-FR'), 'fr-FR'); // custom fallback on non-string
});

test('getLanguageSubtag extracts the primary language', () => {
  assert.equal(getLanguageSubtag('fr-FR'), 'fr');
  assert.equal(getLanguageSubtag('EN_us'), 'en');
  assert.equal(getLanguageSubtag('zh-Hant-TW'), 'zh');
});

test('getLocaleDirection detects RTL languages', () => {
  assert.equal(getLocaleDirection('ar'), 'rtl');
  assert.equal(getLocaleDirection('he-IL'), 'rtl');
  assert.equal(getLocaleDirection('fa'), 'rtl');
  assert.equal(getLocaleDirection('en'), 'ltr');
  assert.equal(getLocaleDirection('fr-FR'), 'ltr');
});

test('resolveLocale: exact, language-only, then fallback', () => {
  const available = ['en', 'fr-FR', 'ar'];
  assert.equal(resolveLocale('fr-FR', available), 'fr-FR'); // exact
  assert.equal(resolveLocale('fr-CA', available), 'fr-FR'); // language-only
  assert.equal(resolveLocale('de', available, 'en'), 'en'); // fallback
  assert.equal(resolveLocale('de', available, 'es'), 'en'); // fallback absent -> first available
  assert.equal(resolveLocale('xx', [], 'en'), 'en'); // nothing available
});
