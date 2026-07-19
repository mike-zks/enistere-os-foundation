import "./helpers/dom-setup.js";

import assert from "node:assert/strict";
import { afterEach, test } from "node:test";

import { cleanup, render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { axe } from "jest-axe";

import { SessionStatusView, type SessionViewState } from "../src/features/auth/session-status-view.js";

afterEach(() => {
  cleanup();
});

const axeOptions = { rules: { region: { enabled: false } } } as const;

test("SessionStatusView — loading (spinner annoncé)", () => {
  render(<SessionStatusView state="loading" />);
  assert.ok(screen.getByRole("status"));
});

test("SessionStatusView — anonyme", () => {
  render(<SessionStatusView state="anonymous" />);
  assert.ok(screen.getByText("Session anonyme"));
});

test("SessionStatusView — authentifié (email + statut, aucun token)", () => {
  const { container } = render(<SessionStatusView state="authenticated" email="user@example.test" userStatus="ACTIVE" />);
  assert.ok(screen.getByText("user@example.test"));
  assert.ok(screen.getByText("ACTIVE"));
  assert.ok(!container.textContent?.toLowerCase().includes("token"));
});

test("SessionStatusView — erreur + Réessayer appelle onRetry", async () => {
  let retried = 0;
  render(<SessionStatusView state="error" errorMessage="Service indisponible." onRetry={() => (retried += 1)} />);
  assert.ok(screen.getByRole("alert"));
  assert.ok(screen.getByText("Service indisponible."));
  await userEvent.setup().click(screen.getByRole("button", { name: "Réessayer" }));
  assert.equal(retried, 1);
});

test("a11y — états de session", async () => {
  const states: Array<{ state: SessionViewState; email?: string; userStatus?: string; errorMessage?: string }> = [
    { state: "loading" },
    { state: "anonymous" },
    { state: "authenticated", email: "user@example.test", userStatus: "ACTIVE" },
    { state: "error", errorMessage: "x" },
  ];
  for (const props of states) {
    const { container, unmount } = render(<SessionStatusView {...props} onRetry={() => {}} />);
    const results = await axe(container, axeOptions);
    assert.equal(results.violations.length, 0, `violations: ${results.violations.map((v) => v.id).join(", ")}`);
    unmount();
  }
});
