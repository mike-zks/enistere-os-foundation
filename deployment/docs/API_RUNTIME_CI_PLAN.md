# Deployment — CI runtime API NestJS (niveau 2)

> **IMPLÉMENTÉ (Deployment 2)** — workflow **`.github/workflows/api-runtime-ci.yml`**. Ce document a servi de
> plan ; il décrit désormais la CI runtime réelle de l'starter NestJS contre PostgreSQL + MinIO jetables.
> Toujours **sans** déploiement, registry/GHCR, Dockerfile applicatif ni secret. Aligné sur
> `CLOUD_CORE_V1_EXECUTION_BASELINE.md` §12 et ADR-013.

## 0. Implémentation réelle (`api-runtime-ci.yml`)

- Déclencheurs `pull_request` + `push main` ; `permissions: contents: read` ; concurrence
  `api-runtime-ci-${{ github.ref }}`. Node 24, **`npm ci`** dans `starters/nestjs/` (**projet autonome**,
  lockfile propre, hors workspaces racine).
- **PostgreSQL** en `services:` (`postgres:16`, healthcheck `pg_isready`). **MinIO** via **`docker run`**
  (`minio/minio server /data` — un conteneur `services:` ne peut pas porter cette commande) + attente santé +
  **bucket `enistere-test-files`** créé (l'API ne le crée pas).
- Étapes (scripts **réels**) : `prisma:generate` → `prisma:validate` → **`prisma:migrate:deploy`** → `lint`
  → `npm test` → **`test:e2e`** → **`openapi:check`** → `build` → `npm audit`.
- **Validé localement** par simulation (mêmes services, env, étapes) — voir le rapport de mission.

## 1. Objectif

Rejouer **en CI** ce qui n'est aujourd'hui prouvé que **localement** : migrations Prisma, tests unitaires +
e2e de l'API, cohérence du contrat OpenAPI — contre un **PostgreSQL** et un **MinIO** éphémères, **sans
secret réel** ni déploiement.

## 2. Forme envisagée (indicative, non créée)

- Job dédié (ex. `api-runtime`) **séparé** de la CI minimale (ou workflow distinct déclenché sur les chemins
  `starters/nestjs/**`), pour ne pas alourdir la non-régression niveau 1.
- **Services GitHub Actions** : `postgres` (image épinglée, ex. `postgres:16-alpine`) et `minio` (image
  épinglée), avec **health checks** avant le démarrage des tests.
- Variables d'environnement de **test uniquement** (valeurs jetables non sensibles, définies dans le
  workflow, **jamais** des secrets de production) : `DATABASE_URL`, `S3_ENDPOINT`, `S3_ACCESS_KEY_ID`,
  `S3_SECRET_ACCESS_KEY`, `S3_BUCKET`, `JWT_*`/`REFRESH_TOKEN_HASH_SECRET` factices de test.

## 3. Étapes envisagées (indicatives)

```text
npm ci
npx prisma generate
npx prisma validate
npx prisma migrate deploy   (ou migrate reset en base de test)
npm run test        (unitaires API)
npm run test:e2e    (e2e API : auth, RBAC, files S3/MinIO)
npm run openapi:check   (snapshot canonique à jour)
npm audit
```

## 4. Contraintes

- **Logs sans secret** (aucun `echo` de variable sensible ; valeurs de test factices).
- **Données éphémères** : base et bucket créés puis détruits ; pas d'état partagé entre exécutions.
- **Cleanup** systématique (services arrêtés par le runner ; pas de ressource persistante).
- **Temps CI acceptable** : si l'e2e est long, le déclencher sur `push main` et PR touchant l'API plutôt
  qu'à chaque PR de doc.
- **Permissions** : `contents: read` (aucun secret de prod, aucun registry).

## 5. Prérequis avant implémentation

- Scripts API **stables** (`test`, `test:e2e`, `prisma:*`, `openapi:check`) — déjà présents côté API.
- Jeu de **variables d'environnement de test** documenté (sans secret réel).
- **Images de services épinglées** (pas de `latest`).
- Stratégie de **migration en CI** (deploy sur base neuve vs reset) tranchée.
- Budget temps CI validé (parallélisation éventuelle unit vs e2e).

## 6. Hors périmètre (toujours non couvert)

Aucune image, aucun registre/GHCR (ADR-014), aucun déploiement, aucun environnement protégé, aucun rollback,
aucun monitoring. La protection de branche `main` reste une **action humaine manuelle**
(`GITHUB_BRANCH_PROTECTION_CHECKLIST.md`) à appliquer pour rendre ce workflow bloquant.

## 7. Gouvernance (Deployment 4)

Check à exiger sur `main` : **`api-runtime`** (= `name:` du job). Aucun upload d'artefact ; couverture non
publiée ; actions épinglées `@v4` (SHA = futur). Cf. `CLOUD_CORE_V1_EXECUTION_BASELINE.md` §8 bis.
