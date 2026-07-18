import { ApiClientError } from "@enistere/api-client-fetch";
import { QueryClient } from "@tanstack/react-query";

/** Nombre maximal de tentatives supplémentaires (réseau / 5xx). */
export const MAX_QUERY_RETRIES = 2;

/**
 * Politique de retry (ADR-012). **Aucun retry** sur 4xx (400/401/403/404/409/413/**429**),
 * `invalid_response` ou `session_expired` ; retry **borné** sur `network`/`timeout` et **5xx**.
 * 429 n'est pas réessayé en V1 (pas de gestion `Retry-After`).
 */
export function shouldRetryQuery(failureCount: number, error: unknown): boolean {
  if (failureCount >= MAX_QUERY_RETRIES) {
    return false;
  }
  if (error instanceof ApiClientError) {
    if (error.kind === "network" || error.kind === "timeout") {
      return true;
    }
    if (error.kind === "session_expired") {
      return false;
    }
    // `http` ou `invalid_response` : retry uniquement sur 5xx (jamais sur 4xx, incl. 429).
    return error.status !== null && error.status >= 500;
  }
  return false;
}

/**
 * Crée un `QueryClient` configuré pour le Web Core.
 *
 * - `staleTime` court et explicite (évite un refetch immédiat après hydratation SSR) ;
 * - `gcTime` explicite ;
 * - `retry` borné selon la nature de l'erreur (cf. `shouldRetryQuery`) ;
 * - `refetchOnWindowFocus` désactivé (V1, explicite).
 *
 * Le **server state Auth** (session/autorisations) est mis en cache **séparément** via `authKeys`
 * (cf. `features/auth/auth-queries.ts`) avec `retry: false` et **sans persistance** ; la politique de
 * retry par défaut ci-dessous (`shouldRetryQuery`) s'applique aux queries **Health**. Aucun token
 * n'est mis en cache (clés stables sans secret).
 */
export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        gcTime: 5 * 60_000,
        retry: shouldRetryQuery,
        refetchOnWindowFocus: false,
        refetchOnReconnect: true,
      },
      mutations: {
        retry: false,
      },
    },
  });
}
