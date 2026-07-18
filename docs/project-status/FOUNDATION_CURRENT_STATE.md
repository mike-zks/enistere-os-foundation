# État courant de la Foundation

> Mise à jour : 2026-07-18. Source opérationnelle V2.

## Architecture

Enistere OS Foundation est une Project Factory AI-native gouvernée par ADR-042.

| Surface | État | Preuve principale |
|---|---|---|
| Factory CLI | Implémentée, pré-release | `factory/cli`, tests Factory |
| Blueprint/lock | Implémentés | schéma v1, génération déterministe |
| Agents locaux | Implémentés | adapters Codex/Claude/Gemini, double approbation |
| Starters | Six baselines V1 disponibles | gates propres à chaque technologie |
| Capabilities | `auth` livrée en overlay (NestJS/Next.js/RN) | RBAC/Files parqués ; Spring/Angular/Flutter planifiés |
| Overlays déclaratifs | Moteur + overlay `auth` livrés | seul `auth` a un `overlay.json` |
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

## Références

- Roadmap : `strategy/04_ROADMAP_GLOBAL.md`
- Décision d'architecture : `docs/adr/ADR-042-ai-native-project-factory-architecture.md`
- Prochaine action : `docs/project-status/NEXT_ACTIONS.md`
- Baseline historique : `docs/project-status/FOUNDATION_V1_BASELINE_READINESS_REVIEW.md`
