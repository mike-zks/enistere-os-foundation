import assert from "node:assert/strict";
import { test } from "node:test";

import { BffAuthError } from "../src/core/auth/client/bff-error.js";
import { formatDateTime, formatFileSize } from "../src/core/files/format.js";
import { isUuid } from "../src/core/files/uuid.js";
import { classifyFileError } from "../src/features/files/file-error.js";

test("isUuid : v4 valide, rejets divers", () => {
  assert.ok(isUuid("b3f1c2d4-5e6f-4a8b-9c0d-1e2f3a4b5c6d"));
  for (const bad of ["", "not-a-uuid", "b3f1c2d4-5e6f-4a8b-9c0d", "zzzzzzzz-5e6f-4a8b-9c0d-1e2f3a4b5c6d", 42 as unknown as string]) {
    assert.equal(isUuid(bad), false, String(bad));
  }
});

test("formatFileSize : BigInt base 1024, invalide/négatif → —", () => {
  assert.equal(formatFileSize("0"), "0 B");
  assert.equal(formatFileSize("512"), "512 B");
  assert.equal(formatFileSize("1024"), "1.0 KiB");
  assert.equal(formatFileSize("1536"), "1.5 KiB");
  assert.equal(formatFileSize("1048576"), "1.0 MiB");
  assert.equal(formatFileSize("1073741824"), "1.0 GiB");
  // au-delà du Number sûr : BigInt préserve la précision, ne renvoie pas "—"
  assert.notEqual(formatFileSize("9007199254740993"), "—");
  assert.equal(formatFileSize("-5"), "—");
  assert.equal(formatFileSize("abc"), "—");
});

test("formatDateTime : UTC + locale fixe, invalide → —", () => {
  assert.equal(formatDateTime("not-a-date"), "—");
  const out = formatDateTime("2026-06-09T12:00:00.000Z");
  assert.ok(out.includes("2026") && out.includes("UTC"), out);
});

test("classifyFileError : 404/403/401/503/network/409/500/inconnu", () => {
  const http = (status: number) => new BffAuthError("http", status, null, "x", "rid");
  assert.equal(classifyFileError(http(404)).kind, "notfound");
  assert.equal(classifyFileError(http(403)).kind, "forbidden");
  assert.equal(classifyFileError(http(401)).kind, "unauthorized");
  assert.equal(classifyFileError(http(503)).kind, "unavailable");
  assert.equal(classifyFileError(new BffAuthError("network", null, "NETWORK", "x", null)).kind, "unavailable");
  assert.equal(classifyFileError(http(409)).kind, "error");
  assert.equal(classifyFileError(http(500)).kind, "error");
  assert.equal(classifyFileError(new Error("boom")).kind, "error");
  // requestId conservé, aucune fuite d'URL
  const e = classifyFileError(http(404));
  assert.equal(e.requestId, "rid");
});
