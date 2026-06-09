"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useState } from "react";

import { performBffLogout } from "../../core/auth/client/logout-client.js";
import { authKeys } from "../../core/query/keys/auth-keys.js";

export interface UseLogoutResult {
  readonly logout: () => Promise<void>;
  readonly isPending: boolean;
  readonly error?: string;
}

/**
 * Déconnexion : récupère un CSRF, appelle `POST /api/auth/logout`, puis **purge le cache Auth**
 * (`authKeys.all` → session + authorization) — les queries **Health restent intactes**. En cas
 * d'échec réseau navigateur↔BFF : **ne purge pas** (ne prétend pas la session supprimée) et permet un
 * retry. Aucune redirection (hors périmètre). Aucun token réinjecté.
 */
export function useLogout(): UseLogoutResult {
  const queryClient = useQueryClient();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);

  const logout = useCallback(async () => {
    setIsPending(true);
    setError(undefined);
    try {
      await performBffLogout();
      queryClient.removeQueries({ queryKey: authKeys.all });
    } catch {
      setError("Échec de déconnexion. Réessayez.");
    } finally {
      setIsPending(false);
    }
  }, [queryClient]);

  return { logout, isPending, error };
}
