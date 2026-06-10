# État de session & autorisations (navigateur) — Web Auth 3 → 4

État de session **public** côté navigateur, dérivé du **server state** TanStack Query. **Aucun token**
n'est exposé, lu ni mis en cache. Web Auth 3 expose *l'état* (client-only) ; **Web Auth 4** ajoute un
**layout protégé** dont la session est **résolue côté serveur** puis **hydratée** (cf. §« État initial selon
l'espace »). **L'API NestJS reste l'autorité finale** sur l'authentification et les permissions.

## Source de vérité

- Session : `GET /api/auth/me` (profil public) via le **client BFF navigateur** (`core/auth/client/auth-bff-client.ts`,
  `fetchSessionProfile`). Appel **same-origin**, `credentials: "include"` (cookies `HttpOnly` envoyés par le
  navigateur, **jamais lus par le JS**). Pas de `NEXT_PUBLIC_API_URL`, pas d'appel direct à l'API.
- Autorisations : `GET /api/auth/authorization` (`fetchAuthorization`) → `{ roles, permissions }`.

Types **dérivés des contrats générés** (ADR-016) : `UserProfile = SchemaOf<"UserProfileResponseDto">`,
`AuthorizationSummary = SchemaOf<"AuthorizationSummaryResponseDto">` — aucun DTO recopié.

## Machine d'états (`core/auth/session-state.ts`, `features/auth/use-session.ts`)

| État query | `SessionState` | Sémantique |
| --- | --- | --- |
| `pending` | `loading` | `/me` en vol — **jamais anonyme par défaut** (pas de flash). |
| succès (profil) | `authenticated` | `user` exposé (sans token). |
| succès (401 mappé) | `anonymous` | Session absente/expirée — **pas une erreur**. |
| erreur (403 / 5xx / réseau / réponse invalide) | `error` | `PublicAuthError` générique. |

Le **401 est traité dans la `queryFn`** (`loadSession`) comme un **succès** `{ status:"anonymous" }` ; toute
autre erreur est **relancée** → classée `error`. Conséquence clé : **403 ≠ anonymous** (un accès refusé n'est
pas une déconnexion ; il reste distinct et visible).

### `useSession()`

Retourne `{ status, user?, error?, isLoading, isAuthenticated, isAnonymous, refetch }`. `error` est un
`PublicAuthError` (`{ status?, errorCode?, message, requestId? }`) — **message générique**, jamais de
cause/stack/cookie/token. `refetch()` redéclenche un appel `/me`.

## Lecture seule (read-only) — pas de refresh silencieux

`/api/auth/me` et `/api/auth/authorization` utilisent le client serveur en mode **read-only**
(`enableRefresh:false`) : un access expiré **ne déclenche pas** de refresh automatique → **401 → anonymous**.
Le refresh reste **explicite** (route `/api/auth/refresh` / relogin), jamais implicite sur une lecture.

## Autorisations (`features/auth/use-authorization.ts`)

`useAuthorization()` consomme la **même** query de session (clé partagée, pas de double appel `/me`) et
n'active `/authorization` **que si la session est authentifiée** (`enabled: session.isAuthenticated`) — donc
**aucun appel** en `loading`/`anonymous`.

Helpers (ADR-006, **sans wildcard**) :

| Helper | Logique |
| --- | --- |
| `hasRole(code)` | rôle présent (exact). |
| `hasAnyRole(codes)` | **OR** — au moins un rôle présent. |
| `hasPermission(code)` | permission présente (exact). |
| `hasAllPermissions(codes)` | **AND** — toutes présentes. |

Les codes de l'API sont **canoniques** ; le paramètre est seulement `trim()` (pas de minuscule forcée, pas de
`*`). Ces helpers pilotent l'**affichage conditionnel uniquement** — **masquer un bouton n'est pas une
protection** ; l'API valide et refuse (403) toute opération non autorisée.

### Changement de droits sans nouveau JWT

Les permissions sont lues **en direct** côté API. Après une modification de rôle (côté API/admin), un
`refetch`/`invalidate` de `/authorization` reflète le nouvel état **sur la même session**, **sans nouveau
JWT** — prouvé en conditions réelles (cf. preuve API). L'authentification (`/me` → 200) reste indépendante des
rôles (`/authorization` → `roles:[]`).

## Cache (`core/query/keys/auth-keys.ts`)

`authKeys = { all:["auth"], session:()=>["auth","session"], authorization:()=>["auth","authorization"] }`.
Espace de clés **disjoint** de `healthKeys`. `retry:false` (un 401 n'est pas à réessayer), `staleTime` court,
**aucune persistance** (pas de `localStorage`/`sessionStorage`/`PersistQueryClient`).

## Logout & purge (`features/auth/use-logout.ts`)

`useLogout().logout()` : `getCsrfToken()` → `POST /api/auth/logout` (en-tête `X-CSRF-Token`) → en cas de
**succès**, `queryClient.removeQueries({ queryKey: authKeys.all })` : **session + authorization purgées**,
**Health intact**. En cas d'**échec réseau** navigateur↔BFF : **pas de purge** (on ne prétend pas la session
terminée), l'erreur est exposée pour un retry. **Aucune redirection** (hors périmètre).

## État initial selon l'espace (Web Auth 4)

| Espace | État initial de `useSession` | Mécanisme |
| --- | --- | --- |
| **Public** (`/`, …) | `loading` → résolu **après hydratation** (client-only, Option A) | `useSession` appelle `/api/auth/me`. |
| **Privé** (`(protected)/…`) | **`authenticated` dès le premier rendu** (sans flash) | Le layout protégé **résout la session côté serveur** (read-only) et **préremplit** `authKeys.session()` (`prefillSessionQuery`) ; `useSession` lit la donnée **hydratée**, **sans** rappeler `/me`. |

Dans l'espace privé, la **source de vérité reste `/auth/me`** : elle est simplement résolue **côté serveur**
(lecture seule, `enableRefresh:false`) puis hydratée — pas de second appel au premier rendu. Le `refetch`
explicite et la politique `staleTime` restent inchangés. Les **autorisations** sont toujours chargées **côté
client** à la demande (non préchargées). Détail : [`protected-routes.md`](protected-routes.md).

### Logout dans l'espace privé

Après `logout` (purge `authKeys`), la page protégée ne présente plus le profil (le cache Auth est vidé) ; un
**rafraîchissement/navigation** ultérieur déclenche la **redirection serveur** (la résolution serveur voit une
session absente). Aucune redirection « sophistiquée » n'est ajoutée dans le hook (Web Auth 5).

## Hors périmètre

Pas de middleware, pas de page `/login`, pas de formulaire de connexion, pas de redirection automatique post-
logout dans le hook, pas de Server Action Auth, pas de RBAC d'administration, pas de refresh pendant le rendu
serveur. Web Auth 4 ajoute le **premier layout/route protégé** (résolution serveur + hydratation) ; la page de
connexion et la navigation Auth restent pour **Web Auth 5**. Voir [`protected-routes.md`](protected-routes.md)
et [`auth-architecture.md`](auth-architecture.md) §13.
