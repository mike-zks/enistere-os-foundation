import "./helpers/dom-setup.js";

import assert from "node:assert/strict";
import { afterEach, test } from "node:test";

import { dehydrate, hydrate, type QueryClient } from "@tanstack/react-query";
import { cleanup, renderHook, waitFor } from "@testing-library/react";

import { authKeys } from "../src/core/query/keys/auth-keys.js";
import { createQueryClient } from "../src/core/query/query-client.js";
import { prefillSessionQuery } from "../src/features/auth/auth-queries.js";
import { useSession } from "../src/features/auth/use-session.js";
import { createTestQueryClient, createWrapper } from "./helpers/api-test-kit.js";
import { createBrowserFetch } from "./helpers/browser-fetch.js";

const PROFILE = { id: "u1", email: "user@example.test", status: "ACTIVE", createdAt: "t", updatedAt: "t" } as const;
const ORIG_FETCH = globalThis.fetch;
const openClients: QueryClient[] = [];
afterEach(() => {
  cleanup();
  for (const c of openClients) c.clear();
  openClients.length = 0;
  globalThis.fetch = ORIG_FETCH;
});

test("prefillSessionQuery pose la forme exacte consommée par useSession", () => {
  const server = createQueryClient();
  openClients.push(server);
  prefillSessionQuery(server, PROFILE);
  assert.deepEqual(server.getQueryData(authKeys.session()), { status: "authenticated", user: PROFILE });
});

test("dehydrate → contient la session, AUCUN token dans le payload d'hydratation", () => {
  const server = createQueryClient();
  openClients.push(server);
  prefillSessionQuery(server, PROFILE);
  const state = dehydrate(server);
  assert.equal(state.queries.length, 1);
  assert.deepEqual(state.queries[0]?.queryKey, [...authKeys.session()]);
  const dump = JSON.stringify(state).toLowerCase();
  assert.ok(!dump.includes("accesstoken") && !dump.includes("refreshtoken") && !dump.includes("bearer"));
});

test("hydratation : useSession est authenticated au PREMIER rendu (aucun flash), SANS appel /api/auth/me", async () => {
  const server = createQueryClient();
  openClients.push(server);
  prefillSessionQuery(server, PROFILE);
  const dehydrated = dehydrate(server);

  const client = createTestQueryClient();
  openClients.push(client);
  hydrate(client, dehydrated);

  // Toute requête réseau ferait échouer le test (la session doit venir de l'hydratation).
  const mock = createBrowserFetch({ body: { success: true, data: PROFILE } });
  globalThis.fetch = mock as unknown as typeof fetch;

  const { result } = renderHook(() => useSession(), { wrapper: createWrapper(client) });

  // Premier rendu déjà authentifié, jamais "loading".
  assert.equal(result.current.status, "authenticated");
  assert.equal(result.current.isLoading, false);
  assert.equal(result.current.user?.email, "user@example.test");

  // Laisser un tour d'event loop : aucune requête déclenchée (donnée fraîche, staleTime 30s).
  await new Promise((r) => setTimeout(r, 20));
  assert.equal(mock.calls.length, 0, "aucun appel /api/auth/me au premier rendu (hydraté)");
  assert.ok(!JSON.stringify(result.current).toLowerCase().includes("token"));
});

test("refetch reste possible après hydratation (action explicite)", async () => {
  const server = createQueryClient();
  openClients.push(server);
  prefillSessionQuery(server, PROFILE);
  const client = createTestQueryClient();
  openClients.push(client);
  hydrate(client, dehydrate(server));

  const mock = createBrowserFetch({ body: { success: true, data: PROFILE } });
  globalThis.fetch = mock as unknown as typeof fetch;
  const { result } = renderHook(() => useSession(), { wrapper: createWrapper(client) });

  result.current.refetch();
  await waitFor(() => {
    assert.ok(mock.calls.length > 0, "refetch explicite déclenche bien un appel");
  });
  assert.ok(mock.calls[0]?.url.includes("/api/auth/me"));
});
