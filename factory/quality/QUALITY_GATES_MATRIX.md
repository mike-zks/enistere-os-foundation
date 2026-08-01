# QUALITY_GATES_MATRIX.md — Matrice des gates qualité

> Gates qualité réels du monorepo Enistere OS Foundation.
> Dernière mise à jour : 2026-07-25 (FastAPI baseline v2 — ADR-062).
>
> **Script de sélection locale** : `node factory/quality/scripts/quality-gates.mjs plan <scope>`
> Scopes : `docs` | `packages` | `ui-kit` | `web` | `web-angular` | `root-audit` | `mobile-static` | `api-spring` | `all-safe`
>
> **Synthèse tests/couverture locale** : `node factory/quality/scripts/quality-report.mjs markdown`
>
> Légende CI : **L1** = `ci.yml` (non-régression monorepo) ; **L2** = `api-runtime-ci.yml`
> (runtime API : PG+MinIO) ; **L3** = `web-e2e-ci.yml` (E2E navigateur Playwright) ;
> **L4** = `registry-ci.yml` (images GHCR + api-smoke) ; **L5** = `api-spring-ci.yml`
> (Maven verify : Java 21 + Testcontainers PostgreSQL) ; **L6** = `web-angular-ci.yml`
> (Angular 22 : Karma/ChromeHeadless + build + audit).
>
> Légende gate : ✅ = gate actif et documenté | — = gate absent ou non applicable |
> ⚠️ = gate présent mais incomplet ou bloqué | 🔒 = gate final staging (non reproductible localement)

## 1. Matrice synthétique

| Core / package | typecheck | lint | test | build | audit | e2e | smoke | images | doctor | tokens | openapi |
|---|---|---|---|---|---|---|---|---|---|---|---|
| **root** | — | — | — | — | ✅ L1 | — | — | — | — | — | — |
| **api-contracts** | ✅ L1 | — | ✅ L1 (12) | ✅ L1 | — | — | — | — | — | — | ✅ L1 |
| **api-client-fetch** | ✅ L1 | — | ✅ L1 (30) | ✅ L1 | — | — | — | — | — | — | — |
| **ui-kit** | ✅ L1 | ✅ local | ✅ L1 (181) + coverage local | ✅ L1 | ✅ L1 | — | — | — | — | ✅ local | — |
| **web-nextjs** | ✅ L1 | ✅ L1 | ✅ L1 (94) | ✅ L1 | ✅ L1 | ✅ L3 + golden | — | — | — | — | — |
| **web-angular** | ✅ L6 (build TS) | — | ✅ L6 (108) | ✅ L6 | ✅ L6 | ✅ golden | — | — | — | — | — |
| **mobile-react-native** | ✅ golden | ✅ golden | ✅ golden (321) | ✅ export iOS | ✅ golden | — | ⚠️ device non prouvé | — | ✅ golden (19/19) | — | — |
| **mobile-flutter** | ✅ analyze | ✅ format | ✅ golden (9) | ✅ APK debug | ✅ golden | — | ⚠️ device non prouvé | — | — | — | — |
| **api-nestjs** | — (build TS) | ✅ L2 | ✅ L2 (386u+101e2e) | ✅ L2 | ✅ L2 | — | — | — | — | — | ✅ L2 |
| **api-spring** | ✅ L5 (mvnw) | — | ✅ L5 (71: 32u+39e2e TC) | ✅ L5 (Flyway) | — | — | — | — | — | — | ✅ L5 |
| **api-fastapi** | ✅ compile | ✅ Ruff | ✅ pytest (12) | ✅ compileall | ✅ golden | — | ✅ HTTP | — | — | — | ✅ natif |
| **cloud** | — | — | — | — | — | — | 🔒 staging | ✅ L4 | — | — | — |

## 2. Détail par core / package

### 2.1 Root monorepo

| Gate | Commande | Environnement | CI | Fréquence |
|---|---|---|---|---|
| audit (0 vuln) | `npm audit` | Node 24, pas de services | **L1** (requis `main`) | chaque PR |
| garde Axios absent | `npm ls axios --workspaces` | local | **L1** | chaque PR |
| garde Zustand racine absent | `npm ls zustand --workspaces` | local | **L1** | chaque PR |

### 2.2 @enistere/api-contracts

| Gate | Commande | Environnement | CI | Fréquence |
|---|---|---|---|---|
| typecheck | `npm run typecheck --workspace=@enistere/api-contracts` | Node 24 | **L1** | chaque PR |
| build | `npm run build --workspace=@enistere/api-contracts` | Node 24 | **L1** | chaque PR |
| openapi drift | `npm run generate:check --workspace=@enistere/api-contracts` | Node 24 | **L1** | chaque PR |
| tests (12) | `npm test --workspace=@enistere/api-contracts` | Node 24 | **L1** | chaque PR |

### 2.3 @enistere/api-client-fetch

| Gate | Commande | Environnement | CI | Fréquence |
|---|---|---|---|---|
| typecheck | `npm run typecheck --workspace=@enistere/api-client-fetch` | Node 24 | **L1** | chaque PR |
| build | `npm run build --workspace=@enistere/api-client-fetch` | Node 24 | **L1** | chaque PR |
| tests (30) | `npm test --workspace=@enistere/api-client-fetch` | Node 24 | **L1** | chaque PR |

### 2.4 @enistere/ui-kit

| Gate | Commande | Environnement | CI | Fréquence |
|---|---|---|---|---|
| typecheck | `npm run typecheck --workspace=@enistere/ui-kit` | Node 24 | **L1** | chaque PR |
| lint | `npm run lint --workspace=@enistere/ui-kit` | Node 24 | local + recommandé CI | chaque PR |
| tests (181, jest-axe) | `npm test --workspace=@enistere/ui-kit` | Node 24, jsdom | **L1** | chaque PR |
| coverage local | `npm run test:coverage --workspace=@enistere/ui-kit` | Node 24, jsdom | local | revue qualité |
| build | `npm run build --workspace=@enistere/ui-kit` | Node 24 | **L1** | chaque PR |
| tokens drift | `npm run tokens:check --workspace=@enistere/ui-kit` | Node 24 | local (recommandé) | PR tokens |
| pack check | `npm run pack:check --workspace=@enistere/ui-kit` | Node 24 | local | avant release |

### 2.5 @enistere/web-nextjs

| Gate | Commande | Environnement | CI | Fréquence |
|---|---|---|---|---|
| typecheck | `npm run typecheck --workspace=@enistere/web-nextjs` | Node 24 | **L1** | chaque PR |
| lint | `npm run lint --workspace=@enistere/web-nextjs` | Node 24 | **L1** | chaque PR |
| tests (94) | `npm test --workspace=@enistere/web-nextjs` | Node 24, jsdom | **L1** | chaque PR |
| build (sans API) | `npm run build --workspace=@enistere/web-nextjs` | Node 24 | **L1** | chaque PR |
| E2E Playwright (15) | `npx playwright test` | Node 24, API+PG+MinIO+Web+Chromium | **L3** | chaque PR |

### 2.6 starters/angular

| Gate | Commande | Environnement | CI | Fréquence |
|---|---|---|---|---|
| tests (108) | `cd starters/angular && npm run test:ci` | Node 24, Karma, ChromeHeadless | **L6** | chaque PR |
| build production | `cd starters/angular && npm run build` | Node 24, Angular 22 | **L6** | chaque PR |
| audit (0 vuln) | `cd starters/angular && npm audit` | Node 24 | **L6** | chaque PR |

> Projet npm autonome, hors workspaces racine. Aucun backend, secret, service externe ou déploiement.

### 2.7 starters/react-native

| Gate | Commande | Environnement | CI | Fréquence |
|---|---|---|---|---|
| typecheck | `cd starters/react-native && npm run typecheck` | Node 24 | golden Mobile | chaque PR mobile |
| lint | `cd starters/react-native && npm run lint` | Node 24 | golden Mobile | chaque PR mobile |
| tests (321, node --test) | `cd starters/react-native && npm test` | Node 24, node:test | golden Mobile | chaque PR mobile |
| expo export iOS | `cd starters/react-native && npm run build` | Node 24, Metro | golden Mobile | chaque PR mobile |
| expo-doctor (19/19) | `cd starters/react-native && npm run doctor` | Node 24 | golden Mobile | chaque PR mobile |
| smoke Android | `cd starters/react-native && npm run smoke:android` | Node 24, emulator-5554 Android | local | PR shell / runtime |
| smoke iOS | `cd starters/react-native && npm run smoke:ios` | macOS + Xcode + simulateur | ⚠️ bloqué Linux | PR shell sur macOS |
| audit | `npm audit` (via root) | Node 24 | **L1** root | chaque PR |

> **Note smoke iOS** : `npm run smoke:ios` est bloqué en environnement Linux (`detectedPlatform: linux`).
> Il doit être exécuté sur macOS avec Xcode installé (Mobile Core RN31 — en attente macOS/device réel).

### 2.8 starters/flutter

| Gate | Commande | Environnement | CI | Fréquence |
|---|---|---|---|---|
| format | `dart format --output=none --set-exit-if-changed .` | Dart/Flutter | golden Mobile | chaque PR mobile |
| analyze | `flutter analyze` | Flutter | golden Mobile | chaque PR mobile |
| tests (9) | `flutter test` | Flutter | golden Mobile | chaque PR mobile |
| build APK debug | `flutter build apk --debug` | Flutter/Android SDK | golden Mobile | chaque PR mobile |
| audit | audit Foundation gouverné | Node 24 | golden Mobile | chaque PR |

### 2.9 starters/nestjs

> L'API Core est un projet npm autonome et n'expose pas de script `typecheck` dédié.
> Le gate de compilation TypeScript est `npm run build` (Nest build).

| Gate | Commande | Environnement | CI | Fréquence |
|---|---|---|---|---|
| lint | `cd starters/nestjs && npm run lint` | Node 24 | **L2** | chaque PR API |
| tests unitaires (386) | `cd starters/nestjs && npm test` | Node 24 | **L2** | chaque PR API |
| tests e2e (101) | `cd starters/nestjs && npm run test:e2e` | Node 24, PostgreSQL + MinIO | **L2** | chaque PR API |
| openapi drift | `cd starters/nestjs && npm run openapi:check` | Node 24 | **L2** | chaque PR API |
| build | `cd starters/nestjs && npm run build` | Node 24 | **L2** | chaque PR API |
| audit | `npm audit` (via root) | Node 24 | **L1** root | chaque PR |

### 2.10 starters/spring

> `starters/spring` est désormais **la base modulaire** (ADR-054/056) — plus de sous-dossier `base/`, plus
> d'app dédoublée. La base porte la persistence (JPA/Flyway, migration V0 `audit_logs`), l'infra d'audit et
> le rate-limiting ; ses tests sont **unitaires** (audit, rate-limiter), sans Docker. La couverture
> d'intégration complète (auth/rbac/files, Testcontainers PostgreSQL + MinIO) est fournie par les
> **golden-runtime** qui **génèrent** la composition. Le workflow dédié `api-spring-ci.yml` est supprimé
> (redondant avec `factory-golden-runtime.yml`).

| Gate | Commande | Environnement | CI | Fréquence |
|---|---|---|---|---|
| compile + tests unitaires (base) | `cd starters/spring && ./mvnw verify --no-transfer-progress` | Java 21 Temurin | local | à la demande |
| compositions générées | `node factory/quality/scripts/golden-runtime.mjs spring-base\|spring-auth\|spring-auth-rbac\|spring-files` | Java 21, Docker (TC PostgreSQL + MinIO) | **golden-runtime** | chaque PR |
| audit | `npm audit` (via root) | Node 24 | **L1** root | chaque PR |

### 2.11 starters/fastapi

| Gate | Commande | Environnement | CI | Fréquence |
|---|---|---|---|---|
| lint | `cd starters/fastapi && python -m ruff check .` | Python 3.14 | **golden-runtime** | chaque PR |
| tests | `cd starters/fastapi && python -m pytest -q` | Python 3.14 | **golden-runtime** | chaque PR |
| compilation | `cd starters/fastapi && python -m compileall -q app` | Python 3.14 | **golden-runtime** | chaque PR |
| audit Python | `cd starters/fastapi && python -m pip_audit --strict` | Python 3.14, PyPI advisories | **golden-runtime** | chaque PR |
| boot + HTTP | `node factory/quality/scripts/golden-runtime.mjs fastapi-base` | Python 3.14, Uvicorn | **golden-runtime** | chaque PR |
| Files composé | `node factory/quality/scripts/golden-runtime.mjs fastapi-files` | Python 3.14, PostgreSQL 16 + MinIO | **golden-runtime** | chaque PR |
| audit packages partagés | même golden, scope `shared-packages` | Node 24 | **golden-runtime** | chaque PR |

Le golden installe l'arbre transitif depuis `requirements.lock`, vérifie le lock
npm partagé, démarre le processus et exerce health/live/ready, correlation,
continuation W3C et en-têtes de sécurité.

### 2.12 `distributed-platform` initial

| Gate | Commande | Environnement | CI | Fréquence |
|---|---|---|---|---|
| graphe + ownership + ordre | `node factory/quality/scripts/golden-runtime.mjs distributed-spring-nestjs` | Node 24 + Java 21 + PostgreSQL | **golden-runtime** | chaque PR |
| boot + HTTP des deux APIs | même golden avec `GOLDEN_RUNTIME_START=1` | processus séquentiels | **golden-runtime** | chaque PR |

### 2.13 deployment

| Gate | Commande | Environnement | CI | Fréquence |
|---|---|---|---|---|
| build image API | `docker build -t enistere/api-nestjs .` | Docker | **L4** (registry-ci.yml) | chaque PR + push main |
| build image Web | `docker build -t enistere/web-nextjs .` | Docker | **L4** | chaque PR + push main |
| api-smoke (Prisma engine) | job `api-smoke` dans registry-ci.yml | Docker (image API lancée) | **L4** (gate push GHCR) | push main uniquement |
| staging health HTTPS | `curl -s https://staging.enistere.com/health` | VPS staging, SSH | 🔒 staging (runbook CC11) | avant release |
| backup PG + restore | `./backup-postgres.sh` + vérification comptages | VPS staging, SSH | 🔒 staging (runbook CC11) | avant release |
| backup MinIO + restore | `./backup-minio.sh` + test objet | VPS staging, SSH | 🔒 staging (runbook CC11) | avant release |
| rollback / roll-forward | images sha- immutables, docker-compose.cc10.yml | VPS staging, SSH | 🔒 staging (runbook CC11) | avant release |

## 3. Résumé des checks requis sur `main` (branch protection — ADR-013, CC4 / Factory Quality 3)

> **Statut courant : activé via GitHub Rulesets** (`protect-main`, enforcement `active`, 2026-07-11).
> Preuve : `gh api repos/mike-zks/enistere-os-foundation/rulesets/17522775`.

| # | Nom exact du check | Workflow | Statut ruleset |
|---|---|---|---|
| 1 | `api-contracts` | `ci.yml` | requis |
| 2 | `api-client-fetch` | `ci.yml` | requis |
| 3 | `ui-kit` | `ci.yml` | requis |
| 4 | `web-nextjs` | `ci.yml` | requis |
| 5 | `audit` | `ci.yml` | requis |
| 6 | `api-runtime` | `api-runtime-ci.yml` | requis |
| 7 | `web-e2e` | `web-e2e-ci.yml` | requis |
| 8 | `api-smoke` | `registry-ci.yml` | requis |
| 9 | `images (api-nestjs, ./starters/nestjs, ./starters/nestjs/Dockerfile)` | `registry-ci.yml` (matrix) | promotion recommandée, non appliquée |
| 10 | `images (web-nextjs, ., ./starters/nextjs/Dockerfile)` | `registry-ci.yml` (matrix) | promotion recommandée, non appliquée |
| 11 | `api-spring-verify` | `api-spring-ci.yml` | promotion recommandée, non appliquée |
| 12 | `web-angular` | `web-angular-ci.yml` | promotion recommandée, non appliquée |

> Les noms de checks correspondent au **`name:` du job** dans le YAML (jamais au `name:` du workflow).
> Renommer un job casse l'exigence. Le runbook `BRANCH_PROTECTION_RUNBOOK.md` contient la procédure
> complète, les options recommandées et la checklist de vérification post-activation.
> Rapport de décision : `docs/project-status/QUALITY_CORE_REQUIRED_CHECKS_ALIGNMENT.md`.

## 4. Matrice des preuves actuelles

| Core | Preuve la plus récente | Résultat |
|---|---|---|
| api-contracts | CI `main` (L1) | 12/12 verts |
| api-client-fetch | CI `main` (L1) | 30/30 verts |
| ui-kit | CI `main` (L1) + revue VALIDE_V1 2026-07-11 | 181/181 verts |
| web-nextjs | CI `main` (L1) + CI L3 + golden Common/Web v2 | 94/94 + E2E + démarrage verts |
| mobile-react-native | golden Common/Mobile v2 | 321 tests + doctor 19/19 + export iOS verts |
| mobile-flutter | golden Common/Mobile v2 | 9 tests + analyze/format + APK debug verts |
| api-nestjs | CI `main` (L2) | 386u + 101e2e verts |
| api-spring | CI L5 `api-spring-verify` 2026-07-15 | 71/71 verts (32u + 39 TC) |
| web-angular | CI L6 `web-angular` + golden Common/Web v2 | 108/108 + build + E2E démarré verts |
| cloud | CI `main` (L4) + staging CC10/CC11 | images GHCR + staging HTTPS validé |

## 5. Script de sélection locale (Factory Quality 2)

Le script `factory/quality/scripts/quality-gates.mjs` fournit un accès programmatique aux
gates locaux sûrs. Il ne remplace pas la CI et n'exécute jamais les gates Cloud/staging.

```bash
# Voir tous les scopes
node factory/quality/scripts/quality-gates.mjs list

# Voir le plan d'un scope sans l'exécuter
node factory/quality/scripts/quality-gates.mjs plan all-safe
node factory/quality/scripts/quality-gates.mjs plan mobile-static

# Exécuter les gates d'un scope (arrêt au premier échec, code de sortie propagé)
node factory/quality/scripts/quality-gates.mjs run packages
node factory/quality/scripts/quality-gates.mjs run ui-kit
```

| Scope | Étapes | Gates exclus |
|---|---|---|
| `docs` | 2 (`git diff --check` + Documentation link check) | — |
| `root-audit` | 1 (npm audit) | — |
| `packages` | 7 (api-contracts + api-client-fetch) | — |
| `ui-kit` | 5 | — |
| `web` | 4 | E2E Playwright |
| `web-angular` | 3 (test:ci, build, audit) | — |
| `mobile-static` | 4 (typecheck, lint, test, doctor) | expo export, smoke:android, smoke:ios |
| `api-spring` | 1 (`./mvnw verify`) | MinIO TC (déferré), Tika (déferré), smoke staging |
| `all-safe` | 17 (packages + ui-kit + web + root-audit) | mobile, web-angular (Karma/ChromeHeadless), api-nestjs e2e, api-spring (Docker), E2E, Cloud |

Tests unitaires : `node factory/quality/scripts/quality-gates.test.mjs` — 48/48.

## 6. Baseline tests / coverage locale (Factory Quality reporting)

Le script `factory/quality/scripts/quality-report.mjs` expose une synthèse informative des gates de
tests et de la disponibilité d'une commande coverage locale. Il ne lance aucun test, ne publie aucun
artefact et ne remplace pas la CI.

```bash
node factory/quality/scripts/quality-report.mjs list
node factory/quality/scripts/quality-report.mjs markdown
```

État baseline :

| Indicateur | Valeur |
|---|---:|
| Scopes suivis | 9 |
| Coverage disponible localement | 3 |
| Coverage absente ou non standardisée | 6 |

Coverage locale disponible :

- `@enistere/ui-kit` — `npm run test:coverage --workspace=@enistere/ui-kit` ;
- `@enistere/web-nextjs` — `npm run test:coverage --workspace=@enistere/web-nextjs` ;
- `starters/nestjs` — `cd starters/nestjs && npm run test:cov`.

Aucun pourcentage global n'est calculé : les outils et périmètres de tests ne sont pas homogènes.
