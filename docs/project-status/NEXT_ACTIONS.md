# Prochaine action

## Action unique

**Rendre le Platform Contract exécutable pour la famille API.**

Définir un Canonical System Model minimal et une suite de conformité commune NestJS↔Spring, avec les
premiers tests de parité observable — sans extraire de nouvel adapter ni modifier les contrats.

C'est le levier le plus fort : deux adapters API existent déjà et bootent ; les rendre **prouvablement
conformes et équivalents** débloque toute la stratégie de parité (voir
[`docs/audits/`](../audits/README.md)).

Périmètre :

1. Canonical System Model minimal (cible de compilation du blueprint) ;
2. suite Platform Contract exécutable pour la catégorie API
   ([Platform Contract](../specifications/PLATFORM_CONTRACT.md)) ;
3. premiers tests de parité observable NestJS↔Spring ;
4. émission de `enistere.conformance.json`.

## Prérequis opérationnel

Bump des CVE transitives (`brace-expansion`, `js-yaml`, `body-parser`) pour rétablir une CI verte, puis
consolidation de PR #189 (socle) et PR #190 (docs V2) sur `main`. Détail : Phase 0 de la
[roadmap](../audits/PRIORITIZED_REFACTORING_ROADMAP.md).

## Interdictions temporaires

- nouvelle capability ;
- nouveau runtime ;
- nouvelle topologie ;
- promotion de profil ;
- extension du Domain Compiler ;
- microservices.
