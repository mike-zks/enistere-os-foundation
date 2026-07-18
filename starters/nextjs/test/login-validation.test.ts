import assert from "node:assert/strict";
import { test } from "node:test";

import { isLoginFormValid, validateLoginForm } from "../src/features/auth/login-validation.js";

test("données valides → aucune erreur", () => {
  const errors = validateLoginForm({ email: "user@example.test", password: "secret123" });
  assert.deepEqual(errors, {});
  assert.ok(isLoginFormValid(errors));
});

test("e-mail vide → erreur e-mail", () => {
  assert.ok(validateLoginForm({ email: "", password: "x" }).email !== undefined);
  assert.ok(validateLoginForm({ email: "   ", password: "x" }).email !== undefined);
});

test("e-mail invalide → erreur e-mail", () => {
  for (const bad of ["nope", "a@b", "a b@c.test", "@x.test", "x@.test"]) {
    assert.ok(validateLoginForm({ email: bad, password: "x" }).email !== undefined, bad);
  }
});

test("e-mail trop long → erreur e-mail", () => {
  const long = `${"a".repeat(250)}@x.test`;
  assert.ok(validateLoginForm({ email: long, password: "x" }).email !== undefined);
});

test("e-mail entouré d'espaces accepté (trim pour la validation)", () => {
  assert.equal(validateLoginForm({ email: "  user@example.test  ", password: "x" }).email, undefined);
});

test("mot de passe vide → erreur ; trop long → erreur", () => {
  assert.ok(validateLoginForm({ email: "user@example.test", password: "" }).password !== undefined);
  assert.ok(
    validateLoginForm({ email: "user@example.test", password: "p".repeat(201) }).password !== undefined,
  );
});

test("mot de passe avec espaces NON modifié (accepté tel quel)", () => {
  // Espaces significatifs : pas d'erreur (longueur ok), aucune transformation silencieuse.
  assert.equal(validateLoginForm({ email: "user@example.test", password: "  spaced  " }).password, undefined);
});
