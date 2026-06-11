# Rapport — Dry-run staging contrôlé (Cloud Core 7)

> **Dry-run local réel** exécuté le **2026-06-11** à partir des **images GHCR immuables publiées** (tag
> `sha-7b07e5e`), avec un `.env.staging` **réel généré hors dépôt** (secrets jetables `openssl rand -base64`,
> supprimé après coup). **Aucun déploiement réel, aucune production, aucun secret committé, aucun `latest`.**
> Objectif : valider les prérequis d'exécution **avant** toute exécution staging réelle. Hiérarchie de vérité :
> **environnement dry-run observé** > runbooks. Ce rapport corrige les runbooks là où l'observation les contredit.

## 1. Cadre du dry-run

| Paramètre | Valeur |
|---|---|
| Type de staging | **D — dry-run local** (aucun serveur staging réel identifié) |
| Images | `ghcr.io/mike-zks/enistere-os-foundation/{api-nestjs,web-nextjs}:sha-7b07e5e` (commit `main` `7b07e5e`) |
| Tags immuables vérifiés (anonyme) | `sha-7b07e5e`, `main-7b07e5e`, `sha-b001ce8`, `main-b001ce8` présents ; **`latest` ABSENT** |
| `.env.staging` | **hors dépôt** (`/tmp/...`, `chmod 600`), secrets jetables, **supprimé (shred)** après le run |
| Outils | Docker 29.5.2, Docker Compose v5.1.4 |
| Compose | `cores/cloud/staging/docker-compose.staging.example.yml` (inchangé) |

## 2. Résultats par étape

| # | Étape | Résultat |
|---|---|---|
| 1 | `docker compose config` (env réel hors dépôt) | ✅ **valide** — images résolues au tag immuable `sha-7b07e5e`, **aucun `latest`**, variables substituées |
| 2 | `docker compose pull` | ✅ images GHCR **tirées en anonyme** (registry public) + `postgres:16`, `minio/minio` |
| 3 | `up -d postgres minio` | ✅ **postgres `healthy`** (`pg_isready`), **minio `Up`** |
| 4 | Bucket MinIO (`mc mb`) | ✅ `enistere-staging-files` créé |
| 5 | Sonde CLI Prisma dans l'image API | ⚠️ **`HAS_PRISMA_CLI`** — la runtime **embarque** `node_modules/.bin/prisma` (6.19.3) → **contredit le runbook** (« CLI absent ») |
| 6 | `prisma migrate deploy` **depuis les sources** (conteneur jetable `node:24`) | ⊘ **non réalisé** — l'environnement dry-run **bloque l'egress** vers `binaries.prisma.sh` (téléchargement du `schema-engine` échoue : TLS coupé). **Limite d'environnement, pas un défaut du dépôt.** |
| 7 | `up -d api web` + santé | ❌ **API `unhealthy`/`Restarting`** (crash-loop) → `web` **jamais démarré** (`depends_on: api healthy`) |
| 8 | Health checks hôte | ❌ API `/health/live` & `/health/ready` = **HTTP 000** (process mort), Web non testé |
| 9 | Boot **isolé** de l'image **Web** (hors compose) | ✅ **HTTP 200** (Next.js 16.2.7 « Ready ») → **l'image Web démarre** ; le défaut est **isolé à l'image API** |
| — | Nettoyage | ✅ `compose down -v` (conteneurs/volumes/réseau supprimés) + `.env.staging` **shred** ; **aucun `.env` réel dans le dépôt** |

## 3. Défaut BLOQUANT identifié — image API ne démarre pas

**Symptôme** : `enistere-staging-api-1` redémarre en boucle ; les logs montrent :

```
Prisma Client could not locate the Query Engine for runtime "debian-openssl-3.0.x".
generator client { binaryTargets = ["native", "debian-openssl-3.0.x"] }
The following locations have been searched:
  /app/node_modules/.prisma/client
  ...
clientVersion: '6.19.3'
```

**Cause racine (vérifiée par inspection read-only de l'image, indépendante de l'hôte)** :

- Base **runtime** de l'image = **Debian 12 « bookworm » → OpenSSL 3.0.x** (`/etc/os-release` dans l'image).
- Le client Prisma généré, dans `node_modules/.prisma/client`, **ne contient que**
  `libquery_engine-debian-openssl-**1.1.x**.so.node` (OpenSSL **1.1.x**).
- Prisma Client 6.19.3 cherche son **query engine** dans `.prisma/client` et **n'y trouve pas** la variante
  **3.0.x** requise par bookworm → moteur introuvable → le process **sort** → `restart: unless-stopped` →
  **crash-loop** → `/health/ready` jamais vert.
- Le **bon** moteur `libquery_engine-debian-openssl-3.0.x.so.node` existe pourtant sous `node_modules/@prisma/engines/`,
  **mais Prisma Client ne charge pas depuis ce chemin** par défaut.

**Conclusion** : l'image API publiée (`sha-7b07e5e`, et par construction toutes les images API actuelles)
**ne démarre pas** sur sa propre base runtime. C'est un **défaut bloquant** pour toute exécution staging réelle.

**Pourquoi la CI ne l'a pas vu** : `api-runtime-ci.yml` exécute l'API **depuis les sources** sur le runner
(`prisma generate` régénère le moteur pour la plateforme du runner) ; `registry-ci.yml` **construit et pousse**
l'image mais **ne l'exécute jamais**. Le runtime de l'image n'est donc **jamais** exercé en CI. Le dry-run est
le **premier** test d'exécution réelle de l'image — et il a révélé le défaut. *(Le boot de l'image Web, lui,
est validé : HTTP 200.)*

## 4. Correction du runbook (migrations) — observation contre documentation

Le `STAGING_DEPLOYMENT_RUNBOOK.md` affirmait : « la runtime image **n'embarque pas** le CLI Prisma → migrations
depuis les sources ». **L'observation contredit** :

- `node_modules/.bin/prisma` **est présent et fonctionnel** dans l'image (`prisma --version` → 6.19.3) ;
- `node_modules/@prisma/engines/schema-engine-debian-openssl-3.0.x` (moteur **migrations**, bonne plateforme)
  **est présent**.

Donc, une fois l'image **corrigée** (moteur **query** 3.0.x présent dans `.prisma/client`), les migrations
**pourraient** être lancées **depuis l'image** (`docker compose run --rm api npx prisma migrate deploy`), le
CLI et le schema-engine étant déjà là. La **stratégie migrations** est donc à **rouvrir** (cf. §6), et le
rationale « CLI absent » du runbook est **factuellement faux** et a été corrigé.

> Nuance : le dry-run n'a **pas** pu exécuter `migrate deploy` (egress bloqué vers `binaries.prisma.sh`). La
> faisabilité « migrate depuis l'image » reste donc **à confirmer** sur un environnement avec accès réseau
> sortant (ou avec un moteur pré-embarqué). Ne pas la déclarer acquise.

## 5. Décision MinIO / URL signée (tranchée pour staging V1)

L'API utilise **un seul** `S3_ENDPOINT`, qui sert **à la fois** aux opérations S3 côté serveur **et** d'hôte
**embarqué dans les URLs signées** renvoyées au navigateur. L'URL signée doit donc être **joignable par le
navigateur**.

- **Décision V1 (mono-serveur) = Option A** : exposer l'**API MinIO (port 9000)** sur l'**adresse publique du
  serveur staging** (IP/domaine + `MINIO_HOST_PORT`) et fixer `S3_ENDPOINT` à **cette adresse publique**. Le
  conteneur API atteint cette même adresse (port publié de l'hôte, ou `extra_hosts: host.docker.internal:host-gateway`).
  La **console MinIO (9001) n'est PAS exposée publiquement** (pare-feu / réseau interne).
- **Interdit en staging réel** : `S3_ENDPOINT=http://minio:9000` (nom de service interne **non résolu par le
  navigateur** → URLs signées inutilisables côté Web). *Ce dry-run a utilisé `minio:9000` uniquement pour la
  connectivité interne API↔MinIO ; il n'a pas exercé le téléchargement navigateur.*
- **Cible future (Option B)** : MinIO derrière un **reverse proxy + domaine dédié + TLS**. En V1, l'API reste
  **mono-endpoint** : `S3_PUBLIC_ENDPOINT` (séparation endpoint interne/public) serait une **évolution d'API**
  (ADR dédié), **non réalisée** ici.

## 6. Prochaine action (unique)

**Cloud Core 8 — corriger l'image runtime API NestJS (moteur de requête Prisma) pour qu'elle démarre**, puis
**re-jouer le dry-run**. C'est le **premier** verrou : aucune exécution staging réelle n'est possible avec une
image qui ne boote pas. La correction lèvera aussi la **question migrations** (§4) — à trancher : *migrate
depuis l'image* (CLI + schema-engine présents) **ou** *migrate depuis les sources*. Tant que l'image n'est pas
corrigée, **exécution staging réelle = BLOQUÉE**.

## 7. Limites & statut

- **Aucun** déploiement réel, **aucune** production, **aucun** secret committé, **aucun** `latest`, **aucun**
  workflow deploy automatique créés.
- **Déploiement staging** : passe de « cadré » à **dry-run EXÉCUTÉ avec défaut bloquant** — *pas* opérationnel,
  *pas* automatisé, *pas* production-ready.
- **À exercer plus tard** (server avec egress) : `migrate deploy`, boot API corrigé, téléchargement navigateur
  via `S3_ENDPOINT` public, parcours réels.

---

# Cloud Core 8 — correction du moteur Prisma & re-validation (2026-06-11)

## 8.1 Correction appliquée

- **`cores/api-nestjs/prisma/schema.prisma`** — generator : `binaryTargets = ["native", "debian-openssl-3.0.x"]`.
  Force `prisma generate` à émettre le moteur **`debian-openssl-3.0.x`** dans `node_modules/.prisma/client`
  (copié depuis `@prisma/engines`, **sans réseau**), quel que soit le résultat de la détection « native ».
- **`cores/api-nestjs/Dockerfile`** — installation d'**`openssl`/`ca-certificates` AUSSI au stage build**
  (avant `npm ci`) : sans openssl, `prisma generate` détectait mal la libssl et repliait `native` sur
  `debian-openssl-1.1.x`. Build et runtime sont tous deux `node:24-slim` (bookworm → 3.0.x) → moteur aligné.
- **`.github/workflows/registry-ci.yml`** — nouveau job **`api-smoke`** (ferme l'angle mort) : build l'image
  API, la **lance**, vérifie (sans DB) que le **moteur de requête Prisma se charge** (erreur de connexion = OK ;
  « engine could not be located » = **FAIL**) + non-root + openssl + moteur présent. Le job `images`
  (**push GHCR**) est désormais `needs: api-smoke` → **publication conditionnée au smoke vert**.

## 8.2 Re-validation (dry-run réel, hors dépôt, secrets jetables)

Le `docker build`/`npm ci` **local** est **bloqué** (egress sandbox vers le registre npm). Pour prouver l'effet
du correctif **sans** rebuild, le moteur **`libquery_engine-debian-openssl-3.0.x.so.node`** (déjà présent dans
`@prisma/engines` de l'image publiée — c'est **exactement** ce que le fix `binaryTargets` dépose dans
`.prisma/client` au build) a été **extrait de l'image** puis **monté** dans `.prisma/client` du conteneur API,
sur le **même compose staging** (`sha-7b07e5e`) :

| Vérification | Avant (CC7) | Après (engine 3.0.x = sortie du fix) |
|---|---|---|
| `.prisma/client` | `libquery_engine-debian-openssl-**1.1.x**` | + `libquery_engine-debian-openssl-**3.0.x**` |
| **Migrations** (depuis l'**image**, offline) | non testé | ✅ **5 migrations appliquées** (`prisma migrate deploy`, CLI + schema-engine 3.0.x **dans l'image**) |
| **API conteneur** | `Restarting` (crash-loop) | ✅ **`Up (healthy)`** — logs « Nest application successfully started » |
| `GET /health/live` | HTTP 000 | ✅ **HTTP 200** |
| `GET /health/ready` | HTTP 000 | ✅ **HTTP 200** |
| **Web** `GET /` | non atteint | ✅ **HTTP 200** (`Up (healthy)`) |
| Log « query engine could not be located » | présent | ✅ **absent** |

**Conclusion** : avec le moteur 3.0.x dans `.prisma/client` (= sortie du fix), l'**image publiée démarre** et
la **stack staging complète** (api+web+postgres+minio) passe **healthy**. Le correctif **résout** le défaut
bloquant CC7.

## 8.3 Stratégie migrations (tranchée)

**Option A — migrations depuis l'IMAGE** est **viable et retenue pour staging V1** : l'image embarque le **CLI
Prisma** (`node_modules/.bin/prisma` 6.19.3) **et** le **`schema-engine-debian-openssl-3.0.x`** → `docker
compose run --rm api npx prisma migrate deploy` applique les migrations **sans accès réseau** (validé ici : 5
migrations appliquées). Étape **manuelle, séparée du démarrage** (jamais au boot du conteneur). Option B
(depuis les sources) reste un repli ; image de migration dédiée = **non nécessaire** en V1.

## 8.4 Limites / honnêteté

- L'**image GHCR corrigée n'est pas encore reconstruite/publiée** (rebuild local impossible — egress npm). Elle
  sera **rebâtie et poussée par la registry CI** (gate `api-smoke`) **au merge** de Cloud Core 8. La preuve
  ci-dessus utilise l'image actuelle + le moteur 3.0.x **réel** (sortie du fix), ce qui est représentatif.
- `S3_ENDPOINT` interne (`minio:9000`) en dry-run : **téléchargement navigateur non exercé** (cf. §5, Option A).
- Aucun déploiement réel, aucune production, aucun secret committé, aucun `latest`.
