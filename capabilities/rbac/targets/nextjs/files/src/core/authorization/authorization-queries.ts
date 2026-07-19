import { queryOptions } from "@tanstack/react-query";

import { authorizationKeys } from "../query/keys/authorization-keys.js";
import { fetchAuthorization } from "./authorization-client.js";

/**
 * Options de la query d'autorisation — **activée uniquement** si la session est
 * authentifiée. Aucun retry, aucune persistance : l'état d'autorisation est
 * re-dérivé du serveur, jamais conservé comme autorité côté client.
 */
export function authorizationQueryOptions(enabled: boolean) {
  return queryOptions({
    queryKey: authorizationKeys.summary(),
    queryFn: ({ signal }) => fetchAuthorization(signal),
    enabled,
    retry: false,
    staleTime: 30_000,
    gcTime: 5 * 60_000,
  });
}
