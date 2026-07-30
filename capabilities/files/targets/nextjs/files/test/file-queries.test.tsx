import "./helpers/dom-setup.js";

import assert from "node:assert/strict";
import { afterEach, test } from "node:test";

import type { QueryClient } from "@tanstack/react-query";
import { cleanup, renderHook, waitFor } from "@testing-library/react";

import { authKeys } from "../src/features/auth/auth-keys.js";
import { fileKeys } from "../src/features/files/file-keys.js";
import { healthKeys } from "../src/core/query/keys/health-keys.js";
import { useFileMetadata } from "../src/features/files/file-queries.js";
import { createTestQueryClient, createWrapper } from "./helpers/api-test-kit.js";
import { createBrowserFetch } from "./helpers/browser-fetch.js";

const ID = "b3f1c2d4-5e6f-4a8b-9c0d-1e2f3a4b5c6d";
const FILE = { id: ID, originalName: "p.jpg", mimeType: "image/jpeg", extension: "jpg", size: "10", category: "IMAGE", status: "VALIDATED", visibility: "PRIVATE", createdAt: "t", updatedAt: "t" };
const ORIG = globalThis.fetch;
const open: QueryClient[] = [];
afterEach(() => {
  cleanup();
  for (const c of open) c.clear();
  open.length = 0;
  globalThis.fetch = ORIG;
});

function render(fileId: string) {
  const client = createTestQueryClient();
  open.push(client);
  return { client, ...renderHook(() => useFileMetadata(fileId), { wrapper: createWrapper(client) }) };
}

test("clés disjointes : files vs auth vs health", () => {
  assert.deepEqual(fileKeys.detail(ID), ["files", "detail", ID]);
  assert.notEqual(fileKeys.all[0], authKeys.all[0]);
  assert.notEqual(fileKeys.all[0], healthKeys.all[0]);
  assert.ok(!JSON.stringify(fileKeys.detail(ID)).toLowerCase().includes("token"));
});

test("succès → métadonnées publiques en cache", async () => {
  globalThis.fetch = createBrowserFetch({ body: { success: true, data: FILE } }) as unknown as typeof fetch;
  const { result } = render(ID);
  await waitFor(() => assert.ok(result.current.isSuccess));
  assert.equal(result.current.data?.id, ID);
});

test("UUID invalide → query désactivée (aucune requête)", async () => {
  const mock = createBrowserFetch({ body: { success: true, data: FILE } });
  globalThis.fetch = mock as unknown as typeof fetch;
  const { result } = render("not-a-uuid");
  await new Promise((r) => setTimeout(r, 20));
  assert.equal(mock.calls.length, 0, "aucune requête pour un id invalide");
  assert.equal(result.current.fetchStatus, "idle");
});

test("404 → isError (retry false, immédiat)", async () => {
  globalThis.fetch = createBrowserFetch({ status: 404, body: { success: false, errorCode: "NOT_FOUND" } }) as unknown as typeof fetch;
  const { result } = render(ID);
  await waitFor(() => assert.ok(result.current.isError));
  assert.equal((result.current.error as { status?: number })?.status, 404);
});

test("503 → isError sans boucle de retry", async () => {
  const mock = createBrowserFetch({ status: 503, body: { success: false, errorCode: "STORAGE_UNAVAILABLE" } });
  globalThis.fetch = mock as unknown as typeof fetch;
  const { result } = render(ID);
  await waitFor(() => assert.ok(result.current.isError));
  assert.equal(mock.calls.length, 1, "retry:false → un seul appel");
});
