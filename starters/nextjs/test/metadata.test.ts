import assert from "node:assert/strict";
import { test } from "node:test";

import { appMetadata } from "../src/core/config/metadata.js";

test("metadata : titre par défaut et gabarit définis", () => {
  assert.ok(appMetadata.title);
  assert.equal(appMetadata.title.default, "Enistère — Web Core");
  assert.ok(appMetadata.title.template.includes("Enistère"));
});

test("metadata : description non vide", () => {
  assert.equal(typeof appMetadata.description, "string");
  assert.ok(appMetadata.description.length > 0);
});

test("metadata : starter non indexé (robots noindex/nofollow)", () => {
  assert.deepEqual(appMetadata.robots, { index: false, follow: false });
});
