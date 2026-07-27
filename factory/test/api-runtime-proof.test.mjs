import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  runtimeEnvironmentFor,
  startupProbeFor,
  verifyHttpContract,
} from '../quality/scripts/golden-runtime.mjs';

describe('API runtime boot/HTTP proof', () => {
  it('targets the canonical health endpoint for all three API runtimes', () => {
    assert.equal(startupProbeFor('nestjs').url, 'http://127.0.0.1:3000/health');
    assert.equal(startupProbeFor('spring').url, 'http://127.0.0.1:8080/health');
    assert.equal(startupProbeFor('fastapi').url, 'http://127.0.0.1:8000/health');
  });

  it('binds both Web runtime probes to their explicit loopback ports', () => {
    const next = startupProbeFor('nextjs');
    const angular = startupProbeFor('angular');
    assert.equal(next.url, 'http://127.0.0.1:3100/');
    assert.equal(angular.url, 'http://127.0.0.1:4200/');
    assert.deepEqual(angular.args, ['start', '--', '--host', '127.0.0.1', '--port', '4200']);
  });

  it('isolates distributed authority migration histories in distinct data namespaces', () => {
    const baseEnvironment = {
      DATABASE_URL: 'postgresql://user:secret@localhost:5432/enistere?schema=public',
      SPRING_DATASOURCE_URL: 'jdbc:postgresql://localhost:5432/enistere',
    };
    const spring = runtimeEnvironmentFor({
      id: 'core-api',
      runtime: 'spring',
      ownership: { team: 'core-team', domains: ['core'] },
    }, 'distributed-platform', baseEnvironment);
    const nestjs = runtimeEnvironmentFor({
      id: 'engagement-api',
      runtime: 'nestjs',
      ownership: { team: 'engagement-team', domains: ['engagement'] },
    }, 'distributed-platform', baseEnvironment);

    assert.equal(spring.ENISTERE_DATA_NAMESPACE, 'authority_core_api');
    assert.equal(
      spring.SPRING_DATASOURCE_URL,
      'jdbc:postgresql://localhost:5432/enistere?currentSchema=authority_core_api',
    );
    assert.equal(nestjs.ENISTERE_DATA_NAMESPACE, 'authority_engagement_api');
    assert.equal(
      new URL(nestjs.DATABASE_URL).searchParams.get('schema'),
      'authority_engagement_api',
    );
    assert.equal(baseEnvironment.DATABASE_URL.endsWith('schema=public'), true);
  });

  it('proves health semantics, correlation, W3C tracing and security headers', async () => {
    const calls = [];
    const fakeFetch = async (url, options) => {
      calls.push({ url, options });
      const state = url.endsWith('/live') ? 'live' : url.endsWith('/ready') ? 'ready' : 'ok';
      return new Response(JSON.stringify({ status: state }), {
        status: 200,
        headers: {
          'content-type': 'application/json',
          'x-request-id': 'runtime-proof-1234',
          'traceparent': '00-4bf92f3577b34da6a3ce929d0e0e4736-0123456789abcdef-01',
          'x-content-type-options': 'nosniff',
        },
      });
    };

    const evidence = await verifyHttpContract(startupProbeFor('fastapi'), fakeFetch);

    assert.deepEqual(evidence, [
      { path: '/health', status: 200, state: 'ok' },
      { path: '/health/live', status: 200, state: 'live' },
      { path: '/health/ready', status: 200, state: 'ready' },
    ]);
    assert.equal(calls.length, 3);
    assert.equal(calls[0].options.headers['X-Request-Id'], 'runtime-proof-1234');
  });

  it('fails closed on a contract mismatch', async () => {
    const fakeFetch = async () => new Response(JSON.stringify({ status: 'unknown' }), {
      status: 200,
      headers: {
        'x-request-id': 'runtime-proof-1234',
        'traceparent': '00-4bf92f3577b34da6a3ce929d0e0e4736-0123456789abcdef-01',
        'x-content-type-options': 'nosniff',
      },
    });
    await assert.rejects(
      verifyHttpContract(startupProbeFor('nestjs'), fakeFetch),
      /returned status 'unknown'/,
    );
  });

  it('rejects a response that reuses the incoming parent span', async () => {
    const fakeFetch = async () => new Response(JSON.stringify({ status: 'ok' }), {
      status: 200,
      headers: {
        'x-request-id': 'runtime-proof-1234',
        'traceparent': '00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01',
        'x-content-type-options': 'nosniff',
      },
    });
    await assert.rejects(
      verifyHttpContract(startupProbeFor('spring'), fakeFetch),
      /did not continue the W3C trace/,
    );
  });
});
