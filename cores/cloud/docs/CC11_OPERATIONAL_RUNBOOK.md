# Runbook opérationnel staging (Cloud Core 11)

> Gouvernance du staging CC10 : vérification santé, backup, restore, rollback,
> rotation compte smoke. **Aucun secret dans ce document.** Exécuté le **2026-07-11**.
>
> Pré-requis : accès SSH `deploy` au serveur staging Enistere, staging CC10 en cours d'exécution,
> `.env.staging` hors dépôt (`chmod 600`).

---

## 1. Vérification de santé HTTPS

### 1.1 Endpoints externes (DNS/CDN → reverse proxy)

```bash
# Web Next.js
curl -sf https://staging.enistere.com/ -o /dev/null -w "web/: %{http_code}\n"
curl -sf https://staging.enistere.com/status -o /dev/null -w "web/status: %{http_code}\n"

# MinIO S3
curl -sf https://s3-staging.enistere.com/minio/health/live -o /dev/null \
  -w "s3/health/live: %{http_code}\n"
```

**Résultat attendu :** `200` sur chaque ligne.

### 1.2 Santé API interne (via docker exec)

L'API n'est pas exposée directement — elle n'est joignable que depuis le réseau interne ou
via docker exec :

```bash
docker exec enistere-staging-api-1 node -e \
  "require('http').get('http://127.0.0.1:3000/health/live',r=>
    {let d='';r.on('data',c=>d+=c);r.on('end',()=>console.log('live',r.statusCode,d))})
   .on('error',()=>process.exit(1))"

docker exec enistere-staging-api-1 node -e \
  "require('http').get('http://127.0.0.1:3000/health/ready',r=>
    {let d='';r.on('data',c=>d+=c);r.on('end',()=>console.log('ready',r.statusCode,d))})
   .on('error',()=>process.exit(1))"
```

**Résultat attendu :** `200` + `{"status":"live"}` / `{"status":"ready","checks":{"database":"up"}}`.

### 1.3 TLS (certificat Let's Encrypt)

```bash
openssl s_client -connect staging.enistere.com:443 \
  -servername staging.enistere.com </dev/null 2>&1 \
  | grep -E "issuer|subject|notAfter|Verify return"
```

**Résultat attendu :** `issuer=C = US, O = Let's Encrypt`, `Verify return code: 0 (ok)`.

### 1.4 Conteneurs Docker

```bash
cd /home/deploy/enistere-staging
docker compose --env-file .env.staging -f docker-compose.yml ps \
  --format "table {{.Service}}\t{{.Image}}\t{{.Status}}"
```

**Résultat attendu :** `api`, `web`, `postgres` = `(healthy)` ; `minio` = `Up`.

### 1.5 Logs ciblés (dernier démarrage)

```bash
docker compose --env-file .env.staging -f docker-compose.yml logs --tail=20 api
docker compose --env-file .env.staging -f docker-compose.yml logs --tail=10 web
```

---

## 2. Backup PostgreSQL

### 2.1 Exécuter le backup

```bash
bash cores/cloud/staging/scripts/backup-postgres.sh \
  /home/deploy/enistere-staging/.env.staging \
  /home/deploy/backups
```

Le script :
- lit `POSTGRES_USER` et `POSTGRES_DB` depuis `.env.staging` (pas de credential en argument)
- appelle `pg_dump` via `docker exec enistere-staging-postgres-1`
- compresse en `.sql.gz` horodaté (`staging-pg-YYYYMMDDTHHmmss.sql.gz`)
- fixe les permissions `600` sur le fichier résultant

**Destination recommandée :** hors dépôt, hors répertoire staging ; accès restreint.

### 2.2 Vérification rapide

```bash
ls -lh /home/deploy/backups/staging-pg-*.sql.gz | tail -3
zcat /home/deploy/backups/staging-pg-<TIMESTAMP>.sql.gz | grep "CREATE TABLE" | head -5
```

### 2.3 Fréquence recommandée

- Avant toute `prisma migrate deploy`
- Avant tout rollback d'image
- Hebdomadaire en exploitation normale (cron ou manuelle)

---

## 3. Restore PostgreSQL

> ⚠️ **Ne jamais restaurer directement sur `enistere_staging`** sans fenêtre de maintenance et
> arrêt de l'API. Tester d'abord sur une base temporaire.

### 3.1 Test de restauration (base temporaire)

```bash
# Créer une base temporaire
docker exec enistere-staging-postgres-1 \
  psql -U "$POSTGRES_USER" -d enistere_staging -c "CREATE DATABASE enistere_staging_restore;"

# Restaurer
zcat /home/deploy/backups/staging-pg-<TIMESTAMP>.sql.gz | \
  docker exec -i enistere-staging-postgres-1 \
  psql -U "$POSTGRES_USER" -d enistere_staging_restore -q

# Vérifier les comptages
docker exec enistere-staging-postgres-1 \
  psql -U "$POSTGRES_USER" -d enistere_staging_restore \
  -c "SELECT schemaname, relname, n_live_tup FROM pg_stat_user_tables ORDER BY relname;"

# Nettoyer
docker exec enistere-staging-postgres-1 \
  psql -U "$POSTGRES_USER" -d enistere_staging -c "DROP DATABASE enistere_staging_restore;"
```

### 3.2 Restauration en production staging (fenêtre de maintenance)

```bash
# 1. Backup préventif
bash cores/cloud/staging/scripts/backup-postgres.sh ...

# 2. Arrêter api et web
docker compose --env-file .env.staging -f docker-compose.yml stop api web

# 3. Restaurer
zcat /home/deploy/backups/staging-pg-<TIMESTAMP>.sql.gz | \
  docker exec -i enistere-staging-postgres-1 \
  psql -U "$POSTGRES_USER" -d enistere_staging -q

# 4. Redémarrer
docker compose --env-file .env.staging -f docker-compose.yml up -d api web
```

---

## 4. Backup MinIO

### 4.1 Exécuter le backup

```bash
bash cores/cloud/staging/scripts/backup-minio.sh \
  /home/deploy/enistere-staging/.env.staging \
  /home/deploy/backups/minio
```

Le script utilise `minio/mc mirror` via un conteneur éphémère sur le réseau
`enistere-staging_staging-internal`. Les credentials ne sont jamais passés en argument CLI.

### 4.2 Vérification

```bash
find /home/deploy/backups/minio -type f | sort
```

### 4.3 Limites

- Le backup copie les objets actuels du bucket. Les objets supprimés avant le backup ne sont
  pas inclus — il n'y a pas de versioning MinIO en V1.
- La console MinIO (9001) n'est pas exposée publiquement ; accès via SSH tunnel si nécessaire.

---

## 5. Restore MinIO (objet unique)

```bash
ENV_FILE=/home/deploy/enistere-staging/.env.staging
BACKUP_DIR=/home/deploy/backups/minio
NETWORK=enistere-staging_staging-internal

MINIO_USER=$(grep "^MINIO_ROOT_USER=" "$ENV_FILE" | cut -d= -f2-)
MINIO_PASS=$(grep "^MINIO_ROOT_PASSWORD=" "$ENV_FILE" | cut -d= -f2-)
S3_BUCKET=$(grep "^S3_BUCKET=" "$ENV_FILE" | cut -d= -f2-)

# Restaurer un objet spécifique (chemin relatif à $BACKUP_DIR)
RELATIVE_PATH="production/image/2026/07/mon-fichier.png"  # adapter

docker run --rm \
  --network "$NETWORK" \
  -v "${BACKUP_DIR}:/minio-backup" \
  -e "MC_HOST_s3=http://${MINIO_USER}:${MINIO_PASS}@minio:9000" \
  minio/mc cp "/minio-backup/${RELATIVE_PATH}" "s3/${S3_BUCKET}/${RELATIVE_PATH}"
```

Pour une restauration complète du bucket :

```bash
docker run --rm \
  --network "$NETWORK" \
  -v "${BACKUP_DIR}:/minio-backup" \
  -e "MC_HOST_s3=http://${MINIO_USER}:${MINIO_PASS}@minio:9000" \
  minio/mc mirror --overwrite /minio-backup "s3/${S3_BUCKET}"
```

---

## 6. Rollback d'image

### 6.1 Principe

Images immuables (`sha-<commit>`) → rollback = modifier le tag dans `.env.staging` et
redémarrer `api` et `web`. La base de données n'est **pas** rollbackée automatiquement
(voir §3 pour le restore DB si nécessaire).

> **Règle** : ne revenir qu'à un tag **≥ sha-d1e6242** (post-CC8, moteur Prisma `debian-openssl-3.0.x`
> correct). Les tags antérieurs ne démarrent pas.

### 6.2 Procédure

```bash
cd /home/deploy/enistere-staging

# 1. Sauvegarder l'env courant
cp .env.staging .env.staging.backup

# 2. Identifier le tag de rollback (voir git log --oneline --merges sur le dépôt)
#    Exemple : SHA_ROLLBACK=sha-484f98d

# 3. Mettre à jour le tag (jamais latest)
sed -i "s/sha-<COURANT>/sha-<ROLLBACK>/g" .env.staging
grep "GHCR_" .env.staging   # vérifier visuellement

# 4. Redéployer (pull + recreate)
docker compose --env-file .env.staging -f docker-compose.yml pull api web
docker compose --env-file .env.staging -f docker-compose.yml up -d api web

# 5. Vérifier la santé
sleep 15
curl -sf https://staging.enistere.com/ -o /dev/null -w "web: %{http_code}\n"
curl -sf https://staging.enistere.com/status -o /dev/null -w "status: %{http_code}\n"
docker compose --env-file .env.staging -f docker-compose.yml ps
```

### 6.3 Roll-forward (retour au tag courant)

```bash
cp .env.staging.backup .env.staging
docker compose --env-file .env.staging -f docker-compose.yml up -d api web
sleep 15
curl -sf https://staging.enistere.com/ -o /dev/null -w "web: %{http_code}\n"
```

### 6.4 Si une migration non rétrocompatible a été appliquée

1. Ne pas revenir naïvement à l'image ancienne (schéma incompatible).
2. Restaurer le backup DB pré-migration (§3.2) + redéployer l'image compatible.
3. Documenter l'incident.

---

## 7. Rotation du compte smoke

Après validation CC10/smoke, le mot de passe du compte de test staging est à tourner :

```bash
bash cores/cloud/staging/scripts/rotate-smoke-account.sh \
  /home/deploy/enistere-staging/.env.staging \
  <smoke-account-email>
```

Le script génère un nouveau mot de passe aléatoire (`crypto.randomBytes(32).toString('base64url')`),
le hache en argon2id avec les paramètres du `.env.staging`, met à jour la DB, et **ne conserve
pas** la valeur en clair. Le compte reste présent pour de futurs smoke tests ; il suffit de
relancer le script de seed `seed.js` avec un mot de passe connu si un nouveau smoke est nécessaire.

> **Alternative :** désactiver le compte (`status: 'INACTIVE'`) plutôt que de le conserver actif.

---

## 8. Checklist post-déploiement

À exécuter après chaque déploiement ou rollback :

- [ ] `docker compose ps` : tous les conteneurs `(healthy)` ou `Up`
- [ ] `curl https://staging.enistere.com/` = 200
- [ ] `curl https://staging.enistere.com/status` = 200
- [ ] `curl https://s3-staging.enistere.com/minio/health/live` = 200
- [ ] API `health/ready` interne = 200 + `database: up` (docker exec node)
- [ ] TLS : `openssl s_client` → `Verify return code: 0`
- [ ] Logs API : aucune erreur de démarrage (`docker compose logs --tail=20 api`)
- [ ] Backup PostgreSQL effectué avant le déploiement
- [ ] Tag immuable (`sha-*`) confirmé dans `.env.staging` (aucun `latest`)
