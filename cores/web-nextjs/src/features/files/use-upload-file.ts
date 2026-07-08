"use client";

import { useMutation } from "@tanstack/react-query";
import { useRef } from "react";

import type { FileCategory } from "@enistere/api-client-fetch";

import { getCsrfToken } from "../../core/auth/client/csrf-client.js";
import { uploadFile } from "../../core/files/client/files-bff-client.js";
import type { PublicStoredFile } from "../../core/files/client/files-bff-client.js";
import { classifyFileError, type FileError } from "./file-error.js";

export interface UploadFileInput {
  readonly file: File;
  readonly category: FileCategory;
  readonly subjectId?: string;
}

export interface UseUploadFileResult {
  /** Lance l'upload. Anti double-soumission. */
  readonly upload: (input: UploadFileInput) => void;
  readonly isPending: boolean;
  /** Fichier enregistré après succès (jamais en cache). */
  readonly uploadedFile?: PublicStoredFile;
  readonly error?: FileError;
  readonly reset: () => void;
}

/**
 * Mutation d'**upload** : `getCsrfToken()` → `POST /api/files/upload` multipart. La réponse (`PublicStoredFile`)
 * est retournée via `uploadedFile` mais **jamais mise en cache** (`mutationKey` absent). **Anti-double-soumission**
 * via `useRef`. Session via cookies HttpOnly uniquement (ADR-005). L'API Core reste l'autorité (ADR-007).
 */
export function useUploadFile(): UseUploadFileResult {
  const inFlight = useRef(false);

  const mutation = useMutation<PublicStoredFile, unknown, UploadFileInput>({
    mutationFn: async ({ file, category, subjectId }) => {
      const csrfToken = await getCsrfToken();
      const form = new FormData();
      form.append("file", file);
      form.append("category", category);
      if (subjectId !== undefined && subjectId.length > 0) {
        form.append("subjectId", subjectId);
      }
      return uploadFile(form, csrfToken);
    },
  });

  const upload = (input: UploadFileInput): void => {
    if (inFlight.current) return;
    inFlight.current = true;
    mutation.mutate(input, {
      onSettled: () => {
        inFlight.current = false;
      },
    });
  };

  return {
    upload,
    isPending: mutation.isPending,
    uploadedFile: mutation.isSuccess ? mutation.data : undefined,
    error: mutation.isError ? classifyFileError(mutation.error) : undefined,
    reset: mutation.reset,
  };
}
