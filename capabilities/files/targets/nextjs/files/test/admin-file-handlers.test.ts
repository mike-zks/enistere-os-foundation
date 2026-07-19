import assert from "node:assert/strict";
import { test } from "node:test";

import { handleQuarantineFile } from "../src/core/files/handlers/quarantine-file-handler.js";
import { handleRestoreFile } from "../src/core/files/handlers/restore-file-handler.js";
import { InMemoryCookieStore } from "../src/core/auth/server-cookie-store.js";
import { createMockFetch, type MockResponseSpec } from "./helpers/api-test-kit.js";
import { makeDeps, makeRequest, seedAuth, seedCsrf } from "./helpers/auth-test-kit.js";

const ID = "b3f1c2d4-5e6f-4a8b-9c0d-1e2f3a4b5c6d";
const BAD_ID = "not-a-uuid";
const WRONG_CSRF = "wrong-but-valid-format-token-aaaaaaaaaaaaaaa";
const OK_BODY = { success: true, timestamp: "t" };
const ERR = (status: number): MockResponseSpec => ({
  status,
  body: { success: false, statusCode: status, message: "x", errorCode: "E", path: "/files", timestamp: "t" },
});

const qReq = (id = ID, opts: { csrf?: string; origin?: string; method?: string } = {}): Request => {
  const { method, ...rest } = opts;
  return makeRequest(`/api/files/${id}/quarantine`, { method: method ?? "POST", ...rest });
};
const rReq = (id = ID, opts: { csrf?: string; origin?: string; method?: string } = {}): Request => {
  const { method, ...rest } = opts;
  return makeRequest(`/api/files/${id}/restore`, { method: method ?? "POST", ...rest });
};

// ═══════════════════ quarantaine ═══════════════════

test("quarantaine : GET refusé (405) sans appel API", async () => {
  const mock = createMockFetch({ status: 200, body: OK_BODY });
  const res = await handleQuarantineFile(qReq(ID, { method: "GET" }), makeDeps(new InMemoryCookieStore(), mock), ID);
  assert.equal(res.status, 405);
  assert.equal(mock.calls.length, 0);
});

test("quarantaine : UUID invalide → 400 sans appel API", async () => {
  const store = new InMemoryCookieStore();
  const csrf = seedCsrf(store);
  const mock = createMockFetch({ status: 200, body: OK_BODY });
  const res = await handleQuarantineFile(qReq(BAD_ID, { csrf }), makeDeps(store, mock), BAD_ID);
  assert.equal(res.status, 400);
  const body = (await res.json()) as { errorCode: string };
  assert.equal(body.errorCode, "INVALID_ID");
  assert.equal(mock.calls.length, 0);
});

test("quarantaine : Origin invalide → 403 sans appel API", async () => {
  const store = new InMemoryCookieStore();
  seedAuth(store, "A", "R");
  const csrf = seedCsrf(store);
  const mock = createMockFetch({ status: 200, body: OK_BODY });
  const res = await handleQuarantineFile(qReq(ID, { csrf, origin: "https://evil.test" }), makeDeps(store, mock), ID);
  assert.equal(res.status, 403);
  assert.equal(mock.calls.length, 0);
});

test("quarantaine : CSRF invalide → 403 sans appel API", async () => {
  const store = new InMemoryCookieStore();
  seedAuth(store, "A", "R");
  seedCsrf(store);
  const mock = createMockFetch({ status: 200, body: OK_BODY });
  const res = await handleQuarantineFile(qReq(ID, { csrf: WRONG_CSRF }), makeDeps(store, mock), ID);
  assert.equal(res.status, 403);
  assert.equal(mock.calls.length, 0);
});

test("quarantaine : CSRF absent → 403 sans appel API", async () => {
  const store = new InMemoryCookieStore();
  seedAuth(store, "A", "R");
  seedCsrf(store);
  const mock = createMockFetch({ status: 200, body: OK_BODY });
  const res = await handleQuarantineFile(qReq(ID), makeDeps(store, mock), ID);
  assert.equal(res.status, 403);
  assert.equal(mock.calls.length, 0);
});

test("quarantaine : succès → 200 { success:true, data:null }, no-store, Authorization Bearer", async () => {
  const store = new InMemoryCookieStore();
  seedAuth(store, "ACCESS", "REFRESH");
  const csrf = seedCsrf(store);
  const mock = createMockFetch({ status: 200, body: OK_BODY });
  const res = await handleQuarantineFile(qReq(ID, { csrf }), makeDeps(store, mock), ID);
  assert.equal(res.status, 200);
  assert.equal(res.headers.get("cache-control"), "no-store");
  const body = (await res.json()) as { success: boolean; data: null };
  assert.equal(body.success, true);
  assert.equal(body.data, null);
  assert.equal(mock.calls[0]?.headers["authorization"], "Bearer ACCESS");
});

test("quarantaine : 409 → NOT_QUARANTINABLE (jamais NOT_DOWNLOADABLE)", async () => {
  const store = new InMemoryCookieStore();
  seedAuth(store, "A", "R");
  const csrf = seedCsrf(store);
  const res = await handleQuarantineFile(qReq(ID, { csrf }), makeDeps(store, createMockFetch(ERR(409))), ID);
  assert.equal(res.status, 409);
  const body = (await res.json()) as { errorCode: string };
  assert.equal(body.errorCode, "NOT_QUARANTINABLE");
  assert.notEqual(body.errorCode, "NOT_DOWNLOADABLE");
});

test("quarantaine : 401/403/404/503 mappés distinctement", async () => {
  for (const status of [401, 403, 404, 503] as const) {
    const store = new InMemoryCookieStore();
    seedAuth(store, "A", "R");
    const csrf = seedCsrf(store);
    const res = await handleQuarantineFile(qReq(ID, { csrf }), makeDeps(store, createMockFetch(ERR(status))), ID);
    assert.equal(res.status, status, `status ${status}`);
  }
});

test("quarantaine : requestId propagé navigateur → API → réponse", async () => {
  const store = new InMemoryCookieStore();
  seedAuth(store, "A", "R");
  const csrf = seedCsrf(store);
  const mock = createMockFetch({ status: 200, body: OK_BODY });
  const req = makeRequest(`/api/files/${ID}/quarantine`, { method: "POST", csrf, requestId: "rid-q-1" });
  const res = await handleQuarantineFile(req, makeDeps(store, mock), ID);
  assert.equal(res.headers.get("x-request-id"), "rid-q-1");
  assert.equal(mock.calls[0]?.headers["x-request-id"], "rid-q-1");
});

// ═══════════════════ restauration ═══════════════════

test("restauration : GET refusé (405) sans appel API", async () => {
  const mock = createMockFetch({ status: 200, body: OK_BODY });
  const res = await handleRestoreFile(rReq(ID, { method: "GET" }), makeDeps(new InMemoryCookieStore(), mock), ID);
  assert.equal(res.status, 405);
  assert.equal(mock.calls.length, 0);
});

test("restauration : UUID invalide → 400 sans appel API", async () => {
  const store = new InMemoryCookieStore();
  const csrf = seedCsrf(store);
  const mock = createMockFetch({ status: 200, body: OK_BODY });
  const res = await handleRestoreFile(rReq(BAD_ID, { csrf }), makeDeps(store, mock), BAD_ID);
  assert.equal(res.status, 400);
  const body = (await res.json()) as { errorCode: string };
  assert.equal(body.errorCode, "INVALID_ID");
  assert.equal(mock.calls.length, 0);
});

test("restauration : Origin invalide → 403 sans appel API", async () => {
  const store = new InMemoryCookieStore();
  seedAuth(store, "A", "R");
  const csrf = seedCsrf(store);
  const mock = createMockFetch({ status: 200, body: OK_BODY });
  const res = await handleRestoreFile(rReq(ID, { csrf, origin: "https://evil.test" }), makeDeps(store, mock), ID);
  assert.equal(res.status, 403);
  assert.equal(mock.calls.length, 0);
});

test("restauration : CSRF invalide → 403 sans appel API", async () => {
  const store = new InMemoryCookieStore();
  seedAuth(store, "A", "R");
  seedCsrf(store);
  const mock = createMockFetch({ status: 200, body: OK_BODY });
  const res = await handleRestoreFile(rReq(ID, { csrf: WRONG_CSRF }), makeDeps(store, mock), ID);
  assert.equal(res.status, 403);
  assert.equal(mock.calls.length, 0);
});

test("restauration : CSRF absent → 403 sans appel API", async () => {
  const store = new InMemoryCookieStore();
  seedAuth(store, "A", "R");
  seedCsrf(store);
  const mock = createMockFetch({ status: 200, body: OK_BODY });
  const res = await handleRestoreFile(rReq(ID), makeDeps(store, mock), ID);
  assert.equal(res.status, 403);
  assert.equal(mock.calls.length, 0);
});

test("restauration : succès → 200 { success:true, data:null }, no-store, Authorization Bearer", async () => {
  const store = new InMemoryCookieStore();
  seedAuth(store, "ACCESS", "REFRESH");
  const csrf = seedCsrf(store);
  const mock = createMockFetch({ status: 200, body: OK_BODY });
  const res = await handleRestoreFile(rReq(ID, { csrf }), makeDeps(store, mock), ID);
  assert.equal(res.status, 200);
  assert.equal(res.headers.get("cache-control"), "no-store");
  const body = (await res.json()) as { success: boolean; data: null };
  assert.equal(body.success, true);
  assert.equal(body.data, null);
  assert.equal(mock.calls[0]?.headers["authorization"], "Bearer ACCESS");
});

test("restauration : 409 → NOT_RESTORABLE (jamais NOT_DOWNLOADABLE)", async () => {
  const store = new InMemoryCookieStore();
  seedAuth(store, "A", "R");
  const csrf = seedCsrf(store);
  const res = await handleRestoreFile(rReq(ID, { csrf }), makeDeps(store, createMockFetch(ERR(409))), ID);
  assert.equal(res.status, 409);
  const body = (await res.json()) as { errorCode: string };
  assert.equal(body.errorCode, "NOT_RESTORABLE");
  assert.notEqual(body.errorCode, "NOT_DOWNLOADABLE");
});

test("restauration : 401/403/404/503 mappés distinctement", async () => {
  for (const status of [401, 403, 404, 503] as const) {
    const store = new InMemoryCookieStore();
    seedAuth(store, "A", "R");
    const csrf = seedCsrf(store);
    const res = await handleRestoreFile(rReq(ID, { csrf }), makeDeps(store, createMockFetch(ERR(status))), ID);
    assert.equal(res.status, status, `status ${status}`);
  }
});

test("restauration : requestId propagé navigateur → API → réponse", async () => {
  const store = new InMemoryCookieStore();
  seedAuth(store, "A", "R");
  const csrf = seedCsrf(store);
  const mock = createMockFetch({ status: 200, body: OK_BODY });
  const req = makeRequest(`/api/files/${ID}/restore`, { method: "POST", csrf, requestId: "rid-r-1" });
  const res = await handleRestoreFile(req, makeDeps(store, mock), ID);
  assert.equal(res.headers.get("x-request-id"), "rid-r-1");
  assert.equal(mock.calls[0]?.headers["x-request-id"], "rid-r-1");
});
