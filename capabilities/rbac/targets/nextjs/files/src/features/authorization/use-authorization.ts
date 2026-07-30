"use client";

import { useQuery } from "@tanstack/react-query";

import { toPublicAuthError, type PublicAuthError } from "../auth/session-state.js";
import { authorizationQueryOptions } from "./authorization-queries.js";
import { useSession } from "../auth/use-session.js";

export interface UseAuthorizationResult {
  readonly roles: readonly string[];
  readonly permissions: readonly string[];
  readonly hasRole: (code: string) => boolean;
  readonly hasAnyRole: (codes: readonly string[]) => boolean;
  readonly hasPermission: (code: string) => boolean;
  readonly hasAllPermissions: (codes: readonly string[]) => boolean;
  readonly isLoading: boolean;
  readonly error?: PublicAuthError;
}

// Les codes de l'API sont **canoniques** ; le paramètre est seulement `trim()` (pas de normalisation
// destructive, pas de wildcard). Comparaison exacte (ADR-006 : OR pour `any`, AND pour `all`).
const normalize = (code: string): string => code.trim();

/**
 * Rôles/permissions de l'utilisateur courant (`GET /api/auth/authorization`), **activé uniquement** si
 * la session est authentifiée. Les helpers servent à l'**affichage conditionnel** — **l'API reste
 * l'autorité finale** : masquer un bouton n'est pas une protection.
 */
export function useAuthorization(): UseAuthorizationResult {
  const session = useSession();
  const query = useQuery(authorizationQueryOptions(session.isAuthenticated));

  const roles = query.data?.roles ?? [];
  const permissions = query.data?.permissions ?? [];

  return {
    roles,
    permissions,
    hasRole: (code) => roles.includes(normalize(code)),
    hasAnyRole: (codes) => codes.some((code) => roles.includes(normalize(code))),
    hasPermission: (code) => permissions.includes(normalize(code)),
    hasAllPermissions: (codes) => codes.every((code) => permissions.includes(normalize(code))),
    isLoading: session.isAuthenticated && query.isPending && query.isFetching,
    error: query.isError ? toPublicAuthError(query.error) : undefined,
  };
}
