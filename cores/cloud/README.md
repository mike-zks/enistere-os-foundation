# Cloud Core — `cores/cloud/`

Socle d'**exécution et d'infrastructure** d'Enistere OS Foundation. Ce core cadre l'infrastructure commune
(Docker, Traefik, PostgreSQL/Redis/MinIO, CI/CD, registry, environnements, backups, monitoring) **de manière
progressive et documentaire**, sans imposer prématurément une implémentation.

## Statut

**`IMPLEMENTATION_PARTIELLE`** (depuis Cloud Core 2) — au cadrage opérationnel (Cloud Core 1) s'ajoute un
**workflow Cloud runtime réel** : la **CI runtime de l'API NestJS** (`.github/workflows/api-runtime-ci.yml`,
niveau 2) qui rejoue migrations + tests unitaires + **e2e** contre **PostgreSQL + MinIO jetables**, OpenAPI
check, build et audit. **Restent non implémentés** : registre/GHCR (ADR-014), déploiement, environnements
protégés (staging/production), monitoring, backups, rollback, Dockerfile/Compose/Traefik, secrets. **Aucune
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
  **niveau 2 = CI runtime API** (`.github/workflows/api-runtime-ci.yml`, **implémenté** — Cloud Core 2) ;
  niveaux 3–4 = E2E Web, registry/déploiement (futurs).
- **Politiques** : [secrets](docs/SECRETS_POLICY.md), [registry (ADR-014)](docs/REGISTRY_POLICY.md),
  [CI runtime API (implémenté)](docs/API_RUNTIME_CI_PLAN.md), [E2E navigateur (futur)](docs/WEB_E2E_CI_PLAN.md).

## Ce qui est implémenté (CI runtime — Cloud Core 2)

`.github/workflows/api-runtime-ci.yml` : PostgreSQL (`postgres:16`, service) + MinIO (`docker run`, bucket de
test) **jetables** → `prisma:generate`/`validate`/**`migrate:deploy`** → `lint` → unit (`npm test`) → **e2e**
(`test:e2e`) → **`openapi:check`** → `build` → `npm audit`. Valeurs de **test jetables** (jamais `secrets.*`),
**logs sans secret**, données **éphémères**, **aucun artefact uploadé**.

## Ce qui n'est PAS implémenté

Dockerfile/Compose · Traefik/DNS/TLS · Redis/MinIO **provisionnés en prod** · GHCR/registry (ADR-014) ·
déploiement (staging/production) · GitHub Environments réels · monitoring (Prometheus/Grafana/Loki) ·
backups/restore · OSRM/PostGIS · rollback · **E2E navigateur** (niveau 3) · secrets. Les workflows restent
**lecture seule, non déployants, sans secret GitHub**.

## État CI/CD (ADR)

- **ADR-013 (CI/CD V1)** : **`PARTIELLEMENT_IMPLEMENTE`** — CI minimale (niveau 1) **+ CI runtime API**
  (niveau 2) ; restent protection de branche, E2E navigateur, déploiement, environnements protégés, release.
- **ADR-014 (registry images)** : **`NON_IMPLEMENTE`** — aucune image construite/poussée.

## Prochaine étape

**Cloud Core 3 — E2E navigateur (niveau 3)** : parcours Health/Auth/Files en CI selon
[`docs/WEB_E2E_CI_PLAN.md`](docs/WEB_E2E_CI_PLAN.md). En parallèle (action humaine) : appliquer la
**checklist de protection de branche** `main`. Voir
[`docs/project-status/NEXT_ACTIONS.md`](../../docs/project-status/NEXT_ACTIONS.md).
