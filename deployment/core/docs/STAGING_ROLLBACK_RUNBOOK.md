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
cd deployment/core/staging
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

---

## Annexe CC11 — Rollback validé en staging réel HTTPS (2026-07-11)

### Contexte CC10/CC11

CC10 a déployé le staging Enistere avec HTTPS via reverse proxy. Le runbook original
utilisait des ports hôtes ; les commandes CC10/CC11 utilisent le compose `docker-compose.yml`
(pas `docker-compose.staging.example.yml`) et le réseau proxy interne (aucun port hôte
pour api/web).

### Tag de rollback validé

| Tag | Commit | Validé |
|-----|--------|--------|
| `sha-5bf4c0f` | CC10 — déploiement HTTPS réel | ✅ current |
| `sha-484f98d` | fix(mobile): verify starter visual smoke | ✅ rollback testé CC11 |

> ⚠️ **Ne pas revenir à des tags antérieurs à `sha-d1e6242`** (post-CC8) — moteur Prisma
> OpenSSL incompatible, les images antérieures ne démarrent pas.

### Procédure CC10/CC11 (serveur staging Enistere)

```bash
cd /home/deploy/enistere-staging

# 1. Backup préventif
bash <repo>/deployment/core/staging/scripts/backup-postgres.sh \
  /home/deploy/enistere-staging/.env.staging /home/deploy/backups

# 2. Sauvegarder env courant
cp .env.staging .env.staging.backup

# 3. Modifier les tags (GHCR_API_IMAGE et GHCR_WEB_IMAGE)
sed -i "s/sha-<COURANT>/sha-<ROLLBACK>/g" .env.staging
grep "GHCR_" .env.staging

# 4. Redéployer
docker compose --env-file .env.staging -f docker-compose.yml pull api web
docker compose --env-file .env.staging -f docker-compose.yml up -d api web

# 5. Vérifier via Traefik (HTTPS, pas de port hôte)
sleep 15
curl -sf https://staging.enistere.com/ -o /dev/null -w "web: %{http_code}\n"
curl -sf https://staging.enistere.com/status -o /dev/null -w "status: %{http_code}\n"
docker compose --env-file .env.staging -f docker-compose.yml ps
```

### Backup/restore CC11

Utiliser les scripts versionnés :
- `deployment/core/staging/scripts/backup-postgres.sh` — backup pg_dump gzip horodaté
- Restore test : voir `CC11_OPERATIONAL_RUNBOOK.md` §3
- Backup MinIO : `deployment/core/staging/scripts/backup-minio.sh`
