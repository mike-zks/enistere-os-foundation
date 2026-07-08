import assert from "node:assert/strict";
import { afterEach, test } from "node:test";

import { BffAuthError } from "../src/core/auth/client/bff-error.js";
import { uploadFile } from "../src/core/files/client/files-bff-client.js";
import { createBrowserFetch } from "./helpers/browser-fetch.js";

const CSRF = "csrf-token-test-123";
const UPLOADED = {
  id: "b3f1c2d4-5e6f-4a8b-9c0d-1e2f3a4b5c6d",
  originalName: "photo.jpg",
  mimeType: "image/jpeg",
  extension: "jpg",
  size: "4",
  category: "IMAGE",
  status: "PENDING",
  visibility: "PRIVATE",
  createdAt: "t",
  updatedAt: "t",
};
const ORIG = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = ORIG;
});

test("uploadFile : POST /api/files/upload, same-origin, credentials include, X-CSRF-Token, FormData", async () => {
  const form = new FormData();
  form.append("file", new Blob(["data"], { type: "image/jpeg" }), "photo.jpg");
  form.append("category", "IMAGE");

  const mock = createBrowserFetch({ body: { success: true, data: UPLOADED } });
  globalThis.fetch = mock as unknown as typeof fetch;

  const result = await uploadFile(form, CSRF);
  assert.equal(result.id, UPLOADED.id);

  const call = mock.calls[0];
  assert.equal(call?.url, "/api/files/upload");
  assert.equal(call?.method, "POST");
  assert.equal(call?.credentials, "include");
  assert.equal(call?.headers["x-csrf-token"], CSRF);
  assert.equal(call?.headers["authorization"], undefined);
});

test("uploadFile : jamais de Content-Type forcé (boundary posé par le runtime)", async () => {
  const form = new FormData();
  form.append("file", new Blob(["x"], { type: "image/png" }), "img.png");
  form.append("category", "IMAGE");

  const mock = createBrowserFetch({ body: { success: true, data: UPLOADED } });
  globalThis.fetch = mock as unknown as typeof fetch;

  await uploadFile(form, CSRF);
  // Le Content-Type doit être absent des headers qu'on pose manuellement (le runtime le pose lui-même).
  assert.equal(mock.calls[0]?.headers["content-type"], undefined);
});

test("uploadFile : URL toujours same-origin /api/files/upload (jamais API directe)", async () => {
  const form = new FormData();
  form.append("file", new Blob(["x"]), "f");
  form.append("category", "DOCUMENT");

  const mock = createBrowserFetch({ body: { success: true, data: UPLOADED } });
  globalThis.fetch = mock as unknown as typeof fetch;

  await uploadFile(form, CSRF);
  assert.ok(mock.calls.every((c) => c.url === "/api/files/upload"));
});

test("uploadFile : 413/415 → BffAuthError avec le bon status", async () => {
  for (const status of [413, 415]) {
    const form = new FormData();
    form.append("file", new Blob(["x"]), "f");
    form.append("category", "IMAGE");

    const mock = createBrowserFetch({ status, requestId: "rid", body: { success: false, errorCode: "E" } });
    globalThis.fetch = mock as unknown as typeof fetch;

    await assert.rejects(
      () => uploadFile(form, CSRF),
      (e) => e instanceof BffAuthError && e.status === status,
      `status ${status}`,
    );
  }
});

test("uploadFile : réseau → BffAuthError network", async () => {
  const form = new FormData();
  form.append("file", new Blob(["x"]), "f");
  form.append("category", "IMAGE");

  globalThis.fetch = createBrowserFetch({ throwError: new TypeError("down") }) as unknown as typeof fetch;
  await assert.rejects(() => uploadFile(form, CSRF), (e) => e instanceof BffAuthError && e.kind === "network");
});
