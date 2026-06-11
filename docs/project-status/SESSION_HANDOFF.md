# SESSION_HANDOFF.md — Transfert de session (compact)

> Document court et exploitable pour démarrer une nouvelle conversation / un autre agent.
> **Source de vérité = le repository**, résumé par `docs/project-status/`. Vérifié le 2026-06-11.

## Bloc de démarrage (à copier en début de session)

```
Nous poursuivons Enistere OS Foundation.
Les fichiers du dossier docs/project-status/ sont la source officielle
de vérité. Lis-les avant toute recommandation et ne suppose aucune
implémentation absente de la matrice.
```

## 1. Projet

Enistere OS Foundation — monorepo de socles (cores) techniques + packages partagés + stratégie/ADR.

## 2. Objectif courant

Faire progresser les cores V1 **un par un**, en s'appuyant sur le API Core et les packages déjà
disponibles, sans régression et sans confondre spécification et implémentation.

## 3. État réel (résumé)

- **Implémenté** : **API Core NestJS** (auth, sessions, refresh, RBAC, permissions, audit, files
  S3/MinIO, logging Pino, OpenAPI canonique) — 377 tests unitaires + 101 e2e + revues. Statut :
  **IMPLEMENTATION_AVANCEE**.
- **En cours** : **UI Kit** (`@enistere/ui-kit`, **0.1.1**, privé) — design tokens **+ 9 primitives Web React**
  (Button, Input, Label, Text, Spinner, VisuallyHidden + **Alert, Card, FormField** — Web UI 1) pilotées par
  tokens, accessibles. React = peerDependency `>=18` ; **aligné et testé sous React 19** (**78 tests, 100 %**,
  jest-axe). CSS via `@enistere/ui-kit/styles.css`. **Tailwind/Radix/shadcn absents** (ADR-009 partiel).
  Statut : **IMPLEMENTATION_PARTIELLE** ; **consommé par le Web Core**.
- **Partiel** : **Web Core** (`@enistere/web-nextjs`, 0.1.0, privé) — **Next 16 App Router + React 19**,
  TypeScript strict, Server Components par défaut, UI Kit consommé, thème clair via `data-theme`,
  en-têtes sécurité + pas de `X-Powered-By`. **Intègre l'API publique (Health)** : factory serveur par
  requête + client public navigateur (sans session, `enableRefresh:false`), **TanStack Query** (retry
  borné), **SSR + hydratation** (page `force-dynamic`, build indépendant de l'API). Expose les **flux BFF
  Auth** : `login`/`refresh`/`logout`/`csrf` via **Route Handlers** `/api/auth/*` — cookies `HttpOnly`
  access/refresh (jamais renvoyés au navigateur, `__Host-` prod), **CSRF double-submit** (cookie non
  HttpOnly + `X-CSRF-Token`, temps constant, rotation), **Origin/Referer** (fail-closed), corps borné,
  erreurs génériques, `X-Request-Id` propagé, logout idempotent. **Lit aussi le profil/les autorisations** :
  `GET /api/auth/me` + `GET /api/auth/authorization` (Route Handlers **read-only**, `no-store`) → **client
  BFF navigateur** (same-origin, `credentials:"include"`, **aucun token lu/exposé**) → hooks **`useSession`**
  (`loading`/`authenticated`/**`anonymous` (401)**/**`error` (403/5xx/réseau)**) et **`useAuthorization`**
  (activé si authentifié ; helpers `hasRole`/`hasAnyRole`/`hasPermission`/`hasAllPermissions`, **OR/AND, sans
  wildcard**, ADR-006) ; **logout purge** `authKeys.all` (Health conservé). **Premier layout protégé**
  (Web Auth 4) : groupe `(protected)` + page `/protected` ; le **layout Server Component** résout la session
  **côté serveur read-only** (`resolveServerSession` → API `/auth/me`, `enableRefresh:false`, **aucun appel
  au BFF local**, **aucune écriture cookie** via `guardReadOnly`) → **redirige** l'anonyme (`/?auth=required`,
  temporaire), rend **« Service indisponible »** si l'API est down (≠ anonyme), sinon **hydrate** le profil
  (`prefillSessionQuery` → `useSession` authentifié au 1ᵉʳ rendu, **sans** second `/me`). **Page de connexion
  `/login`** (Web Auth 5) : formulaire accessible, **login BFF** (`performBffLogin` : CSRF → `POST /api/auth/login`,
  **aucun token lu**), `useLogin` (purge `authKeys`, **anti-double-soumission**, aucun credential en cache),
  navigation **`router.replace(returnTo)` + `refresh()`** ; **`returnTo` interne assaini** (`sanitizeReturnTo`,
  anti open-redirect) ; utilisateur déjà authentifié **redirigé** hors `/login`. La redirection anonyme du
  layout protégé pointe vers `/login?returnTo=/protected`. **Lit les fichiers en lecture seule** (Files 1) :
  deux **Route Handlers BFF ciblés** (jamais un proxy générique) `GET /api/files/:id` (métadonnées
  **publiques**, client serveur **read-only**, `no-store`) et `POST /api/files/:id/download-url` (URL signée
  courte, client serveur **writable** réutilisant le refresh BFF, **Origin/Referer + CSRF**, `no-store`) — seul
  l'**UUID** du chemin est accepté (UUID invalide → **400 sans appel API**) ; mapping d'erreurs **distinct**
  (400/401/403/**404 anti-énumération**/**409**/429/**503**) ; client BFF navigateur (`credentials:"include"`,
  **aucun Bearer**) ; `fileKeys` **disjoints** ; `useFileMetadata` (query, `enabled` si UUID, `retry:false`) +
  **`useCreateDownloadUrl`** (**mutation** : l'URL signée est **consommée immédiatement** puis abandonnée —
  **jamais** en cache/log/persistance) ; téléchargement via **ancre temporaire** (`rel="noopener noreferrer"`,
  URL `https`-only validée) ; page privée `/protected/files/[id]` avec états UI réutilisés ; **l'API reste
  l'autorité** (permission `files.read`/`files.download` + ownership), `useAuthorization` ne fait qu'afficher le
  bouton ; **aucun champ interne** (storageKey/bucket/checksum/ownerId). **Sans middleware, sans Server Action
  Auth, sans token en JS, sans upload/suppression/admin.** **307 tests** + preuves **API réelles** Auth/session
  **+ protégé 26/26 + login 22/22 + Files (API + MinIO) 21/21** (PostgreSQL + MinIO jetables). Statut :
  **IMPLEMENTATION_PARTIELLE**. Build/dev via **webpack**
  (`extensionAlias`). Note transport : le client serveur authentifié **bufferise le corps** (sinon le
  `fetch` patché de Next échouait sur les réponses non-2xx — `expected non-null body source`).
- **Packages** : `@enistere/api-contracts` et `@enistere/api-client-fetch` (0.1.0, privés) — validés
  **localement** (tests + live 16/16), **non publiés** ; `api-client-fetch` **instancié (public/Health +
  authentifié/BFF Auth login/refresh/logout/me/authorization)** dans le Web Core ; types Auth dérivés via
  `SchemaOf<>` (`UserProfileResponseDto`, `AuthorizationSummaryResponseDto`) — preuve API réelle.
- **Cloud Core** : **`IMPLEMENTATION_PARTIELLE`** — spec + README + `docs/` (CC1 cadrage : baseline, environnements,
  checklist protection de branche, politique CI 4 niveaux, secrets/registry, plans) **+ CC2 : CI runtime API**
  `api-runtime-ci.yml` (PostgreSQL+MinIO jetables, migrations, unit + e2e, openapi:check) **+ CC3 : CI E2E
  navigateur** `web-e2e-ci.yml` + `cores/web-nextjs/e2e/` (Playwright/Chromium ; stack réelle API+PG+MinIO+Web ;
  parcours **Health/Auth/Files**) **+ CC5 : registry GHCR** `registry-ci.yml` + **Dockerfiles** API/Web
  (multi-stage, non-root, Web **standalone**) — build PR sans push, **push images GHCR sur `main`** (tags
  immuables, labels OCI, `GITHUB_TOKEN`, **sans déploiement/secret/PAT/`.env`**) — **VALIDÉ** (Registry CI verte
  sur `main`, **images GHCR publiques** `api-nestjs`/`web-nextjs` tags `main-`/`sha-`, aucun `latest`) **+ CC6 :
  staging manuel** `cores/cloud/staging/` (compose+`.env` **exemples** + runbooks déploiement/rollback) **+ CC7 :
  dry-run staging contrôlé** (`STAGING_DRY_RUN_REPORT.md`) — **dry-run local réel** ayant révélé que l'image API
  ne démarrait pas (moteur Prisma OpenSSL 1.1.x vs runtime bookworm 3.0.x) **+ CC8 : image API CORRIGÉE**
  (`binaryTargets debian-openssl-3.0.x` au schéma + `openssl` au stage build → moteur 3.0.x) **re-validée**
  (migrations **depuis l'image** offline, API/Web **`healthy`**, `/health/live`+`/health/ready`+`/`=200) **+ angle
  mort CI fermé** (job **`api-smoke`** dans `registry-ci.yml` → gate du push GHCR) → **déploiement staging =
  `DRY_RUN_API_IMAGE_FIXED`** ; **migrations Option A** (depuis l'image) **+ CC9 : exécution staging contrôlée
  LOCALE** (`STAGING_EXECUTION_REPORT.md`) — stack réelle (images corrigées `sha-d1e6242`) en **Type D local** :
  health 200, endpoint MinIO **Option A joignable** ; ⚠️ **URL signée bout-en-bout + Auth/Files non validés**
  (pas d'utilisateur ; pas de serveur réel/HTTPS) → **`EXECUTION_LOCALE_CONTROLEE`**. **Quatre workflows CI**
  (niveaux 1–4 partiel) **+ cadrage + dry-run + fix image + exécution locale staging**. **Restent** : **serveur
  staging RÉEL** (HTTPS/DNS/pare-feu — **CC10**), **URL signée + Auth/Files en réel**, environnements protégés,
  monitoring, rollback **automatisé**, scan/signature d'image, `api-smoke` à rendre **requis**.
- **Starter (socle générique)** : `mobile-react-native` → **`STARTER_FOUNDATION_INITIEE`** — starter **Expo SDK 55**
  / Expo Router (navigation publique+authentifiée + gate + not-found ; **shell auth sans backend** ; **secure
  storage** SecureStore ADR-015 = access token en mémoire + refresh token persistant ; **transport `fetch`**
  générique ADR-011 en **seam** vers `@enistere/api-client-fetch` ADR-016 ; **TanStack Query** ADR-012 ;
  **ThemeProvider + tokens** ADR-008/010 ; **états standards**). Layout **plat** + **autonome** (hors workspaces).
  Vérifs : **typecheck + lint + expo-doctor 19/19 verts**. **Aucune logique métier.** Différés (V1 partielle) :
  Zustand, RHF/Zod, upload, notifications, logger.
- **Vides** : `ai-core`, `api-spring`, `docs-core`, `mobile-flutter`, `quality-core`, `web-angular`.
- **CI** : **4 workflows GitHub Actions** (tous verts sur `main`) — niveau 1 `ci.yml` (non-régression monorepo :
  ordre `api-contracts → api-client-fetch → ui-kit → web-nextjs → audit`, `npm ci` Node 24, `npm audit`, gardes
  Axios/Zustand) ; niveau 2 `api-runtime-ci.yml` (runtime API + e2e) ; niveau 3 `web-e2e-ci.yml` (E2E
  navigateur Playwright) ; niveau 4 partiel `registry-ci.yml` (**build + push images GHCR**). **Protection de
  branche `main` ACTIVE** (flux PR). **Conteneurisation** : Dockerfiles API/Web (non-root) + **compose staging
  exemple** (CC6). **Absents** : **déploiement réel** (staging exécuté/production), environnements protégés,
  monitoring, scan/signature d'image, couverture publiée. **CC8** : un **5ᵉ workflow-job `api-smoke`** (dans
  `registry-ci.yml`) **exécute l'image API** et vérifie le moteur Prisma → **gate le push GHCR** (ferme l'angle
  mort « image jamais exécutée »). Image **Web** + image **API (corrigée, moteur 3.0.x)** bootent toutes deux.
- **Git** : `main` sur `origin` (SSH ; **repo public** ; **branche `main` protégée → flux PR**). Commits récents
  (via PR) : `fix(api): make docker runtime prisma engine compatible (#7)` (`d1e6242` — CC8 image API corrigée + `api-smoke`),
  `docs(cloud): prepare staging dry run (#6)` (`5118283` — CC7 dry-run),
  `docs(cloud): finalize staging integration (#5)` (`7b07e5e` — CC6B finalisé),
  `Merge PR #4 … cloud-core-6-staging` (`b001ce8` — CC6 staging intégré),
  `Merge PR #3 … cloud-core-5b-confirm` (`ac4e805` — CC5B validé),
  `Merge PR #2 … cloud-core-5b-verify` (`bfd33dc`),
  `ci(cloud): add ghcr registry workflow (#1)` (`b41a953`),
  `docs(cloud): harden ci governance`,
  `ci(web): add browser e2e validation workflow`,
  `ci(api): add runtime validation workflow`,
  `docs(cloud): define v1 execution baseline`,
  `ci: add minimal monorepo validation`,
  `docs(web-nextjs): review web core v1 increment`,
  `feat(web-nextjs): add secure file read access`,
  `feat(web-ui): add standard interface states`,
  `docs(web-nextjs): review web auth v1`,
  `feat(web-nextjs): add secure login experience`,
  `feat(web-nextjs): add server-resolved protected layout`,
  `docs(web-nextjs): review web core governance`,
  `feat(web-nextjs): add session and authorization state`,
  `feat(web-nextjs): implement secure auth BFF flows`, `feat(web-nextjs): establish server auth foundations`,
  `feat(web-nextjs): integrate public API and query layer`, baseline.
- **Audit** : **0 vulnérabilité** (TanStack Query v5 ; override `postcss ^8.5.15`).

## 4. Cores techniquement implémentés

`cores/api-nestjs/` (avancé), `cores/ui-kit/` (starter tokens + primitives, React 19) et
`cores/web-nextjs/` (Next 16 + UI Kit + API publique + TanStack Query + BFF Auth + session/autorisations,
**IMPLEMENTATION_PARTIELLE**).

## 5. Cores documentaires

**`cloud`** : spéc + README + `docs/` de **cadrage opérationnel** (Cloud Core 1) — **pas** de starter/infra réelle
au sens applicatif (`IMPLEMENTATION_PARTIELLE`/`PAUSE_CONTROLEE`). `ui-kit`, `web-nextjs` **et désormais
`mobile-react-native`** ont leur spéc **et** un starter (`mobile-react-native` → `STARTER_FOUNDATION_INITIEE`,
Expo SDK 55).

## 6. Packages

`@enistere/api-contracts` (types OpenAPI, runtime-indépendant) ; `@enistere/api-client-fetch`
(client Fetch typé + wrappers : auth, erreurs, timeout, refresh, multipart). Workspaces npm
(`packages/*`, `cores/ui-kit`, `cores/web-nextjs`). **Non publiés** ; UI Kit **consommé** + `api-client-fetch`
**instancié (public/Health + authentifié/BFF Auth)** par le Web Core. Usage authentifié **intégré** (preuve API réelle).

## 7. ADR clés

18 ADR **Validés** (001–016, 039, 040). Implémentés et revus : 002 (Prisma), **007** (Files : upload **API** ;
**consommé en lecture côté Web** — métadonnées publiques + URL signée + téléchargement direct, **sans** upload),
039 (Argon2id), 040 (logging). Partiels : 001 (monorepo), 003, **013** (CI minimale), **004** (session : adapter serveur Web + **état de session
navigateur** `useSession`/`useAuthorization`, read-only sans refresh silencieux), **005** (cookies web +
**CSRF** : flux BFF login/refresh/logout opérationnels, cookies `HttpOnly`, CSRF double-submit,
Origin/Referer — Web ; reste : autres mutations futures), **006** (RBAC : appliqué **côté API** ;
**consommé en lecture** côté Web via helpers OR/AND sans wildcard pour l'affichage conditionnel —
**l'API reste l'autorité**), **011** (Fetch instancié public + **authentifié** Web + client BFF navigateur + **façade Files** read-only),
**012** (TanStack Query intégré Web : server state Health, Auth **et Files** — cache disjoint, purge au logout,
**URL signée hors cache** via mutation), **013** (**CI minimale** GitHub Actions — non-régression monorepo ;
**partiel**), 016
(types Auth via `SchemaOf<>`). **013 partiel** (CI minimale). Décidés non implémentés : 014, 015. **008/009/010 partiels** (UI Kit).
ADR-017→038 = backlog non rédigé. **ADR-013 (CI/CD)** : **PARTIELLEMENT_IMPLEMENTE** — **niveaux 1–3** :
`ci.yml` (non-régression monorepo) + `api-runtime-ci.yml` (runtime API) + `web-e2e-ci.yml` (E2E navigateur) ;
restent branch protection (**documentée — 7+1 checks — non appliquée**, humain), couverture, release, déploiement,
environnements. **ADR-014 (registry)** : **`PARTIELLEMENT_IMPLEMENTE`** (CC5 — build + push GHCR sur `main`,
Dockerfiles ; sans déploiement). Détail : [`DECISIONS_REGISTER.md`](./DECISIONS_REGISTER.md).

## 8. Dernière étape terminée

**Cloud Core 9 — exécution staging contrôlée** (`cores/cloud/docs/STAGING_EXECUTION_REPORT.md`) : **exécution
réelle des conteneurs** (API+Web+PostgreSQL+MinIO) à partir des **images GHCR corrigées** (`sha-d1e6242`), en
environnement **Type D : local, sans exposition publique**. **Aucun serveur distant/Hetzner/VM/SSH/DNS/HTTPS
identifié** → mission **requalifiée honnêtement** en exécution **locale** (consigne §6 : ne pas prétendre à un
staging réel sans serveur). `.env.staging` **réel hors dépôt** (`/tmp`, `chmod 600`, secrets `openssl` jetables,
**shred** après ; sur serveur réel : `/opt/enistere/staging/`). **Résultats** : `compose config` **valide**
(**0 `latest`**) ; images corrigées **tirées** ; **postgres `healthy`** + **minio `Up`** + bucket privé ;
**migrations DEPUIS l'image** (Option A, **offline**, 5 appliquées) ; **API `Up (healthy)`** + **Web `Up
(healthy)`** ; `/health/live`+`/health/ready`+`/`+`/login` = **200** ; `/protected` anonyme = **200 sans
`Location`** (**redirection App-Router streaming** RSC `NEXT_REDIRECT`/meta-refresh — honorée par le navigateur,
**documentée**, aucune donnée privée) ; **endpoint MinIO Option A** (`S3_ENDPOINT=http://<host>:9000`)
**joignable** par le conteneur ET l'hôte (navigateur). ⚠️ **Non validé** : **URL signée bout-en-bout** (l'URL
pré-signée par `mc` → **403** côté hôte ; **presign de l'API non exercé**) et **Auth/Files** applicatifs
(**aucun utilisateur staging** : seed RBAC nécessite `ts-node`/devDeps + egress npm, **indisponibles**).
**Sécurité** : staging **technique interne local, NON sécurisé production** (pas d'HTTPS/DNS/pare-feu ; MinIO
console locale seulement ; PostgreSQL non publié). **Décision §20** : **arrêt** après validation (`down -v`,
volumes + secrets **jetables** supprimés). **Rollback** documenté (vers tags **post-CC8** seulement). **Aucune**
modif `cores/*/src`/`packages`/`docs/adr`/`strategy`/Dockerfiles/workflows ; **aucun secret/`latest`/déploiement
réel**. Statut **`EXECUTION_LOCALE_CONTROLEE`**. Commit `docs(cloud): record controlled staging execution` (via
PR). **Prochaine action : Cloud Core 10 — préparation serveur staging sécurisé** (serveur réel + HTTPS/DNS/
pare-feu, puis validation URL signée Option A + Auth/Files **en réel**).

**Étape précédente — Cloud Core 8 — correction de l'image runtime API NestJS** : **corrige** le défaut bloquant CC7 (image API en
crash-loop) et **ferme l'angle mort CI** (image buildée mais jamais exécutée). **Cause** : le query engine
Prisma de `node_modules/.prisma/client` était compilé pour **OpenSSL 1.1.x** (détection `native` ambiguë au
stage build, sans openssl) alors que la base runtime est **Debian 12 bookworm / OpenSSL 3.0.x** → moteur
introuvable → crash-loop. **Correctif** : `cores/api-nestjs/prisma/schema.prisma` generator
`binaryTargets = ["native", "debian-openssl-3.0.x"]` (force l'émission du moteur 3.0.x, copié depuis
`@prisma/engines` **sans réseau**) **+** `cores/api-nestjs/Dockerfile` installe `openssl`/`ca-certificates`
**aussi au stage build**. **Re-validation réelle** (image publiée + moteur 3.0.x monté = sortie du fix ;
`STAGING_DRY_RUN_REPORT.md` §8) : **migrations depuis l'image** (`prisma migrate deploy`, **offline**, 5
appliquées), API **`Up (healthy)`** `/health/live` & `/health/ready` **200**, Web **200**, **stack staging
complète healthy**, logs « Nest application successfully started » **sans** erreur moteur. **CI** :
`.github/workflows/registry-ci.yml` nouveau job **`api-smoke`** (build → **lance l'image** → vérifie le
chargement du moteur Prisma **sans DB** : erreur de connexion = OK / « engine could not be located » = FAIL ;
+ non-root + openssl + moteur présent) → **`images` `needs: api-smoke`** ⇒ **push GHCR conditionné au smoke**.
**Stratégie migrations** tranchée = **Option A (depuis l'image)** (CLI Prisma 6.19.3 + `schema-engine-debian-
openssl-3.0.x` embarqués). **Validation locale réduite justifiée** : `docker build`/`npm ci` **bloqués** (egress
sandbox npm) → fix prouvé par (a) `prisma validate` OK, (b) dry-run réel ci-dessus, (c) `api-smoke` qui validera
en CI ; **aucune** modif de logique métier ; `cores/web-nextjs/src`/`ui-kit/src`/`packages`/`docs/adr`/`strategy`
**non modifiés** ; **aucun secret/`latest`/déploiement**. Statuts **inchangés** (Cloud Core
`IMPLEMENTATION_PARTIELLE` ; ADR-013/014 partiels) ; **déploiement staging = `DRY_RUN_API_IMAGE_FIXED`**. Commit
`fix(api): make docker runtime prisma engine compatible` **mergé via PR #7** (`d1e6242`). **CC8B (post-merge)
validé — observation réelle** : registry CI sur `main` **`api-smoke` = success** + **`images` push success** →
**images corrigées publiées** (`sha-d1e6242`/`main-d1e6242` API **et** Web, **aucun `latest`**) ; l'image API
`sha-d1e6242` **démarre par elle-même** (moteur `debian-openssl-3.0.x`, OpenSSL 3.0.20, non-root ; **dry-run
post-merge** : API/Web `healthy`, `/health/live`+`/health/ready`+`/`=200). Tags ≤ `sha-7b07e5e` restent cassés
(ne pas utiliser). **Prochaine action : Cloud Core 9 — exécution staging réelle contrôlée sur serveur.**

**Étape précédente — Cloud Core 7 — préparation serveur staging & dry-run contrôlé** (`cores/cloud/docs/STAGING_DRY_RUN_REPORT.md`) :
**dry-run local réel** exécuté à partir des **images GHCR immuables** (`sha-7b07e5e`, commit `main` `7b07e5e`) avec
un `.env.staging` **réel généré hors dépôt** (`/tmp`, `chmod 600`, secrets jetables `openssl rand -base64`,
**shred** après) — **aucun déploiement réel, aucun secret committé, aucun `latest`, aucun workflow deploy**. Type
de staging = **D (dry-run local)** (aucun serveur réel identifié). **Résultats** : ✅ `docker compose config`
valide (images résolues au **tag immuable**, **aucun `latest`**) ; ✅ images GHCR **tirées en anonyme** (registry
public) ; ✅ `postgres healthy` (`pg_isready`) + `minio Up` + **bucket** `enistere-staging-files` créé ; ✅ **image
Web boote** (hors compose : **HTTP 200**, Next 16.2.7) ; ❌ **défaut BLOQUANT** : l'**image API ne démarre pas**
(crash-loop) — le **query engine** Prisma de `node_modules/.prisma/client` est compilé pour **OpenSSL 1.1.x**
(`libquery_engine-debian-openssl-1.1.x.so.node`) alors que la **base runtime de l'image est Debian 12 bookworm /
OpenSSL 3.0.x** → moteur introuvable → `/health/ready` jamais vert. **Défaut invisible à la CI** (`api-runtime-ci`
exécute l'API **depuis les sources** sur le runner ; `registry-ci` **construit** l'image mais ne l'**exécute**
jamais). **Migrate-from-source non exercé** (egress du dry-run bloque `binaries.prisma.sh` — limite
d'environnement, pas un défaut du dépôt). **Corrections documentaires** : runbook (l'image **embarque** le CLI
Prisma 6.19.3 + `schema-engine-debian-openssl-3.0.x` → « CLI absent » **faux** → **stratégie migrations rouverte**
en CC8 : depuis l'image vs sources) ; **décision MinIO/URL signée tranchée (Option A)** : `S3_ENDPOINT` = adresse
**publique** du serveur (jamais `minio:9000`, non résolu par le navigateur), console 9001 non exposée,
`S3_PUBLIC_ENDPOINT` = évolution future hors V1. **Nettoyage** : `compose down -v` + `.env.staging` shred ;
**aucun `.env` réel dans le dépôt** (`git ls-files` : seulement `*.example`), working tree propre. **Aucune
modification** de `cores/*/src`/`packages`/`docs/adr`/`strategy` **ni des Dockerfiles/workflows** (l'image n'est
**pas** corrigée ici, par périmètre). Statuts **inchangés** (Cloud Core `IMPLEMENTATION_PARTIELLE` ; ADR-013/014
**partiels**) ; **déploiement staging = `DRY_RUN_EXECUTE`** (dry-run exécuté, **défaut bloquant** → exécution
réelle BLOQUÉE ; **ni** opérationnel **ni** automatisé). Commit `docs(cloud): prepare staging dry run` (via PR,
push direct `main` refusé). **Prochaine action : Cloud Core 8 — corriger l'image runtime API (moteur de requête
Prisma)** pour qu'elle démarre, puis re-jouer le dry-run + trancher la stratégie migrations.

**Étape précédente — Cloud Core 6 — déploiement staging manuel** (cadrage `CADRE_MANUEL_DOCUMENTE`) : **aucun déploiement réel,
aucun secret, aucune production, aucun `latest`, aucune automatisation/workflow deploy**. Livrables :
`cores/cloud/staging/docker-compose.staging.example.yml` (**api+web+postgres+minio**, réseau interne,
healthchecks node/pg_isready, **migrations hors démarrage**, PostgreSQL **non exposé**, MinIO API exposé pour
les **URL signées**), `cores/cloud/staging/.env.staging.example` (**placeholders `CHANGE_ME`**, secrets API
injectés **uniquement** dans le conteneur API — **pas** dans le Web), `cores/cloud/staging/README.md`, et les
runbooks **`STAGING_DEPLOYMENT_RUNBOOK.md`** (tag immuable `sha-*`, secrets hors dépôt `openssl rand -base64 48`,
bucket MinIO privé, **migrations Prisma découplées de l'image** — runtime sans CLI → `npx prisma migrate deploy`
depuis les sources au commit déployé —, health checks, données de test éphémères, contrainte **URL signée =
hôte `S3_ENDPOINT` joignable navigateur**, **`NEXT_PUBLIC_*` figé au build**) + **`STAGING_ROLLBACK_RUNBOOK.md`**
(**rollback d'image** simple par tag immuable ; **rollback DB NON garanti** → migrations **additives** ;
backup/restore `pg_dump`/`psql`). **Validation** : `docker compose config` **OK** (4 services), **aucun secret
API fuité dans le conteneur Web** (vérifié), `git diff --check` clean. **Cookies/TLS** documenté
(`APP_ENV=production` en HTTPS, `staging` en HTTP). Docs Cloud mises à jour (README, baseline §11,
SECRETS_POLICY §2). **`cores/*/src`/`packages`/`docs/adr`/`strategy` non modifiés** ; **aucun Dockerfile/workflow
modifié**. Statuts **inchangés** (Cloud Core `IMPLEMENTATION_PARTIELLE` ; ADR-013/014 partiels) ; déploiement
staging = **`CADRE_MANUEL_DOCUMENTE`** (pas `IMPLEMENTE_AUTOMATISE`). Commit `docs(cloud): add manual staging
deployment baseline` **mergé via PR #4** (`b001ce8` sur `main`) — **CC6B validé** : tous les checks requis
**verts** (CI/api-runtime/web-e2e/registry sur la PR **et** sur `main`), artefacts staging **intégrés à `main`**,
`docker compose config` OK, **aucun `.env` réel / secret**, et **images GHCR `main-b001ce8`/`sha-b001ce8`
publiées** (registry rejoué au merge, **aucun `latest`**). **Prochaine action : Cloud Core 7 — exécution réelle
staging** (si serveur+secrets prêts) ; **sinon dry-run / préparation serveur / durcissement registry**.

**Étape précédente — Cloud Core 5 — Registry GHCR sans déploiement** (niveau 4 partiel) : début d'**ADR-014** (registry
**uniquement**), **sans déploiement, sans staging/production, sans rollback, sans secret applicatif, sans PAT**.
**Dockerfiles** : `cores/api-nestjs/Dockerfile` (contexte `cores/api-nestjs/` — multi-stage : build = `npm ci`
+ `prisma generate` + `nest build` ; runtime = deps prod + `.prisma` copié + openssl + **`USER node`**) et
`cores/web-nextjs/Dockerfile` (contexte **racine** — build des paquets + Web ; runtime = Next.js **standalone**,
`node cores/web-nextjs/server.js`, **`USER node`**) + `.dockerignore` (API + racine ; **aucun `.env`/secret
copié**). `next.config.ts` : ajout **`output: 'standalone'`** + `outputFileTracingRoot` (racine) — **testé**,
niveau 1 **inchangé** (307 tests, typecheck/lint/build verts). **Workflow** `.github/workflows/registry-ci.yml`
(job `images`, matrice api/web) : `permissions: contents:read + packages:write` ; **PR → build SANS push** ;
**push `main` → login GHCR (`secrets.GITHUB_TOKEN`) + build + push** ; actions `docker/{setup-buildx,login,
metadata,build-push}-action` (majeure). **Images** `ghcr.io/<owner>/<repo>/{api-nestjs,web-nextjs}` (owner/repo
= `github.repository`, minuscules). **Tags immuables** (`metadata-action`, `flavor: latest=false`) :
`sha-<short>`, `main-<short>`, `pr-<n>` (build seul) — **`latest` JAMAIS généré** ; **labels OCI**. **Validation
locale** : `docker build` **API OK + Web OK** + smoke (`node --version`, exécution **non-root**, **aucun `.env`**
dans l'image) ; non-régression niveau 1 verte (307) + `npm audit` 0 vuln. **Workflows existants (1–3)
inchangés.** Docs : `REGISTRY_POLICY.md` (→ partiel), **`GHCR_REGISTRY_GUIDE.md`** (nouveau), `.github/workflows/
README.md`, baseline, `cores/cloud/README.md`. ADR-014 → **`PARTIELLEMENT_IMPLEMENTE`** ; ADR-013 partiel
(niveaux 1–4 partiel) ; Cloud Core reste `IMPLEMENTATION_PARTIELLE`. `cores/*/src`/`packages`/`docs/adr`/
`strategy` **non modifiés** (hors `next.config.ts`, config build testée). **Repo désormais public** + **protection
de branche `main` ACTIVE** (la PR a été exigée). Commit `ci(cloud): add ghcr registry workflow` (`cf7873c`)
**mergé via PR #1** (squash → `b41a953`), puis **Cloud Core 5B** (vérification) **mergé via PR #2** (merge commit
→ `b41a953..bfd33dc` sur `main`). **Cloud Core 5B : VALIDÉ — observation réelle effectuée** (repo **public** →
API GitHub Actions lisible + `docker manifest inspect` anonyme ; `gh` non installé mais non nécessaire) :
**Registry CI verte sur `main`** (push `b41a953` **et** `bfd33dc`, conclusion `success` → build API + build Web +
**push GHCR** réussis) ; **tous les checks requis verts** sur PR #1 et PR #2 ; **images GHCR publiques**
`ghcr.io/mike-zks/enistere-os-foundation/{api-nestjs,web-nextjs}` présentes avec tags **`main-b41a953`**,
**`main-bfd33dc`**, **`sha-bfd33dc`** ; **aucun tag `latest`** (`manifest unknown` confirmé). **Aucun déploiement/
secret/PAT/`GHCR_TOKEN`/staging ajouté** (workflow `GITHUB_TOKEN` seul). *(Observation : les workflows e2e/audit
ont eu des échecs **transitoires** sur d'anciens commits — endpoint `npm audit` indisponible / flakiness e2e —
mais tous les runs `main` récents sont verts ; flakiness à surveiller, cf. risques.)* **Prochaine action :
Cloud Core 6 — déploiement staging manuel** (ou durcissement registry) — **débloquée**. **Flux PR obligatoire**
(push direct `main` refusé).

**Étape précédente — Cloud Core 4 — durcissement CI & gouvernance de branche** (mission **documentaire**) : prépare la CI à être
**exigée** comme protection de `main`, **sans** déploiement/registry/secret, **sans** modifier les workflows
existants ni **renommer aucun job**. **7 checks** figés à rendre bloquants sur `main` (= `name:` des jobs :
`api-contracts`/`api-client-fetch`/`ui-kit`/`web-nextjs`/`audit` de `ci.yml` + `api-runtime` de
`api-runtime-ci.yml` + `web-e2e` de `web-e2e-ci.yml`). `GITHUB_BRANCH_PROTECTION_CHECKLIST.md` enrichi : matrice
des checks (obligatoires-maintenant vs futurs), avertissement « **renommer un job casse l'exigence** »,
vérifications post-application. **Politiques tranchées** (`CLOUD_CORE_V1_EXECUTION_BASELINE.md` §8 bis) :
**artefacts** = **aucun upload** (Option A ; traces Playwright `retain-on-failure` locales, jetées ; Option B
upload-`if:failure()` rétention courte sans logs/`.state.json`/cookies/URL signée = future) ; **couverture** =
**exécutée, non publiée** (UI Kit 100 %, Web ≈ 87,8 % ; aucun Codecov/gate) ; **pinning** = `@v4` conservé (SHA
= durcissement futur avec politique de MAJ) ; **`actionlint`** = futur (non installé ; validation = parse YAML +
simulations CC2/CC3). Docs mis à jour : `.github/workflows/README.md` (checks requis + politiques),
`API_RUNTIME_CI_PLAN.md`/`WEB_E2E_CI_PLAN.md` (check requis), `cores/cloud/README.md`. **Validation réduite
justifiée** (doc-only) : web `check` (**307** tests) + `npm audit` **0 vuln** + parse YAML des 3 workflows +
`git diff --check`. **Workflows existants intacts** (`ci.yml`/`api-runtime-ci.yml`/`web-e2e-ci.yml` non
modifiés). Cloud Core **reste** `IMPLEMENTATION_PARTIELLE` ; ADR-013 **partiel** (niveaux 1–3 + protection de
branche **documentée non appliquée**) ; ADR-014 **`NON_IMPLEMENTE`**. `cores/*/src`/`packages`/`docs/adr`/
`strategy` **non modifiés**. Commit `docs(cloud): harden ci governance`. **Prochaine action (humaine)** :
appliquer la protection de branche `main` ; **prochaine mission** : **Cloud Core 5 — Registry GHCR sans
déploiement**.

**Étape précédente — Cloud Core 3 — CI E2E navigateur (niveau 3)** (`.github/workflows/web-e2e-ci.yml` + `cores/web-nextjs/e2e/`) :
implémente le **niveau 3** — un workflow démarrant une **stack réelle et éphémère** (PostgreSQL `services:` +
MinIO `docker run` + **API NestJS** + **Web Next.js**) et rejouant les **parcours navigateur** critiques avec
**Playwright/Chromium** headless, **sans déploiement, registry/GHCR, Dockerfile applicatif, secret GitHub ni
environnement protégé**. **Outil** : `@playwright/test` (devDep du **workspace Web**) + Chromium
(`playwright install --with-deps chromium`) — pas de Cypress/Storybook. **Isolation niveau 1** : `e2e/` +
`playwright.config.ts` **exclus** de `typecheck`/`lint`/`build` (`tsconfig.json` `exclude` + `eslint.config.mjs`
`ignores`) → niveau 1 **inchangé** (vérifié : 307 tests Web, typecheck/lint/build verts). **Orchestration** :
`npm ci` + build paquets → `e2e:install` (Chromium) → API (autonome : `npm ci`, prisma generate/migrate:deploy/
seed, build, démarrage + attente `/health/ready`) → **seed utilisateurs** éphémères (`proof-seed-user.ts` →
propriétaire + sans-permission via `$GITHUB_ENV`) → build + démarrage Web (`next start`, **`APP_ENV=development`**
pour cookies HTTP) → **`playwright test`**. **Fixture** : `e2e/global-setup.ts` téléverse un **fichier VALIDATED**
éphémère via l'API → `e2e/.state.json` (gitignoré) ; **aucun token/URL signée journalisé**. **Specs**
(`e2e/{health,auth,files}.spec.ts`) : **Health** (accueil + sans fuite de config), **Auth** (anonyme `/protected`
→ `/login` ; identifiants invalides → **erreur générique** sans énumération, reste sur `/login` ; login valide
→ `/protected` ; **déconnexion** → re-navigation → `/login`), **Files** (métadonnées publiques, titre = nom
d'origine, **aucun champ interne** storageKey/bucket/checksum/ownerId, **téléchargement** : `download-url` **200**
+ requête au stockage ; id inexistant → « Fichier introuvable » ; sans permission → « Accès refusé »).
**Valeurs de test jetables** (jamais `secrets.*`, jamais en `.env`), traces `retain-on-failure`, **aucun
artefact poussé**. **`ci.yml`/`api-runtime-ci.yml` inchangés.** **Validation** : non-régression niveau 1
**12/12** (avec e2e présent) + **simulation locale du workflow** (stack réelle + Chromium) → **7 tests Playwright
verts** (anonyme→/login, invalide→erreur, login+logout, métadonnées+téléchargement, introuvable, accès refusé,
Health). Cloud Core **reste** `IMPLEMENTATION_PARTIELLE` (trois workflows CI niveaux 1–3 ; **pas** de registry/
déploiement/environnements/monitoring/rollback). ADR-013 **partiel** (niveaux 1–3) ; **ADR-014 `NON_IMPLEMENTE`**.
`cores/web-nextjs/src`/`ui-kit/src`/`packages`/`docs/adr`/`strategy` **non modifiés** (hors `tsconfig`/`eslint`/
`.gitignore`/`package.json` du Web pour isoler l'E2E). Commit `ci(web): add browser e2e validation workflow`.
**Prochaine action : Cloud Core 4 — durcissement CI & protection de branche** (humain).

**Étape précédente — Cloud Core 2 — CI runtime API NestJS (niveau 2)** (`.github/workflows/api-runtime-ci.yml`) : implémente le
**niveau 2** de la politique CI cadrée — un workflow rejouant l'**API Core NestJS** contre ses dépendances
runtime **jetables**, **sans déploiement, registry/GHCR, Dockerfile applicatif, secret GitHub ni environnement
protégé**. `cores/api-nestjs/` est un projet npm **autonome** (lockfile propre, **hors workspaces racine**) →
`working-directory: cores/api-nestjs` + **`npm ci`** ; Node 24 ; `permissions: contents: read` ; concurrence ;
**pas de `pull_request_target`**. **Services** : **PostgreSQL** (`postgres:16`, conteneur `services:`,
healthcheck `pg_isready`) ; **MinIO** (`minio/minio` via **`docker run`** — un `services:` **ne peut pas**
porter la commande `server /data` requise — + attente santé + **bucket `enistere-test-files`** créé via
`@aws-sdk/client-s3`, l'API ne le créant pas). **Variables = valeurs de test jetables** définies dans le
workflow (jamais `secrets.*`, jamais en `.env` versionné ; noms alignés sur `.env.example` : `DATABASE_URL`,
`JWT_*`, `REFRESH_TOKEN_HASH_SECRET`, `ARGON2_*`, `S3_*`, rate limits élargis, `LOG_LEVEL=warn`). **Étapes**
(scripts **réels** de `cores/api-nestjs/package.json`) : `prisma:generate` → `prisma:validate` →
**`prisma:migrate:deploy`** (migrations sur base jetable) → `lint` → **`npm test`** (unitaires) →
**`test:e2e`** (PostgreSQL + MinIO réels) → **`openapi:check`** (snapshot canonique) → `build` (nest build) →
`npm audit`. *(Pas de script `typecheck` côté API ; `nest build` couvre la compilation.)* **Aucun artefact
uploadé**, **logs sans secret**, données **éphémères**. **`ci.yml` (niveau 1) inchangé.** **Validation** :
baseline no-service locale (prisma:generate/validate, lint, build, `npm audit` 0 vuln) + **simulation locale
du workflow** (mêmes services `postgres:16`/`minio`, même env, mêmes étapes : migrate deploy + unit + **e2e** +
openapi:check + build) ; **`npm ci` API validé séparément** (exit 0, 802 paquets, 0 vuln, ~3 min). **Non-
régression monorepo** (niveau 1) **verte** (contracts 11, client 29, ui-kit 78, web 307+build, audit 0 vuln).
Cloud Core → **`IMPLEMENTATION_PARTIELLE`** ; ADR-013 **partiel** (niveaux 1–2) ; **ADR-014 `NON_IMPLEMENTE`**.
`cores/web-nextjs/src`/`ui-kit/src`/`packages`/`docs/adr`/`strategy` **non modifiés** ; logique applicative API
**non modifiée**. Docs Cloud + checkpoint mis à jour. Commit `ci(api): add runtime validation workflow`.
**Prochaine action : Cloud Core 3 — E2E navigateur (niveau 3)** + protection de branche (manuel).

**Étape précédente — Cloud Core 1 — cadrage minimal d'exécution CI/CD & environnements** (`cores/cloud/`) : transforme la CI
minimale en **socle gouverné**, **sans déploiement, Docker, registry, secret ni infra réelle**. Documents
créés (`cores/cloud/docs/`) : **`CLOUD_CORE_V1_EXECUTION_BASELINE.md`** (17 sections : objectif, état,
environnements, politiques CI/secrets/registry/runtime/E2E/observabilité/rollback, limites, étapes) ;
**`GITHUB_BRANCH_PROTECTION_CHECKLIST.md`** (application **manuelle** : PR obligatoire, **5 checks CI
bloquants**, force-push/suppression interdits, linear history à décider, CODEOWNERS plus tard) ;
**`SECRETS_POLICY.md`** (aucun secret en Git/CI ; **noms futurs sans valeurs** ; jamais en `NEXT_PUBLIC_*` ;
GitHub Environments futurs ; procédure d'exposition) ; **`REGISTRY_POLICY.md`** (GHCR cible, tags **immuables**
sha court, pas de `latest` prod — **ADR-014 `NON_IMPLEMENTE`**) ; **`API_RUNTIME_CI_PLAN.md`** (niveau 2 futur :
PostgreSQL/MinIO en services, prisma migrate, unit+e2e, openapi:check, logs sans secret) ;
**`WEB_E2E_CI_PLAN.md`** (niveau 3 futur : Playwright à décider, parcours Health/Auth/Files, données
éphémères). **`cores/cloud/README.md`** créé ; `.github/workflows/README.md` enrichi (politique CI 4 niveaux).
**Environnements logiques** : `local`/`ci` (réels) + `preview`/`staging`/`production` (théoriques). **Politique
CI à 4 niveaux** : 1=présent, 2=runtime API, 3=E2E Web, 4=registry/déploiement. **Non-régression** : baseline
locale **14/14** (contracts 11, client 29, ui-kit 78, web 307+build, audit 0 vuln) — **aucun code/CI modifié**.
Cloud Core → **`CADRAGE_OPERATIONNEL`** (non augmenté en `IMPLEMENTATION_PARTIELLE`) ; ADR-013 reste
**partiel**, ADR-014 **non implémenté**. `cores/api-nestjs/src`/`web-nextjs/src`/`ui-kit/src`/`packages`/
`docs/adr`/`strategy` **non modifiés** ; `ci.yml` **non modifié**. Commit `docs(cloud): define v1 execution
baseline`. **Prochaine action : Cloud Core 2 — CI runtime API (niveau 2)** + protection de branche (manuel).

**Étape précédente — CI minimale (ADR-013)** (`.github/workflows/ci.yml`) : première implémentation réelle d'ADR-013 — CI GitHub
Actions de **non-régression du monorepo**, **sans déploiement, registry, Docker, secret ni publication**.
Déclencheurs `pull_request` + `push` sur `main` ; `permissions: contents: read` ; `concurrency` (annule
l'obsolète) ; **Node 24** + **`npm ci`** (jamais `npm install`) + `cache: npm`. **5 jobs ordonnés par `needs`**
(échec lisible) imposant l'ordre de build : **`api-contracts`** (`generate:check` + typecheck/build/test) →
**`api-client-fetch`** (build de la dépendance api-contracts puis typecheck/build/test) → **`ui-kit`**
(`tokens:check`/typecheck/build/lint/test/`pack:check`) → **`web-nextjs`** (build des 3 dépendances puis
typecheck/lint/test/**build sans API**) → **`audit`** (`npm audit` 0 vuln + **gardes Axios/Zustand absents**
ADR-011/012 + versions clés react/react-query/next). Chaque job aval **rebuild ses dépendances** (`dist/` non
versionnés) — **validé par simulation runner neuf** (dist effacés → chaîne reconstruite → verte). **Pas de
`pull_request_target`, aucun secret, aucun Docker/PostgreSQL/MinIO, aucun GHCR, aucun déploiement.**
Non-régression locale (Node 24.14, `npm ci`) **verte** : api-contracts 11, api-client-fetch 29, ui-kit 78
(+tokens/pack), web-nextjs 307 + build, **`npm audit` 0 vuln**, Axios/Zustand absents. **Corrections** : aucune
au code applicatif ; aucun script modifié. ADR-013 → **`PARTIELLEMENT_IMPLEMENTE`** ; ADR-014 **non
implémenté**. Docs : `.github/workflows/README.md` + checkpoint. `cores/api-nestjs/src/`/`mobile`/`cloud`/
`docs/adr`/`strategy` **non modifiés**. Commit `ci: add minimal monorepo validation`. **Prochaine action :
Cloud Core 1 — cadrage CI/CD & environnements.**

**Étape précédente — Revue globale Web Core — incrément V1** (`@enistere/web-nextjs`) : revue **transverse de stabilisation** de
l'incrément complet (Health public + Auth 1→5 + UI 1 + Files 1) traité comme **un système unique**, **sans
nouvelle fonctionnalité**. Vérifié fichier par fichier + commandes + runtime : architecture (couches
`app→features→core/shared`, **aucun import inversé**, 16 client components justifiés, aucun barrel dangereux),
14 routes (privées/BFF `ƒ` → **build indépendant de l'API**), 6 clients API à responsabilités disjointes (aucun
Bearer/token côté navigateur), **BFF ciblé** (jamais proxy générique ; UUID 400 sans appel API ; CSRF/Origin
fail-closed avant API ; `no-store`), configuration (URL validée, `server-config` serveur-only, origines
exactes), **frontières client/serveur** (test statique : `next/headers`/server-config/handlers/http Files
interdits côté client), TanStack Query (client navigateur stable / serveur par rendu, **clés disjointes**,
**retry borné Health vs `retry:false` Auth/Files** documenté, **URL signée = mutation jamais en cache**),
contrats `SchemaOf<>` (`generate:check` ok, aucun DTO recopié, décisions sur status/errorCode jamais message),
a11y (un `h1`/page, jest-axe sur les vues clés), erreurs Files distinctes (**400/401/403/404/409/429/503/502/
504**). **Scans** : aucun token/URL signée/donnée privée en source, logs, `.next/static`, RSC. **Non-régression** :
Web **307 tests ×2** (10,1 s/9,9 s, sans hang) + couverture **≈ 87,8 %** (modules `files/` 96–100 %) + build ;
UI Kit 78 (100 %) + pack:check ; api-contracts 11 ; api-client-fetch 29 ; **0 vuln** ; Axios/Zustand absents.
**Preuve runtime réelle (PostgreSQL + MinIO jetables) 49/49** (parcours critique Auth+Files **rejoué ×2**) :
public (home 200 API up **et** down) ; Auth (anonyme→/login, login, /protected 200, /me sans token, refresh
rotation, logout→401+/login) ; Files (métadonnées 200 sans champ interne, download-url 200 {url,expiresAt},
**téléchargement réel MinIO** octets==upload image/png, **signature altérée→403**, **URL réellement expirée
(TTL 30 s)→403**) ; droits (sans files.read→403, non-propriétaire+permission→**404**, **révocation sans nouveau
JWT**→403, quarantaine→409, objet absent→503) ; **pannes** (MinIO arrêté→503 ; API arrêtée→home 200 +
/protected « indisponible » **sans contenu privé ni donnée utilisateur** + /api/files→502) ; concurrence
(double login, double download-url 200/200, isolation deux cookie jars). **Verdict :
`WEB_CORE_V1_INCREMENT_STABLE_WITH_RESERVATIONS`** (aucun défaut bloquant ; réserves : **CI + ordre de build**,
E2E navigateur ; mineures : CSP/HSTS, 429, contrastes, cache Files au logout). **Corrections documentaires
seules** (zéro comportement) : `.env.example` (+`WEB_ALLOWED_ORIGINS`), `SECURITY.md` (routes protégées
implémentées + posture Files). Statut Web Core **maintenu** `IMPLEMENTATION_PARTIELLE`. Rapport permanent :
`cores/web-nextjs/docs/WEB_CORE_V1_INCREMENT_REVIEW.md`. `packages/`/`api-nestjs/`/`ui-kit` **non modifiés**.
Commit `docs(web-nextjs): review web core v1 increment`. **Prochaine action : CI minimale (ADR-013).**

**Étape précédente — Web Core Files 1 — métadonnées & téléchargement sécurisé (lecture seule)** (`@enistere/web-nextjs`) :
première intégration **Files** du Web Core, **sans upload/suppression/admin**. Statut **inchangé**
`IMPLEMENTATION_PARTIELLE`. **BFF ciblé** (jamais un proxy générique) : `GET /api/files/:id` (métadonnées
**publiques**, client serveur **read-only** sans refresh au rendu, `no-store`) et `POST /api/files/:id/download-url`
(URL signée courte, client serveur **writable** réutilisant le refresh BFF existant, **Origin/Referer + CSRF**,
`no-store`). Ordre de garde : méthode (405) → **validation UUID** (400 **sans appel API**) → [POST : CSRF/Origin
403] → API ; seul l'**UUID** du chemin est accepté (jamais URL/bucket/storageKey/TTL/headers). Mapping d'erreurs
**distinct** (`core/files/http/files-response.ts`) préservant **404 anti-énumération** / **409** (non
téléchargeable) / **503** (stockage indisponible). **Client BFF navigateur** (`credentials:"include"`, **aucun
Bearer**, ne lit aucun token). **TanStack Query** : `fileKeys.all/detail(id)` **disjoints** de auth/health
(UUID admis, **jamais** d'URL/token) ; `useFileMetadata` (query : `enabled` si UUID, `retry:false`,
`PublicStoredFileDto`) ; **`useCreateDownloadUrl`** = **mutation** (sans `mutationKey`) dont l'URL signée est
**consommée immédiatement** (`triggerDownload`) puis **abandonnée** — **jamais** en cache/log/persistance ;
anti-double-clic. **Téléchargement** : URL `https`-only validée (`isSafeDownloadUrl` ; `javascript:`/`data:`
refusés ; signature jamais reconstruite) → **ancre temporaire** `rel="noopener noreferrer"`. Formatage **pur**
(`formatFileSize` BigInt, `formatDateTime` UTC déterministe). Page privée `/protected/files/[id]` → `FileDetails`
(hooks inconditionnels puis branche) avec états réutilisés **`LoadingState`/`EmptyState`(404)/`ForbiddenState`(403)/
`ServiceUnavailableState`(503)/`ErrorState`**, succès `PageHeader`+`Card`. **L'API reste l'autorité**
(`files.read`/`files.download` + ownership → **404** anti-énumération pour un non-propriétaire) ; `useAuthorization`
ne sert qu'à l'affichage du bouton. **Aucun champ interne** (storageKey/bucket/checksum/ownerId), `originalName`
rendu en **texte**. **307 tests** Web (+37) + **preuve API + MinIO réelle 21/21** (PostgreSQL + MinIO jetables) :
upload (auto-VALIDATED + objet) → propriétaire `GET` **200** (publics, no-store, aucun champ interne) →
`download-url` **200** `{url,expiresAt}` → **téléchargement réel MinIO** (octets == upload, `Content-Type`
image/png) → sans permission **403** → **non-propriétaire (avec permission) → 404** → quarantaine **409** → objet
supprimé **503** → logout **401** + page → `/login` ; **aucun** `storageKey`/`bucket`/`X-Amz-Signature`/credentials
en métadonnées, logs ou bundle. **Non-régression** : Web 307 + couverture + build ; UI Kit 78 ; api-contracts 11 ;
api-client-fetch 29 ; **0 vuln** ; Axios/Zustand absents. **Aucun nouveau composant UI Kit, aucun middleware,
aucun proxy.** API NestJS / `packages/` / `ui-kit` **non modifiés**. Docs : `cores/web-nextjs/docs/files-read-download.md`
(+ `api-integration.md`/`tanstack-query.md`). Commit `feat(web-nextjs): add secure file read access`.

**Étape précédente — Web Core UI 1 — états UI & composants structurels génériques** (`@enistere/ui-kit` + `@enistere/web-nextjs`) :
standardise les états d'interface et ajoute 3 primitives structurelles. Statuts **inchangés**
`IMPLEMENTATION_PARTIELLE`. **UI Kit** : `Alert` (variant info/success/warning/danger ; rôle status sauf
danger→alert ; glyphe+bordure+titre, jamais couleur seule), `Card` (slots ; `CardTitle` n'impose aucun
niveau), `FormField` (composition **explicite**, aucune injection magique) — CSS **tokens-only** (aucun hex),
`styles.css` régénéré, **78 tests** (+ jest-axe), `pack:check` OK. **Web Core** (`src/shared/components/`) :
`LoadingState`, `EmptyState`, `ErrorState` (+`requestId`), **`UnauthorizedState`(401) ≠ `ForbiddenState`(403,
permission non révélée)**, `ServiceUnavailableState` (≠ session anonyme), `PageHeader` (h1 par défaut) — chacun
`inline?`, **aucune donnée sensible**. **Intégrations** : `PageHeader` + galerie `StatesShowcase` (accueil),
`EmptyState` (Health non configuré), `ErrorState`/`NotFoundState`/`LoadingState` (frontières),
`service-unavailable-view` **délègue** à `ServiceUnavailableState` (dé-duplication ; flux Auth inchangés).
**270 tests** Web (+40). Non-régression : UI Kit (tokens/typecheck/build/lint/test/coverage 100 %/pack) ; Web
check+couverture+build ; packages 11+29 ; **0 vuln** ; Axios/Zustand absents. **Aucun framework UI lourd
(Tailwind/Radix/shadcn) ajouté.** Docs : `cores/ui-kit/docs/components.md`, `cores/web-nextjs/docs/ui-states.md`.
Commit `feat(web-ui): add standard interface states`.

**Étape précédente — Revue globale Auth Web (1 → 5)** (`@enistere/web-nextjs`) : revue **transverse de stabilisation** du socle
Auth traité comme **un système unique** — **sans nouvelle fonctionnalité**. Vérifié **fichier par fichier** +
commandes : architecture (BFF + résolution serveur + login), 6 routes BFF + `/protected` + `/login` (`ƒ`),
cookies `HttpOnly`/`__Host-`, CSRF + Origin/Referer (fail-closed), **aucune fuite de token** (greps src + bundle
`.next/static` : tous secrets absents), session (401→anonymous / 403·5xx·réseau distincts), caches disjoints +
purge login/logout, résolution serveur read-only (aucun contenu privé avant validation), `returnTo`
**anti-open-redirect**, RBAC OR/AND sans wildcard, contrats `SchemaOf<>` (`generate:check` ok), mappeurs d'erreurs
cohérents, frontières d'import (test statique). **Non-régression** : web `check` (typecheck+lint+**263 tests
×2 sans hang**+build) + couverture ≈ 86,1 % ; UI Kit 64 ; api-contracts 11 ; api-client-fetch 29 ; **0 vuln**.
**Preuve runtime rejouée (un système unique) 33/33** (NestJS + PostgreSQL jetable) : nominal (anonyme→/login→
login→/protected hydraté→/authorization) + **refresh** (rotation, `/me` read-only sans refresh) + **droits sans
nouveau JWT** + erreurs (401 sans énumération, 403 CSRF, 403 Origin) + API down (« indisponible » ≠ anonyme) +
bundle sans secret. **Verdict : `AUTH_WEB_V1_STABLE_WITH_RESERVATIONS`** (aucun défaut bloquant ; réserves
opérationnelles : CI, E2E navigateur, streaming-redirect, multi-onglets, CSP/HSTS). **Aucune correction de code
applicatif** ; statut Web Core **maintenu** `IMPLEMENTATION_PARTIELLE`. Rapport permanent :
`cores/web-nextjs/docs/WEB_AUTH_V1_REVIEW.md`. `packages/`/`api-nestjs/` non modifiés. Commit
`docs(web-nextjs): review web auth v1`.

**Étape précédente — Web Auth 5 — page de connexion & navigation Auth contrôlée** (`@enistere/web-nextjs`) : page **publique
`/login`** (Server Component `force-dynamic`) — **assainit** `returnTo` (`core/auth/return-to.ts` :
`sanitizeReturnTo`/`buildLoginRedirect`, **anti open-redirect**, testable), **résout la session côté serveur**
(déjà authentifié ⇒ **redirige** vers `returnTo`, jamais de formulaire ; anonyme ⇒ formulaire ; unavailable ⇒
formulaire + état dégradé). **Login BFF** (`core/auth/client/login-client.ts` : CSRF → `POST /api/auth/login`,
same-origin, **aucun token lu**). `features/auth` : `login-validation` (UX, mot de passe non modifié),
`login-error` (génériques, **401 sans énumération**), `use-login` (`useMutation` **sans `mutationKey`**, purge
`authKeys`, **anti-double-soumission** `useRef`), `login-form` (a11y : labels/`aria`/`autoComplete`, `jest-axe`).
**App** : `app/login/page.tsx` + `login-panel.tsx` (wiring router, exclu node:test : `router.replace(returnTo)`
+ `refresh()`). Redirection anonyme du layout protégé → `/login?returnTo=/protected`. **263 tests** (+33) +
**preuve API réelle 22/22** (anonyme `/protected`→redirection `/login` ; `/login`→formulaire ; login BFF→
`authenticated` sans token ; authentifié `/protected`→200+profil hydraté, X-Request-Id propagé ; authentifié
`/login`→redirection hors login ; **`returnTo` externe→`/protected`, aucun open redirect** ; logout→`/login` ;
401 sans énumération ; 403 CSRF ; bundle/HTML sans secret/mot de passe). **Sans middleware, sans Server Action.**
**0 vuln**, Axios/Zustand absents. API NestJS / packages **non modifiés**. Détail :
`cores/web-nextjs/docs/login-flow.md`. Commit `feat(web-nextjs): add secure login experience`.

**Étape précédente — Web Auth 4 — résolution Auth serveur + premier layout protégé** (`@enistere/web-nextjs`) : premier
**espace privé** dont la session est **résolue côté serveur** (lecture seule) puis **hydratée**. Modules
**testables** : `core/auth/resolve-server-session.ts` (`resolveServerSession` → client serveur authentifié
`read-only`, `enableRefresh:false`, appel **direct** API `/auth/me`, contrat **sans token** `authenticated|
anonymous|unavailable` ; `401`→anonymous, `403`/réseau/`5xx`/réponse invalide→unavailable ; `decideProtectedRender`),
`core/auth/read-only-cookie-store.ts` (`ReadOnlyServerCookieStore` get-only + `guardReadOnly` qui **lève** sur
écriture), `core/auth/request-id.ts` (`resolveRequestId` partagé), `features/auth/auth-queries.ts`
(`prefillSessionQuery`). **Server-only** (exclu node:test) : `core/auth/server/protected-session.ts`
(`resolveNextServerSession` via `next/headers`). **App** : `app/(protected)/layout.tsx` (Server Component,
`force-dynamic` : redirect anonyme `/?auth=required` / `ServiceUnavailableView` / hydrate+children),
`(protected)/protected/page.tsx` (`/protected`), `(protected)/error.tsx`. **230 tests** (+24) +
**preuve API réelle 26/26** (anonyme→redirection serveur sans donnée privée ; authentifié→200+profil hydraté,
aucun token HTML/RSC, X-Request-Id propagé ; cookie access retiré→redirection **sans** `/auth/refresh` ;
logout→redirection ; **API arrêtée→« Service indisponible »** ≠ anonyme ; bundle sans secret). Note : sous le
**streaming** App Router, `redirect()` est délivré en HTTP 200 (RSC `NEXT_REDIRECT` + meta-refresh) — honoré
par le navigateur, **aucune donnée privée** exposée. **0 vuln**, Axios/Zustand absents, React 19.2.7. API
NestJS / packages **non modifiés**. Détail : `cores/web-nextjs/docs/protected-routes.md`. Commit
`feat(web-nextjs): add server-resolved protected layout`.

**Étape précédente — Checkpoint de gouvernance Web Core** (revue de socle — `@enistere/web-nextjs`) : mission de
**revue/vérification/consolidation/arbitrage**, **sans** implémentation fonctionnelle (aucun
middleware/page login/route protégée). Vérifié **fichier par fichier** + commandes réelles : frontières
client/serveur, 6 routes BFF `ƒ`, 3 clients API séparés, cookies `HttpOnly`/`__Host-`, CSRF + Origin/Referer,
**aucune fuite de token** (greps + bundle `.next/static`), caches `authKeys`/`healthKeys` disjoints, RBAC
OR/AND **sans wildcard**, types `SchemaOf<>` (`generate:check` up-to-date), **read-only ⇒ aucun refresh
silencieux**. **Non-régression verte** : web `check` (typecheck+lint+**206 tests ×2 sans hang**+build) +
couverture ≈ 84,7 % ; UI Kit 64 ; api-contracts 11 ; api-client-fetch 29 ; **0 vuln** ; Axios/Zustand
absents. **Décisions** : SSR Auth = **hybride** (Option C serveur read-only pour le privé / Option A
client-only pour le public) — **pas de nouvel ADR** (couvert par ADR-004/005/012) ; middleware = UX léger
**non autoritaire**. **Dette IMPORTANTE non bloquante** : ordre de build monorepo (`packages/*/dist` non
versionnés ; aucune CI — ADR-013). **Corrections documentaires/factuelles + 1 export mort** (zéro
comportement) : `package.json`, `cookie-config.ts` (CSRF actif ; `CSRF_HEADER_NAME` supprimé),
`query-client.ts`, `README.md`, `docs/SECURITY.md`, `docs/ARCHITECTURE.md`. **Rapport permanent** :
`cores/web-nextjs/docs/WEB_CORE_GOVERNANCE_REVIEW.md`. Statut **inchangé** `IMPLEMENTATION_PARTIELLE`.
`packages/` et autres cores **non modifiés**. Commit `docs(web-nextjs): review web core governance`.

**Étape précédente — Web Auth 3 — profil, autorisations et état de session avec TanStack Query** (`@enistere/web-nextjs`) :
Route Handlers `GET /api/auth/me` + `GET /api/auth/authorization` (thin, `force-dynamic`) → handlers
testables (`core/auth/handlers/get-profile`, `get-authorization`, `(Request, deps)→Response`) appelant le
client serveur **read-only** (`enableRefresh:false` → **aucun refresh silencieux** sur une lecture ; 401
propagé), `no-store`, erreurs génériques. **Client BFF navigateur** (`core/auth/client/`) : appels
**same-origin** `/api/auth/*`, `credentials:"include"`, **aucun token lu/exposé**, valide l'enveloppe
`{success,data}`, lève `BffAuthError` (http/network/invalid_response). **TanStack Query** : `authKeys`
(disjoints de `healthKeys`), `sessionQueryOptions`/`authorizationQueryOptions` (`retry:false`, sans
persistance). **`useSession`** : `loading` → `authenticated` → **`anonymous` (401, pas une erreur)** /
**`error` (403/5xx/réseau, 403 distinct d'anonyme)** ; `toPublicAuthError` (générique, sans cause/token).
**`useAuthorization`** : activé **uniquement** si authentifié (aucun appel `/authorization` en anonyme),
helpers `hasRole`/`hasAnyRole`/`hasPermission`/`hasAllPermissions` (**OR/AND, sans wildcard**, ADR-006 ;
affichage conditionnel — **API = autorité finale**). **`useLogout`** : CSRF → `POST /api/auth/logout` →
`removeQueries(authKeys.all)` (**Auth purgé, Health conservé**) ; **échec réseau → pas de purge** (retry).
UI présentationnelle (SessionStatus/AuthorizationStatus + a11y). **206 tests** + **preuve API réelle Auth +
session** (NestJS + PostgreSQL : login → `/me` (profil, **aucun token**, `X-Request-Id`, `no-store`) →
`/authorization` (rôles/permissions) → logout → `/me` **401** ; **read-only sans appel `/auth/refresh`** ;
**changement de droits sans nouveau JWT** : retrait de rôle → `roles:[],permissions:[]` sur la même session,
`/me` toujours 200 ; bundle client **sans** `API_INTERNAL_URL` ni secret). **0 vuln**, Axios/Zustand absents,
React 19.2.7 ; non-régression complète ; API NestJS/packages non modifiés. Commit
`feat(web-nextjs): add session and authorization state`.

## 9. Prochaine étape

**Décision roadmap (revue stratégique 2026-06-11 — [`ROADMAP_ALIGNMENT_REVIEW.md`](./ROADMAP_ALIGNMENT_REVIEW.md))** :
**Cloud Core mis en PAUSE contrôlée** après CC1–9 (CI + GHCR + staging local) ; **Cloud Core 10** (serveur réel)
**reporté** jusqu'à disponibilité d'un serveur + HTTPS/DNS/pare-feu (dépendance **externe**, hors socle). **Retour
aux priorités V1 de la roadmap** (§7.2/§30) : **Mobile Core React Native** était la priorité #2 V1.

**✅ Mobile Core React Native 1 — starter foundation : RÉALISÉ** (cette mission). `mobile-react-native` →
**`STARTER_FOUNDATION_INITIEE`** : starter **Expo SDK 55** / Expo Router (navigation publique+authentifiée + gate
+ not-found ; **shell auth sans backend** ; **secure storage** SecureStore ADR-015 — access token en mémoire,
refresh token persistant ; **transport `fetch`** générique ADR-011 en **seam** vers `@enistere/api-client-fetch`
ADR-016 ; **TanStack Query** ADR-012 ; **ThemeProvider + tokens** ADR-008/010 ; **états standards**). Layout plat,
autonome (hors workspaces). **typecheck + lint + expo-doctor 19/19 verts** ; **aucune logique métier**. Cloud Core
reste **PAUSE_CONTROLEE**, staging **EXECUTION_LOCALE_CONTROLEE** ; aucun autre core démarré.

**Action unique (mission Codex suivante)** : **Mobile Core React Native 2 — auth/session hardening** — refresh
token **réel**, **intégration `@enistere/api-client-fetch`** (workspace racine + Metro monorepo), persistance/
expiration de session, **tests** (auth flow, token storage, navigation), **sans logique métier**, **un seul
core**. (Différés au-delà : Zustand, RHF/Zod, upload, notifications, logger.) Le **Cloud Core 9** (exécution
staging **locale** Type D) est **terminé** : stack réelle (images
corrigées) `healthy`, health 200, endpoint Option A joignable ; URL signée + Auth/Files **non validés en réel**
(repris en **CC10 sur serveur**). **Actions HUMAINES** : confirmer la protection de branche `main` (7 checks +
`images`) et **rendre `api-smoke` requis**. **Alternative (décision humaine)** : UI Kit 4 (primitives
interactives) ; reprise **Cloud Core 10** si un serveur réel devient disponible. **Ne pas créer de production ni
d'automatisation de déploiement.** Détail : [`NEXT_ACTIONS.md`](./NEXT_ACTIONS.md).

## 10. Règles à ne pas violer

- Vérifier le repository ; ne jamais se fier au seul rapport précédent.
- Ne jamais inventer un starter ni déclarer « validé » sans tests + revue.
- Ne pas confondre ADR / spécification / preuve / package / intégration.
- Un seul core par mission ; ne pas modifier API Core ou packages sans mission dédiée.
- Signaler tout état Git non propre ; ne pas supprimer une preuve sans remplacement vérifié.
- Mettre à jour `docs/project-status/` + `CHANGELOG.md` en fin de mission.

## 11. Fichiers à lire (dans l'ordre)

1. `docs/project-status/SESSION_HANDOFF.md` (ce fichier)
2. `docs/project-status/FOUNDATION_CURRENT_STATE.md`
3. `docs/project-status/IMPLEMENTATION_MATRIX.md`
4. `docs/project-status/NEXT_ACTIONS.md`
5. `docs/project-status/DECISIONS_REGISTER.md`
6. Pour le API Core : `cores/api-nestjs/docs/API_CORE_V1_IMPLEMENTATION_STATUS.md`

## 12. Commandes utiles

```bash
# Vérifier l'état réel
git status --short
find cores -maxdepth 2 -type f | sort
ls packages/*/

# API Core (cores/api-nestjs/) — nécessite PostgreSQL + MinIO jetables pour e2e
npm run build && npm run lint && npm run test
npm run openapi:check

# Packages (racine)
npm install && npm run build && npm test && npm run generate:check

# UI Kit (cores/ui-kit/)
npm run test --workspace=@enistere/ui-kit

# Web Core (cores/web-nextjs/) — port 3100
npm run check --workspace=@enistere/web-nextjs   # typecheck + lint + test + build
```
