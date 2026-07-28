# Rapport — Staging HTTPS réel (Deployment 10)

> **RAPPORT D'EXÉCUTION — daté du 2026-07-18.**
> Trace d'une exécution réelle, conservée comme preuve et référencée par le
> processus de release. Ce n'est ni une spécification ni une description de
> l'état courant.

> **Déploiement staging réel sur serveur Enistere** avec Docker Compose, images GHCR
> immuables (`sha-5bf4c0f`), HTTPS via reverse proxy compatible Traefik + Let's Encrypt, DNS/CDN.
> **Aucun secret dans ce document.** Exécuté le **2026-07-07 → 2026-07-10**.

## 1. Environnement

| Paramètre | Valeur |
|---|---|
| Type | **Serveur staging Enistere** |
| OS | Linux (Debian/Ubuntu), Docker installé |
| Reverse proxy | Compatible Traefik, écoute ports 80 / 443, réseau Docker `web` provisionné |
| TLS | Let's Encrypt HTTP-01, resolver `le`, via DNS/CDN |
| Images | `ghcr.io/mike-zks/enistere-os-foundation/{api-nestjs,web-nextjs}:sha-5bf4c0f` |
| `latest` | **non utilisé** — tag immuable `sha-5bf4c0f` uniquement |
| Dossier serveur | `/home/deploy/enistere-staging/` (hors dépôt — utilisateur `deploy`) |
| `.env.staging` | Hors dépôt, `chmod 600`, secrets générés avec `openssl rand -base64 48` |
| PostgreSQL | **Non exposé** — réseau interne `staging-internal` uniquement |
| MinIO console (9001) | **Non exposée** — accès admin via SSH tunnel uniquement |

## 2. Architecture réseau

```
Internet
  ↓ HTTPS (443)
DNS/CDN
  ↓ HTTP/HTTPS
Serveur staging Enistere
  ↓ ports 80/443
Reverse proxy Traefik-compatible (réseau Docker "web")
  ├─ staging.enistere.com  → web-nextjs:3000
  └─ s3-staging.enistere.com → minio:9000

Réseau interne (staging-internal) — non publié :
  web-nextjs  → api-nestjs:3000 (API_INTERNAL_URL=http://api:3000)
  api-nestjs  → postgres:5432
  api-nestjs  → s3-staging.enistere.com (via extra_hosts: host-gateway → Traefik)
```

**`extra_hosts: s3-staging.enistere.com:host-gateway`** : l'API résout `s3-staging.enistere.com`
vers `172.17.0.1` (gateway Docker) → Traefik local → MinIO. Les URLs pré-signées S3 générées
par l'API (`https://s3-staging.enistere.com/...`) sont navigables par le navigateur via
DNS/CDN → reverse proxy → MinIO. Aucun passage par le CDN depuis le conteneur API.

## 3. Labels Traefik (docker-compose.cc10.yml)

**MinIO (s3-staging.enistere.com → port 9000) :**
```yaml
traefik.enable=true
traefik.docker.network=web
traefik.http.routers.enistere-minio.rule=Host(`s3-staging.enistere.com`)
traefik.http.routers.enistere-minio.entrypoints=websecure
traefik.http.routers.enistere-minio.tls.certresolver=le
traefik.http.services.enistere-minio.loadbalancer.server.port=9000
```

**Web Next.js (staging.enistere.com → port 3000) :**
```yaml
traefik.enable=true
traefik.docker.network=web
traefik.http.routers.enistere-staging.rule=Host(`staging.enistere.com`)
traefik.http.routers.enistere-staging.entrypoints=websecure
traefik.http.routers.enistere-staging.tls.certresolver=le
traefik.http.services.enistere-staging.loadbalancer.server.port=3000
```

## 4. Étapes d'exécution

| # | Étape | Résultat |
|---|---|---|
| §1 | Vérification DNS (`staging.enistere.com`, `s3-staging.enistere.com`) | ✅ DNS/CDN actif, Let's Encrypt HTTP-01 fonctionnel |
| §2 | SSH utilisateur `deploy` | ✅ Accessible, utilisateur non-root |
| §3 | Reverse proxy compatible Traefik, ports 80/443 ouverts, réseau `web` provisionné | ✅ Confirmé pour le périmètre staging Enistere |
| §4 | Répertoire `/home/deploy/enistere-staging/` | ✅ Créé (pas de sudo nécessaire) |
| §5 | `docker-compose.yml` déposé (copie de `docker-compose.cc10.yml`) | ✅ |
| §6 | `.env.staging` généré (secrets `openssl rand`, `chmod 600`) | ✅ Hors dépôt, non loggué |
| §7 | `docker compose up -d postgres minio` | ✅ `postgres healthy`, `minio Up` |
| §8 | Bucket MinIO `enistere-staging-files` créé (privé) | ✅ Via `docker compose run --rm` mc alias |
| §9 | Migrations Prisma (`docker compose run --rm api npx prisma migrate deploy`) | ✅ 5 migrations appliquées |
| §10 | `docker compose up -d api` | ✅ `api healthy` (`/health/ready` = 200) |
| §11 | `docker compose up -d web` | ✅ `web healthy` |
| §12 | `GET https://staging.enistere.com/` | ✅ **200** (TLS valide, Let's Encrypt) |
| §13 | `GET https://staging.enistere.com/login` | ✅ **200** (page connexion) |
| §14 | `GET https://s3-staging.enistere.com/minio/health/live` | ✅ **200** (TLS valide) |
| §15 | `GET https://staging.enistere.com/protected` (anonyme) | ✅ **200** (App Router streaming redirect → `/login?returnTo=%2Fprotected`) |
| §16 | Seed RBAC structurel (12 permissions + rôles `administrator`/`user`) | ✅ Via `docker compose run --rm -v seed.js:/app/seed.js api node /app/seed.js` (JS pur — `ts-node` absent en prod) |
| §17 | Création utilisateur test + rôle `administrator` | ✅ Upsert idempotent dans le seed (argon2id, params env) ; identifiant et mot de passe non documentés |
| §18 | `GET /api/auth/csrf` → `POST /api/auth/login` (BFF) | ✅ **200** — `authenticated:true`, cookies `__Host-` posés |
| §19 | `GET /api/auth/me` (session) | ✅ **200** — profil retourné (email, id, status ACTIVE) |
| §20 | `GET /api/auth/authorization` (RBAC) | ✅ **200** — `roles:["administrator"]`, 12 permissions confirmées |
| §21 | `POST /api/files/upload` — upload PNG 1×1 | ✅ **200** — fichier `VALIDATED`, `id:21fdf3a3-...`, MinIO stocke dans `production/image/2026/07/` |
| §22 | `POST /api/files/:id/download-url` — URL pré-signée | ✅ **200** — `https://s3-staging.enistere.com/enistere-staging-files/...` (TTL 300s, HMAC-SHA256) |
| §23 | Téléchargement via URL pré-signée | ✅ **200** — 67 octets reçus (PNG identique à l'original) — DNS/CDN → reverse proxy → MinIO |

> **Note §15 (App Router redirect) :** Comportement attendu. Next.js App Router retourne HTTP 200
> avec RSC `NEXT_REDIRECT` + `<meta http-equiv=refresh>` (navigation SPA) au lieu d'un 302 HTTP.
> Documenté en CC9 §14. Le navigateur honore la redirection ; `curl` ne la suit pas.

> **Note §16 (seed JS pur) :** `npx prisma db seed` échoue en prod (pas de `ts-node`). Solution :
> script JS pur (`seed.js`) monté en volume (`-v`) dans le conteneur, exécuté depuis `/app/` (workdir
> contenant `node_modules`). `@node-rs/argon2` disponible (dépendance de prod). Idempotent.

## 5. Conteneurs en production (état final)

```
enistere-staging-postgres-1  postgres:16                                          Up (healthy)
enistere-staging-minio-1     minio/minio                                          Up
enistere-staging-api-1       ghcr.io/mike-zks/enistere-os-foundation/api-nestjs:sha-5bf4c0f  Up (healthy)
enistere-staging-web-1       ghcr.io/mike-zks/enistere-os-foundation/web-nextjs:sha-5bf4c0f  Up (healthy)
```

## 6. Validation end-to-end (résumé)

| Flux | Résultat |
|---|---|
| Auth : CSRF → login BFF | ✅ 200 — `authenticated:true`, cookies `__Host-` |
| Session : `GET /me` | ✅ 200 — profil retourné |
| RBAC : `GET /authorization` | ✅ 200 — `administrator`, 12 permissions |
| Upload : `POST /api/files/upload` (PNG, FormData) | ✅ 200 — `VALIDATED`, stocké dans MinIO (`production/image/...`) |
| URL signée : `POST /api/files/:id/download-url` | ✅ 200 — `https://s3-staging.enistere.com/...` (TTL 300s) |
| Téléchargement via URL signée | ✅ 200 — 67 octets (PNG original) via DNS/CDN → reverse proxy → MinIO |

## 7. Fichiers repo ajoutés / modifiés (CC10)

| Fichier | Action |
|---|---|
| `deployment/staging/docker-compose.cc10.yml` | Créé — Compose Traefik HTTPS (supercède CC6/CC9 ports hôte) |
| `deployment/staging/.env.staging.example` | Modifié — CC10 (S3 HTTPS, APP_ENV=production, sans ports hôte) |
| `deployment/docs/CC10_STAGING_DEPLOYMENT_REPORT.md` | Créé — ce document |

## 8. Sécurité

- Aucun secret dans le dépôt ou dans ce rapport.
- Identifiant et mot de passe du compte test staging non documentés ; rotation/suppression recommandée après smoke.
- PostgreSQL inaccessible depuis Internet (réseau interne uniquement).
- MinIO console (port 9001) non exposée via Traefik (seul le port 9000 — API S3 — est routé).
- `APP_ENV=production` → cookies `__Host-` + `Secure` (HTTPS imposé).
- `.env.staging` sur le serveur : `chmod 600`, propriétaire `deploy`, hors dépôt.
- Images GHCR publiques, pull anonyme — aucun token dans les logs ou fichiers.

## 9. Points d'attention et décisions

**DNS/CDN + Let's Encrypt HTTP-01** : La validation HTTP-01 fonctionne car les requêtes HTTP
(port 80) atteignent le reverse proxy du staging. Les certificats sont émis pour
`staging.enistere.com` et `s3-staging.enistere.com` sans configuration DNS-01.

**`extra_hosts` vs réseau interne** : L'API est sur `staging-internal` uniquement (pas sur `web`).
Elle ne peut pas résoudre `s3-staging.enistere.com` via DNS public sans `extra_hosts`. La solution
`host-gateway` permet à l'API d'atteindre le reverse proxy en local (port 443) pour
génerer et valider des URLs pré-signées compatibles navigateur.

**Supercession CC6 → CC10** : Le `docker-compose.cc10.yml` remplace le schéma avec ports hôte
exposés (CC6) par un schéma Traefik sans ports hôte. Aucune rétrocompatibilité maintenue.
