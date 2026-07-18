import assert from "node:assert/strict";
import { test } from "node:test";

import {
  generateCsrfToken,
  isValidCsrfFormat,
  validateCsrfToken,
} from "../src/core/auth/csrf/csrf-token.js";

test("génération : format base64url, longueur 256 bits (43 caractères)", () => {
  const token = generateCsrfToken();
  assert.ok(isValidCsrfFormat(token));
  assert.equal(token.length, 43);
  assert.match(token, /^[A-Za-z0-9_-]+$/);
});

test("entropie/unicité : 1000 jetons distincts", () => {
  const set = new Set<string>();
  for (let i = 0; i < 1000; i += 1) {
    set.add(generateCsrfToken());
  }
  assert.equal(set.size, 1000);
});

test("valide : cookie === header", () => {
  const t = generateCsrfToken();
  assert.equal(validateCsrfToken(t, t), true);
});

test("absent : cookie ou header manquant → false", () => {
  const t = generateCsrfToken();
  assert.equal(validateCsrfToken(undefined, t), false);
  assert.equal(validateCsrfToken(t, null), false);
  assert.equal(validateCsrfToken("", t), false);
});

test("longueur différente → false", () => {
  assert.equal(validateCsrfToken(generateCsrfToken(), `${generateCsrfToken()}x`.slice(0, 44)), false);
});

test("valeur différente (même longueur) → false", () => {
  const a = generateCsrfToken();
  let b = generateCsrfToken();
  while (b.length !== a.length) b = generateCsrfToken();
  assert.equal(validateCsrfToken(a, b), false);
});

test("format invalide → false", () => {
  assert.equal(validateCsrfToken("short", "short"), false);
  assert.equal(validateCsrfToken("a b c d e f g h i j k l m n o p", "a b c d e f g h i j k l m n o p"), false);
  assert.equal(isValidCsrfFormat("contient des espaces et symboles !"), false);
});

test("rotation : un nouveau jeton diffère", () => {
  assert.notEqual(generateCsrfToken(), generateCsrfToken());
});
