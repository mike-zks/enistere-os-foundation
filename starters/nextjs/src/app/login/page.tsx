import { redirect } from "next/navigation";
import type { ReactElement } from "react";

import { sanitizeReturnTo } from "../../core/auth/return-to.js";
import { resolveNextServerSession } from "../../core/auth/server/protected-session.js";
import { LoginPanel } from "./login-panel.js";

// Page **publique** mais **dynamique** : elle résout la session par requête (cookies) pour rediriger un
// utilisateur déjà authentifié. Le build ne déclenche donc aucune résolution ni appel API.
export const dynamic = "force-dynamic";

/**
 * Page de connexion. Lit et **assainit** `returnTo` (anti open-redirect → chemin interne ou `/protected`),
 * résout la session **côté serveur** (lecture seule) : un utilisateur **déjà authentifié** est **redirigé**
 * (jamais de formulaire ni de login inutile) ; un anonyme voit le formulaire ; une **indisponibilité** de
 * l'API rend tout de même le formulaire avec un état dégradé (le BFF reste l'autorité à la soumission).
 * **Aucun middleware, aucune Server Action.**
 */
export default async function LoginPage({
  searchParams,
}: {
  readonly searchParams: Promise<Record<string, string | string[] | undefined>>;
}): Promise<ReactElement> {
  const params = await searchParams;
  const rawReturnTo = params.returnTo;
  const returnTo = sanitizeReturnTo(typeof rawReturnTo === "string" ? rawReturnTo : undefined);

  const resolution = await resolveNextServerSession();
  if (resolution.status === "authenticated") {
    redirect(returnTo);
  }

  return (
    <main className="foundation" aria-labelledby="login-title">
      <LoginPanel returnTo={returnTo} serviceDegraded={resolution.status === "unavailable"} />
    </main>
  );
}
