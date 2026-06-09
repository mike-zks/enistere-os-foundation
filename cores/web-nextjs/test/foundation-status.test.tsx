import "./helpers/dom-setup.js";

import assert from "node:assert/strict";
import { afterEach, test } from "node:test";

import { cleanup, render, screen } from "@testing-library/react";

import { FoundationStatus } from "../src/features/foundation-status/foundation-status.js";

afterEach(() => {
  cleanup();
});

test("rend un titre h1 de niveau page", () => {
  render(<FoundationStatus />);
  const h1 = screen.getByRole("heading", { level: 1 });
  assert.ok(h1.textContent && h1.textContent.length > 0);
});

test("expose un repère <main>", () => {
  render(<FoundationStatus />);
  assert.ok(screen.getByRole("main"));
});

test("affiche le statut STARTER_INITIALISE", () => {
  render(<FoundationStatus />);
  assert.ok(screen.getByText("STARTER_INITIALISE"));
});

test("consomme réellement le UI Kit (classes enistere-*)", () => {
  const { container } = render(<FoundationStatus />);
  assert.ok(
    container.querySelector('[class*="enistere-"]'),
    "aucune classe UI Kit rendue — le UI Kit n'est pas réellement consommé",
  );
});
