import "./helpers/dom-setup.js";

import assert from "node:assert/strict";
import { afterEach, test } from "node:test";

import type { QueryClient } from "@tanstack/react-query";
import { act, cleanup, renderHook } from "@testing-library/react";

import { authKeys } from "../src/core/query/keys/auth-keys.js";
import { healthKeys } from "../src/core/query/keys/health-keys.js";
import { useLogout } from "../src/features/auth/use-logout.js";
import { createTestQueryClient, createWrapper } from "./helpers/api-test-kit.js";
import { createBrowserFetch } from "./helpers/browser-fetch.js";

const PROFILE = { id: "u1", email: "user@example.test", status: "ACTIVE", createdAt: "t", updatedAt: "t" };
const ORIG_FETCH = globalThis.fetch;
const openClients: QueryClient[] = [];
function trackClient(): QueryClient {
  const client = createTestQueryClient();
  openClients.push(client);
  return client;
}
afterEach(() => {
  cleanup();
  for (const client of openClients) client.clear();
  openClients.length = 0;
  globalThis.fetch = ORIG_FETCH;
});

test("logout : CSRF récupéré, en-tête posé, cache Auth purgé, Health conservé", async () => {
  const queryClient = trackClient();
  queryClient.setQueryData(authKeys.session(), { status: "authenticated", user: PROFILE });
  queryClient.setQueryData(authKeys.authorization(), { roles: ["administrator"], permissions: [] });
  queryClient.setQueryData(healthKeys.status(), { status: "ok" });

  const mock = createBrowserFetch((url) =>
    url.includes("/csrf") ? { body: { success: true, data: { csrfToken: "TOK-123" } } } : { body: { success: true, data: { loggedOut: true } } },
  );
  globalThis.fetch = mock as unknown as typeof fetch;

  const { result } = renderHook(() => useLogout(), { wrapper: createWrapper(queryClient) });
  await act(async () => {
    await result.current.logout();
  });

  const logoutCall = mock.calls.find((c) => c.url.includes("/api/auth/logout"));
  assert.ok(logoutCall);
  assert.equal(logoutCall.method, "POST");
  assert.equal(logoutCall.headers["x-csrf-token"], "TOK-123");

  assert.equal(queryClient.getQueryData(authKeys.session()), undefined, "session purgée");
  assert.equal(queryClient.getQueryData(authKeys.authorization()), undefined, "authorization purgée");
  assert.notEqual(queryClient.getQueryData(healthKeys.status()), undefined, "Health conservé");
  assert.equal(result.current.error, undefined);
});

test("erreur réseau au logout : pas de purge (ne prétend pas déconnecté), erreur exposée", async () => {
  const queryClient = trackClient();
  queryClient.setQueryData(authKeys.session(), { status: "authenticated", user: PROFILE });

  const mock = createBrowserFetch((url) =>
    url.includes("/csrf") ? { body: { success: true, data: { csrfToken: "TOK" } } } : { throwError: new TypeError("fetch failed") },
  );
  globalThis.fetch = mock as unknown as typeof fetch;

  const { result } = renderHook(() => useLogout(), { wrapper: createWrapper(queryClient) });
  await act(async () => {
    await result.current.logout();
  });

  assert.ok(result.current.error !== undefined);
  assert.notEqual(queryClient.getQueryData(authKeys.session()), undefined, "session NON purgée sur échec réseau");
});
