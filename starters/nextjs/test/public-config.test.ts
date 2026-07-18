import assert from "node:assert/strict";
import { test } from "node:test";

import { publicConfig } from "../src/core/config/public-config.js";
import { getServerConfig } from "../src/core/config/server-config.js";

test("config publique : nom d'app non vide", () => {
  assert.equal(typeof publicConfig.appName, "string");
  assert.ok(publicConfig.appName.length > 0);
});

test("config publique : aucune URL d'API requise en Web 1", () => {
  // Sans NEXT_PUBLIC_API_URL, apiBaseUrl reste null (aucun appel réseau en Web 1).
  assert.equal(publicConfig.apiBaseUrl, process.env.NEXT_PUBLIC_API_URL ?? null);
});

test("config serveur : apiInternalUrl null par défaut (serveur uniquement)", () => {
  assert.equal(getServerConfig().apiInternalUrl, process.env.API_INTERNAL_URL ?? null);
});
