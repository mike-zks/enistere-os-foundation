import { ApiClientError } from "@enistere/api-client-fetch";
import assert from "node:assert/strict";
import { afterEach, test } from "node:test";

import { createAuthenticatedServerApiClient } from "../src/features/auth/api/create-authenticated-server-api-client.js";
import { buildAuthCookieOptions, cookieName, type CookieEnv } from "../src/features/auth/cookie-config.js";
import { InMemoryCookieStore } from "../src/features/auth/server-cookie-store.js";
import { createMockFetch, envelope, forbidRealFetch } from "./helpers/api-test-kit.js";

const ENV: CookieEnv = "development";
const ORIG_FETCH = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = ORIG_FETCH;
});

function seededStore(access?: string, refresh?: string): InMemoryCookieStore {
  const store = new InMemoryCookieStore();
  if (access !== undefined) store.set(cookieName("access", ENV), access, buildAuthCookieOptions(ENV, 900));
  if (refresh !== undefined) store.set(cookieName("refresh", ENV), refresh, buildAuthCookieOptions(ENV, 1209600));
  return store;
}

const ERR_BODY = {
  success: false,
  statusCode: 401,
  message: "non authentifié",
  errorCode: "UNAUTHENTICATED",
  path: "/auth/me",
  timestamp: "2026-06-09T12:00:00.000Z",
};

test("nouvelle instance par appel (aucune session globale)", () => {
  const a = createAuthenticatedServerApiClient({ cookieStore: new InMemoryCookieStore(), mode: "read-only", env: ENV, baseUrl: "https://internal.test", fetch: createMockFetch({}) });
  const b = createAuthenticatedServerApiClient({ cookieStore: new InMemoryCookieStore(), mode: "read-only", env: ENV, baseUrl: "https://internal.test", fetch: createMockFetch({}) });
  assert.notEqual(a, b);
});

test("base URL interne + fetch injecté + X-Request-Id + Bearer issu du cookie", async () => {
  const mock = createMockFetch({ body: envelope({ status: "ok", timestamp: "t" }) });
  const client = createAuthenticatedServerApiClient({ cookieStore: seededStore("TOKEN-A"), mode: "read-only", env: ENV, baseUrl: "https://internal.test", fetch: mock });
  await client.raw.GET("/health", {});
  assert.ok(mock.calls[0]?.url.startsWith("https://internal.test/health"));
  assert.equal(mock.calls[0]?.headers["authorization"], "Bearer TOKEN-A");
  assert.ok(mock.calls[0]?.headers["x-request-id"]);
});

test("sans cookie d'access : aucun en-tête Authorization", async () => {
  const mock = createMockFetch({ body: envelope({ status: "ok", timestamp: "t" }) });
  const client = createAuthenticatedServerApiClient({ cookieStore: new InMemoryCookieStore(), mode: "read-only", env: ENV, baseUrl: "https://internal.test", fetch: mock });
  await client.raw.GET("/health", {});
  assert.equal(mock.calls[0]?.headers["authorization"], undefined);
});

test("isolation SSR : client A lit A, client B lit B (aucune fuite)", async () => {
  const mockA = createMockFetch({ body: envelope({ status: "ok", timestamp: "t" }) });
  const mockB = createMockFetch({ body: envelope({ status: "ok", timestamp: "t" }) });
  const clientA = createAuthenticatedServerApiClient({ cookieStore: seededStore("TOKEN-A"), mode: "read-only", env: ENV, baseUrl: "https://a.test", fetch: mockA });
  const clientB = createAuthenticatedServerApiClient({ cookieStore: seededStore("TOKEN-B"), mode: "read-only", env: ENV, baseUrl: "https://b.test", fetch: mockB });
  await clientA.raw.GET("/health", {});
  await clientB.raw.GET("/health", {});
  assert.equal(mockA.calls[0]?.headers["authorization"], "Bearer TOKEN-A");
  assert.equal(mockB.calls[0]?.headers["authorization"], "Bearer TOKEN-B");
  assert.ok(mockA.calls.every((c) => !c.headers["authorization"]?.includes("TOKEN-B")));
});

test("mode read-only : refresh DÉSACTIVÉ (401 → aucune requête /auth/refresh)", async () => {
  const mock = createMockFetch((req) =>
    req.url.includes("/auth/me") ? { status: 401, body: ERR_BODY } : { status: 401, body: ERR_BODY },
  );
  const client = createAuthenticatedServerApiClient({ cookieStore: seededStore("EXPIRED", "REFRESH-TOK"), mode: "read-only", env: ENV, baseUrl: "https://internal.test", fetch: mock });
  await assert.rejects(
    () => client.auth.getProfile(),
    (e) => e instanceof ApiClientError && e.status === 401,
  );
  assert.ok(mock.calls.every((c) => !c.url.includes("/auth/refresh")), "aucun refresh en read-only");
});

test("mode writable : refresh ACTIVABLE (401 → /auth/refresh tenté)", async () => {
  const mock = createMockFetch(() => ({ status: 401, body: ERR_BODY }));
  const client = createAuthenticatedServerApiClient({ cookieStore: seededStore("EXPIRED", "REFRESH-TOK"), mode: "writable", env: ENV, baseUrl: "https://internal.test", fetch: mock });
  await assert.rejects(() => client.auth.getProfile());
  assert.ok(mock.calls.some((c) => c.url.includes("/auth/refresh")), "refresh tenté en writable");
});

test("aucune requête réseau réelle : fetch injecté utilisé (garde anti-réseau)", async () => {
  forbidRealFetch();
  const mock = createMockFetch({ body: envelope({ status: "ok", timestamp: "t" }) });
  const client = createAuthenticatedServerApiClient({ cookieStore: seededStore("TOKEN-A"), mode: "read-only", env: ENV, baseUrl: "https://internal.test", fetch: mock });
  await client.raw.GET("/health", {});
  assert.equal(mock.calls.length, 1);
});
