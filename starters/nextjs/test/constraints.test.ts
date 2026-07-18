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

// Dépendances interdites (frontières explicites de la mission Web 2).
// TanStack Query est désormais REQUIS (server state) ; Axios/Zustand/Orval restent proscrits.
const FORBIDDEN = ["axios", "zustand", "redux", "@reduxjs/toolkit", "jotai", "mobx", "orval", "@storybook/react"];

// Dépendances socle attendues.
const REQUIRED = [
  "next",
  "react",
  "react-dom",
  "@enistere/ui-kit",
  "@enistere/api-contracts",
  "@enistere/api-client-fetch",
  "@tanstack/react-query",
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
