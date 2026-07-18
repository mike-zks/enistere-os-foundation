/**
 * Non-sensitive preference service + placeholder store (RN 20) — `node --test`.
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { createLogger, type LogRecord } from '../src/logger/logger';
import { createPreferenceService } from '../src/preferences/service';
import { createPlaceholderPreferenceStore } from '../src/preferences/placeholder-store';
import type { PreferenceSet, PreferenceStore } from '../src/preferences';

test('set/get/remove/clear round-trip on non-sensitive preferences', async () => {
  const store = createPlaceholderPreferenceStore();
  const prefs = createPreferenceService({ store });
  await prefs.set('theme', 'dark');
  await prefs.set('fontScale', 1.5);
  await prefs.set('reduceMotion', true);
  assert.equal(await prefs.getString('theme', 'system'), 'dark');
  assert.equal(await prefs.getNumber('fontScale', 1), 1.5);
  assert.equal(await prefs.getBoolean('reduceMotion', false), true);
  assert.deepEqual({ ...(await prefs.getAll()) }, { theme: 'dark', fontScale: 1.5, reduceMotion: true });

  await prefs.remove('theme');
  assert.equal(await prefs.getString('theme', 'system'), 'system');
  await prefs.clear();
  assert.deepEqual({ ...(await prefs.getAll()) }, {});
});

test('typed getters fall back to safe defaults on absence / type mismatch', async () => {
  const store = createPlaceholderPreferenceStore();
  const prefs = createPreferenceService({ store });
  await prefs.set('n', 7);
  assert.equal(await prefs.getNumber('n', 0), 7);
  assert.equal(await prefs.getString('n', 'def'), 'def'); // mistyped → default
  assert.equal(await prefs.getBoolean('missing', true), true);
});

test('set REFUSES sensitive keys — nothing is persisted', async () => {
  const store = createPlaceholderPreferenceStore();
  const prefs = createPreferenceService({ store });
  for (const key of ['token', 'accessToken', 'refresh_token', 'password', 'email', 'phone', 'signedUrl', 'apiKey']) {
    await prefs.set(key, 'whatever');
  }
  assert.deepEqual({ ...store.snapshot() }, {}, 'no sensitive key reached the store');
});

test('set REFUSES sensitive string values — never persists a (masked) secret', async () => {
  const store = createPlaceholderPreferenceStore();
  const prefs = createPreferenceService({ store });
  await prefs.set('note', 'Bearer abcdefghij.klmnopqrst.uvwxyz');
  await prefs.set('lastUrl', 'https://x.io/d?X-Amz-Signature=abc&token=zzz');
  await prefs.set('avatar', 'file:///data/user/0/app/secret.png');
  await prefs.set('contact', 'user@host.com');
  assert.deepEqual({ ...store.snapshot() }, {}, 'no sensitive value reached the store');
  // a clean value still goes through
  await prefs.set('note', 'remember me');
  assert.equal(await prefs.getString('note', ''), 'remember me');
});

test('reads SANITISE store contents (defence-in-depth against externally-written secrets)', async () => {
  const store = createPlaceholderPreferenceStore();
  // seed the store directly, bypassing the service guard (simulates external data)
  await store.set('theme', 'dark');
  await store.set('note', 'Bearer abcdefghij.klmnopqrst.uvwxyz'); // sensitive value
  const prefs = createPreferenceService({ store });
  assert.equal(await prefs.get('note'), undefined); // sanitised on read
  assert.deepEqual({ ...(await prefs.getAll()) }, { theme: 'dark' });
});

test('a failing store is best-effort: methods never throw, reads fall back', async () => {
  const failing: PreferenceStore = {
    get: () => Promise.reject(new Error('boom')),
    set: () => Promise.reject(new Error('boom')),
    remove: () => Promise.reject(new Error('boom')),
    clear: () => Promise.reject(new Error('boom')),
    getAll: () => Promise.reject(new Error('boom')),
  };
  const prefs = createPreferenceService({ store: failing });
  await assert.doesNotReject(prefs.set('theme', 'dark'));
  await assert.doesNotReject(prefs.remove('theme'));
  await assert.doesNotReject(prefs.clear());
  assert.equal(await prefs.getString('theme', 'system'), 'system');
  assert.deepEqual({ ...(await prefs.getAll()) }, {});
});

test('subscribe forwards sanitised sets; a throwing listener is isolated', async () => {
  const store = createPlaceholderPreferenceStore();
  const prefs = createPreferenceService({ store });
  const seen: PreferenceSet[] = [];
  prefs.subscribe(() => {
    throw new Error('listener boom');
  });
  const unsubscribe = prefs.subscribe((set) => seen.push(set));
  await prefs.set('theme', 'dark');
  assert.equal(seen.length, 1);
  assert.deepEqual({ ...seen[0] }, { theme: 'dark' });

  unsubscribe();
  await prefs.set('fontScale', 2);
  assert.equal(seen.length, 1, 'unsubscribed listener no longer notified');
});

test('the logger only ever sees { operation, count } — never a key or value', async () => {
  const records: LogRecord[] = [];
  const logger = createLogger({ level: 'debug', sink: (r) => records.push(r), clock: () => 1 });
  const store = createPlaceholderPreferenceStore();
  const prefs = createPreferenceService({ store, logger });
  await prefs.set('theme', 'dark-secret-marker');
  await prefs.set('accessToken', 'leak'); // rejected
  await prefs.getAll();

  const serialised = JSON.stringify(records);
  assert.ok(!serialised.includes('dark-secret-marker'));
  assert.ok(!serialised.includes('accessToken'));
  assert.ok(!serialised.includes('theme'));
  const allowed = new Set(['operation', 'count']);
  for (const record of records) {
    for (const key of Object.keys(record.fields ?? {})) {
      assert.ok(allowed.has(key), `unexpected logged field: ${key}`);
    }
  }
});

test('tolerates invalid set inputs without throwing (no-op)', async () => {
  const store = createPlaceholderPreferenceStore();
  const prefs = createPreferenceService({ store });
  await assert.doesNotReject(prefs.set('bad key', 'x'));
  await assert.doesNotReject(prefs.set('nested', { a: 1 } as unknown as string));
  await assert.doesNotReject(prefs.set('big', 'z'.repeat(5000)));
  assert.equal('bad key' in store.snapshot(), false);
  assert.equal('nested' in store.snapshot(), false);
  // oversized string is bounded, not rejected
  assert.equal((await prefs.getString('big', '')).length > 0, true);
});
