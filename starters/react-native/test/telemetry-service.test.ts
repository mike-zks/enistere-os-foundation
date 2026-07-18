/**
 * Telemetry coordinator (RN 25) - `node --test`.
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';

import type { AnalyticsAdapter } from '../src/analytics/adapter';
import { createAnalyticsService } from '../src/analytics/engine';
import { createPlaceholderAnalyticsAdapter } from '../src/analytics/placeholder-adapter';
import { createPlaceholderAppEnvironmentAdapter } from '../src/app-environment/placeholder-adapter';
import { createAppEnvironmentService } from '../src/app-environment/service';
import { createPlaceholderConsentStore } from '../src/consent/placeholder-store';
import { createConsentService } from '../src/consent/service';
import type { CrashReporterAdapter } from '../src/crash-reporting/adapter';
import { createCrashReporterService } from '../src/crash-reporting/engine';
import { createPlaceholderCrashReporterAdapter } from '../src/crash-reporting/placeholder-adapter';
import { createLogger, type LogRecord } from '../src/logger/logger';
import { createTelemetryCoordinator } from '../src/telemetry/telemetry-service';

function environment() {
  return createAppEnvironmentService({
    adapter: createPlaceholderAppEnvironmentAdapter({
      os: 'ios',
      osVersion: '17.5.1',
      appVersion: '1.2.3',
      buildNumber: '42',
      buildChannel: 'Preview',
      locale: 'fr-fr',
      environment: 'production',
      deviceId: 'device-secret',
      email: 'person@example.com',
      pushToken: 'push-secret',
    }),
  });
}

function logger(records: LogRecord[]) {
  return createLogger({ level: 'debug', sink: (record) => records.push(record), clock: () => 1 });
}

test('unknown/denied consent blocks analytics without calling the service', async () => {
  const adapter = createPlaceholderAnalyticsAdapter();
  const coordinator = createTelemetryCoordinator({
    consent: createConsentService({ store: createPlaceholderConsentStore({ analytics: 'denied' }) }),
    environment: environment(),
    analytics: createAnalyticsService({ adapter }),
  });

  const result = await coordinator.track({ name: 'screen_view', properties: { section: 'home' } });
  assert.deepEqual(result, {
    operation: 'track',
    category: 'analytics',
    allowed: false,
    emitted: false,
  });
  assert.deepEqual(adapter.getEvents(), []);
});

test('granted analytics consent tracks an event with safe environment context', async () => {
  const adapter = createPlaceholderAnalyticsAdapter();
  const coordinator = createTelemetryCoordinator({
    consent: createConsentService({ store: createPlaceholderConsentStore({ analytics: 'granted' }) }),
    environment: environment(),
    analytics: createAnalyticsService({ adapter }),
  });

  const result = await coordinator.track({
    name: 'button_press',
    properties: {
      component: 'save',
      token: 'secret-token',
      email: 'person@example.com',
      signedUrl: 'https://files.example/x?X-Amz-Signature=secret',
    },
  });

  assert.equal(result.emitted, true);
  const [event] = adapter.getEvents();
  assert.equal(event?.name, 'button_press');
  assert.equal(event?.properties?.component, 'save');
  assert.equal(event?.properties?.os, 'ios');
  assert.equal(event?.properties?.osVersionMajor, 17);
  assert.equal(event?.properties?.buildChannel, 'preview');
  assert.equal(event?.properties?.locale, 'fr-FR');
  const serialised = JSON.stringify(event);
  for (const forbidden of ['secret-token', 'person@example.com', 'X-Amz-Signature', 'device-secret', 'push-secret']) {
    assert.ok(!serialised.includes(forbidden), forbidden);
  }
});

test('unknown/denied consent blocks crash reporting without calling the service', async () => {
  const adapter = createPlaceholderCrashReporterAdapter();
  const coordinator = createTelemetryCoordinator({
    consent: createConsentService({ store: createPlaceholderConsentStore() }),
    environment: environment(),
    crash: createCrashReporterService({ adapter }),
  });

  const result = await coordinator.captureError(new Error('secret token=abc'));
  assert.deepEqual(result, {
    operation: 'captureError',
    category: 'crash',
    allowed: false,
    emitted: false,
  });
  assert.deepEqual(adapter.getErrors(), []);
});

test('granted crash consent captures errors and messages with safe context', async () => {
  const adapter = createPlaceholderCrashReporterAdapter();
  const coordinator = createTelemetryCoordinator({
    consent: createConsentService({ store: createPlaceholderConsentStore({ crash: 'granted' }) }),
    environment: environment(),
    crash: createCrashReporterService({ adapter }),
  });

  const errorResult = await coordinator.captureError(new Error('Bearer abc.def.ghi'), {
    context: { feature: 'profile', email: 'person@example.com' },
  });
  const messageResult = await coordinator.captureMessage('signed https://x.test/a?X-Amz-Signature=secret');

  assert.equal(errorResult.emitted, true);
  assert.equal(messageResult.emitted, true);
  const [error] = adapter.getErrors();
  const [message] = adapter.getMessages();
  assert.equal(error?.context.os, 'ios');
  assert.equal(error?.context.osVersionMajor, 17);
  assert.equal(error?.context.feature, 'profile');
  assert.equal(error?.context.email, '[Redacted]');
  assert.equal(message?.context.buildChannel, 'preview');
  const serialised = JSON.stringify({ error, message });
  for (const forbidden of ['abc.def.ghi', 'person@example.com', 'secret', 'device-secret']) {
    assert.ok(!serialised.includes(forbidden), forbidden);
  }
});

test('analytics/crash adapter failures do not break coordinator flow', async () => {
  const throwingAnalytics: AnalyticsAdapter = {
    track: () => {
      throw new Error('adapter secret');
    },
  };
  const throwingCrash: CrashReporterAdapter = {
    captureError: () => {
      throw new Error('crash secret');
    },
    captureMessage: () => {
      throw new Error('message secret');
    },
  };
  const coordinator = createTelemetryCoordinator({
    consent: createConsentService({
      store: createPlaceholderConsentStore({ analytics: 'granted', crash: 'granted' }),
    }),
    environment: environment(),
    analytics: createAnalyticsService({ adapter: throwingAnalytics }),
    crash: createCrashReporterService({ adapter: throwingCrash }),
  });

  await assert.doesNotReject(coordinator.track({ name: 'x' }));
  await assert.doesNotReject(coordinator.captureError(new Error('boom')));
  await assert.doesNotReject(coordinator.captureMessage('boom'));
});

test('coordinator logs only operation/category/allowed and never payloads', async () => {
  const records: LogRecord[] = [];
  const coordinator = createTelemetryCoordinator({
    consent: createConsentService({
      store: createPlaceholderConsentStore({ analytics: 'granted', crash: 'denied' }),
    }),
    environment: environment(),
    analytics: createAnalyticsService({ adapter: createPlaceholderAnalyticsAdapter() }),
    crash: createCrashReporterService({ adapter: createPlaceholderCrashReporterAdapter() }),
    logger: logger(records),
  });

  await coordinator.track({
    name: 'secret_event_name',
    properties: { token: 'secret-token', body: 'raw-body', url: 'https://x.test?token=abc' },
  });
  await coordinator.captureError(new Error('secret error message token=abc'));

  const allowedKeys = new Set(['operation', 'category', 'allowed']);
  for (const record of records) {
    for (const key of Object.keys(record.fields ?? {})) {
      assert.ok(allowedKeys.has(key), `unexpected log field: ${key}`);
    }
  }
  const serialised = JSON.stringify(records);
  for (const forbidden of ['secret_event_name', 'secret-token', 'raw-body', 'secret error message', 'token=abc']) {
    assert.ok(!serialised.includes(forbidden), forbidden);
  }
});
