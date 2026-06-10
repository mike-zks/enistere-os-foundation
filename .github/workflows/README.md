# CI — workflows GitHub Actions

Deux workflows, **lecture seule** (`permissions: contents: read`), **sans secret GitHub, sans registry/GHCR,
sans déploiement** :

| Workflow | Rôle | Niveau (Cloud Core) |
|---|---|---|
| [`ci.yml`](ci.yml) | Non-régression du monorepo (contrats, client, UI Kit, Web, audit) — **sans** base/stockage | Niveau 1 |
| [`api-runtime-ci.yml`](api-runtime-ci.yml) | Runtime de l'**API NestJS** : PostgreSQL + MinIO **jetables**, migrations Prisma, unit + e2e, OpenAPI check, build, audit | Niveau 2 |

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

Valide l'**API Core NestJS** contre ses dépendances runtime **minimales et jetables**. `cores/api-nestjs/`
est un projet npm **autonome** (lockfile propre, hors workspaces racine) : `working-directory: cores/api-nestjs`
+ `npm ci`. **Lecture seule, aucun secret GitHub, aucun registre, aucun déploiement.**

### Services

- **PostgreSQL** (`postgres:16`) en conteneur `services:` avec healthcheck `pg_isready`.
- **MinIO** (`minio/minio`) démarré via **`docker run`** (un conteneur `services:` **ne peut pas** recevoir la
  commande `server /data` requise par MinIO), attente de `…/minio/health/live`, puis **bucket de test** créé
  (`enistere-test-files`) — l'API ne crée pas le bucket automatiquement.

### Variables

Uniquement des **valeurs de test jetables** définies dans le workflow (jamais `secrets.*`, jamais committées
en `.env`) : `DATABASE_URL`, `JWT_*`, `REFRESH_TOKEN_HASH_SECRET`, `ARGON2_*`, `S3_*`, rate limits élargis,
`CORS_ORIGINS`, `LOG_LEVEL=warn`. Ces noms suivent `cores/api-nestjs/.env.example`.

### Étapes (scripts réels de `cores/api-nestjs/package.json`)

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

### Niveau CI actuel & progression (Cloud Core 1 → 2)

Le **Cloud Core 1** gouverne cette CI sans l'étendre vers le déploiement. La progression est cadrée dans
[`cores/cloud/docs/CLOUD_CORE_V1_EXECUTION_BASELINE.md`](../../cores/cloud/docs/CLOUD_CORE_V1_EXECUTION_BASELINE.md) :

- **Niveau 1 (présent — `ci.yml`)** : contrats, client API, UI Kit, Web Core (build sans API), audit,
  gardes Axios/Zustand.
- **Niveau 2 (présent — `api-runtime-ci.yml`)** : CI runtime API NestJS (PostgreSQL + MinIO jetables) +
  migrations + unit + e2e + OpenAPI check — [`API_RUNTIME_CI_PLAN.md`](../../cores/cloud/docs/API_RUNTIME_CI_PLAN.md).
- **Niveau 3 (futur)** : E2E navigateur Web — [`WEB_E2E_CI_PLAN.md`](../../cores/cloud/docs/WEB_E2E_CI_PLAN.md).
- **Niveau 4 (futur)** : build/push d'images (GHCR, ADR-014) + déploiement par environnement —
  [`REGISTRY_POLICY.md`](../../cores/cloud/docs/REGISTRY_POLICY.md).

**Protection de branche `main`** : à appliquer **manuellement** (rendre les checks des deux workflows
bloquants) — [`GITHUB_BRANCH_PROTECTION_CHECKLIST.md`](../../cores/cloud/docs/GITHUB_BRANCH_PROTECTION_CHECKLIST.md).
**Aucun déploiement, aucun secret, aucun registry** dans ces workflows. ADR-013 reste
**`PARTIELLEMENT_IMPLEMENTE`** tant que les niveaux 3–4 et la protection de branche ne sont pas en place ;
ADR-014 reste **`NON_IMPLEMENTE`**.
