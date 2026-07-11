# CC11 — Rapport de durcissement opérationnel staging

> **Cloud Core 11** | Environnement : `37.27.31.5` | Date : 2026-07-11
>
> **Contrainte sécurité :** aucun secret, token, credential, DATABASE_URL, cookie ou contenu
> fichier dans ce document.

---

## Résumé exécutif

Le staging CC10 (HTTPS Traefik v3 + Let's Encrypt, images GHCR `sha-5bf4c0f`) a été
opérationnalisé selon les 5 axes définis en CC11 :

| Axe | Statut | Preuve |
|-----|--------|--------|
| 1. Santé HTTPS | ✅ Vérifié | §1 — 3 endpoints 200, TLS Let's Encrypt OK |
| 2. Backup + restore PostgreSQL | ✅ Vérifié | §2 — 4.7 Ko gzip, restore validé (comptages lignes) |
| 3. Backup + restore MinIO | ✅ Vérifié | §3 — 1 fichier 67 B, restore test PASSED, nettoyé |
| 4. Rollback image | ✅ Vérifié | §4 — `sha-484f98d` déployé healthy, roll-forward `sha-5bf4c0f` |
| 5. Rotation compte smoke | ✅ Vérifié | §5 — argon2id regénéré, valeur non conservée |

Le staging reste HTTPS fonctionnel au terme de CC11.

---

## 1. Vérification de santé HTTPS

### 1.1 Endpoints externes

Vérifiés depuis une machine extérieure (requêtes Cloudflare → Traefik → conteneurs internes) :

| Endpoint | Code HTTP |
|----------|-----------|
| `https://staging.enistere.com/` | 200 |
| `https://staging.enistere.com/status` | 200 |
| `https://s3-staging.enistere.com/minio/health/live` | 200 |

### 1.2 Santé API interne (docker exec)

```
live  200 {"status":"live"}
ready 200 {"status":"ready","checks":{"database":"up"}}
```

Exécuté via `docker exec enistere-staging-api-1 node -e ...` (API sans port public exposé).

### 1.3 TLS Let's Encrypt

```
issuer=C = US, O = Let's Encrypt, CN = R11
subject=CN = staging.enistere.com
notAfter=<date future >90j>
Verify return code: 0 (ok)
```

### 1.4 Statut conteneurs

```
Service    Image                           Status
postgres   postgres:16                     Up (healthy)
minio      minio/minio                     Up
api        ghcr.io/...api:sha-5bf4c0f      Up (healthy)
web        ghcr.io/...web:sha-5bf4c0f      Up (healthy)
```

---

## 2. Backup + restore PostgreSQL

### 2.1 Script

`cores/cloud/staging/scripts/backup-postgres.sh` — lit `POSTGRES_USER` / `POSTGRES_DB` depuis
`.env.staging`, appelle `pg_dump` via `docker exec`, compresse en `.sql.gz` horodaté, pose
`chmod 600`. Aucun credential en argument CLI ou en log.

### 2.2 Résultat backup CC11

```
Backup OK: /home/deploy/backups/staging-pg-20260711T<HHMM>.sql.gz (4.7K)
```

Fichier hors dépôt, permissions `600`.

### 2.3 Restore test (base temporaire)

1. `CREATE DATABASE enistere_staging_restore` — sur `enistere_staging` pour éviter l'erreur
   de DB manquante (`psql -d enistere_staging -c "CREATE DATABASE ..."`)
2. `zcat … | psql -U … -d enistere_staging_restore` — restauration complète sans erreur
3. Comptages `pg_stat_user_tables` — correspondance ligne-à-ligne avec la base source :

| Table | Lignes source | Lignes restaurées |
|-------|---------------|-------------------|
| Permission | 12 | 12 |
| Role | 2 | 2 |
| User | 1 | 1 |
| RolePermission | 12 | 12 |
| UserRole | 1 | 1 |

4. `DROP DATABASE enistere_staging_restore` — base temporaire supprimée

**Conclusion :** restore validé, base originale non modifiée.

---

## 3. Backup + restore MinIO

### 3.1 Script

`cores/cloud/staging/scripts/backup-minio.sh` — utilise `minio/mc mirror` via conteneur
éphémère connecté au réseau `enistere-staging_staging-internal`. Credentials passés via variable
d'environnement `MC_HOST_s3`, jamais en argument CLI.

### 3.2 Résultat backup CC11

```
Backup OK: /home/deploy/backups/minio (1 fichiers)
```

Objet sauvegardé : 1 fichier image de 67 octets déposé lors du smoke CC10.

### 3.3 Restore test

Objet copié vers le préfixe `restore-test/` du bucket via `minio/mc cp` :

```
...restore-test/<objet>  67 B  ← succès
```

Objet de test supprimé après vérification (`minio/mc rm`). Bucket en état original.

**Conclusion :** restore objet validé ; la méthode scale à un restore complet (`mc mirror`).

### 3.4 Limites

- Pas de versioning : seul l'état courant du bucket est capturé.
- La console MinIO (port 9001) n'est pas exposée ; accès via SSH tunnel si nécessaire.

---

## 4. Rollback d'image

### 4.1 Image cible de rollback

`sha-484f98d` (PR #46, `fix(mobile): verify starter visual smoke`) — image immédiatement
antérieure au déploiement CC10 `sha-5bf4c0f`. Vérifiée compatible Prisma
(`debian-openssl-3.0.x`).

### 4.2 Procédure exécutée

```
# Sauvegarde env
cp .env.staging .env.staging.backup

# Modification tag
sed -i "s/sha-5bf4c0f/sha-484f98d/g" .env.staging

# Pull + recreate
docker compose pull api web
docker compose up -d api web

# Santé après rollback
web: 200
status: 200
api (healthy), web (healthy)
```

### 4.3 Roll-forward

```
cp .env.staging.backup .env.staging
docker compose up -d api web

# Santé après roll-forward
web: 200
status: 200
api (healthy), web (healthy)  ← sha-5bf4c0f
```

**Conclusion :** rollback `sha-484f98d` validé healthy ; roll-forward `sha-5bf4c0f` validé
healthy. Staging revenu à l'état CC10 nominal.

### 4.4 Contrainte DB

Le rollback image ne rollback **pas** la base de données. Si une migration non rétrocompatible
a été appliquée avant le rollback, un restore DB (§2) est nécessaire en parallèle.

---

## 5. Rotation compte smoke

### 5.1 Contexte

Compte `admin@enistere-staging.local` créé lors du seed CC10 (rôle `administrator`). Utilisé
pour la validation end-to-end. Après la validation, le mot de passe est tourné pour que la
valeur smoke ne reste pas valide indéfiniment.

### 5.2 Script

`cores/cloud/staging/scripts/rotate-smoke-account.sh` — génère `crypto.randomBytes(32).toString('base64url')`, hache en `argon2id` avec les paramètres du `.env.staging`, met à jour
`user.passwordHash` via Prisma. Valeur en clair **non conservée** (aucun log, aucune variable
shell persistante, `docker compose run --rm`).

### 5.3 Résultat

```
Rotation OK — nouveau mot de passe généré et écarté.
Compte admin@enistere-staging.local : mot de passe tourné (valeur non conservée).
```

Le compte existe en DB avec un hash valide inconnu. Pour un futur smoke test, relancer
`seed.js` avec un mot de passe connu (ou utiliser `rotate-smoke-account.sh` et récupérer
la valeur en clair temporairement via une modification du script).

---

## 6. Livrables CC11

| Fichier | Type | Description |
|---------|------|-------------|
| `cores/cloud/staging/scripts/backup-postgres.sh` | Script | Backup pg_dump → .sql.gz horodaté |
| `cores/cloud/staging/scripts/backup-minio.sh` | Script | Backup minio/mc mirror |
| `cores/cloud/staging/scripts/rotate-smoke-account.sh` | Script | Rotation argon2id, valeur non conservée |
| `cores/cloud/docs/CC11_OPERATIONAL_RUNBOOK.md` | Runbook | Procédures opérationnelles complètes |
| `cores/cloud/docs/CC11_STAGING_OPERATIONAL_REPORT.md` | Rapport | Ce document — preuves d'exécution |

---

## 7. Limites et prochaines actions

**Limites CC11 :**

- Monitoring externe minimal (curl ponctuel) — aucun alerting automatisé.
- Backup non automatisé (cron non configuré) — procédure manuelle documentée.
- Restore DB complet non testé en condition de maintenance (API arrêtée) — protocole documenté §3.2 du runbook.
- Versioning MinIO absent — perte possible d'objets supprimés entre deux backups.

**Prochaine action recommandée :**

> **RN31** — iOS smoke parity : CI macOS, provisioning, XCTest runner.
> Bloqueur actuel : iOS smoke non exécutable sur Linux (simulateur macOS requis).
> Voir `docs/project-status/NEXT_ACTIONS.md`.
