import assert from "node:assert/strict";
import { test } from "node:test";

import { buildAuthCookieOptions } from "../src/features/auth/cookie-config.js";
import {
  ReadOnlyCookieViolationError,
  guardReadOnly,
  inMemoryReadOnlyCookieStore,
} from "../src/features/auth/read-only-cookie-store.js";

test("vue lecture seule : get renvoie la valeur, aucune méthode d'écriture exposée", () => {
  const store = inMemoryReadOnlyCookieStore({ a: "1" });
  assert.equal(store.get("a"), "1");
  assert.equal(store.get("absent"), undefined);
  // Défense par le type : `set`/`delete` n'existent pas sur la vue lecture seule.
  assert.equal((store as unknown as Record<string, unknown>).set, undefined);
  assert.equal((store as unknown as Record<string, unknown>).delete, undefined);
});

test("guardReadOnly : get délégué, set/delete LÈVENT (défense en profondeur)", () => {
  const guarded = guardReadOnly(inMemoryReadOnlyCookieStore({ a: "1" }));
  assert.equal(guarded.get("a"), "1");
  assert.throws(() => guarded.set("a", "2", buildAuthCookieOptions("development", 900)), ReadOnlyCookieViolationError);
  assert.throws(() => guarded.delete("a"), ReadOnlyCookieViolationError);
});
