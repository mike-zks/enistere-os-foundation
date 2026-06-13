/**
 * Preference-backed consent store (RN 21 — consent over RN 20 preferences) — `node --test`.
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { createPreferenceService } from '../src/preferences';
import { createPlaceholderPreferenceStore } from '../src/preferences/placeholder-store';
import { createConsentService } from '../src/consent/service';
import { consentKey, createPreferenceConsentStore } from '../src/consent/store';

test('consent persists as non-sensitive privacy.consent.* preference keys', async () => {
  const prefStore = createPlaceholderPreferenceStore();
  const preferences = createPreferenceService({ store: prefStore });
  const consent = createConsentService({ store: createPreferenceConsentStore(preferences) });

  await consent.set('analytics', 'granted');
  await consent.set('crash', 'denied');

  // stored under the expected non-sensitive keys
  assert.equal(consentKey('analytics'), 'privacy.consent.analytics');
  const snapshot = prefStore.snapshot();
  assert.equal(snapshot['privacy.consent.analytics'], 'granted');
  assert.equal(snapshot['privacy.consent.crash'], 'denied');
  // the preference service did NOT drop these (keys/values are non-sensitive)
  assert.equal(await preferences.getString('privacy.consent.analytics', 'unknown'), 'granted');
});

test('round-trip via the preference-backed store + default-deny', async () => {
  const preferences = createPreferenceService({ store: createPlaceholderPreferenceStore() });
  const consent = createConsentService({ store: createPreferenceConsentStore(preferences) });

  assert.equal(await consent.isAllowed('analytics'), false); // unset → unknown → deny
  await consent.set('analytics', 'granted');
  assert.equal(await consent.isAllowed('analytics'), true);
  assert.deepEqual({ ...(await consent.getAll()) }, { analytics: 'granted' });

  // setting unknown removes the entry
  await consent.set('analytics', 'unknown');
  assert.deepEqual({ ...(await consent.getAll()) }, {});
});

test('clear() removes ONLY consent keys, leaving other preferences intact', async () => {
  const prefStore = createPlaceholderPreferenceStore();
  const preferences = createPreferenceService({ store: prefStore });
  await preferences.set('theme', 'dark'); // unrelated non-sensitive pref
  const consent = createConsentService({ store: createPreferenceConsentStore(preferences) });
  await consent.set('analytics', 'granted');

  await consent.clear();
  assert.deepEqual({ ...(await consent.getAll()) }, {});
  assert.equal(await preferences.getString('theme', 'system'), 'dark', 'unrelated pref survives');
});
