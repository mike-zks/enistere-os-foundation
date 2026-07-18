import type { EnistereApiClient } from "@enistere/api-client-fetch";
import { queryOptions } from "@tanstack/react-query";

import {
  getHealth,
  getLiveness,
  getReadiness,
} from "../../core/api/health/health-transport.js";
import { healthKeys } from "../../core/query/keys/health-keys.js";

/**
 * Options de query réutilisables (ADR-012) : clé unique + query function unique. Le **client** est
 * injecté afin que le **préchargement serveur** (client serveur) et le **hook navigateur** (client
 * public) partagent la même clé tout en utilisant le transport adapté à leur environnement.
 */
export function healthQueryOptions(client: EnistereApiClient) {
  return queryOptions({
    queryKey: healthKeys.status(),
    queryFn: ({ signal }) => getHealth(client, { signal }),
  });
}

export function livenessQueryOptions(client: EnistereApiClient) {
  return queryOptions({
    queryKey: healthKeys.live(),
    queryFn: ({ signal }) => getLiveness(client, { signal }),
  });
}

export function readinessQueryOptions(client: EnistereApiClient) {
  return queryOptions({
    queryKey: healthKeys.ready(),
    queryFn: ({ signal }) => getReadiness(client, { signal }),
    // Readiness : prudence accrue (dépendance dure) — aucun retry.
    retry: false,
  });
}
