# Staging manuel — Cloud Core 6

> **Cadrage de déploiement staging MANUEL** à partir des images **GHCR immuables** publiées par
> `registry-ci.yml`. **Aucun déploiement réel, aucun secret, aucune production, aucun `latest`, aucune
> automatisation** ici : ce dossier fournit des **exemples** et des **runbooks** à exécuter à la main sur un
> serveur staging. Statut : **`CADRE_MANUEL_DOCUMENTE`** (pas `IMPLEMENTE_AUTOMATISE`).

## Contenu

| Fichier | Rôle |
|---|---|
| `docker-compose.staging.example.yml` | Compose **exemple** : `api` + `web` + `postgres` + `minio` (réseau interne, healthchecks, **pas de migration au démarrage**). |
| `.env.staging.example` | **Exemple** de variables (placeholders `CHANGE_ME`, **aucun secret réel**). À copier en `.env.staging` **hors dépôt**. |
| (runbooks) | [`../docs/STAGING_DEPLOYMENT_RUNBOOK.md`](../docs/STAGING_DEPLOYMENT_RUNBOOK.md) · [`../docs/STAGING_ROLLBACK_RUNBOOK.md`](../docs/STAGING_ROLLBACK_RUNBOOK.md) |

## Principes

- **Images par tag immuable** (`sha-<commit>` recommandé, ou `main-<commit>`) — **jamais `latest`**.
- **Secrets hors dépôt** : `.env.staging` n'est **jamais** committé (générer via `openssl rand -base64 48`).
- **Migrations découplées** de l'image applicative (la runtime image **n'embarque pas** le CLI Prisma) →
  étape **manuelle séparée** (voir runbook).
- **PostgreSQL non exposé** sur l'hôte ; **MinIO API joignable par le navigateur** (URLs signées).
- **Pas de `docker-compose` de production, pas de Traefik/OSRM/monitoring** ici.

## Démarrage rapide (sur le serveur staging, pas en CI)

```bash
cp .env.staging.example .env.staging       # puis remplir les CHANGE_ME (secrets hors dépôt)
# 1) services de données + bucket + migrations (voir runbook pour le détail)
docker compose --env-file .env.staging -f docker-compose.staging.example.yml up -d postgres minio
# 2) migrations (étape séparée — la runtime image n'a pas le CLI Prisma) : cf. runbook §migrations
# 3) applicatif
docker compose --env-file .env.staging -f docker-compose.staging.example.yml up -d api web
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

**Prochaine action : Cloud Core 8 — corriger l'image runtime API (moteur Prisma)** puis re-dry-run.
Statut déploiement staging : **`DRY_RUN_EXECUTE`** (défaut bloquant) — **ni** opérationnel, **ni** automatisé.
