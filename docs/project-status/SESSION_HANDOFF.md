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
étape : Capability Packs 1C (extraction Files).

## Invariants

- aucun retour du répertoire `cores/` ;
- aucun faux Core pour AI, Quality, Docs ou Deployment ;
- aucune capability annoncée sans overlay et preuve (`files` reste parqué `planned`) ;
- aucun script arbitraire exécuté depuis un pack (le moteur Factory est l'unique interpréteur) ;
- aucun nouveau rapport de micro-mission ;
- Spring + Angular + Flutter doivent obtenir le même contrat après la verticale TypeScript ;
- R8 reste bloqué jusqu'à composition honnête.

## Gates attendus

Factory, docs, packages, six starters, audits, goldens générés et CI complète.

## Sources à lire

`README.md`, `strategy/`, ADR-042, état courant, matrice et prochaine action.
