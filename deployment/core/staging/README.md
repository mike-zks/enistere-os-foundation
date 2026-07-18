# Staging serveur — Cloud Core

> Staging serveur gouverne à partir des images **GHCR immuables** publiées par `registry-ci.yml`.
> CC10 a livré le staging HTTPS réel ; CC11 a validé le socle opérationnel. Aucun secret réel n'est versionné.

## Contenu

| Fichier | Rôle |
|---|---|
| `docker-compose.cc10.yml` | Compose serveur/staging V1 officiel : reverse proxy compatible Traefik, HTTPS, aucun port applicatif hôte, PostgreSQL interne, MinIO API routee. |
| `docker-compose.staging.example.yml` | Compose **exemple historique** : utile pour lecture ou dry-run, non retenu comme compose V1 officiel. |
| `.env.staging.example` | Exemple de variables (placeholders `CHANGE_ME`, **aucun secret réel**). À copier en `.env.staging` **hors dépôt**. |
| (runbooks) | [`../docs/STAGING_DEPLOYMENT_RUNBOOK.md`](../docs/STAGING_DEPLOYMENT_RUNBOOK.md) · [`../docs/STAGING_ROLLBACK_RUNBOOK.md`](../docs/STAGING_ROLLBACK_RUNBOOK.md) |

## Principes

- **Images par tag immuable** (`sha-<commit>` recommandé, ou `main-<commit>`) — **jamais `latest`**.
- **Secrets hors dépôt** : `.env.staging` n'est **jamais** committé (générer via `openssl rand -base64 48`).
- **Migrations séparées du démarrage applicatif** : les images corrigées embarquent le nécessaire Prisma ;
  lancer `npx prisma migrate deploy` comme étape explicite avant l'applicatif.
- **PostgreSQL non exposé** sur l'hôte ; **MinIO API joignable par le navigateur** (URLs signées).
- **Redis est reporté post-V1/V2** ; aucun service Redis n'est requis pour ce staging V1.
- **Pas de production, OSRM/PostGIS, monitoring ou déploiement automatique** ici.

## Démarrage rapide (sur le serveur staging, pas en CI)

```bash
cp .env.staging.example .env.staging       # puis remplir les CHANGE_ME (secrets hors dépôt)
# 1) services de données + bucket + migrations (voir runbook pour le détail)
docker compose --env-file .env.staging -f docker-compose.cc10.yml up -d postgres minio
# 2) migrations (étape séparée) : cf. runbook §migrations
# 3) applicatif
docker compose --env-file .env.staging -f docker-compose.cc10.yml up -d api web
```

Détail complet, ordre exact, health checks, bucket MinIO, rollback : **runbooks** (`../docs/`).

## Dry-run contrôlé (Cloud Core 7, 2026-06-11)

Un **dry-run local réel** a été exécuté à partir des **images GHCR immuables** (`sha-7b07e5e`) avec un
`.env.staging` **réel généré hors dépôt** (secrets jetables, supprimé après). Résultats (détail :
[`../docs/STAGING_DRY_RUN_REPORT.md`](../docs/STAGING_DRY_RUN_REPORT.md)) :

- ✅ `docker compose config` valide (tag immuable, **aucun `latest`**) ; ✅ images **tirées en anonyme**
  (registry public) ; ✅ `postgres healthy` + `minio Up` + bucket créé ; ✅ **image Web démarre** (HTTP 200).
- ❌ **Défaut BLOQUANT** : l'**image API ne démarre pas** (crash-loop) — le **query engine** Prisma de
  `.prisma/client` est compilé pour **OpenSSL 1.1.x** alors que la base runtime est **Debian bookworm /
  OpenSSL 3.0.x**. CI aveugle (runtime de l'image jamais exécuté). → **exécution staging réelle BLOQUÉE**.
- ⚠️ Le runbook disait « image sans CLI Prisma » : **faux** (CLI + schema-engine présents) → stratégie
  migrations à rouvrir.
- 🔑 **Secrets hors dépôt** : emplacement recommandé serveur `/opt/enistere/staging/.env.staging`
  (`chmod 600`, **jamais** committé). Décision **MinIO/URL signée** tranchée (Option A) : `S3_ENDPOINT` =
  adresse **publique** du serveur (jamais `minio:9000`).

## Staging HTTPS réel (Cloud Core 10)

CC10 a validé `docker-compose.cc10.yml` sur staging HTTPS réel :

- reverse proxy compatible Traefik + Let's Encrypt ;
- 4 conteneurs healthy ;
- auth BFF, session, autorisations, upload MinIO, URL signée et téléchargement validés ;
- aucun secret dans le dépôt.

Rapport : [`../docs/CC10_STAGING_DEPLOYMENT_REPORT.md`](../docs/CC10_STAGING_DEPLOYMENT_REPORT.md).

## Socle opérationnel (Cloud Core 11)

CC11 a validé health HTTPS, backup/restore PostgreSQL, backup/restore MinIO, rollback/roll-forward image et
rotation du compte smoke. Rapport :
[`../docs/CC11_STAGING_OPERATIONAL_REPORT.md`](../docs/CC11_STAGING_OPERATIONAL_REPORT.md).
