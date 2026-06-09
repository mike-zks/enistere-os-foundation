import { queryOptions } from "@tanstack/react-query";

import {
  fetchAuthorization,
  fetchSessionProfile,
  type UserProfile,
} from "../../core/auth/client/auth-bff-client.js";
import { BffAuthError } from "../../core/auth/client/bff-error.js";
import { authKeys } from "../../core/query/keys/auth-keys.js";

/** Résultat de la query de session : authentifié (profil) ou anonyme (401). */
export type SessionResult =
  | { readonly status: "authenticated"; readonly user: UserProfile }
  | { readonly status: "anonymous" };

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

/** Options de la query d'autorisation — **activée uniquement** si la session est authentifiée. */
export function authorizationQueryOptions(enabled: boolean) {
  return queryOptions({
    queryKey: authKeys.authorization(),
    queryFn: ({ signal }) => fetchAuthorization(signal),
    enabled,
    retry: false,
    staleTime: 30_000,
    gcTime: 5 * 60_000,
  });
}
