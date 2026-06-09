import "./helpers/dom-setup.js";

import assert from "node:assert/strict";
import { afterEach, test } from "node:test";

import { cleanup, render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";

import { LoadingState } from "../src/shared/components/loading-state.js";
import { ErrorState } from "../src/shared/components/error-state.js";
import { NotFoundState } from "../src/shared/components/not-found-state.js";

afterEach(() => {
  cleanup();
});

test("LoadingState : role=status + libellé annoncé", () => {
  render(<LoadingState label="Chargement…" />);
  const status = screen.getByRole("status");
  assert.ok(status.textContent?.includes("Chargement"));
});

test("ErrorState : role=alert + bouton Réessayer appelle onReset", async () => {
  let resets = 0;
  render(<ErrorState onReset={() => (resets += 1)} />);
  assert.ok(screen.getByRole("alert"));
  await userEvent.setup().click(screen.getByRole("button", { name: "Réessayer" }));
  assert.equal(resets, 1);
});

test("ErrorState : sans onReset, aucun bouton", () => {
  render(<ErrorState />);
  assert.equal(screen.queryByRole("button"), null);
});

test("NotFoundState : 404 + lien d'accueil vers /", () => {
  render(<NotFoundState />);
  assert.ok(screen.getByText("404"));
  const link = screen.getByRole("link", { name: /accueil/i });
  assert.equal(link.getAttribute("href"), "/");
});
