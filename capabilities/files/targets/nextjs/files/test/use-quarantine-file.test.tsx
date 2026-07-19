import "./helpers/dom-setup.js";

import assert from "node:assert/strict";
import { afterEach, test } from "node:test";

import type { QueryClient } from "@tanstack/react-query";
import { act, cleanup, renderHook, waitFor } from "@testing-library/react";

import { useQuarantineFile } from "../src/features/files/use-quarantine-file.js";
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

function setup(quarantineSpec?: (url: string) => { status?: number; body?: unknown }) {
  const client = createTestQueryClient();
  open.push(client);
  const spec = quarantineSpec ?? (() => ({ body: { success: true, data: null } }));
  const mock = createBrowserFetch((url) =>
    url.includes("/api/auth/csrf") ? { body: { success: true, data: { csrfToken: "tok" } } } : spec(url),
  );
  globalThis.fetch = mock as unknown as typeof fetch;
  const { result } = renderHook(() => useQuarantineFile(), { wrapper: createWrapper(client) });
  return { client, mock, result };
}

test("succès : CSRF → POST /api/files/:id/quarantine ; isSuccess=true", async () => {
  const { mock, result } = setup();
  await act(async () => {
    result.current.requestQuarantine(ID);
    await waitFor(() => assert.ok(result.current.isSuccess));
  });
  assert.ok(mock.calls.some((c) => c.url.includes(`/api/files/${encodeURIComponent(ID)}/quarantine`) && c.method === "POST"));
  assert.equal(result.current.error, undefined);
});

test("succès : fileKeys.all invalidé après quarantaine", async () => {
  const { client, result } = setup();
  client.setQueryData(["files", "detail", ID], { id: ID, status: "VALIDATED" });

  await act(async () => {
    result.current.requestQuarantine(ID);
    await waitFor(() => assert.ok(result.current.isSuccess));
  });

  const query = client.getQueryCache().find({ queryKey: ["files", "detail", ID] });
  assert.ok(query === undefined || query.state.isInvalidated, "query detail doit être invalidée après quarantaine");
});

test("double-clic empêché (un seul POST quarantine)", async () => {
  const { mock, result } = setup();
  await act(async () => {
    result.current.requestQuarantine(ID);
    result.current.requestQuarantine(ID);
    await waitFor(() => assert.ok(result.current.isSuccess));
  });
  assert.equal(
    mock.calls.filter((c) => c.url.includes("/quarantine") && c.method === "POST").length,
    1,
  );
});

test("409 → erreur NOT_QUARANTINABLE exposée comme error.kind='error'", async () => {
  const { result } = setup(() => ({ status: 409, body: { success: false, errorCode: "NOT_QUARANTINABLE" } }));
  await act(async () => {
    result.current.requestQuarantine(ID);
    await waitFor(() => assert.ok(result.current.error !== undefined));
  });
  assert.equal(result.current.error?.kind, "error");
  assert.equal(result.current.isSuccess, false);
});

test("403 → erreur forbidden exposée", async () => {
  const { result } = setup(() => ({ status: 403, body: { success: false, errorCode: "FORBIDDEN" } }));
  await act(async () => {
    result.current.requestQuarantine(ID);
    await waitFor(() => assert.ok(result.current.error !== undefined));
  });
  assert.equal(result.current.error?.kind, "forbidden");
});

test("401 → erreur unauthorized exposée", async () => {
  const { result } = setup(() => ({ status: 401, body: { success: false, errorCode: "UNAUTHENTICATED" } }));
  await act(async () => {
    result.current.requestQuarantine(ID);
    await waitFor(() => assert.ok(result.current.error !== undefined));
  });
  assert.equal(result.current.error?.kind, "unauthorized");
});

test("reset : efface erreur", async () => {
  const { result } = setup(() => ({ status: 409, body: { success: false, errorCode: "NOT_QUARANTINABLE" } }));
  await act(async () => {
    result.current.requestQuarantine(ID);
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
    result.current.requestQuarantine(ID);
    await waitFor(() => assert.ok(result.current.isSuccess));
  });
  assert.equal(result.current.isPending, false);
});
