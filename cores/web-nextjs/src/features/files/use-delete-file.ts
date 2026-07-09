"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRef } from "react";

import { getCsrfToken } from "../../core/auth/client/csrf-client.js";
import { fileKeys } from "../../core/query/keys/file-keys.js";
import { deleteFile } from "../../core/files/client/files-bff-client.js";
import { classifyFileError, type FileError } from "./file-error.js";

export interface UseDeleteFileResult {
  /** Demande la suppression du fichier. Anti double-clic. */
  readonly requestDelete: (fileId: string) => void;
  readonly isPending: boolean;
  readonly isSuccess: boolean;
  readonly error?: FileError;
  readonly reset: () => void;
}

/**
 * Mutation de **suppression** : `getCsrfToken()` → `DELETE /api/files/:id`. Après succès : supprime
 * `fileKeys.detail(fileId)` du QueryCache. **Sans `mutationKey`**. **Anti-double-soumission** (`useRef`).
 */
export function useDeleteFile(): UseDeleteFileResult {
  const queryClient = useQueryClient();
  const inFlight = useRef(false);

  const mutation = useMutation<void, unknown, string>({
    mutationFn: async (fileId) => {
      const csrfToken = await getCsrfToken();
      await deleteFile(fileId, csrfToken);
    },
    onSuccess: (_data, fileId) => {
      queryClient.removeQueries({ queryKey: fileKeys.detail(fileId) });
    },
  });

  const requestDelete = (fileId: string): void => {
    if (inFlight.current) return;
    inFlight.current = true;
    mutation.mutate(fileId, {
      onSettled: () => {
        inFlight.current = false;
      },
    });
  };

  return {
    requestDelete,
    isPending: mutation.isPending,
    isSuccess: mutation.isSuccess,
    error: mutation.isError ? classifyFileError(mutation.error) : undefined,
    reset: () => mutation.reset(),
  };
}
