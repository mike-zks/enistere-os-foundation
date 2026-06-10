# Routes protégées — Web Core (Web Auth 4)

> Premier **layout protégé** résolu **côté serveur** (lecture seule) + première **page privée
> technique** (`/protected`). **Sans middleware, sans page de connexion, sans refresh pendant le rendu,
> sans appel du serveur vers son propre BFF.** L'**API reste l'autorité finale**. Web Core reste
> `IMPLEMENTATION_PARTIELLE`.

## 1. Stratégie SSR Auth (hybride, tranchée par le checkpoint)

| Espace | Résolution de session | Détail |
|---|---|---|
| Pages **publiques** | **Option A — client-only** | `useSession` → `/api/auth/me` après hydratation. |
| Layouts/pages **privés** | **Option C — résolution serveur read-only** | Server Component → cookies `HttpOnly` (lecture seule) → **client API serveur authentifié `read-only`** → **API NestJS `/auth/me`** → décision → hydratation. |

**Rejetées** : Option B (le serveur appelle son propre `/api/auth/me` — self-HTTP, URL absolue,
duplication) ; Option D (middleware comme autorité Auth). Voir
[`WEB_CORE_GOVERNANCE_REVIEW.md`](WEB_CORE_GOVERNANCE_REVIEW.md) §20.

## 2. Flux du layout protégé (`src/app/(protected)/layout.tsx`)

```
Layout Server Component (force-dynamic)
  → resolveNextServerSession()                 // core/auth/server/protected-session.ts
      → headers() : X-Request-Id entrant éventuel
      → createReadOnlyNextCookieStore()        // cookies() — get uniquement
      → resolveServerSession({ cookieStore, env, requestId })   // core/auth/resolve-server-session.ts
          → createAuthenticatedServerApiClient({ mode:'read-only' })  // enableRefresh:false
          → API NestJS GET /auth/me            // appel DIRECT (jamais le BFF local)
  → decideProtectedRender(resolution)          // politique pure, testable
      • anonymous   → redirect('/?auth=required')      (redirection SERVEUR)
      • unavailable → <ServiceUnavailableView/>         (erreur de service contrôlée, pas de redirection)
      • authenticated → createQueryClient() + prefillSessionQuery(profil) + <HydrationBoundary>{children}
```

### Contrat de résolution (`ServerSessionResolution`) — **sans token**

```ts
| { status:'authenticated'; user: UserProfile; requestId? }
| { status:'anonymous';     requestId? }
| { status:'unavailable';   error: PublicAuthError; requestId? }
```

Classification : `200`→authenticated · `401`/`session_expired`→anonymous · `403`→unavailable (distinct) ·
réseau/timeout/`5xx`/réponse 2xx inexploitable→unavailable. Un défaut d'infrastructure n'est **jamais**
transformé en `anonymous`.

## 3. Hydratation (aucun second appel `/me`)

Le profil obtenu par la résolution serveur est posé **directement** dans le cache
(`prefillSessionQuery` → `setQueryData(authKeys.session(), { status:'authenticated', user })`), à la forme
**exacte** consommée par `sessionQueryOptions`/`useSession`. Le navigateur démarre donc **authentifié, sans
flash** et **sans rappeler** `/api/auth/me` (donnée fraîche, `staleTime`). Seules les **autorisations**
sont chargées côté client à la demande (API = autorité finale). Aucun token n'est sérialisé dans le payload
d'hydratation.

## 4. Redirection anonyme → page de connexion (Web Auth 5)

Destination : **`/login?returnTo=/protected`** (constante `PROTECTED_ANONYMOUS_REDIRECT`, construite par
`buildLoginRedirect("/protected")`). Le `returnTo` est **assaini** (`sanitizeReturnTo`, voir §4b) avant tout
usage : chemin **interne** uniquement, jamais d'open redirect, jamais de token. La page `/login` redirige à
son tour un utilisateur **déjà authentifié** vers ce `returnTo` (cf. [`login-flow.md`](login-flow.md)).

### 4b. `returnTo` sûr (`core/auth/return-to.ts`)

`sanitizeReturnTo(raw)` n'accepte qu'un **chemin interne** (`/…`) ; sinon il retombe sur **`/protected`**.
Refusés : non-chaîne, vide / trop longue (> 512), caractères de contrôle / espaces (anti-CRLF), `//` ou `/\`
(protocole-relatif), schéma (`javascript:`/`data:`/`https:`…), hôte externe (vérifié via parsing sur une
**origine sentinelle**), `..`, encodages trompeurs (décodage de contrôle), et les routes **Auth/API**
(`/login`, `/api/…` — anti-boucle). `buildLoginRedirect(returnTo)` produit `/login?returnTo=<assaini+encodé>`.
La destination de retour **ne provient jamais d'un en-tête non fiable** (`Referer`) ; pour le layout protégé
elle est **fixée** (`/protected`).

> **Comportement Next (streaming).** Sous le rendu **streaming** de l'App Router, `redirect()` dans un
> Server Component est délivré via la **charge RSC** (`NEXT_REDIRECT`) + une balise `<meta http-equiv="refresh">`
> (réponse HTTP **200**), et **non** via un statut `307` (le shell a déjà commencé à être envoyé). Le
> navigateur (ou le client sans JS, via meta-refresh) **honore la redirection**. La preuve runtime vérifie
> le **signal de redirection** + l'**absence totale de donnée privée** (ni e-mail, ni « Session
> authentifiée », ni token) dans la réponse — le shell éventuellement diffusé ne contient que du texte
> **public** (bandeau `ProtectedNotice`), jamais de données de session (l'hydratation n'a lieu que sur le
> chemin authentifié).

## 5. Indisponibilité de l'infrastructure

API Auth injoignable / `5xx` / réponse invalide → `unavailable` → le layout rend
`ServiceUnavailableView` (message générique + `requestId` de référence + lien de réessai server-safe).
**Jamais** assimilée à `anonymous` (pas de redirection). Un `(protected)/error.tsx` local sert de **filet**
pour une erreur **inattendue** du rendu.

## 6. Interdictions (rappel)

```
middleware/proxy Auth (même optimisation)   · page /login · formulaire · Server Action login
refresh / rotation de cookie pendant le rendu (Server Component reste lecture seule)
self-fetch du serveur vers /api/auth/me      · QueryClient serveur global / cache partagé
contenu privé rendu avant validation         · token dans le rendu/RSC/hydratation/bundle
```

## 7. Ajouter une future page protégée

1. Créer `src/app/(protected)/<segment>/page.tsx` (`export const dynamic = 'force-dynamic'`).
2. **Ne pas** re-résoudre la session : le layout du groupe `(protected)` l'a déjà fait et a **hydraté**
   le profil → consommer `useSession`/`useAuthorization` côté client.
3. Pour un besoin de **permission**, masquer conditionnellement via `useAuthorization` (affichage), mais
   **exiger la vérification côté API** sur toute action réelle — l'affichage n'est pas une protection.
4. Ne **jamais** ajouter de middleware autoritaire ni de refresh dans le rendu.

## 8. Preuve avec API réelle (NestJS + PostgreSQL jetable)

Scénario rejoué de bout en bout (environnement éphémère, utilisateur de preuve sans seed permanent,
démonté après exécution) — **26 assertions, 0 échec** :

| # | Cas | Vérifié |
|---|---|---|
| a | anonyme `GET /protected` | **redirection serveur** (`NEXT_REDIRECT` + meta refresh → `/login?returnTo=/protected`), **aucune** donnée privée |
| b | `csrf` → `login` BFF | `authenticated:true`, **aucun token** dans la réponse, cookie `HttpOnly` posé |
| c | authentifié `GET /protected` | **200**, contenu rendu, **profil hydraté** (e-mail dans le HTML SSR), **aucun nom ni valeur de token** dans le HTML/RSC, **X-Request-Id propagé** serveur → API |
| d | cookie access retiré (refresh conservé) | **redirection**, aucune donnée privée, **aucun appel `/auth/refresh`** (read-only) |
| e | `logout` → `GET /protected` | cookies supprimés (`loggedOut:true`), **redirection**, aucune donnée privée |
| f | **API arrêtée** → `GET /protected` | **« Service indisponible »** (erreur contrôlée), **pas** de redirection (≠ anonyme), aucune donnée privée |
| g | bundle client `.next/static` | `API_INTERNAL_URL` et noms de cookies Auth **absents** |

API logs corroborants : `/auth/me` → **401** (anonyme/sans access) vs **200** (authentifié, `userId`/
`sessionId`/`requestId=wa4-trace-1`), **aucun** `/auth/refresh` déclenché par le rendu read-only.
