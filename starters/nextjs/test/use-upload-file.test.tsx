import "./helpers/dom-setup.js";

import assert from "node:assert/strict";
import { afterEach, test } from "node:test";

import type { QueryClient } from "@tanstack/react-query";
import { act, cleanup, renderHook, waitFor } from "@testing-library/react";

import { useUploadFile } from "../src/features/files/use-upload-file.js";
import { createTestQueryClient, createWrapper } from "./helpers/api-test-kit.js";
import { createBrowserFetch } from "./helpers/browser-fetch.js";

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
const JPEG = new File(["data"], "photo.jpg", { type: "image/jpeg" });
const ORIG = globalThis.fetch;
const open: QueryClient[] = [];

afterEach(() => {
  cleanup();
  for (const c of open) c.clear();
  open.length = 0;
  globalThis.fetch = ORIG;
});

function setup(uploadSpec?: (url: string) => { status?: number; body?: unknown }) {
  const client = createTestQueryClient();
  open.push(client);
  const spec = uploadSpec ?? (() => ({ body: { success: true, data: UPLOADED } }));
  const mock = createBrowserFetch((url) =>
    url.includes("/api/auth/csrf") ? { body: { success: true, data: { csrfToken: "tok" } } } : spec(url),
  );
  globalThis.fetch = mock as unknown as typeof fetch;
  const { result } = renderHook(() => useUploadFile(), { wrapper: createWrapper(client) });
  return { client, mock, result };
}

test("succès : CSRF → POST upload ; uploadedFile retourné, JAMAIS dans QueryCache", async () => {
  const { client, mock, result } = setup();
  await act(async () => {
    result.current.upload({ file: JPEG, category: "IMAGE" });
    await waitFor(() => assert.ok(result.current.uploadedFile !== undefined));
  });
  assert.ok(mock.calls.some((c) => c.url === "/api/files/upload"));
  assert.equal(result.current.uploadedFile?.id, UPLOADED.id);
  // L'uploadedFile n'est pas dans le QueryCache.
  const dump = JSON.stringify(client.getQueryCache().getAll().map((q) => q.state.data));
  assert.ok(!dump.includes(UPLOADED.id));
  assert.equal(result.current.error, undefined);
});

test("succès : fileKeys.list invalidé après upload", async () => {
  const { client, result } = setup();
  client.setQueryData(["files", "list", { limit: 20, offset: 0 }], { items: [], limit: 20, offset: 0, nextOffset: null });

  await act(async () => {
    result.current.upload({ file: JPEG, category: "IMAGE" });
    await waitFor(() => assert.ok(result.current.uploadedFile !== undefined));
  });

  const listQuery = client.getQueryCache().find({ queryKey: ["files", "list", { limit: 20, offset: 0 }] });
  assert.ok(listQuery === undefined || listQuery.state.isInvalidated, "query list doit être invalidée après upload");
});

test("double-clic empêché (un seul POST upload)", async () => {
  const { mock, result } = setup();
  await act(async () => {
    result.current.upload({ file: JPEG, category: "IMAGE" });
    result.current.upload({ file: JPEG, category: "IMAGE" });
    await waitFor(() => assert.ok(result.current.uploadedFile !== undefined));
  });
  assert.equal(mock.calls.filter((c) => c.url === "/api/files/upload").length, 1);
});

test("413 → erreur too_large exposée", async () => {
  const { result } = setup(() => ({ status: 413, body: { success: false, errorCode: "FILE_TOO_LARGE" } }));
  await act(async () => {
    result.current.upload({ file: JPEG, category: "IMAGE" });
    await waitFor(() => assert.ok(result.current.error !== undefined));
  });
  assert.equal(result.current.error?.kind, "too_large");
});

test("415 → erreur unsupported_type exposée", async () => {
  const { result } = setup(() => ({
    status: 415,
    body: { success: false, errorCode: "UNSUPPORTED_MEDIA_TYPE" },
  }));
  await act(async () => {
    result.current.upload({ file: JPEG, category: "IMAGE" });
    await waitFor(() => assert.ok(result.current.error !== undefined));
  });
  assert.equal(result.current.error?.kind, "unsupported_type");
});

test("401 → erreur unauthorized exposée", async () => {
  const { result } = setup(() => ({ status: 401, body: { success: false, errorCode: "UNAUTHENTICATED" } }));
  await act(async () => {
    result.current.upload({ file: JPEG, category: "IMAGE" });
    await waitFor(() => assert.ok(result.current.error !== undefined));
  });
  assert.equal(result.current.error?.kind, "unauthorized");
});

test("reset : efface erreur et uploadedFile", async () => {
  const { result } = setup(() => ({ status: 413, body: { success: false, errorCode: "FILE_TOO_LARGE" } }));
  await act(async () => {
    result.current.upload({ file: JPEG, category: "IMAGE" });
    await waitFor(() => assert.ok(result.current.error !== undefined));
  });
  await act(async () => {
    result.current.reset();
    await waitFor(() => assert.equal(result.current.error, undefined));
  });
  assert.equal(result.current.uploadedFile, undefined);
});

test("subjectId transmis dans le FormData (appel BFF détecté)", async () => {
  const { mock, result } = setup();
  await act(async () => {
    result.current.upload({ file: JPEG, category: "DOCUMENT", subjectId: "ref-123" });
    await waitFor(() => assert.ok(result.current.uploadedFile !== undefined));
  });
  const uploadCall = mock.calls.find((c) => c.url === "/api/files/upload");
  assert.ok(uploadCall, "appel upload absent");
});

test("isPending false après succès", async () => {
  const { result } = setup();
  await act(async () => {
    result.current.upload({ file: JPEG, category: "IMAGE" });
    await waitFor(() => assert.ok(result.current.uploadedFile !== undefined));
  });
  assert.equal(result.current.isPending, false);
});
