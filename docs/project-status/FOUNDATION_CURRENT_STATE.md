# État courant de la Foundation

## Phase

`ARCHITECTURE_RESET_V2`

## Décision

Le corpus V2 est adopté comme architecture **cible**. Les développements d’expansion sont suspendus
jusqu’à la convergence du code avec cette cible.

L’adoption documentaire ne vaut pas implémentation : aucune parité produit complète n’est revendiquée,
les runtimes actuels ne sont pas tous conformes au Platform Contract, et aucune nouvelle capability ne
doit être ajoutée avant convergence.

Décision de refondation initiale : [`ADR-044`](../adr/ADR-044-enistere-foundation-v2-architecture-reset.md).
Architecture de référence courante :
[`ADR-057`](../adr/ADR-057-reference-architecture-and-platform-baseline.md).
Contrat exécutable courant :
[`ADR-058`](../adr/ADR-058-executable-platform-baseline-v2.md).
Convergence API courante :
[`ADR-059`](../adr/ADR-059-api-runtime-baseline-v2-convergence.md).

## Actifs existants à migrer

- six starters (la cible ajoute FastAPI sans le revendiquer implémenté) ;
- CLI Factory ;
- blueprint initial ;
- moteur de profils ;
- capabilities partiellement extraites ;
- goldens partiels ;
- deployment packs ;
- packages TypeScript.

Ces éléments sont des actifs à auditer, non la définition de la cible.

## Maturité réelle

Niveau **`Bootable`** du [modèle de conformité](../specifications/CONFORMANCE_MODEL.md) : les
compositions couvertes génèrent, s'installent et démarrent, mais aucune n'est prouvée `Conformant` ni
`Product-equivalent`. Audit complet : [`docs/audits/`](../audits/README.md).

## Écarts (mesurés par l'audit)

- **P0** — contrats centrés TypeScript (pas de génération Java/Dart). *Partiellement adressé* : le pipeline
  canonique unique ([ADR-046](../adr/ADR-046-single-canonical-factory-pipeline.md)) et une **suite Platform
  Contract exécutable** minimale pour la famille API ([ADR-047](../adr/ADR-047-executable-platform-contract-api.md))
  existent ; NestJS↔Spring convergent sur erreur canonique, correlation, health, lifecycle, sécurité,
  extensions et observabilité mesurée (ADR-059). Restent **non implémentés** : Blueprint V2 complet,
  conformité API sans statut partiel et génération polyglotte des contrats.
- **P1** — Lifecycle Manager absent ; dettes de source unique Web/Mobile ; primitives non modélisées ;
  capabilities cibles manquantes (notamment user-management, events, notifications). Observability et
  Technical Audit relèvent désormais du baseline.

## Statut des chantiers V2

- `Canonical System Model` : **IMPLEMENTED_AND_USED** (ADR-045).
- `Resolved System Model` : **IMPLEMENTED_AND_USED** (ADR-046).
- `Single Factory Pipeline` : **IMPLEMENTED_AND_TESTED** (ADR-046).
- `Legacy Internal Pipeline` : **REMOVED** (ADR-046).
- `System profile taxonomy` : **IMPLEMENTED** à l’ingestion/CSM (ADR-060) ; quatre profils et six
  dimensions, avec alias historiques limités à la frontière Blueprint v1.
- `Full Blueprint V2` : **PARTIAL** ; primitives et sections complètes restent TARGET.
- `Platform Contract executable (API minimal v1)` : **HISTORIQUE** (ADR-047, ADR-048, ADR-049) — suite de conformité
  calculée (`factory/conformance/`, émet `enistere.conformance.json`) ; NestJS↔Spring en **parité** sur
  `config-validated`, `error-canonical` (enveloppe plate `ApiErrorResponse`), `correlation-id`, health,
  `openapi`, `base-security` et `observability` ; pipeline gardé par des fitness functions (FF6–FF8).
- `Platform Contract executable (Web, socle)` : **IMPLEMENTED** (ADR-050, ADR-051) — évaluateur
  multi-familles ; invariants Web **idiomatiques** ; le **socle Angular a convergé** vers Next.js
  (`enistere.conformance.json` : Angular base `compliant` sur typed-config/typed-api-access/ui-states/
  error-handling/observability ; a11y `partial`). Parité des contrats **générés** Angular + capabilities Web
  (Phase 3) = différées.
- `Platform Contract executable (Mobile, socle)` : **IMPLEMENTED** (ADR-052, ADR-053) — évaluateur **3
  familles** (API + Web + Mobile) ; React Native `compliant` et **socle Flutter convergé** (ADR-053 : `core/api`
  Dio + interceptors error/logging) → `enistere.conformance.json` montre Flutter base `compliant` sur les 8
  invariants Mobile.
- **Jalon historique : les 6 runtimes ont la parité du contrat de base v1, mesurée**. Cette preuve ne vaut
  pas conformité au Platform Baseline v2 adopté par ADR-057.
- `Platform Baseline v2 + Runtime Contracts` : **IMPLEMENTED** (ADR-058) — contrat JSON versionné,
  manifests résolus jusqu'au plan, rapports schema v2, diagnostics et scan des six runtimes.
- `API Runtime Convergence v2` : **IN_PROGRESS** (ADR-059) — NestJS `26/2/0` et Spring `22/6/0`
  (`COMPLIANT/PARTIAL/MISSING`). Aucun runtime n'est encore `CONFORMANT` : voir
  [`platform-baseline-v2-gap.json`](../../factory/conformance/reports/platform-baseline-v2-gap.json).
- `base` comme capability : **REMOVED** du registre, des manifests de capabilities, profils et plans ;
  compatibilité Blueprint v1 effacée à l'ingestion.
  Reste, avant la parité **produit** : contrats **générés** Angular/Flutter (`@enistere/api-contracts`) et
  capabilities Web/Mobile (Phase 3).

Ces éléments existent et fonctionnent, mais doivent être requalifiés contre le Platform Baseline v2.

## CI et dépendances

La CI de `main` est verte. La vague d'advisories CVE-2026 est traitée sans downgrade ni désactivation
d'audit : correctifs réels dans les lockfiles, et exceptions **documentées, scopées et datées** pour
`sharp` / `next` et la chaîne `@hono/node-server` (aucun correctif upstream), via
`factory/quality/audit-exceptions.json`. Ces exceptions se lèvent par des missions d'upgrade Next et
Angular CLI suivies dans [`NEXT_ACTIONS.md`](NEXT_ACTIONS.md).

## Action

Audit d'écart livré ([`docs/audits/`](../audits/README.md)). Prochaine action : voir
[`NEXT_ACTIONS.md`](NEXT_ACTIONS.md).
