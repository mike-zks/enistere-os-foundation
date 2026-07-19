# État courant de la Foundation

> Mise à jour : 2026-07-19. Source opérationnelle V2.

## Architecture

Enistere OS Foundation est une Project Factory AI-native gouvernée par ADR-042.

| Surface | État | Preuve principale |
|---|---|---|
| Factory CLI | Implémentée, pré-release | `factory/cli`, tests Factory |
| Blueprint/lock | Implémentés | schéma v1, génération déterministe |
| Matrice de profils | Implémentée (R7) | `factory/engine/profiles.mjs`, validée contre la matrice réelle |
| Agents locaux | Implémentés | adapters Codex/Claude/Gemini, double approbation |
| Starters | Six baselines V1 disponibles | gates propres à chaque technologie |
| Capabilities | `auth`, `rbac` et `files` livrées en overlay sur la verticale TypeScript | Spring/Angular/Flutter planifiés |
| Overlays déclaratifs | Moteur + overlays `auth`, `rbac` et `files` livrés | Files prouvé sur NestJS/Next.js/RN via goldens générés |
| Packages | Implémentés | contracts (contrat complet figé), client Fetch, UI Kit |
| Deployment | Local/staging disponibles | Compose, CI, runbooks et preuve staging V1 |
| Distribution | Partielle | artefacts historiques ; CLI V2 non publiée |

## Starters

| Starter | Baseline historique | Composition V2 |
|---|---|---|
| NestJS | V1 vérifiée | baseline `base` extraite ; Auth en overlay `ready` |
| Spring Boot | V1 vérifiée | planifiée après verticale TypeScript |
| Next.js | V1 vérifiée | baseline `base` extraite ; Auth en overlay `ready` |
| Angular | V1 vérifiée | planifiée après verticale TypeScript |
| React Native | V1 vérifiée, Android prouvé | baseline `base` extraite ; Auth en overlay `ready` |
| Flutter | V1 vérifiée, Android prouvé | planifiée après verticale TypeScript |

## Composition modulaire (Capability Packs 1A)

Pour les trois starters modulaires, la sélection `capabilities` du blueprint retire effectivement les
surfaces non choisies : une génération `base` ne contient aucune surface Auth, et Auth n'est ajoutée
que via son overlay déclaratif. `generationMode` devient `modular-overlay` (et
`bundledFeaturesMayExceedSelection=false`) lorsque toutes les targets sélectionnées sont modulaires.
Spring, Angular et Flutter restent en baseline-copy jusqu'à leur extraction.

Le projet généré est un **workspace npm unifié** : les `@enistere/*` sont des membres du workspace
(résolus via `*`, sans `file:`), un unique `package-lock.json` racine fait autorité et `npm ci`
réinstalle de façon reproductible. La CI `Factory Golden Runtime` génère `base+auth` pour les trois
verticales, prouve l'installation reproductible et exécute les gates réels de chaque application.
Les non-régressions V1 sont documentées : `docs/project-status/AUTH_V1_NON_REGRESSION.md` et
`docs/project-status/RBAC_V1_NON_REGRESSION.md`.

RBAC (1B) dépend explicitement de `base + auth`, ordonne ses guards globaux de façon déterministe
(authentification → rôles → permissions) et compose son schéma Prisma depuis des fragments JSON
stricts, sans parser ni modifier du texte. Les seeds Prisma et sections de statut Next.js sont des
registres ordonnés ; OpenAPI est généré depuis l'application composée. Sur
React Native, `rbac` est `not-applicable` : la composition triple reste générable et le mobile ne
reçoit aucune surface RBAC.

Files (1C) dépend explicitement de `base + auth + rbac`. Il compose le stockage, les métadonnées,
les URLs signées, la suppression, la quarantaine, les quotas et la réconciliation sur NestJS ; le
BFF et les écrans protégés sur Next.js ; et la surface d'upload/navigation sur React Native. Les
contrats OpenAPI et les migrations sont générés depuis les overlays. La non-régression est suivie
dans `docs/project-status/FILES_V1_NON_REGRESSION.md`.

## Matrice de profils (R7)

Les combinaisons supportées sont nommées et vérifiées : un **profil** est une composition
`{api, web?, mobile?, capabilities}` déclarée dans `factory/engine/profiles.mjs`. Trois statuts —
`ready` (composable **et** prouvé par un golden), `supported` (composable, sans preuve runtime) et
`planned` (non composable, génération refusée) — sont recalculés depuis la matrice réelle des
capabilities par `factory/test/profiles.test.mjs` : un statut que la matrice ne soutient pas fait
échouer la suite. Aucun profil n'est `ready` sans overlay et golden.

L'API est un invariant : `stack.api` reste obligatoire et toute demande « web-only » ou
« mobile-only » est refusée en nommant les profils API correspondants. `enistere profiles` et
`enistere profile <name>` exposent le registre ; `enistere plan` nomme le profil correspondant à un
blueprint et affiche les capabilities et les gates attendus. Détail :
`docs/project-status/PROFILE_MATRIX.md`.

## Références

- Roadmap : `strategy/04_ROADMAP_GLOBAL.md`
- Matrice des profils : `docs/project-status/PROFILE_MATRIX.md`
- Décision d'architecture : `docs/adr/ADR-042-ai-native-project-factory-architecture.md`
- Prochaine action : `docs/project-status/NEXT_ACTIONS.md`
- Baseline historique : `docs/project-status/FOUNDATION_V1_BASELINE_READINESS_REVIEW.md`
