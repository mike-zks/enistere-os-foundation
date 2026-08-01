import "./helpers/dom-setup.js";

import assert from "node:assert/strict";
import { afterEach, test } from "node:test";

import { cleanup, render, screen } from "@testing-library/react";

import { FoundationStatus } from "../src/core/foundation-status/foundation-status.js";

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

test("affiche la matrice d'intégrations (UI Kit / API / TanStack connectés ; Auth/Files non configurés)", () => {
  render(<FoundationStatus />);
  // « UI Kit » et « TanStack Query » apparaissent aussi dans les faits → getAllByText.
  assert.ok(screen.getAllByText(/UI Kit/).length >= 1);
  assert.ok(screen.getAllByText(/TanStack Query/).length >= 1);
  assert.ok(screen.getByText(/Client API public/));
  // Auth et Files explicitement « non configuré ».
  const notConfigured = screen.getAllByText(/non configuré/);
  assert.ok(notConfigured.length >= 2, "Auth et Files doivent être marqués non configurés");
});

test("rend un emplacement enfant (panneau Health injecté par la page)", () => {
  render(
    <FoundationStatus>
      <div data-testid="health-slot">slot</div>
    </FoundationStatus>,
  );
  assert.ok(screen.getByTestId("health-slot"));
});

test("consomme réellement le UI Kit (classes enistere-*)", () => {
  const { container } = render(<FoundationStatus />);
  assert.ok(
    container.querySelector('[class*="enistere-"]'),
    "aucune classe UI Kit rendue — le UI Kit n'est pas réellement consommé",
  );
});
