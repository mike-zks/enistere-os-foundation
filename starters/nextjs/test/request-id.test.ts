import assert from "node:assert/strict";
import { test } from "node:test";

import { isValidRequestId, resolveRequestId } from "../src/core/auth/request-id.js";

test("request id entrant valide réutilisé", () => {
  assert.equal(resolveRequestId("abc-123_DEF.456"), "abc-123_DEF.456");
  assert.ok(isValidRequestId("abc-123"));
});

test("request id absent/invalide → UUID généré", () => {
  for (const bad of [null, undefined, "", "a b", "a\nb", "x".repeat(201), "💥"]) {
    const out = resolveRequestId(bad as string | null | undefined);
    assert.ok(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(out), `généré pour ${String(bad)}`);
    assert.equal(isValidRequestId(bad as string | null | undefined), false);
  }
});
