# Audits d'architecture et d'implémentation

## Audit courant

[`TARGET_VS_CURRENT_IMPLEMENTATION.md`](TARGET_VS_CURRENT_IMPLEMENTATION.md) compare l'architecture de
référence adoptée par ADR-057 au dépôt au 2026-07-25. Il utilise la classification :

```text
KEEP | ADAPT | REFACTOR | REPLACE | REMOVE | CREATE
```

Il est autoritaire pour le constat de cible, notamment :

- Platform Baseline obligatoire ;
- Observability et Technical Audit hors catalogue des capabilities ;
- quatre profils système, six dimensions d’architecture et sept runtimes cibles ;
- primitives sémantiques ;
- statut de représentation distinct du support réel ;
- prochaine mission unique.

## Analyses closes (historique)

Chacune porte en tête un bandeau **CLOS** daté. Elles restent des preuves de
l'état observé à leur date et **ne décrivent plus le dépôt** : les écarts
qu'elles listent ont été refermés depuis. Ne jamais les lire comme un constat
courant — §18 interdit deux visions actives, et le bandeau est ce qui les
distingue.

| Document | Objet |
|---|---|
| [`FOUNDATION_V2_IMPLEMENTATION_GAP_AUDIT.md`](FOUNDATION_V2_IMPLEMENTATION_GAP_AUDIT.md) | audit initial V2, requalifié par ADR-057 |
| [`RUNTIME_CONFORMANCE_GAP_MATRIX.md`](RUNTIME_CONFORMANCE_GAP_MATRIX.md) | mesure des six runtimes contre le contrat initial |
| [`CAPABILITY_PARITY_GAP_MATRIX.md`](CAPABILITY_PARITY_GAP_MATRIX.md) | parité des overlays existants |
| [`CONTRACT_ARCHITECTURE_GAP_ANALYSIS.md`](CONTRACT_ARCHITECTURE_GAP_ANALYSIS.md) | neutralité des contrats |
| [`BLUEPRINT_GAP_ANALYSIS.md`](BLUEPRINT_GAP_ANALYSIS.md) | blueprint et modèle |
| [`FACTORY_ENGINE_GAP_ANALYSIS.md`](FACTORY_ENGINE_GAP_ANALYSIS.md) | moteur Factory |
| [`GOLDEN_AND_CONFORMANCE_GAP_ANALYSIS.md`](GOLDEN_AND_CONFORMANCE_GAP_ANALYSIS.md) | portée des preuves |
| [`MIGRATION_IMPACT_MAP.md`](MIGRATION_IMPACT_MAP.md) | impact par zone |
| [`PRIORITIZED_REFACTORING_ROADMAP.md`](PRIORITIZED_REFACTORING_ROADMAP.md) | séquence historique |

Leurs classifications et prochaines actions sont supersédées par l'audit courant
et la roadmap maître.

## Revue d'architecture

[`ARCHITECTURE_REVIEW_2026-07-28.md`](ARCHITECTURE_REVIEW_2026-07-28.md) couvre
le projet complet — moteur, conformité, starters, CLI, runtime IA, sécurité,
documentation — et porte l'état d'avancement de ses propres recommandations.
