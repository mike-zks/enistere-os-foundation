# DECISIONS_REGISTER.md — Registre de lecture rapide des décisions (ADR)

> **Ne remplace pas les ADR** (`docs/adr/`). Fournit une lecture rapide du **statut d'implémentation**
> de chaque décision validée. Vérifié depuis le repository (2026-06-10).
>
> Statuts d'implémentation : `DECIDE_NON_IMPLEMENTE`, `PARTIELLEMENT_IMPLEMENTE`, `IMPLEMENTE`,
> `IMPLEMENTE_ET_REVU`, `NON_APPLICABLE_ACTUELLEMENT`.

## 1. ADR rédigés et Validés (18)

| ADR | Décision (résumé) | Statut ADR | Statut implémentation | Core | Preuve |
|---|---|---|---|---|---|
| ADR-001 | Monorepo Git hybride | Validé | **PARTIELLEMENT_IMPLEMENTE** | Tous | Structure présente ; ⚠️ **aucun commit** |
| ADR-002 | ORM = Prisma (vs TypeORM) | Validé | **IMPLEMENTE_ET_REVU** | api-nestjs | schema + 5 migrations + tests |
| ADR-003 | Validation = class-validator/transformer | Validé | **PARTIELLEMENT_IMPLEMENTE** | api/web/mobile | backend OK ; clients absents |
| ADR-004 | Auth/session multi-client | Validé | **PARTIELLEMENT_IMPLEMENTE** | api/web/mobile | API OK ; **session web BFF opérationnelle** (login/refresh/logout via cookies `HttpOnly`) **+ état de session navigateur** (`me`/`authorization` read-only, `useSession`/`useAuthorization` TanStack Query, **401→anonymous / 403 distinct**, purge au logout) **+ premier layout protégé résolu côté serveur** (read-only, Option C, hydratation, redirection anonyme, indisponibilité ≠ anonyme) — preuve API réelle ; secure storage mobile absent |
| ADR-005 | Cookies web + CSRF | Validé | **PARTIELLEMENT_IMPLEMENTE** | api/web | **Flux BFF opérationnels** : login/refresh/logout via Route Handlers, cookies `HttpOnly` (access/refresh, `__Host-` prod), **CSRF double-submit** (cookie+header, temps constant, rotation), **Origin/Referer** (fail-closed) — preuve API réelle. Reste : mutations futures réutilisant systématiquement la protection |
| ADR-006 | RBAC + permissions fines | Validé | **IMPLEMENTE_ET_REVU** | api/web/mobile/ui | RBAC API + `AUTH_RBAC_REVIEW` ; **consommé en lecture côté Web** (`useAuthorization` : helpers OR/AND **sans wildcard** pour l'affichage conditionnel — **l'API reste l'autorité finale** ; changement de droits reflété **sans nouveau JWT**, prouvé) |
| ADR-007 | Upload MinIO/S3 + contrats fichiers | Validé | **IMPLEMENTE_ET_REVU** | api/cloud/web/mobile/ui | Files API + `FILES_REVIEW` ; **consommé en LECTURE côté Web** (Web Files 1 : métadonnées **publiques** `GET /api/files/:id` + URL signée courte `POST /api/files/:id/download-url` + téléchargement **direct** depuis le stockage objet, BFF ciblé, **404 anti-énumération**, URL signée **jamais** mise en cache/journalisée, **aucun champ interne** exposé) — preuve API + MinIO réelle ; **upload/suppression/admin côté Web différés** |
| ADR-008 | Design tokens UI Kit | Validé | **PARTIELLEMENT_IMPLEMENTE** | ui-kit/web/mobile | `@enistere/ui-kit` : tokens + **9 primitives Web** (Button/Input/Label/Text/Spinner/VisuallyHidden + **Alert/Card/FormField**, Web UI 1 — CSS pilotée par tokens, aucun hex ; 78 tests, 100 %) ; bibliothèque complète à venir |
| ADR-009 | Stack UI Web (Tailwind/Radix/shadcn) | Validé | **PARTIELLEMENT_IMPLEMENTE** | ui-kit/web | UI Kit **consommé par le Web Core** (CSS `--enistere-*`, classes `enistere-*`) ; primitives ajoutées en **CSS natif tokens** ; **Tailwind/Radix/shadcn TOUJOURS non ajoutés** (différés ; non requis pour les états/composants UI 1) |
| ADR-010 | Stack UI React Native | Validé | **PARTIELLEMENT_IMPLEMENTE** | ui-kit/mobile | tokens prêts (RN-safe) ; composants/ThemeProvider RN non implémentés |
| ADR-011 | Client HTTP = Fetch (vs Axios) | Validé | **PARTIELLEMENT_IMPLEMENTE** | web/mobile/api | `api-client-fetch` **instancié (public + authentifié + Files lecture)** dans le Web Core (façades `auth.login/refresh/logout/getProfile/getAuthorization` **et** `files.getMetadata/createDownloadUrl` via BFF) **+ clients BFF navigateur** (`fetch` same-origin `/api/auth/*` et `/api/files/*`, sans token), preuve API + MinIO réelle ; **Axios absent**. Reste : Mobile |
| ADR-012 | Server state = TanStack Query | Validé | **PARTIELLEMENT_IMPLEMENTE** | web/mobile | **intégré dans le Web Core** (QueryClient retry borné, provider, keys, hooks Health, SSR/hydratation) **+ server state Auth** (`authKeys` disjoints, `useSession`/`useAuthorization`, `retry:false`, **sans persistance**, **purge au logout** — Health conservé) **+ hydratation serveur du profil** (layout protégé : `prefillSessionQuery`, aucun second `/me`) **+ server state Files** (`fileKeys` **disjoints**, `useFileMetadata` query `retry:false`/`enabled` si UUID ; **URL signée = mutation** `useCreateDownloadUrl` retournant `void` → **jamais** en cache de query/mutation, log ou persistance). Reste : autres mutations ; Mobile |
| ADR-013 | CI/CD V1 | Validé | **PARTIELLEMENT_IMPLEMENTE** | cloud/api/web/mobile | **CI minimale** `.github/workflows/ci.yml` (Node 24, `npm ci`, `permissions: contents:read`, jobs ordonnés `api-contracts → api-client-fetch → ui-kit → web-nextjs → audit`, `generate:check`, build/lint/test, `npm audit` 0 vuln, gardes Axios/Zustand). **Reste** : protection de branche, couverture publiée, E2E, CI API runtime (PostgreSQL/MinIO), release/versioning, déploiement, environnements protégés |
| ADR-014 | Registry images | Validé | **DECIDE_NON_IMPLEMENTE** | cloud/api/web | aucune image ; **non couvert par la CI minimale** (aucun build/push GHCR) |
| ADR-015 | Stockage mobile sécurisé | Validé | **DECIDE_NON_IMPLEMENTE** | mobile/api | pas de core mobile |
| ADR-016 | OpenAPI + clients typés | Validé | **PARTIELLEMENT_IMPLEMENTE** | api/web/mobile | contrat + packages ; **consommés** par le Web Core (types via `SchemaOf<>` — Health, Auth `UserProfileResponseDto`/`AuthorizationSummaryResponseDto` **et Files** `PublicStoredFileDto`/`SignedDownloadResponseDto` ; client **instancié** pour Health + BFF Auth + façade Files) — **aucun DTO recopié** |
| ADR-039 | Hachage = Argon2id (vs bcrypt) | Validé | **IMPLEMENTE_ET_REVU** | api-nestjs | `PasswordHasher` + tests |
| ADR-040 | Logging structuré (Pino) | Validé | **IMPLEMENTE_ET_REVU** | api/cloud | Pino + `STRUCTURED_LOGGING_COMPATIBILITY_PROOF` + e2e |

## 2. Décisions validées — état d'application

- **ADR-008/009/010** — UI Kit : **partiellement fait** (tokens + **9 primitives Web**, React 19 — Web UI 1
  ajoute Alert/Card/FormField) ; **consommé par le Web Core** (états UI standardisés). **ADR-009 reste partiel :
  Tailwind/Radix/shadcn volontairement absents** (non requis). Restent : composants supplémentaires (Web)
  et ThemeProvider/NativeWind (Mobile).
- **ADR-011 / 012** — **FAIT (Web)** : `api-client-fetch` **instancié** (public + **authentifié** via BFF)
  et **TanStack Query** intégré — Health **et** server state Auth (`authKeys` disjoints, `useSession`/
  `useAuthorization`, `retry:false`, sans persistance, **purge au logout**), preuve API réelle. Reste : Mobile ;
  mutations.
- **ADR-004 / 005 / 006** — **Flux BFF Auth + état de session opérationnels (Web Auth 2 → 3)** :
  `login`/`refresh`/`logout`/`csrf` (cookies `HttpOnly`, CSRF double-submit, Origin/Referer, logout
  idempotent) **et** `me`/`authorization` (read-only, **aucun refresh silencieux**) → `useSession`
  (**401→anonymous / 403 distinct**) + `useAuthorization` (helpers OR/AND **sans wildcard**, ADR-006 ;
  affichage conditionnel, **API = autorité finale** ; **changement de droits sans nouveau JWT** prouvé) —
  **preuve API réelle**. Reste : **SSR Auth complet / routes protégées / middleware** (après checkpoint de
  gouvernance Web Core).

> **Décisions d'implémentation du Web Core (hors ADR, tracées ici)** : **Next.js 16 + React 19** (vs
> Next 14/React 18) — advisories *high* sans correctif en 14.x ; **0 vuln** avec Next 16 + override
> `postcss ^8.5.15`. **UI Kit aligné React 19** (v0.1.1). Runner **node:test** (pas de Vitest). **Build
> via webpack** (`experimental.extensionAlias` résout les imports `.js → .ts/.tsx` ; Turbopack ne le
> fait pas — convention d'import unique `.js`). **TanStack Query v5** ; **aucun store global**, **aucun
> Axios**. Page Health **`force-dynamic` + `no-store`**. **Auth BFF** : access **et** refresh en cookies
> `HttpOnly` (Option A) ; CSRF **double-submit** (cookie non HttpOnly + `X-CSRF-Token`) ; validation login
> **interne** (pas de Zod — déps minimales) ; le client serveur authentifié **bufferise le corps de
> requête** (`fetch(url, init)`) pour éviter `expected non-null body source` sous le `fetch` patché de Next
> sur réponses non-2xx. `server-only` (npm) **non utilisé** (lève sous node:test) → frontière par
> `next/headers` + tests d'import statiques + exclusion `core/auth/server` de node:test. CSP **différée** (V2).
> **Session/autorisations (Web Auth 3)** : `me`/`authorization` en **read-only** (`enableRefresh:false` →
> 401 sur access expiré, **pas de refresh silencieux** sur une lecture) ; **client BFF navigateur**
> same-origin (`/api/auth/*`, `credentials:"include"`) — **jamais** d'appel direct à l'API ni de token lu en
> JS ; cache `authKeys` **disjoint** de `healthKeys`, `retry:false`, **sans persistance** (pas de
> localStorage/sessionStorage) ; **logout = `removeQueries(authKeys.all)`** (Health conservé ; échec réseau →
> pas de purge) ; helpers RBAC **sans wildcard** (paramètre `trim()` seul, codes API canoniques) pour
> l'**affichage conditionnel** uniquement ; **SSR Auth = Option A client-only** (session chargée après
> hydratation, pas d'appel `/me` serveur ; SSR Auth complet différé). Détail de test : les `queryOptions`
> Auth imposent `gcTime` → chaque `QueryClient` de test est `clear()` en `afterEach` (sinon timer GC ref).
>
> **Checkpoint de gouvernance Web Core (2026-06-10)** — revue de socle (rapport permanent
> `cores/web-nextjs/docs/WEB_CORE_GOVERNANCE_REVIEW.md`). Verdict : socle **cohérent et sûr**, **aucune
> dette bloquante**, statut **maintenu** `IMPLEMENTATION_PARTIELLE`. **Orientation SSR Auth tranchée
> (hybride)** : pages **publiques** = **Option A** (client-only, actuelle) ; layouts/pages **privés** =
> **Option C** (résolution Auth **serveur read-only** : Server Component → cookie store read-only → client
> serveur authentifié `read-only` → API `/auth/me` → **hydratation TanStack Query**) — **pas** de self-HTTP
> (Option B rejetée), **pas** de middleware comme autorité (Option D rejetée). **Aucun nouvel ADR requis** :
> couvert par **ADR-004** (session multi-client), **ADR-005** (cookies) et **ADR-012** (server state /
> hydratation) — il s'agit d'une **convention d'implémentation locale**, à confirmer à l'implémentation
> (Web Auth 4) et à promouvoir en ADR seulement si elle devient structurante. **Middleware/proxy** : rôle
> limité au **filtrage UX** (présence de cookie), **jamais** preuve d'authentification/autorisation
> (l'**API reste l'autorité finale**). **Dette IMPORTANTE non bloquante** : l'ordre de build monorepo
> (`packages/*/dist` non versionnés) n'est imposé par aucune CI (ADR-013). Corrections de cette revue :
> **documentaires/factuelles** uniquement (+ suppression de l'export mort `CSRF_HEADER_NAME`), zéro
> changement de comportement (206 tests + build verts).
>
> **Web Auth 4 — résolution Auth serveur + premier layout protégé (implémente ADR-004/005/012, Option C)** :
> le premier **espace privé** résout la session **côté serveur en lecture seule** (`resolveServerSession` →
> client serveur authentifié `read-only`, `enableRefresh:false` → **aucun refresh au rendu**, appel **direct**
> à l'API `/auth/me`, **jamais** le BFF local), retourne un contrat **sans token** (`authenticated|anonymous|
> unavailable` ; `403`/réseau/`5xx`/réponse invalide→unavailable, **jamais** anonyme), puis **hydrate**
> `authKeys.session()` (`prefillSessionQuery`) → `useSession` authentifié au 1ᵉʳ rendu **sans** second `/me`.
> **Défense par le type** : `ReadOnlyServerCookieStore` (get-only) + `guardReadOnly` (lève sur écriture). **Pas
> de middleware**, **pas de self-fetch**, **pas de QueryClient serveur global**. Redirection anonyme interne
> `/?auth=required` (**temporaire** jusqu'à Web Auth 5) ; sous le **streaming** App Router, `redirect()` est
> délivré en 200 via RSC `NEXT_REDIRECT` + meta-refresh (honoré ; **aucune donnée privée** exposée — vérifié).
> Preuve API réelle **26/26**. Détail : `cores/web-nextjs/docs/protected-routes.md`.
>
> **Web Auth 5 — page de connexion & navigation (implémente ADR-004/005/011/012)** : page **publique
> `/login`** (Server Component) qui **assainit** `returnTo` (`sanitizeReturnTo` — **anti open-redirect** :
> chemin interne uniquement, sinon `/protected` ; refuse hôte/schéma externes, `//`/`\`/`..`, contrôle,
> encodages, routes Auth-API), **résout la session côté serveur** (déjà authentifié ⇒ redirige, jamais de
> formulaire). **Login uniquement via le BFF** (`performBffLogin` : CSRF → `POST /api/auth/login`, **aucun
> token lu**). `useLogin` (`useMutation` **sans `mutationKey`** → aucun credential en clé) **purge** `authKeys`
> au succès (Health conservé), **anti-double-soumission** (verrou `useRef` + bouton désactivé) ; navigation
> **`router.replace(returnTo)` + `refresh()`** (la réponse login, sans profil, **ne crée pas** d'état
> authentifié — la session est résolue côté serveur à la navigation). Formulaire **accessible** (labels/
> `aria`/`autoComplete`, `jest-axe`), **mot de passe jamais persisté/journalisé/sérialisé**, erreurs
> **génériques** (401 **sans énumération**). La redirection anonyme du layout protégé pointe vers
> `/login?returnTo=/protected`. **Aucun middleware, aucune Server Action.** Preuve API réelle **22/22**
> (dont open redirect **bloqué** : `returnTo=https://evil…` → cible réelle `/protected`). Détail :
> `cores/web-nextjs/docs/login-flow.md`.
>
> **Revue globale Auth Web (1 → 5)** — verdict **`AUTH_WEB_V1_STABLE_WITH_RESERVATIONS`** (rapport permanent
> `cores/web-nextjs/docs/WEB_AUTH_V1_REVIEW.md`). Le socle Auth Web, traité comme **un système unique** :
> **aucun défaut de sécurité bloquant** (pas de fuite de token source/HTML/RSC/bundle, **aucun open redirect**,
> session cohérente 401→anonymous / 403·5xx·réseau distincts, CSRF complet sur les mutations + Origin/Referer
> fail-closed, contenu privé jamais exposé avant validation, caches isolés/purgés, droits dynamiques **sans
> nouveau JWT**, contrats OpenAPI = source de vérité). **263 tests fiables (×2, sans hang)** + **runtime 33/33**
> (nominal + erreurs + refresh + droits). **Réserves opérationnelles** (non bloquantes) : CI (non-régression +
> ordre de build des paquets), E2E navigateur, redirections en **streaming** (HTTP 200 + `NEXT_REDIRECT`/
> meta-refresh), **multi-onglets** + fenêtre `staleTime`, durcissement **CSP/HSTS/observabilité**. **Aucune
> correction de code applicatif** nécessaire (seul correctif test-only `gcTime` mutation, déjà dans `447e3b5`).
> Statut Web Core **maintenu** `IMPLEMENTATION_PARTIELLE`. Prochaine action : **états UI & composants
> structurels** (pas d'Auth post-V1).
>
> **Web Files 1 — métadonnées & téléchargement sécurisé (consomme ADR-007/011/012/016, lecture seule)** :
> première feature **Files** du Web Core, **sans upload/suppression/admin**. Deux **Route Handlers BFF ciblés**
> (jamais un proxy générique) : `GET /api/files/:id` (métadonnées **publiques**, client serveur **read-only**
> `enableRefresh:false` → 401 sur access expiré **sans refresh** au rendu, `no-store`) et `POST /api/files/:id/
> download-url` (URL signée courte, client serveur **writable** réutilisant le **refresh BFF existant** — aucune
> seconde stratégie Auth —, **Origin/Referer + CSRF** double-submit, `no-store`). **Ordre de garde** : méthode
> (405) → **validation UUID** (`isUuid` → **400 sans appel API**) → [POST : CSRF/Origin → 403 sans appel API] →
> API. **Seul l'UUID du chemin** est accepté (jamais URL/bucket/storageKey/TTL/headers fournis par le client).
> **L'API reste l'autorité** : permissions `files.read`/`files.download` **et** ownership vérifiées côté API ;
> un **non-propriétaire (même avec la permission) → 404** (anti-énumération) ; `useAuthorization` ne sert qu'à
> l'**affichage conditionnel** du bouton. Mapping d'erreurs **distinct** (`files-response.ts`) préservant le
> **404** (vs Auth qui collapse 404→500), **409** (non téléchargeable : statut/visibilité) et **503** (objet
> stockage manquant). **Client BFF navigateur** same-origin (`credentials:"include"`, **aucun Bearer**, ne lit
> aucun token). **TanStack Query** : `fileKeys` **disjoints** ; **l'URL signée est une mutation**
> (`useCreateDownloadUrl` retourne `void`) **consommée immédiatement** (`triggerDownload` : URL `https`-only
> validée → **ancre temporaire** `rel="noopener noreferrer"`) puis **abandonnée** — **jamais** en cache de
> query/mutation, log, erreur, clé ou `localStorage`/`sessionStorage`. **Aucun champ interne** (storageKey/
> bucket/checksum/ownerId) exposé ; `originalName` rendu en **texte** (aucun `dangerouslySetInnerHTML`). Page
> privée `/protected/files/[id]` réutilisant les états UI (UI 1). **Aucun nouveau composant UI Kit, aucun
> middleware, aucun proxy, aucun Server Action.** **307 tests** + **preuve API + MinIO réelle 21/21** (PostgreSQL
> + MinIO jetables ; upload auto-VALIDATED + objet → propriétaire 200 publics no-store sans champ interne →
> download-url 200 `{url,expiresAt}` → **téléchargement réel MinIO** (octets == upload, image/png) → sans
> permission 403 → non-propriétaire avec permission 404 → quarantaine 409 → objet supprimé 503 → logout 401 +
> page → `/login` ; **aucun** storageKey/bucket/X-Amz-Signature/credentials en métadonnées, logs ou bundle).
> **ADR-007 n'est que partiellement consommé côté Web** (lecture/téléchargement uniquement). Statut Web Core
> **maintenu** `IMPLEMENTATION_PARTIELLE`. Détail : `cores/web-nextjs/docs/files-read-download.md`.
>
> **Revue globale Web Core — incrément V1 (2026-06-10)** — revue **transverse de stabilisation** de l'incrément
> complet (Health + Auth 1→5 + UI 1 + Files 1) comme **un système unique**, **sans nouvelle fonctionnalité**
> (rapport permanent `cores/web-nextjs/docs/WEB_CORE_V1_INCREMENT_REVIEW.md`). Vérifié fichier par fichier +
> commandes + **runtime réel** : architecture (couches, aucun import inversé, frontières client/serveur par test
> statique — `next/headers`/server-config/handlers/http Files **interdits côté client**), BFF **ciblé** (jamais
> proxy ; UUID 400 sans appel API ; CSRF/Origin fail-closed avant API ; `no-store`), TanStack Query (clés
> **disjointes** ; **retry borné Health vs `retry:false` Auth/Files** — divergence **intentionnelle** documentée ;
> **URL signée = mutation, jamais en cache/log**), contrats `SchemaOf<>` (`generate:check` ok, décisions sur
> status/errorCode jamais message), erreurs Files distinctes (400/401/403/404/409/429/503/502/504, **404
> préservé**). **Verdict : `WEB_CORE_V1_INCREMENT_STABLE_WITH_RESERVATIONS`** — **aucun défaut bloquant** (pas de
> fuite token/URL signée/donnée privée en source/logs/bundle/RSC ; pas d'open redirect ; CSRF complet ;
> indisponible ≠ anonyme ; 404 anti-énumération ; **droits dynamiques sans nouveau JWT**). **307 tests ×2** +
> **runtime 49/49** (PostgreSQL + MinIO ; critique rejoué ×2 ; incl. **téléchargement réel MinIO**, **URL signée
> réellement expirée → 403**, **pannes API/MinIO**, concurrence). **Réserves** : importantes (**CI + ordre de
> build monorepo**, E2E navigateur) ; mineures (CSP/HSTS, 429 sans `Retry-After`, contrastes non mesurés, cache
> Files non purgé au logout). **Corrections documentaires seules** (`.env.example` +`WEB_ALLOWED_ORIGINS` ;
> `SECURITY.md` routes protégées implémentées + posture Files) — **zéro changement de comportement**. Statut Web
> Core **maintenu** `IMPLEMENTATION_PARTIELLE`. **Prochaine action : CI minimale (ADR-013)** — outiller la
> non-régression avant d'augmenter la surface (Files 2 / UI Kit 4 / Mobile **après** la CI).
- **ADR-015** — secure storage mobile : avec le Mobile Core.
- **ADR-013** — CI/CD V1 : **première implémentation réelle** (CI minimale `.github/workflows/ci.yml`,
  2026-06-10) — non-régression du monorepo (ordre de build `api-contracts → api-client-fetch → ui-kit →
  web-nextjs → audit`, `npm ci` + Node 24, `permissions: contents:read`, **aucun secret/Docker/registry/
  déploiement**, `npm audit` 0 vuln, gardes Axios/Zustand). **`PARTIELLEMENT_IMPLEMENTE`** : restent protection
  de branche, couverture publiée, E2E navigateur, CI runtime API (PostgreSQL/MinIO), release/versioning,
  déploiement et environnements protégés. **ADR-014** (registry images / GHCR) **non implémenté** — la CI
  minimale ne construit ni ne pousse aucune image. Détail : `.github/workflows/README.md`.
- **ADR-016 (reste)** — **publication** des packages et **intégration** dans les cores.

## 3. ADR au backlog, NON rédigés

`ADR-017 → ADR-038` sont listés dans [`../../docs/adr/ADR_BACKLOG.md`](../../docs/adr/ADR_BACKLOG.md)
avec le statut « À rédiger » (queues, monitoring, crash reporting, E2E, i18n, icônes, maps, offline,
backups, déploiement avancé, charts, Flutter/Angular UI, observabilité distribuée, feature flags,
analytics…). **Aucun fichier ADR correspondant n'existe** → `NON_APPLICABLE_ACTUELLEMENT` jusqu'à
rédaction. Bloquants futurs notables : **ADR-034** (Flutter UI) avant `mobile-flutter`, **ADR-035**
(Angular UI) avant `web-angular`.

## 4. Règle de lecture

Un ADR **Validé** documente une **décision**, pas une **implémentation**. Vérifier toujours la colonne
« Statut implémentation » et la « Preuve » avant de considérer une capacité comme disponible. Toute
divergence avec le repository doit être signalée et corrigée dans ce registre, jamais supposée.
