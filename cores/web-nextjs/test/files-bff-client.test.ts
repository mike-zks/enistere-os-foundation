import assert from "node:assert/strict";
import { afterEach, test } from "node:test";

import { BffAuthError } from "../src/core/auth/client/bff-error.js";
import { createFileDownloadUrl, getFileMetadata } from "../src/core/files/client/files-bff-client.js";
import { createBrowserFetch, type BrowserResponseSpec } from "./helpers/browser-fetch.js";

const ID = "b3f1c2d4-5e6f-4a8b-9c0d-1e2f3a4b5c6d";
const FILE = { id: ID, originalName: "p.jpg", mimeType: "image/jpeg", extension: "jpg", size: "10", category: "IMAGE", status: "VALIDATED", visibility: "PRIVATE", createdAt: "t", updatedAt: "t" };
const ORIG = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = ORIG;
});

test("getFileMetadata : same-origin GET, credentials include, aucun Authorization, données publiques", async () => {
  const mock = createBrowserFetch({ body: { success: true, data: FILE } });
  globalThis.fetch = mock as unknown as typeof fetch;
  const file = await getFileMetadata(ID);
  assert.equal(file.id, ID);
  const call = mock.calls[0];
  assert.equal(call?.url, `/api/files/${ID}`);
  assert.equal(call?.method, "GET");
  assert.equal(call?.credentials, "include");
  assert.equal(call?.headers["authorization"], undefined);
});

test("getFileMetadata : 404/403/503 → BffAuthError ; requestId conservé", async () => {
  for (const status of [404, 403, 503]) {
    const mock = createBrowserFetch({ status, requestId: "rid-9", body: { success: false, errorCode: "E" } });
    globalThis.fetch = mock as unknown as typeof fetch;
    await assert.rejects(
      () => getFileMetadata(ID),
      (e) => e instanceof BffAuthError && e.status === status && e.requestId === "rid-9",
      `status ${status}`,
    );
  }
});

test("getFileMetadata : réseau → network ; JSON invalide → invalid_response", async () => {
  globalThis.fetch = createBrowserFetch({ throwError: new TypeError("down") }) as unknown as typeof fetch;
  await assert.rejects(() => getFileMetadata(ID), (e) => e instanceof BffAuthError && e.kind === "network");
  globalThis.fetch = createBrowserFetch({ status: 200, rawBody: "<<nope>>" }) as unknown as typeof fetch;
  await assert.rejects(() => getFileMetadata(ID), (e) => e instanceof BffAuthError && e.kind === "invalid_response");
});

test("createFileDownloadUrl : POST same-origin, X-CSRF-Token, credentials include, retourne {url,expiresAt}", async () => {
  const signed = { url: "https://storage.test/obj?X-Amz-Signature=ABC", expiresAt: "t" };
  const mock = createBrowserFetch({ body: { success: true, data: signed } });
  globalThis.fetch = mock as unknown as typeof fetch;
  const out = await createFileDownloadUrl(ID, "csrf-token-123");
  assert.equal(out.url, signed.url);
  const call = mock.calls[0];
  assert.equal(call?.url, `/api/files/${ID}/download-url`);
  assert.equal(call?.method, "POST");
  assert.equal(call?.credentials, "include");
  assert.equal(call?.headers["x-csrf-token"], "csrf-token-123");
  assert.equal(call?.headers["authorization"], undefined);
});

test("createFileDownloadUrl : 409 → BffAuthError ; aucune URL signée dans l'erreur", async () => {
  const mock = createBrowserFetch({ status: 409, requestId: "rid", body: { success: false, errorCode: "NOT_DOWNLOADABLE" } });
  globalThis.fetch = mock as unknown as typeof fetch;
  await createFileDownloadUrl(ID, "csrf").then(
    () => assert.fail("devait rejeter"),
    (e: unknown) => {
      assert.ok(e instanceof BffAuthError && e.status === 409);
      assert.ok(!JSON.stringify(e).toLowerCase().includes("x-amz-signature"));
      assert.ok(!((e as BffAuthError).message ?? "").toLowerCase().includes("signature"));
    },
  );
});

test("tous les appels sont same-origin /api/files/* (jamais l'API directe)", async () => {
  const route = (url: string): BrowserResponseSpec =>
    url.includes("/download-url") ? { body: { success: true, data: { url: "https://s/x", expiresAt: "t" } } } : { body: { success: true, data: FILE } };
  const mock = createBrowserFetch(route);
  globalThis.fetch = mock as unknown as typeof fetch;
  await getFileMetadata(ID);
  await createFileDownloadUrl(ID, "csrf");
  assert.ok(mock.calls.every((c) => c.url.startsWith("/api/files/")));
});
