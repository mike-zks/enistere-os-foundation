import "./helpers/dom-setup.js";

import assert from "node:assert/strict";
import { afterEach, test } from "node:test";

import type { QueryClient } from "@tanstack/react-query";
import { act, cleanup, renderHook, waitFor } from "@testing-library/react";

import { useSession } from "../src/features/auth/use-session.js";
import { createTestQueryClient, createWrapper } from "./helpers/api-test-kit.js";
import { createBrowserFetch } from "./helpers/browser-fetch.js";

const PROFILE = { id: "u1", email: "user@example.test", status: "ACTIVE", createdAt: "t", updatedAt: "t" };
const ORIG_FETCH = globalThis.fetch;
// Les queryOptions imposent gcTime=5min → on `clear()` chaque client en fin de test (sinon timer GC ref).
const openClients: QueryClient[] = [];
afterEach(() => {
  cleanup();
  for (const client of openClients) client.clear();
  openClients.length = 0;
  globalThis.fetch = ORIG_FETCH;
});

function render() {
  const client = createTestQueryClient();
  openClients.push(client);
  return renderHook(() => useSession(), { wrapper: createWrapper(client) });
}

test("succès → authenticated (profil, aucun token exposé)", async () => {
  globalThis.fetch = createBrowserFetch({ body: { success: true, data: PROFILE } }) as unknown as typeof fetch;
  const { result } = render();
  await waitFor(() => {
    assert.ok(result.current.isAuthenticated);
  });
  assert.equal(result.current.user?.email, "user@example.test");
  assert.ok(!JSON.stringify(result.current).toLowerCase().includes("token"));
});

test("401 → anonymous (pas une erreur)", async () => {
  globalThis.fetch = createBrowserFetch({ status: 401, body: { success: false, errorCode: "UNAUTHENTICATED" } }) as unknown as typeof fetch;
  const { result } = render();
  await waitFor(() => {
    assert.equal(result.current.status, "anonymous");
  });
  assert.ok(result.current.isAnonymous);
  assert.equal(result.current.error, undefined);
});

test("403 → error (distinct d'anonymous)", async () => {
  globalThis.fetch = createBrowserFetch({ status: 403, body: { success: false, errorCode: "FORBIDDEN" } }) as unknown as typeof fetch;
  const { result } = render();
  await waitFor(() => {
    assert.equal(result.current.status, "error");
  });
  assert.equal(result.current.error?.status, 403);
  assert.equal(result.current.isAnonymous, false);
});

test("erreur réseau → error", async () => {
  globalThis.fetch = createBrowserFetch({ throwError: new TypeError("x") }) as unknown as typeof fetch;
  const { result } = render();
  await waitFor(() => {
    assert.equal(result.current.status, "error");
  });
});

test("refetch redéclenche un appel", async () => {
  const mock = createBrowserFetch({ body: { success: true, data: PROFILE } });
  globalThis.fetch = mock as unknown as typeof fetch;
  const { result } = render();
  await waitFor(() => {
    assert.ok(result.current.isAuthenticated);
  });
  const before = mock.calls.length;
  await act(async () => {
    result.current.refetch();
    await waitFor(() => {
      assert.ok(mock.calls.length > before);
    });
  });
});
