/**
 * URL / deep-link parser (RN 12 — deep-linking) — `node --test`.
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { decodeSafe, normalizeUrl, parseDeepLink } from '../src/linking/url';

test('decodeSafe decodes but never throws on malformed escapes', () => {
  assert.equal(decodeSafe('a%20b'), 'a b');
  assert.equal(decodeSafe('%E0%A4%A'), '%E0%A4%A'); // malformed -> unchanged
  assert.equal(decodeSafe('plain'), 'plain');
});

test('parseDeepLink parses a custom-scheme deep link', () => {
  const parsed = parseDeepLink('MyApp://Home/details?id=42&q=a%20b#frag');
  assert.deepEqual(parsed, {
    scheme: 'myapp',
    host: 'home',
    path: '/details',
    query: { id: '42', q: 'a b' },
    fragment: 'frag',
  });
});

test('parseDeepLink parses an https universal link', () => {
  const parsed = parseDeepLink('https://App.Example.com/p/1?x=1');
  assert.equal(parsed?.scheme, 'https');
  assert.equal(parsed?.host, 'app.example.com');
  assert.equal(parsed?.path, '/p/1');
  assert.deepEqual(parsed?.query, { x: '1' });
});

test('parseDeepLink treats a relative path as scheme-less', () => {
  const parsed = parseDeepLink('/details/1?x=2');
  assert.equal(parsed?.scheme, null);
  assert.equal(parsed?.host, null);
  assert.equal(parsed?.path, '/details/1');
  assert.deepEqual(parsed?.query, { x: '2' });
});

test('parseDeepLink returns null for non-string / empty input', () => {
  assert.equal(parseDeepLink(null), null);
  assert.equal(parseDeepLink(42), null);
  assert.equal(parseDeepLink('   '), null);
});

test('normalizeUrl lowercases scheme + authority only, trims', () => {
  assert.equal(normalizeUrl('  HTTPS://Host.COM/Path?A=B  '), 'https://host.com/Path?A=B');
  assert.equal(normalizeUrl('MyApp://Home/X'), 'myapp://home/X');
  assert.equal(normalizeUrl(123), '');
});
