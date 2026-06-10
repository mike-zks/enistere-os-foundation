import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

/**
 * Provisionnement E2E (éphémère, jamais en production). Les UTILISATEURS sont seedés en amont par le
 * workflow (script API `proof-seed-user.ts` — il n'existe pas d'inscription publique). Ici on se contente
 * de fonctions HTTP : attendre que le Web réponde, se connecter à l'API en tant que propriétaire, et
 * **téléverser un fichier VALIDATED** dont l'id est écrit dans `e2e/.state.json` (lu par `files.spec.ts`).
 *
 * **Aucun secret n'est journalisé** : ni mot de passe, ni token, ni URL signée.
 */
const API_URL = process.env.E2E_API_URL ?? "http://127.0.0.1:3001";
const WEB_URL = process.env.E2E_WEB_URL ?? "http://127.0.0.1:3100";
const EMAIL = process.env.E2E_EMAIL ?? "";
const PASSWORD = process.env.E2E_PASSWORD ?? "";

// PNG 1×1 (70 octets) — donnée de test jetable.
const PNG_B64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

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

  // Connexion API directe (propriétaire) — le token reste en mémoire, jamais journalisé.
  const loginRes = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  });
  if (!loginRes.ok) throw new Error(`login API échoué (HTTP ${loginRes.status})`);
  const loginBody = (await loginRes.json()) as { data?: { accessToken?: string } };
  const accessToken = loginBody.data?.accessToken;
  if (!accessToken) throw new Error("accessToken absent de la réponse login");

  // Téléversement d'un fichier VALIDATED (auto-finalisé par l'API).
  const bytes = Buffer.from(PNG_B64, "base64");
  const form = new FormData();
  form.append("file", new Blob([bytes], { type: "image/png" }), "e2e-fixture.png");
  form.append("category", "IMAGE");
  const upRes = await fetch(`${API_URL}/files`, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
    body: form,
  });
  if (!upRes.ok) throw new Error(`upload fichier échoué (HTTP ${upRes.status})`);
  const upBody = (await upRes.json()) as { data?: { id?: string; status?: string } };
  const fileId = upBody.data?.id;
  if (!fileId || upBody.data?.status !== "VALIDATED") {
    throw new Error(`fichier non VALIDATED (id=${String(fileId)}, status=${String(upBody.data?.status)})`);
  }

  const stateDir = dirname(fileURLToPath(import.meta.url));
  writeFileSync(
    join(stateDir, ".state.json"),
    JSON.stringify({ fileId, originalName: "e2e-fixture.png", size: bytes.length }, null, 2),
    "utf8",
  );
  // eslint-disable-next-line no-console
  console.log(`[e2e] fixture VALIDATED prête (id masqué=${fileId.slice(0, 8)}…)`);
}
