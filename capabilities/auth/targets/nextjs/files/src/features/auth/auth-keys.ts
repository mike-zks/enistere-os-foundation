/**
 * Query keys du domaine **Auth** — distinctes de `healthKeys`. Stables, readonly, sérialisables ; aucune
 * URL, aucun token, aucun cookie, aucun `userId` (données de la session **courante**), aucun timestamp.
 */
export const authKeys = {
  all: ["auth"] as const,
  session: () => [...authKeys.all, "session"] as const,
} as const;
