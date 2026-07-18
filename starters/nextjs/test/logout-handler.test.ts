import assert from "node:assert/strict";
import { test } from "node:test";

import { cookieName } from "../src/core/auth/cookie-config.js";
import { csrfCookieName } from "../src/core/auth/csrf/csrf-cookie.js";
import { handleLogout } from "../src/core/auth/handlers/logout-handler.js";
import { InMemoryCookieStore } from "../src/core/auth/server-cookie-store.js";
import { createMockFetch } from "./helpers/api-test-kit.js";
import { apiEnvelope, makeDeps, makeRequest, seedAuth, seedCsrf, TEST_ENV } from "./helpers/auth-test-kit.js";

function logoutRequest(csrf: string): Request {
  return makeRequest("/api/auth/logout", { csrf });
}

test("succès : appel API + suppression des cookies Auth + CSRF", async () => {
  const store = new InMemoryCookieStore();
  seedAuth(store, "A", "R");
  const csrf = seedCsrf(store);
  const mock = createMockFetch({ body: apiEnvelope({ status: "logged_out" }) });
  const res = await handleLogout(logoutRequest(csrf), makeDeps(store, mock));

  assert.equal(res.status, 200);
  assert.deepEqual((await res.json()).data, { loggedOut: true });
  assert.equal(store.get(cookieName("access", TEST_ENV)), undefined);
  assert.equal(store.get(cookieName("refresh", TEST_ENV)), undefined);
  assert.equal(store.get(csrfCookieName(TEST_ENV)), undefined);
  assert.ok(mock.calls.some((c) => c.url.includes("/auth/logout")));
});

test("idempotent : aucun cookie de session → 200, aucun appel API", async () => {
  const store = new InMemoryCookieStore();
  const csrf = seedCsrf(store);
  const mock = createMockFetch({ body: apiEnvelope({ status: "logged_out" }) });
  const res = await handleLogout(logoutRequest(csrf), makeDeps(store, mock));
  assert.equal(res.status, 200);
  assert.equal(mock.calls.length, 0);
});

test("API indisponible : cookies locaux supprimés malgré tout", async () => {
  const store = new InMemoryCookieStore();
  seedAuth(store, "A", "R");
  const csrf = seedCsrf(store);
  const mock = createMockFetch({ throwError: new TypeError("fetch failed") });
  const res = await handleLogout(logoutRequest(csrf), makeDeps(store, mock));
  assert.equal(res.status, 200);
  assert.deepEqual((await res.json()).data, { loggedOut: true });
  assert.equal(store.get(cookieName("access", TEST_ENV)), undefined);
  assert.equal(store.get(cookieName("refresh", TEST_ENV)), undefined);
});

test("CSRF/Origin obligatoires", async () => {
  const store = new InMemoryCookieStore();
  seedAuth(store, "A", "R");
  seedCsrf(store);
  const mock = createMockFetch({ body: apiEnvelope({ status: "logged_out" }) });
  const badCsrf = await handleLogout(logoutRequest("mismatch-token-bbbbbbbbbbbbbbbbbbbbbbbbbbb"), makeDeps(store, mock));
  assert.equal(badCsrf.status, 403);
  const csrf = seedCsrf(store);
  const badOrigin = await handleLogout(makeRequest("/api/auth/logout", { origin: "https://evil.test", csrf }), makeDeps(store, mock));
  assert.equal(badOrigin.status, 403);
  assert.equal(mock.calls.length, 0);
});
