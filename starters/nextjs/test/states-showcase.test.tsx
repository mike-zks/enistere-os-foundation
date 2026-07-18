import "./helpers/dom-setup.js";

import assert from "node:assert/strict";
import { afterEach, test } from "node:test";

import { cleanup, render, screen } from "@testing-library/react";
import { axe } from "jest-axe";

import { StatesShowcase } from "../src/features/foundation-status/states-showcase.js";

afterEach(() => {
  cleanup();
});

const axeOptions = { rules: { region: { enabled: false } } } as const;

test("StatesShowcase : démontre Alert/Card/états sans h1 (composable sous un h1 de page)", async () => {
  const { container } = render(<StatesShowcase />);
  // Section de niveau 2 (pas de h1 — la page fournit le h1 via PageHeader).
  assert.ok(screen.getByRole("heading", { level: 2, name: /États & composants/i }));
  assert.equal(screen.queryByRole("heading", { level: 1 }), null);
  // Variantes Alert présentes + consomme le UI Kit.
  assert.ok(screen.getByText("Information") && screen.getByText("Erreur"));
  assert.ok(container.querySelector(".enistere-alert") && container.querySelector(".enistere-card"));
  // Aucune VALEUR sensible (le mot « tokens » du design system est légitime ; on cible les secrets).
  const html = container.innerHTML.toLowerCase();
  assert.ok(!html.includes("accesstoken") && !html.includes("refreshtoken") && !html.includes("bearer"));
  const results = await axe(container, axeOptions);
  assert.equal(results.violations.length, 0, results.violations.map((v) => v.id).join(", "));
});
