import "./helpers/dom-setup.js";

import assert from "node:assert/strict";
import { afterEach, beforeEach, test } from "node:test";

import { act, cleanup, renderHook, waitFor } from "@testing-library/react";

import { resetPublicApiClientForTests } from "../src/core/api/public/public-api-client.js";
import { useHealth } from "../src/core/health/use-health.js";
import {
  createMockFetch,
  createTestQueryClient,
  createWrapper,
  envelope,
  forbidRealFetch,
  useGlobalFetch,
} from "./helpers/api-test-kit.js";

const ORIG_FETCH = globalThis.fetch;
const ORIG_URL = process.env.NEXT_PUBLIC_API_URL;

beforeEach(() => {
  process.env.NEXT_PUBLIC_API_URL = "https://hooks.test";
  resetPublicApiClientForTests();
});

afterEach(() => {
  cleanup();
  globalThis.fetch = ORIG_FETCH;
  if (ORIG_URL === undefined) delete process.env.NEXT_PUBLIC_API_URL;
  else process.env.NEXT_PUBLIC_API_URL = ORIG_URL;
  resetPublicApiClientForTests();
});

test("useHealth : succès → data + clé ['health','status'] en cache, aucune requête /auth", async () => {
  const mock = createMockFetch({ body: envelope({ status: "ok", timestamp: "t" }) });
  useGlobalFetch(mock);
  const queryClient = createTestQueryClient();
  const { result } = renderHook(() => useHealth(), { wrapper: createWrapper(queryClient) });

  await waitFor(() => {
    assert.ok(result.current.isSuccess);
  });
  assert.deepEqual(result.current.data, { status: "ok", timestamp: "t" });
  assert.deepEqual(queryClient.getQueryData(["health", "status"]), { status: "ok", timestamp: "t" });
  assert.ok(mock.calls.every((c) => !c.url.includes("/auth/")), "aucune requête d'authentification");
});

test("useHealth : erreur HTTP → isError", async () => {
  useGlobalFetch(
    createMockFetch({
      status: 500,
      body: { success: false, statusCode: 500, message: "x", errorCode: "ERR", path: "/health", timestamp: "t" },
    }),
  );
  const { result } = renderHook(() => useHealth(), { wrapper: createWrapper(createTestQueryClient()) });
  await waitFor(() => {
    assert.ok(result.current.isError);
  });
});

test("useHealth : non configuré → désactivé (aucune requête)", async () => {
  delete process.env.NEXT_PUBLIC_API_URL;
  resetPublicApiClientForTests();
  forbidRealFetch(); // si une requête partait, le test échouerait
  const { result } = renderHook(() => useHealth(), { wrapper: createWrapper(createTestQueryClient()) });
  await act(async () => {
    await Promise.resolve();
  });
  assert.equal(result.current.fetchStatus, "idle");
  assert.equal(result.current.isLoading, false);
});

test("useHealth : refetch déclenche une nouvelle requête", async () => {
  const mock = createMockFetch({ body: envelope({ status: "ok", timestamp: "t" }) });
  useGlobalFetch(mock);
  const { result } = renderHook(() => useHealth(), { wrapper: createWrapper(createTestQueryClient()) });
  await waitFor(() => {
    assert.ok(result.current.isSuccess);
  });
  const before = mock.calls.length;
  await act(async () => {
    await result.current.refetch();
  });
  assert.ok(mock.calls.length > before, "refetch doit refaire une requête");
});
