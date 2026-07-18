/**
 * Safe app-environment model + normalizers (RN 22 — app environment) — `node --test`.
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  MAX_APP_VERSION_LENGTH,
  MAX_OS_VERSION_MAJOR,
  describeAppEnvironmentForLog,
  isAppOs,
  normalizeAppVersion,
  normalizeBuildChannel,
  normalizeBuildNumber,
  normalizeMajorVersion,
  normalizeOs,
  normalizeRuntimeEnvironment,
  sanitizeAppEnvironmentSnapshot,
} from '../src/app-environment/model';

test('normalizeOs folds aliases, junk → unknown', () => {
  assert.equal(normalizeOs('iOS'), 'ios');
  assert.equal(normalizeOs('iPadOS'), 'ios');
  assert.equal(normalizeOs('Android'), 'android');
  assert.equal(normalizeOs('browser'), 'web');
  for (const junk of [null, undefined, 1, 'windows', 'macos', {}]) {
    assert.equal(normalizeOs(junk), 'unknown', String(junk));
  }
  assert.equal(isAppOs('ios'), true);
  assert.equal(isAppOs('windows'), false);
});

test('normalizeMajorVersion reduces detailed versions to the MAJOR integer', () => {
  assert.equal(normalizeMajorVersion('17.5.1'), 17);
  assert.equal(normalizeMajorVersion('18'), 18);
  assert.equal(normalizeMajorVersion(14.9), 14);
  assert.equal(normalizeMajorVersion('  9.0 (rc)'), 9);
  assert.equal(normalizeMajorVersion(99999), MAX_OS_VERSION_MAJOR); // bounded
  for (const junk of [null, undefined, -1, 'x', {}, Number.NaN]) {
    assert.equal(normalizeMajorVersion(junk), undefined, String(junk));
  }
});

test('version/channel tokens are bounded + allow-listed (free text dropped)', () => {
  assert.equal(normalizeAppVersion('1.4.0'), '1.4.0');
  assert.equal(normalizeAppVersion('2.0.0-beta.1'), '2.0.0-beta.1');
  assert.equal(normalizeAppVersion('My Secret Build (user@host)'), undefined); // spaces/@ → dropped
  assert.equal(normalizeAppVersion('x'.repeat(MAX_APP_VERSION_LENGTH + 10)), 'x'.repeat(MAX_APP_VERSION_LENGTH));
  assert.equal(normalizeBuildNumber('142'), '142');
  assert.equal(normalizeBuildChannel('Production'), 'production');
  assert.equal(normalizeBuildChannel('weird channel!'), undefined);
  assert.equal(normalizeRuntimeEnvironment('prod'), 'production');
  assert.equal(normalizeRuntimeEnvironment('preview'), 'staging');
  assert.equal(normalizeRuntimeEnvironment('marketing'), undefined);
});

test('sanitizeAppEnvironmentSnapshot keeps only the allow-list; drops identifiers', () => {
  const snapshot = sanitizeAppEnvironmentSnapshot({
    os: 'ios',
    osVersion: '17.5.1',
    appVersion: '1.4.0',
    buildNumber: '142',
    buildChannel: 'production',
    locale: 'fr_FR',
    environment: 'prod',
    // identifying fields that MUST be dropped:
    deviceId: 'ABC-123',
    idfa: '00000000-0000-0000',
    androidId: 'deadbeef',
    installationId: 'inst-xyz',
    pushToken: 'ExponentPushToken[xxx]',
    serial: 'SN12345',
    model: 'iPhone15,3',
    ip: '10.0.0.1',
  });
  assert.deepEqual(
    { ...snapshot },
    {
      os: 'ios',
      osVersionMajor: 17,
      appVersion: '1.4.0',
      buildNumber: '142',
      buildChannel: 'production',
      locale: 'fr-FR',
      environment: 'production',
    },
  );
  assert.ok(Object.isFrozen(snapshot));
  // no identifying field leaked
  const serialised = JSON.stringify(snapshot);
  for (const id of ['ABC-123', 'idfa', 'androidId', 'installationId', 'ExponentPushToken', 'SN12345', 'iPhone15', '10.0.0.1']) {
    assert.ok(!serialised.includes(id), `leaked ${id}`);
  }
});

test('sanitizeAppEnvironmentSnapshot tolerates junk → { os: unknown }', () => {
  for (const junk of [null, undefined, 42, 'str', []]) {
    assert.deepEqual({ ...sanitizeAppEnvironmentSnapshot(junk) }, { os: 'unknown' }, String(junk));
  }
});

test('describeAppEnvironmentForLog exposes coarse fields ONLY (no version/locale strings)', () => {
  const snapshot = sanitizeAppEnvironmentSnapshot({
    os: 'android',
    osVersion: '14',
    appVersion: '3.2.1',
    buildNumber: '900',
    buildChannel: 'preview',
    locale: 'en-GB',
    environment: 'staging',
  });
  const desc = describeAppEnvironmentForLog(snapshot);
  assert.deepEqual(desc, {
    os: 'android',
    osVersionMajor: 14,
    buildChannel: 'preview',
    environment: 'staging',
  });
  // appVersion/buildNumber/locale are NOT in the log view
  assert.equal('appVersion' in desc, false);
  assert.equal('locale' in desc, false);
});
