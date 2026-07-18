import assert from "node:assert/strict";
import { afterEach, test } from "node:test";

import {
  normalizeOrigin,
  parseAllowedOrigins,
  validateRequestOrigin,
} from "../src/core/auth/http/allowed-origins.js";

const ALLOWED = ["http://localhost:3100", "https://app.enistere.test"];
const ORIG_ENV = process.env.WEB_ALLOWED_ORIGINS;
afterEach(() => {
  if (ORIG_ENV === undefined) delete process.env.WEB_ALLOWED_ORIGINS;
  else process.env.WEB_ALLOWED_ORIGINS = ORIG_ENV;
});

const v = (origin: string | null, referer: string | null = null): boolean =>
  validateRequestOrigin({ origin, referer }, ALLOWED);

test("Origin autorisée → true", () => {
  assert.equal(v("http://localhost:3100"), true);
});

test("Origin interdite → false", () => {
  assert.equal(v("https://evil.test"), false);
});

test("sous-domaine trompeur → false", () => {
  assert.equal(v("https://app.enistere.test.evil.com"), false);
});

test("suffixe trompeur → false", () => {
  assert.equal(v("https://evilapp.enistere.test"), false);
});

test("port différent → false", () => {
  assert.equal(v("http://localhost:3101"), false);
});

test("schéma différent → false", () => {
  assert.equal(v("https://localhost:3100"), false);
});

test("Origin absente + Referer valide → true", () => {
  assert.equal(v(null, "http://localhost:3100/login"), true);
});

test("Referer invalide → false", () => {
  assert.equal(v(null, "https://evil.test/login"), false);
});

test("Origin et Referer absents → false (fail-closed)", () => {
  assert.equal(v(null, null), false);
});

test("URL malformée → false", () => {
  assert.equal(v("pas-une-url"), false);
  assert.equal(normalizeOrigin("pas-une-url"), null);
});

test("wildcard de configuration rejeté", () => {
  process.env.WEB_ALLOWED_ORIGINS = "https://*.enistere.test, http://localhost:3100";
  const parsed = parseAllowedOrigins();
  assert.ok(!parsed.some((o) => o.includes("*")));
  assert.deepEqual(parsed, ["http://localhost:3100"]);
});

test("credentials dans l'URL de config rejetés", () => {
  assert.equal(normalizeOrigin("https://user:pass@app.enistere.test"), null);
});
