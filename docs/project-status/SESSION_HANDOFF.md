# SESSION_HANDOFF.md — Transfert de session (compact)

> Document court et exploitable pour démarrer une nouvelle conversation / un autre agent.
> **Source de vérité = le repository**, résumé par `docs/project-status/`. Vérifié le 2026-06-10.

## Bloc de démarrage (à copier en début de session)

```
Nous poursuivons Enistere OS Foundation.
Les fichiers du dossier docs/project-status/ sont la source officielle
de vérité. Lis-les avant toute recommandation et ne suppose aucune
implémentation absente de la matrice.
```

## 1. Projet

Enistere OS Foundation — monorepo de socles (cores) techniques + packages partagés + stratégie/ADR.

## 2. Objectif courant

Faire progresser les cores V1 **un par un**, en s'appuyant sur le API Core et les packages déjà
disponibles, sans régression et sans confondre spécification et implémentation.

## 3. État réel (résumé)

- **Implémenté** : **API Core NestJS** (auth, sessions, refresh, RBAC, permissions, audit, files
  S3/MinIO, logging Pino, OpenAPI canonique) — 377 tests unitaires + 101 e2e + revues. Statut :
  **IMPLEMENTATION_AVANCEE**.
- **En cours** : **UI Kit** (`@enistere/ui-kit`, **0.1.1**, privé) — design tokens **+ 9 primitives Web React**
  (Button, Input, Label, Text, Spinner, VisuallyHidden + **Alert, Card, FormField** — Web UI 1) pilotées par
  tokens, accessibles. React = peerDependency `>=18` ; **aligné et testé sous React 19** (**78 tests, 100 %**,
  jest-axe). CSS via `@enistere/ui-kit/styles.css`. **Tailwind/Radix/shadcn absents** (ADR-009 partiel).
  Statut : **IMPLEMENTATION_PARTIELLE** ; **consommé par le Web Core**.
- **Partiel** : **Web Core** (`@enistere/web-nextjs`, 0.1.0, privé) — **Next 16 App Router + React 19**,
  TypeScript strict, Server Components par défaut, UI Kit consommé, thème clair via `data-theme`,
  en-têtes sécurité + pas de `X-Powered-By`. **Intègre l'API publique (Health)** : factory serveur par
  requête + client public navigateur (sans session, `enableRefresh:false`), **TanStack Query** (retry
  borné), **SSR + hydratation** (page `force-dynamic`, build indépendant de l'API). Expose les **flux BFF
  Auth** : `login`/`refresh`/`logout`/`csrf` via **Route Handlers** `/api/auth/*` — cookies `HttpOnly`
  access/refresh (jamais renvoyés au navigateur, `__Host-` prod), **CSRF double-submit** (cookie non
  HttpOnly + `X-CSRF-Token`, temps constant, rotation), **Origin/Referer** (fail-closed), corps borné,
  erreurs génériques, `X-Request-Id` propagé, logout idempotent. **Lit aussi le profil/les autorisations** :
  `GET /api/auth/me` + `GET /api/auth/authorization` (Route Handlers **read-only**, `no-store`) → **client
  BFF navigateur** (same-origin, `credentials:"include"`, **aucun token lu/exposé**) → hooks **`useSession`**
  (`loading`/`authenticated`/**`anonymous` (401)**/**`error` (403/5xx/réseau)**) et **`useAuthorization`**
  (activé si authentifié ; helpers `hasRole`/`hasAnyRole`/`hasPermission`/`hasAllPermissions`, **OR/AND, sans
  wildcard**, ADR-006) ; **logout purge** `authKeys.all` (Health conservé). **Premier layout protégé**
  (Web Auth 4) : groupe `(protected)` + page `/protected` ; le **layout Server Component** résout la session
  **côté serveur read-only** (`resolveServerSession` → API `/auth/me`, `enableRefresh:false`, **aucun appel
  au BFF local**, **aucune écriture cookie** via `guardReadOnly`) → **redirige** l'anonyme (`/?auth=required`,
  temporaire), rend **« Service indisponible »** si l'API est down (≠ anonyme), sinon **hydrate** le profil
  (`prefillSessionQuery` → `useSession` authentifié au 1ᵉʳ rendu, **sans** second `/me`). **Page de connexion
  `/login`** (Web Auth 5) : formulaire accessible, **login BFF** (`performBffLogin` : CSRF → `POST /api/auth/login`,
  **aucun token lu**), `useLogin` (purge `authKeys`, **anti-double-soumission**, aucun credential en cache),
  navigation **`router.replace(returnTo)` + `refresh()`** ; **`returnTo` interne assaini** (`sanitizeReturnTo`,
  anti open-redirect) ; utilisateur déjà authentifié **redirigé** hors `/login`. La redirection anonyme du
  layout protégé pointe vers `/login?returnTo=/protected`. **Lit les fichiers en lecture seule** (Files 1) :
  deux **Route Handlers BFF ciblés** (jamais un proxy générique) `GET /api/files/:id` (métadonnées
  **publiques**, client serveur **read-only**, `no-store`) et `POST /api/files/:id/download-url` (URL signée
  courte, client serveur **writable** réutilisant le refresh BFF, **Origin/Referer + CSRF**, `no-store`) — seul
  l'**UUID** du chemin est accepté (UUID invalide → **400 sans appel API**) ; mapping d'erreurs **distinct**
  (400/401/403/**404 anti-énumération**/**409**/429/**503**) ; client BFF navigateur (`credentials:"include"`,
  **aucun Bearer**) ; `fileKeys` **disjoints** ; `useFileMetadata` (query, `enabled` si UUID, `retry:false`) +
  **`useCreateDownloadUrl`** (**mutation** : l'URL signée est **consommée immédiatement** puis abandonnée —
  **jamais** en cache/log/persistance) ; téléchargement via **ancre temporaire** (`rel="noopener noreferrer"`,
  URL `https`-only validée) ; page privée `/protected/files/[id]` avec états UI réutilisés ; **l'API reste
  l'autorité** (permission `files.read`/`files.download` + ownership), `useAuthorization` ne fait qu'afficher le
  bouton ; **aucun champ interne** (storageKey/bucket/checksum/ownerId). **Sans middleware, sans Server Action
  Auth, sans token en JS, sans upload/suppression/admin.** **307 tests** + preuves **API réelles** Auth/session
  **+ protégé 26/26 + login 22/22 + Files (API + MinIO) 21/21** (PostgreSQL + MinIO jetables). Statut :
  **IMPLEMENTATION_PARTIELLE**. Build/dev via **webpack**
  (`extensionAlias`). Note transport : le client serveur authentifié **bufferise le corps** (sinon le
  `fetch` patché de Next échouait sur les réponses non-2xx — `expected non-null body source`).
- **Packages** : `@enistere/api-contracts` et `@enistere/api-client-fetch` (0.1.0, privés) — validés
  **localement** (tests + live 16/16), **non publiés** ; `api-client-fetch` **instancié (public/Health +
  authentifié/BFF Auth login/refresh/logout/me/authorization)** dans le Web Core ; types Auth dérivés via
  `SchemaOf<>` (`UserProfileResponseDto`, `AuthorizationSummaryResponseDto`) — preuve API réelle.
- **Documentaires (spéc seule, aucun starter)** : `cloud`, `mobile-react-native`.
- **Vides** : `ai-core`, `api-spring`, `docs-core`, `mobile-flutter`, `quality-core`, `web-angular`.
- **Absents** : CI/CD, conteneurisation.
- **Git** : `main` poussé sur `origin` (SSH). Commits récents : `docs(web-nextjs): review web core v1 increment`,
  `feat(web-nextjs): add secure file read access`,
  `feat(web-ui): add standard interface states`,
  `docs(web-nextjs): review web auth v1`,
  `feat(web-nextjs): add secure login experience`,
  `feat(web-nextjs): add server-resolved protected layout`,
  `docs(web-nextjs): review web core governance`,
  `feat(web-nextjs): add session and authorization state`,
  `feat(web-nextjs): implement secure auth BFF flows`, `feat(web-nextjs): establish server auth foundations`,
  `feat(web-nextjs): integrate public API and query layer`, baseline.
- **Audit** : **0 vulnérabilité** (TanStack Query v5 ; override `postcss ^8.5.15`).

## 4. Cores techniquement implémentés

`cores/api-nestjs/` (avancé), `cores/ui-kit/` (starter tokens + primitives, React 19) et
`cores/web-nextjs/` (Next 16 + UI Kit + API publique + TanStack Query + BFF Auth + session/autorisations,
**IMPLEMENTATION_PARTIELLE**).

## 5. Cores documentaires

`cloud`, `mobile-react-native` (un `CORE_SPECIFICATION.md` chacun, **pas** de starter).
`ui-kit` et `web-nextjs` ont leur spéc **et** un starter.

## 6. Packages

`@enistere/api-contracts` (types OpenAPI, runtime-indépendant) ; `@enistere/api-client-fetch`
(client Fetch typé + wrappers : auth, erreurs, timeout, refresh, multipart). Workspaces npm
(`packages/*`, `cores/ui-kit`, `cores/web-nextjs`). **Non publiés** ; UI Kit **consommé** + `api-client-fetch`
**instancié (public/Health + authentifié/BFF Auth)** par le Web Core. Usage authentifié **intégré** (preuve API réelle).

## 7. ADR clés

18 ADR **Validés** (001–016, 039, 040). Implémentés et revus : 002 (Prisma), **007** (Files : upload **API** ;
**consommé en lecture côté Web** — métadonnées publiques + URL signée + téléchargement direct, **sans** upload),
039 (Argon2id), 040 (logging). Partiels : 001 (monorepo), 003, **004** (session : adapter serveur Web + **état de session
navigateur** `useSession`/`useAuthorization`, read-only sans refresh silencieux), **005** (cookies web +
**CSRF** : flux BFF login/refresh/logout opérationnels, cookies `HttpOnly`, CSRF double-submit,
Origin/Referer — Web ; reste : autres mutations futures), **006** (RBAC : appliqué **côté API** ;
**consommé en lecture** côté Web via helpers OR/AND sans wildcard pour l'affichage conditionnel —
**l'API reste l'autorité**), **011** (Fetch instancié public + **authentifié** Web + client BFF navigateur + **façade Files** read-only),
**012** (TanStack Query intégré Web : server state Health, Auth **et Files** — cache disjoint, purge au logout,
**URL signée hors cache** via mutation), 016
(types Auth via `SchemaOf<>`). Décidés non implémentés : 013, 014, 015. **008/009/010 partiels** (UI Kit).
ADR-017→038 = backlog non rédigé. Détail : [`DECISIONS_REGISTER.md`](./DECISIONS_REGISTER.md).

## 8. Dernière étape terminée

**Revue globale Web Core — incrément V1** (`@enistere/web-nextjs`) : revue **transverse de stabilisation** de
l'incrément complet (Health public + Auth 1→5 + UI 1 + Files 1) traité comme **un système unique**, **sans
nouvelle fonctionnalité**. Vérifié fichier par fichier + commandes + runtime : architecture (couches
`app→features→core/shared`, **aucun import inversé**, 16 client components justifiés, aucun barrel dangereux),
14 routes (privées/BFF `ƒ` → **build indépendant de l'API**), 6 clients API à responsabilités disjointes (aucun
Bearer/token côté navigateur), **BFF ciblé** (jamais proxy générique ; UUID 400 sans appel API ; CSRF/Origin
fail-closed avant API ; `no-store`), configuration (URL validée, `server-config` serveur-only, origines
exactes), **frontières client/serveur** (test statique : `next/headers`/server-config/handlers/http Files
interdits côté client), TanStack Query (client navigateur stable / serveur par rendu, **clés disjointes**,
**retry borné Health vs `retry:false` Auth/Files** documenté, **URL signée = mutation jamais en cache**),
contrats `SchemaOf<>` (`generate:check` ok, aucun DTO recopié, décisions sur status/errorCode jamais message),
a11y (un `h1`/page, jest-axe sur les vues clés), erreurs Files distinctes (**400/401/403/404/409/429/503/502/
504**). **Scans** : aucun token/URL signée/donnée privée en source, logs, `.next/static`, RSC. **Non-régression** :
Web **307 tests ×2** (10,1 s/9,9 s, sans hang) + couverture **≈ 87,8 %** (modules `files/` 96–100 %) + build ;
UI Kit 78 (100 %) + pack:check ; api-contracts 11 ; api-client-fetch 29 ; **0 vuln** ; Axios/Zustand absents.
**Preuve runtime réelle (PostgreSQL + MinIO jetables) 49/49** (parcours critique Auth+Files **rejoué ×2**) :
public (home 200 API up **et** down) ; Auth (anonyme→/login, login, /protected 200, /me sans token, refresh
rotation, logout→401+/login) ; Files (métadonnées 200 sans champ interne, download-url 200 {url,expiresAt},
**téléchargement réel MinIO** octets==upload image/png, **signature altérée→403**, **URL réellement expirée
(TTL 30 s)→403**) ; droits (sans files.read→403, non-propriétaire+permission→**404**, **révocation sans nouveau
JWT**→403, quarantaine→409, objet absent→503) ; **pannes** (MinIO arrêté→503 ; API arrêtée→home 200 +
/protected « indisponible » **sans contenu privé ni donnée utilisateur** + /api/files→502) ; concurrence
(double login, double download-url 200/200, isolation deux cookie jars). **Verdict :
`WEB_CORE_V1_INCREMENT_STABLE_WITH_RESERVATIONS`** (aucun défaut bloquant ; réserves : **CI + ordre de build**,
E2E navigateur ; mineures : CSP/HSTS, 429, contrastes, cache Files au logout). **Corrections documentaires
seules** (zéro comportement) : `.env.example` (+`WEB_ALLOWED_ORIGINS`), `SECURITY.md` (routes protégées
implémentées + posture Files). Statut Web Core **maintenu** `IMPLEMENTATION_PARTIELLE`. Rapport permanent :
`cores/web-nextjs/docs/WEB_CORE_V1_INCREMENT_REVIEW.md`. `packages/`/`api-nestjs/`/`ui-kit` **non modifiés**.
Commit `docs(web-nextjs): review web core v1 increment`. **Prochaine action : CI minimale (ADR-013).**

**Étape précédente — Web Core Files 1 — métadonnées & téléchargement sécurisé (lecture seule)** (`@enistere/web-nextjs`) :
première intégration **Files** du Web Core, **sans upload/suppression/admin**. Statut **inchangé**
`IMPLEMENTATION_PARTIELLE`. **BFF ciblé** (jamais un proxy générique) : `GET /api/files/:id` (métadonnées
**publiques**, client serveur **read-only** sans refresh au rendu, `no-store`) et `POST /api/files/:id/download-url`
(URL signée courte, client serveur **writable** réutilisant le refresh BFF existant, **Origin/Referer + CSRF**,
`no-store`). Ordre de garde : méthode (405) → **validation UUID** (400 **sans appel API**) → [POST : CSRF/Origin
403] → API ; seul l'**UUID** du chemin est accepté (jamais URL/bucket/storageKey/TTL/headers). Mapping d'erreurs
**distinct** (`core/files/http/files-response.ts`) préservant **404 anti-énumération** / **409** (non
téléchargeable) / **503** (stockage indisponible). **Client BFF navigateur** (`credentials:"include"`, **aucun
Bearer**, ne lit aucun token). **TanStack Query** : `fileKeys.all/detail(id)` **disjoints** de auth/health
(UUID admis, **jamais** d'URL/token) ; `useFileMetadata` (query : `enabled` si UUID, `retry:false`,
`PublicStoredFileDto`) ; **`useCreateDownloadUrl`** = **mutation** (sans `mutationKey`) dont l'URL signée est
**consommée immédiatement** (`triggerDownload`) puis **abandonnée** — **jamais** en cache/log/persistance ;
anti-double-clic. **Téléchargement** : URL `https`-only validée (`isSafeDownloadUrl` ; `javascript:`/`data:`
refusés ; signature jamais reconstruite) → **ancre temporaire** `rel="noopener noreferrer"`. Formatage **pur**
(`formatFileSize` BigInt, `formatDateTime` UTC déterministe). Page privée `/protected/files/[id]` → `FileDetails`
(hooks inconditionnels puis branche) avec états réutilisés **`LoadingState`/`EmptyState`(404)/`ForbiddenState`(403)/
`ServiceUnavailableState`(503)/`ErrorState`**, succès `PageHeader`+`Card`. **L'API reste l'autorité**
(`files.read`/`files.download` + ownership → **404** anti-énumération pour un non-propriétaire) ; `useAuthorization`
ne sert qu'à l'affichage du bouton. **Aucun champ interne** (storageKey/bucket/checksum/ownerId), `originalName`
rendu en **texte**. **307 tests** Web (+37) + **preuve API + MinIO réelle 21/21** (PostgreSQL + MinIO jetables) :
upload (auto-VALIDATED + objet) → propriétaire `GET` **200** (publics, no-store, aucun champ interne) →
`download-url` **200** `{url,expiresAt}` → **téléchargement réel MinIO** (octets == upload, `Content-Type`
image/png) → sans permission **403** → **non-propriétaire (avec permission) → 404** → quarantaine **409** → objet
supprimé **503** → logout **401** + page → `/login` ; **aucun** `storageKey`/`bucket`/`X-Amz-Signature`/credentials
en métadonnées, logs ou bundle. **Non-régression** : Web 307 + couverture + build ; UI Kit 78 ; api-contracts 11 ;
api-client-fetch 29 ; **0 vuln** ; Axios/Zustand absents. **Aucun nouveau composant UI Kit, aucun middleware,
aucun proxy.** API NestJS / `packages/` / `ui-kit` **non modifiés**. Docs : `cores/web-nextjs/docs/files-read-download.md`
(+ `api-integration.md`/`tanstack-query.md`). Commit `feat(web-nextjs): add secure file read access`.

**Étape précédente — Web Core UI 1 — états UI & composants structurels génériques** (`@enistere/ui-kit` + `@enistere/web-nextjs`) :
standardise les états d'interface et ajoute 3 primitives structurelles. Statuts **inchangés**
`IMPLEMENTATION_PARTIELLE`. **UI Kit** : `Alert` (variant info/success/warning/danger ; rôle status sauf
danger→alert ; glyphe+bordure+titre, jamais couleur seule), `Card` (slots ; `CardTitle` n'impose aucun
niveau), `FormField` (composition **explicite**, aucune injection magique) — CSS **tokens-only** (aucun hex),
`styles.css` régénéré, **78 tests** (+ jest-axe), `pack:check` OK. **Web Core** (`src/shared/components/`) :
`LoadingState`, `EmptyState`, `ErrorState` (+`requestId`), **`UnauthorizedState`(401) ≠ `ForbiddenState`(403,
permission non révélée)**, `ServiceUnavailableState` (≠ session anonyme), `PageHeader` (h1 par défaut) — chacun
`inline?`, **aucune donnée sensible**. **Intégrations** : `PageHeader` + galerie `StatesShowcase` (accueil),
`EmptyState` (Health non configuré), `ErrorState`/`NotFoundState`/`LoadingState` (frontières),
`service-unavailable-view` **délègue** à `ServiceUnavailableState` (dé-duplication ; flux Auth inchangés).
**270 tests** Web (+40). Non-régression : UI Kit (tokens/typecheck/build/lint/test/coverage 100 %/pack) ; Web
check+couverture+build ; packages 11+29 ; **0 vuln** ; Axios/Zustand absents. **Aucun framework UI lourd
(Tailwind/Radix/shadcn) ajouté.** Docs : `cores/ui-kit/docs/components.md`, `cores/web-nextjs/docs/ui-states.md`.
Commit `feat(web-ui): add standard interface states`.

**Étape précédente — Revue globale Auth Web (1 → 5)** (`@enistere/web-nextjs`) : revue **transverse de stabilisation** du socle
Auth traité comme **un système unique** — **sans nouvelle fonctionnalité**. Vérifié **fichier par fichier** +
commandes : architecture (BFF + résolution serveur + login), 6 routes BFF + `/protected` + `/login` (`ƒ`),
cookies `HttpOnly`/`__Host-`, CSRF + Origin/Referer (fail-closed), **aucune fuite de token** (greps src + bundle
`.next/static` : tous secrets absents), session (401→anonymous / 403·5xx·réseau distincts), caches disjoints +
purge login/logout, résolution serveur read-only (aucun contenu privé avant validation), `returnTo`
**anti-open-redirect**, RBAC OR/AND sans wildcard, contrats `SchemaOf<>` (`generate:check` ok), mappeurs d'erreurs
cohérents, frontières d'import (test statique). **Non-régression** : web `check` (typecheck+lint+**263 tests
×2 sans hang**+build) + couverture ≈ 86,1 % ; UI Kit 64 ; api-contracts 11 ; api-client-fetch 29 ; **0 vuln**.
**Preuve runtime rejouée (un système unique) 33/33** (NestJS + PostgreSQL jetable) : nominal (anonyme→/login→
login→/protected hydraté→/authorization) + **refresh** (rotation, `/me` read-only sans refresh) + **droits sans
nouveau JWT** + erreurs (401 sans énumération, 403 CSRF, 403 Origin) + API down (« indisponible » ≠ anonyme) +
bundle sans secret. **Verdict : `AUTH_WEB_V1_STABLE_WITH_RESERVATIONS`** (aucun défaut bloquant ; réserves
opérationnelles : CI, E2E navigateur, streaming-redirect, multi-onglets, CSP/HSTS). **Aucune correction de code
applicatif** ; statut Web Core **maintenu** `IMPLEMENTATION_PARTIELLE`. Rapport permanent :
`cores/web-nextjs/docs/WEB_AUTH_V1_REVIEW.md`. `packages/`/`api-nestjs/` non modifiés. Commit
`docs(web-nextjs): review web auth v1`.

**Étape précédente — Web Auth 5 — page de connexion & navigation Auth contrôlée** (`@enistere/web-nextjs`) : page **publique
`/login`** (Server Component `force-dynamic`) — **assainit** `returnTo` (`core/auth/return-to.ts` :
`sanitizeReturnTo`/`buildLoginRedirect`, **anti open-redirect**, testable), **résout la session côté serveur**
(déjà authentifié ⇒ **redirige** vers `returnTo`, jamais de formulaire ; anonyme ⇒ formulaire ; unavailable ⇒
formulaire + état dégradé). **Login BFF** (`core/auth/client/login-client.ts` : CSRF → `POST /api/auth/login`,
same-origin, **aucun token lu**). `features/auth` : `login-validation` (UX, mot de passe non modifié),
`login-error` (génériques, **401 sans énumération**), `use-login` (`useMutation` **sans `mutationKey`**, purge
`authKeys`, **anti-double-soumission** `useRef`), `login-form` (a11y : labels/`aria`/`autoComplete`, `jest-axe`).
**App** : `app/login/page.tsx` + `login-panel.tsx` (wiring router, exclu node:test : `router.replace(returnTo)`
+ `refresh()`). Redirection anonyme du layout protégé → `/login?returnTo=/protected`. **263 tests** (+33) +
**preuve API réelle 22/22** (anonyme `/protected`→redirection `/login` ; `/login`→formulaire ; login BFF→
`authenticated` sans token ; authentifié `/protected`→200+profil hydraté, X-Request-Id propagé ; authentifié
`/login`→redirection hors login ; **`returnTo` externe→`/protected`, aucun open redirect** ; logout→`/login` ;
401 sans énumération ; 403 CSRF ; bundle/HTML sans secret/mot de passe). **Sans middleware, sans Server Action.**
**0 vuln**, Axios/Zustand absents. API NestJS / packages **non modifiés**. Détail :
`cores/web-nextjs/docs/login-flow.md`. Commit `feat(web-nextjs): add secure login experience`.

**Étape précédente — Web Auth 4 — résolution Auth serveur + premier layout protégé** (`@enistere/web-nextjs`) : premier
**espace privé** dont la session est **résolue côté serveur** (lecture seule) puis **hydratée**. Modules
**testables** : `core/auth/resolve-server-session.ts` (`resolveServerSession` → client serveur authentifié
`read-only`, `enableRefresh:false`, appel **direct** API `/auth/me`, contrat **sans token** `authenticated|
anonymous|unavailable` ; `401`→anonymous, `403`/réseau/`5xx`/réponse invalide→unavailable ; `decideProtectedRender`),
`core/auth/read-only-cookie-store.ts` (`ReadOnlyServerCookieStore` get-only + `guardReadOnly` qui **lève** sur
écriture), `core/auth/request-id.ts` (`resolveRequestId` partagé), `features/auth/auth-queries.ts`
(`prefillSessionQuery`). **Server-only** (exclu node:test) : `core/auth/server/protected-session.ts`
(`resolveNextServerSession` via `next/headers`). **App** : `app/(protected)/layout.tsx` (Server Component,
`force-dynamic` : redirect anonyme `/?auth=required` / `ServiceUnavailableView` / hydrate+children),
`(protected)/protected/page.tsx` (`/protected`), `(protected)/error.tsx`. **230 tests** (+24) +
**preuve API réelle 26/26** (anonyme→redirection serveur sans donnée privée ; authentifié→200+profil hydraté,
aucun token HTML/RSC, X-Request-Id propagé ; cookie access retiré→redirection **sans** `/auth/refresh` ;
logout→redirection ; **API arrêtée→« Service indisponible »** ≠ anonyme ; bundle sans secret). Note : sous le
**streaming** App Router, `redirect()` est délivré en HTTP 200 (RSC `NEXT_REDIRECT` + meta-refresh) — honoré
par le navigateur, **aucune donnée privée** exposée. **0 vuln**, Axios/Zustand absents, React 19.2.7. API
NestJS / packages **non modifiés**. Détail : `cores/web-nextjs/docs/protected-routes.md`. Commit
`feat(web-nextjs): add server-resolved protected layout`.

**Étape précédente — Checkpoint de gouvernance Web Core** (revue de socle — `@enistere/web-nextjs`) : mission de
**revue/vérification/consolidation/arbitrage**, **sans** implémentation fonctionnelle (aucun
middleware/page login/route protégée). Vérifié **fichier par fichier** + commandes réelles : frontières
client/serveur, 6 routes BFF `ƒ`, 3 clients API séparés, cookies `HttpOnly`/`__Host-`, CSRF + Origin/Referer,
**aucune fuite de token** (greps + bundle `.next/static`), caches `authKeys`/`healthKeys` disjoints, RBAC
OR/AND **sans wildcard**, types `SchemaOf<>` (`generate:check` up-to-date), **read-only ⇒ aucun refresh
silencieux**. **Non-régression verte** : web `check` (typecheck+lint+**206 tests ×2 sans hang**+build) +
couverture ≈ 84,7 % ; UI Kit 64 ; api-contracts 11 ; api-client-fetch 29 ; **0 vuln** ; Axios/Zustand
absents. **Décisions** : SSR Auth = **hybride** (Option C serveur read-only pour le privé / Option A
client-only pour le public) — **pas de nouvel ADR** (couvert par ADR-004/005/012) ; middleware = UX léger
**non autoritaire**. **Dette IMPORTANTE non bloquante** : ordre de build monorepo (`packages/*/dist` non
versionnés ; aucune CI — ADR-013). **Corrections documentaires/factuelles + 1 export mort** (zéro
comportement) : `package.json`, `cookie-config.ts` (CSRF actif ; `CSRF_HEADER_NAME` supprimé),
`query-client.ts`, `README.md`, `docs/SECURITY.md`, `docs/ARCHITECTURE.md`. **Rapport permanent** :
`cores/web-nextjs/docs/WEB_CORE_GOVERNANCE_REVIEW.md`. Statut **inchangé** `IMPLEMENTATION_PARTIELLE`.
`packages/` et autres cores **non modifiés**. Commit `docs(web-nextjs): review web core governance`.

**Étape précédente — Web Auth 3 — profil, autorisations et état de session avec TanStack Query** (`@enistere/web-nextjs`) :
Route Handlers `GET /api/auth/me` + `GET /api/auth/authorization` (thin, `force-dynamic`) → handlers
testables (`core/auth/handlers/get-profile`, `get-authorization`, `(Request, deps)→Response`) appelant le
client serveur **read-only** (`enableRefresh:false` → **aucun refresh silencieux** sur une lecture ; 401
propagé), `no-store`, erreurs génériques. **Client BFF navigateur** (`core/auth/client/`) : appels
**same-origin** `/api/auth/*`, `credentials:"include"`, **aucun token lu/exposé**, valide l'enveloppe
`{success,data}`, lève `BffAuthError` (http/network/invalid_response). **TanStack Query** : `authKeys`
(disjoints de `healthKeys`), `sessionQueryOptions`/`authorizationQueryOptions` (`retry:false`, sans
persistance). **`useSession`** : `loading` → `authenticated` → **`anonymous` (401, pas une erreur)** /
**`error` (403/5xx/réseau, 403 distinct d'anonyme)** ; `toPublicAuthError` (générique, sans cause/token).
**`useAuthorization`** : activé **uniquement** si authentifié (aucun appel `/authorization` en anonyme),
helpers `hasRole`/`hasAnyRole`/`hasPermission`/`hasAllPermissions` (**OR/AND, sans wildcard**, ADR-006 ;
affichage conditionnel — **API = autorité finale**). **`useLogout`** : CSRF → `POST /api/auth/logout` →
`removeQueries(authKeys.all)` (**Auth purgé, Health conservé**) ; **échec réseau → pas de purge** (retry).
UI présentationnelle (SessionStatus/AuthorizationStatus + a11y). **206 tests** + **preuve API réelle Auth +
session** (NestJS + PostgreSQL : login → `/me` (profil, **aucun token**, `X-Request-Id`, `no-store`) →
`/authorization` (rôles/permissions) → logout → `/me` **401** ; **read-only sans appel `/auth/refresh`** ;
**changement de droits sans nouveau JWT** : retrait de rôle → `roles:[],permissions:[]` sur la même session,
`/me` toujours 200 ; bundle client **sans** `API_INTERNAL_URL` ni secret). **0 vuln**, Axios/Zustand absents,
React 19.2.7 ; non-régression complète ; API NestJS/packages non modifiés. Commit
`feat(web-nextjs): add session and authorization state`.

## 9. Prochaine étape

**Action unique** : **CI minimale (ADR-013)**. La **Revue globale Web Core — incrément V1** est **terminée**
(verdict `WEB_CORE_V1_INCREMENT_STABLE_WITH_RESERVATIONS` ; rapport
[`WEB_CORE_V1_INCREMENT_REVIEW.md`](../../cores/web-nextjs/docs/WEB_CORE_V1_INCREMENT_REVIEW.md) ; 307 tests ×2
+ runtime réel 49/49 ; aucun défaut bloquant). Sa **principale réserve transverse** — partagée par les revues
gouvernance et Auth V1 — est l'**absence de CI** et l'**ordre de build monorepo** (`packages/*/dist` non
versionnés). La prochaine action outille donc la **non-régression** : pipeline imposant l'ordre
`api-contracts → api-client-fetch → ui-kit → web-nextjs`, `typecheck`/`lint`/`test`/couverture +
`openapi:generate:check`, **sans nouvelle fonctionnalité produit**. **Alternative (décision humaine)** : UI Kit
4 (primitives interactives) si features riches imminentes ; **Files 2 / Mobile Core après la CI**. **Ne pas
démarrer Files 2 tant que la non-régression n'est pas outillée.** Détail :
[`NEXT_ACTIONS.md`](./NEXT_ACTIONS.md).

## 10. Règles à ne pas violer

- Vérifier le repository ; ne jamais se fier au seul rapport précédent.
- Ne jamais inventer un starter ni déclarer « validé » sans tests + revue.
- Ne pas confondre ADR / spécification / preuve / package / intégration.
- Un seul core par mission ; ne pas modifier API Core ou packages sans mission dédiée.
- Signaler tout état Git non propre ; ne pas supprimer une preuve sans remplacement vérifié.
- Mettre à jour `docs/project-status/` + `CHANGELOG.md` en fin de mission.

## 11. Fichiers à lire (dans l'ordre)

1. `docs/project-status/SESSION_HANDOFF.md` (ce fichier)
2. `docs/project-status/FOUNDATION_CURRENT_STATE.md`
3. `docs/project-status/IMPLEMENTATION_MATRIX.md`
4. `docs/project-status/NEXT_ACTIONS.md`
5. `docs/project-status/DECISIONS_REGISTER.md`
6. Pour le API Core : `cores/api-nestjs/docs/API_CORE_V1_IMPLEMENTATION_STATUS.md`

## 12. Commandes utiles

```bash
# Vérifier l'état réel
git status --short
find cores -maxdepth 2 -type f | sort
ls packages/*/

# API Core (cores/api-nestjs/) — nécessite PostgreSQL + MinIO jetables pour e2e
npm run build && npm run lint && npm run test
npm run openapi:check

# Packages (racine)
npm install && npm run build && npm test && npm run generate:check

# UI Kit (cores/ui-kit/)
npm run test --workspace=@enistere/ui-kit

# Web Core (cores/web-nextjs/) — port 3100
npm run check --workspace=@enistere/web-nextjs   # typecheck + lint + test + build
```
