import { handleGetAuthorization } from "../src/core/auth/handlers/get-authorization-handler.js";
import { InMemoryCookieStore } from "../src/core/auth/server-cookie-store.js";
import assert from "node:assert/strict";
import { test } from "node:test";

import { createMockFetch, type MockResponseSpec } from "./helpers/api-test-kit.js";
import { apiEnvelope, makeDeps, makeRequest, seedAuth } from "./helpers/auth-test-kit.js";

const AUTHZ = { roles: ["administrator"], permissions: ["files.read", "files.upload"] };
const ERR = (status: number): MockResponseSpec => ({
  status,
  body: { success: false, statusCode: status, message: "x", errorCode: "E", path: "/auth/me/authorization", timestamp: "t" },
});
const authzRequest = () => makeRequest("/api/auth/authorization", { method: "GET" });

test("session valide → 200 rôles/permissions + no-store", async () => {
  const store = new InMemoryCookieStore();
  seedAuth(store, "ACCESS-1", "REFRESH-1");
  const mock = createMockFetch({ body: apiEnvelope(AUTHZ) });
  const res = await handleGetAuthorization(authzRequest(), makeDeps(store, mock));

  assert.equal(res.status, 200);
  const body = (await res.json()) as { data: typeof AUTHZ };
  assert.deepEqual(body.data, AUTHZ);
  assert.equal(res.headers.get("cache-control"), "no-store");
  assert.ok(mock.calls.some((c) => c.url.includes("/auth/me/authorization")));
});

test("session absente → 401, aucun refresh auto", async () => {
  const store = new InMemoryCookieStore();
  const mock = createMockFetch(ERR(401));
  const res = await handleGetAuthorization(authzRequest(), makeDeps(store, mock));
  assert.equal(res.status, 401);
  assert.ok(mock.calls.every((c) => !c.url.includes("/auth/refresh")));
});

test("aucun token ni structure interne exposés", async () => {
  const store = new InMemoryCookieStore();
  seedAuth(store, "ACCESS-SECRET", "REFRESH-SECRET");
  const res = await handleGetAuthorization(authzRequest(), makeDeps(store, createMockFetch({ body: apiEnvelope(AUTHZ) })));
  const text = await res.text();
  assert.ok(!text.includes("ACCESS-SECRET") && !text.includes("REFRESH-SECRET"));
});
