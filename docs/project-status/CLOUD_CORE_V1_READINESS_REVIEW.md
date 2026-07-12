# CLOUD_CORE_V1_READINESS_REVIEW.md — Cloud Core V1 Readiness Review

> Date : 2026-07-12.
> Perimetre : Cloud Core minimal V1, CI/registry/staging CC1→CC11, documentation et gates.
> Contrainte : aucun test de serveur reel relance pendant cette revue ; les preuves CC10/CC11 restent les preuves
> runtime versionnees.

## Synthese

**Decision : Cloud Core passe de `IMPLEMENTATION_PARTIELLE` a `IMPLEMENTATION_AVANCEE`.**

Cloud Core n'est pas promu `VALIDE_V1` : le socle staging reel est operationnel et documente, mais la cible V1
historique mentionne encore Redis et un compose local/prod generique. Ces gaps doivent etre tranches ou livres
avant une validation V1 formelle.

## Sources lues

- `strategy/04_ROADMAP_GLOBAL.md` §11 ;
- `strategy/02_GOVERNANCE.md` §10 ;
- `strategy/07_SECURITY.md` §20.7 / §21.4 ;
- `cores/cloud/CORE_SPECIFICATION.md` §46→§52 ;
- `cores/cloud/README.md` ;
- `cores/cloud/staging/docker-compose.cc10.yml` ;
- `cores/cloud/staging/docker-compose.staging.example.yml` ;
- `cores/cloud/staging/.env.staging.example` ;
- `cores/cloud/docs/CC10_STAGING_DEPLOYMENT_REPORT.md` ;
- `cores/cloud/docs/CC11_STAGING_OPERATIONAL_REPORT.md` ;
- `cores/cloud/docs/CC11_OPERATIONAL_RUNBOOK.md` ;
- `cores/quality-core/QUALITY_GATES_MATRIX.md` §2.8 ;
- `docs/project-status/FOUNDATION_CURRENT_STATE.md` ;
- `docs/project-status/IMPLEMENTATION_MATRIX.md` ;
- `docs/project-status/NEXT_ACTIONS.md`.

## Lecture des criteres V1

| Critere | Etat observe | Verdict |
|---|---|---|
| Structure cloud cible documentee | `CORE_SPECIFICATION.md`, `README.md`, runbooks staging, rapports CC10/CC11. | ✅ |
| Docker et Docker Compose cadres | `docker-compose.staging.example.yml` + `docker-compose.cc10.yml`, images GHCR immuables. | ✅ |
| Traefik comme reverse proxy | Labels Traefik CC10, reseau externe `web`, TLS Let's Encrypt. | ✅ |
| PostgreSQL prevu et execute | Service `postgres:16`, volume `pgdata`, healthcheck, non expose. | ✅ |
| MinIO prevu et execute | Service `minio/minio`, volume `miniodata`, API S3 routee HTTPS, console non exposee. | ✅ |
| Redis prevu | Spec/roadmap le mentionnent, mais aucun service Redis livre dans CC10. API V1 reporte Redis en V2. | ⚠️ |
| Reseaux et volumes persistants documentes | `staging-internal`, `web`, `pgdata`, `miniodata`. | ✅ |
| Variables d'environnement sans secrets reels | `.env.staging.example` uniquement placeholders, secrets hors depot. | ✅ |
| Ports publics limites | CC10 : aucun port hote service ; exposition via reverse proxy uniquement. | ✅ |
| PostgreSQL et Redis non publics | PostgreSQL non public ; Redis absent donc non expose, mais non teste. | ⚠️ |
| Utilisateur applicatif PostgreSQL non superuser | Variable `POSTGRES_USER=enistere`, pas d'usage superuser applicatif documente ; preuve serveur non rejouee ici. | ✅ |
| Dashboards proteges/desactives | Console MinIO non exposee ; pas de dashboard Traefik versionne. | ✅ |
| Health checks definis | Compose API/Web/PostgreSQL + health HTTPS CC11. | ✅ |
| Strategie backup minimale | Scripts `backup-postgres.sh`, `backup-minio.sh` + runbook. | ✅ |
| Procedure restore cadree | Restore PostgreSQL et MinIO testes en CC11, protocole runbook. | ✅ |
| Securite serveur minimale documentee | Secrets hors Git, ports limites, HTTPS, compte deploy non-root, runbooks. | ✅ |
| Integrations API Core NestJS claires | API interne, DB, S3/MinIO, migrations Prisma, presigned URLs navigateur compatibles. | ✅ |

## Decision de statut

`IMPLEMENTATION_AVANCEE` est justifie par :

- staging HTTPS reel valide en CC10 ;
- CI runtime API, E2E navigateur et registry GHCR deja en place ;
- images immuables, pas de `latest`, ports internes limites ;
- backups PostgreSQL/MinIO et restores verifies en CC11 ;
- rollback/roll-forward image verifies ;
- runbook operationnel versionne ;
- aucune fuite de secret dans le depot.

`VALIDE_V1` est differe par :

- Redis est encore un item V1 historique de la roadmap Cloud §11.2/§11.4, mais l'API Core le reporte en V2 et
  le staging CC10 ne l'embarque pas ;
- le compose actuellement prouve est un compose staging specifique, pas encore un trio generique
  `base/local/prod` ;
- les tests Cloud reels doivent rester des gates finaux, non relances a chaque mission documentaire ;
- monitoring/alerting restent manuels ou ponctuels.

## Gaps bloquants `VALIDE_V1`

| Gap | Option de resolution |
|---|---|
| Redis dans la cible V1 Cloud | Soit livrer un service Redis non public et un check minimal, soit documenter officiellement son report V2 en coherence avec API Core. |
| Compose V1 generique | Stabiliser une structure `base/local/staging` ou acter que CC10 est le compose serveur V1 officiel. |
| Readiness finale Cloud | Executer les gates staging finaux seulement avant release/deploiement cible, selon CC11. |

## Verifications locales

```bash
node cores/quality-core/scripts/quality-gates.mjs run docs
git diff --check
npm audit
```

Resultats observes :

- `quality-gates run docs` : 2/2 gates passes, `Docs Core link check passed (60 files)` ;
- `git diff --check` : propre ;
- `npm audit` : 0 vulnerabilite.

Les tests Cloud reels ne sont pas relances dans cette mission : ils restent couverts par les preuves versionnees
CC10/CC11 et par les gates finaux staging.

## Prochaine mission recommandee

**Cloud Core 12 — decision Redis/Compose V1** : trancher explicitement Redis (livraison minimale ou report V2)
et aligner la structure Compose V1 (`base/local/staging` ou CC10 comme compose serveur officiel), sans relancer le
serveur reel sauf gate final explicite.
