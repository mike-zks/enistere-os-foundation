import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import type { ReactElement } from "react";

import { createServerApiClient } from "../../../core/api/server/create-server-api-client.js";
import { isServerApiConfigured } from "../../../core/config/server-config.js";
import { createQueryClient } from "../../../core/query/query-client.js";
import { CapabilityStatusSections } from "../../../core/foundation-status/capability-sections.js";
import { FoundationStatus } from "../../../core/foundation-status/foundation-status.js";
import { StatesShowcase } from "../../../core/foundation-status/states-showcase.js";
import { healthQueryOptions } from "../../../core/health/health-queries.js";
import { HealthPanel } from "../../../core/health/health-panel.js";

// Page dynamique + `no-store` : les sondes Health décrivent l'état COURANT.
export const dynamic = "force-dynamic";

/**
 * Page technique de statut du socle (`/status`) — **shell partagé, jamais écrasé par
 * une capability**. Les capabilities composées y insèrent leurs sections via le
 * registre généré (`CapabilityStatusSections`). Dynamique : précharge `health_get`.
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
        <CapabilityStatusSections />
        <StatesShowcase />
      </FoundationStatus>
    </HydrationBoundary>
  );
}
