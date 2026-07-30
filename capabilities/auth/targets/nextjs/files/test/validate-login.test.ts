import assert from "node:assert/strict";
import { test } from "node:test";

import { BodyError, readBoundedJsonBody } from "../src/features/auth/http/read-body.js";
import { LoginValidationError, parseLoginInput } from "../src/features/auth/http/validate-login.js";

// --- parseLoginInput ---

test("payload valide (email normalisé)", () => {
  const input = parseLoginInput({ email: " User@Example.test ", password: "secret" });
  assert.deepEqual(input, { email: "user@example.test", password: "secret" });
});

test("email invalide rejeté", () => {
  assert.throws(() => parseLoginInput({ email: "not-an-email", password: "x" }), LoginValidationError);
});

test("password absent rejeté", () => {
  assert.throws(() => parseLoginInput({ email: "a@b.test" }), LoginValidationError);
});

test("champs inconnus rejetés", () => {
  assert.throws(
    () => parseLoginInput({ email: "a@b.test", password: "x", role: "admin" }),
    LoginValidationError,
  );
});

test("types non-chaîne rejetés", () => {
  assert.throws(() => parseLoginInput({ email: 1, password: "x" }), LoginValidationError);
  assert.throws(() => parseLoginInput(null), LoginValidationError);
  assert.throws(() => parseLoginInput([]), LoginValidationError);
});

test("caractère de contrôle dans le mot de passe rejeté", () => {
  assert.throws(
    () => parseLoginInput({ email: "a@b.test", password: `x${String.fromCharCode(0)}y` }),
    LoginValidationError,
  );
});

// --- readBoundedJsonBody ---

function jsonRequest(body: string, contentType = "application/json"): Request {
  const headers = new Headers();
  if (contentType) headers.set("content-type", contentType);
  return new Request("https://web.test/api/auth/login", { method: "POST", headers, body });
}

test("body JSON valide lu", async () => {
  const parsed = await readBoundedJsonBody(jsonRequest(JSON.stringify({ email: "a@b.test", password: "x" })));
  assert.deepEqual(parsed, { email: "a@b.test", password: "x" });
});

test("Content-Type invalide rejeté", async () => {
  await assert.rejects(
    () => readBoundedJsonBody(jsonRequest("{}", "text/plain")),
    (e) => e instanceof BodyError && e.code === "invalid_content_type",
  );
});

test("JSON malformé rejeté", async () => {
  await assert.rejects(
    () => readBoundedJsonBody(jsonRequest("{not json")),
    (e) => e instanceof BodyError && e.code === "invalid_json",
  );
});

test("body trop volumineux rejeté", async () => {
  const huge = JSON.stringify({ email: "a@b.test", password: "p".repeat(10000) });
  await assert.rejects(
    () => readBoundedJsonBody(jsonRequest(huge)),
    (e) => e instanceof BodyError && e.code === "too_large",
  );
});
