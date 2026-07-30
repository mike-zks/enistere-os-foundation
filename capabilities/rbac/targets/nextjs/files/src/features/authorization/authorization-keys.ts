import { authKeys } from "../auth/auth-keys.js";

/**
 * Query keys RBAC. Volontairement **dérivées de `authKeys.all`** : la purge du cache
 * Auth au logout (`removeQueries({ queryKey: authKeys.all })`) évacue donc aussi le
 * résumé d'autorisation. Aucune permission, aucun rôle et aucun secret dans la clé.
 */
export const authorizationKeys = {
  summary: () => [...authKeys.all, "authorization"] as const,
} as const;
