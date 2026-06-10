"use client";

import { queryOptions, useQuery, type UseQueryResult } from "@tanstack/react-query";

import { getFileMetadata, type PublicStoredFile } from "../../core/files/client/files-bff-client.js";
import { isUuid } from "../../core/files/uuid.js";
import { fileKeys } from "../../core/query/keys/file-keys.js";

/**
 * Options de la query de **métadonnées** d'un fichier (source : `GET /api/files/:id`). **Désactivée** si
 * l'`id` n'est pas un UUID (aucune requête). `retry:false` (un 404/403 n'est pas à réessayer ; les erreurs
 * transitoires sont reprises via une action explicite « Réessayer »). Données **publiques** seulement.
 */
export function fileMetadataQueryOptions(fileId: string) {
  return queryOptions({
    queryKey: fileKeys.detail(fileId),
    queryFn: ({ signal }) => getFileMetadata(fileId, signal),
    enabled: isUuid(fileId),
    retry: false,
    staleTime: 30_000,
    gcTime: 5 * 60_000,
  });
}

export function useFileMetadata(fileId: string): UseQueryResult<PublicStoredFile> {
  return useQuery(fileMetadataQueryOptions(fileId));
}
