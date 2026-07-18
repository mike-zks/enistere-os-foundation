/**
 * Fabriques de query keys du domaine Health.
 *
 * Clés **stables**, **readonly**, **sérialisables** : aucune URL, aucun objet Fetch, aucun secret,
 * aucun timestamp. Convention par domaine (les futurs domaines auront leur propre fabrique sous
 * `core/query/keys/` ou `features/<domaine>/queries/`).
 */
export const healthKeys = {
  all: ["health"] as const,
  status: () => [...healthKeys.all, "status"] as const,
  live: () => [...healthKeys.all, "live"] as const,
  ready: () => [...healthKeys.all, "ready"] as const,
} as const;
