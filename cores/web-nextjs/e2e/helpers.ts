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

const API_URL = process.env.E2E_API_URL ?? "http://127.0.0.1:3001";

// PNG 1×1 (70 octets) — donnée de test jetable, aucun contenu réel.
export const TEST_PNG_B64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

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

/**
 * Upload d'une fixture de test directement via l'API (Bearer token) pour provisionnement isolé des tests
 * de suppression. **Aucun token journalisé.** Retourne l'`id` du fichier (status VALIDATED).
 */
export async function uploadFileViaApi(name = "e2e-fixture-temp.png"): Promise<string> {
  const loginRes = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: OWNER_EMAIL, password: PASSWORD }),
  });
  if (!loginRes.ok) throw new Error(`login API échoué (${loginRes.status})`);
  const loginBody = (await loginRes.json()) as { data?: { accessToken?: string } };
  const token = loginBody.data?.accessToken;
  if (!token) throw new Error("accessToken absent de la réponse login");

  const bytes = Buffer.from(TEST_PNG_B64, "base64");
  const form = new FormData();
  form.append("file", new Blob([bytes], { type: "image/png" }), name);
  form.append("category", "IMAGE");
  const upRes = await fetch(`${API_URL}/files`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  if (!upRes.ok) throw new Error(`upload fichier API échoué (${upRes.status})`);
  const upBody = (await upRes.json()) as { data?: { id?: string; status?: string } };
  const fileId = upBody.data?.id;
  if (!fileId || upBody.data?.status !== "VALIDATED") {
    throw new Error(`fichier non VALIDATED (id=${String(fileId)}, status=${String(upBody.data?.status)})`);
  }
  return fileId;
}
