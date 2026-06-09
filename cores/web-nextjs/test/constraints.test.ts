import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

// build-test/test/constraints.test.js -> ../../package.json = racine du Web Core.
const pkg = JSON.parse(
  readFileSync(new URL("../../package.json", import.meta.url), "utf8"),
) as {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
};

const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };

// Dépendances interdites en Web 1 (frontières explicites de la mission).
const FORBIDDEN = [
  "axios",
  "@tanstack/react-query",
  "@tanstack/query-core",
  "zustand",
  "orval",
  "@reduxjs/toolkit",
  "@storybook/react",
];

// Dépendances socle attendues.
const REQUIRED = [
  "next",
  "react",
  "react-dom",
  "@enistere/ui-kit",
  "@enistere/api-contracts",
  "@enistere/api-client-fetch",
];

test("aucune dépendance interdite en Web 1", () => {
  for (const dep of FORBIDDEN) {
    assert.ok(!(dep in allDeps), `dépendance interdite présente : ${dep}`);
  }
});

test("dépendances socle présentes", () => {
  for (const dep of REQUIRED) {
    assert.ok(dep in allDeps, `dépendance socle manquante : ${dep}`);
  }
});
