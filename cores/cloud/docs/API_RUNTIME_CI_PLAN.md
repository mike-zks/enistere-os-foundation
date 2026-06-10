# Cloud Core — Plan CI runtime API NestJS (niveau 2, futur)

> **Plan, non implémenté.** Décrit la prochaine CI possible pour rejouer l'API Core NestJS avec ses
> dépendances persistantes en CI. **Aucun workflow n'est créé dans cette mission.** Aligné sur
> `CLOUD_CORE_V1_EXECUTION_BASELINE.md` §12 et ADR-013.

## 1. Objectif

Rejouer **en CI** ce qui n'est aujourd'hui prouvé que **localement** : migrations Prisma, tests unitaires +
e2e de l'API, cohérence du contrat OpenAPI — contre un **PostgreSQL** et un **MinIO** éphémères, **sans
secret réel** ni déploiement.

## 2. Forme envisagée (indicative, non créée)

- Job dédié (ex. `api-runtime`) **séparé** de la CI minimale (ou workflow distinct déclenché sur les chemins
  `cores/api-nestjs/**`), pour ne pas alourdir la non-régression niveau 1.
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

## 6. Hors périmètre (cette mission)

Aucun workflow runtime, aucun service PostgreSQL/MinIO en CI, aucune image, aucun déploiement. Ce plan sera
implémenté au **niveau 2** une fois la protection de branche (niveau 1 gouverné) appliquée.
