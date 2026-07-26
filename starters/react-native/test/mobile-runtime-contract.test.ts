import assert from 'node:assert/strict';
import { test } from 'node:test';

import { TypedMobileApiClient, MobileApiError } from '../src/api/typed-api-client';
import {
  MOBILE_EXTENSION_CONTRACT_VERSION,
  MobileRuntimeExtensionRegistry,
  RuntimeDiagnostics,
  RuntimeLifecycle,
  RuntimeTelemetry,
  TELEMETRY_EXPORTER_CONTRACT_VERSION,
  TechnicalAudit,
  createMobileRequestContext,
  createRuntimeLogger,
  validateRuntimeConfiguration,
  type LogRecord,
} from '../src/platform/runtime-contract';
import { createDisabledOfflineHook } from '../src/offline/offline-hook';
import { createDisabledPushHook } from '../src/push/push-hook';
import { createAnonymousSessionHook } from '../src/session/session-hook';
import {
  SECURE_STORAGE_CONTRACT_VERSION,
  SecureStorage,
} from '../src/platform/secure-storage-port';

const context = createMobileRequestContext({
  incomingTraceparent: `00-${'a'.repeat(32)}-${'b'.repeat(16)}-01`,
  requestId: 'request-1',
  nextTraceId: () => 'c'.repeat(32),
  nextSpanId: () => 'd'.repeat(16),
});

test('validates typed public configuration and production transport', () => {
  assert.deepEqual(validateRuntimeConfiguration({
    EXPO_PUBLIC_APP_ENV: 'production',
    EXPO_PUBLIC_API_BASE_URL: 'https://api.example.test/',
    EXPO_PUBLIC_API_TIMEOUT_MS: '1200',
  }), {
    environment: 'production',
    apiBaseUrl: 'https://api.example.test',
    requestTimeoutMs: 1200,
  });
  assert.throws(() => validateRuntimeConfiguration({
    EXPO_PUBLIC_APP_ENV: 'production',
    EXPO_PUBLIC_API_BASE_URL: 'http://api.example.test',
  }), /HTTPS/);
});

test('continues valid W3C context with a new span', () => {
  assert.equal(context.traceparent, `00-${'a'.repeat(32)}-${'d'.repeat(16)}-01`);
  assert.equal(context.requestId, 'request-1');
});

test('structured logging and technical audit redact sensitive fields', () => {
  const logs: LogRecord[] = [];
  createRuntimeLogger((record) => logs.push(record)).info('request complete', {
    token: 'secret',
    route: '/health',
  });
  const audits: Readonly<Record<string, unknown>>[] = [];
  new TechnicalAudit((event) => audits.push(event), () => '2026-01-01T00:00:00.000Z')
    .record('runtime.start', 'success', context, { authorization: 'Bearer secret' });
  assert.equal(logs[0]?.fields?.token, '[Redacted]');
  assert.equal((audits[0]?.fields as Record<string, unknown>).authorization, '[Redacted]');
});

test('versioned telemetry records metrics and propagates correlation', () => {
  const exported: Readonly<Record<string, unknown>>[] = [];
  const telemetry = new RuntimeTelemetry({
    contractVersion: TELEMETRY_EXPORTER_CONTRACT_VERSION,
    export: (record) => exported.push(record),
  }, () => '2026-01-01T00:00:00.000Z');
  telemetry.record('mobile.request', context);
  assert.equal(telemetry.count('mobile.request'), 1);
  assert.equal(exported[0]?.traceparent, context.traceparent);
});

test('diagnostics are sorted and lifecycle stops once in reverse order', async () => {
  const diagnostics = new RuntimeDiagnostics();
  diagnostics.register({ id: 'network', run: () => 'ready' });
  diagnostics.register({ id: 'api', run: () => 'degraded' });
  assert.deepEqual(diagnostics.snapshot().map((item) => item.id), ['api', 'network']);

  const calls: string[] = [];
  const lifecycle = new RuntimeLifecycle(['one', 'two'].map((id) => ({
    id,
    start: () => { calls.push(`start:${id}`); },
    stop: () => { calls.push(`stop:${id}`); },
  })));
  await lifecycle.start();
  await lifecycle.stop();
  await lifecycle.stop();
  assert.deepEqual(calls, ['start:one', 'start:two', 'stop:two', 'stop:one']);
});

test('mobile extension points are versioned and exclusive', () => {
  const registry = new MobileRuntimeExtensionRegistry();
  registry.register({
    kind: 'session',
    contractVersion: MOBILE_EXTENSION_CONTRACT_VERSION,
    id: 'anonymous-session',
  });
  assert.equal(registry.get('session')?.id, 'anonymous-session');
  assert.throws(() => registry.register({
    kind: 'session',
    contractVersion: MOBILE_EXTENSION_CONTRACT_VERSION,
    id: 'duplicate',
  }), /already registered/);
});

test('typed API client propagates request context and maps canonical errors', async () => {
  let headers: Readonly<Record<string, string>> = {};
  const client = new TypedMobileApiClient(async (_path, init) => {
    headers = init.headers;
    return {
      ok: false,
      status: 503,
      json: async () => ({
        statusCode: 503,
        errorCode: 'SERVICE_UNAVAILABLE',
        message: 'Unavailable',
        details: null,
        path: '/v1/items',
        timestamp: '2026-01-01T00:00:00.000Z',
        requestId: 'request-1',
      }),
    };
  }, () => context);
  await assert.rejects(() => client.request('/v1/items'), (error: unknown) => {
    assert.ok(error instanceof MobileApiError);
    assert.equal(error.response.errorCode, 'SERVICE_UNAVAILABLE');
    return true;
  });
  assert.equal(headers.traceparent, context.traceparent);
  assert.equal(headers['X-Request-Id'], context.requestId);
});

test('secure storage and neutral session/offline/push hooks expose no capability behavior', async () => {
  const values = new Map<string, string>();
  const storage = new SecureStorage({
    contractVersion: SECURE_STORAGE_CONTRACT_VERSION,
    get: async (key) => values.get(key) ?? null,
    set: async (key, value) => { values.set(key, value); },
    remove: async (key) => { values.delete(key); },
  });
  await storage.set('runtime.device-key', 'ciphertext');
  assert.equal(await storage.get('runtime.device-key'), 'ciphertext');
  assert.equal(createAnonymousSessionHook().current(), 'anonymous');
  assert.equal(await createDisabledOfflineHook().enqueue({ id: '1', kind: 'write' }), 'disabled');
  assert.equal(await createDisabledPushHook().register(), 'disabled');
});
