import assert from "node:assert/strict";
import { afterEach, test } from "node:test";

import { BffAuthError } from "../src/core/auth/client/bff-error.js";
import { performBffLogin } from "../src/core/auth/client/login-client.js";

interface Spec {
  status?: number;
  body?: unknown;
  rawBody?: string;
  requestId?: string;
  throwError?: unknown;
}
interface Call {
  url: string;
  method: string;
  headers: Record<string, string>;
  credentials?: string;
  body?: unknown;
}

function loginFetch(route: (url: string) => Spec) {
  const calls: Call[] = [];
  const fn = async (input: string | URL | Request, init?: RequestInit): Promise<Response> => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
    const headers = new Headers(init?.headers ?? {});
    calls.push({
      url,
      method: (init?.method ?? "GET").toUpperCase(),
      headers: Object.fromEntries(headers.entries()),
      credentials: init?.credentials,
      body: init?.body,
    });
    const s = route(url);
    if (s.throwError !== undefined) throw s.throwError;
    const h = new Headers({ "content-type": "application/json" });
    if (s.requestId !== undefined) h.set("x-request-id", s.requestId);
    const payload = s.rawBody !== undefined ? s.rawBody : s.body !== undefined ? JSON.stringify(s.body) : "";
    return new Response(payload, { status: s.status ?? 200, headers: h });
  };
  return Object.assign(fn, { calls });
}

const CSRF_OK = (url: string): Spec | null =>
  url.includes("/api/auth/csrf") ? { body: { success: true, data: { csrfToken: "tok-123456789012345678901234567890" } } } : null;

const ORIG = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = ORIG;
});

test("succès : CSRF → login (header, credentials, body exact, same-origin, aucun Authorization)", async () => {
  const mock = loginFetch((url) => CSRF_OK(url) ?? { body: { success: true, data: { authenticated: true } } });
  globalThis.fetch = mock as unknown as typeof fetch;

  await performBffLogin("user@example.test", "pw-SENTINEL");

  const login = mock.calls.find((c) => c.url.includes("/api/auth/login"));
  assert.ok(login, "appel login émis");
  assert.equal(login?.method, "POST");
  assert.equal(login?.credentials, "include");
  assert.equal(login?.headers["x-csrf-token"], "tok-123456789012345678901234567890");
  assert.equal(login?.headers["content-type"], "application/json");
  assert.equal(login?.headers["authorization"], undefined);
  assert.equal(login?.body, JSON.stringify({ email: "user@example.test", password: "pw-SENTINEL" }));
  // Tous les appels sont same-origin /api/auth/* (jamais l'API directe).
  assert.ok(mock.calls.every((c) => c.url.startsWith("/api/auth/")));
});

test("CSRF d'abord : si /csrf échoue, /login n'est PAS appelé", async () => {
  const mock = loginFetch((url) => (url.includes("/csrf") ? { status: 500, body: { success: false } } : { body: { success: true } }));
  globalThis.fetch = mock as unknown as typeof fetch;
  await assert.rejects(() => performBffLogin("a@b.test", "x"), BffAuthError);
  assert.ok(!mock.calls.some((c) => c.url.includes("/api/auth/login")), "login non appelé");
});

test("mapping des statuts → BffAuthError (401/403/429/503)", async () => {
  for (const status of [401, 403, 429, 503]) {
    const mock = loginFetch((url) => CSRF_OK(url) ?? { status, body: { success: false, errorCode: "E" } });
    globalThis.fetch = mock as unknown as typeof fetch;
    await assert.rejects(
      () => performBffLogin("a@b.test", "x"),
      (e) => e instanceof BffAuthError && e.kind === "http" && e.status === status,
      `status ${status}`,
    );
  }
});

test("réseau → BffAuthError(network) ; JSON invalide → invalid_response", async () => {
  const net = loginFetch((url) => CSRF_OK(url) ?? { throwError: new TypeError("down") });
  globalThis.fetch = net as unknown as typeof fetch;
  await assert.rejects(() => performBffLogin("a@b.test", "x"), (e) => e instanceof BffAuthError && e.kind === "network");

  const bad = loginFetch((url) => CSRF_OK(url) ?? { status: 200, rawBody: "<<not json>>" });
  globalThis.fetch = bad as unknown as typeof fetch;
  await assert.rejects(() => performBffLogin("a@b.test", "x"), (e) => e instanceof BffAuthError && e.kind === "invalid_response");
});

test("requestId capturé ; AUCUNE fuite de mot de passe dans l'erreur", async () => {
  const mock = loginFetch((url) => CSRF_OK(url) ?? { status: 401, requestId: "req-xyz", body: { success: false, errorCode: "UNAUTHENTICATED" } });
  globalThis.fetch = mock as unknown as typeof fetch;
  await performBffLogin("a@b.test", "TOP-SECRET-PW").then(
    () => assert.fail("devait rejeter"),
    (e: unknown) => {
      assert.ok(e instanceof BffAuthError);
      assert.equal((e as BffAuthError).requestId, "req-xyz");
      assert.ok(!JSON.stringify(e).includes("TOP-SECRET-PW"));
      assert.ok(!((e as BffAuthError).message ?? "").includes("TOP-SECRET-PW"));
    },
  );
});
