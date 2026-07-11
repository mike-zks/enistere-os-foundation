# Quality Core

**Statut** : `SPECIFICATION_DOCUMENTAIRE` (Quality Core 1, 2026-07-11)

Core de gouvernance qualité d'Enistere OS Foundation. Documente les gates qualité réels du
monorepo. Ne modifie pas les workflows GitHub, pas les cores runtime, pas les dépendances.

## Contenu de ce core

| Fichier | Rôle |
|---|---|
| `CORE_SPECIFICATION.md` | Spécification complète : objectif, périmètre V2, 4 niveaux qualité, règle tests Cloud, gouvernance promotion statut |
| `QUALITY_GATES_MATRIX.md` | Matrice gates × cores : commandes, environnements, CI existante, fréquence |
| `../../docs/checklists/PR_QUALITY_CHECKLIST.md` | Checklist qualité par type de PR |
| `../../docs/checklists/RELEASE_READINESS_CHECKLIST.md` | Checklist avant release / promotion de statut |
| `../../docs/checklists/CORE_STATUS_REVIEW_CHECKLIST.md` | Checklist revue de statut d'un core |

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
npm run typecheck --workspace=mobile-react-native
npm run lint --workspace=mobile-react-native
npm test --workspace=mobile-react-native                     # 367 tests (node --test)
npx expo export -p ios                                       # bundle iOS (sans device)
npx expo-doctor                                              # 19/19 checks
npm run smoke:android                                        # smoke emulator Android
npm run smoke:ios                                            # smoke iOS (bloqué Linux)
```

### cores/api-nestjs
```bash
npm run typecheck --workspace=api-nestjs
npm run lint --workspace=api-nestjs
npm run test --workspace=api-nestjs                          # 386 tests unitaires
npm run test:e2e --workspace=api-nestjs                      # 101 tests e2e (PG+MinIO requis)
npm run openapi:check --workspace=api-nestjs                 # drift OpenAPI
npm run build --workspace=api-nestjs
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
| docs-only (project-status, ADR, checklists) | `git diff --check` | `npm audit` root |
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

Quality Core VF (roadmap §22) ajoutera : workflows, templates PR/issue, scripts génération
changelog, publication couverture, prompts IA standardisés. Ces éléments sont différés.

Actuellement, seules la spécification, la matrice des gates et les checklists sont livrées.
