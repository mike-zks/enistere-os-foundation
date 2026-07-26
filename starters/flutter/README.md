# Starter Flutter

Socle mobile Flutter matérialisé directement à la racine `starters/flutter`.

## Statut réel

- Platform Baseline cible : `common/2.0.0`
- contrat de famille cible : `mobile/2.0.0`
- composition : modulaire, sans dossier `base` et sans capability embarquée
- conformité actuelle : non acquise ; l’évaluateur conserve explicitement les
  invariants partiels ou manquants

Le starter est analysable et testable, mais son aplatissement ne constitue pas
une convergence Mobile V2. Cette convergence est la prochaine mission proposée.

`Authentication`, `Authorization`, `Files` et `Notifications` sont des
capabilities planifiées. Elles ne sont pas intégrées à ce runtime de base.

## Éléments présents

- application Flutter et navigation `go_router` ;
- client HTTP Dio et modèle d’erreur ;
- configuration d’API ;
- journalisation HTTP ;
- états UI Foundation ;
- thème Material 3 ;
- test de base.

## Commandes

```bash
flutter pub get
flutter analyze
flutter test
```

La spécification locale
[`STARTER_SPECIFICATION.md`](./STARTER_SPECIFICATION.md) décrit les limites
actuelles et les exigences de convergence.
