# Prochaine action

## Mission achevée

`metadata` et `delete` sont portées sur Spring : l'écart de parité API de `files`
passe de cinq responsabilités manquantes à trois.

Preuves :

- `GET /files` — page de fichiers possédés, plus récents d'abord, sans les
  supprimés, pagination bornée (`limit` 1–50, `offset` ≥ 0) et `nextOffset`
  fermé sur la dernière page ;
- `GET /files/{id}` — métadonnées publiques d'un fichier possédé ; un fichier
  d'autrui, un fichier supprimé et un fichier inexistant renvoient tous `404` ;
- `DELETE /files/{id}` — objet puis métadonnées, idempotent, invalide les URL
  déjà émises, exige `files.delete` ;
- **permissions RBAC sur toute la surface Files** — `files.upload`,
  `files.download`, `files.read`, `files.delete` ; aucun endpoint Spring n'en
  portait jusqu'ici, là où NestJS gardait chacun des siens ;
- noms d'événements d'audit alignés sur NestJS (`FILE_*`, plus `FILES_*`) et
  invariant d'audit ajouté au contrat produit — Auth et RBAC en avaient un,
  Files n'en avait pas ;
- 115/115 tests Spring sur PostgreSQL réel, dont 32 sur Files.

État calculé :

```text
files  api  nestjs 7/7 · spring 4/7 ✗   web nextjs 5/7   mobile rn 1/7    NON_CONFORMANT
       écart de parité API restant : quarantine, quota, reconciliation
```

## Deux défauts trouvés par les nouveaux tests

**Pagination invalide → `500` au lieu de `400`.** `@Validated` sur des
paramètres de requête lève `ConstraintViolationException`, que le
`GlobalExceptionHandler` ne traitait pas : le catch-all la classait en erreur
interne. Même classe de défaut que l'`AccessDeniedException` d'ADR-069. Corrigé
dans le baseline.

**Une URL de téléchargement restait délivrée après suppression.**
`getDownloadUrl` filtrait sur la possession mais pas sur le statut : la ligne
survivant en tombstone, un fichier supprimé continuait de faire signer des URL
dont l'objet n'existait plus. Bug préexistant, corrigé.

## Limites honnêtes

- `files` reste **NON_CONFORMANT** : `quarantine`, `quota` et `reconciliation`
  manquent toujours à Spring ;
- les permissions `files.*` deviennent **obligatoires** sur les endpoints Spring
  existants — un appelant sans permission reçoit désormais `403` là où il
  passait ; c'est la parité avec NestJS, mais c'est une rupture ;
- aucun statut `PRODUCT_EQUIVALENT` ou `PRODUCTION_READY` ;
- `factory:test` n'est toujours invoqué par aucun workflow CI (dette héritée).

## Correctif transverse livré en marge

Les goldens React Native devenaient rouges sur des commits inchangés :
`expo-doctor` demandait à `api.expo.dev` les versions attendues par le SDK, et
cette valeur est servie côté serveur. Le 2026-07-28, elle a changé entre 13h31
et 13h52 — même outil, même lock, même code, verdict inverse.

Les gates mobiles s'exécutent désormais en mode hermétique et l'outil de
vérification est épinglé
([ADR-071](../adr/ADR-071-hermetic-quality-gates.md)). Le principe posé vaut
au-delà d'Expo : un gate qui affirme la reproductibilité ne peut pas dépendre
d'une valeur distante mutable. Les autres gates n'ont pas été audités.

## Prochaine mission unique

> **Porter `quarantine` sur Spring : statut `QUARANTINED`, endpoints
> quarantine/restore administratifs, sans ajouter de target ni de capability.**

### Justification de l'ordre

`quarantine` est la dernière responsabilité liée à une requête HTTP ; elle
partage tout ce qui vient d'être posé — permissions, audit, anti-énumération.
`reconciliation` et `quota` relèvent d'une autre nature : verrous consultatifs,
tâches de maintenance et tenue sous concurrence. Les séparer garde deux unités
architecturales lisibles plutôt qu'une PR qui mélange surface HTTP et
infrastructure.

`quarantine` introduit ce que les responsabilités déjà portées n'ont pas posé :
une autorisation **administrative sans possession** — un administrateur agit sur
le fichier d'autrui — et des transitions de statut à refuser explicitement.

### Critères de sortie

- statut `QUARANTINED` ajouté, migration additive ;
- `POST /files/{id}/quarantine` et `POST /files/{id}/restore`, permissions
  `files.quarantine` et `files.restore`, sans exigence de possession ;
- un fichier en quarantaine ne délivre plus d'URL de téléchargement ;
- transition invalide refusée explicitement, sans révéler l'existence ;
- audit métier émis sur la mise en quarantaine et la levée ;
- `files/spring` atteint 5/7 ; écart restant `quota` et `reconciliation` ;
- aucun nouveau runtime, provider ou capability ;
- aucun dossier `base/`.
