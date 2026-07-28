# Prochaine action

## Mission achevée

RBAC est conforme au contrat Capability v2 sur ses trois targets `ready`, et
l'évaluateur de conformité produit est devenu générique
([ADR-069](../adr/ADR-069-authorization-capability-product-conformance.md)).

Preuves :

- contrat produit neutre `capabilities/rbac/contracts/authorization.product.v1.json` :
  deux rôles, neuf invariants, aucune référence à un framework ;
- évaluateur unique et paramétré : contrats **découverts par convention**
  (`capabilities/<id>/contracts/*.product.v<major>.json`), sans liste centrale et
  sans code moteur à modifier pour mesurer une capability de plus ;
- `not-applicable` traité comme absence légitime de rôle : React Native n'a ni
  rôle, ni invariant, ni preuve, et reste exclu du verdict — verrouillé par test ;
- NestJS et Spring évalués contre les six mêmes invariants d'autorité ;
  Next.js contre les trois invariants client applicables ;
- audit métier RBAC déclaré et testé sur les deux autorités, via
  l'infrastructure d'audit du baseline ;
- un défaut latent révélé et corrigé : **un refus d'autorisation Spring
  répondait `500 INTERNAL_ERROR` au lieu de `403`** ;
- Auth reste `CONFORMANT`, mesurée par le même évaluateur ;
- Angular, Flutter et FastAPI inchangés ;
- aucune nouvelle target, aucune nouvelle capability, aucun dossier `base/`.

État calculé (`reports/authentication-v1.json`, `reports/authorization-v1.json`) :

```text
auth   nestjs CONFORMANT 8 · spring CONFORMANT 8 · nextjs CONFORMANT 6 · react-native CONFORMANT 6
rbac   nestjs CONFORMANT 6 · spring CONFORMANT 6 · nextjs CONFORMANT 3 · react-native NOT_APPLICABLE
       fastapi UNSUPPORTED · angular/flutter PLANNED
2/2 capabilities CONFORMANT
```

## Ce que la mesure a coûté et rapporté

Le défaut du `500` est le point important : il existait depuis l'introduction de
RBAC sur Spring, et **aucune suite locale ne pouvait le voir** — elles
invoquaient la méthode protégée directement, jamais via HTTP. Il a fallu un
contrat neutre exigeant une réponse observable pour l'exposer.

## Limites honnêtes

- `files` n'a pas de contrat produit neutre ;
- la granularité d'audit diffère : NestJS distingue rôle et permission refusés,
  Spring émet un événement unique ; l'invariant ne porte que sur la garantie
  observable ;
- le code d'erreur 403 de Spring change (`FORBIDDEN` → `AUTH_FORBIDDEN`), sans
  compatibilité ascendante ni migration in-place ;
- le lifecycle add/remove/upgrade/migrate n'est toujours pas livré ;
- `distributed-platform` avec capabilities reste bloqué ;
- aucun statut `PRODUCT_EQUIVALENT` ou `PRODUCTION_READY` ;
- `factory:test` n'est toujours invoqué par aucun workflow CI (dette héritée).

## Prochaine mission unique

> **Rendre Files conforme au contrat Capability v2 sur ses targets actuellement
> `ready`, avec un contrat produit neutre, sans ajouter de target ni de nouvelle
> capability.**

### Justification de l'ordre

`files` est la dernière capability livrée sans contrat produit, et la seule dont
les quatre targets sont `ready` — y compris React Native, qui possède cette fois
une vraie surface mobile (upload, téléchargement, cycle de vie de fichier). Elle
dépend de `auth + rbac`, désormais tous deux prouvés : la preuve de Files
reposera donc sur une base mesurée.

Files introduira ce que ni Auth ni RBAC n'ont posé : des invariants portant sur
une **primitive d'infrastructure** (stockage d'objets) et sur des contenus
binaires — validation de type, taille maximale, autorisation par ressource et
non plus par route.

### Critères de sortie

- cas d'usage, règles et erreurs Files versionnés dans une source neutre ;
- rôles explicites (autorité de stockage vs client d'upload/téléchargement) ;
- invariants couvrant validation de type/taille, autorisation par ressource et
  absence de fuite d'URL ou de chemin interne ;
- NestJS et Spring évalués contre les mêmes invariants d'autorité ;
- Next.js et React Native contre les invariants client applicables ;
- audit métier Files déclaré sans dupliquer l'infrastructure d'audit ;
- statuts `CONFORMANT` uniquement là où les preuves passent ;
- Angular, Flutter et FastAPI inchangés ;
- aucun nouveau runtime, provider ou capability ;
- aucun dossier `base/`.
