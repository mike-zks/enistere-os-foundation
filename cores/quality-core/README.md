# Quality Core

**Statut** : `IMPLEMENTATION_AVANCEE` (Quality Core Advanced Readiness Review, 2026-07-12)

Protection `main` : **active via GitHub Rulesets** (`protect-main`, enforcement `active`) avec
8 status checks requis. Voir `BRANCH_PROTECTION_RUNBOOK.md`.

Core de gouvernance qualité d'Enistere OS Foundation. Documente et outille les gates qualité réels du
monorepo. Ne modifie pas les workflows GitHub, pas les cores runtime, pas les dépendances.

La revue `docs/project-status/QUALITY_CORE_ADVANCED_READINESS_REVIEW.md` constate que le core est
desormais exploitable comme reference avancee : gates locaux, checklists, templates, prompts gouvernes,
ruleset actif et release Foundation appliquee. Les automatisations avancees restent differees.

## Contenu de ce core

| Fichier | Rôle |
|---|---|
| `CORE_SPECIFICATION.md` | Spécification complète : objectif, périmètre V2, 4 niveaux qualité, règle tests Cloud, gouvernance promotion statut |
| `QUALITY_GATES_MATRIX.md` | Matrice gates × cores : commandes, environnements, CI existante, fréquence |
| `BRANCH_PROTECTION_RUNBOOK.md` | **État et procédure de protection de branche `main`** — ruleset actif, 8 checks requis, checks `images` recommandés phase 2, procédure de vérification |
| `RELEASE_PROCESS_RUNBOOK.md` | **Processus de release gouverné** — 5 types de release, prérequis généraux, procédure 8 étapes, format notes, convention de tagging futur |
| `AI_PROMPT_GOVERNANCE.md` | **Gouvernance des prompts IA** — responsabilités, lectures obligatoires, format minimal, sécurité, rapport attendu |
| `scripts/quality-gates.mjs` | Script Node 24, sans dépendance — sélection et exécution locale des gates sûrs |
| `scripts/quality-gates.test.mjs` | 36 tests unitaires (node:test) — vérifient les plans sans exécuter les commandes |
| `scripts/release-helper.mjs` | Helper local de préparation release — liste les types gouvernés et génère un brouillon Markdown sur stdout |
| `scripts/release-helper.test.mjs` | Tests unitaires du helper release — validation parsing, types, redaction et brouillon |
| `scripts/quality-report.mjs` | Helper local de synthèse tests/couverture — sortie Markdown stdout, sans lancer les tests |
| `scripts/quality-report.test.mjs` | Tests unitaires du helper reporting — validation scopes, coverage disponible et sortie Markdown |
| `../../prompts/README.md` | Catalogue gouverné des prompts IA versionnés |
| `../../prompts/global/mission-brief-template.md` | Template de mission Claude/Codex/Gemini gouvernée |
| `../../docs/checklists/PR_QUALITY_CHECKLIST.md` | Checklist qualité par type de PR |
| `../../docs/checklists/RELEASE_READINESS_CHECKLIST.md` | Checklist avant release / promotion de statut |
| `../../docs/checklists/CORE_STATUS_REVIEW_CHECKLIST.md` | Checklist revue de statut d'un core |
| `../../.github/PULL_REQUEST_TEMPLATE.md` | **Template PR** aligné Quality Core 4 — gates, scope, hors périmètre, sécurité, gouvernance |
| `../../.github/ISSUE_TEMPLATE/bug_report.md` | **Template bug** — environnement, reproduction, impact sécurité, gate concerné |
| `../../.github/ISSUE_TEMPLATE/feature_request.md` | **Template feature** — core ciblé, roadmap, hors périmètre, critères d'acceptation |
| `../../.github/ISSUE_TEMPLATE/security_issue.md` | **Template sécurité** — canal privé si sensible, classification, scopes sensibles |
| `../../.github/ISSUE_TEMPLATE/config.yml` | Config Issue Template — lien Security Advisories |

## Script quality-gates (Quality Core 2)

Script Node 24 sans dépendance externe. Sélectionne et exécute les gates locaux sûrs.

```bash
# Lister les scopes disponibles
node cores/quality-core/scripts/quality-gates.mjs list

# Afficher le plan d'un scope (commandes dans l'ordre, sans exécuter)
node cores/quality-core/scripts/quality-gates.mjs plan <scope>

# Exécuter les gates du scope (arrêt au premier échec)
node cores/quality-core/scripts/quality-gates.mjs run <scope>
```

### Scopes disponibles

| Scope | Description |
|---|---|
| `docs` | `git diff --check` + Docs Core link check — PR docs-only |
| `root-audit` | `npm audit` à la racine — 0 vuln requis |
| `packages` | api-contracts + api-client-fetch : typecheck, build, generate:check, test |
| `ui-kit` | typecheck, lint, test (181), build, tokens:check |
| `web` | typecheck, lint, test (450), build |
| `mobile-static` | typecheck, lint, test (367), doctor — **sans** expo export ni smoke |
| `all-safe` | packages + ui-kit + web + root-audit — **sans** mobile, api-nestjs e2e, E2E, Cloud |

### Gates explicitement exclus de `all-safe`

- `mobile-static` — lancez séparément
- `api-nestjs e2e` — PostgreSQL + MinIO requis
- `E2E Playwright` — stack API + PG + MinIO + Chromium requise
- `smoke:android / smoke:ios` — device ou émulateur requis
- `Cloud / staging` — runbook CC11, non reproductibles localement

### Lancer les tests du script

```bash
node --test cores/quality-core/scripts/quality-gates.test.mjs
# 36/36 tests unitaires — vérification des plans sans exécution des commandes
```

## Commandes existantes par core

Ces commandes existent déjà dans le monorepo. Elles sont documentées ici, pas créées.

### Root monorepo
```bash
npm audit                                   # 0 vuln requis (CI niveau 1)
npm ls axios --workspaces                   # garde Axios absent (CI niveau 1)
npm ls zustand --workspaces                 # garde Zustand racine absent (CI niveau 1)
```

### @enistere/api-contracts
```bash
npm run typecheck --workspace=@enistere/api-contracts
npm run build --workspace=@enistere/api-contracts
npm run generate:check --workspace=@enistere/api-contracts   # OpenAPI drift
npm test --workspace=@enistere/api-contracts                 # 12 tests
```

### @enistere/api-client-fetch
```bash
npm run typecheck --workspace=@enistere/api-client-fetch
npm run build --workspace=@enistere/api-client-fetch
npm test --workspace=@enistere/api-client-fetch              # 30 tests
```

### @enistere/ui-kit
```bash
npm run typecheck --workspace=@enistere/ui-kit
npm run lint --workspace=@enistere/ui-kit
npm test --workspace=@enistere/ui-kit                        # 181 tests (jest-axe)
npm run build --workspace=@enistere/ui-kit
npm run tokens:check --workspace=@enistere/ui-kit            # drift tokens
npm run pack:check --workspace=@enistere/ui-kit              # artefact publiable
```

### @enistere/web-nextjs
```bash
npm run typecheck --workspace=@enistere/web-nextjs
npm run lint --workspace=@enistere/web-nextjs
npm test --workspace=@enistere/web-nextjs                    # 450 tests
npm run build --workspace=@enistere/web-nextjs               # sans API
npx playwright test                                          # 15 tests E2E (stack réelle)
```

### cores/mobile-react-native
```bash
cd cores/mobile-react-native
npm run typecheck
npm run lint
npm test                                                     # 367 tests (node --test)
npx expo export -p ios                                       # bundle iOS (sans device)
npm run doctor                                               # 19/19 checks
npm run smoke:android                                        # smoke emulator Android
npm run smoke:ios                                            # smoke iOS (bloqué Linux)
```

### cores/api-nestjs
```bash
cd cores/api-nestjs
npm run lint
npm test                                                     # 386 tests unitaires
npm run test:e2e                                             # 101 tests e2e (PG+MinIO requis)
npm run openapi:check                                        # drift OpenAPI
npm run build                                                # compilation TypeScript / Nest
```

### cores/cloud (gates finaux staging — non locaux)
```bash
docker build -t enistere/api-nestjs .                        # image API
docker build -t enistere/web-nextjs .                        # image Web
# api-smoke : gate CI registry-ci.yml (lance l'image, vérifie moteur Prisma)
# Tests staging : runbook CC11 (SSH, HTTPS, backup/restore) — non reproductibles localement
```

## Guide choix des gates par type de PR

| Type de PR | Gates minimaux | Gates recommandés |
|---|---|---|
| docs-only (project-status, ADR, checklists) | `node cores/quality-core/scripts/quality-gates.mjs run docs` | `npm audit` root |
| quality-core-only | `git diff --check` + `npm audit` | — |
| UI Kit | typecheck + lint + test + build + tokens:check | audit + pack:check |
| api-contracts | typecheck + build + generate:check + test | audit |
| api-client-fetch | typecheck + build + test | audit |
| web-nextjs | typecheck + lint + test + build | E2E (stack réelle) |
| mobile-react-native | typecheck + lint + test + expo-doctor | expo export + smoke android |
| api-nestjs | typecheck + lint + test | test:e2e (PG+MinIO) + openapi:check |
| cloud | docker build images | api-smoke (gate CI) |
| multi-core | union des gates de chaque core modifié | CI niveaux 1–4 selon cores |

## Responsabilités

| Rôle | Responsabilité |
|---|---|
| Auteur PR | Exécuter les gates minimaux avant ouverture de PR |
| Reviewer | Vérifier que les gates appropriés ont été exécutés (checklist PR) |
| Mainteneur | Décider des promotions de statut (checklist revue de statut) |
| CI | Enforcer les checks requis sur `main` (7+1 checks documentés — ADR-013, CC4) |

## État attendu pour Quality Core V2 / VF

Quality Core VF (roadmap §22) ajoutera : workflows avancés, scripts génération changelog,
publication couverture, prompts IA automatisés/RAG. Ces éléments sont différés.

Les templates PR/issue ont été livrés en **Quality Core 4** (2026-07-11).
Le processus de release a été documenté en **Quality Core 5** (2026-07-11).
La gouvernance des prompts IA et le catalogue ont été livrés en **Quality Core 7** (2026-07-12).
Le helper local de brouillon release a été livré en **Quality Core release helper** (2026-07-12).
Le baseline local tests/couverture a été livré en **Quality Core coverage/reporting baseline** (2026-07-12).

## Helper release

Le helper release prépare un brouillon Markdown pour revue humaine. Il n'écrit aucun fichier, ne crée
aucun tag et ne publie aucune GitHub Release.

```bash
node cores/quality-core/scripts/release-helper.mjs types
node cores/quality-core/scripts/release-helper.mjs draft --type quality-v2-increment --version quality-v2.8 --since foundation-v1.0.0 --scope "Quality Core"
```

La sortie doit être relue et complétée par un mainteneur avant toute release.

## Helper reporting

Le helper reporting produit une synthèse locale des gates de tests et de la disponibilité d'une commande
coverage par scope. Il ne lance pas les tests et ne publie aucun artefact.

```bash
node cores/quality-core/scripts/quality-report.mjs list
node cores/quality-core/scripts/quality-report.mjs markdown
```

Le rapport ne calcule pas de pourcentage global : Web et API disposent d'une commande coverage locale,
mais les autres scopes n'ont pas encore une sortie homogène.
