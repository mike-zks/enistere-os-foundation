# SESSION_HANDOFF.md — Transfert de session (compact)

> Document court et exploitable pour démarrer une nouvelle conversation / un autre agent.
> **Source de vérité = le repository**, résumé par `docs/project-status/`. Vérifié le 2026-06-09.

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
- **En cours** : **UI Kit** (`@enistere/ui-kit`, **0.1.1**, privé) — design tokens **+ 6 primitives Web React**
  (Button, Input, Label, Text, Spinner, VisuallyHidden) pilotées par tokens, accessibles. React =
  peerDependency `>=18` ; **aligné et testé sous React 19** (64 tests, 100 %). CSS via
  `@enistere/ui-kit/styles.css`. Statut : **IMPLEMENTATION_PARTIELLE** ; **consommé par le Web Core**.
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
  (`prefillSessionQuery` → `useSession` authentifié au 1ᵉʳ rendu, **sans** second `/me`). **Sans page `/login`,
  sans middleware, sans refresh au rendu.** **230 tests** + preuve **API réelle** Auth + session **+ protégé
  26/26** (PostgreSQL jetable). Statut : **IMPLEMENTATION_PARTIELLE**. Build/dev via **webpack**
  (`extensionAlias`). Note transport : le client serveur authentifié **bufferise le corps** (sinon le
  `fetch` patché de Next échouait sur les réponses non-2xx — `expected non-null body source`).
- **Packages** : `@enistere/api-contracts` et `@enistere/api-client-fetch` (0.1.0, privés) — validés
  **localement** (tests + live 16/16), **non publiés** ; `api-client-fetch` **instancié (public/Health +
  authentifié/BFF Auth login/refresh/logout/me/authorization)** dans le Web Core ; types Auth dérivés via
  `SchemaOf<>` (`UserProfileResponseDto`, `AuthorizationSummaryResponseDto`) — preuve API réelle.
- **Documentaires (spéc seule, aucun starter)** : `cloud`, `mobile-react-native`.
- **Vides** : `ai-core`, `api-spring`, `docs-core`, `mobile-flutter`, `quality-core`, `web-angular`.
- **Absents** : CI/CD, conteneurisation.
- **Git** : `main` poussé sur `origin` (SSH). Commits récents : `feat(web-nextjs): add server-resolved protected layout`,
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

18 ADR **Validés** (001–016, 039, 040). Implémentés et revus : 002 (Prisma), 007 (upload), 039 (Argon2id),
040 (logging). Partiels : 001 (monorepo), 003, **004** (session : adapter serveur Web + **état de session
navigateur** `useSession`/`useAuthorization`, read-only sans refresh silencieux), **005** (cookies web +
**CSRF** : flux BFF login/refresh/logout opérationnels, cookies `HttpOnly`, CSRF double-submit,
Origin/Referer — Web ; reste : autres mutations futures), **006** (RBAC : appliqué **côté API** ;
**consommé en lecture** côté Web via helpers OR/AND sans wildcard pour l'affichage conditionnel —
**l'API reste l'autorité**), **011** (Fetch instancié public + **authentifié** Web + client BFF navigateur),
**012** (TanStack Query intégré Web : server state Health **et** Auth, cache disjoint, purge au logout), 016
(types Auth via `SchemaOf<>`). Décidés non implémentés : 013, 014, 015. **008/009/010 partiels** (UI Kit).
ADR-017→038 = backlog non rédigé. Détail : [`DECISIONS_REGISTER.md`](./DECISIONS_REGISTER.md).

## 8. Dernière étape terminée

**Web Auth 4 — résolution Auth serveur + premier layout protégé** (`@enistere/web-nextjs`) : premier
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

**Action unique** : **Web Auth 5 — page de connexion & navigation Auth contrôlée**. Web Auth 4 est
**terminé** (layout protégé + résolution serveur + hydratation, preuve API réelle 26/26). Implémenter la
page **`/login`** + formulaire (CSRF → `login` BFF), une **redirection interne sûre** **remplaçant** la
cible temporaire `/?auth=required`, et le **retour vers la page demandée** (sans `returnUrl` libre / open
redirect) — **toujours sans middleware autoritaire** ; **API = autorité finale**. **Recommandé en parallèle
(non bloquant)** : CI minimale (ADR-013) ordre de build paquets. Alternative : UI Kit (composants formulaire),
Mobile Core, ou Cloud/CI-CD. Détail : [`NEXT_ACTIONS.md`](./NEXT_ACTIONS.md).

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
