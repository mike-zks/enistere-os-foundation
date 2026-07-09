"use client";

import { Alert, Text } from "@enistere/ui-kit";
import type { ReactElement } from "react";

import { formatDateTime, formatFileSize } from "../../core/files/format.js";
import { EmptyState } from "../../shared/components/empty-state.js";
import { classifyFileError } from "./file-error.js";
import { useFileList } from "./use-file-list.js";

export interface FileListViewProps {
  readonly limit?: number;
  readonly offset?: number;
}

/**
 * Vue liste **paginée** des fichiers possédés. Affiche uniquement des champs publics (jamais
 * bucket/storageKey/checksum/ownerId/metadata interne). Pagination offset-based via liens Next.js.
 * États : chargement / vide / erreur / liste. `"use client"` — appelle `useFileList` (TanStack Query).
 */
export function FileListView({ limit = 20, offset = 0 }: FileListViewProps): ReactElement {
  const { data, isLoading, isError, error } = useFileList({ limit, offset });

  if (isLoading) {
    return (
      <div role="status" aria-live="polite">
        <Text as="p" variant="body" tone="muted">
          Chargement…
        </Text>
      </div>
    );
  }

  if (isError) {
    const err = classifyFileError(error);
    return (
      <Alert variant="danger" role="alert">
        {err.message}
      </Alert>
    );
  }

  if (!data || data.items.length === 0) {
    return (
      <EmptyState
        title="Aucun fichier"
        description="Vous n'avez pas encore déposé de fichier."
        action={<a href="/protected/files/upload">Déposer un fichier</a>}
        inline
      />
    );
  }

  const hasPrev = offset > 0;
  const hasNext = data.nextOffset !== null;
  const prevOffset = Math.max(0, offset - limit);

  return (
    <>
      <ul aria-label="Liste des fichiers">
        {data.items.map((file) => (
          <li key={file.id}>
            <a href={`/protected/files/${file.id}`}>{file.originalName}</a>
            <Text as="span" variant="body">
              {file.mimeType}
            </Text>
            <Text as="span" variant="body">
              {formatFileSize(file.size)}
            </Text>
            <Text as="span" variant="body">
              {file.category}
            </Text>
            <Text as="span" variant="body">
              {file.status}
            </Text>
            <Text as="span" variant="body">
              {file.visibility}
            </Text>
            <Text as="span" variant="body">
              {formatDateTime(file.createdAt)}
            </Text>
          </li>
        ))}
      </ul>
      <nav aria-label="Pagination">
        {hasPrev ? (
          <a href={`/protected/files?offset=${prevOffset}&limit=${limit}`}>Précédent</a>
        ) : null}
        {hasNext ? (
          <a href={`/protected/files?offset=${data.nextOffset}&limit=${limit}`}>Suivant</a>
        ) : null}
      </nav>
    </>
  );
}
