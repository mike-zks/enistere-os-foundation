"use client";

import { useQuery } from "@tanstack/react-query";

import type { UserProfile } from "./client/auth-bff-client.js";
import { toPublicAuthError, type PublicAuthError } from "./session-state.js";
import { sessionQueryOptions } from "./auth-queries.js";

export interface UseSessionResult {
  readonly status: "loading" | "anonymous" | "authenticated" | "error";
  readonly user?: UserProfile;
  readonly error?: PublicAuthError;
  readonly isLoading: boolean;
  readonly isAuthenticated: boolean;
  readonly isAnonymous: boolean;
  readonly refetch: () => void;
}

/**
 * État de session courant (source de vérité : `GET /api/auth/me`). `pending → loading`,
 * `401 → anonymous`, succès → `authenticated`, autre erreur (dont **403**) → `error`. **Aucun token**
 * n'est renvoyé.
 */
export function useSession(): UseSessionResult {
  const query = useQuery(sessionQueryOptions());

  let status: UseSessionResult["status"];
  if (query.isPending) {
    status = "loading";
  } else if (query.isError) {
    status = "error";
  } else {
    status = query.data.status;
  }

  const user = query.data?.status === "authenticated" ? query.data.user : undefined;

  return {
    status,
    user,
    error: query.isError ? toPublicAuthError(query.error) : undefined,
    isLoading: query.isPending,
    isAuthenticated: status === "authenticated",
    isAnonymous: status === "anonymous",
    refetch: () => {
      void query.refetch();
    },
  };
}
