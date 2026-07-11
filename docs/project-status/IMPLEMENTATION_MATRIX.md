# IMPLEMENTATION_MATRIX.md — Matrice d'implémentation officielle

> Vérifiée depuis le repository (2026-07-10). Légende des statuts officiels : `ABSENT`,
> `DOSSIER_SEULEMENT`, `SPECIFICATION_DOCUMENTAIRE`, `ADR_EN_COURS`, `PREUVE_TECHNIQUE`,
> `STARTER_INITIALISE`, `CADRAGE_OPERATIONNEL` (cadrage gouverné — docs de politique/exécution, **sans** infra
> réelle ni starter), `IMPLEMENTATION_PARTIELLE`, `IMPLEMENTATION_AVANCEE`, `VALIDE_V1`, `SUSPENDU`,
> `A_REVOIR`. Colonnes : ✓ = présent/fait, — = absent/non fait.

## 1. Cores et packages

> **Mise à jour RN34/UI Kit 4/UI Kit 5** : Mobile Core React Native est désormais
> **`STARTER_EXPO_DOCTOR_GREEN`** (RN34 + smoke Android RN34B passé ; RN31 iOS reste bloqué par
> l'absence d'hôte macOS/Xcode). Le UI Kit expose désormais **15 primitives Web React** (UI Kit 4 :
> Dialog/Select/Toast + UI Kit 5 : Badge/Divider/Skeleton) avec **146 tests** ; `Dialog` est explicitement marqué `'use client'`
> pour rester compatible avec Next Server Components.

| Élément | Dossier | Spéc. | ADR | Starter | Code | Tests | Revue | Statut officiel | Dernière preuve | Prochaine condition |
|---|---|---|---|---|---|---|---|---|---|---|
| API Core NestJS | ✓ | ✓ | ✓ (002,003,004,006,007,016,039,040…) | ✓ | ✓ | ✓ (**386 u** + 101 e2e + **7 e2e Files 5**) | ✓ (3 rapports) | **IMPLEMENTATION_AVANCEE** | tests verts + live 16/16 (local) | commit Git ; CI/CD (ADR-013) |
| `@enistere/api-contracts` | ✓ | n/a | ✓ (016) | ✓ | ✓ | ✓ (12) | ✓ (proof) | **IMPLEMENTATION_AVANCEE** (local) | build + generate:check | publication (non requise V1) |
| `@enistere/api-client-fetch` | ✓ | n/a | ✓ (011,012,016) | ✓ | ✓ | ✓ (30 + live 16/16) | ✓ (proof) | **IMPLEMENTATION_AVANCEE** (local) | live 16/16 ; **instancié (public + authentifié/BFF Auth + façade Files lecture) dans le Web Core** | publication (non requise V1) |
| Cloud Core | ✓ | ✓ | ✓ (013,014,007…) | — | **cadrage (CC1) + CI runtime API (CC2) + CI E2E navigateur (CC3) + staging HTTPS réel (CC10)** : `api-runtime-ci.yml` (PG+MinIO, migrations, unit+e2e, openapi:check) **+ `web-e2e-ci.yml`** (stack réelle + Playwright/Chromium : Health/Auth/Files) **+ `docker-compose.cc10.yml`** (Traefik v3.0 + Let's Encrypt, `sha-5bf4c0f`, `37.27.31.5`) | **e2e API + E2E navigateur en CI** (niveaux 2–3) | — | **IMPLEMENTATION_PARTIELLE** | **quatre workflows CI** niveaux 1–4 partiel (`ci`/`api-runtime`/`web-e2e`/**`registry`** — Registry CI verte sur `main`, **images GHCR publiques**) **+ gouvernance CC4 + staging CC6 + dry-run CC7 + image API corrigée CC8 + exécution staging LOCALE CC9** (`EXECUTION_LOCALE_CONTROLEE` : images corrigées `sha-d1e6242`) **+ CC10 STAGING RÉEL HTTPS** : `docker-compose.cc10.yml`, Traefik v3.0, Let's Encrypt HTTP-01, `sha-5bf4c0f`, 4 conteneurs `healthy` sur `37.27.31.5` ; `staging.enistere.com` + `s3-staging.enistere.com` HTTPS accessibles ; auth BFF + upload + URL signée + téléchargement **bout-en-bout validés** | RN31 iOS smoke si macOS/Xcode disponible |
| Web Core Next.js | ✓ | ✓ | ✓ (004,005,006,007,009,011,012,016…) | **✓** | **✓ (App Router + UI Kit + API publique Health + TanStack Query + BFF Auth + me/authorization + session state + layout protégé serveur read-only Option C + hydratation + page /protected + page de connexion /login + états UI Web UI 1 + Files 1 lecture/téléchargement + Files 2 upload multipart BFF + Files 3 suppression BFF : assertDelete, DELETE /api/files/:id, UUID 400 avant appel API, CSRF/Origin 403 avant appel API, client `writable`, 409→NOT_DELETABLE, anti-énumération 404, deleteFile BFF client, useDeleteFile mutation+anti-double+removeQueries, Dialog confirmation UI Kit 4, onDeleteSuccess prop, FileDetailsWithNav + Files 4 liste BFF : GET /api/files, validation limit/offset 400 avant appel API, client read-only, FileListResponse, listFiles BFF client, fileKeys.list stable, useFileList retry:false, FileListView états loading/vide/erreur/liste pagination + Files 6 revue V1 : D1 cache delete→list, D2 cache upload→list, D3 message 409 neutre, D4 upload 409→QUOTA_EXCEEDED ; rapport WEB_FILES_V1_REVIEW.md ; verdict stable avec réserves mineures + Files 7 admin BFF : handlers quarantaine/restauration, routes /api/files/[id]/quarantine+/restore, client BFF quarantineFile/restoreFile, hooks useQuarantineFile/useRestoreFile mutation+anti-double+fileKeys.all, AdminFileActions UI admin séparée, page /protected/files/[id]/admin — CSRF+Origin, API autorité, jamais Bearer navigateur + V1 Gap 1 : layout public `(public)/`, landing page statique `/`, robots.ts, sitemap.ts + V1 Gap 2 : DashboardShell Server Component, (protected)/layout.tsx + V1 Gap 3 : upload-form-schema.ts (Zod v4), upload-form.tsx (RHF useForm+zodResolver), react-hook-form@^7.81.0/zod@^4.4.3/@hookform/resolvers@^5.4.0 ; 14/14 critères §56 — VALIDE_V1)** | **✓ (450 tests, a11y + sonde HTTP + preuve API réelle Auth/session + protégé 26/26 + login 22/22 + Files API+MinIO 21/21 + revue V1 runtime 49/49 + 15 tests E2E)** | **✓ (gouvernance + revue Auth V1 `WEB_AUTH_V1_REVIEW.md` + revue incrément V1 `WEB_CORE_V1_INCREMENT_REVIEW.md` → `WEB_CORE_V1_INCREMENT_STABLE_WITH_RESERVATIONS` + revue Files V1 `WEB_FILES_V1_REVIEW.md` → stable avec réserves mineures + `WEB_CORE_V1_READINESS_REVIEW.md` → VALIDE_V1 14/14)** | **VALIDE_V1** | build/lint/typecheck/**450 tests** verts + preuves API réelles (Auth/session ; protégé ; login ; runtime V1 33/33 ; **Files API+MinIO 21/21** ; **revue incrément V1 49/49** incl. URL expirée + pannes) | — (V1 déclaré) |
| Mobile Core React Native | ✓ | ✓ | ✓ (003,004,008,010,011,012,015,016…) | **✓ (Expo SDK 55 + Expo Router)** | **✓ (RN 1→34)** : primitives RN 1→25 inchangées ; Settings protégé RN26 ; shell public/protégé/settings durci RN27 ; smoke Android visuel RN28 ; smoke Android local reproductible RN29 ; préflight iOS RN30 bloqué Linux ; RN31 en attente macOS/Xcode ; RN32 formulaire sign-in ; RN33 préférence thème ; RN34 alignement patch Expo SDK. Aucun réseau métier, endpoint métier, SDK/adaptateur natif réel, retry branché, persistance nouvelle ni changement AuthEngine/`withAuthRetry`/`authedRequest`/QueryClient/mutations. | **✓ (54 fichiers `node --test` + `expo export -p ios` + smoke Android Emulator + smoke iOS blocked documenté)** | — | **STARTER_EXPO_DOCTOR_GREEN** | typecheck + lint + **test 54 fichiers / 355 cas** + **expo-doctor 19/19** + **expo export -p ios** + **smoke Android Emulator `emulator-5554` passed** + **`npm run smoke:ios` blocked** (`detectedPlatform: linux`, `expectedPlatform: darwin`) verts/documentés (local) | **Mobile Core RN 31 — exécution iOS smoke sur macOS/device réel** |
| UI Kit (`@enistere/ui-kit`) | ✓ | ✓ | ✓ (008,009,010) | **✓** | **✓ (tokens + 15 primitives Web : Button/Input/Label/Text/Spinner/VisuallyHidden + Alert/Card/FormField + Dialog/Select/Toast + Badge/Divider/Skeleton)** | **✓ (146, a11y/jest-axe, React 19)** | — | **IMPLEMENTATION_PARTIELLE** | aligné **React 19** (0 régression, v0.1.1) + **réellement consommé par le Web Core** ; Dialog marqué `'use client'` pour compatibilité Next Server Components ; pack:check OK | suite à décider (nouveaux composants ou intégration Web Core) ; **Tailwind/Radix/shadcn toujours absents** (ADR-009 partiel) |
| AI Core | ✓ (vide) | — | — | — | — | — | — | **DOSSIER_SEULEMENT** | — | spécification |
| API Core Spring Boot | ✓ (vide) | — | — | — | — | — | — | **DOSSIER_SEULEMENT** | — | spécification |
| Docs Core | ✓ (vide) | — | — | — | — | — | — | **DOSSIER_SEULEMENT** | — | spécification |
| Mobile Core Flutter | ✓ (vide) | — | ADR-034 (à rédiger) | — | — | — | — | **DOSSIER_SEULEMENT** | — | spécification + ADR-034 |
| Quality Core | ✓ (vide) | — | — | — | — | — | — | **DOSSIER_SEULEMENT** | — | spécification |
| Web Core Angular | ✓ (vide) | — | ADR-035 (à rédiger) | — | — | — | — | **DOSSIER_SEULEMENT** | — | spécification + ADR-035 |

## 2. Infrastructure transverse

| Élément | Spéc/ADR | Implémenté | Tests | Statut | Prochaine condition |
|---|---|---|---|---|---|
| CI/CD | ADR-013 Validé | **CI niveaux 1–3 + niveau 4 partiel** : `ci.yml` (non-régression monorepo) + `api-runtime-ci.yml` (runtime API : PG+MinIO, migrations, unit+e2e, openapi:check) + `web-e2e-ci.yml` (E2E navigateur : stack réelle + Playwright, Health/Auth/Files) + **`registry-ci.yml`** (niveau 4 partiel : build + push GHCR, `api-smoke`, sans déploiement) | — (baseline locale + **simulations** : runtime API + **E2E 15 tests verts** (Health→`/status`/Auth + **nav dashboard** +1/Files lecture + liste + upload + suppression)) | **PARTIELLEMENT_IMPLEMENTE** | protection de branche **documentée** (7 checks + `images`, CC4) **non appliquée** (action humaine) ; `api-smoke` à rendre requis ; couverture publiée, release, déploiement, environnements |
| Registry images | ADR-014 Validé | **`registry-ci.yml`** + Dockerfiles API/Web (build + **smoke-run image API `api-smoke`** CC8, gate du push) + push GHCR sur `main`, tags immuables, non-root, sans secret/PAT | ✓ build + **smoke runtime image** (moteur Prisma chargé) | **PARTIELLEMENT_IMPLEMENTE** | déploiement, scan/signature d'image, semver/release ; rendre `api-smoke` requis |
| Conteneurisation (Docker) | ADR-014 | **Dockerfiles API/Web** (multi-stage, non-root ; Web standalone) + `.dockerignore` ; **compose staging exemple** (CC6) ; **fix moteur Prisma 3.0.x** (CC8 : `binaryTargets` + `openssl` au build) | ✓ build/config ; ✅ **CC8 re-validé : image API `healthy`** (moteur 3.0.x), image Web `healthy` | **PARTIELLEMENT_IMPLEMENTE** | compose de prod, Traefik ; rebuild GHCR image API (CI au merge) |
| Déploiement staging | ADR-013 | runbooks + compose/`.env` exemples (CC6) + dry-run (CC7) + image API corrigée (CC8) + **exécution LOCALE** (CC9 : stack `healthy`) + **CC10 STAGING RÉEL HTTPS VALIDÉ** (`docker-compose.cc10.yml` : Traefik v3.0, Let's Encrypt HTTP-01, `sha-5bf4c0f`, 4 conteneurs `healthy` sur `37.27.31.5` ; HTTPS valide ; auth BFF + upload + URL signée + téléchargement 200) | ✅ **bout-en-bout validé sur serveur réel** : HTTPS TLS, auth BFF, upload MinIO VALIDATED, URL pré-signée `s3-staging.enistere.com`, téléchargement 200 | **STAGING_REEL_HTTPS_VALIDE** | environnements protégés, monitoring, rollback automatisé, scan/signature image |
| Observabilité (métriques/traces) | ADR-018/036 à rédiger | — | — | **NON_COMMENCE** | Cloud Core |
| Git (commits/branches) | ADR-001 Validé | **historique Git actif** ; `main` aligné sur `origin/main` (dernier merge RN 3 `574cdcf`) | — | **PARTIELLEMENT_IMPLEMENTE** | maintenir le flux PR et les checks requis |

## 3. Matrice détaillée — API Core NestJS

| Domaine | Documenté | Implémenté | Testé | Revu | Version cible | Reste à faire |
|---|---|---|---|---|---|---|
| Socle NestJS / bootstrap | ✓ | ✓ | ✓ | ✓ | V1 | — |
| Configuration + validation env | ✓ | ✓ | ✓ | ✓ | V1 | — |
| Database Prisma/PostgreSQL | ✓ | ✓ | ✓ | ✓ | V1 | — |
| Health (live/ready) | ✓ | ✓ | ✓ | ✓ | V1 | — |
| Auth (login, JWT, sessions, refresh) | ✓ | ✓ | ✓ | ✓ | V1 | — |
| Users | ✓ | ✓ | ✓ | ✓ | V1 | register public (dérivé) |
| Roles + Permissions (RBAC) | ✓ | ✓ | ✓ | ✓ | V1 | admin RBAC (V2) |
| Audit | ✓ | ✓ | ✓ | ✓ | V1 | — |
| Files + Storage S3/MinIO | ✓ | ✓ | ✓ | ✓ | V1 | antivirus/média/présigné (V2) |
| Logging structuré (Pino) | ✓ | ✓ | ✓ | ✓ | V1 | collecte Loki (Cloud) |
| OpenAPI canonique + check | ✓ | ✓ | ✓ | ✓ | V1 | — |
| Client contracts (package) | ✓ | ✓ | ✓ | ✓ | V1 | publication |
| Client fetch (package) | ✓ | ✓ | ✓ | ✓ | V1 | intégration cores |
| CI/CD | ✓ (ADR-013) | **CI runtime API** (`api-runtime-ci.yml` : PG+MinIO, migrations, unit+e2e, openapi:check) | ✓ (niveau 2) | — | V1 | déploiement (niveau 4) |
| Redis (cache distribué) | ✓ | — | — | — | V2 | multi-instance |
| Queues/jobs (BullMQ) | ✓ | — | — | — | V2 | Redis |
| Mail / Notifications | ✓ | — | — | — | V2/V3 | infra |
| Observabilité (métriques/traces) | ✓ | — | — | — | V2 | Cloud Core |

Légende domaines : voir aussi la matrice native `cores/api-nestjs/docs/API_CORE_V1_IMPLEMENTATION_STATUS.md`
(référence détaillée maintenue dans le core). Ce tableau en est la synthèse de pilotage.

## 4. Contradictions détectées (documentées, NON corrigées)

| ID | Source A | Source B | État réel | Impact | Action recommandée | Priorité |
|---|---|---|---|---|---|---|
| C1 | Travail substantiel présent | `git log` / remote | **Résolu** : historique Git actif ; `main` et `origin/main` alignés (`574cdcf`, merge RN 3) | Traçabilité locale et distante OK | Maintenir le flux PR ; aucun push direct `main` | RÉSOLU |
| C2 | Packages dits « officiels » | Import dans les cores | **Intégré (public + authentifié + Files lecture)** : UI Kit **consommé** + `api-contracts`/`api-client-fetch` **instanciés** par le Web Core pour Health, le BFF Auth (login/refresh/logout/me/authorization) **et la façade Files** (métadonnées + URL signée, types `PublicStoredFileDto`/`SignedDownloadResponseDto` via `SchemaOf<>`), preuve API + MinIO réelle. Reste : publication (non requise V1) | Lecture « intégré » vraie pour public, authentifié **et Files** | — (publication différée) | RÉSOLU |
| C3 | ADR-005/012/013/014/015 Validés | Code correspondant partiel | ADR-008 **partiel** (tokens + primitives UI Kit) ; ADR-009 **partiel** (web : Tailwind/Radix absents) ; **ADR-010 appliqué côté mobile** (ThemeProvider + composants maison, pas de NativeWind) ; **ADR-011/012 appliqués** (web + mobile : fetch + TanStack Query) ; **ADR-015 implémenté** (mobile secure storage : access token mémoire, refresh token SecureStore) ; **ADR-003 mobile** (RN 3 : Zod UX via RHF, backend autoritatif) ; ADR-005/013/014 décidés, partiels | Lecture « fait » erronée | Implémenter au fil des cores | IMPORTANTE |
| C4 | `strategy/` Phase 0 (« avant code ») | API Core implémenté | Phase 0 partiellement dépassée | Contexte trompeur | Lire strategy comme historique | MINEURE |
| C5 | `OPENAPI_CLIENT_PROOF.md` cite `proofs/openapi-client/*` | Code de preuve retiré | Pointeur seul | Liens internes partiellement périmés | Bannière de migration déjà ajoutée | MINEURE |
| C6 | `cores/{cloud,mobile-react-native}` ont une spéc | Starter | `cloud` = PARTIEL/PAUSE ; **`mobile-react-native` `STARTER_EXPO_DOCTOR_GREEN`** (Expo SDK 55, primitives RN 1→25, Settings RN26, runtime RN27, smoke Android RN28/RN29/RN34B, iOS RN30 bloqué par Linux sans `xcrun`, RN32 formulaire, RN33 thème, RN34 doctor 19/19) ; ui-kit/web-nextjs restent partiels | Confusion spéc↔implémentation | Statut explicite (cette matrice) ; mobile = socle vérifié ≠ V1 complète | IMPORTANTE |
| C7 | Docs Web « starter sans auth » (`README`/`SECURITY.md`/`ARCHITECTURE.md` ; commentaires `cookie-config`/`query-client`) | BFF Auth + session implémentés | **Résolu** (revue de gouvernance 2026-06-10) : corrections factuelles appliquées + export mort `CSRF_HEADER_NAME` supprimé | Lecture « sans auth » erronée | — | RÉSOLU |
| C8 | `next build` (phase TS) du Web Core | `packages/*/dist` **non versionnés** (gitignore `dist/`) | **Atténué** : la **CI minimale** (`.github/workflows/ci.yml`) impose l'ordre topologique (`api-contracts → api-client-fetch → ui-kit → web-nextjs`) ; chaque job aval rebuild ses dépendances (validé par simulation runner neuf, dist effacés) | Risque résiduel = clone **local** sans CI | **Atténué (CI)** ; documenter l'ordre `npm run build` racine pour le dev local | RÉSOLU (CI) / MINEURE (local) |

## 5. Dette documentaire

| Élément | Classe |
|---|---|
| Ordre de build monorepo (`packages/*/dist` non versionnés) — **désormais imposé par la CI minimale** (`.github/workflows/ci.yml`) ; reste à documenter pour le dev local | MINEURE (CI en place) |
| **CI minimale présente** (ADR-013 partiel) ; restent : protection de branche, couverture publiée, **E2E navigateur**, CI runtime API, release/déploiement | IMPORTANTE |
| Historique Git actif et `main` aligné sur `origin/main` ; rester vigilant sur le flux PR et les checks requis | SUIVI |
| Packages non intégrés (à clarifier dans les futurs cores) | IMPORTANTE |
| `strategy/` Phase 0 vs état réel (non versionné par ADR) | IMPORTANTE |
| `OPENAPI_CLIENT_PROOF.md` réfère un code retiré | MINEURE |
| `tools/` et `examples/` vides | MINEURE |
| ADR-017→038 cités au backlog mais non rédigés | HISTORIQUE (attendu) |
