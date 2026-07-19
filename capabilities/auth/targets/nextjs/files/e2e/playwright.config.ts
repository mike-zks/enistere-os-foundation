import { defineConfig, devices } from "@playwright/test";

/**
 * Configuration E2E navigateur — composition `base + auth`. Ce fichier REMPLACE
 * (remplacement déclaré par l'overlay Auth) la config de la baseline pour
 * ajouter le provisionnement (`globalSetup` : attente des services + preuve de
 * connexion API). Les serveurs et dépendances jetables sont démarrés en amont.
 */
const WEB_URL = process.env.E2E_WEB_URL ?? "http://127.0.0.1:3100";

export default defineConfig({
  testDir: "./e2e",
  globalSetup: "./e2e/global-setup.ts",
  // Sérialisé : les parcours partagent un utilisateur éphémère ; on évite les courses.
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  timeout: 30_000,
  expect: { timeout: 10_000 },
  // Pas de rapport HTML auto-ouvert ; pas d'upload d'artefact par défaut (cf. mission Deployment 3).
  reporter: [["list"]],
  use: {
    baseURL: WEB_URL,
    // Traces/captures UNIQUEMENT en cas d'échec (jamais de cookie/URL signée en succès).
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "off",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
