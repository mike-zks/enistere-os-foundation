# Standards d'ingénierie

## Code

- Types stricts, frontières explicites et erreurs contrôlées.
- Code métier indépendant du framework lorsque cela améliore réellement les tests.
- Aucun DTO métier dupliqué quand un contrat généré existe.
- Logs structurés et redacted par défaut.
- Accessibilité, responsive et états loading/empty/error/success pour toute UI concernée.

## Tests

- Unitaires pour logique pure et sécurité.
- Intégration pour contrats, persistance et adapters.
- Runtime/E2E pour les parcours critiques et goldens.
- Un test de génération doit prouver aussi l'absence des capabilities non sélectionnées.

## Documentation

- README orienté usage, ADR orienté décision, runbook orienté opération.
- Les sources actives restent synthétiques ; pas de rapport par micro-mission.
- Les preuves détaillées appartiennent aux tests, sorties CI et releases.
- Tout lien interne est vérifié automatiquement.

## Définition de terminé

Code, tests, sécurité, docs utiles, statut réel, diff propre et CI verte.
