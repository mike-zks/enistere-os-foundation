import assert from "node:assert/strict";
import { test } from "node:test";

import { cookieName } from "../src/core/auth/cookie-config.js";
import { handleRefresh } from "../src/core/auth/handlers/refresh-handler.js";
import { InMemoryCookieStore } from "../src/core/auth/server-cookie-store.js";
import { createMockFetch, type MockResponseSpec } from "./helpers/api-test-kit.js";
import {
  apiEnvelope,
  makeDeps,
  makeRequest,
  refreshPayload,
  seedAuth,
  seedCsrf,
  TEST_ENV,
} from "./helpers/auth-test-kit.js";

const ERR = (status: number): MockResponseSpec => ({
  status,
  body: { success: false, statusCode: status, message: "x", errorCode: "E", path: "/auth/refresh", timestamp: "t" },
});

function refreshRequest(csrf: string): Request {
  return makeRequest("/api/auth/refresh", { csrf });
}

test("succès : rotation des deux cookies, aucun token dans le corps, un seul appel", async () => {
  const store = new InMemoryCookieStore();
  seedAuth(store, "OLD-A", "OLD-R");
  const csrf = seedCsrf(store);
  const mock = createMockFetch({ body: apiEnvelope(refreshPayload("AT2", "RT2")) });
  const res = await handleRefresh(refreshRequest(csrf), makeDeps(store, mock));

  assert.equal(res.status, 200);
  const body = (await res.json()) as { data: { refreshed: boolean } };
  assert.deepEqual(body.data, { refreshed: true });
  assert.ok(!JSON.stringify(body).includes("AT2") && !JSON.stringify(body).includes("RT2"));
  assert.equal(store.get(cookieName("access", TEST_ENV)), "AT2");
  assert.equal(store.get(cookieName("refresh", TEST_ENV)), "RT2");
  assert.equal(mock.calls.filter((c) => c.url.includes("/auth/refresh")).length, 1, "un seul refresh (aucune boucle)");
});

test("session absente → 401 sans appel API", async () => {
  const store = new InMemoryCookieStore();
  const csrf = seedCsrf(store);
  const mock = createMockFetch({ body: apiEnvelope(refreshPayload()) });
  const res = await handleRefresh(refreshRequest(csrf), makeDeps(store, mock));
  assert.equal(res.status, 401);
  assert.equal(mock.calls.length, 0);
});

test("refresh invalide (API 401) → cookies supprimés + 401, aucune boucle", async () => {
  const store = new InMemoryCookieStore();
  seedAuth(store, "OLD-A", "OLD-R");
  const csrf = seedCsrf(store);
  const mock = createMockFetch(ERR(401));
  const res = await handleRefresh(refreshRequest(csrf), makeDeps(store, mock));
  assert.equal(res.status, 401);
  assert.equal(store.get(cookieName("access", TEST_ENV)), undefined);
  assert.equal(store.get(cookieName("refresh", TEST_ENV)), undefined);
  assert.equal(mock.calls.filter((c) => c.url.includes("/auth/refresh")).length, 1);
});

test("CSRF invalide → 403 sans appel API", async () => {
  const store = new InMemoryCookieStore();
  seedAuth(store, "OLD-A", "OLD-R");
  seedCsrf(store);
  const mock = createMockFetch({ body: apiEnvelope(refreshPayload()) });
  const res = await handleRefresh(refreshRequest("mismatch-token-aaaaaaaaaaaaaaaaaaaaaaaaaaa"), makeDeps(store, mock));
  assert.equal(res.status, 403);
  assert.equal(mock.calls.length, 0);
});

test("Origin invalide → 403 sans appel API", async () => {
  const store = new InMemoryCookieStore();
  seedAuth(store, "OLD-A", "OLD-R");
  const csrf = seedCsrf(store);
  const mock = createMockFetch({ body: apiEnvelope(refreshPayload()) });
  const res = await handleRefresh(makeRequest("/api/auth/refresh", { origin: "https://evil.test", csrf }), makeDeps(store, mock));
  assert.equal(res.status, 403);
  assert.equal(mock.calls.length, 0);
});
