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
