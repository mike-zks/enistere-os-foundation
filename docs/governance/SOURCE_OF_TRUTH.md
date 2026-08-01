# Source officielle de vérité

## Hiérarchie

1. Spécifications normatives versionnées
2. ADR acceptés
3. Schémas, manifests et policies exécutables
4. Tests de conformité et fitness functions
5. Code
6. État courant et matrices calculées
7. Guides, README et documentation locale

## Architecture de référence active

- [`ENISTERE_REFERENCE_ARCHITECTURE.md`](../architecture/ENISTERE_REFERENCE_ARCHITECTURE.md) ;
- [`ARCHITECTURE_PROFILE_SPECIFICATION.md`](../specifications/ARCHITECTURE_PROFILE_SPECIFICATION.md) ;
- [`PLATFORM_BASELINE_SPECIFICATION.md`](../specifications/PLATFORM_BASELINE_SPECIFICATION.md) ;
- [`INFRASTRUCTURE_PRIMITIVE_SPECIFICATION.md`](../specifications/INFRASTRUCTURE_PRIMITIVE_SPECIFICATION.md) ;
- [`ADR-057`](../adr/ADR-057-reference-architecture-and-platform-baseline.md).

Observability et Technical Audit sont des invariants du Platform Baseline, pas des capabilities.

## Divergence

Le code ne redéfinit pas silencieusement la règle. Une divergence rend le composant non conforme jusqu’à correction du code ou modification formelle de la spécification.

## Politiques opérationnelles

Subordonnées à cette hiérarchie, elles fixent les règles d'exécution sans redéfinir l'architecture :

- [`DEPENDENCY_POLICY.md`](DEPENDENCY_POLICY.md) ;
- [`ENGINEERING_STANDARDS.md`](ENGINEERING_STANDARDS.md) ;
- [`GIT_STRATEGY.md`](GIT_STRATEGY.md) ;
- [`AI_SECURITY_AUTHORIZATION.md`](AI_SECURITY_AUTHORIZATION.md) ;
- [`ARCHITECTURE_GOVERNANCE.md`](ARCHITECTURE_GOVERNANCE.md) ;
- [`DEFINITION_OF_READY.md`](DEFINITION_OF_READY.md) et [`DEFINITION_OF_DONE.md`](DEFINITION_OF_DONE.md).

## Documents non autoritaires

- rapports historiques ;
- notes de session ;
- anciennes roadmaps ;
- prompts IA ;
- tickets non adoptés.

## Historique

Le dépôt actif ne conserve pas d’ancienne architecture documentaire. Git et les releases assurent l’historique.
