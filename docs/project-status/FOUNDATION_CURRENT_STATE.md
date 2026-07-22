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

## Écarts

- topologie trop limitée ;
- parité non formalisée ;
- contrats orientés TypeScript ;
- starters inégalement alignés ;
- lifecycle incomplet ;
- statuts insuffisamment fondés sur une conformité commune.

Ces éléments existent et fonctionnent, mais leur statut est établi sur l’ancien modèle. Ils doivent
être requalifiés contre le [modèle de conformité](../specifications/CONFORMANCE_MODEL.md) V2.

## Action

Auditer les écarts entre l’architecture V2 adoptée et l’implémentation actuelle, sans refondre le code.

Voir [`NEXT_ACTIONS.md`](NEXT_ACTIONS.md).
