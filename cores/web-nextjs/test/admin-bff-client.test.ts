import assert from "node:assert/strict";
import { afterEach, test } from "node:test";

import { BffAuthError } from "../src/core/auth/client/bff-error.js";
import { quarantineFile, restoreFile } from "../src/core/files/client/files-bff-client.js";
import { createBrowserFetch } from "./helpers/browser-fetch.js";

const CSRF = "csrf-token-admin-test-456";
const ID = "b3f1c2d4-5e6f-4a8b-9c0d-1e2f3a4b5c6d";
const OK = { body: { success: true, data: null } };
const ORIG = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = ORIG;
});

// ═══════════════════ quarantineFile ═══════════════════

test("quarantineFile : POST /api/files/:id/quarantine, same-origin, credentials include, X-CSRF-Token, sans Authorization", async () => {
  const mock = createBrowserFetch(OK);
  globalThis.fetch = mock as unknown as typeof fetch;

  await quarantineFile(ID, CSRF);

  const call = mock.calls[0];
  assert.equal(call?.url, `/api/files/${encodeURIComponent(ID)}/quarantine`);
  assert.equal(call?.method, "POST");
  assert.equal(call?.credentials, "include");
  assert.equal(call?.headers["x-csrf-token"], CSRF);
  assert.equal(call?.headers["authorization"], undefined);
});

test("quarantineFile : UUID encodé dans l'URL (encodeURIComponent)", async () => {
  const mock = createBrowserFetch(OK);
  globalThis.fetch = mock as unknown as typeof fetch;

  await quarantineFile(ID, CSRF);

  assert.ok(mock.calls[0]?.url.includes(encodeURIComponent(ID)));
  assert.ok(mock.calls[0]?.url.endsWith("/quarantine"));
});

test("quarantineFile : URL toujours same-origin /api/files/:id/quarantine (jamais API directe)", async () => {
  const mock = createBrowserFetch(OK);
  globalThis.fetch = mock as unknown as typeof fetch;

  await quarantineFile(ID, CSRF);

  assert.ok(mock.calls.every((c) => c.url.startsWith("/api/files/")));
  assert.ok(!mock.calls.some((c) => c.url.includes("http")));
});

test("quarantineFile : 403/404/409 → BffAuthError avec le bon status", async () => {
  for (const status of [403, 404, 409]) {
    const mock = createBrowserFetch({ status, requestId: "rid", body: { success: false, errorCode: "E" } });
    globalThis.fetch = mock as unknown as typeof fetch;

    await assert.rejects(
      () => quarantineFile(ID, CSRF),
      (e) => e instanceof BffAuthError && e.status === status,
      `status ${status}`,
    );
  }
});

test("quarantineFile : réseau → BffAuthError network", async () => {
  globalThis.fetch = createBrowserFetch({ throwError: new TypeError("down") }) as unknown as typeof fetch;

  await assert.rejects(() => quarantineFile(ID, CSRF), (e) => e instanceof BffAuthError && e.kind === "network");
});

// ═══════════════════ restoreFile ═══════════════════

test("restoreFile : POST /api/files/:id/restore, same-origin, credentials include, X-CSRF-Token, sans Authorization", async () => {
  const mock = createBrowserFetch(OK);
  globalThis.fetch = mock as unknown as typeof fetch;

  await restoreFile(ID, CSRF);

  const call = mock.calls[0];
  assert.equal(call?.url, `/api/files/${encodeURIComponent(ID)}/restore`);
  assert.equal(call?.method, "POST");
  assert.equal(call?.credentials, "include");
  assert.equal(call?.headers["x-csrf-token"], CSRF);
  assert.equal(call?.headers["authorization"], undefined);
});

test("restoreFile : UUID encodé dans l'URL (encodeURIComponent)", async () => {
  const mock = createBrowserFetch(OK);
  globalThis.fetch = mock as unknown as typeof fetch;

  await restoreFile(ID, CSRF);

  assert.ok(mock.calls[0]?.url.includes(encodeURIComponent(ID)));
  assert.ok(mock.calls[0]?.url.endsWith("/restore"));
});

test("restoreFile : URL toujours same-origin /api/files/:id/restore (jamais API directe)", async () => {
  const mock = createBrowserFetch(OK);
  globalThis.fetch = mock as unknown as typeof fetch;

  await restoreFile(ID, CSRF);

  assert.ok(mock.calls.every((c) => c.url.startsWith("/api/files/")));
  assert.ok(!mock.calls.some((c) => c.url.includes("http")));
});

test("restoreFile : 403/404/409 → BffAuthError avec le bon status", async () => {
  for (const status of [403, 404, 409]) {
    const mock = createBrowserFetch({ status, requestId: "rid", body: { success: false, errorCode: "E" } });
    globalThis.fetch = mock as unknown as typeof fetch;

    await assert.rejects(
      () => restoreFile(ID, CSRF),
      (e) => e instanceof BffAuthError && e.status === status,
      `status ${status}`,
    );
  }
});

test("restoreFile : réseau → BffAuthError network", async () => {
  globalThis.fetch = createBrowserFetch({ throwError: new TypeError("down") }) as unknown as typeof fetch;

  await assert.rejects(() => restoreFile(ID, CSRF), (e) => e instanceof BffAuthError && e.kind === "network");
});
