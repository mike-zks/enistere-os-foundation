import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { expect, type Page } from "@playwright/test";

export interface E2eState {
  readonly fileId: string;
  readonly originalName: string;
  readonly size: number;
}

/** Lit l'état provisionné par `global-setup.ts` (fichier VALIDATED éphémère). */
export function readState(): E2eState {
  const dir = dirname(fileURLToPath(import.meta.url));
  return JSON.parse(readFileSync(join(dir, ".state.json"), "utf8")) as E2eState;
}

export const OWNER_EMAIL = process.env.E2E_EMAIL ?? "";
export const NOPERM_EMAIL = process.env.E2E_NOPERM_EMAIL ?? "";
export const PASSWORD = process.env.E2E_PASSWORD ?? "";

/** Connexion via l'UI réelle (page `/login`) → attend l'espace protégé. */
export async function loginViaUi(page: Page, email: string, password: string): Promise<void> {
  await page.goto("/login");
  await page.getByLabel("Adresse e-mail").fill(email);
  await page.getByLabel("Mot de passe").fill(password);
  await page.getByRole("button", { name: "Se connecter" }).click();
  await page.waitForURL("**/protected", { timeout: 15_000 });
  await expect(page.getByRole("heading", { level: 1, name: "Accès protégé validé" })).toBeVisible();
}

/**
 * Vérifie qu'aucune donnée sensible (token, champ interne de stockage, URL interne) n'est présente dans
 * le contenu rendu. À appeler après stabilisation de la page.
 */
export async function expectNoSensitiveLeak(page: Page): Promise<void> {
  const html = await page.content();
  for (const needle of [
    "accessToken",
    "refreshToken",
    "storageKey",
    "X-Amz-Signature",
    "API_INTERNAL_URL",
  ]) {
    expect(html).not.toContain(needle);
  }
}
