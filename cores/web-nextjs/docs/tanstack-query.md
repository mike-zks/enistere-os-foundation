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

Le **server state Auth** (profil/rôles/permissions) est mis en cache **côté navigateur uniquement** et
**jamais persisté** (pas de `localStorage`/`sessionStorage`, pas de `PersistQueryClient`). Aucun token
n'entre dans le cache — seules les données publiques (`{ id, email, status, … }`, `roles`, `permissions`)
y figurent.

## Provider (`core/query/query-provider.tsx` + `app/providers/app-providers.tsx`)

`QueryProvider` est un **Client Component** ; le `QueryClient` est créé **une fois par instance
navigateur** (`useState`), jamais à chaque rendu ni en global serveur. `AppProviders` l'enveloppe et est
inséré dans le layout, qui **reste un Server Component**.

## Query keys (`core/query/keys/`)

`healthKeys.all / status() / live() / ready()` et `authKeys.all / session() / authorization()` :
**stables**, **readonly**, **sérialisables**, sans URL, sans objet Fetch, sans secret, sans timestamp.
Convention par domaine. Les deux espaces de clés sont **disjoints** (`["health", …]` vs `["auth", …]`) :
purger l'un **n'affecte jamais** l'autre.

## Server state Auth (`features/auth/auth-queries.ts`)

`sessionQueryOptions()` et `authorizationQueryOptions(enabled)` :

- clés `authKeys.session()` / `authKeys.authorization()` ; `queryFn` = client BFF navigateur
  (`fetchSessionProfile` / `fetchAuthorization`) ;
- **`retry:false`** (un 401 est une réponse normale, pas un échec à réessayer) ;
- `staleTime` court ; `loadSession` **traduit le 401 en `{ status:"anonymous" }`** (pas une exception) et
  **relance** toute autre erreur (403/5xx/réseau) → `useSession` la classe en `error` ;
- `authorizationQueryOptions` est **`enabled`** seulement quand la session est authentifiée → **aucun appel
  `/authorization`** en anonyme/chargement.

### Purge au logout (`features/auth/use-logout.ts`)

Après un logout BFF réussi : `queryClient.removeQueries({ queryKey: authKeys.all })` → **session +
authorization supprimées**, **Health intact**. En cas d'**échec réseau** navigateur↔BFF : **pas de purge**
(on ne prétend pas la session terminée), l'erreur est exposée pour un retry. Invalidation possible via
`invalidateQueries({ queryKey: authKeys.all })` lorsqu'on veut un **refetch** plutôt qu'une suppression
(ex. après un changement de droits côté API, sans nouveau JWT).

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

> **Auth — Option A (client-only)** : contrairement à Health, la **session n'est pas préchargée au SSR**
> (le serveur n'appelle pas son propre BFF). `useSession` se résout **après hydratation**, côté navigateur.
> Conséquence : tant que `/me` n'a pas répondu, l'état est **`loading`** (jamais anonyme par défaut → pas de
> flash de contenu non authentifié). Le SSR Auth complet est différé (cf. `auth-architecture.md` §13).

## Devtools

Non inclus en V1 (peut être ajouté en intégration conditionnelle développement plus tard).
