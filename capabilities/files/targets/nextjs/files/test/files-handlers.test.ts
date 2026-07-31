import assert from "node:assert/strict";
import { test } from "node:test";

import { handleCreateDownloadUrl } from "../src/features/files/handlers/create-download-url-handler.js";
import { handleDeleteFile } from "../src/features/files/handlers/delete-file-handler.js";
import { handleGetFileMetadata } from "../src/features/files/handlers/get-file-metadata-handler.js";
import { InMemoryCookieStore } from "../src/features/auth/server-cookie-store.js";
import { createMockFetch, type MockResponseSpec } from "./helpers/api-test-kit.js";
import { apiEnvelope, makeDeps, makeRequest, seedAuth, seedCsrf } from "./helpers/auth-test-kit.js";

const ID = "b3f1c2d4-5e6f-4a8b-9c0d-1e2f3a4b5c6d";
const BAD_ID = "not-a-uuid";
const WRONG_CSRF = "wrong-but-valid-format-token-aaaaaaaaaaaaaaa";
const FILE = {
  id: ID,
  originalName: "photo.jpg",
  mimeType: "image/jpeg",
  extension: "jpg",
  size: "1048576",
  category: "IMAGE",
  status: "VALIDATED",
  visibility: "PRIVATE",
  createdAt: "2026-06-09T12:00:00.000Z",
  updatedAt: "2026-06-09T12:00:00.000Z",
};
const SIGNED = { url: "https://storage.test/files/obj?X-Amz-Signature=ABC", expiresAt: "2026-06-09T12:05:00.000Z" };
const ERR = (status: number): MockResponseSpec => ({
  status,
  body: { success: false, statusCode: status, message: "x", errorCode: "E", path: "/files", timestamp: "t" },
});
const metaReq = (id = ID, requestId?: string): Request =>
  makeRequest(`/api/files/${id}`, { method: "GET", ...(requestId ? { requestId } : {}) });

// ---------- métadonnées ----------

test("métadonnées : UUID valide → 200 + données publiques, no-store, aucune propriété interne", async () => {
  const store = new InMemoryCookieStore();
  seedAuth(store, "ACCESS", "REFRESH");
  const mock = createMockFetch({ body: apiEnvelope(FILE) });
  const res = await handleGetFileMetadata(metaReq(), makeDeps(store, mock), ID);
  assert.equal(res.status, 200);
  assert.equal(res.headers.get("cache-control"), "no-store");
  const body = (await res.json()) as { data: { id: string } };
  assert.equal(body.data.id, ID);
  const dump = JSON.stringify(body).toLowerCase();
  for (const internal of ["storagekey", "bucket", "checksum", "ownerid"]) {
    assert.ok(!dump.includes(internal), `champ interne exposé: ${internal}`);
  }
  assert.equal(mock.calls[0]?.headers["authorization"], "Bearer ACCESS");
});

test("métadonnées : UUID invalide → 400 sans appel API", async () => {
  const mock = createMockFetch({ body: apiEnvelope(FILE) });
  const res = await handleGetFileMetadata(
    makeRequest(`/api/files/${BAD_ID}`, { method: "GET" }),
    makeDeps(new InMemoryCookieStore(), mock),
    BAD_ID,
  );
  assert.equal(res.status, 400);
  assert.equal(mock.calls.length, 0);
});

test("métadonnées : 401/403/404/503 mappés distinctement", async () => {
  for (const status of [401, 403, 404, 503]) {
    const store = new InMemoryCookieStore();
    seedAuth(store, "A", "R");
    const res = await handleGetFileMetadata(metaReq(), makeDeps(store, createMockFetch(ERR(status))), ID);
    assert.equal(res.status, status, `status ${status}`);
  }
});

test("métadonnées : read-only → aucun appel /auth/refresh sur 401", async () => {
  const store = new InMemoryCookieStore();
  seedAuth(store, "EXPIRED", "REFRESH");
  const mock = createMockFetch(ERR(401));
  await handleGetFileMetadata(metaReq(), makeDeps(store, mock), ID);
  assert.ok(mock.calls.every((c) => !c.url.includes("/auth/refresh")), "aucun refresh en read-only");
});

test("métadonnées : requestId propagé navigateur → API → réponse", async () => {
  const store = new InMemoryCookieStore();
  seedAuth(store, "A", "R");
  const mock = createMockFetch({ body: apiEnvelope(FILE) });
  const res = await handleGetFileMetadata(metaReq(ID, "rid-files-1"), makeDeps(store, mock), ID);
  assert.equal(res.headers.get("x-request-id"), "rid-files-1");
  assert.equal(mock.calls[0]?.headers["x-request-id"], "rid-files-1");
});

test("métadonnées : POST refusé (405)", async () => {
  const store = new InMemoryCookieStore();
  seedAuth(store, "A", "R");
  const mock = createMockFetch({ body: apiEnvelope(FILE) });
  const res = await handleGetFileMetadata(makeRequest(`/api/files/${ID}`, { method: "POST" }), makeDeps(store, mock), ID);
  assert.equal(res.status, 405);
  assert.equal(mock.calls.length, 0);
});

// ---------- URL signée ----------

test("URL signée : succès → { url, expiresAt } minimal, no-store", async () => {
  const store = new InMemoryCookieStore();
  seedAuth(store, "A", "R");
  const csrf = seedCsrf(store);
  const mock = createMockFetch({ body: apiEnvelope(SIGNED) });
  const res = await handleCreateDownloadUrl(makeRequest(`/api/files/${ID}/download-url`, { csrf }), makeDeps(store, mock), ID);
  assert.equal(res.status, 200);
  assert.equal(res.headers.get("cache-control"), "no-store");
  const body = (await res.json()) as { data: Record<string, unknown> };
  assert.deepEqual(Object.keys(body.data).sort(), ["expiresAt", "url"]);
});

test("URL signée : UUID invalide → 400 sans appel API", async () => {
  const store = new InMemoryCookieStore();
  const csrf = seedCsrf(store);
  const mock = createMockFetch({ body: apiEnvelope(SIGNED) });
  const res = await handleCreateDownloadUrl(makeRequest(`/api/files/${BAD_ID}/download-url`, { csrf }), makeDeps(store, mock), BAD_ID);
  assert.equal(res.status, 400);
  assert.equal(mock.calls.length, 0);
});

test("URL signée : Origin invalide → 403 sans appel API", async () => {
  const store = new InMemoryCookieStore();
  seedAuth(store, "A", "R");
  const csrf = seedCsrf(store);
  const mock = createMockFetch({ body: apiEnvelope(SIGNED) });
  const res = await handleCreateDownloadUrl(
    makeRequest(`/api/files/${ID}/download-url`, { csrf, origin: "https://evil.test" }),
    makeDeps(store, mock),
    ID,
  );
  assert.equal(res.status, 403);
  assert.equal(mock.calls.length, 0);
});

test("URL signée : CSRF invalide → 403 sans appel API", async () => {
  const store = new InMemoryCookieStore();
  seedAuth(store, "A", "R");
  seedCsrf(store);
  const mock = createMockFetch({ body: apiEnvelope(SIGNED) });
  const res = await handleCreateDownloadUrl(makeRequest(`/api/files/${ID}/download-url`, { csrf: WRONG_CSRF }), makeDeps(store, mock), ID);
  assert.equal(res.status, 403);
  assert.equal(mock.calls.length, 0);
});

test("URL signée : 404/409/503 mappés distinctement", async () => {
  for (const [status, expected] of [
    [404, 404],
    [409, 409],
    [503, 503],
  ] as const) {
    const store = new InMemoryCookieStore();
    seedAuth(store, "A", "R");
    const csrf = seedCsrf(store);
    const res = await handleCreateDownloadUrl(
      makeRequest(`/api/files/${ID}/download-url`, { csrf }),
      makeDeps(store, createMockFetch(ERR(status))),
      ID,
    );
    assert.equal(res.status, expected, `status ${status}`);
  }
});

// ---------- suppression ----------

const delReq = (id = ID, opts: { csrf?: string; origin?: string } = {}): Request =>
  makeRequest(`/api/files/${id}`, { method: "DELETE", ...opts });

test("suppression : GET refusé (405) sans appel API", async () => {
  const mock = createMockFetch({ status: 204 });
  const res = await handleDeleteFile(makeRequest(`/api/files/${ID}`, { method: "GET" }), makeDeps(new InMemoryCookieStore(), mock), ID);
  assert.equal(res.status, 405);
  assert.equal(mock.calls.length, 0);
});

test("suppression : UUID invalide → 400 sans appel API", async () => {
  const store = new InMemoryCookieStore();
  const csrf = seedCsrf(store);
  const mock = createMockFetch({ status: 204 });
  const res = await handleDeleteFile(delReq(BAD_ID, { csrf }), makeDeps(store, mock), BAD_ID);
  assert.equal(res.status, 400);
  const body = (await res.json()) as { errorCode: string };
  assert.equal(body.errorCode, "INVALID_ID");
  assert.equal(mock.calls.length, 0);
});

test("suppression : Origin invalide → 403 sans appel API", async () => {
  const store = new InMemoryCookieStore();
  seedAuth(store, "A", "R");
  const csrf = seedCsrf(store);
  const mock = createMockFetch({ status: 204 });
  const res = await handleDeleteFile(delReq(ID, { csrf, origin: "https://evil.test" }), makeDeps(store, mock), ID);
  assert.equal(res.status, 403);
  assert.equal(mock.calls.length, 0);
});

test("suppression : CSRF invalide → 403 sans appel API", async () => {
  const store = new InMemoryCookieStore();
  seedAuth(store, "A", "R");
  seedCsrf(store);
  const mock = createMockFetch({ status: 204 });
  const res = await handleDeleteFile(delReq(ID, { csrf: WRONG_CSRF }), makeDeps(store, mock), ID);
  assert.equal(res.status, 403);
  assert.equal(mock.calls.length, 0);
});

test("suppression : CSRF absent → 403 sans appel API", async () => {
  const store = new InMemoryCookieStore();
  seedAuth(store, "A", "R");
  seedCsrf(store);
  const mock = createMockFetch({ status: 204 });
  const res = await handleDeleteFile(delReq(ID), makeDeps(store, mock), ID);
  assert.equal(res.status, 403);
  assert.equal(mock.calls.length, 0);
});

test("suppression : succès → 200 { success:true, data:null }, no-store, Authorization Bearer", async () => {
  const store = new InMemoryCookieStore();
  seedAuth(store, "ACCESS", "REFRESH");
  const csrf = seedCsrf(store);
  const mock = createMockFetch({ status: 204 });
  const res = await handleDeleteFile(delReq(ID, { csrf }), makeDeps(store, mock), ID);
  assert.equal(res.status, 200);
  assert.equal(res.headers.get("cache-control"), "no-store");
  const body = (await res.json()) as { success: boolean; data: null };
  assert.equal(body.success, true);
  assert.equal(body.data, null);
  assert.equal(mock.calls[0]?.headers["authorization"], "Bearer ACCESS");
});

test("suppression : requestId propagé navigateur → API → réponse", async () => {
  const store = new InMemoryCookieStore();
  seedAuth(store, "A", "R");
  const csrf = seedCsrf(store);
  const mock = createMockFetch({ status: 204 });
  const req = makeRequest(`/api/files/${ID}`, { method: "DELETE", csrf, requestId: "rid-del-1" });
  const res = await handleDeleteFile(req, makeDeps(store, mock), ID);
  assert.equal(res.headers.get("x-request-id"), "rid-del-1");
  assert.equal(mock.calls[0]?.headers["x-request-id"], "rid-del-1");
});

test("suppression : 409 → NOT_DELETABLE (jamais NOT_DOWNLOADABLE)", async () => {
  const store = new InMemoryCookieStore();
  seedAuth(store, "A", "R");
  const csrf = seedCsrf(store);
  const res = await handleDeleteFile(delReq(ID, { csrf }), makeDeps(store, createMockFetch(ERR(409))), ID);
  assert.equal(res.status, 409);
  const body = (await res.json()) as { errorCode: string };
  assert.equal(body.errorCode, "NOT_DELETABLE");
  assert.notEqual(body.errorCode, "NOT_DOWNLOADABLE");
});

test("suppression : 401/403/404/429/503 mappés distinctement", async () => {
  for (const status of [401, 403, 404, 429, 503] as const) {
    const store = new InMemoryCookieStore();
    seedAuth(store, "A", "R");
    const csrf = seedCsrf(store);
    const res = await handleDeleteFile(delReq(ID, { csrf }), makeDeps(store, createMockFetch(ERR(status))), ID);
    assert.equal(res.status, status, `status ${status}`);
  }
});
