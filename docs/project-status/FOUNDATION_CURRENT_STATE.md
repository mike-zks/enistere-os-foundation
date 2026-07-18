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
| Capabilities | Contrat en consolidation | seuls les manifests existent encore ; overlays réels non livrés |
| Packages | Implémentés | contracts, client Fetch, UI Kit |
| Deployment | Local/staging disponibles | Compose, CI, runbooks et preuve staging V1 |
| Distribution | Partielle | artefacts historiques ; CLI V2 non publiée |

## Starters

| Starter | Baseline historique | Composition V2 |
|---|---|---|
| NestJS | V1 vérifiée | extraction overlays en cours |
| Spring Boot | V1 vérifiée | planifiée après verticale TypeScript |
| Next.js | V1 vérifiée | extraction overlays en cours |
| Angular | V1 vérifiée | planifiée après verticale TypeScript |
| React Native | V1 vérifiée, Android prouvé | extraction overlays en cours |
| Flutter | V1 vérifiée, Android prouvé | planifiée après verticale TypeScript |

## Risque actif

La sélection `capabilities` du blueprint ne retire pas encore les fonctionnalités non choisies : les
starters copiés restent les baselines V1 complètes. La Factory doit bloquer toute déclaration de
composition modulaire tant que les overlays correspondants ne sont pas `ready`.

## Références

- Roadmap : `strategy/04_ROADMAP_GLOBAL.md`
- Décision d'architecture : `docs/adr/ADR-042-ai-native-project-factory-architecture.md`
- Prochaine action : `docs/project-status/NEXT_ACTIONS.md`
- Baseline historique : `docs/project-status/FOUNDATION_V1_BASELINE_READINESS_REVIEW.md`
