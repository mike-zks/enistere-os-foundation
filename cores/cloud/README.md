# Cloud Core — `cores/cloud/`

Socle d'**exécution et d'infrastructure** d'Enistere OS Foundation. Ce core cadre l'infrastructure commune
(Docker, Traefik, PostgreSQL/Redis/MinIO, CI/CD, registry, environnements, backups, monitoring) **de manière
progressive et documentaire**, sans imposer prématurément une implémentation.

## Statut

**`IMPLEMENTATION_PARTIELLE`** — au cadrage opérationnel (Cloud Core 1) s'ajoutent **deux workflows Cloud
runtime réels** : la **CI runtime de l'API NestJS** (`api-runtime-ci.yml`, niveau 2 — migrations + unit +
**e2e** contre PostgreSQL + MinIO jetables, OpenAPI check, build, audit) **et la CI E2E navigateur**
(`web-e2e-ci.yml`, niveau 3 — stack réelle API + PostgreSQL + MinIO + Web + **Playwright/Chromium** ; parcours
Health/Auth/Files). **Restent non implémentés** : registre/GHCR (ADR-014), déploiement, environnements protégés
(staging/production), monitoring, backups, rollback, Dockerfile/Compose/Traefik, secrets. **Aucune
infrastructure de déploiement** ; les workflows sont **lecture seule, sans secret GitHub**.

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

Valeurs de **test jetables** (jamais `secrets.*`), **logs sans secret**, données **éphémères**, **aucun
artefact uploadé**. E2E **isolés** du niveau 1 (`tsconfig`/`eslint` exclus).

## Ce qui n'est PAS implémenté

Dockerfile/Compose · Traefik/DNS/TLS · Redis/MinIO **provisionnés en prod** · GHCR/registry (ADR-014) ·
déploiement (staging/production) · GitHub Environments réels · monitoring (Prometheus/Grafana/Loki) ·
backups/restore · OSRM/PostGIS · rollback · couverture publiée · **upload/suppression Files côté Web** ·
secrets. Les workflows restent **lecture seule, non déployants, sans secret GitHub**.

## État CI/CD (ADR)

- **ADR-013 (CI/CD V1)** : **`PARTIELLEMENT_IMPLEMENTE`** — CI minimale (niveau 1) **+ CI runtime API**
  (niveau 2) **+ CI E2E navigateur** (niveau 3) ; restent protection de branche, déploiement, environnements
  protégés, release (niveau 4).
- **ADR-014 (registry images)** : **`NON_IMPLEMENTE`** — aucune image construite/poussée.

## Prochaine étape

**Cloud Core 4 — durcissement CI & gouvernance de branche** (recommandé) : **appliquer** la protection de
branche `main` (action humaine, [`docs/GITHUB_BRANCH_PROTECTION_CHECKLIST.md`](docs/GITHUB_BRANCH_PROTECTION_CHECKLIST.md)),
puis couverture publiée / scan de dépendances ; ou **niveau 4** (registry GHCR + déploiement) si la mise en
production devient prioritaire. Voir [`docs/project-status/NEXT_ACTIONS.md`](../../docs/project-status/NEXT_ACTIONS.md).
