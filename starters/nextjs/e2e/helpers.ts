import { expect, type Page } from "@playwright/test";

/**
 * Helpers E2E de la baseline `base`. Les capabilities composées remplacent ce
 * fichier via leur overlay (remplacement déclaré) pour ajouter leurs helpers
 * (connexion UI, provisionnement...).
 */

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
