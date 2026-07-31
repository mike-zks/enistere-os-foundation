import "./helpers/dom-setup.js";

import assert from "node:assert/strict";
import { afterEach, test } from "node:test";

import { fetchSessionProfile } from "../src/features/auth/client/auth-bff-client.js";
import { BffAuthError } from "../src/features/auth/client/bff-error.js";
import { createBrowserFetch } from "./helpers/browser-fetch.js";

const PROFILE = { id: "u1", email: "user@example.test", status: "ACTIVE", createdAt: "t", updatedAt: "t" };

const ORIG_FETCH = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = ORIG_FETCH;
});

function useFetch(mock: ReturnType<typeof createBrowserFetch>): void {
  globalThis.fetch = mock as unknown as typeof fetch;
}

test("GET /api/auth/me : same-origin, credentials include, sans Authorization", async () => {
  const mock = createBrowserFetch({ body: { success: true, data: PROFILE } });
  useFetch(mock);
  const profile = await fetchSessionProfile();
  assert.deepEqual(profile, PROFILE);
  assert.ok(mock.calls[0]?.url.includes("/api/auth/me"));
  assert.ok(!mock.calls[0]?.url.includes("://"), "chemin relatif same-origin (aucune URL API externe)");
  assert.equal(mock.calls[0]?.credentials, "include");
  assert.equal(mock.calls[0]?.headers["authorization"], undefined);
});

test("401 → BffAuthError status 401", async () => {
  useFetch(createBrowserFetch({ status: 401, body: { success: false, errorCode: "UNAUTHENTICATED" }, requestId: "rid-1" }));
  await assert.rejects(
    () => fetchSessionProfile(),
    (e) => e instanceof BffAuthError && e.status === 401 && e.requestId === "rid-1",
  );
});

test("403 → BffAuthError status 403", async () => {
  useFetch(createBrowserFetch({ status: 403, body: { success: false, errorCode: "FORBIDDEN" } }));
  await assert.rejects(() => fetchSessionProfile(), (e) => e instanceof BffAuthError && e.status === 403);
});

test("503 → BffAuthError status 503", async () => {
  useFetch(createBrowserFetch({ status: 503, body: { success: false, errorCode: "API_UNAVAILABLE" } }));
  await assert.rejects(() => fetchSessionProfile(), (e) => e instanceof BffAuthError && e.status === 503);
});

test("JSON invalide → BffAuthError invalid_response", async () => {
  useFetch(createBrowserFetch({ rawBody: "{not json" }));
  await assert.rejects(() => fetchSessionProfile(), (e) => e instanceof BffAuthError && e.kind === "invalid_response");
});

test("enveloppe incohérente (success!=true) → invalid_response", async () => {
  useFetch(createBrowserFetch({ body: { data: PROFILE } }));
  await assert.rejects(() => fetchSessionProfile(), (e) => e instanceof BffAuthError && e.kind === "invalid_response");
});

test("erreur réseau → BffAuthError network", async () => {
  useFetch(createBrowserFetch({ throwError: new TypeError("fetch failed") }));
  await assert.rejects(() => fetchSessionProfile(), (e) => e instanceof BffAuthError && e.kind === "network");
});
