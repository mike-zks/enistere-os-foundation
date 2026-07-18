# Session handoff

## Branche de référence

`main` contient la taxonomie Factory V2 issue d'ADR-042.

## Travail actif

Consolidation documentaire et structurelle, puis Capability Packs 1 sur NestJS + Next.js + React Native.

## Invariants

- aucun retour du répertoire `cores/` ;
- aucun faux Core pour AI, Quality, Docs ou Deployment ;
- aucune capability annoncée sans overlay et preuve ;
- aucun script arbitraire exécuté depuis un pack ;
- aucun nouveau rapport de micro-mission ;
- Spring + Angular + Flutter doivent obtenir le même contrat après la verticale TypeScript ;
- R8 reste bloqué jusqu'à composition honnête.

## Gates attendus

Factory, docs, packages, six starters, audits, goldens générés et CI complète.

## Sources à lire

`README.md`, `strategy/`, ADR-042, état courant, matrice et prochaine action.
