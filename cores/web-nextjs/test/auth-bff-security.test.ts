import assert from "node:assert/strict";
import { test } from "node:test";

import { cookieName } from "../src/core/auth/cookie-config.js";
import { csrfCookieName } from "../src/core/auth/csrf/csrf-cookie.js";
import { handleLogin } from "../src/core/auth/handlers/login-handler.js";
import { createMockFetch } from "./helpers/api-test-kit.js";
import {
  apiEnvelope,
  loginPayload,
  makeDeps,
  makeRequest,
  RecordingCookieStore,
  seedCsrf,
  TEST_ENV,
} from "./helpers/auth-test-kit.js";

const SENTINEL_ACCESS_TOKEN = "SENTINEL_ACCESS_TOKEN_aaaaaaaa";
const SENTINEL_REFRESH_TOKEN = "SENTINEL_REFRESH_TOKEN_bbbbbbbb";
const SENTINEL_PASSWORD = "SENTINEL_PASSWORD_cccccccc";

test("login : sentinelles absentes du corps de réponse et des logs", async () => {
  const captured: string[] = [];
  const methods = ["log", "info", "warn", "error", "debug"] as const;
  const originals = methods.map((m) => console[m]);
  for (const m of methods) {
    console[m] = (...args: unknown[]): void => {
      captured.push(args.map((a) => (typeof a === "string" ? a : JSON.stringify(a))).join(" "));
    };
  }

  let bodyText: string;
  try {
    const store = new RecordingCookieStore();
    const csrf = seedCsrf(store);
    const mock = createMockFetch({ body: apiEnvelope(loginPayload(SENTINEL_ACCESS_TOKEN, SENTINEL_REFRESH_TOKEN)) });
    const res = await handleLogin(
      makeRequest("/api/auth/login", { csrf, jsonBody: { email: "user@example.test", password: SENTINEL_PASSWORD } }),
      makeDeps(store, mock),
    );
    bodyText = await res.text();
    // Les cookies contiennent bien les tokens (correct, HttpOnly) :
    assert.equal(store.get(cookieName("access", TEST_ENV)), SENTINEL_ACCESS_TOKEN);
  } finally {
    methods.forEach((m, i) => {
      console[m] = originals[i] as typeof console.log;
    });
  }

  for (const sentinel of [SENTINEL_ACCESS_TOKEN, SENTINEL_REFRESH_TOKEN, SENTINEL_PASSWORD]) {
    assert.ok(!bodyText.includes(sentinel), `sentinelle dans le corps : ${sentinel}`);
    assert.ok(!captured.join("\n").includes(sentinel), `sentinelle loggée : ${sentinel}`);
  }
});

test("attributs cookies : Auth HttpOnly, CSRF non HttpOnly, SameSite=Lax, Path=/, sans Domain", async () => {
  const store = new RecordingCookieStore();
  const csrf = seedCsrf(store);
  const mock = createMockFetch({ body: apiEnvelope(loginPayload("AX", "RX")) });
  await handleLogin(
    makeRequest("/api/auth/login", { csrf, jsonBody: { email: "user@example.test", password: "pw" } }),
    makeDeps(store, mock),
  );

  const access = store.setOptions.get(cookieName("access", TEST_ENV));
  const refresh = store.setOptions.get(cookieName("refresh", TEST_ENV));
  const csrfOpt = store.setOptions.get(csrfCookieName(TEST_ENV));
  assert.ok(access && refresh && csrfOpt);

  for (const opt of [access, refresh]) {
    assert.equal(opt.httpOnly, true);
    assert.equal(opt.sameSite, "lax");
    assert.equal(opt.path, "/");
    assert.equal(opt.domain, undefined);
    assert.equal(opt.secure, false); // env de test = development
  }
  assert.equal(csrfOpt.httpOnly, false);
  assert.equal(csrfOpt.sameSite, "lax");
});
