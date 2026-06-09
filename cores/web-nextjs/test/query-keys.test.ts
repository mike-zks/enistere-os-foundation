import assert from "node:assert/strict";
import { test } from "node:test";

import { healthKeys } from "../src/core/query/keys/health-keys.js";

test("clés stables et explicites", () => {
  assert.deepEqual(healthKeys.all, ["health"]);
  assert.deepEqual(healthKeys.status(), ["health", "status"]);
  assert.deepEqual(healthKeys.live(), ["health", "live"]);
  assert.deepEqual(healthKeys.ready(), ["health", "ready"]);
});

test("unicité entre sondes", () => {
  const serialized = [healthKeys.status(), healthKeys.live(), healthKeys.ready()].map((k) =>
    JSON.stringify(k),
  );
  assert.equal(new Set(serialized).size, 3);
});

test("sérialisables et sans donnée sensible (ni URL, ni objet, ni secret)", () => {
  const s = JSON.stringify(healthKeys.status());
  assert.equal(s, '["health","status"]');
  assert.ok(!s.includes("://"), "aucune URL dans la clé");
  assert.ok(!/token|secret|authorization/i.test(s));
});
