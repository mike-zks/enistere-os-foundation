import assert from "node:assert/strict";
import { afterEach, test } from "node:test";

import { ApiUrlError, normalizeApiBaseUrl } from "../src/core/config/api-url.js";
import { getPublicApiUrl, isPublicApiConfigured } from "../src/core/config/public-config.js";
import { getServerApiUrl, isServerApiConfigured } from "../src/core/config/server-config.js";

const ORIG_SERVER = process.env.API_INTERNAL_URL;
const ORIG_PUBLIC = process.env.NEXT_PUBLIC_API_URL;

afterEach(() => {
  if (ORIG_SERVER === undefined) delete process.env.API_INTERNAL_URL;
  else process.env.API_INTERNAL_URL = ORIG_SERVER;
  if (ORIG_PUBLIC === undefined) delete process.env.NEXT_PUBLIC_API_URL;
  else process.env.NEXT_PUBLIC_API_URL = ORIG_PUBLIC;
});

test("normalize : URL https valide conservée", () => {
  assert.equal(normalizeApiBaseUrl("https://api.test"), "https://api.test");
});

test("normalize : trailing slash retiré (origine et chemin)", () => {
  assert.equal(normalizeApiBaseUrl("https://api.test/"), "https://api.test");
  assert.equal(normalizeApiBaseUrl("https://api.test/base/"), "https://api.test/base");
});

test("normalize : http accepté (dev)", () => {
  assert.equal(normalizeApiBaseUrl("http://localhost:3000"), "http://localhost:3000");
});

test("normalize : credentials dans l'URL interdits", () => {
  assert.throws(() => normalizeApiBaseUrl("https://user:pass@api.test"), ApiUrlError);
});

test("normalize : protocole non http(s) rejeté", () => {
  assert.throws(() => normalizeApiBaseUrl("ftp://api.test"), ApiUrlError);
});

test("normalize : URL relative rejetée", () => {
  assert.throws(() => normalizeApiBaseUrl("/api"), ApiUrlError);
});

test("normalize : wildcard d'hôte rejeté", () => {
  assert.throws(() => normalizeApiBaseUrl("https://*.api.test"), ApiUrlError);
});

test("normalize : valeur manquante ou vide rejetée", () => {
  assert.throws(() => normalizeApiBaseUrl(undefined), ApiUrlError);
  assert.throws(() => normalizeApiBaseUrl("   "), ApiUrlError);
});

test("serveur : isServerApiConfigured + getServerApiUrl (validé/normalisé)", () => {
  process.env.API_INTERNAL_URL = "https://internal.test/";
  assert.equal(isServerApiConfigured(), true);
  assert.equal(getServerApiUrl(), "https://internal.test");
  delete process.env.API_INTERNAL_URL;
  assert.equal(isServerApiConfigured(), false);
  assert.throws(() => getServerApiUrl(), ApiUrlError);
});

test("public : isPublicApiConfigured + getPublicApiUrl (validé/normalisé)", () => {
  process.env.NEXT_PUBLIC_API_URL = "https://public.test/";
  assert.equal(isPublicApiConfigured(), true);
  assert.equal(getPublicApiUrl(), "https://public.test");
  delete process.env.NEXT_PUBLIC_API_URL;
  assert.equal(isPublicApiConfigured(), false);
});
