# NEXT_ACTIONS.md — Prochaines actions autorisées

> Vérifié depuis le repository (2026-06-10). Ordre cohérent avec l'état réel, les dépendances, les ADR
> validés et les packages déjà disponibles. **Une seule action à la fois.**

## 1. Prochaine action UNIQUE

> **Cloud Core 6 — déploiement staging manuel** : premier déploiement **contrôlé** d'une image GHCR vers un
> environnement **staging** (GitHub **Environment** protégé, secrets scoppés, **approbation manuelle**), à
> partir des images déjà publiées par `registry-ci.yml`. **Pas de production**, pas d'automatisation totale,
> rollback documenté. **Alternative** : **durcissement registry** (scan de vulnérabilité d'image + signature/
> provenance cosign/SLSA + SHA-pinning des actions) avant tout déploiement.
>
> **(Action HUMAINE, en parallèle)** **Appliquer la protection de branche `main`** (désormais possible — repo
> **public**) : rendre **bloquants** les **7 checks** (+ `images` recommandé) selon
> `cores/cloud/docs/GITHUB_BRANCH_PROTECTION_CHECKLIST.md`. **Non réalisable par un agent.**

**Justification** : le **Cloud Core 5 — Registry GHCR sans déploiement** est **terminé** (commit `ci(cloud):
add ghcr registry workflow`) : Dockerfiles API/Web (multi-stage, **non-root**, Web **standalone**) + workflow
`registry-ci.yml` (build PR sans push ; **build + push GHCR sur `main`** ; tags immuables `sha-`/`main-`, **pas
de `latest`**, labels OCI, auth `GITHUB_TOKEN`, **aucun secret/PAT/`.env`**) — **`docker build` API+Web validé
localement**. ADR-014 → **`PARTIELLEMENT_IMPLEMENTE`**. Les images existent désormais ; la suite logique est un
**premier déploiement contrôlé** (staging manuel) **ou** le durcissement de la chaîne registry avant déploiement.
**Ne pas** automatiser un déploiement production sans environnement protégé + rollback.

**Alternative (justifiée, décision humaine)** : **UI Kit 4** (primitives interactives) ; **Files 2** (upload
Web) ; **Mobile Core**.

**Note gouvernance** : `main` est poussé sur `origin` (SSH) ; **repo désormais public** (protection de branche
applicable gratuitement). Cette mission ajoute le commit `ci(cloud): add ghcr registry workflow` ; statuts :
Cloud Core **`IMPLEMENTATION_PARTIELLE`**, ADR-013 **`PARTIELLEMENT_IMPLEMENTE`** (niveaux 1–4 partiel), ADR-014
**`PARTIELLEMENT_IMPLEMENTE`**.

## 2. Actions immédiatement suivantes (ordre recommandé)

1. **Cloud Core 6 — déploiement staging manuel** (environnement protégé, approbation, rollback documenté) **ou** durcissement registry (scan/signature/SHA-pinning). ✦ prochaine mission Codex.
2. **(Humain)** Appliquer la **protection de branche `main`** (8 checks recommandés) — `GITHUB_BRANCH_PROTECTION_CHECKLIST.md`. ✦ action humaine, en parallèle.
3. **UI Kit 4** — primitives interactives (Dialog/Select/Toast) — si features riches imminentes.
4. **Web Core Files 2** — upload sécurisé côté Web (multipart, finalisation, états).
5. **Mobile Core React Native minimal** — starter Expo/RN ; intégration `api-client-fetch` ; secure storage (ADR-015) ; tokens via ThemeProvider (ADR-010).

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
| Cloud Core 5 — Registry GHCR (niveau 4 partiel) | **FAIT** — `registry-ci.yml` + Dockerfiles API/Web (multi-stage, non-root, Web standalone) ; build PR sans push, push GHCR sur `main`, tags immuables, labels OCI, `GITHUB_TOKEN` ; `docker build` validé local ; ADR-014 → partiel |
| Protection de branche `main` | **débloqué (action humaine, repo public)** — checklist `GITHUB_BRANCH_PROTECTION_CHECKLIST.md` (7 checks + `images`) ; **non applicable par un agent** (GitHub Settings) |
| Cloud Core 6 — déploiement staging manuel | **débloqué** — prochaine mission ; déployer une image GHCR vers staging protégé (approbation, rollback) ; ou durcissement registry |
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
