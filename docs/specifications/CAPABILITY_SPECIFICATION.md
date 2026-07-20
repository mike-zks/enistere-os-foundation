# Capability Specification

## Définition

Une capability est une capacité réutilisable, spécifiée une fois et implémentée par adapters.

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
- migrations ;
- maturité.

## Règles

- la spécification est unique ;
- les adapters sont idiomatiques ;
- les contrats sont neutres ;
- une target absente rend la composition non supportée ;
- une capability ne modifie pas directement une autre ;
- toute dépendance est explicite ;
- toute incompatibilité exige une migration.

## Niveaux

- declared ;
- implemented ;
- generatable ;
- bootable ;
- conformant ;
- product-equivalent ;
- production-ready.
