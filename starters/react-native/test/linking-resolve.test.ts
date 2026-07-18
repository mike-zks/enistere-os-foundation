/**
 * Link resolution (RN 12 — deep-linking / routing) — `node --test`.
 *
 * The security core: validates internal routing, allowlists, open-redirect
 * defence, sensitive-param dropping and bounds.
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  isInternalRoute,
  resolveLink,
  resolveNotificationLink,
  type LinkingConfig,
} from '../src/linking/resolve';

const config: LinkingConfig = {
  schemes: ['myapp', 'https'],
  hosts: ['app.example.com'],
};

test('custom-scheme link resolves to an internal route', () => {
  const result = resolveLink('myapp://home/details?id=42', config);
  assert.equal(result.kind, 'internal');
  if (result.kind === 'internal') {
    assert.equal(result.route.path, '/home/details');
    assert.deepEqual(result.route.params, { id: '42' });
  }
});

test('valid https universal link (allowed host) resolves internal', () => {
  const result = resolveLink('https://app.example.com/p/1?x=1', config);
  assert.equal(result.kind, 'internal');
  if (result.kind === 'internal') {
    assert.equal(result.route.path, '/p/1');
  }
  assert.equal(isInternalRoute('https://app.example.com/p/1', config), true);
});

test('https with a non-allowlisted host is externalBlocked', () => {
  const result = resolveLink('https://evil.com/p/1', config);
  assert.equal(result.kind, 'externalBlocked');
  assert.equal(result.kind === 'externalBlocked' && result.reason, 'external_host');
});

test('unknown scheme and http are blocked', () => {
  assert.deepEqual(resolveLink('tel:+123', config), { kind: 'externalBlocked', reason: 'external_scheme' });
  assert.deepEqual(resolveLink('http://app.example.com/x', config), {
    kind: 'externalBlocked',
    reason: 'insecure_scheme',
  });
});

test('open-redirect attempts are blocked or rejected', () => {
  // protocol-relative authority injected into the path
  assert.equal(resolveLink('myapp:////evil.com/x', config).kind, 'externalBlocked');
  assert.equal(resolveLink('https://app.example.com//evil.com', config).kind, 'externalBlocked');
  // path traversal
  assert.deepEqual(resolveLink('myapp://home/../admin', config), { kind: 'invalid', reason: 'unsafe_path' });
  // embedded absolute URL in the path
  assert.equal(resolveLink('/redirect/https://evil.com', config).kind, 'externalBlocked');
});

test('sensitive query params are dropped from the route', () => {
  const result = resolveLink(
    'myapp://home?id=1&token=secret-xyz&access_token=abc&Signature=zzz&safe=ok',
    config,
  );
  assert.equal(result.kind, 'internal');
  if (result.kind === 'internal') {
    assert.deepEqual(result.route.params, { id: '1', safe: 'ok' }); // token/access_token/Signature gone
    assert.ok(!JSON.stringify(result.route.params).includes('secret-xyz'));
  }
});

test('sensitive query params are dropped across common naming variants', () => {
  const result = resolveLink(
    'myapp://home?access-token=a&X-Amz-Signature=b&X-Amz-Credential=c&api-key=d&safe=ok',
    config,
  );
  assert.equal(result.kind, 'internal');
  if (result.kind === 'internal') {
    assert.deepEqual(result.route.params, { safe: 'ok' });
  }
});

test('params are bounded (count + value length)', () => {
  const bounded: LinkingConfig = { ...config, maxParams: 2, maxParamValueLength: 3 };
  const result = resolveLink('myapp://home?a=11111&b=2&c=3&d=4', bounded);
  assert.equal(result.kind, 'internal');
  if (result.kind === 'internal') {
    assert.equal(Object.keys(result.route.params).length, 2); // capped count
    assert.equal(result.route.params.a, '111'); // capped value length
  }
});

test('invalid / empty input never throws', () => {
  assert.deepEqual(resolveLink('', config), { kind: 'invalid', reason: 'empty' });
  assert.deepEqual(resolveLink(null, config), { kind: 'invalid', reason: 'empty' });
  assert.deepEqual(resolveLink(42, config), { kind: 'invalid', reason: 'empty' });
  assert.deepEqual(resolveLink('relative/no/slash', config), { kind: 'invalid', reason: 'unparseable' });
});

test('resolveNotificationLink reads a configurable data key', () => {
  const data = { link: 'myapp://home', other: 'ignored' };
  assert.equal(resolveNotificationLink(data, config).kind, 'internal');
  // custom key
  assert.equal(
    resolveNotificationLink({ deeplink: 'myapp://home' }, config, { key: 'deeplink' }).kind,
    'internal',
  );
  // missing / wrong type -> invalid, no throw
  assert.deepEqual(resolveNotificationLink({}, config), { kind: 'invalid', reason: 'empty' });
  assert.deepEqual(resolveNotificationLink({ link: 99 }, config), { kind: 'invalid', reason: 'empty' });
  assert.deepEqual(resolveNotificationLink(null, config), { kind: 'invalid', reason: 'empty' });
});
