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

- **P0** — pas de suite Platform Contract exécutable ni de test de parité ; contrats centrés TypeScript
  (pas de génération Java/Dart). *Partiellement adressé* : un **Canonical System Model minimal**
  ([ADR-045](../adr/ADR-045-canonical-system-model.md)) fournit désormais la représentation interne
  normalisée consommée par le planning ; le Blueprint V2 complet (schéma, primitives, communications,
  capabilities versionnées) reste **non implémenté**.
- **P1** — Lifecycle Manager absent ; parité Web (Angular base-only) et Mobile (Flutter base-only)
  rompues ; Files absent côté Spring ; primitives non modélisées ; capabilities cibles manquantes
  (user-management, audit, events, notifications, observability).

## Statut des chantiers V2

- `Canonical System Model minimal` : **IMPLEMENTED_AND_TESTED** (ADR-045).
- `Full Blueprint V2` : **NOT_IMPLEMENTED**.
- `Platform Contract executable` : **NOT_IMPLEMENTED**.

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
