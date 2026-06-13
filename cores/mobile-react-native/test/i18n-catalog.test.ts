/**
 * Message catalog + interpolation/pluralisation (RN 11 — i18n) — `node --test`.
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { createTranslator, interpolate } from '../src/i18n/catalog';

test('interpolate replaces {name} and leaves unknown placeholders as-is', () => {
  assert.equal(interpolate('Hello {name}', { name: 'Mia' }), 'Hello Mia');
  assert.equal(interpolate('You have {n} items', { n: 3 }), 'You have 3 items');
  assert.equal(interpolate('Hi {name}', {}), 'Hi {name}'); // missing param left intact
  assert.equal(interpolate('No params here'), 'No params here');
});

test('t() translates, interpolates, and falls back without throwing', () => {
  const t = createTranslator({
    catalog: { greeting: 'Bonjour {name}' },
    fallbackCatalog: { farewell: 'Goodbye' },
  });
  assert.equal(t.t('greeting', { name: 'Léa' }), 'Bonjour Léa');
  assert.equal(t.t('farewell'), 'Goodbye'); // from fallback catalog
  assert.equal(t.t('missing.key'), 'missing.key'); // unknown key -> the key, no throw
  assert.equal(t.has('greeting'), true);
  assert.equal(t.has('nope'), false);
});

test('onMissing customises the missing-key behaviour', () => {
  const t = createTranslator({ catalog: {}, onMissing: (key) => `??${key}??` });
  assert.equal(t.t('x'), '??x??');
});

test('plural selects CLDR categories (en: one/other)', () => {
  const t = createTranslator({
    catalog: { 'items.one': '{count} item', 'items.other': '{count} items' },
    locale: 'en',
  });
  assert.equal(t.plural('items', 1), '1 item');
  assert.equal(t.plural('items', 5), '5 items');
  assert.equal(t.plural('items', 0), '0 items');
});

test('plural falls back to .other then the key, never throws', () => {
  const t = createTranslator({ catalog: { 'x.other': '{count} x' }, locale: 'en' });
  assert.equal(t.plural('x', 1), '1 x'); // no .one -> .other
  assert.equal(t.plural('unknown', 2), 'unknown'); // nothing -> key, no throw
});

test('plural respects a French-style locale (one for 0 and 1)', () => {
  const t = createTranslator({
    catalog: { 'd.one': '{count} jour', 'd.other': '{count} jours' },
    locale: 'fr',
  });
  assert.equal(t.plural('d', 0), '0 jour'); // fr: 0 is "one"
  assert.equal(t.plural('d', 1), '1 jour');
  assert.equal(t.plural('d', 2), '2 jours');
});
