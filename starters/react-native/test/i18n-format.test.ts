/**
 * Intl formatters (RN 11 — i18n) — `node --test`.
 *
 * Uses explicit options + UTC timezone for determinism across environments, and
 * `\s` for the fr-FR grouping separator (a narrow no-break space, U+202F).
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { formatCurrency, formatDate, formatNumber } from '../src/i18n/format';

test('formatNumber respects locale grouping', () => {
  assert.equal(formatNumber(1234.5, 'en-US'), '1,234.5');
  assert.match(formatNumber(1234.5, 'fr-FR'), /^1\s234,5$/); // grouping = narrow no-break space
});

test('formatNumber never throws on a bad locale', () => {
  assert.equal(formatNumber(42, '!!!bad'), '42');
});

test('formatCurrency requires a currency (no business default) and never throws', () => {
  assert.equal(formatCurrency(5, 'USD', 'en-US'), '$5.00');
  assert.match(formatCurrency(5, 'EUR', 'fr-FR'), /5,00\s*€/);
  assert.equal(formatCurrency(5, 'NOT_A_CURRENCY', 'en-US'), '5'); // invalid -> fallback
});

test('formatDate uses an explicit UTC format deterministically', () => {
  const date = new Date('2026-01-15T00:00:00Z');
  assert.equal(
    formatDate(date, 'en-US', { year: 'numeric', month: '2-digit', day: '2-digit', timeZone: 'UTC' }),
    '01/15/2026',
  );
  assert.equal(
    formatDate(date.getTime(), 'fr-FR', { year: 'numeric', month: '2-digit', day: '2-digit', timeZone: 'UTC' }),
    '15/01/2026',
  );
});

test('formatDate never throws on a bad locale', () => {
  assert.equal(typeof formatDate(new Date('2026-01-15T00:00:00Z'), '!!!bad'), 'string');
});
