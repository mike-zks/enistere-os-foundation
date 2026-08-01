"use client";

import { useQuery } from "@tanstack/react-query";

import {
  getHealth,
  getLiveness,
  getReadiness,
  type HealthStatus,
  type LivenessStatus,
  type ReadinessStatus,
} from "../api/health/health-transport.js";
import { getPublicApiClient } from "../api/public/public-api-client.js";
import { isPublicApiConfigured } from "../config/public-config.js";
import { healthKeys } from "../query/keys/health-keys.js";

/**
 * Hooks Health (server state via TanStack Query). Utilisent le **client public** (navigateur), la
 * **clé de query** standardisée, et restent **désactivés** tant que l'API publique n'est pas
 * configurée (`enabled:false` → aucune requête, `getPublicApiClient` jamais appelé). Aucune logique
 * UI, aucune transformation d'erreur en donnée saine, aucun refresh d'authentification.
 */
export function useHealth() {
  const configured = isPublicApiConfigured();
  return useQuery<HealthStatus>({
    queryKey: healthKeys.status(),
    queryFn: ({ signal }) => getHealth(getPublicApiClient(), { signal }),
    enabled: configured,
  });
}

export function useLiveness() {
  const configured = isPublicApiConfigured();
  return useQuery<LivenessStatus>({
    queryKey: healthKeys.live(),
    queryFn: ({ signal }) => getLiveness(getPublicApiClient(), { signal }),
    enabled: configured,
  });
}

export function useReadiness() {
  const configured = isPublicApiConfigured();
  return useQuery<ReadinessStatus>({
    queryKey: healthKeys.ready(),
    queryFn: ({ signal }) => getReadiness(getPublicApiClient(), { signal }),
    enabled: configured,
    retry: false,
  });
}
