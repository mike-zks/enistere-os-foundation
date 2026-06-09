import "./helpers/dom-setup.js";

import assert from "node:assert/strict";
import { afterEach, test } from "node:test";

import { cleanup, render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { axe } from "jest-axe";

import { HealthProbeView } from "../src/features/health/health-probe-view.js";

afterEach(() => {
  cleanup();
});

const axeOptions = { rules: { region: { enabled: false } } } as const;

test("état non configuré : libellé + aucun bouton", () => {
  render(<HealthProbeView label="Santé" state="not-configured" />);
  assert.ok(screen.getByText("Non configuré"));
  assert.equal(screen.queryByRole("button"), null);
});

test("état chargement : spinner annoncé (role=status)", () => {
  render(<HealthProbeView label="Santé" state="loading" onRetry={() => {}} />);
  assert.ok(screen.getByRole("status"));
});

test("état succès : valeur affichée", () => {
  render(<HealthProbeView label="Santé" state="success" value="ok" onRetry={() => {}} />);
  assert.ok(screen.getByText("ok"));
});

test("état erreur : message public + requestId + bouton Relancer appelle onRetry", async () => {
  let retried = 0;
  render(
    <HealthProbeView
      label="Santé"
      state="error"
      errorMessage="Service indisponible."
      requestId="rid-9"
      onRetry={() => {
        retried += 1;
      }}
    />,
  );
  assert.ok(screen.getByText("Service indisponible."));
  assert.ok(screen.getByText(/rid-9/));
  await userEvent.setup().click(screen.getByRole("button", { name: "Relancer" }));
  assert.equal(retried, 1);
});

test("busy : bouton Relancer désactivé", () => {
  render(<HealthProbeView label="Santé" state="loading" busy onRetry={() => {}} />);
  assert.equal((screen.getByRole("button", { name: "Relancer" }) as HTMLButtonElement).disabled, true);
});

test("a11y : aucune violation dans les états non configuré/loading/success/error", async () => {
  const cases = [
    <HealthProbeView key="n" label="Santé" state="not-configured" />,
    <HealthProbeView key="l" label="Santé" state="loading" onRetry={() => {}} />,
    <HealthProbeView key="s" label="Santé" state="success" value="ok" onRetry={() => {}} />,
    <HealthProbeView key="e" label="Santé" state="error" errorMessage="x" onRetry={() => {}} />,
  ];
  for (const element of cases) {
    const { container, unmount } = render(element);
    const results = await axe(container, axeOptions);
    assert.equal(results.violations.length, 0, `violations: ${results.violations.map((v) => v.id).join(", ")}`);
    unmount();
  }
});
