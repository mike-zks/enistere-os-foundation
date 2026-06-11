# NEXT_ACTIONS.md — Prochaines actions autorisées

> Vérifié depuis le repository (2026-06-10). Ordre cohérent avec l'état réel, les dépendances, les ADR
> validés et les packages déjà disponibles. **Une seule action à la fois.**

## 1. Prochaine action UNIQUE

> ✅ **Mobile Core React Native 1 — starter foundation : RÉALISÉ** (`mobile-react-native` →
> **`STARTER_FOUNDATION_INITIEE`**). Starter **Expo SDK 55** / Expo Router : navigation **publique+authentifiée**
> + gate + not-found ; **shell auth sans backend** ; **secure storage** SecureStore (ADR-015 : access token en
> mémoire, refresh token persistant) ; **transport `fetch`** générique (ADR-011) en **seam** vers
> `@enistere/api-client-fetch` (ADR-016) ; **TanStack Query** (ADR-012) ; **ThemeProvider + tokens** (ADR-008/010) ;
> **états standards**. Vérifs : **typecheck + lint + expo-doctor 19/19 verts**. **Aucune logique métier.**
>
> **Prochaine action UNIQUE : Mobile Core React Native 2 — auth/session hardening** : refresh token **réel**,
> **intégration `@enistere/api-client-fetch`** (workspace + Metro monorepo), persistance/expiration de session,
> **tests** (auth flow, token storage, navigation). **Un seul core**, **sans logique métier**. Différés au-delà :
> **Zustand** (état local), **React Hook Form + Zod**, **upload `fetch + FormData`**, **notifications**, **logger**.
>
> **(Décision roadmap)** **Cloud Core en PAUSE contrôlée** (cf. [`ROADMAP_ALIGNMENT_REVIEW.md`](./ROADMAP_ALIGNMENT_REVIEW.md)) ;
> **Cloud Core 10** (serveur staging réel + HTTPS/DNS/pare-feu) **reporté** jusqu'à disponibilité d'un **serveur
> réel** (dépendance **externe**, hors socle). **(Actions HUMAINES)** confirmer la **protection de branche `main`**
> (7 checks + `images`) et **ajouter `api-smoke`** aux checks requis.

**Justification** : la **revue stratégique d'alignement** (2026-06-11, `ROADMAP_ALIGNMENT_REVIEW.md`) constate que
la séquence **Cloud Core 1→9** a livré une **vraie valeur** (CI non-régression, **images GHCR bootables** après
le fix CC8, `api-smoke`, runbooks, **staging local exécuté**) mais a **dépassé l'ordre roadmap** : la CI/CD est
**V2** et le registry/staging **V3/VF**, tandis que **Mobile Core RN (V1 #2)** n'a **jamais** été démarré. Le
prochain pas Cloud (**CC10 serveur réel**) dépend de **ressources externes indisponibles** et relève de l'**ops
par déploiement**, pas du **socle réutilisable** → **point d'arrêt raisonnable**. La suite **unique** la plus
alignée est donc de **revenir aux priorités V1** et d'**initialiser Mobile Core RN**. **Ne pas** créer de
production ni d'automatisation de déploiement. **Flux PR obligatoire** (push direct `main` refusé).

**Alternative (justifiée, décision humaine)** : **durcissement registry** (scan/signature/SBOM) ; **UI Kit 4** ;
**Files 2** (upload Web) ; **Mobile Core**.

**Note gouvernance** : `main` protégé (**repo public**, flux PR). **CC6** mergé (PR #4 → `b001ce8`) ; **CC6B**
mergé (PR #5 → `7b07e5e`) ; **CC7** mergé (PR #6 → `5118283`) ; **CC8** mergé (PR #7 → `d1e6242` — image API
corrigée + `api-smoke`) ; **CC8B/8C** post-merge validé (images corrigées publiées `sha-d1e6242`) ; **CC9**
(cette mission) **exécute la stack en local Type D** (images corrigées, health verts, endpoint Option A joignable)
et ajoute le commit `docs(cloud): record controlled staging execution` (rapport + checkpoint) via PR. Statuts :
Cloud Core **`IMPLEMENTATION_PARTIELLE`**, ADR-013 **`PARTIELLEMENT_IMPLEMENTE`**, ADR-014
**`PARTIELLEMENT_IMPLEMENTE`** ; déploiement staging **`EXECUTION_LOCALE_CONTROLEE`** (stack exécutée en **local**,
sans serveur réel/HTTPS/exposition ; URL signée + Auth/Files **non validés** ⇒ **non** opérationnel/production).
**CC9 mergé (PR #9 → `5589198`).** **Revue stratégique d'alignement** (cette mission, `ROADMAP_ALIGNMENT_REVIEW.md`)
→ **décision : Cloud Core en PAUSE contrôlée**, **retour priorités V1 → Mobile Core RN 1** ; commit
`docs(project): review roadmap alignment after cloud core` via PR. **Aucun statut augmenté.**
**Aucun statut augmenté.**

## 2. Actions immédiatement suivantes (ordre recommandé)

1. ✅ **Mobile Core React Native 1 — starter foundation** (priorité **#2 V1** roadmap) — **RÉALISÉ** : starter Expo SDK 55 + Expo Router ; navigation auth/privé ; transport `fetch` (seam `api-client-fetch`) ; TanStack Query ; secure storage (ADR-015) ; ThemeProvider+tokens (ADR-010) ; états standards ; typecheck/lint/doctor verts. *(Sans logique métier ; un seul core.)*
2. **Mobile Core React Native 2 — auth/session hardening** ✦ **prochaine mission** — refresh réel + intégration `@enistere/api-client-fetch` + persistance/expiration session + tests. *(Sans logique métier ; un seul core.)*
3. **UI Kit 4** — primitives interactives (Dialog/Select/Toast) — débloque Mobile/Web riches.
3. **Cloud Core 10 — préparation serveur staging sécurisé** — **reporté** (dépend d'un serveur réel + HTTPS/DNS/pare-feu ; Cloud en **pause contrôlée**).
4. **Web Core Files 2** — upload sécurisé côté Web (multipart, finalisation, états).

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
| Cloud Core 8 — corriger l'image runtime API (Prisma engine) | **FAIT + MERGÉ** (PR #7 → `d1e6242`) — `binaryTargets debian-openssl-3.0.x` + `openssl` au stage build → moteur 3.0.x ; **`api-smoke`** gate le push. **CC8B post-merge VÉRIFIÉ** : `api-smoke` + push GHCR **success**, **images corrigées publiées** (`sha-d1e6242` API/Web, no `latest`), image API **démarre** (dry-run post-merge `healthy`, 200/200/200) |
| Cloud Core 9 — exécution staging contrôlée | **FAIT (local Type D)** — stack réelle (images GHCR corrigées `sha-d1e6242`), migrations depuis l'image, **API/Web `healthy`**, `/health/live`+`/health/ready`+`/`+`/login`=200, endpoint MinIO Option A **joignable** ; ⚠️ **non validé** : URL signée bout-en-bout + Auth/Files (pas d'utilisateur ; seed bloqué) ; **pas de serveur réel/HTTPS** → `EXECUTION_LOCALE_CONTROLEE` |
| Cloud Core 10 — préparation serveur staging sécurisé | **REPORTÉ (Cloud en pause contrôlée)** — dépend d'un **serveur réel** + HTTPS/DNS/pare-feu + SSH (ressource externe) ; reprise pour valider **en réel** URL signée (presign API, Option A) + Auth/Files |
| **Mobile Core React Native 1 — starter foundation** | **FAIT** — `mobile-react-native` → **`STARTER_FOUNDATION_INITIEE`** : starter Expo SDK 55 + Expo Router (navigation publique/authentifiée, shell auth sans backend, secure storage SecureStore ADR-015, transport `fetch` ADR-011 en seam vers `api-client-fetch` ADR-016, TanStack Query ADR-012, ThemeProvider+tokens ADR-008/010, états standards) ; typecheck + lint + expo-doctor 19/19 verts ; aucune logique métier |
| **Mobile Core React Native 2 — auth/session hardening** | **PROCHAINE MISSION** — refresh token réel + intégration `@enistere/api-client-fetch` (workspace + Metro monorepo) + persistance/expiration session + tests (auth/token storage/navigation) |
| Files Web (upload) | **débloqué** — c'est **Web Core Files 2** ; non prioritaire (pas de défaut bloquant ; CI désormais en place) |
| Middleware Auth « autoritaire » (Web) | **rejeté (checkpoint)** — un middleware ne valide pas un token / ne connaît pas la révocation ; UX léger (présence de cookie) seulement |
| Intégrer les packages dans le Mobile | **planifié en Mobile Core RN 2** — le starter RN 1 expose un **seam** (transport `fetch` générique) ; l'intégration de `@enistere/api-client-fetch` requiert workspace racine + Metro monorepo (hors périmètre RN 1) |
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
