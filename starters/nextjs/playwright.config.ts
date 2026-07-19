import { defineConfig, devices } from "@playwright/test";

/**
 * Configuration E2E navigateur (Deployment 3, niveau 3) — baseline `base`.
 *
 * Les serveurs (API NestJS + Web Next.js) et les dépendances jetables (PostgreSQL) sont démarrés
 * PAR le workflow `.github/workflows/web-e2e-ci.yml` (et par la simulation locale) AVANT Playwright :
 * cette config se contente de piloter le navigateur contre `E2E_WEB_URL` (aucun `webServer` interne, aucun
 * secret ici). Les capabilities composées remplacent ce fichier via leur overlay (remplacement déclaré)
 * pour ajouter leur provisionnement (`globalSetup`).
 */
const WEB_URL = process.env.E2E_WEB_URL ?? "http://127.0.0.1:3100";

export default defineConfig({
  testDir: "./e2e",
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
