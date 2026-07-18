import { ApiClientError } from "@enistere/api-client-fetch";
import assert from "node:assert/strict";
import { test } from "node:test";

import { mapApiErrorToPublicMessage } from "../src/core/api/errors/map-api-error.js";

test("network : message générique, requestId conservé, cause NON exposée", () => {
  const v = mapApiErrorToPublicMessage(ApiClientError.network("boom interne", "rid-1", new Error("secret")));
  assert.equal(v.kind, "network");
  assert.equal(v.requestId, "rid-1");
  assert.ok(v.message.length > 0);
  assert.ok(!/boom|secret/.test(v.message), "ne doit pas exposer la cause");
});

test("timeout", () => {
  const v = mapApiErrorToPublicMessage(ApiClientError.timeout("rid-2"));
  assert.equal(v.kind, "timeout");
  assert.equal(v.requestId, "rid-2");
});

test("invalid_response", () => {
  const v = mapApiErrorToPublicMessage(new ApiClientError({ kind: "invalid_response", message: "x" }));
  assert.equal(v.kind, "invalid_response");
});

test("HTTP 401/403 normalisés sans workflow d'auth", () => {
  assert.equal(mapApiErrorToPublicMessage(ApiClientError.fromHttp(401, undefined, null)).status, 401);
  assert.equal(mapApiErrorToPublicMessage(ApiClientError.fromHttp(403, undefined, null)).status, 403);
});

test("HTTP 429 / 500 / 503 produisent des messages distincts non vides", () => {
  for (const status of [429, 500, 503]) {
    const v = mapApiErrorToPublicMessage(ApiClientError.fromHttp(status, undefined, null));
    assert.equal(v.status, status);
    assert.ok(v.message.length > 0);
  }
});

test("erreur inconnue (non-ApiClientError)", () => {
  const v = mapApiErrorToPublicMessage(new Error("oops"));
  assert.equal(v.kind, "unknown");
  assert.equal(v.requestId, null);
  assert.ok(!/oops/.test(v.message));
});
