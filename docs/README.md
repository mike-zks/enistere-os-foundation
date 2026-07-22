# Documentation

La documentation canonique définit l'architecture Enistere V2. Le code ne la redéfinit pas
silencieusement : voir [`governance/SOURCE_OF_TRUTH.md`](governance/SOURCE_OF_TRUTH.md).

## Sources canoniques

Par ordre d'autorité décroissante :

1. `specifications/` : Platform Contract, Runtime Adapter, Capability, System Blueprint, Primitive,
   Composition Model, Conformance Model, Lifecycle & Upgrade ;
2. `adr/` : décisions durables et backlog ;
3. `architecture/` : fonctionnelle, technique, capability, contract, security, operations, AI ;
4. `governance/` : source de vérité, gouvernance, DoR, DoD, politiques opérationnelles ;
5. `strategy/` : vision, positionnement, utilisateurs, principes, périmètre ;
6. `roadmap/` : trajectoire V2 ;
7. `project-status/` : état courant, matrices calculées et action unique ;
8. `guides/`, `onboarding/`, `checklists/`, `project-factory/`, `glossary/` : usage opérationnel.

## Surfaces techniques

- Factory : `../factory/`
- Starters : `../starters/`
- Capabilities : `../capabilities/`
- Packages : `../packages/`
- Deployment : `../deployment/`
- Exemples : `../examples/`

Les README de ces surfaces documentent l'usage local. Ils ne définissent ni la vision, ni le modèle
canonique, ni leur propre source de vérité.

## Règle de maintenance

Les documents actifs restent synthétiques. Git, les tags et GitHub Releases conservent les rapports et
étapes historiques ; le dépôt actif ne conserve pas d'ancienne architecture documentaire. Un changement
documentaire doit passer le link checker de `factory/quality/scripts`.
