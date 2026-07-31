/**
 * API token → AuthSessionData mapping (RN 4) — `node --test`.
 *
 * Validates the pure mapping used by the real `EnistereAuthApi` (over the
 * official `@enistere/api-client-fetch` client) without importing the ESM
 * package: the mapping is framework-agnostic.
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { toAuthSessionData } from '../src/features/auth/token-mapping';

test('maps tokens and converts expiresIn (seconds) to an absolute ms expiry', () => {
  const now = 1_000_000;
  const result = toAuthSessionData(
    { accessToken: 'a.jwt', refreshToken: 'r.token', accessTokenExpiresIn: 900 },
    now,
  );
  assert.equal(result.accessToken, 'a.jwt');
  assert.equal(result.refreshToken, 'r.token');
  assert.equal(result.expiresAt, now + 900 * 1000);
  assert.equal(result.user, null);
});

test('a non-positive or non-finite TTL yields a null expiry (no false expiry)', () => {
  assert.equal(
    toAuthSessionData({ accessToken: 'a', refreshToken: 'r', accessTokenExpiresIn: 0 }, 5).expiresAt,
    null,
  );
  assert.equal(
    toAuthSessionData({ accessToken: 'a', refreshToken: 'r', accessTokenExpiresIn: -10 }, 5).expiresAt,
    null,
  );
  assert.equal(
    toAuthSessionData(
      { accessToken: 'a', refreshToken: 'r', accessTokenExpiresIn: Number.NaN },
      5,
    ).expiresAt,
    null,
  );
});

test('the mapping never exposes a user identity (kept generic, profile is separate)', () => {
  const result = toAuthSessionData(
    { accessToken: 'a', refreshToken: 'r', accessTokenExpiresIn: 60 },
    0,
  );
  assert.equal(result.user, null);
});
