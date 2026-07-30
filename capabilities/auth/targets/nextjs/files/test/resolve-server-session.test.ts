import assert from "node:assert/strict";
import { test } from "node:test";

import { cookieName, type CookieEnv } from "../src/features/auth/cookie-config.js";
import { inMemoryReadOnlyCookieStore } from "../src/features/auth/read-only-cookie-store.js";
import {
  PROTECTED_ANONYMOUS_REDIRECT,
  decideProtectedRender,
  resolveServerSession,
  type ServerSessionResolution,
} from "../src/features/auth/resolve-server-session.js";
import { createMockFetch, envelope } from "./helpers/api-test-kit.js";

const ENV: CookieEnv = "development";
const BASE = "https://internal.test";
const PROFILE = {
  id: "u1",
  email: "user@example.test",
  status: "ACTIVE",
  createdAt: "t",
  updatedAt: "t",
} as const;
const ERR = (status: number) => ({
  success: false,
  statusCode: status,
  message: "x",
  errorCode: "E",
  path: "/auth/me",
  timestamp: "t",
});

function storeWith(access?: string) {
  return access === undefined
    ? inMemoryReadOnlyCookieStore({})
    : inMemoryReadOnlyCookieStore({ [cookieName("access", ENV)]: access });
}

test("profil valide → authenticated (+ requestId propagé à l'API, aucun token dans le résultat)", async () => {
  const mock = createMockFetch({ body: envelope(PROFILE) });
  const res = await resolveServerSession({
    cookieStore: storeWith("TOKEN-A"),
    env: ENV,
    baseUrl: BASE,
    fetch: mock,
    requestId: "req-1",
  });
  assert.equal(res.status, "authenticated");
  assert.equal(res.status === "authenticated" ? res.user.email : null, "user@example.test");
  assert.equal(res.requestId, "req-1");
  // requestId propagé à l'API + Bearer issu du cookie.
  assert.equal(mock.calls[0]?.headers["x-request-id"], "req-1");
  assert.equal(mock.calls[0]?.headers["authorization"], "Bearer TOKEN-A");
  assert.ok(mock.calls[0]?.url.includes("/auth/me"));
  // Aucun token / valeur de cookie dans le résultat sérialisé.
  const dump = JSON.stringify(res).toLowerCase();
  assert.ok(!dump.includes("token-a"));
  assert.ok(!dump.includes("accesstoken") && !dump.includes("refreshtoken"));
});

test("401 → anonymous (jamais une erreur)", async () => {
  const mock = createMockFetch({ status: 401, body: ERR(401) });
  const res = await resolveServerSession({ cookieStore: storeWith("EXPIRED"), env: ENV, baseUrl: BASE, fetch: mock, requestId: "r" });
  assert.equal(res.status, "anonymous");
  assert.equal(res.requestId, "r");
});

test("403 → unavailable (distinct d'anonymous)", async () => {
  const mock = createMockFetch({ status: 403, body: ERR(403) });
  const res = await resolveServerSession({ cookieStore: storeWith("TOK"), env: ENV, baseUrl: BASE, fetch: mock });
  assert.equal(res.status, "unavailable");
  assert.notEqual(res.status, "anonymous");
  assert.equal(res.status === "unavailable" ? res.error.status : null, 403);
});

test("erreur réseau → unavailable (pas anonymous)", async () => {
  const mock = createMockFetch({ throwError: new TypeError("network down") });
  const res = await resolveServerSession({ cookieStore: storeWith("TOK"), env: ENV, baseUrl: BASE, fetch: mock });
  assert.equal(res.status, "unavailable");
});

test("500 → unavailable", async () => {
  const mock = createMockFetch({ status: 500, body: ERR(500) });
  const res = await resolveServerSession({ cookieStore: storeWith("TOK"), env: ENV, baseUrl: BASE, fetch: mock });
  assert.equal(res.status, "unavailable");
});

test("503 → unavailable (même branche que timeout)", async () => {
  const mock = createMockFetch({ status: 503, body: ERR(503) });
  const res = await resolveServerSession({ cookieStore: storeWith("TOK"), env: ENV, baseUrl: BASE, fetch: mock });
  assert.equal(res.status, "unavailable");
});

test("2xx avec corps inexploitable → unavailable (jamais authenticated vide)", async () => {
  const mock = createMockFetch({ body: { success: true, timestamp: "t" } }); // pas de `data`
  const res = await resolveServerSession({ cookieStore: storeWith("TOK"), env: ENV, baseUrl: BASE, fetch: mock });
  assert.equal(res.status, "unavailable");
});

test("read-only : 401 ne déclenche AUCUN refresh (aucun appel /auth/refresh)", async () => {
  const mock = createMockFetch({ status: 401, body: ERR(401) });
  const store = inMemoryReadOnlyCookieStore({
    [cookieName("access", ENV)]: "EXPIRED",
    [cookieName("refresh", ENV)]: "REFRESH-TOK",
  });
  const res = await resolveServerSession({ cookieStore: store, env: ENV, baseUrl: BASE, fetch: mock });
  assert.equal(res.status, "anonymous");
  assert.ok(mock.calls.every((c) => !c.url.includes("/auth/refresh")), "aucun refresh en read-only");
});

test("aucun token dans une résolution d'erreur sérialisée", async () => {
  const mock = createMockFetch({ status: 500, body: ERR(500) });
  const res = await resolveServerSession({ cookieStore: storeWith("SECRET-TOKEN"), env: ENV, baseUrl: BASE, fetch: mock });
  const dump = JSON.stringify(res).toLowerCase();
  assert.ok(!dump.includes("secret-token") && !dump.includes("token"));
});

test("isolation A/B : chaque résolution lit son propre cookie (aucune fuite)", async () => {
  const mockA = createMockFetch({ body: envelope({ ...PROFILE, id: "a", email: "a@x.test" }) });
  const mockB = createMockFetch({ body: envelope({ ...PROFILE, id: "b", email: "b@x.test" }) });
  const resA = await resolveServerSession({ cookieStore: storeWith("TOKEN-A"), env: ENV, baseUrl: "https://a.test", fetch: mockA });
  const resB = await resolveServerSession({ cookieStore: storeWith("TOKEN-B"), env: ENV, baseUrl: "https://b.test", fetch: mockB });
  assert.equal(resA.status === "authenticated" ? resA.user.email : null, "a@x.test");
  assert.equal(resB.status === "authenticated" ? resB.user.email : null, "b@x.test");
  assert.equal(mockA.calls[0]?.headers["authorization"], "Bearer TOKEN-A");
  assert.equal(mockB.calls[0]?.headers["authorization"], "Bearer TOKEN-B");
  assert.ok(mockA.calls.every((c) => !c.headers["authorization"]?.includes("TOKEN-B")));
});

// --- decideProtectedRender (politique pure) ---

test("decideProtectedRender : authenticated → render avec profil", () => {
  const r: ServerSessionResolution = { status: "authenticated", user: PROFILE, requestId: "r" };
  const d = decideProtectedRender(r);
  assert.equal(d.action, "render");
  assert.equal(d.action === "render" ? d.user.email : null, "user@example.test");
});

test("decideProtectedRender : anonymous → redirection vers /login (interne, returnTo assaini, aucun token)", () => {
  const d = decideProtectedRender({ status: "anonymous" });
  assert.equal(d.action, "redirect");
  assert.equal(d.action === "redirect" ? d.location : null, PROTECTED_ANONYMOUS_REDIRECT);
  assert.ok(PROTECTED_ANONYMOUS_REDIRECT.startsWith("/login?returnTo="));
  assert.ok(!PROTECTED_ANONYMOUS_REDIRECT.includes("://"));
  assert.ok(!PROTECTED_ANONYMOUS_REDIRECT.toLowerCase().includes("token"));
});

test("decideProtectedRender : unavailable → erreur de service (pas de redirection)", () => {
  const d = decideProtectedRender({ status: "unavailable", error: { message: "x", status: 500 }, requestId: "r" });
  assert.equal(d.action, "unavailable");
  assert.equal(d.action === "unavailable" ? d.requestId : null, "r");
});
