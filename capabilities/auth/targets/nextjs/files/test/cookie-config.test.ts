import assert from "node:assert/strict";
import { afterEach, test } from "node:test";

import {
  assertValidCookieAttributes,
  assertValidCookieName,
  buildAuthCookieOptions,
  cookieName,
  CookieConfigError,
  resolveCookieEnv,
  type CookieAttributes,
} from "../src/features/auth/cookie-config.js";

const ORIG_APP_ENV = process.env.APP_ENV;
afterEach(() => {
  if (ORIG_APP_ENV === undefined) delete process.env.APP_ENV;
  else process.env.APP_ENV = ORIG_APP_ENV;
});

test("production : Secure + préfixe __Host-", () => {
  const opts = buildAuthCookieOptions("production", 900);
  assert.equal(opts.secure, true);
  assert.equal(cookieName("access", "production"), "__Host-enistere_access");
  assert.equal(cookieName("refresh", "production"), "__Host-enistere_refresh");
});

test("développement : pas de Secure, pas de préfixe __Host-", () => {
  const opts = buildAuthCookieOptions("development", 900);
  assert.equal(opts.secure, false);
  assert.equal(cookieName("access", "development"), "enistere_access");
});

test("attributs constants : HttpOnly toujours, SameSite=Lax, Path=/, pas de Domain", () => {
  const opts = buildAuthCookieOptions("production", 900);
  assert.equal(opts.httpOnly, true);
  assert.equal(opts.sameSite, "lax");
  assert.equal(opts.path, "/");
  assert.equal(opts.domain, undefined);
});

test("maxAge issu de la durée (secondes, tronqué)", () => {
  assert.equal(buildAuthCookieOptions("production", 900).maxAge, 900);
  assert.equal(buildAuthCookieOptions("production", 1209600.9).maxAge, 1209600);
});

test("durée invalide rejetée (0, négative, NaN, Infinity)", () => {
  for (const bad of [0, -1, Number.NaN, Number.POSITIVE_INFINITY]) {
    assert.throws(() => buildAuthCookieOptions("production", bad), CookieConfigError);
  }
});

test("nom de cookie invalide rejeté", () => {
  assert.throws(() => assertValidCookieName("bad name"), CookieConfigError);
  assert.throws(() => assertValidCookieName("a;b"), CookieConfigError);
  assert.doesNotThrow(() => assertValidCookieName("__Host-enistere_access"));
});

test("SameSite=None sans Secure rejeté", () => {
  const attrs: CookieAttributes = {
    httpOnly: true,
    secure: false,
    sameSite: "none",
    path: "/",
    maxAge: 900,
  };
  assert.throws(() => assertValidCookieAttributes("enistere_access", attrs), CookieConfigError);
});

test("__Host- exige Secure, Path=/ et aucun Domain", () => {
  const insecure: CookieAttributes = { httpOnly: true, secure: false, sameSite: "lax", path: "/", maxAge: 900 };
  assert.throws(() => assertValidCookieAttributes("__Host-x", insecure), CookieConfigError);
  const withDomain: CookieAttributes = { httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 900, domain: "example.test" };
  assert.throws(() => assertValidCookieAttributes("__Host-x", withDomain), CookieConfigError);
  const ok: CookieAttributes = { httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 900 };
  assert.doesNotThrow(() => assertValidCookieAttributes("__Host-x", ok));
});

test("resolveCookieEnv lit APP_ENV", () => {
  process.env.APP_ENV = "production";
  assert.equal(resolveCookieEnv(), "production");
  process.env.APP_ENV = "test";
  assert.equal(resolveCookieEnv(), "test");
  delete process.env.APP_ENV;
  assert.ok(["development", "test", "production"].includes(resolveCookieEnv()));
});
