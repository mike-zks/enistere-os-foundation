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

## Ce qui n'est PAS implémenté

`docker-compose` de **production** · Traefik/DNS/TLS réels · **déploiement réel** (staging exécuté / production) ·
GitHub Environments réels · workflow deploy automatique · monitoring (Prometheus/Grafana/Loki) · backups/restore
automatisés · OSRM/PostGIS · rollback automatique · scan/signature d'image · semver/release · couverture publiée ·
**upload/suppression Files côté Web** · secrets applicatifs. Les workflows restent **non déployants, sans secret
applicatif** (le registry pousse des images via `GITHUB_TOKEN`, sans déployer).

## État CI/CD (ADR)

- **ADR-013 (CI/CD V1)** : **`PARTIELLEMENT_IMPLEMENTE`** — CI niveaux 1–3 + **niveau 4 partiel** (registry) ;
  restent protection de branche (action humaine), déploiement, environnements protégés, release.
- **ADR-014 (registry images)** : **`PARTIELLEMENT_IMPLEMENTE`** (Cloud Core 5) — build + push GHCR sur `main`,
  tags immuables, labels OCI, **sans déploiement** ; restent scan/signature, semver, déploiement.

## Gouvernance CI (Cloud Core 4)

**Checks** à rendre **bloquants** sur `main` (= `name:` des jobs) : `api-contracts`, `api-client-fetch`,
`ui-kit`, `web-nextjs`, `audit`, `api-runtime`, `web-e2e` (**7 obligatoires**) **+ `images`** (registry, 8ᵉ
recommandé) — application **manuelle** ([`docs/GITHUB_BRANCH_PROTECTION_CHECKLIST.md`](docs/GITHUB_BRANCH_PROTECTION_CHECKLIST.md)).
Décisions : **artefacts** = aucun upload (Option A) ; **couverture** = exécutée, non publiée ; **pinning** =
`@v4` (SHA futur) ; **`actionlint`** futur. Détail : [`docs/CLOUD_CORE_V1_EXECUTION_BASELINE.md`](docs/CLOUD_CORE_V1_EXECUTION_BASELINE.md) §8 bis.

## Prochaine étape

**Prochaine mission Codex** : **Cloud Core 7 — exécution réelle staging sur serveur** (appliquer les runbooks sur
un serveur staging identifié, secrets hors dépôt) **si** le serveur + secrets sont prêts ; **sinon** **Cloud
Core 7 — staging dry-run GitHub** (vérifier l'existence des images/tags, sans déployer) **ou** durcissement
registry (scan/signature/provenance). Voir
[`docs/project-status/NEXT_ACTIONS.md`](../../docs/project-status/NEXT_ACTIONS.md).
