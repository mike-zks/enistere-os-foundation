import { expect, test } from "@playwright/test";
import { OWNER_EMAIL, PASSWORD, expectNoSensitiveLeak, loginViaUi } from "./helpers.js";

test.describe("Auth", () => {
  test("utilisateur authentifié : navigation dashboard visible sur /protected", async ({ page }) => {
    await loginViaUi(page, OWNER_EMAIL, PASSWORD);
    const nav = page.getByRole("navigation", { name: "Navigation du tableau de bord" });
    await expect(nav).toBeVisible();
    await expect(nav.getByRole("link", { name: "Accueil" })).toBeVisible();
    await expect(nav.getByRole("link", { name: "Fichiers" })).toBeVisible();
    await expect(nav.getByRole("link", { name: "Envoyer un fichier" })).toBeVisible();
    await expectNoSensitiveLeak(page);
  });

  test("anonyme : /protected redirige vers /login", async ({ page }) => {
    await page.goto("/protected");
    await page.waitForURL("**/login**", { timeout: 15_000 });
    await expect(page.getByRole("heading", { level: 1, name: "Connexion" })).toBeVisible();
    await expect(page.getByLabel("Adresse e-mail")).toBeVisible();
    // Aucun contenu privé n'a été exposé avant authentification.
    await expect(page.getByText("Accès protégé validé")).toHaveCount(0);
  });

  test("identifiants invalides : erreur générique, reste sur /login", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Adresse e-mail").fill("nobody@example.test");
    await page.getByLabel("Mot de passe").fill("wrong-password-123");
    await page.getByRole("button", { name: "Se connecter" }).click();

    await expect(page.getByRole("alert")).toBeVisible();
    expect(new URL(page.url()).pathname).toBe("/login");
    // Toujours sur le formulaire (pas d'authentification).
    await expect(page.getByLabel("Mot de passe")).toBeVisible();
  });

  test("connexion valide → /protected, puis déconnexion → /login", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Adresse e-mail").fill(OWNER_EMAIL);
    await page.getByLabel("Mot de passe").fill(PASSWORD);
    await page.getByRole("button", { name: "Se connecter" }).click();

    await page.waitForURL("**/protected", { timeout: 15_000 });
    await expect(page.getByRole("heading", { level: 1, name: "Accès protégé validé" })).toBeVisible();
    await expectNoSensitiveLeak(page);

    // Déconnexion via le panneau de session.
    await page.getByRole("button", { name: "Se déconnecter" }).click();
    await expect(page.getByRole("button", { name: "Se déconnecter" })).toHaveCount(0, { timeout: 15_000 });

    // Après logout, une re-navigation côté serveur redirige l'anonyme vers /login.
    await page.goto("/protected");
    await page.waitForURL("**/login**", { timeout: 15_000 });
    await expect(page.getByLabel("Adresse e-mail")).toBeVisible();
  });
});
