# État courant de la Foundation

## Phase

`ARCHITECTURE_RESET_V2`

## Décision

Le corpus V2 est adopté comme architecture **cible**. Les développements d’expansion sont suspendus
jusqu’à la convergence du code avec cette cible.

L’adoption documentaire ne vaut pas implémentation : aucune parité produit complète n’est revendiquée,
les runtimes actuels ne sont pas tous conformes au Platform Contract, et aucune nouvelle capability ne
doit être ajoutée avant convergence.

Décision de refondation : [`ADR-044`](../adr/ADR-044-enistere-foundation-v2-architecture-reset.md).

## Actifs existants à migrer

- six starters ;
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
  existent ; NestJS↔Spring convergent sur **erreur canonique** ([ADR-048](../adr/ADR-048-canonical-api-error-contract.md)),
  correlation et health, avec preuve calculée (`enistere.conformance.json`). Restent **non implémentés** :
  Blueprint V2 complet, observabilité API, parité observable complète, génération polyglotte des contrats.
- **P1** — Lifecycle Manager absent ; parité Web (Angular base-only) et Mobile (Flutter base-only)
  rompues ; Files absent côté Spring ; primitives non modélisées ; capabilities cibles manquantes
  (user-management, audit, events, notifications, observability).

## Statut des chantiers V2

- `Canonical System Model` : **IMPLEMENTED_AND_USED** (ADR-045).
- `Resolved System Model` : **IMPLEMENTED_AND_USED** (ADR-046).
- `Single Factory Pipeline` : **IMPLEMENTED_AND_TESTED** (ADR-046).
- `Legacy Internal Pipeline` : **REMOVED** (ADR-046).
- `Full Blueprint V2` : **PARTIAL**.
- `Platform Contract executable (API minimal)` : **COMPLET** (ADR-047, ADR-048, ADR-049) — suite de conformité
  calculée (`factory/conformance/`, émet `enistere.conformance.json`) ; NestJS↔Spring en **parité** sur
  `config-validated`, `error-canonical` (enveloppe plate `ApiErrorResponse`), `correlation-id`, health,
  `openapi`, `base-security` et `observability` (logs structurés corrélés) ; pipeline gardé par des fitness
  functions (FF6–FF8). Metrics/tracing différés (ADR-018/036). Prochaine famille : Web.
- `Platform Contract executable (Web, socle)` : **IMPLEMENTED** (ADR-050, ADR-051) — évaluateur
  multi-familles ; invariants Web **idiomatiques** ; le **socle Angular a convergé** vers Next.js
  (`enistere.conformance.json` : Angular base `compliant` sur typed-config/typed-api-access/ui-states/
  error-handling/observability ; a11y `partial`). Parité des contrats **générés** Angular + capabilities Web
  (Phase 3) = différées.
- `Platform Contract executable (Mobile)` : **NOT_IMPLEMENTED** (prochaine famille).

Ces éléments existent et fonctionnent, mais leur statut est établi sur l’ancien modèle. Ils doivent
être requalifiés contre le modèle de conformité V2.

## CI et dépendances

La CI de `main` est verte. La vague d'advisories CVE-2026 est traitée sans downgrade ni désactivation
d'audit : correctifs réels dans les lockfiles, et exceptions **documentées, scopées et datées** pour
`sharp` / `next` et la chaîne `@hono/node-server` (aucun correctif upstream), via
`factory/quality/audit-exceptions.json`. Ces exceptions se lèvent par des missions d'upgrade Next et
Angular CLI suivies dans [`NEXT_ACTIONS.md`](NEXT_ACTIONS.md).

## Action

Audit d'écart livré ([`docs/audits/`](../audits/README.md)). Prochaine action : voir
[`NEXT_ACTIONS.md`](NEXT_ACTIONS.md).
