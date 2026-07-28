# Prochaine action

## Mission achevée

`quarantine` est portée sur Spring : l'écart de parité API de `files` passe de
trois responsabilités manquantes à deux.

Preuves :

- statut `QUARANTINED` ajouté ; `POST /files/{id}/quarantine` et
  `POST /files/{id}/restore`, permissions `files.quarantine` et `files.restore` ;
- **autorisation administrative sans possession** : le propriétaire lui-même ne
  peut pas mettre son fichier en quarantaine — seule la permission fait autorité ;
- un fichier en quarantaine ne délivre plus d'URL de téléchargement, et son
  propriétaire le conserve sans accéder à son contenu ;
- transitions conditionnelles en une seule requête : une suppression concurrente
  l'emporte au lieu d'être silencieusement annulée ;
- conflit de statut refusé en `409` **sans révéler le statut** qui bloque ;
- restauration refusée si l'objet a disparu du bucket — restaurer annoncerait un
  fichier non téléchargeable — avec `FILE_STORAGE_OBJECT_MISSING` audité ;
- audit métier `FILE_QUARANTINED` / `FILE_QUARANTINE_RELEASED` ;
- 126/126 tests Spring sur PostgreSQL réel, dont 11 sur la quarantaine.

État calculé :

```text
files  api  nestjs 7/7 · spring 5/7 ✗   web nextjs 5/7   mobile rn 1/7    NON_CONFORMANT
       écart de parité API restant : quota, reconciliation
```

## Limites honnêtes

- `files` reste **NON_CONFORMANT** ; `quota` et `reconciliation` manquent ;
- NestJS conditionne en outre la restauration à la connaissance d'un checksum.
  Spring ne stocke aucun checksum : cette précondition n'est pas portée. Elle ne
  relève pas de l'invariant déclaré — l'intégrité du contenu est une
  responsabilité d'upload, pas de quarantaine — mais l'écart est réel et assumé ;
- aucun statut `PRODUCT_EQUIVALENT` ou `PRODUCTION_READY` ;
- `factory:test` n'est toujours invoqué par aucun workflow CI (dette héritée) ;
- les gates autres que mobiles ne sont pas audités contre ADR-071.

## Prochaine mission unique

> **Porter `reconciliation` et `quota` sur Spring, dernières responsabilités de
> l'écart de parité API, sans ajouter de target ni de capability.**

### Justification de l'ordre

Ce sont les deux seules responsabilités restantes, et elles vont ensemble : ni
l'une ni l'autre n'est une surface HTTP. Toutes deux reposent sur la même
mécanique — un verrou consultatif PostgreSQL et une tenue sous concurrence — que
les trois responsabilités déjà portées n'ont jamais exercée.

`quota` doit tenir sous uploads concurrents : c'est une contrainte transactionnelle
au moment de la création, pas une vérification a posteriori. `reconciliation` doit
s'exécuter sous verrou exclusif et ne purger une ligne supprimée qu'après avoir
confirmé l'absence de son objet.

C'est la mission qui rend `files` `CONFORMANT` et referme le seul écart de parité
mesuré du dépôt.

### Critères de sortie

- quota par propriétaire tenu sous uploads concurrents, sans dépassement ;
- réconciliation sous verrou exclusif, refusant une exécution concurrente ;
- purge d'une ligne supprimée uniquement si son objet est confirmé absent ;
- audit métier émis sur les décisions de maintenance ;
- `files` atteint `CONFORMANT`, parité API `OK` ;
- goldens `spring-files` et `triple-files` verts avec preuves matérialisées ;
- aucun nouveau runtime, provider ou capability ;
- aucun dossier `base/`.
