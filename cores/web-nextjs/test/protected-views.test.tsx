import "./helpers/dom-setup.js";

import assert from "node:assert/strict";
import { afterEach, test } from "node:test";

import { cleanup, render } from "@testing-library/react";
import { axe } from "jest-axe";

import { ProtectedNotice } from "../src/features/auth/protected-notice.js";
import { ServiceUnavailableView } from "../src/features/auth/service-unavailable-view.js";

afterEach(() => {
  cleanup();
});

const axeOptions = { rules: { region: { enabled: false } } } as const;

test("ServiceUnavailableView — message générique + requestId, aucun token, role alert", async () => {
  const { container, getByRole } = render(
    <ServiceUnavailableView requestId="req-42" retryHref="/protected" />,
  );
  const alert = getByRole("alert");
  assert.ok(alert.textContent?.includes("indisponible"));
  assert.ok(alert.textContent?.includes("req-42"));
  // Lien de réessai server-safe (rechargement → nouvelle résolution serveur).
  const link = container.querySelector("a");
  assert.equal(link?.getAttribute("href"), "/protected");
  // Aucune donnée sensible.
  assert.ok(!container.innerHTML.toLowerCase().includes("token"));
  const results = await axe(container, axeOptions);
  assert.equal(results.violations.length, 0, results.violations.map((v) => v.id).join(", "));
});

test("ServiceUnavailableView — sans requestId ni lien : rend quand même un message", () => {
  const { getByRole } = render(<ServiceUnavailableView />);
  assert.ok(getByRole("alert").textContent?.includes("indisponible"));
});

test("ProtectedNotice — titre d'accès protégé, aucune valeur de token codée en dur", async () => {
  const { container } = render(<ProtectedNotice />);
  assert.ok(container.textContent?.includes("Accès protégé validé"));
  // Le mot « token » figure dans la prose explicative ; on vérifie l'absence de **valeur** sensible.
  const html = container.innerHTML.toLowerCase();
  assert.ok(!html.includes("accesstoken") && !html.includes("refreshtoken") && !html.includes("bearer"));
  const results = await axe(container, axeOptions);
  assert.equal(results.violations.length, 0, results.violations.map((v) => v.id).join(", "));
});
