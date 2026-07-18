import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { redirect } from "next/navigation";
import type { ReactElement, ReactNode } from "react";

import { decideProtectedRender } from "../../core/auth/resolve-server-session.js";
import { resolveNextServerSession } from "../../core/auth/server/protected-session.js";
import { createQueryClient } from "../../core/query/query-client.js";
import { prefillSessionQuery } from "../../features/auth/auth-queries.js";
import { ServiceUnavailableView } from "../../features/auth/service-unavailable-view.js";
import { DashboardShell } from "../../features/dashboard/dashboard-shell.js";

// Espace protégé = **dynamique** : la résolution lit les cookies par requête (jamais au build). Le `build`
// ne déclenche donc aucune résolution ni appel API.
export const dynamic = "force-dynamic";

/**
 * Layout **protégé** (Server Component). Flux : résoudre la session **côté serveur** (lecture seule) →
 * `anonymous` ⇒ **redirection serveur** ; `unavailable` ⇒ **erreur de service contrôlée** (jamais
 * assimilée à anonyme, aucun contenu privé) ; `authenticated` ⇒ préremplir le cache session puis
 * **hydrater** et rendre les enfants. Aucun contenu privé n'est rendu avant validation. Aucun appel au
 * BFF local, aucun refresh, aucune écriture de cookie. **L'API reste l'autorité finale.**
 */
export default async function ProtectedLayout({
  children,
}: {
  readonly children: ReactNode;
}): Promise<ReactElement> {
  const resolution = await resolveNextServerSession();
  const decision = decideProtectedRender(resolution);

  if (decision.action === "redirect") {
    redirect(decision.location);
  }

  if (decision.action === "unavailable") {
    return (
      <main className="foundation">
        <ServiceUnavailableView requestId={decision.requestId} retryHref="/protected" />
      </main>
    );
  }

  // authenticated : hydrater le profil déjà obtenu (aucun second appel `/api/auth/me`).
  const queryClient = createQueryClient();
  prefillSessionQuery(queryClient, decision.user);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <DashboardShell>{children}</DashboardShell>
    </HydrationBoundary>
  );
}
