# Prochaine action

## Mission achevée

Authentication est conforme au contrat Capability v2 sur ses quatre targets
`ready`, mesurée par une suite produit commune
([ADR-068](../adr/ADR-068-authentication-capability-product-conformance.md)).

Preuves :

- contrat produit neutre et versionné
  `capabilities/auth/contracts/authentication.product.v1.json` : quatre rôles,
  quinze invariants, aucune référence à un framework ;
- matrice autorité/client explicite : `nestjs` et `spring` en `authority`,
  `nextjs` en `client + web-client`, `react-native` en `client + mobile-client` ;
- closure d’invariants calculée par rôle, refusée si incomplète ou excédentaire ;
- chaque invariant applicable adossé à une preuve localisée et à des marqueurs
  de contenu, vérifiés dans la Foundation **et** dans l’application matérialisée ;
- vérification matérialisée branchée dans `golden-runtime.mjs`, après les gates
  réels ;
- audit métier Authentication déclaré et testé sur les deux autorités, en
  s’appuyant sur l’infrastructure d’audit du baseline sans la dupliquer ;
- quatre divergences Spring révélées par le contrat neutre et corrigées :
  réponse de session canonique, `AUTH_INVALID_CREDENTIALS`, `AUTH_RATE_LIMITED`,
  `AUTH_REFRESH_FAILED` ;
- `CodedException` ajoutée au Platform Baseline : un seul chemin de mapping
  d’erreur, enveloppe plate d’ADR-048 inchangée ;
- Angular, Flutter et FastAPI inchangés et honnêtement non `ready` ;
- aucune nouvelle target, aucune nouvelle capability, aucun dossier `base/`.

État calculé (`factory/conformance/reports/authentication-v1.json`) :

```text
nestjs        CONFORMANT   8 invariants   9 preuves
spring        CONFORMANT   8 invariants   8 preuves
nextjs        CONFORMANT   6 invariants   7 preuves
react-native  CONFORMANT   6 invariants   6 preuves
fastapi       UNSUPPORTED  angular/flutter PLANNED
```

## Limites honnêtes

- la conformité porte sur Authentication seule : RBAC et Files n’ont pas de
  contrat produit neutre ;
- le contrat de session Spring change de forme : rupture assumée, sans
  compatibilité ascendante ni migration in-place ;
- le lifecycle add/remove/upgrade/migrate n’est toujours pas livré ;
- les providers d’infrastructure ne sont pas sélectionnés ;
- `distributed-platform` avec capabilities reste bloqué ;
- aucun statut `PRODUCT_EQUIVALENT` ou `PRODUCTION_READY` n’est revendiqué ;
- aucun test sur device réel.

## Prochaine mission unique

> **Rendre RBAC conforme au contrat Capability v2 sur ses targets actuellement
> `ready`, avec un contrat produit neutre, sans ajouter de target ni de nouvelle
> capability.**

### Justification de l’ordre

Le mécanisme de conformité produit est désormais éprouvé sur une capability
réelle, et il a prouvé sa valeur en révélant quatre divergences Spring que les
suites locales ne voyaient pas. RBAC est la suite naturelle : `files` en dépend
(`auth → rbac → files`), donc mesurer RBAC avant Files évite de bâtir la preuve
de Files sur une base non prouvée.

RBAC pose une question que Authentication n’a pas posée : sa target
React Native est `not-applicable`, pas `ready`. Le contrat produit devra donc
distinguer un rôle absent d’un rôle non couvert, sans dégrader le statut global.

### Critères de sortie

- cas d’usage, règles de décision et erreurs RBAC versionnés dans une source
  neutre ;
- rôles explicites (autorité de décision vs consommateur de permissions) ;
- `not-applicable` traité comme une absence légitime de rôle, jamais comme une
  conformité implicite ;
- NestJS et Spring évalués contre les mêmes invariants d’autorisation ;
- Next.js évalué contre les invariants client applicables ;
- audit métier RBAC déclaré sans dupliquer l’infrastructure d’audit ;
- statuts `CONFORMANT` uniquement là où les preuves passent ;
- Angular, Flutter et FastAPI inchangés ;
- aucun nouveau runtime, provider ou capability ;
- aucun dossier `base/`.
