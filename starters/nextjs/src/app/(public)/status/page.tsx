import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import type { ReactElement } from "react";

import { createServerApiClient } from "../../../core/api/server/create-server-api-client.js";
import { isServerApiConfigured } from "../../../core/config/server-config.js";
import { createQueryClient } from "../../../core/query/query-client.js";
import { FoundationStatus } from "../../../features/foundation-status/foundation-status.js";
import { StatesShowcase } from "../../../features/foundation-status/states-showcase.js";
import { healthQueryOptions } from "../../../features/health/health-queries.js";
import { HealthPanel } from "../../../features/health/health-panel.js";

// Page dynamique + `no-store` : les sondes Health décrivent l'état COURANT.
export const dynamic = "force-dynamic";

/**
 * Page technique de statut du socle (`/status`). Contenu déplacé depuis `/` pour libérer
 * la racine à la landing page publique. Dynamique : précharge `health_get` par requête.
 */
export default async function StatusPage(): Promise<ReactElement> {
  const queryClient = createQueryClient();

  if (isServerApiConfigured()) {
    const serverClient = createServerApiClient();
    await queryClient.prefetchQuery(healthQueryOptions(serverClient));
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <FoundationStatus>
        <HealthPanel />
        <StatesShowcase />
      </FoundationStatus>
    </HydrationBoundary>
  );
}
