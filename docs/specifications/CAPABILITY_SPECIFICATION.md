# Capability Specification

## Définition

Une capability est une fonctionnalité réutilisable **optionnelle, composable, ciblable et versionnée**,
spécifiée une fois et implémentée par adapters.

## Structure

```text
capabilities/<name>/
├── capability.yaml
├── specification/
├── contracts/
├── adapters/
├── infrastructure/
├── conformance/
├── migrations/
└── README.md
```

## Manifeste

Il déclare :

- identité et version ;
- cas d’usage ;
- targets ;
- dépendances ;
- conflits ;
- contrats ;
- événements ;
- permissions ;
- configuration ;
- primitives requises ;
- modes de déploiement ;
- migrations ;
- événements d'audit métier et instruments de télémétrie contribués ;
- suites de conformité ;
- maturité.

## Règles

- la spécification est unique ;
- les adapters sont idiomatiques ;
- les contrats sont neutres ;
- une target absente rend la composition non supportée ;
- une capability ne modifie pas directement une autre ;
- toute dépendance est explicite ;
- toute incompatibilité exige une migration.
- une capability absente ne laisse aucun comportement actif ;
- un adapter absent ou `planned` interdit de revendiquer la génération sur sa target ;
- la capability utilise les ports de baseline et ne remplace jamais erreurs, logs, observabilité ou audit.

## Exclusions obligatoires

Ne sont pas des capabilities : Configuration, Canonical Errors, Structured Logging, Correlation,
Observability, Technical Audit, Security Baseline, Health, Diagnostics, Testing Foundation, Lifecycle
Hooks, Extension Points, Build et Quality Gates.

Les domaines et capabilities déclarent leurs **règles d'audit métier** ; l'infrastructure d'audit appartient
au Platform Baseline.

## Niveaux

- TARGET ;
- PLANNED ;
- IMPLEMENTED ;
- GENERATABLE ;
- BOOTABLE ;
- CONFORMANT ;
- PRODUCT_EQUIVALENT ;
- PRODUCTION_READY.
