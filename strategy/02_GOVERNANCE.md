# Gouvernance

## Autorité

L'ordre de vérité est : code et schémas exécutables, tests/CI, ADR validés, strategy active,
documentation opérationnelle. Un rapport ne peut pas contredire une preuve runtime.

## Responsabilités

- **Propriétaire** : vision produit, arbitrages, accès, releases et acceptation des risques.
- **Architecte/Codex** : cohérence globale, mission, revue, gates, gouvernance et décision de merge.
- **Agent d'implémentation** : changement borné, tests, rapport factuel ; aucune décision structurante implicite.
- **CI** : preuve reproductible, jamais substitut à la revue.

## Règles de changement

- Une décision durable ou coûteuse exige un ADR.
- Une capability n'est `ready` qu'avec overlay, tests et preuve sur chaque target annoncée.
- Une PR traite un objectif principal et déclare son hors périmètre.
- Les suppressions sont permises : Git et les releases constituent l'archive.
- Aucun statut n'est promu sur documentation seule.

## Statuts utiles

`planned` -> `implemented` -> `verified` -> `released`.

Les anciens statuts de cores restent historiques et ne gouvernent plus la Factory V2.
