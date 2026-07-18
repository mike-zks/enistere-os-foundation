/**
 * Telemetry context + consent gate (RN 25) - `node --test`.
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { createPlaceholderConsentStore } from '../src/consent/placeholder-store';
import { createConsentService } from '../src/consent/service';
import {
  buildTelemetryContext,
  describeTelemetryContextForLog,
} from '../src/telemetry/context';
import {
  getTelemetryConsentDecision,
  isTelemetryCategoryAllowed,
} from '../src/telemetry/gate';

test('buildTelemetryContext keeps only safe RN22 environment fields', () => {
  const context = buildTelemetryContext({
    os: 'ios',
    osVersion: '17.5.1',
    appVersion: '1.2.3',
    buildNumber: '42',
    buildChannel: 'Preview',
    locale: 'fr-fr',
    environment: 'production',
    deviceId: 'device-123',
    installationId: 'install-456',
    idfa: 'idfa-789',
    pushToken: 'ExponentPushToken[secret]',
    email: 'person@example.com',
    signedUrl: 'https://files.example/x?X-Amz-Signature=secret',
  });

  assert.deepEqual(context, {
    os: 'ios',
    osVersionMajor: 17,
    appVersion: '1.2.3',
    buildNumber: '42',
    buildChannel: 'preview',
    locale: 'fr-FR',
    environment: 'production',
  });
  const serialised = JSON.stringify(context);
  for (const forbidden of ['device-123', 'install-456', 'idfa-789', 'ExponentPushToken', 'person@example.com', 'X-Amz']) {
    assert.ok(!serialised.includes(forbidden), forbidden);
  }
});

test('describeTelemetryContextForLog exposes only count and coarse enums', () => {
  const context = buildTelemetryContext({
    os: 'android',
    osVersionMajor: 14,
    appVersion: '9.9.9',
    locale: 'en-US',
    environment: 'staging',
  });
  const descriptor = describeTelemetryContextForLog(context);
  assert.deepEqual(descriptor, { fieldCount: 5, os: 'android', environment: 'staging' });
  assert.ok(!JSON.stringify(descriptor).includes('9.9.9'));
  assert.ok(!JSON.stringify(descriptor).includes('en-US'));
});

test('telemetry consent gate is default-deny and allows only granted categories', async () => {
  const consent = createConsentService({
    store: createPlaceholderConsentStore({
      analytics: 'granted',
      crash: 'denied',
    }),
  });

  assert.equal(await isTelemetryCategoryAllowed(consent, 'analytics'), true);
  assert.equal(await isTelemetryCategoryAllowed(consent, 'crash'), false);

  const crashDecision = await getTelemetryConsentDecision(consent, 'crash');
  assert.deepEqual(crashDecision, { category: 'crash', status: 'denied', allowed: false });

  await consent.clear();
  const unknownDecision = await getTelemetryConsentDecision(consent, 'analytics');
  assert.deepEqual(unknownDecision, {
    category: 'analytics',
    status: 'unknown',
    allowed: false,
  });
});
