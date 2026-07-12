# QUALITY_GATES_MATRIX.md — Matrice des gates qualité

> Gates qualité réels du monorepo Enistere OS Foundation.
> Dernière mise à jour : 2026-07-12 (Docs Core 6).
>
> **Script de sélection locale** : `node cores/quality-core/scripts/quality-gates.mjs plan <scope>`
> Scopes : `docs` | `packages` | `ui-kit` | `web` | `root-audit` | `mobile-static` | `all-safe`
>
> Légende CI : **L1** = `ci.yml` (non-régression monorepo) ; **L2** = `api-runtime-ci.yml`
> (runtime API : PG+MinIO) ; **L3** = `web-e2e-ci.yml` (E2E navigateur Playwright) ;
> **L4** = `registry-ci.yml` (images GHCR + api-smoke).
>
> Légende gate : ✅ = gate actif et documenté | — = gate absent ou non applicable |
> ⚠️ = gate présent mais incomplet ou bloqué | 🔒 = gate final staging (non reproductible localement)

## 1. Matrice synthétique

| Core / package | typecheck | lint | test | build | audit | e2e | smoke | images | doctor | tokens | openapi |
|---|---|---|---|---|---|---|---|---|---|---|---|
| **root** | — | — | — | — | ✅ L1 | — | — | — | — | — | — |
| **api-contracts** | ✅ L1 | — | ✅ L1 (12) | ✅ L1 | — | — | — | — | — | — | ✅ L1 |
| **api-client-fetch** | ✅ L1 | — | ✅ L1 (30) | ✅ L1 | — | — | — | — | — | — | — |
| **ui-kit** | ✅ L1 | ✅ local | ✅ L1 (181) | ✅ L1 | ✅ L1 | — | — | — | — | ✅ local | — |
| **web-nextjs** | ✅ L1 | ✅ L1 | ✅ L1 (450) | ✅ L1 | ✅ L1 | ✅ L3 (15) | — | — | — | — | — |
| **mobile-react-native** | ✅ local | ✅ local | ✅ local (367) | — | ✅ local | — | ✅ Android local / ⚠️ iOS bloqué | — | ✅ local (19/19) | — | — |
| **api-nestjs** | — (build TS) | ✅ L2 | ✅ L2 (386u+101e2e) | ✅ L2 | ✅ L2 | — | — | — | — | — | ✅ L2 |
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
| build | `npm run build --workspace=@enistere/ui-kit` | Node 24 | **L1** | chaque PR |
| tokens drift | `npm run tokens:check --workspace=@enistere/ui-kit` | Node 24 | local (recommandé) | PR tokens |
| pack check | `npm run pack:check --workspace=@enistere/ui-kit` | Node 24 | local | avant release |

### 2.5 @enistere/web-nextjs

| Gate | Commande | Environnement | CI | Fréquence |
|---|---|---|---|---|
| typecheck | `npm run typecheck --workspace=@enistere/web-nextjs` | Node 24 | **L1** | chaque PR |
| lint | `npm run lint --workspace=@enistere/web-nextjs` | Node 24 | **L1** | chaque PR |
| tests (450) | `npm test --workspace=@enistere/web-nextjs` | Node 24, jsdom | **L1** | chaque PR |
| build (sans API) | `npm run build --workspace=@enistere/web-nextjs` | Node 24 | **L1** | chaque PR |
| E2E Playwright (15) | `npx playwright test` | Node 24, API+PG+MinIO+Web+Chromium | **L3** | chaque PR |

### 2.6 cores/mobile-react-native

| Gate | Commande | Environnement | CI | Fréquence |
|---|---|---|---|---|
| typecheck | `cd cores/mobile-react-native && npm run typecheck` | Node 24 | local (pas de CI mobile) | chaque PR mobile |
| lint | `cd cores/mobile-react-native && npm run lint` | Node 24 | local | chaque PR mobile |
| tests (367, node --test) | `cd cores/mobile-react-native && npm test` | Node 24, node:test | local | chaque PR mobile |
| expo export iOS | `cd cores/mobile-react-native && npx expo export -p ios` | Node 24, Metro | local | chaque PR mobile |
| expo-doctor (19/19) | `cd cores/mobile-react-native && npm run doctor` | Node 24 | local | chaque PR mobile |
| smoke Android | `cd cores/mobile-react-native && npm run smoke:android` | Node 24, emulator-5554 Android | local | PR shell / runtime |
| smoke iOS | `cd cores/mobile-react-native && npm run smoke:ios` | macOS + Xcode + simulateur | ⚠️ bloqué Linux | PR shell sur macOS |
| audit | `npm audit` (via root) | Node 24 | **L1** root | chaque PR |

> **Note smoke iOS** : `npm run smoke:ios` est bloqué en environnement Linux (`detectedPlatform: linux`).
> Il doit être exécuté sur macOS avec Xcode installé (Mobile Core RN31 — en attente macOS/device réel).

### 2.7 cores/api-nestjs

> L'API Core est un projet npm autonome et n'expose pas de script `typecheck` dédié.
> Le gate de compilation TypeScript est `npm run build` (Nest build).

| Gate | Commande | Environnement | CI | Fréquence |
|---|---|---|---|---|
| lint | `cd cores/api-nestjs && npm run lint` | Node 24 | **L2** | chaque PR API |
| tests unitaires (386) | `cd cores/api-nestjs && npm test` | Node 24 | **L2** | chaque PR API |
| tests e2e (101) | `cd cores/api-nestjs && npm run test:e2e` | Node 24, PostgreSQL + MinIO | **L2** | chaque PR API |
| openapi drift | `cd cores/api-nestjs && npm run openapi:check` | Node 24 | **L2** | chaque PR API |
| build | `cd cores/api-nestjs && npm run build` | Node 24 | **L2** | chaque PR API |
| audit | `npm audit` (via root) | Node 24 | **L1** root | chaque PR |

### 2.8 cores/cloud

| Gate | Commande | Environnement | CI | Fréquence |
|---|---|---|---|---|
| build image API | `docker build -t enistere/api-nestjs .` | Docker | **L4** (registry-ci.yml) | chaque PR + push main |
| build image Web | `docker build -t enistere/web-nextjs .` | Docker | **L4** | chaque PR + push main |
| api-smoke (Prisma engine) | job `api-smoke` dans registry-ci.yml | Docker (image API lancée) | **L4** (gate push GHCR) | push main uniquement |
| staging health HTTPS | `curl -s https://staging.enistere.com/health` | VPS staging, SSH | 🔒 staging (runbook CC11) | avant release |
| backup PG + restore | `./backup-postgres.sh` + vérification comptages | VPS staging, SSH | 🔒 staging (runbook CC11) | avant release |
| backup MinIO + restore | `./backup-minio.sh` + test objet | VPS staging, SSH | 🔒 staging (runbook CC11) | avant release |
| rollback / roll-forward | images sha- immutables, docker-compose.cc10.yml | VPS staging, SSH | 🔒 staging (runbook CC11) | avant release |

## 3. Résumé des checks requis sur `main` (branch protection — ADR-013, CC4 / Quality Core 3)

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
| 9 | `images (api-nestjs, ./cores/api-nestjs, ./cores/api-nestjs/Dockerfile)` | `registry-ci.yml` (matrix) | recommandé phase 2, non requis actuellement |
| 10 | `images (web-nextjs, ., ./cores/web-nextjs/Dockerfile)` | `registry-ci.yml` (matrix) | recommandé phase 2, non requis actuellement |

> Les noms de checks correspondent au **`name:` du job** dans le YAML (jamais au `name:` du workflow).
> Renommer un job casse l'exigence. Le runbook `BRANCH_PROTECTION_RUNBOOK.md` contient la procédure
> complète, les options recommandées et la checklist de vérification post-activation.

## 4. Matrice des preuves actuelles

| Core | Preuve la plus récente | Résultat |
|---|---|---|
| api-contracts | CI `main` (L1) | 12/12 verts |
| api-client-fetch | CI `main` (L1) | 30/30 verts |
| ui-kit | CI `main` (L1) + revue VALIDE_V1 2026-07-11 | 181/181 verts |
| web-nextjs | CI `main` (L1) + CI L3 + revue VALIDE_V1 2026-07-10 | 450/450 + 15 E2E verts |
| mobile-react-native | local RN35 2026-07-11 | 367/367 + doctor 19/19 + smoke Android verts |
| api-nestjs | CI `main` (L2) | 386u + 101e2e verts |
| cloud | CI `main` (L4) + staging CC10/CC11 | images GHCR + staging HTTPS validé |

## 5. Script de sélection locale (Quality Core 2)

Le script `cores/quality-core/scripts/quality-gates.mjs` fournit un accès programmatique aux
gates locaux sûrs. Il ne remplace pas la CI et n'exécute jamais les gates Cloud/staging.

```bash
# Voir tous les scopes
node cores/quality-core/scripts/quality-gates.mjs list

# Voir le plan d'un scope sans l'exécuter
node cores/quality-core/scripts/quality-gates.mjs plan all-safe
node cores/quality-core/scripts/quality-gates.mjs plan mobile-static

# Exécuter les gates d'un scope (arrêt au premier échec, code de sortie propagé)
node cores/quality-core/scripts/quality-gates.mjs run packages
node cores/quality-core/scripts/quality-gates.mjs run ui-kit
```

| Scope | Étapes | Gates exclus |
|---|---|---|
| `docs` | 2 (`git diff --check` + Docs Core link check) | — |
| `root-audit` | 1 (npm audit) | — |
| `packages` | 7 (api-contracts + api-client-fetch) | — |
| `ui-kit` | 5 | — |
| `web` | 4 | E2E Playwright |
| `mobile-static` | 4 (typecheck, lint, test, doctor) | expo export, smoke:android, smoke:ios |
| `all-safe` | 17 (packages + ui-kit + web + root-audit) | mobile, api-nestjs e2e, E2E, Cloud |

Tests unitaires : `node --test cores/quality-core/scripts/quality-gates.test.mjs` — 36/36.
