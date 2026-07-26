import { expect, test } from "@playwright/test";
import { expectNoSensitiveLeak } from "./helpers.js";

test.describe("Health / accueil", () => {
  test("la page de statut charge avec un titre et l'état Health, sans fuite de config", async ({ page }) => {
    const response = await page.goto("/status");
    expect(response?.headers()["x-content-type-options"]).toBe("nosniff");
    expect(response?.headers()["x-frame-options"]).toBe("DENY");

    // Un seul h1 (PageHeader) ; la page technique de statut est rendue.
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

    // Panneau Health présent (libellé stable de la galerie de faits).
    await expect(page.getByText("Health", { exact: false }).first()).toBeVisible();

    // Aucune URL interne / token / secret côté navigateur.
    await expectNoSensitiveLeak(page);
  });
});
