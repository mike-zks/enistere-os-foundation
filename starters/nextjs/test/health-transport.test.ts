import { ApiClientError } from "@enistere/api-client-fetch";
import assert from "node:assert/strict";
import { afterEach, test } from "node:test";

import { getHealth, getReadiness } from "../src/core/api/health/health-transport.js";
import { createPublicApiClient } from "../src/core/api/public/public-api-client.js";
import { createMockFetch, envelope, forbidRealFetch } from "./helpers/api-test-kit.js";

const ORIG_FETCH = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = ORIG_FETCH;
});

const ERROR_BODY = (status: number) => ({
  success: false,
  statusCode: status,
  message: "erreur",
  errorCode: "ERR",
  path: "/health",
  timestamp: "2026-06-09T12:00:00.000Z",
});

test("getHealth : extrait `data` de l'enveloppe", async () => {
  const mock = createMockFetch({ body: envelope({ status: "ok", timestamp: "t" }) });
  const client = createPublicApiClient({ baseUrl: "https://t.test", fetch: mock });
  assert.deepEqual(await getHealth(client), { status: "ok", timestamp: "t" });
});

test("getReadiness : 503 → ApiClientError http 503 (readiness down contrôlé)", async () => {
  const mock = createMockFetch({ status: 503, body: ERROR_BODY(503) });
  const client = createPublicApiClient({ baseUrl: "https://t.test", fetch: mock });
  await assert.rejects(
    () => getReadiness(client),
    (e) => e instanceof ApiClientError && e.kind === "http" && e.status === 503,
  );
});

test("échec réseau → ApiClientError kind=network", async () => {
  const mock = createMockFetch({ throwError: new TypeError("fetch failed") });
  const client = createPublicApiClient({ baseUrl: "https://t.test", fetch: mock });
  await assert.rejects(
    () => getHealth(client),
    (e) => e instanceof ApiClientError && e.kind === "network",
  );
});

test("timeout → ApiClientError kind=timeout", async () => {
  const mock = createMockFetch({ hangUntilAbort: true });
  const client = createPublicApiClient({ baseUrl: "https://t.test", fetch: mock });
  await assert.rejects(
    () => getHealth(client, { timeoutMs: 20 }),
    (e) => e instanceof ApiClientError && e.kind === "timeout",
  );
});

test("requestId lu dans l'en-tête de réponse en cas d'erreur", async () => {
  const mock = createMockFetch({ status: 500, requestId: "rid-err", body: ERROR_BODY(500) });
  const client = createPublicApiClient({ baseUrl: "https://t.test", fetch: mock });
  await assert.rejects(
    () => getHealth(client),
    (e) => e instanceof ApiClientError && e.requestId === "rid-err",
  );
});

test("aucune requête réseau réelle : le fetch injecté est utilisé (garde anti-réseau)", async () => {
  forbidRealFetch(); // toute utilisation de globalThis.fetch ferait échouer le test
  const mock = createMockFetch({ body: envelope({ status: "ok", timestamp: "t" }) });
  const client = createPublicApiClient({ baseUrl: "https://t.test", fetch: mock });
  await getHealth(client);
  assert.equal(mock.calls.length, 1);
});
