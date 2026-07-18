# Developer Quickstart 1 — parcours d'onboarding 15 minutes

Date : 2026-07-17

## Objectif

Reduire la friction d'adoption identifiee apres la revue externe : le repository avait une gouvernance solide,
mais il manquait un chemin court pour verifier un clone et executer une preuve concrète.

## Livrables

- `docs/onboarding/DEVELOPER_QUICKSTART.md` — parcours 15 minutes ;
- `docs/README.md` — lien ajoute dans la lecture rapide et la section onboarding ;
- `docs/onboarding/CONTRIBUTOR_ONBOARDING.md` — lien vers le quickstart avant le protocole complet ;
- `docs/project-status/DEVELOPER_QUICKSTART1_REPORT.md` — ce rapport ;
- statuts projet : `NEXT_ACTIONS.md`, `FOUNDATION_CURRENT_STATE.md`, `IMPLEMENTATION_MATRIX.md`,
  `SESSION_HANDOFF.md`, `CHANGELOG.md`.

## Contenu du parcours

Le quickstart couvre :

1. verification Git ;
2. lecture minimale des sources de verite (`SESSION_HANDOFF`, `FOUNDATION_CURRENT_STATE`, `NEXT_ACTIONS`) ;
3. gate documentaire `quality-gates docs` ;
4. exemple consommateur `npm run example:api-client-node` ;
5. listing/planning des gates Quality Core ;
6. rappel du choix de mission via `NEXT_ACTIONS.md`.

## Garde-fous

- aucun runtime modifie ;
- aucune dependance ajoutee ;
- aucun workflow modifie ;
- aucune publication package ;
- aucun test serveur reel ;
- aucun secret ou token.

## Verification

```bash
node factory/quality/core/scripts/quality-gates.mjs run docs
npm run example:api-client-node
git diff --check
```

## Prochaine action recommandee

**Packages Release 1** reste la prochaine action conditionnelle si le canal de distribution est decide
explicitement. Sans decision de publication, continuer par **Examples Core 2 — mini-stack local documente**
pour montrer un flux API/Web sans secrets ni staging reel.
