import { ApiClientError } from "@enistere/api-client-fetch";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import { getHealth } from "../src/core/api/health/health-transport.js";
import { createPublicApiClient } from "../src/core/api/public/public-api-client.js";
import { createMockFetch, envelope } from "./helpers/api-test-kit.js";

const HEALTH_OK = envelope({ status: "ok", timestamp: "2026-06-09T12:00:00.000Z" });
const ERROR_BODY = (status: number) => ({
  success: false,
  statusCode: status,
  message: "erreur",
  errorCode: "ERR",
  path: "/health",
  timestamp: "2026-06-09T12:00:00.000Z",
});

test("URL publique + fetch injecté, sans Authorization, avec X-Request-Id", async () => {
  const mock = createMockFetch({ body: HEALTH_OK });
  const client = createPublicApiClient({ baseUrl: "https://public.test", fetch: mock });
  await getHealth(client);
  assert.ok(mock.calls[0]?.url.startsWith("https://public.test/health"));
  assert.equal(mock.calls[0]?.headers["authorization"], undefined);
  assert.ok(mock.calls[0]?.headers["x-request-id"]);
});

test("enableRefresh:false — un 401 ne déclenche aucune seconde requête", async () => {
  const mock = createMockFetch({ status: 401, body: ERROR_BODY(401) });
  const client = createPublicApiClient({ baseUrl: "https://public.test", fetch: mock });
  await assert.rejects(
    () => getHealth(client),
    (e) => e instanceof ApiClientError && e.status === 401,
  );
  assert.equal(mock.calls.length, 1);
});

test("erreurs HTTP normalisées en ApiClientError", async () => {
  const mock = createMockFetch({ status: 503, body: ERROR_BODY(503) });
  const client = createPublicApiClient({ baseUrl: "https://public.test", fetch: mock });
  await assert.rejects(
    () => getHealth(client),
    (e) => e instanceof ApiClientError && e.kind === "http" && e.status === 503,
  );
});

test("le module client public n'importe AUCUN module serveur", () => {
  // build-test/test/x.js -> ../../ = racine web-nextjs -> src/...
  const source = readFileSync(
    new URL("../../src/core/api/public/public-api-client.ts", import.meta.url),
    "utf8",
  );
  for (const forbidden of [
    "server-only",
    "next/headers",
    "next/server",
    "server-config",
    "API_INTERNAL_URL",
  ]) {
    assert.ok(!source.includes(forbidden), `référence serveur interdite dans le client public : ${forbidden}`);
  }
});
