import { queryOptions, type QueryClient } from "@tanstack/react-query";

import { fetchSessionProfile, type UserProfile } from "./client/auth-bff-client.js";
import { BffAuthError } from "./client/bff-error.js";
import { authKeys } from "./auth-keys.js";

/** Résultat de la query de session : authentifié (profil) ou anonyme (401). */
export type SessionResult =
  | { readonly status: "authenticated"; readonly user: UserProfile }
  | { readonly status: "anonymous" };

/** Forme de cache **authentifiée** (utilisée pour l'hydratation depuis la résolution serveur). */
export function authenticatedSessionResult(user: UserProfile): SessionResult {
  return { status: "authenticated", user };
}

/**
 * Préremplit le cache TanStack Query de la **session** (`authKeys.session()`) avec un profil **déjà
 * obtenu côté serveur** — **sans** déclencher d'appel `/api/auth/me`. La forme posée est **exactement**
 * celle consommée par `sessionQueryOptions`/`useSession`, garantissant un état initial `authenticated`
 * sans flash. La fraîcheur (`staleTime`) des options évite un refetch immédiat après hydratation.
 */
export function prefillSessionQuery(queryClient: QueryClient, user: UserProfile): void {
  queryClient.setQueryData(authKeys.session(), authenticatedSessionResult(user));
}

/**
 * Charge la session. Un **401** est traité comme **anonyme** (succès de query, pas une erreur) ; toute
 * autre erreur est propagée (→ état d'erreur).
 */
async function loadSession(signal: AbortSignal | undefined): Promise<SessionResult> {
  try {
    const user = await fetchSessionProfile(signal);
    return { status: "authenticated", user };
  } catch (error) {
    if (error instanceof BffAuthError && error.status === 401) {
      return { status: "anonymous" };
    }
    throw error;
  }
}

/** Options de la query de session (source de vérité : `GET /api/auth/me`). Aucune persistance. */
export function sessionQueryOptions() {
  return queryOptions({
    queryKey: authKeys.session(),
    queryFn: ({ signal }) => loadSession(signal),
    retry: false,
    staleTime: 30_000,
    gcTime: 5 * 60_000,
  });
}
