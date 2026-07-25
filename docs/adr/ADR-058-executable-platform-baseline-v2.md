# ADR-058 — Platform Baseline v2 et Runtime Contracts exécutables

- Statut : Validé
- Date : 2026-07-24
- Décideur : Owner Foundation

## Décision

Le Platform Baseline v2 devient un contrat exécutable unique :

```text
factory/conformance/contracts/platform-baseline.v2.json
├── common/2.0.0
├── api/2.0.0
├── web/2.0.0
└── mobile/2.0.0
```

Chaque manifest de runtime déclare `baseline.contractVersion` et `baseline.familyContract`. Le resolver
porte cette résolution dans `ResolvedSystem`, puis le planner dans `GenerationPlan`. Le Conformance Report
v2 mesure séparément les invariants communs et ceux de famille et produit des diagnostics structurés.

L'ancien id `base` est supprimé du registre et des dépendances de capabilities. Un Blueprint v1 peut encore
contenir `base` à sa frontière d'entrée ; le normalizer l'efface immédiatement. Le CSM, le resolver, le
plan, les profils et les overlays ne le traitent plus comme capability.

## Contexte

Le contrat précédent mesurait quelques invariants par famille et assimilait souvent Observability à la
présence d'un logger. Il ne versionnait pas le contrat commun, ne mesurait ni Technical Audit, diagnostics,
lifecycle hooks ou extension points de façon homogène, et conservait `base` dans le graphe des
capabilities alors que les starters étaient déjà toujours matérialisés.

## Alternatives

- garder `base` comme capability spéciale : rejeté, car elle ne peut être retirée ni ciblée ;
- créer un second évaluateur v2 : rejeté, car cela introduirait un pipeline de conformité parallèle ;
- remplacer le contrat dans l'évaluateur existant et migrer à la frontière : retenu.

## Justification

Le contrat JSON est une source unique machine-readable. Les versions suivent chaque runtime jusqu'au plan.
La compatibilité v1 reste bornée à l'ingestion. Les résultats `PARTIAL` empêchent de revendiquer une
observabilité complète lorsque seuls les logs existent.

## Conséquences

- aucun des six runtimes existants n'est déclaré `CONFORMANT` au baseline v2 ;
- les anciens goldens et profils restent valides, mais « base » dans leur nom signifie composition sans
  capability optionnelle ;
- Auth ne dépend plus de `base`, RBAC dépend uniquement d'Auth, Files dépend d'Auth et RBAC ;
- tout mismatch de version produit `BASELINE_CONTRACT_VERSION_MISMATCH` ou
  `FAMILY_CONTRACT_VERSION_MISMATCH`.

## Risques

- les probes structurelles peuvent produire des faux positifs ou négatifs ;
- les invariants partiels doivent évoluer vers des tests comportementaux ;
- la compatibilité Blueprint v1 `base` doit être supprimée lors de la migration Blueprint V2.

## Migration

1. manifests runtimes vers les champs `baseline` ;
2. retrait de `capabilities/base` et des dépendances ;
3. normalisation de l'input legacy ;
4. profils/goldens sans capability de base ;
5. rapport v2 calculé sur les six runtimes.

## Tests et preuves

- tests positifs et négatifs du contrat et des erreurs ;
- génération et mesure des six runtimes ;
- test du rapport repository-wide ;
- suite Factory complète ;
- rapport calculé
  [`platform-baseline-v2-gap.json`](../../factory/conformance/reports/platform-baseline-v2-gap.json).

## Rollback

Le changement est revertable avec les manifests, contrats, moteur et tests dans une même unité. Aucun
fallback interne ou second évaluateur n'est maintenu.

## Suite

Converger NestJS et Spring sur Common/API v2, avec priorité aux invariants manquants et aux preuves
Observability complètes, avant d'ajouter FastAPI.
