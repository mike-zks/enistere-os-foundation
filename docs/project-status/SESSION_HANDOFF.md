# Session handoff

## Branche de référence

`main` contient la taxonomie Factory V2 issue d'ADR-042.

## Travail actif

Capability Packs 1A puis 1A-R livrés : moteur d'overlays déclaratifs, extraction réelle de la
capability `auth` sur NestJS + Next.js + React Native (baselines `base` sans surface Auth, overlay
`auth` `ready`, RBAC/Files parqués `planned`), et durcissement runtime — workspace npm unifié avec
lock racine reproductible (`npm install` → `npm ci`), CI obligatoire `Factory Golden Runtime`
(install + gates réels sur les projets générés) et non-régression Auth V1 documentée.

Capability Packs 1B livré : extraction RBAC en overlays `ready` sur NestJS et Next.js
(`not-applicable` sur React Native), avec dépendance explicite à `base + auth`, ordre de guards
déterministe, composition Prisma structurée sans duplication, seed gouverné, goldens runtime RBAC et
non-régression RBAC V1 documentée. Le durcissement 1B-R remplace les mutations textuelles et les
overwrites centraux par un modèle Prisma déclaratif strict, des registres seed/statut ordonnés, une
politique d'overwrite fermée et un contrat OpenAPI généré depuis l'application composée. Prochaine
Capability Packs 1C livré : extraction Files en overlays `ready` sur NestJS, Next.js et React Native,
avec dépendance explicite à `base + auth + rbac`, composition Prisma/migrations, contrat OpenAPI
généré, navigation composable, tests d'absence et goldens `nestjs-files`, `nest-next-files` et
`triple-files`. La non-régression Files V1 est documentée dans
`docs/project-status/FILES_V1_NON_REGRESSION.md`.

Project Factory 4 (R7) livré : la matrice théorique des combinaisons devient un registre de profils
explicites (`factory/engine/profiles.mjs`). Un profil est une composition nommée
`{api, web?, mobile?, capabilities}` portant l'un des trois statuts `ready` / `supported` /
`planned`, recalculés depuis la matrice réelle des capabilities et refusés par les tests s'ils la
dépassent. L'API est un invariant : aucun profil sans API, et toute demande « web-only » ou
« mobile-only » est refusée en nommant les profils API correspondants. Le CLI expose `profiles` et
`profile <name>` ; `plan` nomme le profil et affiche capabilities et gates attendus. Documentation :
`docs/project-status/PROFILE_MATRIX.md`. Prochaine étape : Capability Packs 2 (parité
Angular + Flutter), Spring base étant déjà extrait et prouvé.

Project Factory 4B livré : les compositions triples déjà prouvées reçoivent un profil nommé —
`nestjs-next-react-native-auth` (`triple-auth`) et `nestjs-next-react-native-rbac`
(`triple-auth-rbac`) — en réutilisant exactement ces compositions, sans renderer, overlay ni
comportement runtime nouveau. Le registre compte 26 profils dont 19 générables (19 `ready`,
0 `supported`, 7 `planned`). Les six baselines sont désormais modulaires et les goldens adossent les profils exacts. La documentation ne peut plus dériver du registre :
`PROFILE_MATRIX.md` et `profiles.mjs` sont croisés dans les deux sens, compteurs inclus.

## Invariants

- aucun retour du répertoire `cores/` ;
- aucun faux Core pour AI, Quality, Docs ou Deployment ;
- aucune capability annoncée sans overlay et preuve ; `files` est `ready` uniquement sur NestJS,
  Next.js et React Native ;
- aucun script arbitraire exécuté depuis un pack (le moteur Factory est l'unique interpréteur) ;
- aucun nouveau rapport de micro-mission ;
- aucun profil sans API : `stack.api` reste obligatoire dans le Blueprint v1 ;
- aucun profil `ready` sans overlay **et** golden ; un profil `planned` n'est jamais générable ;
- Les overlays métier Spring/Angular/Flutter doivent maintenant obtenir le même contrat après cette extraction modulaire ;
- R8 reste bloqué jusqu'à composition honnête.

## Gates attendus

Factory, docs, packages, six starters, audits, goldens générés et CI complète.

## Sources à lire

`README.md`, `strategy/`, ADR-042, état courant, matrice et prochaine action.
