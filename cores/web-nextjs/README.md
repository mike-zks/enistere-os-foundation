# `@enistere/web-nextjs` — Web Core

Socle **Web** d'Enistère : application **Next.js 16 (App Router)** en **TypeScript strict**, consommant
le design system **`@enistere/ui-kit`**, l'**API publique** (endpoints Health) via les paquets clients
officiels et **TanStack Query** pour le server state. **BFF Auth** (login/refresh/logout/csrf, cookies
`HttpOnly`, CSRF double-submit, Origin/Referer), **état de session/autorisations** (`me`/`authorization`,
`useSession`/`useAuthorization`, purge au logout), **layout protégé** (résolution Auth **serveur** read-only +
hydratation, page `/protected`) **et page de connexion `/login`** (formulaire accessible, login BFF, `returnTo`
interne assaini, navigation `replace`/`refresh`). **Sans middleware, sans Server Action Auth, sans token en JS**
(SSR Auth **hybride** : Option C pour le privé, Option A pour le public).

> **Statut** : `IMPLEMENTATION_PARTIELLE` (compile, build, lint, tests verts + serveur local + preuve
> API réelle). Source de vérité de pilotage : [`docs/project-status/`](../../docs/project-status/README.md).

---

## 1. Périmètre

### Inclus

- Next.js **App Router** + **TypeScript strict** (`strict`, `noUncheckedIndexedAccess`, …).
- Arborescence `app` / `core` / `shared` / `features` ; **Server Components par défaut**.
- **Consommation réelle** du UI Kit (`@enistere/ui-kit` + `styles.css`) ; thème clair via `data-theme`.
- **Intégration de l'API publique** (Health) : factory serveur **par requête**, client **public**
  navigateur (sans session), transport typé depuis `@enistere/api-contracts`/`@enistere/api-client-fetch`.
- **TanStack Query** : `QueryClient` (retry borné), `QueryProvider`, query keys, hooks Health.
- **SSR + préchargement + hydratation** contrôlés ; build **indépendant** d'une API disponible.
- Normalisation d'erreurs Web, propagation **X-Request-Id**, en-têtes de **sécurité** + pas de `X-Powered-By`.
- États `loading` / `error` / `not-found`, métadonnées, `manifest`.
- Tests (node:test + Testing Library + jest-axe) + preuve avec **API réelle** (PostgreSQL jetable).
- **BFF Auth** : `POST /api/auth/login`, `POST /api/auth/refresh`, `POST /api/auth/logout`,
  `GET /api/auth/csrf`. Cookies `HttpOnly` access/refresh (jamais renvoyés au navigateur), **CSRF
  double-submit opérationnel**, validation **Origin/Referer**, rotation, logout idempotent. Détail :
  [`docs/auth-architecture.md`](docs/auth-architecture.md), [`docs/csrf.md`](docs/csrf.md).
- **Session & autorisations (Web Auth 3)** : `GET /api/auth/me`, `GET /api/auth/authorization`
  (read-only, `no-store`), client **BFF navigateur** (same-origin, sans token), hooks **`useSession`** /
  **`useAuthorization`** (TanStack Query), états `loading`/`authenticated`/`anonymous`/`error`
  (**401→anonymous**, **403 distinct**), helpers `hasRole`/`hasAnyRole`/`hasPermission`/`hasAllPermissions`
  (OR/AND, **sans wildcard**, ADR-006), **purge du cache Auth au logout** (Health conservé). **L'API reste
  l'autorité finale** (affichage conditionnel ≠ protection). Détail :
  [`docs/session-state.md`](docs/session-state.md).
- **Résolution Auth serveur & premier layout protégé (Web Auth 4)** : groupe `(protected)` + page technique
  **`/protected`**. Le **layout Server Component** résout la session **côté serveur** en **lecture seule**
  (`resolveServerSession` → API `/auth/me`, `enableRefresh:false`, **aucun appel au BFF local**, **aucune
  écriture de cookie**) → **redirige** l'anonyme (`/?auth=required`), rend une **erreur de service** si l'API
  est indisponible (≠ anonyme), sinon **hydrate** le profil dans TanStack Query (`useSession` authentifié dès
  le 1ᵉʳ rendu, **sans second `/me`**). **Sans middleware, sans refresh pendant le rendu.** Détail :
  [`docs/protected-routes.md`](docs/protected-routes.md).
- **Page de connexion & navigation Auth (Web Auth 5)** : page **publique `/login`** (Server Component) —
  assainit `returnTo`, **redirige** un utilisateur **déjà authentifié** (jamais de formulaire) ; **formulaire**
  accessible (`login-form`, labels/aria/autoComplete, validation UX, `jest-axe`) ; **login via le BFF**
  (`performBffLogin` : CSRF → `POST /api/auth/login`, **aucun token lu**) ; **`useLogin`** (`useMutation` sans
  `mutationKey`, purge `authKeys`, **anti-double-soumission**) ; navigation **`router.replace(returnTo)` +
  `refresh()`**. **`returnTo` strictement interne** (`sanitizeReturnTo` — anti open-redirect). La redirection
  anonyme du layout protégé pointe vers **`/login?returnTo=/protected`**. Détail :
  [`docs/login-flow.md`](docs/login-flow.md).
- **États UI & composants structurels (Web UI 1)** : primitives **UI Kit** ajoutées (`Alert`, `Card`,
  `FormField`) **+** compositions Web `src/shared/components/` (`LoadingState`, `EmptyState`, `ErrorState`,
  **`UnauthorizedState` (401) ≠ `ForbiddenState` (403)**, `ServiceUnavailableState`, `PageHeader`).
  Génériques, accessibles (tokens, light/dark, `jest-axe`), **sans donnée sensible** (`requestId`/retry
  optionnels). Intégrés : `PageHeader` + galerie sur l'accueil, `EmptyState` dans Health, `ErrorState`/
  `NotFoundState`/`LoadingState` aux frontières, `ServiceUnavailableState` (le layout protégé y délègue).
  Détail : [`docs/ui-states.md`](docs/ui-states.md).
- **Files — métadonnées & téléchargement sécurisé (Files 1, lecture seule)** : BFF ciblé `GET /api/files/:id`
  (métadonnées publiques, read-only) + `POST /api/files/:id/download-url` (URL signée, **CSRF + Origin/Referer**)
  ; client BFF navigateur same-origin ; `fileKeys` + `useFileMetadata` (désactivée si UUID invalide) +
  `useCreateDownloadUrl` (URL **jamais** en cache/log, consommée immédiatement) ; page privée
  `/protected/files/[id]` + états UI (**404 introuvable / 403 interdit / 503 indisponible** distincts). **L'API
  reste l'autorité** (permission `files.read`/`files.download` + ownership → non-propriétaire **404**). **Aucun
  upload/suppression/admin.** Détail : [`docs/files-read-download.md`](docs/files-read-download.md).

### Hors périmètre — volontairement absent

**middleware** de route privée · **Server Action Auth** · **inscription / register** · **forgot/reset
password** · **OAuth / MFA** · remember-me · navigation Auth globale · **redirection automatique post-logout
sophistiquée** · **refresh pendant le rendu serveur** · **self-fetch** serveur → BFF · **RBAC d'administration**
(modifier rôles/permissions) · **SSR Auth complet** au-delà du layout protégé · token Auth exposé au navigateur
(aucun credential en cache / JS) · routes Files / upload ·
**Axios** · **Zustand**/Redux/Jotai · Orval · Storybook · OAuth / MFA · forgot/reset password · i18n
complet · monitoring · workflow CI · Dockerfile · publication npm · **aucun type d'API recopié**.

---

## 2. Stack & versions

| Brique | Version | Note |
| --- | --- | --- |
| Next.js | **16.2.7** | App Router · build **webpack** (cf. [§5](#5-conventions-dimport)) |
| React / React DOM | **19** | version **unique** dans tout le monorepo |
| Server state | `@tanstack/react-query` **5** | retry borné, SSR/hydratation ; **aucun Axios** |
| Clients API | `@enistere/api-client-fetch` + `@enistere/api-contracts` | Fetch typé, sans Axios |
| TypeScript | 5.7+ | `strict`, `noUncheckedIndexedAccess`, `noImplicitOverride` |
| Tests | `node:test` + `@testing-library/react` 16 + `jest-axe` + `global-jsdom` | pas de Vitest (0 vuln) |
| Lint | ESLint **9** (flat config) + `eslint-config-next` 16 | `next lint` retiré en Next 16 |

> **Pourquoi Next 16 / React 19** : Next 14.2.x traînait des advisories *high* sans correctif en 14.x ;
> le correctif npm était `next@16`. Next 16 + React 19 (+ override `postcss`) ramène l'audit à **0
> vulnérabilité**. Le UI Kit a été aligné sur React 19 (voir [§11](#11-ui-kit--react-19)).

---

## 3. Arborescence

```
src/
  app/                       # App Router
    layout.tsx               # Server Component : CSS + <html data-theme> + <AppProviders>
    page.tsx                 # force-dynamic : prefetch Health (SSR) + HydrationBoundary
    (protected)/             # groupe privé (Web Auth 4) : layout (résolution serveur + hydratation),
                             #   error.tsx (filet), protected/page.tsx → /protected (page technique)
    login/                   # page /login (Web Auth 5, Server Component) + login-panel (wiring router, client)
    providers/app-providers  # Client Component : enveloppe QueryProvider (layout reste serveur)
    loading/error/not-found/manifest
  core/
    config/                  # api-url (validation), public-config, server-config, metadata, theme
    api/
      run-public-request     # timeout + normalisation ApiClientError pour `client.raw`
      server/                # createServerApiClient (public) + createAuthenticatedServerApiClient (BFF)
      public/                # createPublicApiClient + singleton navigateur (sans session)
      health/                # getHealth/getLiveness/getReadiness (types via SchemaOf<>)
      errors/                # mapApiErrorToPublicMessage
    auth/                    # BFF : cookie-config, server-cookie-store, session-contract, web-session-adapter ;
      server/                #   server/ = SERVER-ONLY (next/headers) — exclu node:test : next-cookie-store,
                             #     route-deps, protected-session (resolveNextServerSession)
      handlers/              #   get-profile / get-authorization (handlers (Request, deps), testables)
      client/                #   client BFF NAVIGATEUR (me/authorization/csrf/logout) + bff-error
      request-id.ts          #   resolveRequestId (pur, partagé handlers/serveur)
      read-only-cookie-store #   ReadOnlyServerCookieStore + guardReadOnly (défense par le type)
      resolve-server-session #   resolveServerSession (read-only) + decideProtectedRender (testables)
      return-to.ts           #   sanitizeReturnTo / buildLoginRedirect (anti open-redirect)
      client/login-client    #   performBffLogin (CSRF → POST /api/auth/login, navigateur, sans token)
      session-state.ts       #   SessionState + toPublicAuthError (public, sans token)
    query/                   # query-client (retry), query-provider, keys/{health-keys,auth-keys}
  features/
    foundation-status/       # page technique (matrice d'intégrations) — testable
    health/                  # queries (queryOptions), hooks, health-panel, health-probe-view
    auth/                    # auth-queries (+ prefillSessionQuery), useSession/useAuthorization/useLogout,
                             #   *-status-view, session-panel, service-unavailable-view, protected-notice ;
                             #   login : login-form, login-validation, login-error, use-login
test/                        # node:test (compilés vers build-test/)
```

---

## 4. Scripts

| Commande | Effet |
| --- | --- |
| `npm run dev` | serveur de dev (port **3100**, webpack) |
| `npm run build` | build de production (webpack) |
| `npm run start` | serveur de production (port 3100) |
| `npm run lint` / `typecheck` | ESLint / `tsc --noEmit` |
| `npm run test` / `test:coverage` | compile `tsconfig.test.json` puis `node --test` |
| `npm run check` | typecheck + lint + test + build |

---

## 5. Conventions d'import

Deux compilateurs cohabitent : **Next** (build de `app/` + graphe importé) et **`tsc` nodenext**
(compilation des tests vers `build-test/`, exécutés par `node --test`).

- **Convention unique** : tous les imports relatifs utilisent l'extension **`.js`** (style `nodenext`,
  requis par `node:test`).
- Le build utilise **webpack** (`next build --webpack`) avec `experimental.extensionAlias`
  (`.js → .ts/.tsx`). **Turbopack** ne résout pas encore ces imports `.js` ; webpack le fait. C'est la
  seule raison de ce choix de bundler (documentée ici).
- `src/app/` **et** `src/core/auth/server/` sont **exclus** de `tsconfig.test.json` : les fichiers App
  Router et les modules **SERVER-ONLY** liant `next/headers` (cookie store, entrée Auth serveur) sont
  validés par `next build` + typecheck, pas par `node:test`. `server-only` (npm) n'est pas utilisé (il
  lève à l'import sous `node:test`) ; la frontière est garantie par `next/headers` + tests d'import statiques.

---

## 6. Environnement

Variables (voir [`.env.example`](.env.example)) — **aucune n'est requise** pour build/lint/tests :

- `APP_ENV`, `NEXT_PUBLIC_APP_NAME` : **publiques**.
- `NEXT_PUBLIC_API_URL` : URL **publique** (navigateur) des endpoints Health. Facultative : sans elle,
  l'UI affiche « non configuré » et n'émet aucune requête. **Aucun secret** (inlinée au build).
- `API_INTERNAL_URL` : URL **interne, serveur uniquement** (préchargement SSR), jamais préfixée
  `NEXT_PUBLIC_`. Préférée côté serveur si présente.

Toutes les URLs sont **validées** (`http(s)`, absolues, sans credentials, slash final normalisé,
wildcard rejeté — `core/config/api-url.ts`). Détail : [`docs/api-integration.md`](docs/api-integration.md).

---

## 7. Intégration API (transport)

- **Factory serveur par requête** (`createServerApiClient`) : nouvelle instance à chaque appel, aucun
  état module, `API_INTERNAL_URL`, `fetch` **`no-store`**, aucun Bearer, aucun refresh.
- **Client public navigateur** (`createPublicApiClient` + singleton) : `NEXT_PUBLIC_API_URL`, **aucune
  session**, `enableRefresh:false`, **X-Request-Id** (`crypto.randomUUID`).
- Les endpoints Health (non couverts par les façades auth/files) passent par `client.raw` + un petit
  transport (`run-public-request`) : **timeout**, normalisation en **`ApiClientError`**, extraction de
  l'enveloppe — **sans recopier de DTO** (types via `SchemaOf<>` des contrats).

> ⚠️ Le client **public** ne doit PAS devenir le futur client **authentifié** (qui passera par un BFF
> + cookies `HttpOnly`). Voir [`src/core/auth/README.md`](src/core/auth/README.md). Détail :
> [`docs/api-integration.md`](docs/api-integration.md).

---

## 8. TanStack Query & SSR

`QueryClient` (retry **borné** : jamais sur 4xx/429, borné sur réseau/5xx ; `refetchOnWindowFocus`
off), `QueryProvider` (client, une instance par navigateur), `AppProviders` (le layout reste **Server
Component**). Query keys standardisées (`healthKeys`). Hooks `useHealth/useLiveness/useReadiness`
(désactivés si l'API publique n'est pas configurée). La page précharge `health_get` côté serveur,
`dehydrate` + `HydrationBoundary` ; `staleTime` évite un refetch immédiat après hydratation. La page
est **`force-dynamic` + `no-store`** : le **build ne dépend d'aucune API**. Détail :
[`docs/tanstack-query.md`](docs/tanstack-query.md).

---

## 9. Erreurs & corrélation

`mapApiErrorToPublicMessage` produit un message **public générique** depuis `kind`/`status`/`errorCode`
(jamais de `cause`/stack/secret) ; le `requestId` est conservé comme référence technique. Cas couverts :
réseau, timeout, réponse invalide, 429, 500, 503 (401/403 normalisés **sans** workflow d'auth).

---

## 10. Tests & preuve

`node:test` : validation d'URL/config, factory serveur (instance par appel, no-Bearer, isolation),
client public (no-Authorization, `enableRefresh:false`, requestId, **aucun import serveur** — vérifié
statiquement), `QueryClient` (politique de retry, isolation du cache), query keys, transport Health
(succès/erreur/timeout/requestId), hooks (succès/erreur/refetch/désactivé), **hydratation** (donnée
fraîche → pas de refetch), UI Health (états + a11y), mapping d'erreurs, et **garde anti-réseau** (toute
requête réelle non mockée fait échouer un test). **Fondations Auth** : config cookies (Secure/env,
préfixes, durées, rejets), cookie store mémoire, `WebAuthSessionAdapter` (lecture/écriture/clear, tokens
vides/contrôle rejetés, aucune valeur en erreur), factory authentifiée (instance/appel, isolation A/B,
Bearer issu du cookie, read-only refresh off vs writable refresh tenté), **frontières d'import statiques**,
**sentinelles** non fuitées. **Session & autorisations (Web Auth 3)** : handlers `me`/`authorization`
(GET-only, read-only, erreurs génériques), client BFF navigateur (envelope `{success,data}`, **chemin
same-origin relatif**, 401/403/réseau/réponse invalide, **aucun token**), `authKeys` (disjoints, sans
secret), `useSession` (loading/authenticated/**401→anonymous**/**403→error**/refetch), `useAuthorization`
(désactivé en anonyme = **aucun appel** `/authorization` ; helpers OR/AND **sans wildcard**), `useLogout`
(CSRF posé, **purge Auth / Health conservé** ; échec réseau → **pas de purge**), UI session/authorization
(états + a11y). Build + sonde HTTP locale. **Preuve API réelle** : API NestJS + PostgreSQL jetable —
Health (live/ready, hydratation SSR, API down → rendu contrôlé) **et Auth** : login → `/me` (profil, **aucun
token**, `no-store`, `X-Request-Id`) → `/authorization` (rôles/permissions) → logout → `/me` **401** ;
**read-only** prouvé (401 **sans** appel `/auth/refresh`) ; **changement de droits sans nouveau JWT**
(`roles:[]` après retrait, `/me` toujours 200) ; bundle client **sans** `API_INTERNAL_URL` ni secret.
**Résolution serveur & layout protégé (Web Auth 4)** : `resolveServerSession` (200→authenticated,
401→anonymous, 403/5xx/réseau/réponse invalide→unavailable, **aucun refresh**, **aucune écriture cookie**
via `guardReadOnly`), `decideProtectedRender` (redirect/render/unavailable, cible interne sans token),
`prefillSessionQuery`/**hydratation** (`useSession` authentifié au 1ᵉʳ rendu, **sans** second `/me`, aucun
token dans le payload), `request-id` (réutilisation/UUID), vues `ServiceUnavailableView`/`ProtectedNotice`
(a11y). **Connexion (Web Auth 5)** : `sanitizeReturnTo` (interne/externe/`//`/`\`/schéma/`..`/encodages/routes
Auth → défaut, anti open-redirect), validation login (e-mail/mot de passe, trim e-mail, mot de passe inchangé),
client BFF login (CSRF, header, body, same-origin, statuts 401/403/429/503/réseau/JSON invalide, **aucune fuite
de mot de passe**), `useLogin` (succès/erreur, **purge authKeys / Health conservé**, **double-soumission
empêchée**, aucun credential en cache), `LoginForm` (labels/autoComplete/validation/loading/erreurs/`jest-axe` ×4).
**États UI (Web UI 1)** : `EmptyState`/`UnauthorizedState`/`ForbiddenState`/`ServiceUnavailableState`/
`PageHeader` (rôles, distinction 401≠403≠indisponible, requestId/retry, aucune donnée sensible, `jest-axe`),
galerie `StatesShowcase` (sans `h1`). **Files (Files 1)** : handlers BFF (UUID 400 sans appel API,
401/403/404/409/503 distincts, CSRF/Origin pour download-url, no-store, requestId, **aucun champ interne**),
client BFF (same-origin, aucun Authorization, URL absente des erreurs), `useFileMetadata` (désactivée si UUID
invalide, 404/503, retry false), `useCreateDownloadUrl` (**URL jamais en cache**, anti-double-clic), helpers
(`formatFileSize` BigInt, `triggerDownload` schémas refusés), vue métadonnées (+`jest-axe`). **Total : 307 tests**
(`tsc -p tsconfig.test.json` + `node --test`).
**Preuve API réelle Web Auth 4**
(NestJS + PostgreSQL jetable, **26 assertions**) : anonyme `GET /protected` → **redirection serveur** (sans
donnée privée) · authentifié → **200 + profil hydraté** (e-mail en SSR, **aucun token** dans HTML/RSC,
`X-Request-Id` propagé) · cookie access retiré → redirection **sans** `/auth/refresh` · logout → redirection ·
**API arrêtée → « Service indisponible »** (≠ anonyme) · bundle sans secret. Détail :
[`docs/protected-routes.md`](docs/protected-routes.md). **Preuve API réelle Web Auth 5** (**22 assertions**) :
anonyme `GET /protected` → **redirection vers `/login?returnTo=/protected`** · `GET /login` → **200 +
formulaire** (aucun token) · CSRF + `login` BFF → `authenticated:true` (**aucun token**, cookie `HttpOnly`) ·
authentifié `GET /protected` → **200 + profil hydraté** (`X-Request-Id` propagé) · **authentifié `GET /login`
→ redirection hors login** · **`returnTo` externe (`https://evil…`) → cible réelle `/protected`** (NEXT_REDIRECT
+ meta refresh ; **aucun open redirect**) · logout → `/protected` redirige vers `/login` · identifiants
invalides → **401 générique** (aucune énumération) · CSRF invalide → **403** · HTML/bundle **sans**
`API_INTERNAL_URL`, sans cookie Auth, **sans mot de passe**. Détail : [`docs/login-flow.md`](docs/login-flow.md).
**Preuve API + MinIO réelle Files 1** (**21 assertions**) : upload (auto-VALIDATED + objet) → propriétaire
`GET /api/files/:id` **200** (champs publics, no-store, **aucun champ interne**) → `download-url` **200**
`{url,expiresAt}` → **téléchargement réel MinIO** (octets == upload, `Content-Type` image/png) → sans
permission **403** → non-propriétaire (avec permission) **404** → quarantaine **409** → objet supprimé **503**
→ logout **401** + page → `/login` ; **aucun** `storageKey`/`bucket`/`X-Amz-Signature`/credentials en
métadonnées, logs ou bundle. Détail : [`docs/files-read-download.md`](docs/files-read-download.md).

---

## 11. Auth BFF

Flux **login / refresh / logout** (+ bootstrap **csrf**) exposés par des **Route Handlers** `/api/auth/*`.
Le navigateur ne parle jamais directement à l'API NestJS : un **client serveur authentifiable par requête**
(`core/api/server/create-authenticated-server-api-client.ts`, distinct du public) lit le Bearer depuis le
cookie `HttpOnly`. **Cookies** : `enistere_access`/`refresh` **HttpOnly** (jamais renvoyés au navigateur,
`Secure` prod, `SameSite=Lax`, `Path=/`, `__Host-` prod) ; `enistere_csrf` **non HttpOnly** (double-submit).
**Protection** : CSRF (cookie + `X-CSRF-Token`, temps constant, rotation), **Origin/Referer** (fail-closed),
corps borné, erreurs génériques, `X-Request-Id` propagé. **Prouvé contre l'API réelle.** Consommé par la
**page `/login`** (Web Auth 5) via `performBffLogin`. **Absent** : middleware, Server Action Auth. Détail :
[`docs/auth-architecture.md`](docs/auth-architecture.md), [`docs/csrf.md`](docs/csrf.md),
[`src/core/auth/README.md`](src/core/auth/README.md).

### 11b. Session & autorisations (Web Auth 3)

`GET /api/auth/me` et `GET /api/auth/authorization` (Route Handlers **read-only**, `no-store`, pas de CSRF —
lectures) exposent profil et rôles/permissions. Le **client BFF navigateur** (`core/auth/client/`,
same-origin, `credentials:"include"`, **aucun token lu/exposé**) alimente deux hooks TanStack Query :
**`useSession`** (`loading`/`authenticated`/`anonymous`/`error` — **401→anonymous**, **403 reste `error`**,
read-only ⇒ aucun refresh silencieux) et **`useAuthorization`** (activé **uniquement** si authentifié ;
helpers `hasRole`/`hasAnyRole`/`hasPermission`/`hasAllPermissions`, **OR/AND, sans wildcard**, ADR-006). Le
cache `authKeys` est **disjoint** de `healthKeys`, **non persisté** ; le **logout purge** `authKeys.all`
(Health conservé), sauf échec réseau (pas de purge → retry). Un **changement de droits** se reflète par
refetch de `/authorization` **sans nouveau JWT** (prouvé). Les helpers pilotent l'**affichage conditionnel**
— **l'API reste l'autorité finale**. Détail : [`docs/session-state.md`](docs/session-state.md).

---

## 12. UI Kit & React 19

`@enistere/ui-kit` est aligné sur **React 19** (peer `react >=18`, couvre 18 et 19) ; **78 tests** (6
primitives initiales + **Alert/Card/FormField**, Web UI 1) passent sous React 19 (aucune régression). Voir
le `CHANGELOG.md` racine.

---

## 13. Feuille de route

**Prochain incrément** : **Revue globale Web Core (incrément V1)** — auditer l'ensemble Auth + UI + Files,
rejouer les preuves, classer les dettes, et arbitrer la suite (compléter Files, primitives interactives UI Kit,
ou démarrer Mobile Core). Puis (selon la revue) : Files 2 / écrans, CI/E2E, CSP à nonces, i18n, CI/CD.
**Réserves V1** recommandées en parallèle : CI minimale (ADR-013) + E2E navigateur.
