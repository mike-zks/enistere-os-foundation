"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRef } from "react";

import { getCsrfToken } from "../../core/auth/client/csrf-client.js";
import { restoreFile } from "../../core/files/client/files-bff-client.js";
import { fileKeys } from "../../core/query/keys/file-keys.js";
import { classifyFileError, type FileError } from "./file-error.js";

export interface UseRestoreFileResult {
  /** Restaure le fichier (lève la quarantaine). Anti double-clic. */
  readonly requestRestore: (fileId: string) => void;
  readonly isPending: boolean;
  readonly isSuccess: boolean;
  readonly error?: FileError;
  readonly reset: () => void;
}

/**
 * Mutation de **restauration admin** : `getCsrfToken()` → `POST /api/files/:id/restore`. Après succès :
 * invalide `fileKeys.all` (detail + list). **Sans `mutationKey`**. **Anti-double-soumission** (`useRef`).
 * L'API reste l'autorité (`files.restore` — sans ownership). Jamais de champ interne en cache.
 */
export function useRestoreFile(): UseRestoreFileResult {
  const queryClient = useQueryClient();
  const inFlight = useRef(false);

  const mutation = useMutation<void, unknown, string>({
    mutationFn: async (fileId) => {
      const csrfToken = await getCsrfToken();
      await restoreFile(fileId, csrfToken);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: fileKeys.all });
    },
  });

  const requestRestore = (fileId: string): void => {
    if (inFlight.current) return;
    inFlight.current = true;
    mutation.mutate(fileId, {
      onSettled: () => {
        inFlight.current = false;
      },
    });
  };

  return {
    requestRestore,
    isPending: mutation.isPending,
    isSuccess: mutation.isSuccess,
    error: mutation.isError ? classifyFileError(mutation.error) : undefined,
    reset: () => mutation.reset(),
  };
}
