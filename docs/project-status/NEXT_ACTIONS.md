# NEXT_ACTIONS.md — Prochaines actions autorisées

> Vérifié depuis le repository (2026-06-10). Ordre cohérent avec l'état réel, les dépendances, les ADR
> validés et les packages déjà disponibles. **Une seule action à la fois.**

## 1. Prochaine action UNIQUE

> **Cloud Core 8 — corriger l'image runtime API NestJS (moteur de requête Prisma)** : faire en sorte que
> l'image **démarre** sur sa base runtime (Debian bookworm / OpenSSL **3.0.x**) — générer/embarquer le
> `libquery_engine-debian-openssl-3.0.x` dans `.prisma/client` (binaryTargets / base de build cohérente) —
> puis **re-jouer le dry-run** (`STAGING_DRY_RUN_REPORT.md`) et **trancher la stratégie migrations** (depuis
> l'image — CLI + schema-engine présents — vs depuis les sources). **Verrou n°1** : **aucune exécution staging
> réelle possible** tant que l'image API crash-loop.
>
> **(Action HUMAINE, si pas déjà fait)** confirmer la **protection de branche `main`** (7 checks + `images`).

**Justification** : le **Cloud Core 7 — préparation serveur staging & dry-run contrôlé** a **exécuté un dry-run
local réel** (2026-06-11) à partir des **images GHCR immuables** (`sha-7b07e5e`) + `.env.staging` **réel hors
dépôt** (secrets jetables, supprimé après). Résultats (`cores/cloud/docs/STAGING_DRY_RUN_REPORT.md`) :
✅ `docker compose config` valide (tag immuable, aucun `latest`), images **tirées en anonyme**, `postgres
healthy` + `minio` + bucket, **image Web boote** (HTTP 200) ; ❌ **défaut BLOQUANT** : l'**image API ne démarre
pas** (query engine Prisma **OpenSSL 1.1.x** dans `.prisma/client` vs runtime **bookworm 3.0.x** → crash-loop,
`/health/ready` jamais vert), **invisible à la CI** (`api-runtime-ci` tourne depuis les **sources** ;
`registry-ci` ne fait que **construire** l'image). Corrections induites : runbook (l'image **embarque** le CLI
Prisma → « CLI absent » faux) ; **décision MinIO/URL signée** tranchée (Option A). La suite logique et
**unique** est donc de **corriger l'image** avant toute exécution réelle. **Ne pas** créer de production ni
d'automatisation de déploiement. **Flux PR obligatoire** (push direct `main` refusé par la protection).

**Alternative (justifiée, décision humaine)** : **durcissement registry** (scan/signature/SBOM) ; **UI Kit 4** ;
**Files 2** (upload Web) ; **Mobile Core**.

**Note gouvernance** : `main` protégé (**repo public**, flux PR). **CC6 mergé** (PR #4 → `b001ce8`) ; **CC6B
mergé** (PR #5 → `7b07e5e`) ; **CC7** (cette mission) exécute le **dry-run** et ajoute le commit
`docs(cloud): prepare staging dry run` (rapport + runbooks + checkpoint) via PR. Statuts **inchangés** : Cloud
Core **`IMPLEMENTATION_PARTIELLE`**, ADR-013 **`PARTIELLEMENT_IMPLEMENTE`** (niveaux 1–4 partiel),
ADR-014 **`PARTIELLEMENT_IMPLEMENTE`** ; déploiement staging **`DRY_RUN_EXECUTE`** (dry-run exécuté, **défaut
bloquant image API** → exécution réelle BLOQUÉE ; **non** opérationnel/automatisé). **Aucun statut augmenté.**

## 2. Actions immédiatement suivantes (ordre recommandé)

1. **Cloud Core 8 — corriger l'image runtime API NestJS (moteur Prisma)** puis re-dry-run + stratégie migrations. ✦ prochaine mission Codex. *(Puis : exécution réelle staging sur serveur, secrets hors dépôt ; ou durcissement registry scan/signature/SBOM + smoke-run image en CI.)*
2. **UI Kit 4** — primitives interactives (Dialog/Select/Toast) — si features riches imminentes.
3. **Web Core Files 2** — upload sécurisé côté Web (multipart, finalisation, états).
4. **Mobile Core React Native minimal** — starter Expo/RN ; intégration `api-client-fetch` ; secure storage (ADR-015) ; tokens via ThemeProvider (ADR-010).

**Alternative envisageable (justifiée)** : avancer **Cloud Core / CI-CD (ADR-013)** plus tôt pour
sécuriser la non-régression (aucune CI aujourd'hui) et préparer la publication des packages. Reste
**non recommandé en premier** car il n'apporte pas de valeur produit immédiate et le UI Kit débloque
deux cores. À arbitrer par décision humaine.

## 3. Actions bloquées

| Action | Bloquée par |
|---|---|
| Intégrer les packages API (public) dans le Web Core | **FAIT** — `api-client-fetch` instancié (Health), preuve API réelle |
| Usage **authentifié** des packages (Web) | **FAIT** — login/refresh/logout + CSRF (Web Auth 2) **et** me/authorization + session/autorisations (Web Auth 3), preuve API réelle |
| Premier layout/route protégé (Web) | **FAIT** — Web Auth 4 : résolution serveur read-only (Option C) + hydratation, page `/protected` |
| Page de connexion `/login` + navigation Auth (Web) | **FAIT** — Web Auth 5 : formulaire, login BFF, `returnTo` interne assaini, `replace`/`refresh`, preuve API réelle 22/22 |
| Bloc **Auth Web (1→5)** stable V1 ? | **REVU** — verdict **`AUTH_WEB_V1_STABLE_WITH_RESERVATIONS`** (`WEB_AUTH_V1_REVIEW.md`) : sûr/cohérent, aucun défaut bloquant ; réserves opérationnelles (CI, E2E, streaming-redirect, multi-onglets, CSP) |
| Auth post-V1 (register/reset/OAuth/MFA) | **hors périmètre V1** — ne pas poursuivre l'Auth |
| États UI & composants structurels (Web/UI Kit) | **FAIT** — Web UI 1 : Alert/Card/FormField (UI Kit, 78 tests) + LoadingState/EmptyState/ErrorState/Unauthorized/Forbidden/ServiceUnavailable/PageHeader (Web, 270 tests), intégrés + axe |
| Files Web (lecture/téléchargement) | **FAIT** — Web Core Files 1 : BFF ciblé `GET /api/files/:id` + `POST /api/files/:id/download-url`, client BFF, `fileKeys`, `useFileMetadata`/`useCreateDownloadUrl` (URL jamais en cache), page `/protected/files/[id]`, **307 tests** + preuve API+MinIO 21/21 |
| Revue globale Web Core (incrément V1) | **FAIT** — verdict **`WEB_CORE_V1_INCREMENT_STABLE_WITH_RESERVATIONS`** (`WEB_CORE_V1_INCREMENT_REVIEW.md`) : 307 tests ×2 + runtime réel 49/49, aucun défaut bloquant ; réserves : CI/ordre de build, E2E |
| CI minimale (ADR-013) | **FAIT** — `.github/workflows/ci.yml` (GitHub Actions, ordre de build imposé, `npm ci` Node 24, audit, gardes deps) ; ADR-013 **partiel** (restent branch protection, E2E, runtime API, déploiement) |
| Cloud Core 1 — cadrage CI/CD & environnements | **FAIT** — `cores/cloud/docs/` (baseline, environnements, checklist branch protection, politique CI 4 niveaux, secrets/registry, plans) |
| Cloud Core 2 — CI runtime API (niveau 2) | **FAIT** — `.github/workflows/api-runtime-ci.yml` (PostgreSQL+MinIO jetables, migrations, unit+e2e, openapi:check, build, audit) |
| Cloud Core 3 — E2E navigateur (niveau 3) | **FAIT** — `.github/workflows/web-e2e-ci.yml` + `cores/web-nextjs/e2e/` (Playwright/Chromium ; stack réelle API+PG+MinIO+Web ; Health/Auth/Files ; **7 tests verts** en simulation) |
| Cloud Core 4 — durcissement CI & gouvernance | **FAIT** — 7 checks `main` figés + checklist actionnable + politiques artefacts/couverture/pinning/actionlint tranchées ; workflows inchangés |
| Cloud Core 5 — Registry GHCR (niveau 4 partiel) | **FAIT + MERGÉ + VALIDÉ** (PR #1 `b41a953`, vérif PR #2 `bfd33dc`) — `registry-ci.yml` + Dockerfiles API/Web ; **Registry CI verte sur `main`**, **images GHCR publiques** `api-nestjs`/`web-nextjs` (tags `main-`/`sha-`, **pas de `latest`**) ; ADR-014 → partiel |
| Protection de branche `main` | **APPLIQUÉE** (repo public) — la PR est désormais **exigée** (push direct `main` refusé). Vérifier que les 7 checks (+ `images`) sont bien requis |
| Cloud Core 6 — déploiement staging manuel | **FAIT + MERGÉ** (PR #4 → `b001ce8`) — `cores/cloud/staging/` + runbooks ; `CADRE_MANUEL_DOCUMENTE` ; checks requis **verts** (PR + `main`), images GHCR `main-b001ce8` publiées (pas de `latest`) |
| Cloud Core 7 — préparation serveur staging & dry-run contrôlé | **FAIT** — **dry-run local réel** (images GHCR `sha-7b07e5e`, `.env` hors dépôt) : `compose config`/`pull` OK, **image Web boote**, **MAIS image API crash-loop** (Prisma engine OpenSSL 1.1.x vs runtime bookworm 3.0.x) → staging `DRY_RUN_EXECUTE` (**défaut bloquant**) ; décision MinIO Option A ; runbook migrations corrigé. Détail `STAGING_DRY_RUN_REPORT.md` |
| Cloud Core 8 — corriger l'image runtime API (Prisma engine) | **débloqué** — prochaine mission ; image API doit **démarrer** (query engine debian-openssl-3.0.x) puis re-dry-run + stratégie migrations ; **puis** exécution réelle staging |
| Exécution réelle staging sur serveur | **BLOQUÉE** par le défaut image API (CC8) ; ensuite : serveur + secrets hors dépôt + `S3_ENDPOINT` public (Option A) |
| Files Web (upload) | **débloqué** — c'est **Web Core Files 2** ; non prioritaire (pas de défaut bloquant ; CI désormais en place) |
| Middleware Auth « autoritaire » (Web) | **rejeté (checkpoint)** — un middleware ne valide pas un token / ne connaît pas la révocation ; UX léger (présence de cookie) seulement |
| Intégrer les packages dans le Mobile | starter Mobile inexistant |
| Publier les packages | **CI minimale présente** (ADR-013 partiel) mais **registry/publication non décidés** (ADR-014 non implémenté) |
| Mobile Core Flutter | spécification absente + **ADR-034 non rédigé** |
| Web Core Angular | spécification absente + **ADR-035 non rédigé** |
| AI / Docs / Quality Cores | spécifications absentes |
| API Core Spring Boot | spécification absente |

## 4. Prérequis

- Commit Git de référence (gouvernance) — **avant tout**.
- Pour UI Kit : aucun prérequis technique manquant (ADR-008/009/010 Validés).
- Pour Web/Mobile : UI Kit initialisé + packages disponibles (déjà le cas).

## 5. Critères d'entrée (avant de démarrer la prochaine action)

1. Avoir lu `SESSION_HANDOFF.md`, `FOUNDATION_CURRENT_STATE.md`, `IMPLEMENTATION_MATRIX.md`, ce fichier.
2. Avoir vérifié le repository réel (ne rien supposer absent de la matrice).
3. Avoir signalé toute divergence entre les docs de statut et le repository.
4. Disposer d'une mission **explicite** ciblant **un seul** core.

## 6. Critères de sortie (fin de la prochaine action)

1. Core ciblé exécutable (build + lint + typecheck + tests verts) **et** revu.
2. Aucune régression du API Core, du UI Kit ni des packages.
3. `docs/project-status/` mis à jour (matrice, état, décisions si l'implémentation change, prochaines actions, handoff).
4. `CHANGELOG.md` mis à jour.
5. État Git propre / commit effectué.

## 7. Interdits pour la prochaine mission

- Initialiser **plus d'un** core à la fois.
- Modifier le API Core ou les packages sans mission explicite dédiée.
- Modifier des ADR ou des `CORE_SPECIFICATION.md` sans décision.
- Ajouter des dépendances non couvertes par un ADR validé.
- Déclarer un core « validé » sans tests + revue.
- Supprimer une preuve sans vérifier qu'elle est remplacée.
