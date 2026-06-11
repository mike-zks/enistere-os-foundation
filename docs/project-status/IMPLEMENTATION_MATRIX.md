# IMPLEMENTATION_MATRIX.md — Matrice d'implémentation officielle

> Vérifiée depuis le repository (2026-06-11). Légende des statuts officiels : `ABSENT`,
> `DOSSIER_SEULEMENT`, `SPECIFICATION_DOCUMENTAIRE`, `ADR_EN_COURS`, `PREUVE_TECHNIQUE`,
> `STARTER_INITIALISE`, `CADRAGE_OPERATIONNEL` (cadrage gouverné — docs de politique/exécution, **sans** infra
> réelle ni starter), `IMPLEMENTATION_PARTIELLE`, `IMPLEMENTATION_AVANCEE`, `VALIDE_V1`, `SUSPENDU`,
> `A_REVOIR`. Colonnes : ✓ = présent/fait, — = absent/non fait.

## 1. Cores et packages

| Élément | Dossier | Spéc. | ADR | Starter | Code | Tests | Revue | Statut officiel | Dernière preuve | Prochaine condition |
|---|---|---|---|---|---|---|---|---|---|---|
| API Core NestJS | ✓ | ✓ | ✓ (002,003,004,006,007,016,039,040…) | ✓ | ✓ | ✓ (377 u + 101 e2e) | ✓ (3 rapports) | **IMPLEMENTATION_AVANCEE** | tests verts + live 16/16 (local) | commit Git ; CI/CD (ADR-013) |
| `@enistere/api-contracts` | ✓ | n/a | ✓ (016) | ✓ | ✓ | ✓ (11) | ✓ (proof) | **IMPLEMENTATION_AVANCEE** (local) | build + generate:check | publication (non requise V1) |
| `@enistere/api-client-fetch` | ✓ | n/a | ✓ (011,012,016) | ✓ | ✓ | ✓ (29 + live 16/16) | ✓ (proof) | **IMPLEMENTATION_AVANCEE** (local) | live 16/16 ; **instancié (public + authentifié/BFF Auth + façade Files lecture) dans le Web Core** | publication (non requise V1) |
| Cloud Core | ✓ | ✓ | ✓ (013,014,007…) | — | **cadrage (CC1) + CI runtime API (CC2) + CI E2E navigateur (CC3)** : `api-runtime-ci.yml` (PG+MinIO, migrations, unit+e2e, openapi:check) **+ `web-e2e-ci.yml`** (stack réelle + Playwright/Chromium : Health/Auth/Files) | **e2e API + E2E navigateur en CI** (niveaux 2–3) | — | **IMPLEMENTATION_PARTIELLE** | **quatre workflows CI** niveaux 1–4 partiel (`ci`/`api-runtime`/`web-e2e`/**`registry`** — Registry CI verte sur `main`, **images GHCR publiques**) **+ gouvernance CC4 + staging CC6 + dry-run CC7 + image API corrigée CC8** (`DRY_RUN_API_IMAGE_FIXED` : moteur Prisma 3.0.x, stack staging `healthy`, **`api-smoke` CI gate** le push) ; **aucune exécution de déploiement réel** | **Cloud Core 9 — exécution staging réelle sur serveur** (image GHCR API reconstruite post-CC8, secrets hors dépôt, `S3_ENDPOINT` public) |
| Web Core Next.js | ✓ | ✓ | ✓ (004,005,006,007,009,011,012,016…) | **✓** | **✓ (App Router + UI Kit + API publique Health + TanStack Query + BFF Auth + me/authorization + session state + layout protégé serveur read-only Option C + hydratation + page /protected + page de connexion /login + états UI Web UI 1 + Files 1 lecture/téléchargement : BFF ciblé GET /api/files/:id + POST /api/files/:id/download-url, validation UUID, CSRF/Origin, client BFF navigateur, fileKeys, useFileMetadata + useCreateDownloadUrl URL signée hors cache, page /protected/files/[id], 404 anti-énumération)** | **✓ (307 ×2, a11y + sonde HTTP + preuve API réelle Auth/session + protégé 26/26 + login 22/22 + Files API+MinIO 21/21 + revue V1 runtime 49/49)** | **✓ (gouvernance + revue Auth V1 `WEB_AUTH_V1_REVIEW.md` + revue incrément V1 `WEB_CORE_V1_INCREMENT_REVIEW.md` → `WEB_CORE_V1_INCREMENT_STABLE_WITH_RESERVATIONS`)** | **IMPLEMENTATION_PARTIELLE** | build/lint/typecheck/**307 tests ×2** verts + couverture ≈ 87,8 % + preuves API réelles (Auth/session ; protégé ; login ; runtime V1 33/33 ; **Files API+MinIO 21/21** ; **revue incrément V1 49/49** incl. URL expirée + pannes) | **CI minimale (ADR-013)** — non-régression monorepo + ordre de build paquets + generate:check (réserve transverse n°1 ; puis UI Kit 4 / Files 2 / Mobile) |
| Mobile Core React Native | ✓ | ✓ | ✓ (010,012,015…) | — | — | — | — | **SPECIFICATION_DOCUMENTAIRE** | — | UI Kit + secure storage |
| UI Kit (`@enistere/ui-kit`) | ✓ | ✓ | ✓ (008,009,010) | **✓** | **✓ (tokens + 9 primitives Web : Button/Input/Label/Text/Spinner/VisuallyHidden + Alert/Card/FormField)** | **✓ (78, 100 %, a11y/jest-axe, React 19)** | — | **IMPLEMENTATION_PARTIELLE** | aligné **React 19** (0 régression, v0.1.1) + **réellement consommé par le Web Core** (Web UI 1) ; pack:check OK | primitives interactives suppl. (UI Kit 4) ; **Tailwind/Radix/shadcn toujours absents** (ADR-009 partiel) |
| AI Core | ✓ (vide) | — | — | — | — | — | — | **DOSSIER_SEULEMENT** | — | spécification |
| API Core Spring Boot | ✓ (vide) | — | — | — | — | — | — | **DOSSIER_SEULEMENT** | — | spécification |
| Docs Core | ✓ (vide) | — | — | — | — | — | — | **DOSSIER_SEULEMENT** | — | spécification |
| Mobile Core Flutter | ✓ (vide) | — | ADR-034 (à rédiger) | — | — | — | — | **DOSSIER_SEULEMENT** | — | spécification + ADR-034 |
| Quality Core | ✓ (vide) | — | — | — | — | — | — | **DOSSIER_SEULEMENT** | — | spécification |
| Web Core Angular | ✓ (vide) | — | ADR-035 (à rédiger) | — | — | — | — | **DOSSIER_SEULEMENT** | — | spécification + ADR-035 |

## 2. Infrastructure transverse

| Élément | Spéc/ADR | Implémenté | Tests | Statut | Prochaine condition |
|---|---|---|---|---|---|
| CI/CD | ADR-013 Validé | **CI niveaux 1–3** : `ci.yml` (non-régression monorepo) + `api-runtime-ci.yml` (runtime API : PG+MinIO, migrations, unit+e2e, openapi:check) **+ `web-e2e-ci.yml`** (E2E navigateur : stack réelle + Playwright, Health/Auth/Files) | — (baseline locale + **simulations** : runtime API + **E2E 7 tests verts**) | **PARTIELLEMENT_IMPLEMENTE** | protection de branche **documentée** (7 checks, CC4) **non appliquée** ; couverture publiée, release, déploiement, environnements (niveau 4) |
| Registry images | ADR-014 Validé | **`registry-ci.yml`** + Dockerfiles API/Web (build + **smoke-run image API `api-smoke`** CC8, gate du push) + push GHCR sur `main`, tags immuables, non-root, sans secret/PAT | ✓ build + **smoke runtime image** (moteur Prisma chargé) | **PARTIELLEMENT_IMPLEMENTE** | déploiement, scan/signature d'image, semver/release ; rendre `api-smoke` requis |
| Conteneurisation (Docker) | ADR-014 | **Dockerfiles API/Web** (multi-stage, non-root ; Web standalone) + `.dockerignore` ; **compose staging exemple** (CC6) ; **fix moteur Prisma 3.0.x** (CC8 : `binaryTargets` + `openssl` au build) | ✓ build/config ; ✅ **CC8 re-validé : image API `healthy`** (moteur 3.0.x), image Web `healthy` | **PARTIELLEMENT_IMPLEMENTE** | compose de prod, Traefik ; rebuild GHCR image API (CI au merge) |
| Déploiement staging | ADR-013 | runbooks + compose/`.env` exemples (CC6) + **dry-run** (CC7) + **image API corrigée & re-validée** (CC8 : migrations depuis l'image offline, API/Web `healthy`, `/health/live`+`/health/ready`+`/`=200) | ✅ **dry-run réel vert** (moteur 3.0.x) ; **migrations Option A** (depuis l'image) | **DRY_RUN_API_IMAGE_FIXED** | **CC9 — exécution réelle** (serveur + secrets hors dépôt + `S3_ENDPOINT` public Option A + image GHCR reconstruite) |
| Observabilité (métriques/traces) | ADR-018/036 à rédiger | — | — | **NON_COMMENCE** | Cloud Core |
| Git (commits/branches) | ADR-001 Validé | **baseline `7dcb543` (main)** | — | **PARTIELLEMENT_IMPLEMENTE** | push `origin` (décision humaine) |

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
| C1 | Travail substantiel présent | `git log` | **Résolu (local)** : baseline `7dcb543` ; non poussée | Traçabilité locale OK ; pas encore de sauvegarde distante | Pousser vers `origin` (décision humaine) | RÉSOLU (local) / IMPORTANTE (push) |
| C2 | Packages dits « officiels » | Import dans les cores | **Intégré (public + authentifié + Files lecture)** : UI Kit **consommé** + `api-contracts`/`api-client-fetch` **instanciés** par le Web Core pour Health, le BFF Auth (login/refresh/logout/me/authorization) **et la façade Files** (métadonnées + URL signée, types `PublicStoredFileDto`/`SignedDownloadResponseDto` via `SchemaOf<>`), preuve API + MinIO réelle. Reste : publication (non requise V1) | Lecture « intégré » vraie pour public, authentifié **et Files** | — (publication différée) | RÉSOLU |
| C3 | ADR-005/012/013/014/015 Validés | Aucun code correspondant | Décidés, non implémentés (ADR-008 **partiel** : tokens + primitives UI Kit ; ADR-009/010 **partiels** : tokens consommés, stacks Tailwind/RN non ajoutées) | Lecture « fait » erronée | Implémenter au fil des cores | IMPORTANTE |
| C4 | `strategy/` Phase 0 (« avant code ») | API Core implémenté | Phase 0 partiellement dépassée | Contexte trompeur | Lire strategy comme historique | MINEURE |
| C5 | `OPENAPI_CLIENT_PROOF.md` cite `proofs/openapi-client/*` | Code de preuve retiré | Pointeur seul | Liens internes partiellement périmés | Bannière de migration déjà ajoutée | MINEURE |
| C6 | `cores/{cloud,mobile-react-native}` ont une spéc | Aucun starter | Documentaires ; **ui-kit et web-nextjs désormais `STARTER_INITIALISE`** | Confusion spéc↔implémentation | Statut explicite (cette matrice) | IMPORTANTE |
| C7 | Docs Web « starter sans auth » (`README`/`SECURITY.md`/`ARCHITECTURE.md` ; commentaires `cookie-config`/`query-client`) | BFF Auth + session implémentés | **Résolu** (revue de gouvernance 2026-06-10) : corrections factuelles appliquées + export mort `CSRF_HEADER_NAME` supprimé | Lecture « sans auth » erronée | — | RÉSOLU |
| C8 | `next build` (phase TS) du Web Core | `packages/*/dist` **non versionnés** (gitignore `dist/`) | **Atténué** : la **CI minimale** (`.github/workflows/ci.yml`) impose l'ordre topologique (`api-contracts → api-client-fetch → ui-kit → web-nextjs`) ; chaque job aval rebuild ses dépendances (validé par simulation runner neuf, dist effacés) | Risque résiduel = clone **local** sans CI | **Atténué (CI)** ; documenter l'ordre `npm run build` racine pour le dev local | RÉSOLU (CI) / MINEURE (local) |

## 5. Dette documentaire

| Élément | Classe |
|---|---|
| Ordre de build monorepo (`packages/*/dist` non versionnés) — **désormais imposé par la CI minimale** (`.github/workflows/ci.yml`) ; reste à documenter pour le dev local | MINEURE (CI en place) |
| **CI minimale présente** (ADR-013 partiel) ; restent : protection de branche, couverture publiée, **E2E navigateur**, CI runtime API, release/déploiement | IMPORTANTE |
| Baseline Git locale créée (`7dcb543`) **non poussée** vers `origin` | IMPORTANTE |
| Packages non intégrés (à clarifier dans les futurs cores) | IMPORTANTE |
| `strategy/` Phase 0 vs état réel (non versionné par ADR) | IMPORTANTE |
| `OPENAPI_CLIENT_PROOF.md` réfère un code retiré | MINEURE |
| `tools/` et `examples/` vides | MINEURE |
| ADR-017→038 cités au backlog mais non rédigés | HISTORIQUE (attendu) |
