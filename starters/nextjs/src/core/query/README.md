# `core/query` — server state (TanStack Query, ADR-012)

Gestion du **server state** via `@tanstack/react-query` v5.

## Implémenté

- `query-client.ts` — `createQueryClient()` (staleTime/gcTime explicites, **retry borné** :
  jamais sur 4xx/429, borné sur réseau/5xx ; `refetchOnWindowFocus` off).
- `query-provider.tsx` — `QueryProvider` (Client Component, un `QueryClient` par instance navigateur).
- `keys/health-keys.ts` — query keys standardisées (stables, sérialisables, sans secret).

Hooks et `queryOptions` du domaine Health : voir `features/health/`. Préchargement/hydratation SSR :
voir `app/page.tsx`. Détail : [`../../../docs/tanstack-query.md`](../../../docs/tanstack-query.md).

## Hors périmètre

- **État global client** (Zustand/Redux/Jotai) : non ajouté (TanStack gère le server state).
- Devtools React Query : non inclus en V1.
- Mutations authentifiées : avec l'Auth (incrément ultérieur).

> Aucune donnée d'authentification n'est mise en cache (la mission n'en contient aucune).
