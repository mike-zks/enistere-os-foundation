import assert from "node:assert/strict";
import { test } from "node:test";

import { authKeys } from "../src/core/query/keys/auth-keys.js";
import { healthKeys } from "../src/core/query/keys/health-keys.js";

test("clés Auth stables", () => {
  assert.deepEqual(authKeys.all, ["auth"]);
  assert.deepEqual(authKeys.session(), ["auth", "session"]);
  assert.deepEqual(authKeys.authorization(), ["auth", "authorization"]);
});

test("séparation Health / Auth (aucun chevauchement)", () => {
  assert.notDeepEqual(authKeys.all, healthKeys.all);
  assert.notEqual(JSON.stringify(authKeys.session()), JSON.stringify(healthKeys.status()));
});

test("sérialisables, sans donnée sensible (ni URL, ni token, ni userId)", () => {
  for (const key of [authKeys.all, authKeys.session(), authKeys.authorization()]) {
    const s = JSON.stringify(key);
    assert.ok(!s.includes("://"));
    // « authorization » est un nom de domaine de clé légitime, pas un secret.
    assert.ok(!/token|cookie|bearer|secret|password/i.test(s));
  }
});
