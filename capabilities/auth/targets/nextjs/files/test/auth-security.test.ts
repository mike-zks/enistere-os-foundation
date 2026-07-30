import { ApiClientError } from "@enistere/api-client-fetch";
import type { AuthTokens } from "@enistere/api-client-fetch";
import assert from "node:assert/strict";
import { afterEach, test } from "node:test";

import { createAuthenticatedServerApiClient } from "../src/features/auth/api/create-authenticated-server-api-client.js";
import { buildAuthCookieOptions, cookieName, type CookieEnv } from "../src/features/auth/cookie-config.js";
import { InMemoryCookieStore } from "../src/features/auth/server-cookie-store.js";
import { sessionPresence } from "../src/features/auth/session-contract.js";
import { WebAuthSessionAdapter } from "../src/features/auth/web-session-adapter.js";
import { createMockFetch } from "./helpers/api-test-kit.js";

const ENV: CookieEnv = "development";
const SENTINEL_ACCESS_TOKEN = "SENTINEL_ACCESS_TOKEN_aaaaaaaa";
const SENTINEL_REFRESH_TOKEN = "SENTINEL_REFRESH_TOKEN_bbbbbbbb";

const SENTINEL_TOKENS: AuthTokens = {
  accessToken: SENTINEL_ACCESS_TOKEN,
  refreshToken: SENTINEL_REFRESH_TOKEN,
  accessTokenExpiresIn: 900,
  refreshTokenExpiresIn: 1209600,
  tokenType: "Bearer",
};

const ORIG_FETCH = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = ORIG_FETCH;
});

test("les sentinelles n'apparaissent pas dans une ApiClientError", async () => {
  const store = new InMemoryCookieStore();
  store.set(cookieName("access", ENV), SENTINEL_ACCESS_TOKEN, buildAuthCookieOptions(ENV, 900));
  const mock = createMockFetch({
    status: 500,
    body: { success: false, statusCode: 500, message: "x", errorCode: "ERR", path: "/auth/me", timestamp: "t" },
  });
  const client = createAuthenticatedServerApiClient({ cookieStore: store, mode: "read-only", env: ENV, baseUrl: "https://internal.test", fetch: mock });

  try {
    await client.auth.getProfile();
    assert.fail("aurait dû lever");
  } catch (error) {
    assert.ok(error instanceof ApiClientError);
    const serialized = `${error.message}\n${JSON.stringify(error)}\n${String(error.stack ?? "")}`;
    assert.ok(!serialized.includes(SENTINEL_ACCESS_TOKEN), "token dans l'erreur");
    assert.ok(!serialized.includes(SENTINEL_REFRESH_TOKEN), "refresh dans l'erreur");
  }
});

test("aucune sentinelle n'est loggée pendant un flux de session", async () => {
  const captured: string[] = [];
  const methods = ["log", "info", "warn", "error", "debug"] as const;
  const originals = methods.map((m) => console[m]);
  for (const m of methods) {
    console[m] = (...args: unknown[]): void => {
      captured.push(args.map((a) => (typeof a === "string" ? a : JSON.stringify(a))).join(" "));
    };
  }
  try {
    const store = new InMemoryCookieStore();
    const adapter = new WebAuthSessionAdapter({ cookieStore: store, env: ENV });
    await adapter.updateTokens(SENTINEL_TOKENS);
    await adapter.getAccessToken();
    await adapter.getRefreshToken();
    sessionPresence(store, ENV);
    await adapter.clearSession();
  } finally {
    methods.forEach((m, i) => {
      console[m] = originals[i] as typeof console.log;
    });
  }
  const all = captured.join("\n");
  assert.ok(!all.includes(SENTINEL_ACCESS_TOKEN));
  assert.ok(!all.includes(SENTINEL_REFRESH_TOKEN));
});

test("sessionPresence n'expose aucune valeur de token (présence uniquement)", () => {
  const store = new InMemoryCookieStore();
  store.set(cookieName("access", ENV), SENTINEL_ACCESS_TOKEN, buildAuthCookieOptions(ENV, 900));
  store.set(cookieName("refresh", ENV), SENTINEL_REFRESH_TOKEN, buildAuthCookieOptions(ENV, 1209600));
  const presence = sessionPresence(store, ENV);
  assert.deepEqual(presence, { accessPresent: true, refreshPresent: true });
  assert.ok(!JSON.stringify(presence).includes(SENTINEL_ACCESS_TOKEN));
  assert.ok(!JSON.stringify(presence).includes(SENTINEL_REFRESH_TOKEN));
});
