import { expect, test } from "@playwright/test";
import {
  NOPERM_EMAIL,
  OWNER_EMAIL,
  PASSWORD,
  TEST_PNG_B64,
  expectNoSensitiveLeak,
  loginViaUi,
  provisionFilesState,
  readState,
  uploadFileViaApi,
} from "./files-helpers.js";

const RANDOM_UUID = "00000000-0000-4000-8000-000000000000";

test.beforeAll(async () => {
  await provisionFilesState();
});

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

test.describe("Files (liste paginée)", () => {
  test("propriétaire : fichier seedé visible, champs publics affichés, aucun champ interne", async ({
    page,
  }) => {
    const { originalName } = readState();
    await loginViaUi(page, OWNER_EMAIL, PASSWORD);

    await page.goto("/protected/files");

    // La liste est rendue et le fichier seedé apparaît.
    await expect(page.getByRole("list", { name: "Liste des fichiers" })).toBeVisible();
    await expect(page.getByText(originalName, { exact: false })).toBeVisible();

    // Aucun champ interne exposé dans la page.
    const html = await page.content();
    for (const internal of ["storageKey", "bucket", "checksum", "ownerId", "X-Amz-Signature"]) {
      expect(html).not.toContain(internal);
    }
    await expectNoSensitiveLeak(page);
  });

  test("propriétaire : clic sur le fichier → navigation vers /protected/files/:id", async ({ page }) => {
    const { fileId, originalName } = readState();
    await loginViaUi(page, OWNER_EMAIL, PASSWORD);

    await page.goto("/protected/files");
    await expect(page.getByText(originalName, { exact: false })).toBeVisible();

    // Le lien du fichier doit pointer vers la page de détail.
    const fileLink = page.getByRole("link", { name: originalName, exact: false });
    const href = await fileLink.getAttribute("href");
    expect(href).toContain(`/protected/files/${fileId}`);

    await fileLink.click();
    await page.waitForURL(`**/protected/files/${fileId}`, { timeout: 15_000 });
    await expect(page.getByRole("heading", { level: 1, name: originalName })).toBeVisible();
  });

  test("propriétaire : 1 fichier seedé → pas de pagination (nextOffset null)", async ({ page }) => {
    await loginViaUi(page, OWNER_EMAIL, PASSWORD);

    await page.goto("/protected/files");
    await expect(page.getByRole("list", { name: "Liste des fichiers" })).toBeVisible();

    // Avec exactement 1 fichier seedé (< limit default 20) : ni « Précédent » ni « Suivant ».
    await expect(page.getByRole("link", { name: "Précédent" })).toHaveCount(0);
    await expect(page.getByRole("link", { name: "Suivant" })).toHaveCount(0);
  });

  test("anonyme : /protected/files redirige vers /login", async ({ page }) => {
    await page.goto("/protected/files");
    await page.waitForURL("**/login**", { timeout: 15_000 });
    await expect(page.getByLabel("Adresse e-mail")).toBeVisible();
    // Aucun contenu privé avant authentification.
    await expect(page.getByRole("list", { name: "Liste des fichiers" })).toHaveCount(0);
  });

  test("sans permission : liste → état erreur générique (403)", async ({ page }) => {
    test.skip(NOPERM_EMAIL === "", "E2E_NOPERM_EMAIL non fourni");
    await loginViaUi(page, NOPERM_EMAIL, PASSWORD);

    await page.goto("/protected/files");

    // L'API retourne 403 (files.read requis) → FileListView affiche une Alert role=alert.
    await expect(page.getByRole("alert")).toBeVisible();
    // Aucun fichier d'un autre propriétaire affiché.
    await expect(page.getByRole("list", { name: "Liste des fichiers" })).toHaveCount(0);
    await expectNoSensitiveLeak(page);
  });
});

test.describe("Files (upload)", () => {
  test("propriétaire : upload formulaire → succès → fichier dans liste → navigation détail", async ({
    page,
  }) => {
    await loginViaUi(page, OWNER_EMAIL, PASSWORD);

    await page.goto("/protected/files/upload");
    await expect(page.getByRole("heading", { level: 1, name: "Envoyer un fichier" })).toBeVisible();

    // Attacher un PNG 1×1 jetable — aucun contenu réel, aucun fichier local requis.
    await page.locator('input[type="file"][name="file"]').setInputFiles({
      name: "e2e-upload.png",
      mimeType: "image/png",
      buffer: Buffer.from(TEST_PNG_B64, "base64"),
    });
    await page.getByLabel("Catégorie").selectOption("IMAGE");
    await page.getByRole("button", { name: "Envoyer" }).click();

    // Succès : section de confirmation visible, nom de fichier affiché, aucun champ interne.
    await expect(page.getByRole("region", { name: "Fichier envoyé" })).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByText("e2e-upload.png", { exact: false })).toBeVisible();
    await expectNoSensitiveLeak(page);

    // Le fichier apparaît dans la liste après upload.
    await page.goto("/protected/files");
    await expect(page.getByRole("list", { name: "Liste des fichiers" })).toBeVisible();
    await expect(page.getByText("e2e-upload.png", { exact: false })).toBeVisible();

    // Navigation vers le détail via le lien de la liste.
    await page.getByRole("link", { name: "e2e-upload.png", exact: false }).first().click();
    await page.waitForURL("**/protected/files/**", { timeout: 15_000 });
    await expect(page.getByRole("heading", { level: 1, name: "e2e-upload.png" })).toBeVisible();
    await expectNoSensitiveLeak(page);
  });
});

test.describe("Files (suppression)", () => {
  test("propriétaire : suppression via Dialog → confirmation → fichier introuvable et retiré de la liste", async ({
    page,
  }) => {
    // Fixture isolée pour ce test : uploadée via API pour ne pas dépendre de l'UI upload.
    const fileId = await uploadFileViaApi("e2e-delete-fixture.png");

    await loginViaUi(page, OWNER_EMAIL, PASSWORD);
    await page.goto(`/protected/files/${fileId}`);

    // Détail chargé : le titre affiche le nom du fichier, aucun champ interne.
    await expect(
      page.getByRole("heading", { level: 1, name: "e2e-delete-fixture.png" }),
    ).toBeVisible({ timeout: 15_000 });
    await expectNoSensitiveLeak(page);

    // Ouvrir le Dialog de confirmation.
    await page.getByRole("button", { name: "Supprimer" }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(
      page.getByRole("heading", { level: 2, name: "Confirmer la suppression" }),
    ).toBeVisible();
    await expect(page.getByText("Cette action est irréversible", { exact: false })).toBeVisible();

    // Confirmer la suppression.
    await page.getByRole("button", { name: "Supprimer définitivement" }).click();

    // Après succès : navigation vers /protected (onDeleteSuccess → router.replace).
    await page.waitForURL("**/protected", { timeout: 15_000 });
    await expectNoSensitiveLeak(page);

    // Le fichier n'est plus accessible par son id (anti-énumération → état introuvable).
    await page.goto(`/protected/files/${fileId}`);
    await expect(page.getByText("Fichier introuvable")).toBeVisible({ timeout: 10_000 });

    // Le fichier ne figure plus dans la liste.
    await page.goto("/protected/files");
    await expect(page.getByRole("list", { name: "Liste des fichiers" })).toBeVisible({
      timeout: 10_000,
    });
    await expect(page.getByText("e2e-delete-fixture.png", { exact: false })).toHaveCount(0);
    await expectNoSensitiveLeak(page);
  });
});
