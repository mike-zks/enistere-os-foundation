import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import type { ReactElement } from "react";

import { createServerApiClient } from "../core/api/server/create-server-api-client.js";
import { isServerApiConfigured } from "../core/config/server-config.js";
import { createQueryClient } from "../core/query/query-client.js";
import { FoundationStatus } from "../features/foundation-status/foundation-status.js";
import { healthQueryOptions } from "../features/health/health-queries.js";
import { HealthPanel } from "../features/health/health-panel.js";

// Page dynamique + `no-store` : les sondes Health décrivent l'état COURANT. Conséquence : le `build`
// ne déclenche AUCUN appel API (rendu par requête), il reste déterministe sans API disponible.
export const dynamic = "force-dynamic";

/**
 * Page technique d'accueil. Côté serveur : précharge `health_get` (si l'API interne est configurée),
 * déshydrate, et passe l'état au client via `HydrationBoundary`. Un échec de préchargement (API
 * indisponible) n'est PAS déshydraté (`prefetchQuery` n'émet pas d'erreur) : le client refetch et
 * affiche un état contrôlé — la page ne tombe jamais.
 */
export default async function HomePage(): Promise<ReactElement> {
  const queryClient = createQueryClient();

  if (isServerApiConfigured()) {
    const serverClient = createServerApiClient();
    await queryClient.prefetchQuery(healthQueryOptions(serverClient));
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <FoundationStatus>
        <HealthPanel />
      </FoundationStatus>
    </HydrationBoundary>
  );
}
