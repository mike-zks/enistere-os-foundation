"use client";

import { useMutation } from "@tanstack/react-query";
import { useRef } from "react";

import { getCsrfToken } from "../../core/auth/client/csrf-client.js";
import { createFileDownloadUrl } from "../../core/files/client/files-bff-client.js";
import { currentContextAllowsInsecure, triggerDownload } from "../../core/files/download.js";
import { classifyFileError, type FileError } from "./file-error.js";

export interface UseCreateDownloadUrlResult {
  /** Demande une URL signée puis déclenche le téléchargement. Anti double-clic. */
  readonly download: (fileId: string) => void;
  readonly isPending: boolean;
  readonly error?: FileError;
}

/**
 * Mutation de **téléchargement** : `getCsrfToken()` → `POST /api/files/:id/download-url` → l'URL signée est
 * **consommée immédiatement** (`triggerDownload`) **dans** la `mutationFn` puis **abandonnée**. La `mutationFn`
 * retourne `void` : l'URL n'entre **jamais** dans le cache de query/mutation, n'est ni journalisée ni
 * persistée. **Sans `mutationKey`** (aucun credential/URL en clé) ; **anti-double-soumission** (`useRef`).
 */
export function useCreateDownloadUrl(): UseCreateDownloadUrlResult {
  const inFlight = useRef(false);

  const mutation = useMutation<void, unknown, string>({
    mutationFn: async (fileId) => {
      const csrfToken = await getCsrfToken();
      const signed = await createFileDownloadUrl(fileId, csrfToken);
      triggerDownload(signed.url, { allowInsecure: currentContextAllowsInsecure() });
      // `signed` sort de portée ici : URL ni retournée, ni mise en cache, ni journalisée.
    },
  });

  const download = (fileId: string): void => {
    if (inFlight.current) return;
    inFlight.current = true;
    mutation.mutate(fileId, {
      onSettled: () => {
        inFlight.current = false;
      },
    });
  };

  return {
    download,
    isPending: mutation.isPending,
    error: mutation.isError ? classifyFileError(mutation.error) : undefined,
  };
}
