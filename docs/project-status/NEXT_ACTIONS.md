# Prochaine action

## Action unique

**Auditer les écarts entre l’architecture V2 adoptée et l’implémentation actuelle.**

L’adoption documentaire V2 est faite. L’étape suivante est un audit d’écart, sans refonte de code :

1. runtimes (`starters/`) face au [Platform Contract](../specifications/PLATFORM_CONTRACT.md) et à la
   [Runtime Adapter Specification](../specifications/RUNTIME_ADAPTER_SPECIFICATION.md) ;
2. capabilities face à la [Capability Specification](../specifications/CAPABILITY_SPECIFICATION.md) ;
3. contrats face à la [Contract Architecture](../architecture/CONTRACT_ARCHITECTURE.md) ;
4. Factory et blueprint face à la
   [System Blueprint Specification](../specifications/SYSTEM_BLUEPRINT_SPECIFICATION.md) et au
   [Composition Model](../specifications/COMPOSITION_MODEL.md) ;
5. goldens et gates face au [Conformance Model](../specifications/CONFORMANCE_MODEL.md).

Livrable attendu : une matrice d’écarts fondée sur des preuves exécutables, pas sur une déclaration
documentaire.

## Interdictions temporaires

- nouvelle capability ;
- nouveau runtime ;
- nouvelle topologie ;
- promotion de profil ;
- extension du Domain Compiler ;
- microservices.
