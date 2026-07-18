import "./helpers/dom-setup.js";

import assert from "node:assert/strict";
import { afterEach, test } from "node:test";

import { cleanup, fireEvent, render } from "@testing-library/react";
import { axe } from "jest-axe";

import { LoginForm } from "../src/features/auth/login-form.js";

afterEach(() => {
  cleanup();
});

const axeOptions = { rules: { region: { enabled: false } } } as const;
const noop = (): void => {};

function fill(getByLabelText: (m: RegExp) => HTMLElement, email: string, password: string): void {
  fireEvent.change(getByLabelText(/adresse e-mail/i), { target: { value: email } });
  fireEvent.change(getByLabelText(/mot de passe/i), { target: { value: password } });
}

test("rendu : labels, autoComplete, types, bouton submit", () => {
  const { getByLabelText, getByRole } = render(<LoginForm onSubmit={noop} isSubmitting={false} />);
  const email = getByLabelText(/adresse e-mail/i);
  const password = getByLabelText(/mot de passe/i);
  assert.equal(email.getAttribute("type"), "email");
  assert.equal(email.getAttribute("autocomplete"), "email");
  assert.equal(password.getAttribute("type"), "password");
  assert.equal(password.getAttribute("autocomplete"), "current-password");
  assert.ok(getByRole("button", { name: /se connecter/i }));
});

test("validation locale : submit vide → erreurs (aria-invalid), onSubmit NON appelé", () => {
  const submitted: unknown[] = [];
  const { getByRole, getByLabelText } = render(
    <LoginForm onSubmit={(v) => submitted.push(v)} isSubmitting={false} />,
  );
  fireEvent.click(getByRole("button", { name: /se connecter/i }));
  assert.equal(submitted.length, 0, "pas de soumission si invalide");
  assert.equal(getByLabelText(/adresse e-mail/i).getAttribute("aria-invalid"), "true");
  assert.equal(getByLabelText(/mot de passe/i).getAttribute("aria-invalid"), "true");
});

test("soumission valide → onSubmit(email trim, password inchangé)", () => {
  const submitted: Array<{ email: string; password: string }> = [];
  const { getByRole, getByLabelText } = render(
    <LoginForm onSubmit={(v) => submitted.push(v)} isSubmitting={false} />,
  );
  fill(getByLabelText, "  user@example.test  ", "  Secret Pw  ");
  fireEvent.click(getByRole("button", { name: /se connecter/i }));
  assert.deepEqual(submitted, [{ email: "user@example.test", password: "  Secret Pw  " }]);
});

test("état submitting : bouton désactivé + aria-busy, champs désactivés", () => {
  const { getByRole, getByLabelText, container } = render(
    <LoginForm onSubmit={noop} isSubmitting={true} />,
  );
  const button = getByRole("button");
  assert.ok((button as HTMLButtonElement).disabled);
  assert.equal(container.querySelector("form")?.getAttribute("aria-busy"), "true");
  assert.ok((getByLabelText(/adresse e-mail/i) as HTMLInputElement).disabled);
});

test("erreur serveur 401 : role alert + message générique + requestId, aucune valeur de mot de passe", () => {
  const { getByRole, container } = render(
    <LoginForm
      onSubmit={noop}
      isSubmitting={false}
      serverError={{ message: "Adresse e-mail ou mot de passe incorrect.", requestId: "req-1", status: 401 }}
    />,
  );
  const alert = getByRole("alert");
  assert.ok(alert.textContent?.includes("incorrect"));
  assert.ok(container.textContent?.includes("req-1"));
});

test("erreur serveur 429 affichée", () => {
  const { getByRole } = render(
    <LoginForm onSubmit={noop} isSubmitting={false} serverError={{ message: "Trop de tentatives. Réessayez plus tard." }} />,
  );
  assert.ok(getByRole("alert").textContent?.includes("Trop de tentatives"));
});

test("le mot de passe saisi n'apparaît pas dans le texte rendu (uniquement la valeur du champ)", () => {
  const { getByLabelText, container } = render(<LoginForm onSubmit={noop} isSubmitting={false} />);
  fill(getByLabelText, "user@example.test", "VISIBLE-LEAK-CHECK");
  assert.ok(!container.textContent?.includes("VISIBLE-LEAK-CHECK"), "jamais en texte visible/sérialisé");
});

test("a11y : initial / erreurs / submitting / erreur serveur — aucune violation", async () => {
  for (const node of [
    <LoginForm key="i" onSubmit={noop} isSubmitting={false} />,
    <LoginForm key="s" onSubmit={noop} isSubmitting={true} />,
    <LoginForm key="e" onSubmit={noop} isSubmitting={false} serverError={{ message: "Échec de connexion." }} />,
  ]) {
    const { container, unmount } = render(node);
    const results = await axe(container, axeOptions);
    assert.equal(results.violations.length, 0, results.violations.map((v) => v.id).join(", "));
    unmount();
  }

  // état avec erreurs de validation
  const { container, getByRole } = render(<LoginForm onSubmit={noop} isSubmitting={false} />);
  fireEvent.click(getByRole("button", { name: /se connecter/i }));
  const results = await axe(container, axeOptions);
  assert.equal(results.violations.length, 0, results.violations.map((v) => v.id).join(", "));
});
