# Spécification du runtime Flutter

## 1. Portée

Flutter est l’un des deux adaptateurs de la famille Mobile. Sa cible normative
est le Platform Baseline `common/2.0.0` complété par `mobile/2.0.0`.

Le starter est une source unique dans `starters/flutter`. Un dossier `base/` ou
une propriété `composition.baseSource` sont interdits.

## 2. Séparation des responsabilités

Le runtime de base peut fournir navigation, réseau, stockage sécurisé,
permissions techniques, état réseau, gestion d’erreurs, deep links, hooks
offline/push, crash reporting et fondations de build/test.

Il ne doit pas embarquer de flux fonctionnels d’authentification, d’autorisation,
de fichiers ou de notifications. Ces fonctions appartiennent aux capabilities.

## 3. Contrats exécutables

`lib/src/core/platform/runtime_contract.dart` implémente configuration, erreurs
canoniques, logs avec redaction, corrélation W3C, télémétrie versionnée, audit
technique, diagnostics, lifecycle et registre d’extensions.

Les modules `api`, `storage`, `session`, `network`, `permissions`, `linking`,
`offline`, `push` et `crash` implémentent les invariants Mobile. Les hooks
session/offline/push/crash sont neutres : ils n’activent aucune capability.

## 4. Critère de conformité

Le runtime conserve le statut de preuve `CONFORMANT` uniquement si :

1. le rapport reste à `25 COMPLIANT / 0 PARTIAL / 0 MISSING` ;
2. `flutter analyze`, `flutter test` et `dart format` réussissent ;
3. `flutter build apk --debug` réussit ;
4. le golden généré est reproductible ;
5. aucune source Auth/Files/Notifications et aucun dossier `base/` ne réapparaît.

La preuve headless ne vaut ni test sur appareil, ni `PRODUCT_EQUIVALENT`, ni
`PRODUCTION_READY`.
