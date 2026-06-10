import { expect, test } from "@playwright/test";
import { NOPERM_EMAIL, OWNER_EMAIL, PASSWORD, expectNoSensitiveLeak, loginViaUi, readState } from "./helpers.js";

const RANDOM_UUID = "00000000-0000-4000-8000-000000000000";

test.describe("Files (lecture / téléchargement)", () => {
  test("propriétaire : métadonnées publiques, aucun champ interne, téléchargement déclenché", async ({ page }) => {
    const { fileId, originalName } = readState();
    await loginViaUi(page, OWNER_EMAIL, PASSWORD);

    await page.goto(`/protected/files/${fileId}`);

    // Titre = nom d'origine (h1) + métadonnées publiques visibles.
    await expect(page.getByRole("heading", { level: 1, name: originalName })).toBeVisible();
    await expect(page.getByText("image/png", { exact: false })).toBeVisible();

    // Aucun champ interne exposé.
    const html = await page.content();
    for (const internal of ["storageKey", "bucket", "checksum", "ownerId", "X-Amz-Signature"]) {
      expect(html).not.toContain(internal);
    }
    await expectNoSensitiveLeak(page);

    // Téléchargement : la requête BFF download-url répond 200 et une requête vers le stockage est émise,
    // sans jamais journaliser l'URL signée.
    const downloadUrlResp = page.waitForResponse(
      (r) => r.url().includes("/download-url") && r.request().method() === "POST",
      { timeout: 15_000 },
    );
    const storageReq = page.waitForRequest((r) => /:9000(\/|$)/.test(r.url()), { timeout: 15_000 });
    await page.getByRole("button", { name: "Télécharger" }).click();

    expect((await downloadUrlResp).status()).toBe(200);
    await storageReq; // une requête directe au stockage objet a bien eu lieu
  });

  test("propriétaire : id inexistant → état « Fichier introuvable » (anti-énumération)", async ({ page }) => {
    await loginViaUi(page, OWNER_EMAIL, PASSWORD);
    await page.goto(`/protected/files/${RANDOM_UUID}`);
    await expect(page.getByText("Fichier introuvable")).toBeVisible();
  });

  test("sans permission : état « Accès refusé » (403, non révélateur)", async ({ page }) => {
    const { fileId } = readState();
    test.skip(NOPERM_EMAIL === "", "E2E_NOPERM_EMAIL non fourni");
    await loginViaUi(page, NOPERM_EMAIL, PASSWORD);
    await page.goto(`/protected/files/${fileId}`);
    await expect(page.getByText("Accès refusé")).toBeVisible();
  });
});
