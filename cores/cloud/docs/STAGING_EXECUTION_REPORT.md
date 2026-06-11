# Rapport — Exécution staging contrôlée (Cloud Core 9)

> **Exécution réelle des conteneurs** (API + Web + PostgreSQL + MinIO) à partir des **images GHCR corrigées**
> (`sha-d1e6242`), le **2026-06-11**, dans un **environnement Type D : local, sans exposition publique** (aucun
> serveur distant/Hetzner/VM identifié, aucun SSH, aucun DNS, aucun HTTPS, aucun pare-feu). **Aucune production,
> aucun workflow deploy, aucun secret committé, aucun `latest`.** `.env.staging` **réel généré hors dépôt**
> (secrets jetables, `chmod 600`, **shred** après). Hiérarchie de vérité : **conteneurs réellement exécutés +
> health checks observés** > runbooks.

## 1. Environnement (honnêteté)

| Paramètre | Valeur |
|---|---|
| Type (§6) | **D — local, sans exposition publique** (PAS de serveur distant : pas de Hetzner/VM/SSH/DNS/HTTPS) |
| Hôte | poste de travail Linux, Docker 29.5.2 + Compose v5.1.4, ~287 G libre, ~4,4 Gi RAM dispo |
| Images | `ghcr.io/mike-zks/enistere-os-foundation/{api-nestjs,web-nextjs}:sha-d1e6242` (corrigées CC8) |
| `latest` | **non utilisé** (`compose config` : 0 occurrence) |
| Dossier serveur | hors dépôt (`/tmp/enistere-staging-cc9/` ; sur un vrai serveur : `/opt/enistere/staging/`) |
| `.env.staging` | **hors dépôt**, `chmod 600`, secrets `openssl rand -base64`, **shred** après |
| Ports hôte | Web `3100`, API `3101`, MinIO API `9000`, console `39001` ; **PostgreSQL non publié** |

> **Ce rapport ne déclare PAS un staging réel sur serveur ni une posture production.** Il documente une
> **exécution locale contrôlée** validant les images corrigées et la chaîne de démarrage.

## 2. Résultats par étape

| # | Étape | Résultat |
|---|---|---|
| §11 | `pull` images GHCR corrigées | ✅ api/web `sha-d1e6242` + `postgres:16` + `minio` tirées |
| §12 | `compose config` (env réel hors dépôt) | ✅ **valide**, tags immuables, **0 `latest`**, variables substituées |
| §13a | `up postgres minio` | ✅ **postgres `healthy`**, **minio `Up`** |
| §10/§16 | **MinIO endpoint Option A joignable** | ✅ conteneur → `<staging-host>:9000/minio/health/live` = **200** ; hôte (navigateur) atteint MinIO (réponse HTTP reçue) |
| §13b | bucket privé + objet de test | ✅ `enistere-staging-files` créé, objet copié |
| §16 | **URL signée — téléchargement navigateur** | ⚠️ **403** : l'hôte **atteint** MinIO mais l'**URL pré-signée (`mc share`) est rejetée** (signature). **Presign de l'API non exercé** (pas d'utilisateur staging — voir §5) |
| §12bis | **migrations DEPUIS l'image** (offline) | ✅ **5 migrations appliquées** (`prisma migrate deploy`, CLI + schema-engine 3.0.x **dans l'image**) |
| §13c | `up api` | ✅ **API `Up (healthy)`** (`sha-d1e6242`) |
| §13d | `up web` | ✅ **Web `Up (healthy)`** (`sha-d1e6242`) |
| §14 | `GET /health/live` | ✅ **200** |
| §14 | `GET /health/ready` | ✅ **200** (DB connectée + migrée) |
| §14 | Web `GET /` | ✅ **200** |
| §14 | Web `GET /login` | ✅ **200** (page de connexion servie) |
| §14 | Web `GET /protected` (anonyme) | ⚠️ **200 sans `Location`** — **redirection App-Router en streaming** (RSC `NEXT_REDIRECT` + meta-refresh, honorée par le **navigateur** ; `curl` ne la suit pas). Comportement **documenté** (`WEB_AUTH_V1_REVIEW.md`) ; **aucune donnée privée** servie |
| §17 | logs API | ✅ « Nest application successfully started » / « API Core started » — **aucune** erreur moteur Prisma |

## 3. Migrations (§12)

**Stratégie Option A (depuis l'image)** appliquée et **réussie offline** : `docker compose run --rm api npx
prisma migrate deploy` → **5 migrations** appliquées (l'image embarque le CLI Prisma + `schema-engine-debian-
openssl-3.0.x`). Étape **manuelle, séparée du démarrage**. Conforme au `STAGING_DEPLOYMENT_RUNBOOK.md`.

## 4. Health checks (§14)

`/health/live` **200**, `/health/ready` **200**, Web `/` **200**, `/login` **200**. API & Web conteneurs
`Up (healthy)` (healthchecks compose internes verts). Stack **opérationnelle** sur l'environnement local.

## 5. Auth & Files (§15/§16) — limites honnêtes

- **Auth applicatif (login/logout)** : **non exercé**. Raison : aucun **utilisateur staging** n'a pu être créé
  — le seed RBAC (`prisma/seed.ts`) et `proof-seed-user.ts` nécessitent **`ts-node`/devDeps** (absents de l'image
  runtime `--omit=dev`) et l'**egress npm est bloqué** dans cet environnement. Les **pages** `/login` (200) et
  `/protected` (redirection streaming) sont **servies** ; le **parcours authentifié** reste à valider.
- **Files (métadonnées + URL signée via l'API)** : **non exercé** (dépend d'un utilisateur authentifié + d'un
  upload + RBAC `files.read`/`files.download`). Le **point critique Option A** — l'endpoint `S3_ENDPOINT` est
  **joignable par le navigateur** — est **confirmé** (l'hôte atteint MinIO à `<staging-host>:9000`). En revanche
  le **téléchargement d'une URL signée** n'est **pas validé de bout en bout** : l'URL pré-signée par `mc` a
  renvoyé **403** (signature), et la **génération de l'URL signée par l'API** (AWS SDK, path-style) n'a pas été
  exercée. → **à valider sur serveur (Cloud Core 10)**.

## 6. MinIO / URL signée (§10) — décision appliquée

**Option A** (Cloud Core 7) appliquée : `S3_ENDPOINT = http://<staging-host>:9000` (adresse de l'hôte, **joignable
par le navigateur ET par le conteneur API** — vérifié). **Jamais** `http://minio:9000` pour l'URL signée.
**Console MinIO (9001)** non destinée à l'exposition publique ; **bucket privé** (aucune policy publique) ;
**PostgreSQL non publié**. **Réserve** : la **validité de la signature** d'une URL pré-signée contre un endpoint
**IP brute** reste à confirmer avec le **presign de l'API** (et/ou un **domaine** MinIO) — Cloud Core 10.

## 7. Logs (§17)

Extraits **non sensibles** uniquement (démarrage Nest, port). **Aucun** secret/cookie/token/URL signée
complète/`DATABASE_URL` journalisé ni reproduit ici.

## 8. Rollback (§18)

Procédure **documentée, non exécutée** (stack saine) : repointer `GHCR_API_IMAGE`/`GHCR_WEB_IMAGE` vers un tag
immuable **antérieur QUI DÉMARRE** (⚠️ uniquement des tags **post-CC8** ; `sha-7b07e5e` et avant **ne démarrent
pas**) → `docker compose pull` → `up -d` → re-vérifier health. **Rollback DB non garanti** (migrations
additives). Cf. `STAGING_ROLLBACK_RUNBOOK.md`.

## 9. Sécurité serveur (§19) — état honnête

```
exposition publique : AUCUNE (local Type D)
HTTPS / TLS         : ABSENT
DNS / domaine       : ABSENT
pare-feu            : non configuré (poste local)
MinIO console (9001): publiée sur l'hôte local uniquement (à NE PAS exposer publiquement en réel)
PostgreSQL          : NON publié (réseau interne)
secrets             : hors dépôt, jetables, shred après
```

**Statut sécurité : staging technique interne (local), NON sécurisé production.** Ne pas exposer cette
configuration sur Internet sans HTTPS + pare-feu + domaine (Cloud Core 10).

## 10. Maintien ou arrêt (§20)

**Décision : Option B — ARRÊT après validation.** Justification : environnement **Type D local non sécurisé**
(pas de domaine/HTTPS/pare-feu confirmé). `docker compose down -v` exécuté ; **volumes supprimés** (données et
secrets **jetables**, éphémères). Aucun staging durable laissé actif.

## 11. Incidents / limites

1. **URL signée 403** (`mc share`) — signature rejetée ; presign **API non exercé** (pas d'utilisateur). Endpoint
   **joignable** confirmé ; round-trip **non validé**.
2. **Auth/Files applicatifs non exercés** (seed impossible : devDeps/egress).
3. **Pas de serveur réel** (Type D local) ; pas d'HTTPS/DNS/pare-feu.
4. `/protected` = 200 (redirection streaming, documentée) — vérification navigateur réelle à faire.

## 12. Verdict

✅ **Exécution staging LOCALE CONTRÔLÉE réussie** sur les **images GHCR corrigées** (`sha-d1e6242`) : `compose
config` valide (no `latest`), **migrations depuis l'image** (offline), **API & Web `healthy`**,
`/health/live`+`/health/ready`+`/`+`/login` = **200**, **endpoint MinIO Option A joignable** par l'hôte. ⚠️
**Non validé** : téléchargement **URL signée** de bout en bout (presign API) + **Auth/Files** applicatifs (pas
d'utilisateur staging) + **aucun serveur réel / HTTPS / exposition**. **Statut : `EXECUTION_LOCALE_CONTROLEE`**
(ni « réelle sur serveur », ni production-ready). **Prochaine action : Cloud Core 10 — préparation serveur
staging sécurisé** (serveur réel + HTTPS/DNS/pare-feu, puis validation URL signée Option A + Auth/Files réels).
