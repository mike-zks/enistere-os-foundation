import assert from "node:assert/strict";
import { test } from "node:test";

import { handleListFiles } from "../src/features/files/handlers/list-files-handler.js";
import { InMemoryCookieStore } from "../src/features/auth/server-cookie-store.js";
import { createMockFetch, type MockResponseSpec } from "./helpers/api-test-kit.js";
import { apiEnvelope, makeDeps, makeRequest, seedAuth } from "./helpers/auth-test-kit.js";

const FILE = {
  id: "b3f1c2d4-5e6f-4a8b-9c0d-1e2f3a4b5c6d",
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

const LIST_RESPONSE = {
  items: [FILE],
  limit: 20,
  offset: 0,
  nextOffset: null,
};

const ERR = (status: number): MockResponseSpec => ({
  status,
  body: { success: false, statusCode: status, message: "x", errorCode: "E", path: "/files", timestamp: "t" },
});

function listReq(qs = ""): Request {
  return makeRequest(`/api/files${qs}`, { method: "GET" });
}

test("liste : succès → 200 + données paginées + no-store", async () => {
  const store = new InMemoryCookieStore();
  seedAuth(store, "ACCESS", "REFRESH");
  const mock = createMockFetch({ body: apiEnvelope(LIST_RESPONSE) });
  const res = await handleListFiles(listReq(), makeDeps(store, mock));
  assert.equal(res.status, 200);
  assert.equal(res.headers.get("cache-control"), "no-store");
  const body = (await res.json()) as { data: typeof LIST_RESPONSE };
  assert.equal(body.data.items.length, 1);
  assert.equal(body.data.limit, 20);
  assert.equal(body.data.offset, 0);
  assert.equal(body.data.nextOffset, null);
});

test("liste : paramètres par défaut (sans query) → appel API avec limit=20 offset=0", async () => {
  const store = new InMemoryCookieStore();
  seedAuth(store, "A", "R");
  const mock = createMockFetch({ body: apiEnvelope(LIST_RESPONSE) });
  await handleListFiles(listReq(), makeDeps(store, mock));
  assert.equal(mock.calls.length, 1);
  const url = mock.calls[0]?.url ?? "";
  assert.ok(url.includes("limit=20"), `URL attendue avec limit=20 : ${url}`);
  assert.ok(url.includes("offset=0"), `URL attendue avec offset=0 : ${url}`);
});

test("liste : limit et offset passés → transmis à l'API", async () => {
  const store = new InMemoryCookieStore();
  seedAuth(store, "A", "R");
  const mock = createMockFetch({ body: apiEnvelope({ ...LIST_RESPONSE, limit: 10, offset: 30 }) });
  const res = await handleListFiles(listReq("?limit=10&offset=30"), makeDeps(store, mock));
  assert.equal(res.status, 200);
  const url = mock.calls[0]?.url ?? "";
  assert.ok(url.includes("limit=10"), `limit=10 dans l'URL : ${url}`);
  assert.ok(url.includes("offset=30"), `offset=30 dans l'URL : ${url}`);
});

test("liste : limit invalide → 400 sans appel API", async () => {
  const mock = createMockFetch({ body: apiEnvelope(LIST_RESPONSE) });
  const deps = makeDeps(new InMemoryCookieStore(), mock);

  for (const bad of ["0", "51", "abc", "10.5", "-1"]) {
    const res = await handleListFiles(listReq(`?limit=${bad}`), deps);
    assert.equal(res.status, 400, `limit=${bad} devait être 400`);
    assert.equal(mock.calls.length, 0, `aucun appel API pour limit=${bad}`);
  }
});

test("liste : offset invalide → 400 sans appel API", async () => {
  const mock = createMockFetch({ body: apiEnvelope(LIST_RESPONSE) });
  const deps = makeDeps(new InMemoryCookieStore(), mock);

  for (const bad of ["-1", "abc", "0.5"]) {
    const res = await handleListFiles(listReq(`?offset=${bad}`), deps);
    assert.equal(res.status, 400, `offset=${bad} devait être 400`);
    assert.equal(mock.calls.length, 0, `aucun appel API pour offset=${bad}`);
  }
});

test("liste : erreurs API 401/403/429/503 mappées distinctement", async () => {
  for (const status of [401, 403, 429, 503]) {
    const store = new InMemoryCookieStore();
    seedAuth(store, "A", "R");
    const res = await handleListFiles(listReq(), makeDeps(store, createMockFetch(ERR(status))));
    assert.equal(res.status, status, `status ${status}`);
  }
});

test("liste : read-only → aucun appel /auth/refresh sur 401", async () => {
  const store = new InMemoryCookieStore();
  seedAuth(store, "EXPIRED", "REFRESH");
  const mock = createMockFetch(ERR(401));
  await handleListFiles(listReq(), makeDeps(store, mock));
  assert.ok(mock.calls.every((c) => !c.url.includes("/auth/refresh")), "aucun refresh en read-only");
});

test("liste : POST refusé → 405 sans appel API", async () => {
  const store = new InMemoryCookieStore();
  seedAuth(store, "A", "R");
  const mock = createMockFetch({ body: apiEnvelope(LIST_RESPONSE) });
  const res = await handleListFiles(makeRequest("/api/files", { method: "POST" }), makeDeps(store, mock));
  assert.equal(res.status, 405);
  assert.equal(mock.calls.length, 0);
});

test("liste : no-store sur réponse d'erreur", async () => {
  const store = new InMemoryCookieStore();
  seedAuth(store, "A", "R");
  const res = await handleListFiles(listReq(), makeDeps(store, createMockFetch(ERR(503))));
  assert.equal(res.headers.get("cache-control"), "no-store");
});

test("liste : aucun champ interne dans la réponse (storageKey/bucket/checksum/ownerId)", async () => {
  const store = new InMemoryCookieStore();
  seedAuth(store, "A", "R");
  const mock = createMockFetch({ body: apiEnvelope(LIST_RESPONSE) });
  const res = await handleListFiles(listReq(), makeDeps(store, mock));
  const dump = JSON.stringify(await res.json()).toLowerCase();
  for (const internal of ["storagekey", "bucket", "checksum", "ownerid"]) {
    assert.ok(!dump.includes(internal), `champ interne exposé: ${internal}`);
  }
});
