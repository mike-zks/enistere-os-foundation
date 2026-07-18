import assert from "node:assert/strict";
import { test } from "node:test";

import { cookieName } from "../src/core/auth/cookie-config.js";
import { csrfCookieName } from "../src/core/auth/csrf/csrf-cookie.js";
import { handleLogin } from "../src/core/auth/handlers/login-handler.js";
import { InMemoryCookieStore } from "../src/core/auth/server-cookie-store.js";
import { createMockFetch, type MockResponseSpec } from "./helpers/api-test-kit.js";
import {
  apiEnvelope,
  loginPayload,
  makeDeps,
  makeRequest,
  seedCsrf,
  TEST_ENV,
} from "./helpers/auth-test-kit.js";

const ERR = (status: number): MockResponseSpec => ({
  status,
  body: { success: false, statusCode: status, message: "x", errorCode: "E", path: "/auth/login", timestamp: "t" },
});

function loginRequest(csrf: string, extra: Record<string, unknown> = {}): Request {
  return makeRequest("/api/auth/login", { csrf, jsonBody: { email: "user@example.test", password: "pw", ...extra } });
}

test("succès : cookies HttpOnly posés, aucun token dans le corps, CSRF renouvelé", async () => {
  const store = new InMemoryCookieStore();
  const csrf = seedCsrf(store);
  const mock = createMockFetch({ body: apiEnvelope(loginPayload("ACCESS-1", "REFRESH-1")) });
  const res = await handleLogin(loginRequest(csrf), makeDeps(store, mock));

  assert.equal(res.status, 200);
  const body = (await res.json()) as { data: { authenticated: boolean } };
  assert.deepEqual(body.data, { authenticated: true });
  const serialized = JSON.stringify(body);
  assert.ok(!serialized.includes("ACCESS-1") && !serialized.includes("REFRESH-1"));
  assert.equal(store.get(cookieName("access", TEST_ENV)), "ACCESS-1");
  assert.equal(store.get(cookieName("refresh", TEST_ENV)), "REFRESH-1");
  assert.notEqual(store.get(csrfCookieName(TEST_ENV)), csrf, "CSRF doit être renouvelé");
  assert.ok(mock.calls.some((c) => c.url.includes("/auth/login")));
});

test("identifiants invalides → 401 générique, aucun cookie Auth", async () => {
  const store = new InMemoryCookieStore();
  const csrf = seedCsrf(store);
  const res = await handleLogin(loginRequest(csrf), makeDeps(store, createMockFetch(ERR(401))));
  assert.equal(res.status, 401);
  assert.equal(store.get(cookieName("access", TEST_ENV)), undefined);
});

test("Origin invalide → 403 sans appel API", async () => {
  const store = new InMemoryCookieStore();
  const csrf = seedCsrf(store);
  const mock = createMockFetch({ body: apiEnvelope(loginPayload()) });
  const res = await handleLogin(
    makeRequest("/api/auth/login", { origin: "https://evil.test", csrf, jsonBody: { email: "user@example.test", password: "pw" } }),
    makeDeps(store, mock),
  );
  assert.equal(res.status, 403);
  assert.equal(mock.calls.length, 0);
});

test("CSRF invalide → 403 sans appel API", async () => {
  const store = new InMemoryCookieStore();
  seedCsrf(store);
  const mock = createMockFetch({ body: apiEnvelope(loginPayload()) });
  const res = await handleLogin(loginRequest("wrong-but-validformat-token-aaaaaaaaaaaaaa"), makeDeps(store, mock));
  assert.equal(res.status, 403);
  assert.equal(mock.calls.length, 0);
});

test("corps invalide → 400 sans appel API", async () => {
  const store = new InMemoryCookieStore();
  const csrf = seedCsrf(store);
  const mock = createMockFetch({ body: apiEnvelope(loginPayload()) });
  const res = await handleLogin(
    makeRequest("/api/auth/login", { csrf, jsonBody: { email: "bad", password: "pw" } }),
    makeDeps(store, mock),
  );
  assert.equal(res.status, 400);
  assert.equal(mock.calls.length, 0);
});

test("compensation : échec d'écriture du 2e cookie → clearSession (aucun cookie partiel)", async () => {
  class FailOnRefreshStore extends InMemoryCookieStore {
    override set(name: string, value: string, options: Parameters<InMemoryCookieStore["set"]>[2]): void {
      if (name === cookieName("refresh", TEST_ENV)) {
        throw new Error("cookie write failed");
      }
      super.set(name, value, options);
    }
  }
  const store = new FailOnRefreshStore();
  const csrf = seedCsrf(store);
  const res = await handleLogin(loginRequest(csrf), makeDeps(store, createMockFetch({ body: apiEnvelope(loginPayload("AX", "RX")) })));
  assert.ok(res.status >= 400);
  assert.equal(store.get(cookieName("access", TEST_ENV)), undefined, "access compensé (clearSession)");
});

test("propagation du request ID (navigateur → BFF → API → réponse)", async () => {
  const store = new InMemoryCookieStore();
  const csrf = seedCsrf(store);
  const mock = createMockFetch({ body: apiEnvelope(loginPayload()) });
  const res = await handleLogin(
    makeRequest("/api/auth/login", { csrf, requestId: "rid-test-123", jsonBody: { email: "user@example.test", password: "pw" } }),
    makeDeps(store, mock),
  );
  assert.equal(res.headers.get("x-request-id"), "rid-test-123");
  assert.equal(mock.calls[0]?.headers["x-request-id"], "rid-test-123");
});
