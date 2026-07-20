# Gouvernance d’architecture

## Objets gouvernés

- stratégie ;
- blueprint ;
- Platform Contract ;
- runtimes ;
- capabilities ;
- primitives ;
- contrats ;
- policies ;
- deployment packs ;
- lifecycle.

## ADR obligatoire pour

- changement de modèle ;
- nouveau runtime ;
- nouveau standard de contrat ;
- changement incompatible de blueprint ;
- primitive structurante ;
- changement de sécurité ;
- politique de version ;
- introduction de microservices.

## Règles

- une mission, un objectif ;
- spécification avant implémentation ;
- aucune readiness sans preuves ;
- aucune capability définie par un framework ;
- aucune dépendance implicite ;
- aucune promotion manuelle ;
- aucune expansion avant convergence.

## Cycle

```text
Proposition → impact → alternatives → décision → ADR
→ spécification → implémentation → conformité → état
```
