import { cookieName } from "../src/features/auth/cookie-config.js";
import { handleGetProfile } from "../src/features/auth/handlers/get-profile-handler.js";
import { InMemoryCookieStore } from "../src/features/auth/server-cookie-store.js";
import assert from "node:assert/strict";
import { test } from "node:test";

import { createMockFetch, type MockResponseSpec } from "./helpers/api-test-kit.js";
import { apiEnvelope, makeDeps, makeRequest, seedAuth, TEST_ENV } from "./helpers/auth-test-kit.js";

const PROFILE = {
  id: "b3f1c2d4-5e6f-4a8b-9c0d-1e2f3a4b5c6d",
  email: "user@example.test",
  status: "ACTIVE",
  createdAt: "2026-06-09T12:00:00.000Z",
  updatedAt: "2026-06-09T12:00:00.000Z",
};
const ERR = (status: number): MockResponseSpec => ({
  status,
  body: { success: false, statusCode: status, message: "x", errorCode: "E", path: "/auth/me", timestamp: "t" },
});
const meRequest = () => makeRequest("/api/auth/me", { method: "GET" });

test("cookie d'access valide → 200 profil public + Bearer issu du cookie + no-store", async () => {
  const store = new InMemoryCookieStore();
  seedAuth(store, "ACCESS-1", "REFRESH-1");
  const mock = createMockFetch({ body: apiEnvelope(PROFILE) });
  const res = await handleGetProfile(meRequest(), makeDeps(store, mock));

  assert.equal(res.status, 200);
  const body = (await res.json()) as { data: typeof PROFILE };
  assert.deepEqual(body.data, PROFILE);
  assert.equal(res.headers.get("cache-control"), "no-store");
  assert.equal(mock.calls[0]?.headers["authorization"], "Bearer ACCESS-1");
  assert.ok(mock.calls.some((c) => c.url.includes("/auth/me")));
});

test("aucune donnée sensible dans la réponse", async () => {
  const store = new InMemoryCookieStore();
  seedAuth(store, "ACCESS-SECRET", "REFRESH-SECRET");
  const res = await handleGetProfile(meRequest(), makeDeps(store, createMockFetch({ body: apiEnvelope(PROFILE) })));
  const text = await res.text();
  assert.ok(!text.includes("ACCESS-SECRET") && !text.includes("REFRESH-SECRET"));
});

test("session absente → 401, aucun appel /auth/refresh (pas de refresh auto)", async () => {
  const store = new InMemoryCookieStore();
  const mock = createMockFetch(ERR(401));
  const res = await handleGetProfile(meRequest(), makeDeps(store, mock));
  assert.equal(res.status, 401);
  assert.ok(mock.calls.every((c) => !c.url.includes("/auth/refresh")));
});

test("access expiré → 401 sans refresh automatique (read-only)", async () => {
  const store = new InMemoryCookieStore();
  seedAuth(store, "EXPIRED", "REFRESH-1");
  const mock = createMockFetch(ERR(401));
  const res = await handleGetProfile(meRequest(), makeDeps(store, mock));
  assert.equal(res.status, 401);
  assert.equal(store.get(cookieName("access", TEST_ENV)), "EXPIRED");
  assert.ok(mock.calls.every((c) => !c.url.includes("/auth/refresh")), "aucun refresh en read-only");
});

test("403 réel relayé distinctement (pas transformé en 401)", async () => {
  const store = new InMemoryCookieStore();
  seedAuth(store, "ACCESS-1", "REFRESH-1");
  const res = await handleGetProfile(meRequest(), makeDeps(store, createMockFetch(ERR(403))));
  assert.equal(res.status, 403);
});

test("méthode non-GET → 405", async () => {
  const store = new InMemoryCookieStore();
  const res = await handleGetProfile(makeRequest("/api/auth/me", { method: "POST" }), makeDeps(store, createMockFetch({})));
  assert.equal(res.status, 405);
});
