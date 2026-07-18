# CI — workflows GitHub Actions

Workflows CI, **lecture seule** (`permissions: contents: read`), **sans secret GitHub, sans déploiement** :

| Workflow | Rôle | Niveau (Cloud Core) |
|---|---|---|
| [`ci.yml`](ci.yml) | Non-régression du monorepo (contrats, client, UI Kit, Web, audit) — **sans** base/stockage | Niveau 1 |
| [`api-runtime-ci.yml`](api-runtime-ci.yml) | Runtime de l'**API NestJS** : PostgreSQL + MinIO **jetables**, migrations Prisma, unit + e2e, OpenAPI check, build, audit | Niveau 2 |
| [`web-e2e-ci.yml`](web-e2e-ci.yml) | **E2E navigateur** : stack réelle (PostgreSQL + MinIO + API + Web) + Playwright/Chromium ; parcours Health, Auth, Files | Niveau 3 |
| [`registry-ci.yml`](registry-ci.yml) | **Registry GHCR** : build images API/Web ; **push sur `main` seulement** (tags immuables, pas de `latest`) — **sans déploiement** | Niveau 4 (partiel) |
| [`api-spring-ci.yml`](api-spring-ci.yml) | **API Spring Boot** : Maven Wrapper + Java 21 + Testcontainers PostgreSQL | Niveau 5 |
| [`web-angular-ci.yml`](web-angular-ci.yml) | **Web Angular** : Karma/ChromeHeadless + build production + audit npm local | Niveau 6 |

## `ci.yml` — CI minimale V1 (ADR-013)

Non-régression du monorepo. **Lecture seule**, sans secret, sans Docker, sans base de données ni stockage
objet, sans déploiement, sans registry (GHCR) ni publication npm.

### Déclencheurs

- `pull_request` (toutes branches cibles) ;
- `push` sur `main`.

`concurrency: ci-${{ github.ref }}` + `cancel-in-progress` (annule les exécutions obsolètes).
`permissions: contents: read` (aucune écriture, aucun token registry).

### Runtime

- **Node.js 24** (cohérent avec les preuves locales) ;
- **`npm ci`** (lockfile, installation reproductible) — jamais `npm install` ;
- cache npm via `actions/setup-node` (`cache: npm`).

### Ordre des jobs (imposé par `needs`)

```
api-contracts → api-client-fetch → ui-kit → web-nextjs → audit
```

Chaque job s'exécute sur un runner neuf : les `dist/` des paquets **ne sont pas versionnés**, donc chaque
job aval **rebuild ses dépendances** avant de se valider (`needs` garantit l'ordre **et** un échec lisible).

| Job | Vérifie | Dépend de |
|---|---|---|
| `api-contracts` | `generate:check` (snapshot OpenAPI ↔ types) · `typecheck` · `build` · `test` | — |
| `api-client-fetch` | build `api-contracts` (dist) → `typecheck` · `build` · `test` | `api-contracts` |
| `ui-kit` | `tokens:check` · `typecheck` · `build` · `lint` · `test` · `pack:check` | `api-client-fetch` |
| `web-nextjs` | build `api-contracts`+`api-client-fetch`+`ui-kit` → `typecheck` · `lint` · `test` · **`build` (sans API)** | `ui-kit` |
| `audit` | `npm audit` (0 vuln) · **Axios/Zustand absents** (ADR-011/012) · versions clés (react/react-query/next) | `web-nextjs` |

### Ce que la CI garantit

- Installation **reproductible** (`npm ci` sur lockfile) ;
- contrat **OpenAPI** à jour (aucun DTO divergent) ;
- paquets API + UI Kit + Web Core **compilent, lintent et testent** ;
- Web Core **build sans API** (routes privées/BFF dynamiques) ;
- **0 vulnérabilité** npm ; **Axios/Zustand jamais réintroduits** (ADR-011 Fetch / ADR-012 TanStack Query).

### Ce qu'elle ne garantit PAS encore

- **E2E navigateur** du Web ;
- **protection de branche** / approvals / environnements protégés ;
- artefacts/rapports de couverture publiés ;
- **build/publication d'images** (GHCR — ADR-014, non implémenté) ; déploiement ; release ; versioning npm.

> Le **runtime de l'API NestJS** (e2e + PostgreSQL/MinIO) est couvert par `api-runtime-ci.yml` (ci-dessous).

## `api-runtime-ci.yml` — CI runtime API (niveau 2, Cloud Core 2)

Valide l'**API Core NestJS** contre ses dépendances runtime **minimales et jetables**. `starters/nestjs/`
est un projet npm **autonome** (lockfile propre, hors workspaces racine) : `working-directory: starters/nestjs`
+ `npm ci`. **Lecture seule, aucun secret GitHub, aucun registre, aucun déploiement.**

### Services

- **PostgreSQL** (`postgres:16`) en conteneur `services:` avec healthcheck `pg_isready`.
- **MinIO** (`minio/minio`) démarré via **`docker run`** (un conteneur `services:` **ne peut pas** recevoir la
  commande `server /data` requise par MinIO), attente de `…/minio/health/live`, puis **bucket de test** créé
  (`enistere-test-files`) — l'API ne crée pas le bucket automatiquement.

### Variables

Uniquement des **valeurs de test jetables** définies dans le workflow (jamais `secrets.*`, jamais committées
en `.env`) : `DATABASE_URL`, `JWT_*`, `REFRESH_TOKEN_HASH_SECRET`, `ARGON2_*`, `S3_*`, rate limits élargis,
`CORS_ORIGINS`, `LOG_LEVEL=warn`. Ces noms suivent `starters/nestjs/.env.example`.

### Étapes (scripts réels de `starters/nestjs/package.json`)

`npm ci` → bucket → `prisma:generate` → `prisma:validate` → **`prisma:migrate:deploy`** (migrations sur base
jetable) → `lint` → `npm test` (unitaires) → **`test:e2e`** (PostgreSQL + MinIO réels) → **`openapi:check`**
(snapshot canonique à jour) → `build` (nest build) → `npm audit`. *(Pas de script `typecheck` côté API ; `nest
build` couvre la compilation.)*

### Garanties

Migrations Prisma valides et applicables · tests unitaires + **e2e** verts contre PostgreSQL/MinIO jetables ·
contrat **OpenAPI** non divergent · build API · `npm audit` 0 vuln · **données éphémères**, **aucun secret**,
**logs sans secret** (`LOG_LEVEL=warn`), **aucun artefact uploadé**.

### Ce qu'il ne garantit PAS

Déploiement · image/registre (GHCR, ADR-014) · environnements protégés/staging/production · rollback ·
monitoring · E2E **navigateur** (niveau 3).

> **Contrainte GitHub Actions documentée** : MinIO via `docker run` (pas `services:`) car un service ne peut
> pas porter la commande `server /data`. PostgreSQL reste un service idiomatique.

## `web-e2e-ci.yml` — CI E2E navigateur (niveau 3, Cloud Core 3)

Démarre une **stack réelle et éphémère** et rejoue les **parcours navigateur** critiques avec **Playwright/
Chromium** (headless). **Lecture seule, aucun secret GitHub, aucun registre, aucun déploiement.**

### Stack & orchestration

PostgreSQL (`postgres:16`, `services:`) + MinIO (`docker run` + bucket) → `npm ci` (racine) + build des paquets
→ `npm run e2e:install` (Chromium) → API NestJS (autonome : `npm ci`, prisma generate/**migrate:deploy**/seed,
build, **démarrage** en arrière-plan, attente `/health/ready`) → **seed utilisateurs éphémères**
(`proof-seed-user.ts` → propriétaire + sans-permission, exportés via `$GITHUB_ENV`) → build + **démarrage du
Web** (`next start`, attente) → **Playwright**. **`APP_ENV=development`** (cookies non-Secure → Auth en HTTP
local). Valeurs **jetables** (jamais `secrets.*`).

### Parcours couverts

- **Health** : accueil charge, panneau Health visible, **aucune fuite** de config/token.
- **Auth** : anonyme `/protected` → `/login` ; identifiants invalides → **erreur générique** (sans énumération),
  reste sur `/login` ; connexion valide → `/protected` ; **déconnexion** → re-navigation → `/login`.
- **Files** : métadonnées publiques (titre = nom d'origine), **aucun champ interne** (storageKey/bucket/
  checksum/ownerId), **téléchargement** (BFF `download-url` **200** + requête au stockage, **URL signée jamais
  journalisée**) ; id inexistant → « Fichier introuvable » ; sans permission → « Accès refusé ».

### Données & artefacts

Données **éphémères** (utilisateur + fichier VALIDATED via `global-setup.ts`, écrits dans `e2e/.state.json`
gitignoré) ; **aucun upload d'artefact** ; traces/captures Playwright **uniquement en échec** (`retain-on-failure`).

### Ce qu'il ne garantit PAS

Déploiement · registre/GHCR (couvert par `registry-ci.yml`) · environnements protégés · rollback · monitoring ·
**upload/suppression Files côté Web** (hors périmètre). Les tests E2E sont **isolés** du niveau 1 (exclus de
`typecheck`/`lint`/`build` via `tsconfig.json`/`eslint.config.mjs` ; compilés par Playwright).

## `registry-ci.yml` — Registry GHCR (niveau 4 partiel, Cloud Core 5 + **smoke-run CC8**)

Construit les **images Docker** API/Web et les **pousse vers GHCR sur `main` uniquement**. **Début d'ADR-014
(registry seulement) — AUCUN déploiement, AUCUN secret applicatif, AUCUN PAT** (auth `GITHUB_TOKEN`).

- **Job `api-smoke` (Cloud Core 8 — ferme l'angle mort « image jamais exécutée »)** : build l'image API, la
  **lance**, et vérifie **sans base** que le **moteur de requête Prisma se charge** au runtime (une erreur de
  connexion = moteur chargé = OK ; « query engine could not be located » = **FAIL**) + non-root + openssl +
  moteur présent. Le job **`images` est `needs: api-smoke`** → **le push GHCR n'a lieu que si le smoke est vert**.
  *(Recommandé : rendre `api-smoke` un check requis sur `main` — action humaine.)*
- **`permissions: contents: read` + `packages: write`** ; login GHCR **conditionnel** (`push` + `main`).
- **PR → build SANS push** (vérifie la constructibilité) ; **push `main` → build + push** (gate `api-smoke`).
- **Images** : `ghcr.io/<owner>/<repo>/api-nestjs` (Dockerfile `starters/nestjs/`, contexte `starters/nestjs/`)
  et `/web-nextjs` (Dockerfile `starters/nextjs/`, contexte **racine**, Next.js **standalone**). Multi-stage,
  **non-root**, **aucun `.env` copié**.
- **Tags immuables** (`docker/metadata-action`, `flavor: latest=false`) : `sha-<short>`, `main-<short>` (sur
  `main`), `pr-<n>` (build PR, non poussé). **`latest` jamais généré.** Labels OCI (source/revision/created/
  title/description).
- Actions Docker officielles (`setup-buildx`/`login`/`metadata`/`build-push`), épinglées par **majeure** (SHA
  futur). Détail : [`REGISTRY_POLICY.md`](../../deployment/core/docs/REGISTRY_POLICY.md) · guide :
  [`GHCR_REGISTRY_GUIDE.md`](../../deployment/core/docs/GHCR_REGISTRY_GUIDE.md).

### Niveau CI actuel & progression (Cloud Core 1 → 5)

Le **Cloud Core 1** gouverne cette CI sans l'étendre vers le déploiement. La progression est cadrée dans
[`deployment/core/docs/CLOUD_CORE_V1_EXECUTION_BASELINE.md`](../../deployment/core/docs/CLOUD_CORE_V1_EXECUTION_BASELINE.md) :

- **Niveau 1 (présent — `ci.yml`)** : contrats, client API, UI Kit, Web Core (build sans API), audit,
  gardes Axios/Zustand.
- **Niveau 2 (présent — `api-runtime-ci.yml`)** : CI runtime API NestJS (PostgreSQL + MinIO jetables) +
  migrations + unit + e2e + OpenAPI check — [`API_RUNTIME_CI_PLAN.md`](../../deployment/core/docs/API_RUNTIME_CI_PLAN.md).
- **Niveau 3 (présent — `web-e2e-ci.yml`)** : E2E navigateur Web (Health/Auth/Files) sur stack réelle —
  [`WEB_E2E_CI_PLAN.md`](../../deployment/core/docs/WEB_E2E_CI_PLAN.md).
- **Niveau 4 (partiel — `registry-ci.yml`)** : **registry GHCR** (build + push images, sans déploiement) —
  [`REGISTRY_POLICY.md`](../../deployment/core/docs/REGISTRY_POLICY.md). **Reste** : déploiement par environnement
  protégé + rollback (futur).

### Checks requis pour la protection de `main` (Cloud Core 4 / Quality Core 3)

Le nom d'un status check **est le `name:` du job** (jamais le nom du workflow). Protection `main`
appliquée via GitHub Rulesets (`protect-main`, enforcement `active`) :

**Statut courant : actif via ruleset.** Preuve : `gh api repos/mike-zks/enistere-os-foundation/rulesets/17522775`.

| # | Check (nom exact) | Workflow | Statut ruleset |
|---|---|---|---|
| 1 | `api-contracts` | `ci.yml` | ✅ oui |
| 2 | `api-client-fetch` | `ci.yml` | ✅ oui |
| 3 | `ui-kit` | `ci.yml` | ✅ oui |
| 4 | `web-nextjs` | `ci.yml` | ✅ oui |
| 5 | `audit` | `ci.yml` | ✅ oui |
| 6 | `api-runtime` | `api-runtime-ci.yml` | ✅ oui |
| 7 | `web-e2e` | `web-e2e-ci.yml` | ✅ oui |
| 8 | `api-smoke` | `registry-ci.yml` | ✅ oui |
| 9 | `images (api-nestjs, ./starters/nestjs, ./starters/nestjs/Dockerfile)` | `registry-ci.yml` (matrix) | promotion recommandée, non appliquée |
| 10 | `images (web-nextjs, ., ./starters/nextjs/Dockerfile)` | `registry-ci.yml` (matrix) | promotion recommandée, non appliquée |

> **Renommer un job casse l'exigence** (nouveau check, ancien plus produit) → tenir cette liste à jour.
> Les noms actuels sont **stables**. Voir le runbook pour la procédure complète, les options
> recommandées et la checklist de vérification post-activation.

### Politiques de durcissement (Cloud Core 4)

- **Artefacts** : **aucun upload** (Option A). Traces Playwright `retain-on-failure` **locales au runner**
  (jetées) — pas de fuite cookie/`.state.json`/URL signée. Upload conditionnel (Option B) = évolution future.
- **Couverture** : **exécutée, non publiée** (UI Kit 100 %, Web ≈ 87,8 %) ; pas de service externe ni gate.
- **Pinning** : `@v4` (majeure) conservé ; **SHA pinning** = durcissement futur (requiert une politique de MAJ).
- **Lint workflows** : `actionlint` **futur** (non installé) ; validation actuelle = parse YAML + simulations.

**Aucun déploiement** dans ces workflows (Cloud Core 4 n'ajoutait pas le registre). ADR-013 reste
**`PARTIELLEMENT_IMPLEMENTE`** (niveaux 1–3 + niveau 4 partiel [`registry-ci.yml`] + ruleset
`protect-main` actif ; restent couverture/release/déploiement/environnements) ; ADR-014 **`PARTIELLEMENT_IMPLEMENTE`** (registry
GHCR — `registry-ci.yml`, Cloud Core 5).
