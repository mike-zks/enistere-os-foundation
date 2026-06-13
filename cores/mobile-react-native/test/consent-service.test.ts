/**
 * Telemetry-consent service + placeholder store (RN 21 — consent) — `node --test`.
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { createLogger, type LogRecord } from '../src/logger/logger';
import { createConsentService } from '../src/consent/service';
import { createPlaceholderConsentStore } from '../src/consent/placeholder-store';
import type { ConsentSet, ConsentStore } from '../src/consent';

test('get/set/isAllowed round-trip with default-deny semantics', async () => {
  const store = createPlaceholderConsentStore();
  const consent = createConsentService({ store });

  // default: nothing decided → unknown → not allowed
  assert.equal(await consent.get('analytics'), 'unknown');
  assert.equal(await consent.isAllowed('analytics'), false);

  await consent.set('analytics', 'granted');
  assert.equal(await consent.get('analytics'), 'granted');
  assert.equal(await consent.isAllowed('analytics'), true);

  await consent.set('analytics', 'denied');
  assert.equal(await consent.isAllowed('analytics'), false);
});

test('unknown categories are ignored on set and never allowed', async () => {
  const store = createPlaceholderConsentStore();
  const consent = createConsentService({ store });
  await consent.set('marketing', 'granted'); // ignored
  assert.equal(await consent.isAllowed('marketing'), false);
  assert.deepEqual({ ...(await consent.getAll()) }, {});
});

test('getAll returns the sanitised set; clear wipes decisions', async () => {
  const store = createPlaceholderConsentStore();
  const consent = createConsentService({ store });
  await consent.set('analytics', 'granted');
  await consent.set('crash', 'denied');
  assert.deepEqual({ ...(await consent.getAll()) }, { analytics: 'granted', crash: 'denied' });
  await consent.clear();
  assert.deepEqual({ ...(await consent.getAll()) }, {});
  assert.equal(await consent.isAllowed('analytics'), false);
});

test('a failing store is best-effort: never throws, falls back to NOT allowed', async () => {
  const failing: ConsentStore = {
    get: () => Promise.reject(new Error('boom')),
    set: () => Promise.reject(new Error('boom')),
    getAll: () => Promise.reject(new Error('boom')),
    clear: () => Promise.reject(new Error('boom')),
  };
  const consent = createConsentService({ store: failing });
  assert.equal(await consent.get('analytics'), 'unknown');
  assert.equal(await consent.isAllowed('analytics'), false); // default-deny on error
  await assert.doesNotReject(consent.set('analytics', 'granted'));
  await assert.doesNotReject(consent.clear());
  assert.deepEqual({ ...(await consent.getAll()) }, {});
});

test('subscribe forwards sanitised sets; a throwing listener is isolated', async () => {
  const store = createPlaceholderConsentStore();
  const consent = createConsentService({ store });
  const seen: ConsentSet[] = [];
  consent.subscribe(() => {
    throw new Error('listener boom');
  });
  const unsubscribe = consent.subscribe((set) => seen.push(set));
  await consent.set('analytics', 'granted');
  assert.equal(seen.length, 1);
  assert.deepEqual({ ...seen[0] }, { analytics: 'granted' });

  unsubscribe();
  await consent.set('crash', 'denied');
  assert.equal(seen.length, 1, 'unsubscribed listener no longer notified');
});

test('the logger only ever sees safe enums / counts — never a user value', async () => {
  const records: LogRecord[] = [];
  const logger = createLogger({ level: 'debug', sink: (r) => records.push(r), clock: () => 1 });
  const store = createPlaceholderConsentStore();
  const consent = createConsentService({ store, logger });
  await consent.set('analytics', 'granted');
  await consent.set('marketing', 'granted'); // ignored
  await consent.getAll();

  const allowed = new Set(['operation', 'category', 'status', 'count']);
  for (const record of records) {
    for (const key of Object.keys(record.fields ?? {})) {
      assert.ok(allowed.has(key), `unexpected logged field: ${key}`);
    }
  }
  // category/status logged are enum members only
  const setRecord = records.find((r) => r.fields?.operation === 'set' && r.fields?.category);
  assert.equal(setRecord?.fields?.category, 'analytics');
  assert.equal(setRecord?.fields?.status, 'granted');
});
