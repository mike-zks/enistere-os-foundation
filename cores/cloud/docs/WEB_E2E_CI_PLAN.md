# Cloud Core — E2E navigateur Web (niveau 3)

> **IMPLÉMENTÉ (Cloud Core 3)** — workflow **`.github/workflows/web-e2e-ci.yml`** + suite Playwright
> (`cores/web-nextjs/e2e/`). Ce document a servi de plan ; il décrit désormais le niveau 3 réel. Toujours
> **sans** déploiement, registry/GHCR, secret GitHub. Aligné sur `CLOUD_CORE_V1_EXECUTION_BASELINE.md` §13, la
> revue `cores/web-nextjs/docs/WEB_CORE_V1_INCREMENT_REVIEW.md` (réserve « E2E navigateur ») et ADR-013.

## 0. Implémentation réelle (`web-e2e-ci.yml` + `cores/web-nextjs/e2e/`)

- **Outil** : **Playwright** (`@playwright/test`, devDep du workspace Web) + **Chromium** headless
  (`playwright install --with-deps chromium`). Pas de Cypress, pas de Storybook.
- **Isolation niveau 1** : `e2e/` et `playwright.config.ts` **exclus** de `typecheck`/`lint`/`build`
  (`tsconfig.json` `exclude` + `eslint.config.mjs` `ignores`) — Playwright compile lui-même les specs.
- **Orchestration (workflow)** : PostgreSQL (`postgres:16`, `services:`) + MinIO (`docker run` + bucket) →
  `npm ci` + build paquets → `e2e:install` (Chromium) → API (autonome : `npm ci`, prisma generate/
  **migrate:deploy**/seed, build, démarrage + attente `/health/ready`) → **seed utilisateurs** éphémères
  (`proof-seed-user.ts` → propriétaire + sans-permission via `$GITHUB_ENV`) → build + démarrage Web
  (`next start`, `APP_ENV=development` pour cookies HTTP) → **`playwright test`**.
- **Fixture** : `e2e/global-setup.ts` se connecte à l'API et **téléverse un fichier VALIDATED** éphémère →
  `e2e/.state.json` (gitignoré) ; **aucun token/URL signée journalisé**.
- **Validé localement par simulation** (mêmes services/env/étapes, Chromium réel) — voir le rapport de mission.

## 1. Objectif

Pérenniser en CI les **parcours navigateur** aujourd'hui rejoués manuellement (preuves runtime) : Health,
Auth (login/refresh/logout, protection des routes) et Files (métadonnées + téléchargement), contre une stack
réelle **éphémère**, **sans secret**.

## 2. Stack envisagée (indicative, non créée)

- **API NestJS** + **PostgreSQL** + **MinIO** (services éphémères, cf. `API_RUNTIME_CI_PLAN.md`).
- **Web Next.js** démarré (`next start`) avec `API_INTERNAL_URL`/`NEXT_PUBLIC_API_URL`/`WEB_ALLOWED_ORIGINS`
  de **test** (valeurs jetables, non sensibles).
- Outil E2E **à décider** : Playwright (candidat principal) ou alternative — **décision différée** (ADR léger
  possible si structurant).

## 3. Parcours cibles (indicatifs)

```text
Health        : page d'accueil, API disponible / indisponible (état contrôlé)
Auth          : anonyme /protected → /login ; login ; /protected hydraté ;
                refresh ; logout → /login ; returnTo interne (anti open-redirect)
Files         : /protected/files/[id] métadonnées ; téléchargement (URL signée) ;
                404 anti-énumération ; 403 sans permission ; 503 stockage indisponible
```

## 4. Contraintes

- **Données éphémères** : utilisateurs + fichiers créés puis détruits ; aucun seed permanent.
- **Captures uniquement en cas d'échec** (artefacts non sensibles ; jamais de cookie/token/URL signée dans
  les traces).
- **Aucun secret** : valeurs de test factices ; aucun `secrets.*`.
- **Stabilité** : éviter la flakiness (attentes explicites sur les états UI, pas de `sleep` arbitraire).
- **Temps CI** : déclenchement ciblé (push `main` / PR touchant le Web) si trop long pour chaque PR.

## 5. Prérequis avant implémentation

- CI runtime API (niveau 2) opérationnelle (la stack API+PG+MinIO doit déjà se monter en CI).
- Choix de l'outil E2E + intégration `node:test`/Playwright tranchée.
- Sélecteurs accessibles stables (rôles ARIA déjà présents : `role=alert/status`, labels).
- Politique d'artefacts (rétention courte, non sensibles).

## 6. Hors périmètre (toujours non couvert)

**Upload/suppression Files côté Web** (non implémentés côté produit), nouvelle feature Auth/UI, déploiement,
registre/GHCR (ADR-014), environnements protégés, monitoring, rollback, **upload d'artefacts** (les traces/
captures Playwright sont `retain-on-failure`, non poussées). Le niveau suivant est **4** (registry/déploiement).

## 7. Gouvernance (Cloud Core 4)

Check à exiger sur `main` : **`web-e2e`** (= `name:` du job). **Artefacts = Option A** (aucun upload ; traces
locales `retain-on-failure`) ; Option B (upload `if: failure()`, rétention courte, dossier Playwright seul,
sans logs d'env/`.state.json`/cookies/URL signée) = évolution future. Cf. `CLOUD_CORE_V1_EXECUTION_BASELINE.md`
§8 bis et `GITHUB_BRANCH_PROTECTION_CHECKLIST.md`.
