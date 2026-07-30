"use client";

import { queryOptions, useQuery, type UseQueryResult } from "@tanstack/react-query";

import { listFiles, type FileListResponse } from "./client/files-bff-client.js";
import { fileKeys } from "./file-keys.js";

const LIST_DEFAULT_LIMIT = 20;
const LIST_DEFAULT_OFFSET = 0;

/**
 * Options de la query de **liste** de fichiers (source : `GET /api/files`). `retry:false` (les erreurs
 * sont reprises via une action explicite). Clé stable (limit+offset normalisés) — jamais de token ni
 * d'URL signée dans la clé. Données **publiques** seulement.
 */
export function fileListQueryOptions(params: { limit?: number; offset?: number } = {}) {
  const limit = params.limit ?? LIST_DEFAULT_LIMIT;
  const offset = params.offset ?? LIST_DEFAULT_OFFSET;
  return queryOptions({
    queryKey: fileKeys.list({ limit, offset }),
    queryFn: ({ signal }) => listFiles({ limit, offset }, signal),
    retry: false,
  });
}

export function useFileList(
  params?: { limit?: number; offset?: number },
): UseQueryResult<FileListResponse> {
  return useQuery(fileListQueryOptions(params));
}
