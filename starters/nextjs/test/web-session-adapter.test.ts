import type { AuthTokens } from "@enistere/api-client-fetch";
import assert from "node:assert/strict";
import { test } from "node:test";

import { CookieConfigError } from "../src/core/auth/cookie-config.js";
import { InMemoryCookieStore } from "../src/core/auth/server-cookie-store.js";
import { WebAuthSessionAdapter } from "../src/core/auth/web-session-adapter.js";

const TOKENS: AuthTokens = {
  accessToken: "access-value",
  refreshToken: "refresh-value",
  accessTokenExpiresIn: 900,
  refreshTokenExpiresIn: 1209600,
  tokenType: "Bearer",
};

function makeAdapter(store = new InMemoryCookieStore()) {
  return { store, adapter: new WebAuthSessionAdapter({ cookieStore: store, env: "development" }) };
}

test("lecture access/refresh depuis les cookies", async () => {
  const { store, adapter } = makeAdapter();
  store.set("enistere_access", "A", { httpOnly: true, secure: false, sameSite: "lax", path: "/", maxAge: 900 });
  store.set("enistere_refresh", "R", { httpOnly: true, secure: false, sameSite: "lax", path: "/", maxAge: 900 });
  assert.equal(await adapter.getAccessToken(), "A");
  assert.equal(await adapter.getRefreshToken(), "R");
});

test("absence de cookie → null", async () => {
  const { adapter } = makeAdapter();
  assert.equal(await adapter.getAccessToken(), null);
  assert.equal(await adapter.getRefreshToken(), null);
});

test("updateTokens pose les DEUX cookies", async () => {
  const { store, adapter } = makeAdapter();
  await adapter.updateTokens(TOKENS);
  assert.equal(store.get("enistere_access"), "access-value");
  assert.equal(store.get("enistere_refresh"), "refresh-value");
});

test("clearSession supprime les DEUX cookies, idempotent", async () => {
  const { store, adapter } = makeAdapter();
  await adapter.updateTokens(TOKENS);
  await adapter.clearSession();
  assert.equal(store.get("enistere_access"), undefined);
  assert.equal(store.get("enistere_refresh"), undefined);
  await assert.doesNotReject(() => adapter.clearSession());
});

test("token vide rejeté", async () => {
  const { adapter } = makeAdapter();
  await assert.rejects(() => adapter.updateTokens({ ...TOKENS, accessToken: "" }), CookieConfigError);
  await assert.rejects(() => adapter.updateTokens({ ...TOKENS, refreshToken: "   " }), CookieConfigError);
});

test("token avec caractère de contrôle rejeté", async () => {
  const { adapter } = makeAdapter();
  const withControl = `tok${String.fromCharCode(10)}en`;
  await assert.rejects(() => adapter.updateTokens({ ...TOKENS, accessToken: withControl }), CookieConfigError);
});

test("durée invalide rejetée", async () => {
  const { adapter } = makeAdapter();
  await assert.rejects(() => adapter.updateTokens({ ...TOKENS, accessTokenExpiresIn: 0 }), CookieConfigError);
  await assert.rejects(() => adapter.updateTokens({ ...TOKENS, refreshTokenExpiresIn: -1 }), CookieConfigError);
});

test("aucune valeur de token dans les messages d'erreur", async () => {
  const { adapter } = makeAdapter();
  const secret = "SUPER-SECRET-TOKEN-VALUE";
  await adapter.updateTokens({ ...TOKENS, accessToken: secret }).catch(() => {
    /* succès attendu — pas d'erreur ici */
  });
  // Erreur sur durée invalide alors qu'un token "secret" est fourni : le message ne doit pas le contenir.
  try {
    await adapter.updateTokens({ ...TOKENS, accessToken: secret, accessTokenExpiresIn: -5 });
    assert.fail("aurait dû lever");
  } catch (error) {
    assert.ok(error instanceof Error);
    assert.ok(!error.message.includes(secret), "le message d'erreur ne doit pas contenir le token");
  }
});
