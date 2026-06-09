import { ApiClientError } from "@enistere/api-client-fetch";
import assert from "node:assert/strict";
import { test } from "node:test";

import { getHealth } from "../src/core/api/health/health-transport.js";
import { createServerApiClient } from "../src/core/api/server/create-server-api-client.js";
import { createMockFetch, envelope } from "./helpers/api-test-kit.js";

const HEALTH_OK = envelope({ status: "ok", timestamp: "2026-06-09T12:00:00.000Z" });
const ERROR_BODY = {
  success: false,
  statusCode: 401,
  message: "non authentifié",
  errorCode: "UNAUTHENTICATED",
  path: "/health",
  timestamp: "2026-06-09T12:00:00.000Z",
};

test("nouvelle instance par appel (aucun client global)", () => {
  const a = createServerApiClient({ baseUrl: "https://internal.test", fetch: createMockFetch({}) });
  const b = createServerApiClient({ baseUrl: "https://internal.test", fetch: createMockFetch({}) });
  assert.notEqual(a, b);
});

test("base URL interne + fetch injecté, sans Authorization, avec X-Request-Id", async () => {
  const mock = createMockFetch({ body: HEALTH_OK, requestId: "rid-1" });
  const client = createServerApiClient({ baseUrl: "https://internal.test", fetch: mock });
  const data = await getHealth(client);
  assert.equal(data.status, "ok");
  assert.equal(mock.calls.length, 1);
  assert.ok(mock.calls[0]?.url.startsWith("https://internal.test/health"));
  assert.equal(mock.calls[0]?.headers["authorization"], undefined);
  assert.ok(mock.calls[0]?.headers["x-request-id"], "X-Request-Id doit être posé");
});

test("propage un requestId entrant", async () => {
  const mock = createMockFetch({ body: HEALTH_OK });
  const client = createServerApiClient({
    baseUrl: "https://internal.test",
    fetch: mock,
    requestId: "incoming-123",
  });
  await getHealth(client);
  assert.equal(mock.calls[0]?.headers["x-request-id"], "incoming-123");
});

test("isolation : deux instances ne partagent ni fetch ni base URL", async () => {
  const m1 = createMockFetch({ body: HEALTH_OK });
  const m2 = createMockFetch({ body: HEALTH_OK });
  const c1 = createServerApiClient({ baseUrl: "https://a.test", fetch: m1 });
  const c2 = createServerApiClient({ baseUrl: "https://b.test", fetch: m2 });
  await getHealth(c1);
  await getHealth(c2);
  assert.equal(m1.calls.length, 1);
  assert.equal(m2.calls.length, 1);
  assert.ok(m1.calls[0]?.url.includes("a.test"));
  assert.ok(m2.calls[0]?.url.includes("b.test"));
});

test("aucun refresh : un 401 ne déclenche pas de seconde requête", async () => {
  const mock = createMockFetch({ status: 401, body: ERROR_BODY });
  const client = createServerApiClient({ baseUrl: "https://internal.test", fetch: mock });
  await assert.rejects(
    () => getHealth(client),
    (e) => e instanceof ApiClientError && e.status === 401,
  );
  assert.equal(mock.calls.length, 1, "aucun refresh attendu : une seule requête");
});
