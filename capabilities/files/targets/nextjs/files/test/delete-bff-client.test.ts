import assert from "node:assert/strict";
import { afterEach, test } from "node:test";

import { BffAuthError } from "../src/features/auth/client/bff-error.js";
import { deleteFile } from "../src/features/files/client/files-bff-client.js";
import { createBrowserFetch } from "./helpers/browser-fetch.js";

const CSRF = "csrf-token-delete-test-123";
const ID = "b3f1c2d4-5e6f-4a8b-9c0d-1e2f3a4b5c6d";
const ORIG = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = ORIG;
});

test("deleteFile : DELETE /api/files/:id, same-origin, credentials include, X-CSRF-Token, sans Authorization", async () => {
  const mock = createBrowserFetch({ body: { success: true, data: null } });
  globalThis.fetch = mock as unknown as typeof fetch;

  await deleteFile(ID, CSRF);

  const call = mock.calls[0];
  assert.equal(call?.url, `/api/files/${encodeURIComponent(ID)}`);
  assert.equal(call?.method, "DELETE");
  assert.equal(call?.credentials, "include");
  assert.equal(call?.headers["x-csrf-token"], CSRF);
  assert.equal(call?.headers["authorization"], undefined);
});

test("deleteFile : UUID encodé dans l'URL (encodeURIComponent)", async () => {
  const mock = createBrowserFetch({ body: { success: true, data: null } });
  globalThis.fetch = mock as unknown as typeof fetch;

  await deleteFile(ID, CSRF);

  assert.ok(mock.calls[0]?.url.includes(encodeURIComponent(ID)));
});

test("deleteFile : URL toujours same-origin /api/files/:id (jamais API directe)", async () => {
  const mock = createBrowserFetch({ body: { success: true, data: null } });
  globalThis.fetch = mock as unknown as typeof fetch;

  await deleteFile(ID, CSRF);

  assert.ok(mock.calls.every((c) => c.url.startsWith("/api/files/")));
  assert.ok(!mock.calls.some((c) => c.url.includes("http")));
});

test("deleteFile : 404/403/409 → BffAuthError avec le bon status", async () => {
  for (const status of [403, 404, 409]) {
    const mock = createBrowserFetch({ status, requestId: "rid", body: { success: false, errorCode: "E" } });
    globalThis.fetch = mock as unknown as typeof fetch;

    await assert.rejects(
      () => deleteFile(ID, CSRF),
      (e) => e instanceof BffAuthError && e.status === status,
      `status ${status}`,
    );
  }
});

test("deleteFile : réseau → BffAuthError network", async () => {
  globalThis.fetch = createBrowserFetch({ throwError: new TypeError("down") }) as unknown as typeof fetch;

  await assert.rejects(() => deleteFile(ID, CSRF), (e) => e instanceof BffAuthError && e.kind === "network");
});
