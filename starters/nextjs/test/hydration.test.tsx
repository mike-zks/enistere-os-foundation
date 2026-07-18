import "./helpers/dom-setup.js";

import { ApiClientError } from "@enistere/api-client-fetch";
import { type QueryClient, dehydrate, hydrate } from "@tanstack/react-query";
import { act, cleanup, renderHook } from "@testing-library/react";
import assert from "node:assert/strict";
import { afterEach, beforeEach, test } from "node:test";

import { resetPublicApiClientForTests } from "../src/core/api/public/public-api-client.js";
import { createQueryClient } from "../src/core/query/query-client.js";
import { healthKeys } from "../src/core/query/keys/health-keys.js";
import { useHealth } from "../src/features/health/use-health.js";
import { createMockFetch, createWrapper, envelope, useGlobalFetch } from "./helpers/api-test-kit.js";

const ORIG_FETCH = globalThis.fetch;
const ORIG_URL = process.env.NEXT_PUBLIC_API_URL;

// `createQueryClient` programme un timer gcTime (5 min) ; on `clear()` chaque client en fin de test.
const open: QueryClient[] = [];
function track(client: QueryClient): QueryClient {
  open.push(client);
  return client;
}

beforeEach(() => {
  process.env.NEXT_PUBLIC_API_URL = "https://h.test";
  resetPublicApiClientForTests();
});

afterEach(() => {
  cleanup();
  for (const client of open) client.clear();
  open.length = 0;
  globalThis.fetch = ORIG_FETCH;
  if (ORIG_URL === undefined) delete process.env.NEXT_PUBLIC_API_URL;
  else process.env.NEXT_PUBLIC_API_URL = ORIG_URL;
  resetPublicApiClientForTests();
});

test("données préchargées utilisables après hydratation, sans refetch immédiat (fraîches)", async () => {
  // Serveur : QueryClient avec donnée préchargée → déshydratation.
  const server = track(createQueryClient());
  server.setQueryData(healthKeys.status(), { status: "ok", timestamp: "PRELOADED" });
  const state = dehydrate(server);

  // Client : hydratation dans un autre QueryClient.
  const client = track(createQueryClient());
  hydrate(client, state);

  // Un refetch éventuel renverrait "NEW" (détecteur).
  const mock = createMockFetch({ body: envelope({ status: "ok", timestamp: "NEW" }) });
  useGlobalFetch(mock);

  const { result } = renderHook(() => useHealth(), { wrapper: createWrapper(client) });

  assert.equal(result.current.data?.timestamp, "PRELOADED");
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 30));
  });
  assert.equal(result.current.data?.timestamp, "PRELOADED", "donnée fraîche : pas de refetch");
  assert.equal(mock.calls.length, 0, "aucune requête immédiate après hydratation");
});

test("QueryClients indépendants : hydrater l'un n'affecte pas l'autre", () => {
  const a = track(createQueryClient());
  a.setQueryData(healthKeys.status(), { status: "ok", timestamp: "A" });
  const b = track(createQueryClient());
  assert.equal(b.getQueryData(healthKeys.status()), undefined);
});

test("préchargement serveur en échec : ne jette pas et n'est pas déshydraté (erreur SSR contrôlée)", async () => {
  const server = track(createQueryClient());
  await server.prefetchQuery({
    queryKey: healthKeys.status(),
    queryFn: () => {
      throw new ApiClientError({ kind: "network", message: "indispo" });
    },
    retry: false,
  });
  const state = dehydrate(server);
  assert.equal(state.queries.length, 0, "une query en erreur n'est pas déshydratée");
});
