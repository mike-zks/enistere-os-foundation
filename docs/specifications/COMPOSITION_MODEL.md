# Composition Model

## Étapes

1. parsing ;
2. validation ;
3. normalisation ;
4. résolution des runtimes ;
5. résolution des capabilities ;
6. résolution des primitives ;
7. vérification des contrats ;
8. détection des conflits ;
9. résolution des versions ;
10. calcul du support ;
11. plan ;
12. génération.

## Règles de refus

La composition est refusée lorsque :

- un adapter requis est absent ;
- une dépendance manque ;
- un conflit est déclaré ;
- les versions sont incompatibles ;
- un owner de données est ambigu ;
- une communication n’a pas de contrat ;
- une architecture distribuée manque de garanties ;
- le niveau minimal demandé n’est pas atteint.

## Lockfile

Il contient :

- version Factory ;
- version du schéma ;
- composants résolus ;
- checksums ;
- source registry ;
- options ;
- migrations ;
- digest du blueprint.

## Idempotence

Les mêmes entrées produisent le même résultat.
