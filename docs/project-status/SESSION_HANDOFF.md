# Session handoff

## Branche de référence

`main` contient la taxonomie Factory V2 issue d'ADR-042.

## Travail actif

Capability Packs 1A livré : moteur d'overlays déclaratifs et extraction réelle de la capability
`auth` sur NestJS + Next.js + React Native (baselines `base` sans surface Auth, overlay `auth`
`ready`, RBAC/Files parqués `planned`, goldens vérifiés). Prochaine étape : Capability Packs 1B
(extraction RBAC sur NestJS + Next.js).

## Invariants

- aucun retour du répertoire `cores/` ;
- aucun faux Core pour AI, Quality, Docs ou Deployment ;
- aucune capability annoncée sans overlay et preuve (RBAC/Files restent parqués `planned`) ;
- aucun script arbitraire exécuté depuis un pack (le moteur Factory est l'unique interpréteur) ;
- aucun nouveau rapport de micro-mission ;
- Spring + Angular + Flutter doivent obtenir le même contrat après la verticale TypeScript ;
- R8 reste bloqué jusqu'à composition honnête.

## Gates attendus

Factory, docs, packages, six starters, audits, goldens générés et CI complète.

## Sources à lire

`README.md`, `strategy/`, ADR-042, état courant, matrice et prochaine action.
