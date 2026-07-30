import "./helpers/dom-setup.js";

import assert from "node:assert/strict";
import { afterEach, test } from "node:test";

import type { QueryClient } from "@tanstack/react-query";
import { cleanup, renderHook, waitFor } from "@testing-library/react";

import { fileKeys } from "../src/features/files/file-keys.js";
import { authKeys } from "../src/features/auth/auth-keys.js";
import { useFileList } from "../src/features/files/use-file-list.js";
import { createTestQueryClient, createWrapper } from "./helpers/api-test-kit.js";
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
const open: QueryClient[] = [];

afterEach(() => {
  cleanup();
  for (const c of open) c.clear();
  open.length = 0;
  globalThis.fetch = ORIG;
});

function render(params?: { limit?: number; offset?: number }) {
  const client = createTestQueryClient();
  open.push(client);
  return { client, ...renderHook(() => useFileList(params), { wrapper: createWrapper(client) }) };
}

test("clés stables : fileKeys.list contient limit+offset, disjoint de authKeys", () => {
  const key = fileKeys.list({ limit: 20, offset: 0 });
  assert.deepEqual(key, ["files", "list", { limit: 20, offset: 0 }]);
  assert.notEqual(key[0], authKeys.all[0]);
});

test("clé sans secret : aucun token/email/url-signée dans la clé", () => {
  const key = JSON.stringify(fileKeys.list({ limit: 20, offset: 0 })).toLowerCase();
  for (const banned of ["token", "bearer", "authorization", "x-amz", "signed"]) {
    assert.ok(!key.includes(banned), `clé contient "${banned}"`);
  }
});

test("clés distinctes pour des paramètres différents", () => {
  const k1 = JSON.stringify(fileKeys.list({ limit: 20, offset: 0 }));
  const k2 = JSON.stringify(fileKeys.list({ limit: 10, offset: 20 }));
  assert.notEqual(k1, k2);
});

test("succès → données en cache", async () => {
  globalThis.fetch = createBrowserFetch({ body: { success: true, data: LIST_RESPONSE } }) as unknown as typeof fetch;
  const { result } = render({ limit: 20, offset: 0 });
  await waitFor(() => assert.ok(result.current.isSuccess));
  assert.equal(result.current.data?.items.length, 1);
  assert.equal(result.current.data?.nextOffset, null);
});

test("503 → isError sans retry (1 seul appel)", async () => {
  const mock = createBrowserFetch({ status: 503, body: { success: false, errorCode: "STORAGE_UNAVAILABLE" } });
  globalThis.fetch = mock as unknown as typeof fetch;
  const { result } = render();
  await waitFor(() => assert.ok(result.current.isError));
  assert.equal(mock.calls.length, 1, "retry:false → un seul appel");
});

test("401 → isError immédiat", async () => {
  globalThis.fetch = createBrowserFetch({ status: 401, body: { success: false, errorCode: "UNAUTHENTICATED" } }) as unknown as typeof fetch;
  const { result } = render();
  await waitFor(() => assert.ok(result.current.isError));
  assert.equal((result.current.error as { status?: number })?.status, 401);
});
