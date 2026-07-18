import "./helpers/dom-setup.js";

import assert from "node:assert/strict";
import { afterEach, test } from "node:test";

import type { QueryClient } from "@tanstack/react-query";
import { act, cleanup, renderHook, waitFor } from "@testing-library/react";

import { useDeleteFile } from "../src/features/files/use-delete-file.js";
import { createTestQueryClient, createWrapper } from "./helpers/api-test-kit.js";
import { createBrowserFetch } from "./helpers/browser-fetch.js";

const ID = "b3f1c2d4-5e6f-4a8b-9c0d-1e2f3a4b5c6d";
const ORIG = globalThis.fetch;
const open: QueryClient[] = [];

afterEach(() => {
  cleanup();
  for (const c of open) c.clear();
  open.length = 0;
  globalThis.fetch = ORIG;
});

function setup(deleteSpec?: (url: string) => { status?: number; body?: unknown }) {
  const client = createTestQueryClient();
  open.push(client);
  const spec = deleteSpec ?? (() => ({ body: { success: true, data: null } }));
  const mock = createBrowserFetch((url) =>
    url.includes("/api/auth/csrf") ? { body: { success: true, data: { csrfToken: "tok" } } } : spec(url),
  );
  globalThis.fetch = mock as unknown as typeof fetch;
  const { result } = renderHook(() => useDeleteFile(), { wrapper: createWrapper(client) });
  return { client, mock, result };
}

test("succès : CSRF → DELETE /api/files/:id ; isSuccess=true", async () => {
  const { mock, result } = setup();
  await act(async () => {
    result.current.requestDelete(ID);
    await waitFor(() => assert.ok(result.current.isSuccess));
  });
  assert.ok(mock.calls.some((c) => c.url.includes(`/api/files/${encodeURIComponent(ID)}`) && c.method === "DELETE"));
  assert.equal(result.current.error, undefined);
});

test("succès : fileKeys.detail(id) supprimé du QueryCache après delete", async () => {
  const { client, result } = setup();
  // Pré-remplir le cache pour simuler une query existante.
  client.setQueryData(["files", "detail", ID], { id: ID, originalName: "f.jpg" });
  assert.ok(client.getQueryCache().getAll().length > 0);

  await act(async () => {
    result.current.requestDelete(ID);
    await waitFor(() => assert.ok(result.current.isSuccess));
  });

  // La clé doit avoir été retirée du cache.
  const cached = client.getQueryData(["files", "detail", ID]);
  assert.equal(cached, undefined);
});

test("succès : fileKeys.list invalidé après suppression", async () => {
  const { client, result } = setup();
  // Pré-remplir la liste en cache.
  client.setQueryData(["files", "list", { limit: 20, offset: 0 }], { items: [{ id: ID }], limit: 20, offset: 0, nextOffset: null });

  await act(async () => {
    result.current.requestDelete(ID);
    await waitFor(() => assert.ok(result.current.isSuccess));
  });

  // La query list doit être marquée stale (invalidée) — son état n'est plus "fresh".
  const listQuery = client.getQueryCache().find({ queryKey: ["files", "list", { limit: 20, offset: 0 }] });
  assert.ok(listQuery === undefined || listQuery.state.isInvalidated, "query list doit être invalidée après delete");
});

test("double-clic empêché (un seul DELETE)", async () => {
  const { mock, result } = setup();
  await act(async () => {
    result.current.requestDelete(ID);
    result.current.requestDelete(ID);
    await waitFor(() => assert.ok(result.current.isSuccess));
  });
  assert.equal(
    mock.calls.filter((c) => c.url.includes("/api/files/") && c.method === "DELETE").length,
    1,
  );
});

test("409 → erreur NOT_DELETABLE exposée comme error.kind='error'", async () => {
  const { result } = setup(() => ({ status: 409, body: { success: false, errorCode: "NOT_DELETABLE" } }));
  await act(async () => {
    result.current.requestDelete(ID);
    await waitFor(() => assert.ok(result.current.error !== undefined));
  });
  assert.equal(result.current.error?.kind, "error");
  assert.equal(result.current.isSuccess, false);
});

test("404 → erreur notfound exposée", async () => {
  const { result } = setup(() => ({ status: 404, body: { success: false, errorCode: "NOT_FOUND" } }));
  await act(async () => {
    result.current.requestDelete(ID);
    await waitFor(() => assert.ok(result.current.error !== undefined));
  });
  assert.equal(result.current.error?.kind, "notfound");
});

test("401 → erreur unauthorized exposée", async () => {
  const { result } = setup(() => ({ status: 401, body: { success: false, errorCode: "UNAUTHENTICATED" } }));
  await act(async () => {
    result.current.requestDelete(ID);
    await waitFor(() => assert.ok(result.current.error !== undefined));
  });
  assert.equal(result.current.error?.kind, "unauthorized");
});

test("reset : efface erreur", async () => {
  const { result } = setup(() => ({ status: 409, body: { success: false, errorCode: "NOT_DELETABLE" } }));
  await act(async () => {
    result.current.requestDelete(ID);
    await waitFor(() => assert.ok(result.current.error !== undefined));
  });
  await act(async () => {
    result.current.reset();
    await waitFor(() => assert.equal(result.current.error, undefined));
  });
  assert.equal(result.current.isSuccess, false);
});

test("isPending false après succès", async () => {
  const { result } = setup();
  await act(async () => {
    result.current.requestDelete(ID);
    await waitFor(() => assert.ok(result.current.isSuccess));
  });
  assert.equal(result.current.isPending, false);
});
