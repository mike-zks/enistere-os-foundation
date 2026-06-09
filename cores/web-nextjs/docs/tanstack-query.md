# TanStack Query — Web Core (server state, ADR-012)

`@tanstack/react-query` v5 gère le **server state**. Pas de store global (Zustand/Redux) : un éventuel
état purement local sera ajouté quand un besoin réel apparaîtra.

## QueryClient (`core/query/query-client.ts`)

`createQueryClient()` :

- `staleTime` court explicite (évite un refetch immédiat après hydratation SSR) ;
- `gcTime` explicite ;
- `refetchOnWindowFocus` **désactivé** (V1) ; `refetchOnReconnect` activé ;
- **`retry` borné** (`shouldRetryQuery`) :
  - **réseau / timeout** → retry borné (`MAX_QUERY_RETRIES`) ;
  - **5xx** → retry borné ;
  - **4xx (400/401/403/404/409/413/429)** → **jamais** (429 sans stratégie `Retry-After`) ;
  - `session_expired`, erreurs non-`ApiClientError` → jamais.
- mutations : `retry:false`.

Aucune donnée d'authentification n'est mise en cache (la mission n'en contient aucune).

## Provider (`core/query/query-provider.tsx` + `app/providers/app-providers.tsx`)

`QueryProvider` est un **Client Component** ; le `QueryClient` est créé **une fois par instance
navigateur** (`useState`), jamais à chaque rendu ni en global serveur. `AppProviders` l'enveloppe et est
inséré dans le layout, qui **reste un Server Component**.

## Query keys (`core/query/keys/health-keys.ts`)

`healthKeys.all / status() / live() / ready()` : **stables**, **readonly**, **sérialisables**, sans URL,
sans objet Fetch, sans secret, sans timestamp. Convention par domaine pour la suite.

## Hooks (`features/health/use-health.ts`)

`useHealth / useLiveness / useReadiness` : client **public**, clés standardisées, **désactivés**
(`enabled:false`) tant que `NEXT_PUBLIC_API_URL` est absente (aucune requête, `getPublicApiClient`
jamais appelé). Aucune logique UI, aucune transformation d'erreur en donnée saine, **aucun refresh**.
`readinessQueryOptions` est plus prudent (`retry:false`).

## SSR / préchargement / hydratation (`app/page.tsx`)

1. `createQueryClient()` **par rendu** de requête ;
2. si `API_INTERNAL_URL` est configurée : `prefetchQuery(healthQueryOptions(serverClient))` ;
3. `dehydrate` → `HydrationBoundary` → composant client (`HealthPanel`) consommant la **même clé**.

Propriétés garanties :

- **Build indépendant de l'API** : la page est `force-dynamic` (+ `no-store`) — aucun appel API au build.
- **API indisponible** : `prefetchQuery` n'émet pas d'erreur ; une query en échec **n'est pas
  déshydratée** → le client refetch et affiche un **état contrôlé** (la page ne tombe jamais).
- **Pas de double requête** : `staleTime` rend la donnée hydratée fraîche → pas de refetch immédiat.
- **Aucun QueryClient global serveur** : un client par requête, jamais partagé.

## Devtools

Non inclus en V1 (peut être ajouté en intégration conditionnelle développement plus tard).
