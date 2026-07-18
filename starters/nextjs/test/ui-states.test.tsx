import "./helpers/dom-setup.js";

import assert from "node:assert/strict";
import { afterEach, test } from "node:test";

import { cleanup, render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { axe } from "jest-axe";

import { EmptyState } from "../src/shared/components/empty-state.js";
import { ForbiddenState } from "../src/shared/components/forbidden-state.js";
import { PageHeader } from "../src/shared/components/page-header.js";
import { ServiceUnavailableState } from "../src/shared/components/service-unavailable-state.js";
import { UnauthorizedState } from "../src/shared/components/unauthorized-state.js";

afterEach(() => {
  cleanup();
});

const axeOptions = { rules: { region: { enabled: false } } } as const;
async function noViolations(container: Element): Promise<void> {
  const results = await axe(container, axeOptions);
  assert.equal(results.violations.length, 0, results.violations.map((v) => v.id).join(", "));
}

test("EmptyState : titre/description/action ; informationnel (pas de role alert)", async () => {
  const { container, rerender } = render(<EmptyState title="Rien" description="Vide." />);
  assert.ok(screen.getByText("Rien"));
  assert.ok(screen.getByText("Vide."));
  assert.equal(screen.queryByRole("alert"), null);
  await noViolations(container);
  rerender(<EmptyState title="Rien" action={<a href="/x">Ajouter</a>} />);
  assert.equal(screen.getByRole("link", { name: "Ajouter" }).getAttribute("href"), "/x");
});

test("UnauthorizedState (401) : lien /login par défaut, action surchargeable", async () => {
  const { container, rerender } = render(<UnauthorizedState />);
  assert.equal(screen.getByRole("link", { name: /se connecter/i }).getAttribute("href"), "/login");
  await noViolations(container);
  rerender(<UnauthorizedState loginHref="/login?returnTo=/protected" />);
  assert.equal(
    screen.getByRole("link", { name: /se connecter/i }).getAttribute("href"),
    "/login?returnTo=/protected",
  );
});

test("ForbiddenState (403) : distinct de Unauthorized, aucune permission révélée, pas de lien login", async () => {
  const { container } = render(<ForbiddenState />);
  assert.ok(screen.getByText(/Accès refusé/i));
  assert.equal(screen.queryByRole("link", { name: /se connecter/i }), null);
  // Aucune permission interne exposée (message générique).
  assert.ok(!container.textContent?.match(/files\.|admin|permission\s+\w+\.\w+/i));
  await noViolations(container);
});

test("ServiceUnavailableState : role=alert, ≠ anonyme, requestId, retry (lien + bouton)", async () => {
  let retries = 0;
  const { container } = render(
    <ServiceUnavailableState requestId="req-9" onRetry={() => (retries += 1)} />,
  );
  const alert = screen.getByRole("alert");
  assert.ok(alert.textContent?.includes("indisponible"));
  assert.ok(alert.textContent?.includes("req-9"));
  // Ne doit pas se présenter comme une session anonyme / déconnexion.
  assert.ok(!alert.textContent?.match(/anonyme|déconnect|session expirée/i));
  await userEvent.setup().click(screen.getByRole("button", { name: /réessayer/i }));
  assert.equal(retries, 1);
  await noViolations(container);
});

test("ServiceUnavailableState : retry par lien (server-safe)", () => {
  render(<ServiceUnavailableState retryHref="/protected" />);
  assert.equal(screen.getByRole("link", { name: /réessayer/i }).getAttribute("href"), "/protected");
});

test("PageHeader : h1 par défaut, niveau configurable, eyebrow/description/actions", async () => {
  const { container, rerender } = render(
    <PageHeader
      eyebrow="Section"
      title="Titre de page"
      description="Sous-titre."
      actions={<button type="button">Action</button>}
    />,
  );
  assert.equal(screen.getByRole("heading", { level: 1 }).textContent, "Titre de page");
  assert.ok(screen.getByText("Section"));
  assert.ok(screen.getByText("Sous-titre."));
  assert.ok(screen.getByRole("button", { name: "Action" }));
  await noViolations(container);
  rerender(<PageHeader title="Titre" as="h2" />);
  assert.equal(screen.getByRole("heading", { level: 2 }).textContent, "Titre");
  assert.equal(screen.queryByRole("heading", { level: 1 }), null);
});
