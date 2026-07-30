import assert from "node:assert/strict";
import { afterEach, test } from "node:test";

import { BffAuthError } from "../src/features/auth/client/bff-error.js";
import { listFiles } from "../src/features/files/client/files-bff-client.js";
import { createBrowserFetch } from "./helpers/browser-fetch.js";

const FILE = {
  id: "b3f1c2d4-5e6f-4a8b-9c0d-1e2f3a4b5c6d",
  originalName: "p.jpg",
  mimeType: "image/jpeg",
  extension: "jpg",
  size: "10",
  category: "IMAGE",
  status: "VALIDATED",
  visibility: "PRIVATE",
  createdAt: "t",
  updatedAt: "t",
};

const LIST_RESPONSE = { items: [FILE], limit: 20, offset: 0, nextOffset: null };
const ORIG = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = ORIG;
});

test("listFiles : GET same-origin /api/files, credentials include, aucun Authorization", async () => {
  const mock = createBrowserFetch({ body: { success: true, data: LIST_RESPONSE } });
  globalThis.fetch = mock as unknown as typeof fetch;
  const result = await listFiles();
  assert.equal(result.items.length, 1);
  const call = mock.calls[0];
  assert.ok(call?.url.startsWith("/api/files"), `URL same-origin : ${call?.url}`);
  assert.equal(call?.method, "GET");
  assert.equal(call?.credentials, "include");
  assert.equal(call?.headers["authorization"], undefined);
});

test("listFiles : sans paramètres → URL /api/files sans querystring", async () => {
  const mock = createBrowserFetch({ body: { success: true, data: LIST_RESPONSE } });
  globalThis.fetch = mock as unknown as typeof fetch;
  await listFiles();
  assert.equal(mock.calls[0]?.url, "/api/files");
});

test("listFiles : avec limit et offset → querystring correct", async () => {
  const mock = createBrowserFetch({ body: { success: true, data: LIST_RESPONSE } });
  globalThis.fetch = mock as unknown as typeof fetch;
  await listFiles({ limit: 10, offset: 30 });
  const url = mock.calls[0]?.url ?? "";
  assert.ok(url.includes("limit=10"), `limit=10 dans l'URL : ${url}`);
  assert.ok(url.includes("offset=30"), `offset=30 dans l'URL : ${url}`);
});

test("listFiles : avec limit seulement → seulement limit dans querystring", async () => {
  const mock = createBrowserFetch({ body: { success: true, data: LIST_RESPONSE } });
  globalThis.fetch = mock as unknown as typeof fetch;
  await listFiles({ limit: 5 });
  const url = mock.calls[0]?.url ?? "";
  assert.ok(url.includes("limit=5"), `limit=5 dans l'URL : ${url}`);
  assert.ok(!url.includes("offset="), `pas d'offset si non fourni : ${url}`);
});

test("listFiles : 401/403/503 → BffAuthError avec status", async () => {
  for (const status of [401, 403, 503]) {
    const mock = createBrowserFetch({ status, requestId: "rid-list", body: { success: false, errorCode: "E" } });
    globalThis.fetch = mock as unknown as typeof fetch;
    await assert.rejects(
      () => listFiles(),
      (e) => e instanceof BffAuthError && e.status === status,
      `status ${status}`,
    );
  }
});

test("listFiles : réseau → BffAuthError kind=network", async () => {
  globalThis.fetch = createBrowserFetch({ throwError: new TypeError("down") }) as unknown as typeof fetch;
  await assert.rejects(() => listFiles(), (e) => e instanceof BffAuthError && e.kind === "network");
});

test("listFiles : réponse JSON invalide → BffAuthError kind=invalid_response", async () => {
  globalThis.fetch = createBrowserFetch({ status: 200, rawBody: "<<bad>>" }) as unknown as typeof fetch;
  await assert.rejects(() => listFiles(), (e) => e instanceof BffAuthError && e.kind === "invalid_response");
});

test("listFiles : jamais l'API directe (toujours /api/files)", async () => {
  const mock = createBrowserFetch({ body: { success: true, data: LIST_RESPONSE } });
  globalThis.fetch = mock as unknown as typeof fetch;
  await listFiles({ limit: 10, offset: 5 });
  assert.ok(mock.calls.every((c) => c.url.startsWith("/api/files")));
});
