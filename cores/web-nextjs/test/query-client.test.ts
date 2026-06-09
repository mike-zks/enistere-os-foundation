import { ApiClientError } from "@enistere/api-client-fetch";
import type { QueryClient } from "@tanstack/react-query";
import assert from "node:assert/strict";
import { afterEach, test } from "node:test";

import { MAX_QUERY_RETRIES, createQueryClient, shouldRetryQuery } from "../src/core/query/query-client.js";

const http = (status: number) => ApiClientError.fromHttp(status, undefined, null);

// `createQueryClient` a un gcTime de 5 min : toute query ajoutée programme un timer. On `clear()`
// chaque client en fin de test pour ne pas garder l'event loop vivant (sinon `node --test` traîne).
const open: QueryClient[] = [];
function track(client: QueryClient): QueryClient {
  open.push(client);
  return client;
}
afterEach(() => {
  for (const client of open) client.clear();
  open.length = 0;
});

test("aucun retry sur 4xx (400/401/403/404/409/413/429)", () => {
  for (const status of [400, 401, 403, 404, 409, 413, 429]) {
    assert.equal(shouldRetryQuery(0, http(status)), false, `4xx ${status} ne doit pas être réessayé`);
  }
});

test("retry borné sur 5xx", () => {
  const e = http(503);
  assert.equal(shouldRetryQuery(0, e), true);
  assert.equal(shouldRetryQuery(1, e), true);
  assert.equal(shouldRetryQuery(MAX_QUERY_RETRIES, e), false);
});

test("retry sur réseau/timeout, pas sur invalid_response/session_expired", () => {
  assert.equal(shouldRetryQuery(0, ApiClientError.network("x", null)), true);
  assert.equal(shouldRetryQuery(0, ApiClientError.timeout(null)), true);
  assert.equal(shouldRetryQuery(0, new ApiClientError({ kind: "invalid_response", message: "x" })), false);
  assert.equal(shouldRetryQuery(0, ApiClientError.sessionExpired(null)), false);
});

test("aucun retry sur une erreur non-ApiClientError", () => {
  assert.equal(shouldRetryQuery(0, new Error("x")), false);
});

test("cache isolé entre deux QueryClient", () => {
  const a = track(createQueryClient());
  const b = track(createQueryClient());
  a.setQueryData(["health", "status"], { status: "ok" });
  assert.deepEqual(a.getQueryData(["health", "status"]), { status: "ok" });
  assert.equal(b.getQueryData(["health", "status"]), undefined);
});

test("defaults : refetchOnWindowFocus désactivé, staleTime explicite", () => {
  const defaults = track(createQueryClient()).getDefaultOptions().queries;
  assert.equal(defaults?.refetchOnWindowFocus, false);
  assert.equal(typeof defaults?.staleTime, "number");
});
