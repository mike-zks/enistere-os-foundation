/**
 * Telemetry-consent model + privacy helpers (RN 21 — consent) — `node --test`.
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  CONSENT_CATEGORIES,
  describeConsentEntryForLog,
  describeConsentForLog,
  isConsentCategory,
  isConsentGranted,
  isConsentStatus,
  isTelemetryAllowed,
  normalizeConsentCategory,
  normalizeConsentStatus,
  sanitizeConsentSet,
} from '../src/consent/model';

test('the closed category set covers the mandated minimum', () => {
  for (const category of ['analytics', 'crash', 'performance', 'diagnostics'] as const) {
    assert.ok(CONSENT_CATEGORIES.includes(category), category);
    assert.equal(isConsentCategory(category), true, category);
  }
  assert.equal(isConsentCategory('marketing'), false);
  assert.equal(isConsentCategory(42), false);
});

test('normalizeConsentCategory folds known categories, junk → undefined', () => {
  assert.equal(normalizeConsentCategory('ANALYTICS'), 'analytics');
  assert.equal(normalizeConsentCategory(' crash '), 'crash');
  for (const junk of [null, undefined, 1, {}, 'marketing', 'ads']) {
    assert.equal(normalizeConsentCategory(junk), undefined, String(junk));
  }
});

test('normalizeConsentStatus folds aliases, junk → unknown (never silently granted)', () => {
  assert.equal(normalizeConsentStatus('granted'), 'granted');
  assert.equal(normalizeConsentStatus('OptIn'), 'granted');
  assert.equal(normalizeConsentStatus('opt_out'.replace('_', '')), 'denied'); // 'optout'
  assert.equal(normalizeConsentStatus('refused'), 'denied');
  assert.equal(normalizeConsentStatus('pending'), 'unknown');
  for (const junk of [null, undefined, 0, {}, 'weird']) {
    assert.equal(normalizeConsentStatus(junk), 'unknown', String(junk));
  }
  assert.equal(isConsentStatus('granted'), true);
  assert.equal(isConsentStatus('allowed'), false); // alias, not canonical
});

test('default-deny: only granted is allowed; denied/unknown/absent/invalid block', () => {
  assert.equal(isConsentGranted('granted'), true);
  for (const s of ['denied', 'unknown', null, 'x']) {
    assert.equal(isConsentGranted(s), false, String(s));
  }
  const set = sanitizeConsentSet({ analytics: 'granted', crash: 'denied' });
  assert.equal(isTelemetryAllowed(set, 'analytics'), true);
  assert.equal(isTelemetryAllowed(set, 'crash'), false); // denied
  assert.equal(isTelemetryAllowed(set, 'performance'), false); // absent → unknown
  assert.equal(isTelemetryAllowed(set, 'marketing'), false); // invalid category
  assert.equal(isTelemetryAllowed(set, null), false);
});

test('sanitizeConsentSet keeps known categories, drops unknown/invalid, tolerant', () => {
  const set = sanitizeConsentSet({
    analytics: 'granted',
    crash: 'opt-out'.replace('-', ''), // 'optout' → denied
    performance: 'pending', // → unknown → dropped
    marketing: 'granted', // unknown category → dropped
  });
  assert.deepEqual(set, { analytics: 'granted', crash: 'denied' });
  assert.ok(Object.isFrozen(set));
  for (const junk of [null, undefined, 42, 'str', []]) {
    assert.deepEqual({ ...sanitizeConsentSet(junk) }, {});
  }
});

test('describe*ForLog expose enums / count ONLY (no user value)', () => {
  assert.deepEqual(describeConsentEntryForLog('analytics', 'granted'), {
    category: 'analytics',
    status: 'granted',
  });
  assert.deepEqual(describeConsentForLog(sanitizeConsentSet({ analytics: 'granted', crash: 'denied' })), {
    count: 2,
  });
});
