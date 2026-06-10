# Cloud Core — `cores/cloud/`

Socle d'**exécution et d'infrastructure** d'Enistere OS Foundation. Ce core cadre l'infrastructure commune
(Docker, Traefik, PostgreSQL/Redis/MinIO, CI/CD, registry, environnements, backups, monitoring) **de manière
progressive et documentaire**, sans imposer prématurément une implémentation.

## Statut

**`CADRAGE_OPERATIONNEL`** — la spécification cible existe (`CORE_SPECIFICATION.md`) **et** un premier
**cadrage opérationnel** (Cloud Core 1) gouverne désormais la CI minimale existante et les politiques
d'exécution. **Aucune infrastructure réelle** n'est implémentée : ni Dockerfile, ni Compose, ni Traefik, ni
registry/GHCR, ni déploiement, ni secret. Le Cloud Core **n'est pas** `IMPLEMENTATION_PARTIELLE` (aucun
workflow Cloud/runtime/déploiement n'existe).

## Ce qui est cadré (Cloud Core 1)

- **Baseline d'exécution** : [`docs/CLOUD_CORE_V1_EXECUTION_BASELINE.md`](docs/CLOUD_CORE_V1_EXECUTION_BASELINE.md)
  (objectif, état, environnements, politiques CI/CD/secrets/registry/runtime/E2E/observabilité/rollback,
  limites V1, étapes suivantes).
- **Environnements logiques** : `local`, `ci`, `preview`, `staging`, `production` (seuls `local`/`ci`
  existent ; les autres sont théoriques).
- **Protection de branche `main`** (à appliquer **manuellement** dans GitHub Settings) :
  [`docs/GITHUB_BRANCH_PROTECTION_CHECKLIST.md`](docs/GITHUB_BRANCH_PROTECTION_CHECKLIST.md).
- **Politique CI progressive (4 niveaux)** : niveau 1 = CI minimale existante (`.github/workflows/ci.yml`) ;
  niveaux 2–4 = runtime API, E2E Web, registry/déploiement (futurs).
- **Politiques** : [secrets](docs/SECRETS_POLICY.md), [registry (ADR-014)](docs/REGISTRY_POLICY.md),
  [CI runtime API (futur)](docs/API_RUNTIME_CI_PLAN.md), [E2E navigateur (futur)](docs/WEB_E2E_CI_PLAN.md).

## Ce qui n'est PAS implémenté

Dockerfile/Compose · Traefik/DNS/TLS · PostgreSQL/Redis/MinIO **provisionnés** · GHCR/registry (ADR-014) ·
déploiement (staging/production) · GitHub Environments réels · monitoring (Prometheus/Grafana/Loki) ·
backups/restore · OSRM/PostGIS · secrets. La CI minimale reste **lecture seule, non déployante, sans secret**.

## État CI/CD (ADR)

- **ADR-013 (CI/CD V1)** : **`PARTIELLEMENT_IMPLEMENTE`** — CI minimale présente (non-régression monorepo) ;
  restent protection de branche, runtime API, E2E, déploiement, environnements protégés.
- **ADR-014 (registry images)** : **`NON_IMPLEMENTE`** — aucune image construite/poussée.

## Prochaine étape

Appliquer la **checklist de protection de branche** `main`, puis implémenter le **niveau 2** (CI runtime API
NestJS avec PostgreSQL + MinIO en services) selon [`docs/API_RUNTIME_CI_PLAN.md`](docs/API_RUNTIME_CI_PLAN.md).
Voir [`docs/project-status/NEXT_ACTIONS.md`](../../docs/project-status/NEXT_ACTIONS.md).
