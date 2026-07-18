# CLOUD_CORE_12_REDIS_COMPOSE_DECISION.md — Decision Redis / Compose V1

> Date : 2026-07-12.
> Perimetre : Cloud Core V1, decision Redis, decision Compose serveur/staging.
> Contrainte : aucun acces serveur reel, aucun redeploiement, aucun secret, aucun workflow modifie.

## Synthese

**Decision : Cloud Core passe de `IMPLEMENTATION_AVANCEE` a `VALIDE_V1`.**

Les deux gaps bloquants identifies par `CLOUD_CORE_V1_READINESS_REVIEW.md` sont tranches :

1. **Redis est reporte post-V1 / V2**.
2. **`deployment/core/staging/docker-compose.cc10.yml` est le compose serveur/staging V1 officiel**.

Les preuves runtime restent celles de CC10/CC11. Les tests Cloud reels ne sont pas relances dans cette mission :
ils restent des gates finaux gouvernes par runbook.

## Sources lues

- `strategy/04_ROADMAP_GLOBAL.md` §11 ;
- `deployment/core/CORE_SPECIFICATION.md` §21, §47, §48, §52 ;
- `starters/nestjs/CORE_SPECIFICATION.md` §21 ;
- `starters/nestjs/docs/API_CORE_V1_NEXT_ROADMAP.md` §6 ;
- `deployment/core/staging/docker-compose.cc10.yml` ;
- `deployment/core/staging/docker-compose.staging.example.yml` ;
- `deployment/core/staging/.env.staging.example` ;
- `deployment/core/docs/CC10_STAGING_DEPLOYMENT_REPORT.md` ;
- `deployment/core/docs/CC11_STAGING_OPERATIONAL_REPORT.md` ;
- `docs/project-status/CLOUD_CORE_V1_READINESS_REVIEW.md`.

## Decision 1 — Redis

Redis est **reporte post-V1 / V2** pour Cloud Core.

Justification :

- API Core V1 est `VALIDE_V1` sans Redis.
- `API_CORE_V1_NEXT_ROADMAP.md` classe Redis distribue en **P2 post-V1**.
- Les usages Redis prevus (cache distribue, throttling multi-instance, sessions partagees, queues/BullMQ) ne sont
  pas requis par le staging V1 actuel.
- Ajouter Redis maintenant augmenterait le perimetre d'exploitation sans consommateur V1.

Regle V1 :

- aucun service Redis n'est requis pour declarer Cloud Core V1 valide ;
- si un projet derive active Redis, il doit rester interne, non public, configure par variables hors Git et couvert
  par un health check dedie ;
- la livraison Redis standardisee appartient a Cloud V2 ou a une mission explicitement cadrée.

## Decision 2 — Compose V1

`deployment/core/staging/docker-compose.cc10.yml` devient le **compose serveur/staging V1 officiel**.

Justification :

- c'est le seul compose prouve en HTTPS reel avec reverse proxy compatible Traefik ;
- il ne publie aucun port applicatif hote : exposition via le reseau `web` et labels Traefik ;
- PostgreSQL reste interne ;
- MinIO API est routee par domaine HTTPS pour les URLs signees navigateur ;
- les volumes persistants `pgdata` et `miniodata` sont declares ;
- les health checks API/Web/PostgreSQL existent ;
- CC10 valide auth + files de bout en bout ;
- CC11 valide backup/restore/rollback/rotation.

`docker-compose.staging.example.yml` reste un **exemple historique/manual** utile comme reference, mais il n'est
pas le compose V1 de validation. La structure generique `base/local/prod` est reportee V2.

## Impact sur les criteres V1

| Critere | Decision CC12 |
|---|---|
| Redis demarre | N'est plus un critere V1 obligatoire ; Redis est V2/post-V1. |
| Redis non public | S'appliquera quand Redis sera livre ; aucun Redis V1 n'est expose. |
| Compose base/local/prod | Reporte V2 ; CC10 est le compose serveur/staging V1 officiel. |
| Tests serveur reels | Restent gates finaux ; non relances a chaque revue documentaire. |

## Decision de statut

Cloud Core est **`VALIDE_V1`**.

Preuves principales :

- CI niveau 2 API runtime ;
- CI niveau 3 E2E navigateur ;
- CI niveau 4 partiel registry + `api-smoke` ;
- staging HTTPS reel CC10 ;
- health, backup/restore, rollback/roll-forward, rotation smoke CC11 ;
- secrets hors depot ;
- aucun port public applicatif hors reverse proxy ;
- runbooks operationnels versionnes.

## Verifications locales

```bash
node factory/quality/core/scripts/quality-gates.mjs run docs
npm audit
```

Resultats observes :

- `quality-gates run docs` : 2/2 gates passes, `Docs Core link check passed (61 files)` ;
- `npm audit` : 0 vulnerabilite.

Les preuves runtime Cloud restent les rapports CC10/CC11 ; aucun acces serveur reel n'est effectue ici.

## Prochaine mission recommandee

Retour pilotage global. Les candidats non bloques sont :

- Quality Core `IMPLEMENTATION_AVANCEE` review, si l'on veut poursuivre l'industrialisation V2 ;
- Mobile RN31 uniquement si macOS/Xcode ou device iOS reel devient disponible ;
- Cloud V2 Redis/monitoring uniquement sur cadrage explicite.
