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

## 3. État courant

La racine contient une application Flutter minimale, `go_router`, Riverpod, Dio,
la configuration d’API, des erreurs, des états UI et un thème. `flutter analyze`
et `flutter test` constituent des preuves locales.

Ces actifs ne satisfont pas encore l’intégralité des contrats Common et Mobile
V2. En particulier, la convergence devra compléter et prouver la corrélation,
l’observabilité, l’audit technique, les diagnostics, le cycle de vie, les points
d’extension, le stockage sécurisé, l’état réseau, les permissions, les deep
links, les hooks offline/push et le crash reporting.

## 4. Critère de conformité

Le statut `CONFORMANT` ne pourra être déclaré qu’après :

1. implémentation des invariants Common et Mobile V2 sans capability ;
2. tests comportementaux pour chaque invariant ;
3. analyse et tests Flutter réussis ;
4. golden généré reproductible ;
5. évaluation canonique sans invariant partiel ou manquant.
