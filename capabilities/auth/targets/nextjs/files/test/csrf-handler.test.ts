import assert from "node:assert/strict";
import { test } from "node:test";

import { csrfCookieName } from "../src/features/auth/csrf/csrf-cookie.js";
import { handleCsrf } from "../src/features/auth/handlers/csrf-handler.js";
import { InMemoryCookieStore } from "../src/features/auth/server-cookie-store.js";
import { createMockFetch } from "./helpers/api-test-kit.js";
import { makeDeps, makeRequest, RecordingCookieStore, TEST_ENV } from "./helpers/auth-test-kit.js";

test("GET /csrf : 200 + token + cookie posé + no-store + no-referrer", async () => {
  const store = new InMemoryCookieStore();
  const res = await handleCsrf(makeRequest("/api/auth/csrf", { method: "GET" }), makeDeps(store, createMockFetch({})));
  assert.equal(res.status, 200);
  const body = (await res.json()) as { success: boolean; data: { csrfToken: string } };
  assert.equal(body.success, true);
  assert.ok(body.data.csrfToken.length >= 32);
  assert.equal(store.get(csrfCookieName(TEST_ENV)), body.data.csrfToken);
  assert.equal(res.headers.get("cache-control"), "no-store");
  assert.equal(res.headers.get("referrer-policy"), "no-referrer");
});

test("cookie CSRF non HttpOnly", async () => {
  const store = new RecordingCookieStore();
  await handleCsrf(makeRequest("/api/auth/csrf", { method: "GET" }), makeDeps(store, createMockFetch({})));
  assert.equal(store.setOptions.get(csrfCookieName(TEST_ENV))?.httpOnly, false);
});

test("rotation : deux appels → jetons différents", async () => {
  const store = new InMemoryCookieStore();
  const deps = makeDeps(store, createMockFetch({}));
  const a = (await (await handleCsrf(makeRequest("/api/auth/csrf", { method: "GET" }), deps)).json()) as { data: { csrfToken: string } };
  const b = (await (await handleCsrf(makeRequest("/api/auth/csrf", { method: "GET" }), deps)).json()) as { data: { csrfToken: string } };
  assert.notEqual(a.data.csrfToken, b.data.csrfToken);
  assert.equal(store.get(csrfCookieName(TEST_ENV)), b.data.csrfToken);
});

test("aucune donnée Auth dans la réponse", async () => {
  const store = new InMemoryCookieStore();
  const res = await handleCsrf(makeRequest("/api/auth/csrf", { method: "GET" }), makeDeps(store, createMockFetch({})));
  const body = (await res.json()) as { data: Record<string, unknown> };
  assert.deepEqual(Object.keys(body.data), ["csrfToken"]);
});

test("méthode non-GET → 405", async () => {
  const store = new InMemoryCookieStore();
  const res = await handleCsrf(makeRequest("/api/auth/csrf", { method: "POST" }), makeDeps(store, createMockFetch({})));
  assert.equal(res.status, 405);
});
