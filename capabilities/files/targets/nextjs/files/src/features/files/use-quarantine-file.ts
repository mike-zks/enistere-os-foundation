"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRef } from "react";

import { getCsrfToken } from "../auth/client/csrf-client.js";
import { quarantineFile } from "./client/files-bff-client.js";
import { fileKeys } from "./file-keys.js";
import { classifyFileError, type FileError } from "./file-error.js";

export interface UseQuarantineFileResult {
  /** Met le fichier en quarantaine. Anti double-clic. */
  readonly requestQuarantine: (fileId: string) => void;
  readonly isPending: boolean;
  readonly isSuccess: boolean;
  readonly error?: FileError;
  readonly reset: () => void;
}

/**
 * Mutation de **quarantaine admin** : `getCsrfToken()` → `POST /api/files/:id/quarantine`. Après succès :
 * invalide `fileKeys.all` (detail + list). **Sans `mutationKey`**. **Anti-double-soumission** (`useRef`).
 * L'API reste l'autorité (`files.quarantine` — sans ownership). Jamais de champ interne en cache.
 */
export function useQuarantineFile(): UseQuarantineFileResult {
  const queryClient = useQueryClient();
  const inFlight = useRef(false);

  const mutation = useMutation<void, unknown, string>({
    mutationFn: async (fileId) => {
      const csrfToken = await getCsrfToken();
      await quarantineFile(fileId, csrfToken);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: fileKeys.all });
    },
  });

  const requestQuarantine = (fileId: string): void => {
    if (inFlight.current) return;
    inFlight.current = true;
    mutation.mutate(fileId, {
      onSettled: () => {
        inFlight.current = false;
      },
    });
  };

  return {
    requestQuarantine,
    isPending: mutation.isPending,
    isSuccess: mutation.isSuccess,
    error: mutation.isError ? classifyFileError(mutation.error) : undefined,
    reset: () => mutation.reset(),
  };
}
