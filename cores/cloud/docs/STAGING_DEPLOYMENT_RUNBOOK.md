# Runbook — Déploiement staging manuel (Cloud Core 6)

> Procédure **manuelle**, exécutée **sur le serveur staging** (jamais en CI dans cette mission). Images
> **GHCR immuables** (jamais `latest`). **Aucun secret dans le dépôt** ; `.env.staging` est créé sur le serveur.
> Réf. : `cores/cloud/staging/`, `GHCR_REGISTRY_GUIDE.md`, `SECRETS_POLICY.md`.

## 0. Préconditions

- `main` à jour, **Registry CI verte**, **images GHCR présentes** (`api-nestjs`, `web-nextjs`) avec un tag
  **`sha-<commit>`** ou **`main-<commit>`** (vérifié : aucune image `latest`).
- Serveur staging avec **Docker + Docker Compose** ; ports `WEB_HOST_PORT`/`MINIO_HOST_PORT` ouverts au besoin.
- Accès en **lecture** au package GHCR : public → pull anonyme ; privé → `docker login ghcr.io` avec un
  jeton **read:packages** (hors dépôt).

## 1. Choisir le tag (immuable)

```bash
# Exemple daté — remplacer par le sha réel du commit à déployer :
#   GHCR_API_IMAGE=ghcr.io/<owner>/<repo>/api-nestjs:sha-bfd33dc
#   GHCR_WEB_IMAGE=ghcr.io/<owner>/<repo>/web-nextjs:sha-bfd33dc
# Règle : TOUJOURS un tag immuable (sha-* recommandé), JAMAIS latest.
```

## 2. Préparer la configuration (secrets hors dépôt)

```bash
cd cores/cloud/staging
cp .env.staging.example .env.staging         # .env.staging n'est JAMAIS committé
# Générer chaque secret : openssl rand -base64 48
# Remplir : GHCR_*_IMAGE, POSTGRES_PASSWORD, MINIO_ROOT_*, JWT_*, REFRESH_TOKEN_HASH_SECRET,
#           S3_ENDPOINT (hôte joignable par le navigateur), CORS_ORIGINS / WEB_ALLOWED_ORIGINS, APP_ENV.
```

**Cookies / TLS** : staging **HTTPS** recommandé → `APP_ENV=production` (cookies `__Host-`/Secure). Si staging
**HTTP** au départ → `APP_ENV=staging` (cookies non-Secure, sinon l'auth ne fonctionne pas sur HTTP). Non
prod-représentatif : viser HTTPS.

## 3. Démarrer les services de données

```bash
docker compose --env-file .env.staging -f docker-compose.staging.example.yml up -d postgres minio
# attendre que postgres soit "healthy"
docker compose --env-file .env.staging -f docker-compose.staging.example.yml ps
```

## 4. Créer le bucket MinIO (privé)

```bash
docker run --rm --network container:$(docker compose -f docker-compose.staging.example.yml ps -q minio) \
  --entrypoint sh minio/mc -c \
  'mc alias set s3 http://127.0.0.1:9000 "$MINIO_ROOT_USER" "$MINIO_ROOT_PASSWORD" && mc mb --ignore-existing s3/'"$S3_BUCKET"
# Bucket PRIVÉ par défaut (aucune policy publique). Les téléchargements passent par des URL SIGNÉES.
```

## 5. Migrations Prisma (étape SÉPARÉE, avant de démarrer l'API)

> ⚠️ **Correction (dry-run CC7, 2026-06-11)** : contrairement à ce qui était écrit ici, l'image runtime
> **embarque** le CLI Prisma (`node_modules/.bin/prisma` 6.19.3) **et** le `schema-engine` de la bonne
> plateforme. Le rationale « CLI absent » était **faux**. Voir
> [`STAGING_DRY_RUN_REPORT.md`](STAGING_DRY_RUN_REPORT.md) §4. **Stratégie migrations à trancher en Cloud
> Core 8** : *migrate depuis l'image* (CLI présent) **ou** *migrate depuis les sources*.

Appliquer les migrations **avant** de démarrer l'API. Deux voies (à arbitrer en CC8) :

```bash
# Voie A — depuis les SOURCES au commit déployé (même sha que le tag d'image) :
git fetch && git checkout <sha-déployé>
cd cores/api-nestjs && npm ci
DATABASE_URL="postgresql://<user>:<pwd>@<host>:5432/enistere_staging?schema=public" \
  npx prisma migrate deploy        # JAMAIS `db push` ; applique les migrations versionnées

# Voie B — depuis l'IMAGE (CLI + schema-engine présents ; À CONFIRMER sur serveur avec egress réseau) :
# docker compose --env-file .env.staging -f docker-compose.staging.example.yml \
#   run --rm api npx prisma migrate deploy
```

> Si une **sauvegarde** existe (DB non vide), faire un **backup** avant `migrate deploy` (cf. rollback).
> Ne **pas** exécuter les migrations automatiquement au démarrage du conteneur applicatif.

> ⛔ **Pré-requis BLOQUANT avant tout staging réel (dry-run CC7)** : l'image API publiée **ne démarre pas**
> en l'état — le **query engine** Prisma présent dans `.prisma/client` est compilé pour **OpenSSL 1.1.x**
> alors que la base runtime est **Debian bookworm / OpenSSL 3.0.x** → crash-loop, `/health/ready` jamais vert.
> **Corriger l'image (Cloud Core 8)** avant d'exécuter ce runbook. Détail : `STAGING_DRY_RUN_REPORT.md` §3.

## 6. Démarrer l'applicatif

```bash
docker compose --env-file .env.staging -f docker-compose.staging.example.yml up -d api web
docker compose --env-file .env.staging -f docker-compose.staging.example.yml ps
docker compose --env-file .env.staging -f docker-compose.staging.example.yml logs --tail=50 api web
```

## 7. Health checks (vérification staging)

```bash
curl -fsS http://<host>:${API_HOST_PORT}/health/live    # 200
curl -fsS http://<host>:${API_HOST_PORT}/health/ready    # 200 (DB joignable)
curl -fsS http://<host>:${WEB_HOST_PORT}/                 # 200 (accueil)
# anonyme : /protected redirige vers /login (vérifier dans un navigateur)
# Files : UNIQUEMENT si une donnée de test a été créée (aucune donnée réelle dans le dépôt) —
#   éventuellement via cores/api-nestjs/scripts/proof-seed-user.ts + un upload de test, données éphémères.
```

## 8. Données de test (optionnel, éphémère)

Aucune donnée staging réelle n'est versionnée. Pour tester Auth/Files, créer **manuellement** un utilisateur
et un fichier de test (ex. `proof-seed-user.ts`), à **supprimer** ensuite. Ne jamais committer ces données.

## Notes / limites

- **URL signée Files — décision V1 tranchée (CC7, Option A)** : son hôte = `S3_ENDPOINT` → doit être
  **joignable par le navigateur** (jamais `http://minio:9000`). **Mono-serveur** : exposer l'API MinIO (9000)
  sur l'**adresse publique du serveur** + `MINIO_HOST_PORT` et fixer `S3_ENDPOINT` à cette adresse ; le
  conteneur API atteint la même adresse (port publié, ou `extra_hosts: host.docker.internal:host-gateway`) ; la
  **console 9001 n'est PAS exposée publiquement**. **Cible (Option B)** : domaine MinIO derrière reverse proxy
  + TLS ; `S3_PUBLIC_ENDPOINT` (séparation interne/public) = **évolution d'API future** (non supportée en V1 —
  endpoint unique). Détail : [`STAGING_DRY_RUN_REPORT.md`](STAGING_DRY_RUN_REPORT.md) §5.
- **Dry-run d'abord** : valider les prérequis via un dry-run contrôlé (`docker compose config`/`pull`/`create`,
  boot des images, health) **avant** toute exécution réelle — voir [`STAGING_DRY_RUN_REPORT.md`](STAGING_DRY_RUN_REPORT.md).
- **`NEXT_PUBLIC_API_URL`** est **figé au build** de l'image Web : pour Health navigateur par environnement,
  builder l'image par env, sinon laisser vide (Health en SSR via `API_INTERNAL_URL`).
- **Pas de production, pas d'automatisation** : ce runbook est manuel et réversible. Le déploiement automatisé
  par environnement protégé = mission ultérieure.
