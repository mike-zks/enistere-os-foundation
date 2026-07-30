import assert from "node:assert/strict";
import { test } from "node:test";

import type { CookieAttributes } from "../src/features/auth/cookie-config.js";
import { InMemoryCookieStore } from "../src/features/auth/server-cookie-store.js";

const OPTS: CookieAttributes = { httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 900 };

test("get/set/delete", () => {
  const store = new InMemoryCookieStore();
  assert.equal(store.get("k"), undefined);
  store.set("k", "v", OPTS);
  assert.equal(store.get("k"), "v");
  store.delete("k");
  assert.equal(store.get("k"), undefined);
});

test("delete idempotent", () => {
  const store = new InMemoryCookieStore();
  assert.doesNotThrow(() => store.delete("absent"));
  store.set("k", "v", OPTS);
  store.delete("k");
  assert.doesNotThrow(() => store.delete("k"));
});

test("isolation entre instances", () => {
  const a = new InMemoryCookieStore();
  const b = new InMemoryCookieStore();
  a.set("k", "A", OPTS);
  assert.equal(a.get("k"), "A");
  assert.equal(b.get("k"), undefined);
});
