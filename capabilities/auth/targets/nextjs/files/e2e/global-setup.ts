/**
 * Provisionnement E2E de la composition `base + auth` (éphémère, jamais en
 * production). Les UTILISATEURS sont seedés en amont (il n'existe pas
 * d'inscription publique). Ici : attendre que l'API et le Web répondent et
 * vérifier que la connexion API fonctionne. **Aucun secret n'est journalisé.**
 */
const API_URL = process.env.E2E_API_URL ?? "http://127.0.0.1:3001";
const WEB_URL = process.env.E2E_WEB_URL ?? "http://127.0.0.1:3100";
const EMAIL = process.env.E2E_EMAIL ?? "";
const PASSWORD = process.env.E2E_PASSWORD ?? "";

async function waitFor(url: string, label: string, tries = 60): Promise<void> {
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(url, { redirect: "manual" });
      if (res.status > 0) return;
    } catch {
      /* pas encore prêt */
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error(`${label} injoignable: ${url}`);
}

export default async function globalSetup(): Promise<void> {
  if (EMAIL === "" || PASSWORD === "") {
    throw new Error("E2E_EMAIL / E2E_PASSWORD manquants (seed utilisateur requis avant Playwright).");
  }
  await waitFor(`${API_URL}/health`, "API");
  await waitFor(`${WEB_URL}/`, "Web");

  const loginRes = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  });
  if (!loginRes.ok) throw new Error(`login API échoué (HTTP ${loginRes.status})`);
}
