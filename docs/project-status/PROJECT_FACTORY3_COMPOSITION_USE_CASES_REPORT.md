# Project Factory 3 — Core composition and use cases report

> Date : 2026-07-18.
> Statut : `REALISE`.

## 1. Objectif

Clarifier la finalite des cores, distinguer `VALIDE_V1` de la completude finale et definir des scenarios
qui prouvent l'utilisabilite de la Foundation dans des projets derives.

## 2. Livrables

- `docs/project-factory/CORE_COMPOSITION_MODEL.md` ;
- `docs/project-factory/USE_CASE_SCENARIOS.md` ;
- `docs/project-status/POST_V1_ADOPTION_ROADMAP.md` ;
- addendum dans `strategy/04_ROADMAP_GLOBAL.md` ;
- index et sources de pilotage synchronises.

## 3. Decisions

- les cores sont composes, pas fusionnes physiquement ;
- `VALIDE_V1` signifie starter gouverne, pas vision finale complete ;
- UI Kit, Docs, Quality et AI ont des modes de consommation distincts du runtime applicatif ;
- les packages API ne sont obligatoires que pour les profils compatibles ;
- toute nouvelle capacite majeure doit repondre a un scenario, un projet ou un risque ;
- le premier profil derive recommande reste `nestjs-next`, avant un profil API + mobile.

## 4. Hors perimetre

- aucun runtime, package, dependance, workflow ou secret ;
- aucun generateur CLI ;
- aucun repository produit cree ;
- aucune modification des cores applicatifs ;
- aucune revendication de preuve projet derive executable.

## 5. Prochaine action

**Project Factory 4 — premier squelette derive `nestjs-next`**, en instanciant les templates et en
preparant une structure exportable sans copie massive de runtime.

