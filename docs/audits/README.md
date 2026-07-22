# Audit d'écart — Architecture V2 vs implémentation

Index des livrables de l'audit `ARCHITECTURE_RESET_V2`. Mission strictement analytique :
aucun code, dépendance, workflow ni renommage modifié.

## Base d'audit

- Cible canonique : `docs/specifications/`, `docs/architecture/`, `docs/governance/`,
  [`ADR-044`](../adr/ADR-044-enistere-foundation-v2-architecture-reset.md).
- Implémentation mesurée : `origin/main` (`179b2dc`) **+ PR #189** (`feat/factory-socle-phase0`,
  socle V2 Phase 0 + Phase A : SystemBlueprint applications, multi-surface, Capability Contract v2,
  domain compiler, fitness functions), fusionnés localement pour refléter l'état d'ingénierie réel le
  plus avancé.
- Contrôles fonctionnels verts sur cette base (`factory:test` 354/0, `typecheck`, `test`,
  `docs-link-check`). Seul `npm audit` échoue (CVE transitives du jour — voir
  [synthèse §Risques](FOUNDATION_V2_IMPLEMENTATION_GAP_AUDIT.md)).

## Livrables

| Document | Objet |
|---|---|
| [`FOUNDATION_V2_IMPLEMENTATION_GAP_AUDIT.md`](FOUNDATION_V2_IMPLEMENTATION_GAP_AUDIT.md) | Synthèse exécutive, écarts classés, décision |
| [`RUNTIME_CONFORMANCE_GAP_MATRIX.md`](RUNTIME_CONFORMANCE_GAP_MATRIX.md) | Conformité des 6 runtimes au Platform Contract |
| [`CAPABILITY_PARITY_GAP_MATRIX.md`](CAPABILITY_PARITY_GAP_MATRIX.md) | Parité des capabilities par target |
| [`CONTRACT_ARCHITECTURE_GAP_ANALYSIS.md`](CONTRACT_ARCHITECTURE_GAP_ANALYSIS.md) | Neutralité des contrats (TS vs polyglotte) |
| [`BLUEPRINT_GAP_ANALYSIS.md`](BLUEPRINT_GAP_ANALYSIS.md) | Blueprint réel vs System Blueprint Specification |
| [`FACTORY_ENGINE_GAP_ANALYSIS.md`](FACTORY_ENGINE_GAP_ANALYSIS.md) | Moteur Factory vs pipeline cible, traitement KEEP/…/CREATE |
| [`GOLDEN_AND_CONFORMANCE_GAP_ANALYSIS.md`](GOLDEN_AND_CONFORMANCE_GAP_ANALYSIS.md) | Niveau réel de preuve (boot ≠ parité) |
| [`MIGRATION_IMPACT_MAP.md`](MIGRATION_IMPACT_MAP.md) | Impact/risque/ordre par zone |
| [`PRIORITIZED_REFACTORING_ROADMAP.md`](PRIORITIZED_REFACTORING_ROADMAP.md) | Roadmap de refonte priorisée |

## Classification

- **Sévérité** : `P0` bloque le modèle cible · `P1` empêche parité/industrialisation · `P2` qualité/évolutivité · `P3` non bloquant.
- **Type** : `ARCHITECTURE` `FUNCTIONAL` `CONTRACT` `SECURITY` `QUALITY` `OPERATIONS` `LIFECYCLE` `DOCUMENTATION`.
- **Traitement** : `KEEP` `REFACTOR` `EXTRACT` `REPLACE` `REMOVE` `CREATE` `DEFER`.
