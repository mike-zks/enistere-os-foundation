import "./helpers/dom-setup.js";

import assert from "node:assert/strict";
import { afterEach, test } from "node:test";

import type { QueryClient } from "@tanstack/react-query";
import { act, cleanup, renderHook, waitFor } from "@testing-library/react";

import { authKeys } from "../src/core/query/keys/auth-keys.js";
import { healthKeys } from "../src/core/query/keys/health-keys.js";
import { useLogin } from "../src/features/auth/use-login.js";
import { createTestQueryClient, createWrapper } from "./helpers/api-test-kit.js";
import { createBrowserFetch } from "./helpers/browser-fetch.js";

const ORIG = globalThis.fetch;
const open: QueryClient[] = [];
afterEach(() => {
  cleanup();
  for (const c of open) c.clear();
  open.length = 0;
  globalThis.fetch = ORIG;
});

function setup(loginSpec: (url: string) => { status?: number; body?: unknown }) {
  const client = createTestQueryClient();
  open.push(client);
  // état Auth « anonyme » résiduel + une query Health, pour vérifier la purge sélective.
  client.setQueryData(authKeys.session(), { status: "anonymous" });
  client.setQueryData(healthKeys.status(), { ok: true });
  const mock = createBrowserFetch((url) =>
    url.includes("/csrf") ? { body: { success: true, data: { csrfToken: "tok" } } } : loginSpec(url),
  );
  globalThis.fetch = mock as unknown as typeof fetch;
  let navigated = 0;
  const { result } = renderHook(() => useLogin({ onAuthenticated: () => { navigated += 1; } }), {
    wrapper: createWrapper(client),
  });
  return { client, mock, result, navigated: () => navigated };
}

test("idle au départ", () => {
  const { result } = setup(() => ({ body: { success: true, data: { authenticated: true } } }));
  assert.equal(result.current.status, "idle");
  assert.equal(result.current.isPending, false);
  assert.equal(result.current.error, undefined);
});

test("succès → onAuthenticated, purge authKeys (Health conservé), aucun credential en cache", async () => {
  const { client, result, navigated } = setup(() => ({ body: { success: true, data: { authenticated: true } } }));
  await act(async () => {
    result.current.submit({ email: "user@example.test", password: "PW-SENTINEL" });
    await waitFor(() => assert.equal(navigated(), 1));
  });
  assert.equal(client.getQueryData(authKeys.session()), undefined, "session Auth purgée");
  assert.deepEqual(client.getQueryData(healthKeys.status()), { ok: true }, "Health conservé");
  const dump = JSON.stringify(client.getQueryCache().getAll().map((q) => ({ k: q.queryKey, d: q.state.data })));
  assert.ok(!dump.includes("PW-SENTINEL"), "aucun mot de passe dans le cache");
});

test("erreur 401 → status error + message générique (sans énumération), onAuthenticated NON appelé", async () => {
  const { result, navigated } = setup(() => ({ status: 401, body: { success: false, errorCode: "UNAUTHENTICATED" } }));
  await act(async () => {
    result.current.submit({ email: "user@example.test", password: "x" });
    await waitFor(() => assert.equal(result.current.status, "error"));
  });
  assert.equal(result.current.error?.message, "Adresse e-mail ou mot de passe incorrect.");
  assert.equal(navigated(), 0);
});

test("double soumission empêchée (un seul appel /api/auth/login)", async () => {
  const { mock, result, navigated } = setup(() => ({ body: { success: true, data: { authenticated: true } } }));
  await act(async () => {
    result.current.submit({ email: "user@example.test", password: "x" });
    result.current.submit({ email: "user@example.test", password: "x" });
    await waitFor(() => assert.equal(navigated(), 1));
  });
  const loginCalls = mock.calls.filter((c) => c.url.includes("/api/auth/login"));
  assert.equal(loginCalls.length, 1, "une seule mutation login");
});
