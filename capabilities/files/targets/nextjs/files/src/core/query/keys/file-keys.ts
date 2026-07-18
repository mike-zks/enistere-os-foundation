/**
 * Query keys du domaine **Files** — disjointes de `authKeys`/`healthKeys`. Stables, readonly,
 * sérialisables : l'`id` (UUID de la ressource) est admis ; **jamais** d'URL signée, de token ni d'e-mail.
 */
export const fileKeys = {
  all: ["files"] as const,
  detail: (fileId: string) => [...fileKeys.all, "detail", fileId] as const,
  list: (params: { limit: number; offset: number }) => [...fileKeys.all, "list", params] as const,
} as const;
