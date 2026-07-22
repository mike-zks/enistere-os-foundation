# Standards d'ingénierie

Politique opérationnelle subordonnée à [`SOURCE_OF_TRUTH.md`](SOURCE_OF_TRUTH.md). Elle complète
[`DEFINITION_OF_READY.md`](DEFINITION_OF_READY.md) et [`DEFINITION_OF_DONE.md`](DEFINITION_OF_DONE.md)
sans redéfinir le modèle de conformité.

## Code

- Types stricts, frontières explicites et erreurs contrôlées.
- Code métier indépendant du framework lorsque cela améliore réellement les tests.
- Aucun DTO métier dupliqué lorsqu'un contrat généré existe.
- Logs structurés et redacted par défaut.
- Accessibilité, responsive et états loading/empty/error/success pour toute UI concernée.

## Tests

- Unitaires pour la logique pure et la sécurité.
- Intégration pour les contrats, la persistance et les adapters.
- Runtime et E2E pour les parcours critiques et les goldens.

> Un test de génération doit prouver aussi l'**absence** des capabilities non sélectionnées.

Cette règle d'absence est ce qui distingue une composition exacte d'une copie de baseline. Elle
conditionne le niveau `Generatable` du [modèle de conformité](../specifications/CONFORMANCE_MODEL.md).

## Documentation

- README orienté usage, ADR orienté décision, runbook orienté opération.
- Les sources actives restent synthétiques ; pas de rapport par micro-mission.
- Les preuves détaillées appartiennent aux tests, aux sorties CI et aux releases.
- Tout lien interne est vérifié automatiquement.
