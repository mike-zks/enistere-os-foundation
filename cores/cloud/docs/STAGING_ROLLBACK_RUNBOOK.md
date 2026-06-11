# Runbook — Rollback staging manuel (Cloud Core 6)

> Revenir à une **image précédente** en staging. **Rollback d'IMAGE simple et fiable** ; **rollback de BASE de
> données NON garanti** → les migrations doivent rester **rétrocompatibles**. Manuel, sur le serveur staging.

## Principe

- **Images immuables** (`sha-<commit>`) → revenir à une version antérieure = repointer le tag dans
  `.env.staging` et recréer le conteneur. Rapide, déterministe.
- **La base de données ne se « rollback » pas** automatiquement : un `prisma migrate deploy` qui a appliqué une
  migration **non rétrocompatible** ne s'annule pas sans plan dédié. **Règle** : concevoir les migrations
  **backward-compatible** (additives), pour qu'une ancienne image fonctionne sur le schéma courant.

> ✅ **Pré-requis (Cloud Core 8)** : un rollback ne vaut que vers une image **qui démarre**. Le défaut de boot
> (moteur Prisma OpenSSL 1.1.x vs runtime bookworm 3.0.x) est **corrigé** (cf.
> [`STAGING_DRY_RUN_REPORT.md`](STAGING_DRY_RUN_REPORT.md) §8). **Ne revenir que vers des tags API reconstruits
> APRÈS le merge CC8** (republiés par la registry CI, gate `api-smoke`) : les tags antérieurs (`sha-7b07e5e` et
> avant) **ne démarrent pas** et ne sont **pas** des cibles de rollback valides.

## Rollback d'image (cas nominal)

```bash
cd cores/cloud/staging
# 1) Identifier le tag précédent (immuable) — ex. l'avant-dernier sha déployé :
#    GHCR_API_IMAGE=ghcr.io/<owner>/<repo>/api-nestjs:sha-<précédent>
#    GHCR_WEB_IMAGE=ghcr.io/<owner>/<repo>/web-nextjs:sha-<précédent>
# 2) Éditer .env.staging (ou un override) avec ces tags.
docker compose --env-file .env.staging -f docker-compose.staging.example.yml pull api web
docker compose --env-file .env.staging -f docker-compose.staging.example.yml up -d api web
# 3) Vérifier la santé
curl -fsS http://<host>:${API_HOST_PORT}/health/ready && curl -fsS http://<host>:${WEB_HOST_PORT}/
```

## Si une migration NON rétrocompatible a été appliquée

C'est un **incident manuel** (pas un rollback automatique) :

1. **Ne pas** repointer naïvement l'ancienne image si elle est incompatible avec le schéma courant.
2. Restaurer la **sauvegarde DB** prise **avant** la migration (cf. ci-dessous), sur une fenêtre de
   maintenance, puis redéployer l'image compatible de cette sauvegarde.
3. Documenter l'incident (cause, impact, correctif) ; renforcer la règle « migrations additives ».

## Sauvegarde / restauration DB (staging)

```bash
# Backup AVANT toute migration risquée :
docker compose -f docker-compose.staging.example.yml exec -T postgres \
  pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB" > backup-staging-<date>.sql   # stocker HORS dépôt
# Restauration (fenêtre de maintenance, API arrêtée) :
docker compose -f docker-compose.staging.example.yml stop api web
cat backup-staging-<date>.sql | docker compose -f docker-compose.staging.example.yml exec -T postgres \
  psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"
```

## Limites (assumées en V1)

- Rollback **non automatisé** (pas de bouton « rollback » ; manuel et tracé).
- Rollback DB **non garanti** → dépend de la rétrocompatibilité des migrations + d'un backup valide.
- Pas de bascule blue/green ni canary (futur, si besoin réel).
- MinIO : les objets supprimés ne sont pas restaurés par un rollback d'image (gérer la rétention/backup objet
  séparément si nécessaire).
