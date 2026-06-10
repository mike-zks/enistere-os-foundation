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
| ADR-007 | Upload MinIO/S3 + contrats fichiers | Validé | **IMPLEMENTE_ET_REVU** | api/cloud/web/mobile/ui | Files + `FILES_REVIEW` |
| ADR-008 | Design tokens UI Kit | Validé | **PARTIELLEMENT_IMPLEMENTE** | ui-kit/web/mobile | `@enistere/ui-kit` : tokens + 6 primitives Web (64 tests) ; bibliothèque complète à venir |
| ADR-009 | Stack UI Web (Tailwind/Radix/shadcn) | Validé | **PARTIELLEMENT_IMPLEMENTE** | ui-kit/web | UI Kit **consommé par le Web Core starter** (CSS `--enistere-*`, classes `enistere-*`) ; Tailwind/Radix/shadcn **non ajoutés** (différés V2) |
| ADR-010 | Stack UI React Native | Validé | **PARTIELLEMENT_IMPLEMENTE** | ui-kit/mobile | tokens prêts (RN-safe) ; composants/ThemeProvider RN non implémentés |
| ADR-011 | Client HTTP = Fetch (vs Axios) | Validé | **PARTIELLEMENT_IMPLEMENTE** | web/mobile/api | `api-client-fetch` **instancié (public + authentifié)** dans le Web Core (façade `auth.login/refresh/logout/getProfile/getAuthorization` via BFF) **+ client BFF navigateur** (`fetch` same-origin `/api/auth/*`, sans token), preuve API réelle ; **Axios absent**. Reste : Mobile |
| ADR-012 | Server state = TanStack Query | Validé | **PARTIELLEMENT_IMPLEMENTE** | web/mobile | **intégré dans le Web Core** (QueryClient retry borné, provider, keys, hooks Health, SSR/hydratation) **+ server state Auth** (`authKeys` disjoints, `useSession`/`useAuthorization`, `retry:false`, **sans persistance**, **purge au logout** — Health conservé) **+ hydratation serveur du profil** (layout protégé : `prefillSessionQuery`, aucun second `/me`). Reste : mutations ; Mobile |
| ADR-013 | CI/CD V1 | Validé | **DECIDE_NON_IMPLEMENTE** | cloud/api/web/mobile | aucun workflow |
| ADR-014 | Registry images | Validé | **DECIDE_NON_IMPLEMENTE** | cloud/api/web | aucune image |
| ADR-015 | Stockage mobile sécurisé | Validé | **DECIDE_NON_IMPLEMENTE** | mobile/api | pas de core mobile |
| ADR-016 | OpenAPI + clients typés | Validé | **PARTIELLEMENT_IMPLEMENTE** | api/web/mobile | contrat + packages ; **consommés** par le Web Core (types via `SchemaOf<>` — Health **et** Auth : `UserProfileResponseDto`/`AuthorizationSummaryResponseDto` ; client **instancié** pour Health + BFF Auth) — aucun DTO recopié |
| ADR-039 | Hachage = Argon2id (vs bcrypt) | Validé | **IMPLEMENTE_ET_REVU** | api-nestjs | `PasswordHasher` + tests |
| ADR-040 | Logging structuré (Pino) | Validé | **IMPLEMENTE_ET_REVU** | api/cloud | Pino + `STRUCTURED_LOGGING_COMPATIBILITY_PROOF` + e2e |

## 2. Décisions validées — état d'application

- **ADR-008/009/010** — UI Kit : **partiellement fait** (tokens + 6 primitives Web, React 19) ;
  **consommé par le Web Core**. Restent : composants supplémentaires, stacks Tailwind/Radix/shadcn (Web)
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
- **ADR-015** — secure storage mobile : avec le Mobile Core.
- **ADR-013 / 014** — CI/CD + registry : infrastructure (hors core API).
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
