import assert from 'node:assert/strict';
import { test } from 'node:test';

const baseUrl = process.env.E2E_WEB_URL;

test('Angular generated baseline boots and publishes governed security headers', async () => {
  assert.ok(baseUrl, 'E2E_WEB_URL is required');
  const page = await fetch(baseUrl);
  assert.equal(page.status, 200);
  assert.match(await page.text(), /<app-root/);

  const policy = await fetch(new URL('/_headers', baseUrl));
  assert.equal(policy.status, 200);
  const body = await policy.text();
  assert.match(body, /X-Content-Type-Options: nosniff/);
  assert.match(body, /Content-Security-Policy:/);
});
