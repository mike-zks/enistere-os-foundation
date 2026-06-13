/**
 * Localization service + placeholder adapter (RN 11 — i18n) — `node --test`.
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { createLocalization } from '../src/i18n/engine';
import { createPlaceholderLocaleAdapter } from '../src/i18n/placeholder-adapter';

const catalogs = {
  en: { hello: 'Hello {name}', 'items.one': '{count} item', 'items.other': '{count} items' },
  'fr-FR': { hello: 'Bonjour {name}', 'items.one': '{count} article', 'items.other': '{count} articles' },
};

test('resolves the active locale from the adapter (exact match)', () => {
  const i18n = createLocalization({
    adapter: createPlaceholderLocaleAdapter('fr-FR'),
    catalogs,
    fallbackLocale: 'en',
  });
  assert.equal(i18n.locale, 'fr-FR');
  assert.equal(i18n.direction, 'ltr');
  assert.equal(i18n.t('hello', { name: 'Léa' }), 'Bonjour Léa');
  assert.equal(i18n.plural('items', 2), '2 articles');
});

test('falls back to the fallback locale + catalog for an unavailable locale', () => {
  const i18n = createLocalization({
    adapter: createPlaceholderLocaleAdapter('de-DE'),
    catalogs,
    fallbackLocale: 'en',
  });
  assert.equal(i18n.locale, 'en');
  assert.equal(i18n.t('hello', { name: 'Sam' }), 'Hello Sam');
});

test('language-only match (fr -> fr-FR) and normalised catalog keys', () => {
  const i18n = createLocalization({
    adapter: createPlaceholderLocaleAdapter('fr'),
    catalogs: { en: { hi: 'Hi' }, FR_fr: { hi: 'Salut' } },
    fallbackLocale: 'en',
  });
  assert.equal(i18n.locale, 'fr-FR'); // normalised + language match
  assert.equal(i18n.t('hi'), 'Salut');
});

test('formatters are bound to the resolved locale', () => {
  const i18n = createLocalization({
    adapter: createPlaceholderLocaleAdapter('fr-FR'),
    catalogs,
  });
  assert.match(i18n.formatNumber(1234.5), /^1\s234,5$/); // fr-FR grouping separator
  assert.match(i18n.formatCurrency(5, 'EUR'), /5,00\s*€/);
  assert.equal(
    i18n.formatDate(new Date('2026-01-15T00:00:00Z'), {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      timeZone: 'UTC',
    }),
    '15/01/2026',
  );
});

test('placeholder adapter notifies subscribers on setLocale', () => {
  const adapter = createPlaceholderLocaleAdapter('en');
  const seen: string[] = [];
  const unsubscribe = adapter.subscribe?.((l) => seen.push(l));
  adapter.setLocale('fr_FR');
  assert.equal(adapter.getLocale(), 'fr-FR'); // normalised
  assert.deepEqual(seen, ['fr-FR']);
  unsubscribe?.();
  adapter.setLocale('en');
  assert.deepEqual(seen, ['fr-FR']); // no more notifications after unsubscribe
});

test('missing key never throws in the service', () => {
  const i18n = createLocalization({ adapter: createPlaceholderLocaleAdapter('en'), catalogs });
  assert.equal(i18n.t('nope.key'), 'nope.key');
});
