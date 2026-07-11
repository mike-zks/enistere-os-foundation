# FOUNDATION_CURRENT_STATE.md — État courant officiel d'Enistere OS Foundation

> **Photographie officielle** de l'état réel du repository, vérifiée fichier par fichier.
> **Dernière mise à jour : 2026-07-11.**
>
> ⚠️ **Ne pas supposer qu'un core est implémenté parce que sa spécification existe.** Un
> `CORE_SPECIFICATION.md` ≠ un starter ; un README ≠ une implémentation ; un rapport ≠ une preuve
> runtime ; un dossier ≠ un core fonctionnel ; un ADR ≠ du code ; une preuve ≠ un package officiel ;
> un package officiel ≠ une intégration dans un core client.

## 1. Statut global

Le repository combine la **Phase 0 (stratégie + ADR + spécifications)** et des **implémentations
techniques réelles** : le **API Core NestJS**, deux **packages clients officiels**, et le **UI Kit**
(design tokens **+ premières primitives Web React**). Les autres cores sont **documentaires** ou
**vides**. **Aucun client Web/Mobile applicatif n'est implémenté** (le UI Kit fournit tokens + primitives,
pas une application ni une bibliothèque complète).

| Catégorie | État |
|---|---|
| Stratégie (Phase 0) | 10 documents présents |
| ADR | 18 ADR rédigés et **Validés** (001–016, 039, 040) ; ADR-017→038 = backlog non rédigé |
| Core implémenté | **API Core NestJS** (avancé, testé, revu — **386 tests unitaires + e2e**) |
| Core avancé | **UI Kit** (`@enistere/ui-kit`, v0.1.1) — **IMPLEMENTATION_AVANCEE** (UI Kit V1 Readiness Review, 2026-07-11) : tokens **+ 19 primitives Web React** accessibles (Button/Input/Label/Text/Spinner/VisuallyHidden + Alert/Card/FormField + Dialog/Select/Toast, UI Kit 4 + Badge/Divider/Skeleton, UI Kit 5 + **LoadingState/EmptyState/ErrorState/SuccessState**, UI Kit 6) ; **181 tests**, a11y ; aligné **React 19** ; **consommé par le Web Core VALIDE_V1** ; **gap bloquant fermé par RN35** (cohérence mobile/web prouvée : tokens identiques + ThemeProvider + composants maison + 13 tests d'alignement) ; prêt pour VALIDE_V1 review |
| Web Core | **`@enistere/web-nextjs`** — **VALIDE_V1** (14/14 critères §56, 2026-07-10) : Next 16 App Router + React 19, UI Kit + **API publique (Health) + TanStack Query** + **BFF Auth** (`login`/`refresh`/`logout`/`csrf`, cookies `HttpOnly`, **CSRF**, Origin/Referer) + **session/autorisations** (`me`/`authorization` read-only, `useSession`/`useAuthorization`, purge au logout) + **layout protégé** (résolution Auth **serveur** read-only Option C + hydratation, page `/protected`) + **page de connexion `/login`** (formulaire accessible, login BFF, `returnTo` interne assaini anti open-redirect, navigation `replace`/`refresh`) + **états UI & composants structurels** (Web UI 1 : `Alert`/`Card`/`FormField` consommés ; `LoadingState`/`EmptyState`/`ErrorState` **déléguant aux primitives UI Kit 6** (Web Core UI 2) + `UnauthorizedState`(401)/`ForbiddenState`(403)/`ServiceUnavailableState`/`PageHeader`, intégrés accueil/Health/frontières/Auth) + **Files lecture/téléchargement** (Web Files 1 : BFF ciblé `GET /api/files/:id` + `POST /api/files/:id/download-url`, validation UUID, **CSRF/Origin** sur download-url, client BFF navigateur, `fileKeys`, `useFileMetadata` + `useCreateDownloadUrl` (**URL signée jamais en cache/log**), page `/protected/files/[id]`, **404 anti-énumération** ; **aucun champ interne** exposé) + **Files upload** (Web Files 2 : BFF ciblé `POST /api/files/upload`, **CSRF/Origin**, client BFF `uploadFile` (**FormData sans Content-Type forcé**), `useUploadFile` (**mutation sans mutationKey**, anti-double-soumission, résultat jamais en QueryCache), `UploadForm` — **RHF + Zod v4** (V1 Gap 3 : `uploadFormSchema`, `zodResolver`, erreurs `formState.errors`, `aria-describedby` ; `Select` catégories/`Input` fichier+subjectId/`Alert`), page `/protected/files/upload`, mapping 413/415 ; **aucun upload direct MinIO/S3**, **aucun log nom/contenu**) + **Files suppression** (Web Files 3 : BFF ciblé `DELETE /api/files/:id`, `assertDelete`, **UUID 400 avant appel API**, **CSRF/Origin 403 avant appel API**, client `writable`, 409→`NOT_DELETABLE`, **anti-énumération 404** ; client BFF `deleteFile` (same-origin, aucun Bearer) ; `useDeleteFile` (**mutation sans mutationKey**, anti-double-soumission, `removeQueries` après succès) ; Dialog confirmation UI Kit 4 + prop `onDeleteSuccess` + `FileDetailsWithNav` (navigation Next.js isolée) ; **aucun bulk delete/liste/admin/quarantaine**) + **Files liste** (Web Files 4 : BFF ciblé `GET /api/files`, **400 sans appel API** si `limit`/`offset` invalides, client `read-only` sans CSRF, `FileListResponse`, `listFiles` BFF client, `fileKeys.list({ limit, offset })` clé stable, `useFileList` hook (`retry:false`), `FileListView` (états loading/vide/erreur/liste, champs publics, pagination, liens `/protected/files/:id`), page `/protected/files` (Server Component) ; **aucun champ interne** exposé, aucun token client, aucun proxy générique) + **Files V1 revue/durcissement** (Web Files 6 : 4 défauts corrigés — D1 cache delete→list, D2 cache upload→list, D3 message 409 neutre, D4 upload 409→QUOTA_EXCEEDED ; 6 réserves documentées ; rapport `WEB_FILES_V1_REVIEW.md` ; **verdict : stable avec réserves mineures**) + **Files admin BFF** (Web Files 7 : BFF handlers quarantaine/restauration — `handleQuarantineFile`/`handleRestoreFile`, routes `/api/files/[id]/quarantine`+`/restore`, `quarantineFile`/`restoreFile` client BFF navigateur, `useQuarantineFile`/`useRestoreFile` mutations anti-double-soumission + `fileKeys.all` invalidation, `AdminFileActions` UI admin séparée conditionnelle par permission, page `/protected/files/[id]/admin` ; **CSRF+Origin sur toutes les mutations**, jamais de Bearer navigateur, API reste l'autorité ; +53 tests) + **layout public** (V1 Gap 1 : route group `(public)/`, landing page statique `/`, `robots.ts`, `sitemap.ts`, SEO metadata) + **dashboard layout** (V1 Gap 2 : `DashboardShell` Server Component, `(protected)/layout.tsx`) + **RHF + Zod** (V1 Gap 3 : modules §9 obligatoires). **450 tests** + preuves API réelles (Auth/session **26/26** + login **22/22** + **Files API+MinIO 21/21**). **15 tests E2E Playwright.** **Pas de middleware, pas de Server Action Auth, pas de token en JS, pas de proxy générique.** |
| Packages officiels | `@enistere/api-contracts` (**12 tests**), `@enistere/api-client-fetch` (**30 tests**) (validés **localement**, non publiés ; **instanciés (public + authentifié/BFF)** dans le Web Core — preuve API réelle ; **`FilesApi.list()` ajouté (Files 5)**, `files_list` dans schema.ts) |
| Cloud Core | **`cores/cloud`** — **IMPLEMENTATION_PARTIELLE** (CC1 cadrage + **CC2 CI runtime API** + **CC3 CI E2E navigateur** + **CC10 staging réel HTTPS** + **CC11 durcissement opérationnel**) : `api-runtime-ci.yml` (PostgreSQL+MinIO jetables, migrations, unit+e2e, openapi:check) **+ `web-e2e-ci.yml`** (stack réelle API+PG+MinIO+Web + **Playwright/Chromium** : Health/Auth/Files) + cadrage (baseline, politiques, checklist branch protection) + **`docker-compose.cc10.yml` (reverse proxy compatible Traefik + Let's Encrypt ; `sha-5bf4c0f` ; 4 conteneurs `healthy` ; `staging.enistere.com` + `s3-staging.enistere.com` accessibles HTTPS ; auth BFF 200, upload MinIO VALIDATED, URL signée + téléchargement 200 — **bout-en-bout validé**)** + **CC11 (socle opérationnel vérifié) : health HTTPS 200 ×3 + TLS Let's Encrypt OK ; backup PostgreSQL 4.7 Ko gzip + restore validé (comptages lignes) ; backup MinIO + restore test objet PASSED ; rollback `sha-484f98d` healthy + roll-forward `sha-5bf4c0f` healthy ; rotation compte smoke argon2id (valeur non conservée) ; scripts + runbook + rapport versionnés** |
| Core mobile (socle) | **`mobile-react-native`** — **STARTER_UI_KIT_ALIGNED** : socle Expo SDK 55 / Expo Router RN 1→34 + **RN35 alignement UI Kit** (2026-07-11). Primitives RN 1→25, Settings RN26, shell RN27, smoke Android RN28/RN29, préflight iOS RN30 bloqué Linux, RN31 en attente macOS/Xcode, RN32 formulaire sign-in, RN33 thème, RN34 patch Expo SDK. **RN35** : tokens hex/typographie/radius alignés verbatim UI Kit (`cores/ui-kit/generated/typescript/tokens.ts` tokensVersion 0.1.0) ; aliases `LoadingView`/`EmptyView`/`ErrorView` ; 13 tests token-alignment + 367/367 `node --test` total ; `ARCHITECTURE.md` §40 documentant l'alignement. Preuves : typecheck + lint + **test 367/367** `node --test` + expo-doctor **19/19** + `expo export -p ios` + `npm audit` 0 vuln + `git diff --check` verts. `npm run smoke:android` **passed** (`emulator-5554` / Pixel_6a, 2026-07-08). `npm run smoke:ios` blocked (Linux). Aucun réseau métier, endpoint métier, SDK/adaptateur natif réel, nouvelle dépendance, retry branché ni changement Auth/Query. |
| Cores documentaires | _(aucun ; `mobile-react-native` est passé au starter ci-dessus)_ |
| Cores vides | `ai-core`, `api-spring`, `docs-core`, `mobile-flutter`, `quality-core`, `web-angular` |
| CI/CD, conteneurisation | **CI niveaux 1–3 + registry (niveau 4 partiel) + CC10 staging HTTPS réel VALIDÉ** : `ci.yml` + `api-runtime-ci.yml` + `web-e2e-ci.yml` + **`registry-ci.yml`** (images GHCR publiques) ; **Dockerfiles** API/Web ; **CC10** : `docker-compose.cc10.yml`, reverse proxy compatible Traefik + Let's Encrypt HTTP-01, `sha-5bf4c0f`, 4 conteneurs `healthy`, `staging.enistere.com` + `s3-staging.enistere.com` HTTPS, auth BFF + upload + URL signée + téléchargement **bout-en-bout validés** |
| **État Git** | Historique Git actif ; `main` aligné sur `origin/main` au merge RN 3 `574cdcf` ; flux PR actif |

## 2. Principes de vérité

Hiérarchie de confiance (du plus fiable au moins fiable) : **(1)** fichiers/code réels ; **(2)** tests,
scripts, `package.json`, migrations, configs ; **(3)** ADR validés ; **(4)** `CORE_SPECIFICATION.md` ;
**(5)** `strategy/` ; **(6)** README/rapports ; **(7)** CHANGELOG. En cas de contradiction, le code et
les tests réels priment ; un ADR validé prime sur un choix ouvert dans une spécification ; une
spécification ne prouve pas un starter ; un dossier vide ne prouve aucune implémentation.

## 3. Architecture du repository

> **Mise à jour RN35** (2026-07-11) : le statut courant du core `mobile-react-native` est
> **`STARTER_UI_KIT_ALIGNED`**. RN35 aligne les valeurs hex/typographie/radius de
> `src/theme/tokens.ts` sur les valeurs verbatim de
> `cores/ui-kit/generated/typescript/tokens.ts` (tokensVersion 0.1.0), ajoute les
> aliases `LoadingView`/`EmptyView`/`ErrorView` dans `src/states/index.ts`, et
> crée `test/theme-token-alignment.test.ts` (13 tests). Ferme le gap bloquant
> UI Kit V1 Readiness Review (§12.4 4/4, §59 9/9). Vérification locale : typecheck,
> lint, test **367/367**, expo-doctor **19/19**, expo export -p ios, npm audit 0 vuln,
> git diff --check verts.

```
enistere-os-foundation/
  strategy/            10 docs Phase 0 (01..10)
  docs/
    adr/               18 ADR (001–016, 039, 040) + ADR_BACKLOG + ADR_V1_BLOCKING_REVIEW
    project-status/    CE checkpoint (source de pilotage officielle)
    checklists/ decisions/ glossary/ guides/ onboarding/ runbooks/
  cores/
    api-nestjs/        IMPLÉMENTÉ (src, prisma, test, openapi, scripts, docs, proofs/)
    ui-kit/            IMPLEMENTATION_AVANCEE (tokens + 19 primitives Web React, React 19, 181 tests) — v0.1.1
    web-nextjs/        VALIDE_V1 (Next 16 + React 19 ; UI Kit + API publique + TanStack Query + BFF Auth + BFF Files + layouts public/protected + RHF+Zod UploadForm ; 14/14 critères §56 ; 450 tests + 15 E2E)
    cloud/             IMPLEMENTATION_PARTIELLE (spec + README + docs/ + CI runtime API + E2E navigateur + registry GHCR : api-runtime-ci.yml, web-e2e-ci.yml, registry-ci.yml + Dockerfiles + CC10 staging HTTPS réel)
    mobile-react-native/  STARTER_UI_KIT_ALIGNED (Expo SDK 55 + Expo Router ; primitives RN 1→25 ; Settings RN26 ; shell RN27 ; smoke Android RN28/RN29/RN34B ; préflight iOS RN30 bloqué Linux ; RN31 en attente macOS ; RN32 sign-in RHF+Zod ; RN33 thème ; RN34 patch Expo SDK ; RN35 tokens alignés UI Kit + LoadingView/EmptyView/ErrorView + 13 tests ; typecheck/lint/test 367/367/expo-doctor 19/19/export iOS/audit verts)
    ai-core/ api-spring/ docs-core/ mobile-flutter/ quality-core/ web-angular/   → vides
  packages/
    api-contracts/     @enistere/api-contracts (0.1.0, privé)
    api-client-fetch/  @enistere/api-client-fetch (0.1.0, privé)
  package.json         racine privé, workspaces ["packages/*","cores/ui-kit","cores/web-nextjs"]
  prompts/ templates/  présents ; tools/ examples/ vides
  README.md CHANGELOG.md
```

## 4. Cores

| Core | Dossier | Spécification | Starter/code | Statut officiel |
|---|---|---|---|---|
| `api-nestjs` | oui | oui | **oui** | **IMPLEMENTATION_AVANCEE** |
| `ui-kit` | oui | oui | **oui** (tokens + 19 primitives Web, React 19 ; états UI UI Kit 6 ; 181 tests) | **IMPLEMENTATION_AVANCEE** |
| `cloud` | oui | oui | **partiel** (CI runtime API + cadrage docs + **CC10 staging HTTPS réel** : reverse proxy compatible Traefik + Let's Encrypt + `docker-compose.cc10.yml` + 4 conteneurs `healthy` ; auth/upload/URL signée/téléchargement validés + **CC11 socle opérationnel** : health ×3/TLS OK, backup PG + restore validé, backup MinIO + restore test PASSED, rollback `sha-484f98d` healthy, rotation smoke) | **IMPLEMENTATION_PARTIELLE** |
| `web-nextjs` | oui | oui | **oui** (Next 16 + UI Kit + API publique + TanStack Query + BFF Auth + BFF Files + layouts public/protégé + RHF+Zod ; 14/14 critères §56 ; 450 tests + 15 E2E) | **VALIDE_V1** |
| `mobile-react-native` | oui | oui | **oui** (Expo SDK 55 + Expo Router ; socle RN 1→25 ; Settings RN26 ; shell RN27 ; smoke Android RN28/RN29 ; iOS RN30 bloqué Linux ; RN31 en attente macOS ; sign-in RN32 ; thème RN33 ; doctor green RN34 ; **tokens UI Kit alignés + LoadingView/EmptyView/ErrorView + 13 tests alignment RN35 ; 367/367 tests**) | **STARTER_UI_KIT_ALIGNED** |
| `ai-core` | oui (vide) | non | non | **DOSSIER_SEULEMENT** |
| `api-spring` | oui (vide) | non | non | **DOSSIER_SEULEMENT** |
| `docs-core` | oui (vide) | non | non | **DOSSIER_SEULEMENT** |
| `mobile-flutter` | oui (vide) | non | non | **DOSSIER_SEULEMENT** |
| `quality-core` | oui (vide) | non | non | **DOSSIER_SEULEMENT** |
| `web-angular` | oui (vide) | non | non | **DOSSIER_SEULEMENT** |

**API Core NestJS** — modules présents : `config`, `database` (Prisma/PostgreSQL), `health`,
`auth` (login, sessions, refresh, JWT), `users`, `roles`, `permissions`, `audit`, `files` (S3/MinIO),
`common` (logging Pino, filtres, interceptors, OpenAPI), `bootstrap`, `upload` (cadrage). **5
migrations** Prisma, **47 specs unitaires**, **12 specs e2e**, snapshot OpenAPI canonique versionné,
seed RBAC, commandes CLI fichiers. Rapports : `API_CORE_V1_REVIEW`, `AUTH_RBAC_REVIEW`, `FILES_REVIEW`,
`API_CORE_V1_IMPLEMENTATION_STATUS`, `API_CORE_V1_NEXT_ROADMAP`, `OPENAPI_CLIENT_PROOF`,
`STRUCTURED_LOGGING_COMPATIBILITY_PROOF`. Détail : [`../../cores/api-nestjs/docs/API_CORE_V1_IMPLEMENTATION_STATUS.md`](../../cores/api-nestjs/docs/API_CORE_V1_IMPLEMENTATION_STATUS.md).

## 5. Packages

| Package | Version | Privé | Build/Tests | Publié | Intégré dans un core |
|---|---|---|---|---|---|
| `@enistere/api-contracts` | 0.1.0 | oui | oui (types-only, 12 tests) | **non** | **consommé (types) dans `web-nextjs`** (Health + Auth + **Files** : `PublicStoredFileDto`/`SignedDownloadResponseDto` via `SchemaOf<>`) |
| `@enistere/api-client-fetch` | 0.1.0 | oui | oui (30 tests + live 16/16) | **non** | **instancié (public/Health + authentifié/BFF Auth + façade Files lecture) dans `web-nextjs`** |

Dépendance à sens unique : `openapi.json → api-contracts → api-client-fetch`. Le **UI Kit** et les
**paquets API** sont désormais **réellement intégrés** par le Web Core pour les endpoints **publics**
(Health) **et authentifiés** (BFF Auth : login/refresh/logout/me/authorization) : `api-client-fetch` est
**instancié** (factory serveur par requête + client public navigateur + façade Auth serveur), avec preuve
**API réelle**. Côté navigateur, l'état de session est lu via le **client BFF same-origin** (`/api/auth/*`),
sans token ni appel direct à l'API.

## 6. Stratégie (Phase 0)

10 documents présents (`strategy/01_VISION_FINAL.md` … `10_AI_STRATEGY.md`). Certains décrivent un état
« avant code » ou des choix désormais tranchés par des ADR : à lire comme **contexte historique**,
non comme l'état courant (voir §16). Non modifiés par cette mission.

## 7. ADR

**18 ADR rédigés et Validés** : ADR-001..016, ADR-039, ADR-040. ADR-017→038 sont **listés dans
`ADR_BACKLOG.md`** mais **non rédigés** (statut « À rédiger », futurs/non bloquants). Détail et statut
d'implémentation : [`DECISIONS_REGISTER.md`](./DECISIONS_REGISTER.md).

## 8. Implémentations

Implémenté + testé + revu : Auth, sessions, refresh, RBAC, permissions, audit, Files (S3/MinIO),
logging structuré, contrat OpenAPI canonique. Implémenté côté Web Core : UI Kit consommé, API publique
(Health) + TanStack Query (SSR/hydratation), **BFF Auth** (cookies `HttpOnly`, CSRF double-submit,
Origin/Referer), **état de session/autorisations** (`me`/`authorization` read-only, `useSession`/
`useAuthorization`, purge cache au logout), **états UI standardisés** (UI 1) et **Files Web 1→7** :
lecture/téléchargement, upload multipart BFF, suppression BFF, liste paginée BFF, revue V1 et admin
quarantaine/restauration BFF. Les flux Files restent
des BFF ciblés, jamais un proxy générique ; l'API Core reste l'autorité ownership/permissions ; aucun token,
champ interne, URL signée ou contenu fichier n'est exposé au client, aux logs ou aux clés de cache. Implémenté
(local, non publié) : packages clients. Décidé mais non implémenté : secure storage mobile, **SSR Auth complet**,
CI/CD, registry.
Détail : [`IMPLEMENTATION_MATRIX.md`](./IMPLEMENTATION_MATRIX.md).

## 9. Tests

API Core : **386 tests unitaires** (47 suites) + **101 tests e2e** (12 suites, PostgreSQL + MinIO
jetables), couverture disponible. Packages : api-contracts **12**, api-client-fetch **30** (`node:test`),
+ preuve live **16/16** (client officiel vs API réelle). UI Kit : **121 tests** (`node:test` + `global-jsdom`
+ Testing Library + jest-axe, **React 19**) couvrant **12 primitives** (Button/Input/Label/Text/Spinner/
+ VisuallyHidden + Alert/Card/FormField + Dialog/Select/Toast).
Web Core : **446 tests** (`node:test` :
config/URL, clients serveur/public, QueryClient/retry, query keys, transport Health, hooks, **hydratation**,
UI, mapping d'erreurs, garde anti-réseau, **Auth** : cookie-config, session adapter, factory
read-only/writable, **CSRF** (gén/validation temps constant), **Origin/Referer**, validation login, handlers
`csrf`/`login`/`refresh`/`logout`/`me`/`authorization`, isolation A/B, frontières d'import, **sentinelles** ;
**session/autorisations** : client BFF navigateur (envelope, same-origin, 401/403/réseau, aucun token),
`authKeys` disjoints, `useSession` (401→anonymous / 403→error), `useAuthorization` (désactivé en anonyme,
helpers OR/AND sans wildcard), `useLogout` (purge Auth / Health conservé ; échec réseau → pas de purge), UI
session/authorization + a11y ; **Web Auth 4** : résolveur serveur read-only (200/401/403/5xx/réseau/invalide,
isolation, **aucun refresh**, **aucune écriture cookie**), `decideProtectedRender`, **hydratation** (authentifié
au 1ᵉʳ rendu, **0 appel `/me`**, aucun token), vues indisponibilité/notice ; **Web Auth 5** : `sanitizeReturnTo`
(anti open-redirect), validation login, client BFF login (CSRF/body/statuts/**aucune fuite mot de passe**),
`useLogin` (**purge authKeys**, **double-soumission empêchée**, aucun credential en cache), `LoginForm`
(a11y ×4) ; **Files 1** : handlers BFF (UUID **400 sans appel API**, **401/403/404/409/503 distincts**, CSRF/Origin
sur download-url, `no-store`, `requestId`, **aucun champ interne**, read-only **sans refresh**), client BFF Files
(same-origin, `credentials:include`, **aucun Authorization**, **URL absente des erreurs**), `useFileMetadata`
(clé disjointe, désactivée si UUID invalide, 404/503, retry false), `useCreateDownloadUrl` (CSRF→POST, **URL
jamais en cache**, anti-double-clic, 409), `isUuid`/`formatFileSize` (BigInt)/`formatDateTime`/`isSafeDownloadUrl`/
`triggerDownload` (schémas dangereux refusés, ancre nettoyée), `classifyFileError`, vue métadonnées + axe ; **Files 2** : handler upload BFF (méthode/CSRF/Origin/fichier-absent/catégorie-invalide/toutes-catégories/**401/403/413/415/429/503**/requestId), client BFF upload (same-origin, **aucun Content-Type forcé**, 413/415, réseau), `useUploadFile` (succès/no-cache, anti-double-soumission, **413→too\_large**/**415→unsupported\_type**/401, reset, subjectId) ; **Files 3** : handler delete BFF (`assertDelete`/UUID 400/**CSRF/Origin 403 avant appel API**/client writable/**409→NOT_DELETABLE**/404 anti-énumération/401/403/429/503/requestId), client BFF delete (DELETE same-origin, UUID encodé, aucun Authorization, **204→null body fix**), `useDeleteFile` (succès+**removeQueries**, double-clic empêché, 409/404/401, reset, isPending) ; **Files 4** : handler list BFF (GET/405, validation limit 1–50/offset≥0/**400 sans appel API** si invalide, client read-only, no-store, filesErrorResponse), client BFF `listFiles` (same-origin, credentials:include, aucun Bearer, qs paramétré), `fileKeys.list` (clé stable, jamais de token), `useFileList` (retry:false), `FileListView` (loading/vide/erreur/liste, champs publics, pagination Précédent/Suivant, aucun champ interne)) +
`next build` + **sonde HTTP** + **preuve API réelle** (NestJS + PostgreSQL jetable) : Auth + session
(login → `/me` → `/authorization` → logout → `/me` 401 ; **read-only sans refresh** ; **droits sans nouveau
JWT**), **espace protégé 26/26** et **connexion 22/22** (anonyme `/protected` → **redirection `/login`** ;
`/login` → formulaire ; login BFF → `authenticated` sans token ; authentifié `/login` → redirection hors login ;
**`returnTo` externe → `/protected`** (aucun open redirect) ; logout → `/login` ; 401 sans énumération ; 403 CSRF ;
bundle/HTML sans secret/mot de passe), **et Files (API NestJS + MinIO jetables) 21/21** (upload auto-VALIDATED +
objet → propriétaire `GET /api/files/:id` **200** publics no-store sans champ interne → `download-url` **200**
`{url,expiresAt}` → **téléchargement réel MinIO** (octets == upload, image/png) → sans permission **403** →
**non-propriétaire avec permission → 404** → quarantaine **409** → objet supprimé **503** → logout **401** + page →
`/login` ; **aucun** storageKey/bucket/X-Amz-Signature/credentials en métadonnées, logs ou bundle). Une **CI
minimale** (`.github/workflows/ci.yml`) rejoue désormais la non-régression du monorepo (hors e2e/runtime).

## 10. Preuves

- `OPENAPI_CLIENT_PROOF.md` — preuve `openapi-typescript`/`openapi-fetch` (concluante, **migrée** en
  packages ; code de preuve retiré, voir `cores/api-nestjs/proofs/openapi-client/README.md`).
- `STRUCTURED_LOGGING_COMPATIBILITY_PROOF.md` — compatibilité `nestjs-pino` (repli Pino direct, ADR-040).

## 11. CI/CD

**CI minimale présente** (ADR-013 **partiellement implémenté**) : `.github/workflows/ci.yml` (GitHub Actions,
Node 24, `npm ci`, `permissions: contents:read`, `concurrency`) impose l'ordre de validation **api-contracts →
api-client-fetch → ui-kit → web-nextjs → audit** : `generate:check`, typecheck/lint/build/test, `pack:check`
UI Kit, **build Web indépendant de l'API**, `npm audit` (0 vuln) et **gardes Axios/Zustand absents**
(ADR-011/012). **Aucun secret, aucun Docker, aucune base/stockage, aucun déploiement, aucun registry.**
**Restent** (au-delà de la CI minimale `ci.yml`) : protection de branche, couverture publiée, release/versioning,
déploiement, environnements protégés. **ADR-014 (registry/GHCR) → `PARTIELLEMENT_IMPLEMENTE`** (Cloud Core 5,
ci-dessous : build + push images). Détail : `.github/workflows/README.md`.
Le **Cloud Core 1** (cadrage) gouverne cette CI ; le **Cloud Core 2** ajoute le **niveau 2**
(`api-runtime-ci.yml` : API NestJS contre PostgreSQL + MinIO jetables, migrate deploy, unit + e2e,
openapi:check, build, audit) ; le **Cloud Core 3** ajoute le **niveau 3** (`web-e2e-ci.yml` : **E2E navigateur**
sur stack réelle API + PostgreSQL + MinIO + Web + **Playwright/Chromium** ; parcours **Health/Auth/Files** ;
utilisateurs + fichier VALIDATED éphémères ; `APP_ENV=development` pour cookies HTTP). **Valeurs de test
jetables**, **aucun secret GitHub**, données éphémères, traces `retain-on-failure` (**aucun artefact poussé**).
Le **Cloud Core 5** ajoute le **niveau 4 partiel** (`registry-ci.yml` + **Dockerfiles** API/Web multi-stage
non-root, Web **standalone**) : build des images + **push GHCR sur `main`** (tags immuables `sha-`/`main-`,
**pas de `latest`**, labels OCI, auth `GITHUB_TOKEN`, **aucun secret/PAT/`.env`**) — **sans déploiement**.
**Politique CI à 4 niveaux** : 1–3 présents, **4 partiel** (registry ; déploiement futur). Le **Cloud Core 4** a figé les
**7 checks** à rendre bloquants sur `main` (= `name:` des jobs) et tranché les politiques artefacts/couverture/
pinning ; la protection de branche `main` reste une **action humaine manuelle**. Enfin le **Cloud Core 5** a
livré la **registry GHCR** (niveau 4 partiel) : `registry-ci.yml` + Dockerfiles API/Web (multi-stage, non-root,
Web standalone) → build + **push images sur `main`** (tags immuables, labels OCI, `GITHUB_TOKEN`, **sans
déploiement/secret/PAT**) — `docker build` API+Web **validé localement**, ADR-014 → `PARTIELLEMENT_IMPLEMENTE`.
Puis le **Cloud Core 6 — déploiement staging manuel** a livré le **cadrage** staging (`cores/cloud/staging/` :
compose+`.env` exemples validés `docker compose config` + runbooks **déploiement/rollback**) — `CADRE_MANUEL_DOCUMENTE`,
**aucune exécution réelle/secret/automatisation/`latest`** ; **CC5B validé** (images GHCR publiques). Enfin le
**Cloud Core 7 — préparation serveur staging & dry-run contrôlé** a **exécuté un dry-run local réel** (images
GHCR immuables `sha-7b07e5e` + `.env.staging` **réel hors dépôt**, secrets jetables supprimés) :
`compose config`/`pull` OK, `postgres`+`minio`+bucket, **image Web boote (HTTP 200)** — **mais l'image API
crash-loop** (query engine Prisma **OpenSSL 1.1.x** dans `.prisma/client` vs runtime **Debian bookworm 3.0.x**),
défaut **invisible à la CI** (runtime de l'image jamais exécuté). Enfin le **Cloud Core 8 — correction de l'image
runtime API** a **corrigé et re-validé** ce défaut : `binaryTargets=["native","debian-openssl-3.0.x"]` (schéma)
+ `openssl` au stage build (Dockerfile) → moteur **3.0.x** dans `.prisma/client` ; **re-validation réelle**
(image + moteur 3.0.x) : **migrations depuis l'image** (offline, 5 appliquées), API **`healthy`** `/health/live`
& `/health/ready` **200**, Web **200**, **stack staging complète healthy** ; **angle mort CI fermé** par le job
**`api-smoke`** (`registry-ci.yml` : lance l'image, vérifie le chargement du moteur Prisma → **gate du push**).
Déploiement staging → **`DRY_RUN_API_IMAGE_FIXED`** ; **stratégie migrations** tranchée = **Option A (depuis
l'image)** ; décision **MinIO/URL signée** = Option A. Détail : `cores/cloud/docs/STAGING_DRY_RUN_REPORT.md` §8.
⚠️ L'**image GHCR corrigée** est **publiée par la registry CI au merge CC8** (`sha-d1e6242`, vérifiée CC8B/8C ;
tags antérieurs cassés). Enfin le **Cloud Core 9 — exécution staging contrôlée** a **exécuté réellement la stack**
(API+Web+PostgreSQL+MinIO) avec les **images corrigées** `sha-d1e6242`, en environnement **Type D : local, sans
exposition publique** (aucun serveur distant/SSH/DNS/HTTPS) : `compose config` valide (no `latest`), **migrations
depuis l'image** (offline), **API & Web `healthy`**, `/health/live`+`/health/ready`+`/`+`/login` = **200**,
**endpoint MinIO Option A joignable** par l'hôte ; ⚠️ **non validé** : **URL signée** bout-en-bout (presign API
non exercé ; `mc` → 403) et **Auth/Files** applicatifs (**aucun utilisateur staging** — seed bloqué). Statut
staging → **`EXECUTION_LOCALE_CONTROLEE`** (détail : `cores/cloud/docs/STAGING_EXECUTION_REPORT.md`). Enfin, une
**revue stratégique d'alignement** (`docs/project-status/ROADMAP_ALIGNMENT_REVIEW.md`) a constaté que la séquence
**Cloud Core 1→9** (CI = V2, registry/staging = V3/VF) a **dépassé l'ordre roadmap** alors que **Mobile Core RN —
priorité #2 V1 — n'a jamais été démarré** → **décision : Cloud Core en PAUSE contrôlée** (CC10 serveur réel
**reporté** — dépendance externe), **retour aux priorités V1**. **Mobile Core RN 1 (starter, #11 mergé)**, **RN 2 — auth/session hardening**, **RN 3 — forms/validation/offline**
**RN 4/4B — client officiel + pont 401**, **RN 5 — server-state**, **RN 6 — état local UI + purge logout**,
**RN 7 — primitives d'upload sécurisé multipart**, **RN 8 — logger/observabilité client (avec redaction)**,
**RN 9 — permissions natives génériques gouvernées**, **RN 10 — notifications locales génériques**,
**RN 11 — i18n / localisation primitives génériques**, **RN 12 — deep-linking / routing primitives génériques**,
**RN 13 — analytics / télémétrie primitives génériques (avec redaction, sans SDK réel)**, **RN 14 — accessibilité (a11y)
primitives génériques**, **RN 15 — app lifecycle primitives génériques**, **RN 16 — connectivité réseau (network
status) primitives génériques**, **RN 17 — feature flags / config primitives génériques**, **RN 18 — gate biométrique
local primitives génériques**, **RN 19 — crash / error-reporting primitives génériques (seam, sans SDK réel)**, **RN 20 —
préférences non sensibles persistantes primitives génériques (seam, sans MMKV/AsyncStorage réel)**, **RN 21 —
consentement télémétrie / privacy gate primitives génériques**, **RN 22 — environnement / métadonnées app primitives
génériques non identifiantes (seam, sans `expo-application`/`expo-device` réel)**, puis **RN 23 — presse-papiers
(clipboard) sécurisé primitives génériques (seam, sans `expo-clipboard` réel) RÉALISÉ** (`mobile-react-native` →
**CLIPBOARD_READY** ; **ajoute `src/clipboard`** — le presse-papiers est un **canal transitoire, partagé et non fiable** :
son **contenu n'est JAMAIS loggé** (métadonnées seules) et **n'est jamais persisté** (sécurité ADR-040 §17/§18, ADR-015
§21/§24) ; ajouts : `ClipboardSensitivity` (`normal`/`sensitive`) + `ClipboardOperationResult` (`success`/`unavailable`/
`rejected`/`error`) ; `normalizeClipboardText` (coercition + borne `MAX_CLIPBOARD_TEXT_LENGTH`) ;
**`isSensitiveClipboardText`** (réutilise la **redaction RN 8** `redactString` : Bearer/JWT/email/URL signée/URI
`file://`/`content://` → **sensible**) + `classifyClipboardSensitivity` ; **`describeClipboardTextForLog`** →
**`{length,sensitivity}` SEULEMENT** (jamais le contenu) ; `ClipboardAdapter` (seam `expo-clipboard` : `setString` requis,
`getString?`/`hasString?`/`clear?` optionnels) + **`ClipboardAdapterError`** contrôlé + **placeholder** mémoire (slot
transitoire, `peek` test-only) + `createClipboardService({adapter, logger?})` (`copy(text, options?)`/`getString()`/
`hasString()`/`clear()` ; **`copy` REFUSE un texte `sensitive`** (détecté **ou** `markSensitive`) sauf `allowSensitive:
true` → **`rejected`, adaptateur NON appelé** ; **`getString` opt-in explicite** (jamais auto ; valeur sensible renvoyée à
l'appelant mais **jamais loggée**) ; **`clear` no-op sûr** si non supporté ; **best-effort non-intrusif** — adapter qui
throw → `error` + `warn`, **ne throw jamais** ; **logs RN 8 sûrs** `{operation,result,sensitivity,length}` — **jamais le
contenu**) ; **clipboard NON stocké** (pas de preferences RN 20/Zustand RN 6/TanStack Query/SecureStore) ; **aucun
`expo-clipboard` réel/réseau/persistance/UI/lecture auto** ; **330 tests `node --test`**, typecheck/lint/test/doctor +
`git diff --check` verts ; RN 23 **n'ajoute aucune dépendance**), puis **RN 24 — retry / backoff primitives génériques
RÉALISÉ** (`mobile-react-native` → **RETRY_READY** ; **ajoute `src/retry`** — `RetryPolicy` borné, backoff exponentiel
borné avec jitter déterministe via `rng`, classification retryable structurelle, `withRetry` à `sleep` injecté,
**401/403/session-expired hard-blockés**, erreur finale originale propagée, logs `{attempt,delayMs}` seuls ; **aucun
réseau réel, aucune dépendance, aucun `Date.now()` testé, aucun branchement AuthEngine/withAuthRetry/QueryClient/
mutations** ; **346 tests `node --test`**, typecheck/lint/test/doctor + `git diff --check` verts), puis **RN 25 —
telemetry context composition opt-in RÉALISÉ** (`mobile-react-native` → **TELEMETRY_COORDINATOR_READY** ;
`src/telemetry`, consentement RN21 default-deny + contexte RN22 safe + analytics RN13/crash RN19 opt-in, sans SDK réel/
réseau/persistance/identity/auto-start/retry RN24 ; **355 cas `test(...)`**, typecheck/lint/test/doctor +
`git diff --check` verts), puis **RN 26 — V1 usable starter shell / settings générique RÉALISÉ**
(`mobile-react-native` → **STARTER_SETTINGS_READY** ; route Settings protégée, lien Home, diagnostics session/UI/
consent placeholder/environnement safe/primitives, aligné roadmap Mobile V1, sans réseau/endpoint métier/SDK réel/
adaptateur natif/persistance/retry branché). Cloud Core reste
**PAUSE_CONTROLEE**, staging **EXECUTION_LOCALE_CONTROLEE**. Puis **RN 27 — durcissement runtime du starter Expo
RÉALISÉ** (`mobile-react-native` → **STARTER_RUNTIME_HARDENED** ; boutons bornés/full-width, conteneurs Sign-in/Home
contraints, lignes Settings wrap-safe ; `expo export -p ios` vert ; export web non applicable sans `react-native-web`
volontairement non ajouté). Puis **RN 28 — smoke visuel device/simulateur du starter RÉALISÉ**
(`mobile-react-native` → **STARTER_VISUAL_SMOKE_READY** ; Android Emulator `Pixel_6a` via Expo Go, sign-in public,
Home protégé, Settings protégé, scroll, retour, refresh session et sign out validés avec mock auth local temporaire ;
aucune correction UI/runtime requise). Puis **RN 29 — automatisation locale du smoke runtime starter RÉALISÉ**
(`mobile-react-native` → **STARTER_SMOKE_AUTOMATION_READY** ; `npm run smoke:android`, mock auth local, `adb
reverse`, pilotage par labels UI Android, rapport JSON `passed` sur `emulator-5554`, sans backend réel ni dépendance).
Puis **RN 30 — smoke runtime iOS / parity device BLOQUÉ PROPREMENT**
(`mobile-react-native` → **STARTER_IOS_SMOKE_BLOCKED_BY_ENVIRONMENT** ; `npm run smoke:ios`, rapport JSON
`blocked`, hôte Linux sans `xcrun`, procédure macOS/device documentée, aucune preuve iOS artificielle).
**CC11 RÉALISÉ** (2026-07-11) — socle opérationnel : health HTTPS ×3 + TLS, backup PG 4.7 Ko + restore validé, backup MinIO + restore test objet, rollback `sha-484f98d` + roll-forward `sha-5bf4c0f`, rotation compte smoke. Scripts versionnés + runbook + rapport. **Prochaine action** : à décider hors Cloud réel immédiat ; RN31 reste bloqué par précondition externe macOS/Xcode, et les prochains tests de déploiement Cloud réel doivent être regroupés comme gate final.
**Actions humaines** : protection de branche `main` (7 checks + `images` requis) + rendre `api-smoke` requis.
> **Governance 1 (2026-07-09)** : revue de cohérence CI/gouvernance après Files 7. Checks CI vérifiés alignés avec la documentation (noms de jobs = checks documentés exactement). Corrections : `README.md` workflows (ADR-014 `NON_IMPLEMENTE` → `PARTIELLEMENT_IMPLEMENTE` + niveaux 1–3+4 partiel) ; `SESSION_HANDOFF.md` §5 (statut mobile `RETRY_READY` → `STARTER_EXPO_DOCTOR_GREEN`). Aucun workflow modifié.
> **V1 Gap 1 (2026-07-10)** : route group `(public)/` ajouté — layout public Server Component (header nav + footer), landing page statique à `/` (SEO `robots:index:true`, `openGraph`, h1 "Enistère OS Foundation"), page technique de statut déplacée à `/status`, `robots.ts`, `sitemap.ts`. **Critère §56 #11 fermé** (SEO baseline). **Critère #3 avancé** (layout public présent, dashboard layout = V1 Gap 2). **Readiness V1 : 12/14.** `typecheck`/`lint`/`test 446/446`/`build`/`audit`/`diff --check` verts.
> **V1 Gap 2 (2026-07-10)** : `DashboardShell` Server Component ajouté (`src/features/dashboard/dashboard-shell.tsx`) — header de navigation protégé (Accueil/Fichiers/Envoyer un fichier). Intégré dans `(protected)/layout.tsx` uniquement sur le chemin authentifié. Liens `<a>` natifs (compatibilité `tsconfig.test.json`). Test E2E ajouté (nav dashboard — 14 → 15 tests). **Critère §56 #3 fermé** (layouts standards : public ✓ + dashboard/protégé ✓). **Readiness V1 : 13/14.** Seul #9 (RHF+Zod) reste. `typecheck`/`lint`/`test 446/446`/`build`/`audit`/`diff --check` verts.
> **V1 Gap 3 (2026-07-10)** : `UploadForm` migré vers React Hook Form + Zod v4 (`upload-form-schema.ts`, `zodResolver`, erreurs `formState.errors`, `aria-describedby`, reset complet). **Critère §56 #9 fermé**. **Readiness V1 : 14/14 — Web Core `VALIDE_V1`.** `typecheck`/`lint`/`test 450/450`/`build`/`audit`/`web-e2e`/images CI verts.

## 12. Documentation

Riche : stratégie, ADR, spécifications, rapports API, READMEs de modules. Ce checkpoint
(`docs/project-status/`) devient la **source de pilotage** ; les rapports API restent la référence
détaillée du API Core.

## 13. Risques

1. ~~Aucun commit Git~~ **RÉSOLU** — historique Git actif ; `main` et `origin/main` sont alignés au merge RN 3
   `574cdcf`. Reste : maintenir le flux PR et les checks requis.
2. **Packages intégrés (public + authentifié)** — UI Kit consommé + `api-client-fetch` **instancié**
   (endpoints publics **et** BFF Auth) par le Web Core ; types Auth dérivés via `SchemaOf<>`. Risque de
   dérive si le contrat évolue sans régénération (mitigé par `generate:check`, non automatisé).
3. **Spécifications sans starter** — `cloud` peut être lu à tort comme implémenté (PARTIEL/PAUSE). `mobile-react-native` dispose d'un socle vérifié et rejouable localement (**STARTER_EXPO_DOCTOR_GREEN** : primitives RN 1→25 + Settings RN26 + runtime RN27 + smoke Android RN28/RN29/RN34B + préflight iOS RN30 bloqué Linux + formulaire RN32 + thème RN33 + Expo doctor RN34) ≠ implémentation complète (V1 partielle : écran/picker d'upload, push distant réel + token device, adaptateurs natifs réels, catalogues métier i18n + routes concrètes, SDK analytics/crash réels, application exhaustive des props a11y, offline sync réelle, remote-config réel, biométrie réelle, store préférences natif, UI consentement, backend d'observabilité — différés).
4. **CI minimale en place** (`.github/workflows/ci.yml`) — non-régression du monorepo automatisée (ordre de
   build imposé, `npm ci`, audit, gardes deps). Risque résiduel : **pas de protection de branche**, pas d'E2E
   navigateur, pas de CI runtime API ; reproductibilité hors-CI (clone local) à documenter.
5. **Strategy Phase 0 partiellement datée** — contexte historique à ne pas confondre avec l'état réel.
6. **Image runtime API — défaut Prisma engine CORRIGÉ (Cloud Core 8)** : le query engine de `.prisma/client`
   était compilé pour **OpenSSL 1.1.x** vs runtime **bookworm 3.0.x** (crash-loop). Corrigé via `binaryTargets`
   (schéma) + `openssl` au stage build → moteur **3.0.x** ; re-validé (stack staging `healthy`). **Angle mort CI
   fermé** (`api-smoke` gate le push). ⚠️ Risque **résiduel** : l'**image GHCR corrigée** n'est republiée
   qu'**au merge CC8** (rebuild local impossible — egress npm) ; les tags ≤ `sha-7b07e5e` restent cassés. À
   faire (humain) : rendre **`api-smoke` requis** sur `main`. Détail : `cores/cloud/docs/STAGING_DRY_RUN_REPORT.md` §8.

## 14. Incohérences

Voir la liste détaillée dans [`IMPLEMENTATION_MATRIX.md`](./IMPLEMENTATION_MATRIX.md) §contradictions
et [`DECISIONS_REGISTER.md`](./DECISIONS_REGISTER.md). Principales : ADR validés non implémentés (UI,
CI/CD, registry, secure storage, cookies, server state) ; packages « officiels » non intégrés ;
`strategy/` Phase 0 vs implémentation réelle ; rapport `OPENAPI_CLIENT_PROOF` référençant un code de
preuve désormais retiré (bannière de migration ajoutée).

## 15. Prochaine étape

Le **Web Core** (`@enistere/web-nextjs`, **`VALIDE_V1`** — 14/14 critères §56, 450 tests + 15 E2E) expose les **flux BFF
Auth** (`login`/`refresh`/`logout`/`csrf`) **et l'état de session/autorisations** (`me`/`authorization`
read-only, hooks `useSession`/`useAuthorization`, purge du cache Auth au logout, `403` distinct d'`anonymous`,
helpers OR/AND sans wildcard) — **prouvés contre l'API réelle**. Le **Checkpoint de gouvernance** a été réalisé
([`WEB_CORE_GOVERNANCE_REVIEW.md`](../../cores/web-nextjs/docs/WEB_CORE_GOVERNANCE_REVIEW.md)), **Web Auth 4** a
livré le **layout protégé** (résolution Auth **serveur read-only** Option C + **hydratation**, page `/protected`,
redirection anonyme, indisponibilité), puis **Web Auth 5** la **page de connexion `/login`** : formulaire
accessible, **login BFF** (CSRF, **aucun token**), **`returnTo` interne assaini** (anti open-redirect),
navigation **`replace`/`refresh`**, redirection d'un utilisateur déjà authentifié — **sans middleware, sans
Server Action Auth, sans token en JS** (**263 tests** + preuves API réelles **26/26** + **22/22** ; détails
[`protected-routes.md`](../../cores/web-nextjs/docs/protected-routes.md),
[`login-flow.md`](../../cores/web-nextjs/docs/login-flow.md)). La **Revue globale Auth Web (1 → 5)** a été
**réalisée** (rapport [`WEB_AUTH_V1_REVIEW.md`](../../cores/web-nextjs/docs/WEB_AUTH_V1_REVIEW.md)) — verdict
**`AUTH_WEB_V1_STABLE_WITH_RESERVATIONS`** : socle Auth **sûr et cohérent** (aucune fuite de token, **aucun open
redirect**, session cohérente, contenu privé jamais exposé, droits sans nouveau JWT), **263 tests fiables ×2** +
**runtime 33/33**, **aucun défaut bloquant** ; réserves **opérationnelles** (CI, E2E navigateur,
streaming-redirect, multi-onglets, CSP/HSTS). Puis **Web Core UI 1** a livré les **états UI & composants
structurels** : primitives UI Kit `Alert`/`Card`/`FormField` (socle UI Kit désormais **121 tests**) + compositions Web
(`LoadingState`/`EmptyState`/`ErrorState`/`UnauthorizedState`(401)/`ForbiddenState`(403)/`ServiceUnavailableState`/
`PageHeader`, **270 tests**), intégrées (accueil/Health/frontières/Auth), accessibles (axe), **sans donnée
sensible** (détail [`ui-states.md`](../../cores/web-nextjs/docs/ui-states.md)). Enfin **Web Core Files 1** a livré
la **première feature de données** en **lecture seule** : deux **Route Handlers BFF ciblés** (`GET /api/files/:id`,
`POST /api/files/:id/download-url`, jamais un proxy générique ; validation **UUID** → 400 sans appel API ;
**CSRF/Origin** sur download-url ; mapping d'erreurs distinct préservant **404 anti-énumération**/409/503), un
**client BFF navigateur** (aucun Bearer), `fileKeys` **disjoints**, `useFileMetadata` (query) + **`useCreateDownloadUrl`**
(**mutation** : URL signée **consommée puis abandonnée**, jamais en cache/log), téléchargement par **ancre
temporaire** (`https`-only), et une page privée `/protected/files/[id]` réutilisant les états UI — **l'API restant
l'autorité** (permission + ownership), **aucun champ interne** exposé. **Web Core Files 2** a livré l'**upload sécurisé BFF multipart** : BFF ciblé `POST /api/files/upload` (CSRF/Origin obligatoires, validation fichier+catégorie, client `writable` avec un seul refresh coordonné), client BFF navigateur `uploadFile` (**FormData sans Content-Type forcé**, same-origin, aucun Bearer), mutation `useUploadFile` (**sans `mutationKey`**, anti-double-soumission, résultat jamais en QueryCache), `UploadForm` (9 catégories Select, fichier+subjectId, Alert erreur/succès), page `/protected/files/upload`, mapping 413/415 — **l'API Core reste l'autorité** MIME/taille/permissions (ADR-007), **aucun upload direct MinIO/S3**, **aucun log de nom/contenu**. **Web Core Files 3** a livré la **suppression sécurisée BFF** : `DELETE /api/files/:id` (`assertDelete`, UUID 400 avant appel API, CSRF/Origin 403 avant appel API, client `writable`, 409→`NOT_DELETABLE`, anti-énumération 404), client BFF `deleteFile`, `useDeleteFile` (anti-double-soumission, `removeQueries` après succès), Dialog confirmation UI Kit 4, prop `onDeleteSuccess`, `FileDetailsWithNav`. **Web Core Files 4** a livré la **liste paginée BFF** : `GET /api/files`, validation `limit`/`offset` 400 avant appel API, client `read-only`, `FileListResponse`, `listFiles`, `fileKeys.list`, `useFileList` (`retry:false`), `FileListView` et page `/protected/files` (**390 tests** + **preuve API + MinIO réelle 21/21**). **Web Core Files 6** a réalisé la **revue globale Files V1** : 4 défauts corrigés (D1 cache delete→list, D2 cache upload→list, D3 message 409 neutre, D4 upload 409→QUOTA_EXCEEDED), 3 tests ajoutés, verdict **stable avec réserves mineures** (**393 tests**). **Web Core Files 7** a livré l'**admin BFF quarantaine/restauration** : handlers ciblés `POST /api/files/:id/quarantine|restore`, routes BFF, client navigateur same-origin sans Bearer, hooks mutations sans `mutationKey` avec anti-double-soumission et invalidation `fileKeys.all`, UI admin conditionnelle par permission et page `/protected/files/[id]/admin` ; CSRF+Origin obligatoires et API autoritaire (**446 tests**). **Web Core V1 Gap 3** a fermé le dernier critère §56 n°9 ("formulaires et validations fonctionnent") : `upload-form-schema.ts` (Zod v4 — `z.instanceof(File)`, `z.enum`, `z.string().max(128)`) + `upload-form.tsx` migré vers `useForm({ resolver: zodResolver })` + 4 tests (**450 tests**) — **14/14 critères §56 satisfaits, Web Core V1 pleinement stable** (`VALIDE_V1`). La **Revue globale Web
Core — incrément V1** a traité l'incrément complet (Health + Auth 1→5 + UI 1 + Files 1) comme **un système
unique** : verdict **`WEB_CORE_V1_INCREMENT_STABLE_WITH_RESERVATIONS`** (rapport
[`WEB_CORE_V1_INCREMENT_REVIEW.md`](../../cores/web-nextjs/docs/WEB_CORE_V1_INCREMENT_REVIEW.md)) — socle **sûr
et cohérent** (aucune fuite de token/URL signée/donnée privée, CSRF + Origin/Referer, **indisponible ≠
anonyme**, 404 anti-énumération, droits dynamiques **sans nouveau JWT**, clés de cache disjointes), **307 tests
fiables ×2** + **runtime réel 49/49** (PostgreSQL + MinIO, parcours critique rejoué ×2, incluant **URL signée
réellement expirée → 403** et **pannes API/MinIO**), **aucun défaut bloquant** ; réserves **opérationnelles**
(CI + ordre de build monorepo, E2E navigateur) et **mineures** (CSP/HSTS, 429, contrastes, cache Files au
logout). **Corrections documentaires seules** (`.env.example` + `SECURITY.md`, zéro comportement). Statuts **maintenus** `IMPLEMENTATION_PARTIELLE` à l'époque (un verdict d'incrément n'augmente pas le statut du core ; ni Tailwind/Radix/shadcn ni bibliothèque exhaustive). Désormais **`VALIDE_V1`** après Web Core V1 Gap 3 (14/14 critères §56). Enfin la **CI minimale (ADR-013)** a été **mise en place**
(`.github/workflows/ci.yml`) : non-régression du monorepo (ordre `api-contracts → api-client-fetch → ui-kit →
web-nextjs → audit`, `npm ci` Node 24, `generate:check`, build/lint/test, `npm audit` 0 vuln, gardes
Axios/Zustand) — **sans secret/Docker/registry/déploiement** ; ADR-013 passe **`PARTIELLEMENT_IMPLEMENTE`**.
Enfin le **Cloud Core 1 — cadrage d'exécution CI/CD & environnements** a été **réalisé** (`cores/cloud/docs/` +
`cores/cloud/README.md`) : baseline d'exécution (17 sections), environnements logiques, **checklist de
protection de branche** (manuelle), **politique CI à 4 niveaux**, politiques secrets/registry, plans runtime
API & E2E — **sans déploiement, Docker, registry, secret ni infra réelle**. Cloud Core →
**`CADRAGE_OPERATIONNEL`** (Cloud Core 1). Puis le **Cloud Core 2** a livré la **CI runtime API NestJS**
(niveau 2, `api-runtime-ci.yml`), et le **Cloud Core 3** la **CI E2E navigateur** (niveau 3,
`web-e2e-ci.yml` : stack réelle API + PostgreSQL + MinIO + Web + **Playwright/Chromium** ; parcours
**Health/Auth/Files** ; **sans secret/déploiement/registry** ; validé localement, **15 tests Playwright verts** (Health/Auth/Files lecture + liste + **upload + suppression** — +2 Web Core Files 8 ; **+1 nav dashboard** V1 Gap 2)
— Cloud Core → **`IMPLEMENTATION_PARTIELLE`** (trois workflows CI niveaux 1–3). Enfin le **Cloud Core 4 —
durcissement CI & gouvernance de branche** (documentaire) a **figé les 7 checks** à rendre bloquants sur `main`
(`api-contracts`/`api-client-fetch`/`ui-kit`/`web-nextjs`/`audit` + `api-runtime` + `web-e2e`) et **tranché les
politiques** : artefacts = aucun upload (Option A), couverture = exécutée non publiée, pinning = `@v4` (SHA
futur), `actionlint` futur — **workflows inchangés, aucun job renommé**. ADR-013 reste **partiel** (niveaux 1–3
+ **protection de branche documentée non appliquée**), ADR-014 **non implémenté**. **Prochaine action (humaine)** :
**appliquer** la protection de branche `main` (`GITHUB_BRANCH_PROTECTION_CHECKLIST.md`) ; **prochaine mission** :
**Cloud Core 5 — Registry GHCR sans déploiement** (niveau 4). Détail : [`NEXT_ACTIONS.md`](./NEXT_ACTIONS.md).

## 16. Règles de mise à jour

Ce fichier est mis à jour **en fin de chaque mission** (voir [`README.md`](./README.md) §protocoles).
Toute affirmation doit être **vérifiable dans le repository**. Ne jamais marquer « validé » sans preuve
(tests/fichiers). Ne jamais confondre spécification, ADR, preuve, package et intégration.
