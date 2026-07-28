# Prochaine action

## Mission achevée

Le support partiel est déclarable et la parité par famille de runtimes est
mesurée ([ADR-070](../adr/ADR-070-capability-responsibilities-and-family-parity.md)).

Preuves :

- `responsibilities` obligatoire sur toute target `ready`, validé contre les
  responsabilités déclarées par la capability ;
- invariants attachables à une responsabilité ; les invariants transverses
  (authentification, autorisation par ressource, absence de fuite) restent
  imposés à toutes les targets d'un rôle ;
- **parité par famille** : toutes les targets `ready` d'une famille doivent
  déclarer le même ensemble de responsabilités ; familles issues du registre
  canonique `APPLICATION_KINDS` ;
- règle portée par l'évaluateur, pas par le validateur de manifeste — un
  manifeste fidèle au réel reste chargeable (mandat §5) ;
- contrat produit `files.product.v1.json` : deux rôles, seize invariants ;
- `coverage`, `family` et `familyParity` publiés à côté du verdict ;
- gate golden : une preuve disparue échoue, une rupture de parité connue est
  affichée sans faire échouer le build.

État calculé :

```text
auth   api  nestjs 4/4 · spring 4/4     web nextjs 4/4   mobile rn 4/4    CONFORMANT
rbac   api  nestjs 4/4 · spring 4/4     web nextjs 2/4                    CONFORMANT
files  api  nestjs 7/7 · spring 2/7 ✗   web nextjs 5/7   mobile rn 1/7    NON_CONFORMANT
2/3 capabilities CONFORMANT
```

## Ce que la mesure a révélé

`files` est **non conforme**, et c'est le résultat attendu. Spring ne tient que
`upload` et `download-url` là où NestJS tient les sept responsabilités — deux
runtimes de la **même famille API**, donc deux implémentations censées être
interchangeables.

Toutes les preuves que Spring déclare passent. Le seul écart est la parité
elle-même, et il est nommé : `delete`, `metadata`, `quarantine`, `quota`,
`reconciliation`.

Une première version de cette décision autorisait la couverture partielle sans
contrainte de famille : elle aurait déclaré Spring conforme à 2/7. C'est le
mandat §8.4 qui l'a corrigée.

## Limites honnêtes

- l'écart Files/API n'est pas comblé, seulement mesuré et chiffré ;
- Next.js (5/7) et React Native (1/7) ne sont pas contraints : Angular et
  Flutter ne sont pas `ready`, ces targets sont seules dans leur famille ;
- le statut `ready` de `files/spring` est conservé — il livre réellement upload
  et téléchargement ; le déclasser retirerait une surface qui fonctionne ;
- le lifecycle add/remove/upgrade/migrate n'est pas livré ;
- aucun statut `PRODUCT_EQUIVALENT` ou `PRODUCTION_READY` ;
- `factory:test` n'est toujours invoqué par aucun workflow CI (dette héritée).

## Prochaine mission unique

> **Combler l'écart de parité Files sur la famille API : porter `metadata`,
> `delete`, `quarantine`, `reconciliation` et `quota` sur Spring, sans ajouter
> de target ni de capability.**

### Justification de l'ordre

C'est le seul écart de parité mesuré du dépôt, il est chiffré, et il bloque la
conformité d'une capability déjà livrée sur quatre targets. Tant qu'il subsiste,
`files` promet sur NestJS ce qu'elle ne tient pas sur Spring, alors que les deux
sont censés être interchangeables.

L'ordre interne suit les dépendances réelles : `metadata` d'abord (le listing
conditionne l'usage des autres), puis `delete`, puis `quarantine`, enfin
`reconciliation` et `quota` qui exigent des verrous de maintenance et une
tenue sous concurrence.

Le périmètre est important — stockage objet, verrous, quotas concurrents. Il
pourra être découpé en plusieurs missions, mais l'unité de mesure reste la
parité API restaurée.

### Critères de sortie

- Spring déclare les sept responsabilités et les tient réellement ;
- `files` atteint `CONFORMANT`, parité API `OK` ;
- mêmes contrats, mêmes codes d'erreur et mêmes garanties observables que
  NestJS, sans exiger un code identique ;
- audit métier Files émis sur les nouvelles opérations ;
- quota tenu sous uploads concurrents, réconciliation sous verrou exclusif ;
- goldens `spring-files` et `triple-files` verts avec les preuves matérialisées ;
- aucun nouveau runtime, provider ou capability ;
- aucun dossier `base/`.
