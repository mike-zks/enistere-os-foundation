# Cloud Core — `cores/cloud/`

Socle d'**exécution et d'infrastructure** d'Enistere OS Foundation. Ce core cadre l'infrastructure commune
(Docker, Traefik, PostgreSQL/Redis/MinIO, CI/CD, registry, environnements, backups, monitoring) **de manière
progressive et documentaire**, sans imposer prématurément une implémentation.

## Statut

**`IMPLEMENTATION_PARTIELLE`** — au cadrage opérationnel (Cloud Core 1) s'ajoutent **deux workflows Cloud
runtime réels** : la **CI runtime de l'API NestJS** (`api-runtime-ci.yml`, niveau 2 — migrations + unit +
**e2e** contre PostgreSQL + MinIO jetables, OpenAPI check, build, audit), **la CI E2E navigateur**
(`web-e2e-ci.yml`, niveau 3 — stack réelle API + PostgreSQL + MinIO + Web + **Playwright/Chromium** ; parcours
Health/Auth/Files) **et la CI registry GHCR** (`registry-ci.yml`, niveau 4 partiel — build + push d'images
API/Web sur `main`, **sans déploiement**). **Restent non implémentés** : déploiement, environnements protégés
(staging/production), monitoring, backups, rollback, `docker-compose` de prod/Traefik, secrets applicatifs,
scan/signature d'image. **Aucune infrastructure de déploiement** ; les workflows sont **sans secret applicatif**
(le registry utilise le `GITHUB_TOKEN` automatique, sans déployer).

## Ce qui est cadré (Cloud Core 1)

- **Baseline d'exécution** : [`docs/CLOUD_CORE_V1_EXECUTION_BASELINE.md`](docs/CLOUD_CORE_V1_EXECUTION_BASELINE.md)
  (objectif, état, environnements, politiques CI/CD/secrets/registry/runtime/E2E/observabilité/rollback,
  limites V1, étapes suivantes).
- **Environnements logiques** : `local`, `ci`, `preview`, `staging`, `production` (seuls `local`/`ci`
  existent ; les autres sont théoriques).
- **Protection de branche `main`** (à appliquer **manuellement** dans GitHub Settings) :
  [`docs/GITHUB_BRANCH_PROTECTION_CHECKLIST.md`](docs/GITHUB_BRANCH_PROTECTION_CHECKLIST.md).
- **Politique CI progressive (4 niveaux)** : **niveau 1** = CI minimale (`.github/workflows/ci.yml`) ;
  **niveau 2 = CI runtime API** (`api-runtime-ci.yml`, Cloud Core 2) ; **niveau 3 = CI E2E navigateur**
  (`web-e2e-ci.yml`, Cloud Core 3) ; niveau 4 = registry/déploiement (futur).
- **Politiques** : [secrets](docs/SECRETS_POLICY.md), [registry (ADR-014)](docs/REGISTRY_POLICY.md),
  [CI runtime API (implémenté)](docs/API_RUNTIME_CI_PLAN.md), [E2E navigateur (implémenté)](docs/WEB_E2E_CI_PLAN.md).

## Ce qui est implémenté (CI runtime + E2E — Cloud Core 2 & 3)

- **Niveau 2 — `api-runtime-ci.yml`** : PostgreSQL (`services:`) + MinIO (`docker run`, bucket) jetables →
  `prisma:generate`/`validate`/**`migrate:deploy`** → `lint` → unit (`npm test`) → **e2e** → **`openapi:check`**
  → `build` → `npm audit`.
- **Niveau 3 — `web-e2e-ci.yml`** : stack réelle **API + PostgreSQL + MinIO + Web** + **Playwright/Chromium** ;
  seed utilisateurs + fixture VALIDATED éphémères ; parcours **Health/Auth/Files** (anonyme→/login, login,
  logout, métadonnées sans champ interne, téléchargement, introuvable, accès refusé) ; **`APP_ENV=development`**
  (cookies HTTP) ; traces `retain-on-failure`.
- **Niveau 4 partiel — `registry-ci.yml`** (Cloud Core 5) : **registry GHCR** — build des images API/Web
  (Dockerfiles multi-stage, **non-root**, Web en Next.js **standalone**) + **push GHCR sur `main`** (tags
  immuables `sha-`/`main-`, **pas de `latest`**, labels OCI, auth `GITHUB_TOKEN`). **Aucun déploiement, aucun
  secret applicatif, aucun PAT, aucun `.env` dans l'image.** Détail : [`docs/REGISTRY_POLICY.md`](docs/REGISTRY_POLICY.md),
  guide [`docs/GHCR_REGISTRY_GUIDE.md`](docs/GHCR_REGISTRY_GUIDE.md).

Valeurs de **test jetables** (jamais `secrets.*`), **logs sans secret**, données **éphémères**, **aucun
artefact uploadé**. E2E **isolés** du niveau 1 (`tsconfig`/`eslint` exclus).

## Staging manuel (Cloud Core 6) — `CADRE_MANUEL_DOCUMENTE`

**Cadrage** d'un déploiement **staging manuel** à partir des images GHCR immuables — **aucun déploiement réel,
aucun secret, aucune production, aucune automatisation**. Livrables : `staging/docker-compose.staging.example.yml`
(api+web+postgres+minio, réseau interne, healthchecks, **migrations hors démarrage**), `staging/.env.staging.example`
(placeholders), `staging/README.md`, et les runbooks [`docs/STAGING_DEPLOYMENT_RUNBOOK.md`](docs/STAGING_DEPLOYMENT_RUNBOOK.md)
+ [`docs/STAGING_ROLLBACK_RUNBOOK.md`](docs/STAGING_ROLLBACK_RUNBOOK.md). Points clés : tag **immuable** `sha-`,
secrets **hors dépôt** (`openssl rand -base64 48`), **migrations Prisma découplées** de l'image (CLI absent de la
runtime → étape source séparée), **PostgreSQL non exposé**, **MinIO API joignable navigateur** (URL signées),
**rollback d'image** simple mais **rollback DB non garanti** (migrations additives). `docker compose config`
**validé**, **aucun secret API** fuité dans le conteneur Web.

## Staging dry-run (CC7) + correction image API (CC8) — `DRY_RUN_API_IMAGE_FIXED`

**Dry-run local réel** (2026-06-11) à partir des **images GHCR immuables** + `.env.staging` **réel hors dépôt**
(secrets jetables, supprimé après) — **aucun déploiement réel, aucun secret committé, aucun `latest`**. Détail :
[`docs/STAGING_DRY_RUN_REPORT.md`](docs/STAGING_DRY_RUN_REPORT.md).

- **CC7** : ✅ `compose config` valide ; ✅ images tirées en anonyme ; ✅ `postgres`/`minio`/bucket ; ✅ **image
  Web boote** (HTTP 200) ; ❌ **défaut bloquant** : l'**image API ne démarrait pas** (query engine Prisma
  **OpenSSL 1.1.x** vs runtime **bookworm 3.0.x** → crash-loop), **invisible à la CI** (`api-runtime-ci` tourne
  depuis les sources ; `registry-ci` ne faisait que **construire** l'image).
- **CC8 — corrigé** : `binaryTargets=["native","debian-openssl-3.0.x"]` (schéma) + `openssl` au stage build
  (Dockerfile) → moteur **3.0.x** dans `.prisma/client`. **Re-validé** (image + moteur 3.0.x) : migrations
  **depuis l'image** (offline, 5 appliquées), API **`healthy`** `/health/live` & `/health/ready` **200**, Web
  **200**, stack complète **healthy**. **Angle mort CI fermé** : job **`api-smoke`** dans `registry-ci.yml`
  (lance l'image, vérifie le chargement du moteur Prisma) → **gate du push GHCR**.
- 🗂️ **Stratégie migrations** tranchée = **Option A (depuis l'image)** (CLI + schema-engine 3.0.x embarqués).
- 🔑 **MinIO/URL signée** (Option A) : `S3_ENDPOINT` = adresse **publique** du serveur (jamais `minio:9000`).
- ⚠️ L'**image GHCR corrigée** est **reconstruite/publiée par la registry CI au merge CC8** (tags antérieurs,
  `sha-7b07e5e` et avant, restent cassés). **Exécution staging réelle** = prochaine étape (serveur réel).

## Ce qui n'est PAS implémenté

`docker-compose` de **production** · Traefik/DNS/TLS réels · **déploiement réel** (staging exécuté / production) ·
GitHub Environments réels · workflow deploy automatique · monitoring (Prometheus/Grafana/Loki) · backups/restore
automatisés · OSRM/PostGIS · rollback automatique · scan/signature d'image · semver/release · couverture publiée ·
**upload/suppression Files côté Web** · secrets applicatifs. Les workflows restent **non déployants, sans secret
applicatif** (le registry pousse des images via `GITHUB_TOKEN`, sans déployer).

## État CI/CD (ADR)

- **ADR-013 (CI/CD V1)** : **`PARTIELLEMENT_IMPLEMENTE`** — CI niveaux 1–3 + **niveau 4 partiel** (registry) ;
  restent protection de branche (action humaine), déploiement, environnements protégés, release.
- **ADR-014 (registry images)** : **`PARTIELLEMENT_IMPLEMENTE`** (CC5 + **CC8**) — build + **smoke-run image
  API** (`api-smoke`, gate du push) + push GHCR sur `main`, tags immuables, labels OCI, **sans déploiement** ;
  restent scan/signature, semver, déploiement.

## Gouvernance CI (Cloud Core 4)

**Checks** à rendre **bloquants** sur `main` (= `name:` des jobs) : `api-contracts`, `api-client-fetch`,
`ui-kit`, `web-nextjs`, `audit`, `api-runtime`, `web-e2e` (**7 obligatoires**) **+ `images`** (registry, 8ᵉ
recommandé) — application **manuelle** ([`docs/GITHUB_BRANCH_PROTECTION_CHECKLIST.md`](docs/GITHUB_BRANCH_PROTECTION_CHECKLIST.md)).
Décisions : **artefacts** = aucun upload (Option A) ; **couverture** = exécutée, non publiée ; **pinning** =
`@v4` (SHA futur) ; **`actionlint`** futur. Détail : [`docs/CLOUD_CORE_V1_EXECUTION_BASELINE.md`](docs/CLOUD_CORE_V1_EXECUTION_BASELINE.md) §8 bis.

## Prochaine étape

**Prochaine mission Codex** : **Cloud Core 9 — exécution staging réelle contrôlée sur serveur** : appliquer les
runbooks sur un **serveur staging identifié** avec l'**image GHCR API reconstruite après le merge CC8** (secrets
hors dépôt, `S3_ENDPOINT` **public** Option A), vérifier health + parcours réels (dont **téléchargement
navigateur** via URL signée). Le défaut image API (CC7) est **corrigé et re-validé** (CC8 ; cf.
[`docs/STAGING_DRY_RUN_REPORT.md`](docs/STAGING_DRY_RUN_REPORT.md) §8). Voir
[`docs/project-status/NEXT_ACTIONS.md`](../../docs/project-status/NEXT_ACTIONS.md).
