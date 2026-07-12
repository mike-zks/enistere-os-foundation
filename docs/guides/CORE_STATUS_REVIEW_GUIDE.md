# CORE_STATUS_REVIEW_GUIDE.md — Guide de revue de statut d'un core

> Docs Core 5.
> Derniere mise a jour : 2026-07-12.

Ce guide complete la checklist `CORE_STATUS_REVIEW_CHECKLIST.md`. Il decrit comment conduire une revue de
statut sans confondre livraison, merge, release et promotion.

## 1. Quand faire une revue

Faire une revue quand :

- un core demande une promotion (`SPECIFICATION_DOCUMENTAIRE` vers `IMPLEMENTATION_PARTIELLE`, etc.) ;
- une mission affirme qu'un critere V1/V2 est ferme ;
- un rapport historique semble contredire l'etat courant ;
- une release ou baseline Foundation doit s'appuyer sur le statut d'un core.

Ne pas faire de revue pour une simple correction documentaire qui ne change ni statut ni preuve.

## 2. Entrees obligatoires

Lire dans cet ordre :

1. `docs/project-status/SESSION_HANDOFF.md` ;
2. `docs/project-status/FOUNDATION_CURRENT_STATE.md` ;
3. `docs/project-status/IMPLEMENTATION_MATRIX.md` ;
4. `docs/project-status/NEXT_ACTIONS.md` ;
5. `strategy/04_ROADMAP_GLOBAL.md`, section du core ou de la version ;
6. `cores/<core>/CORE_SPECIFICATION.md` ;
7. ADR applicables dans `docs/adr/` et `DECISIONS_REGISTER.md` ;
8. derniers rapports du core.

## 3. Methode de decision

Pour chaque critere :

1. citer la source ;
2. identifier une preuve concrete ;
3. classer le verdict : `✅`, `⚠️`, `❌` ;
4. decider si le gap est bloquant pour le statut vise.

Un gap est non bloquant seulement s'il est explicitement differe par la specification, par la roadmap ou par
un ADR valide.

## 4. Statuts et seuils

| Statut cible | Question de controle |
|---|---|
| `SPECIFICATION_DOCUMENTAIRE` | Le core a-t-il une specification, un README et un perimetre clair ? |
| `IMPLEMENTATION_PARTIELLE` | Existe-t-il une partie utilisable, testee ou verifiable, mais incomplete ? |
| `IMPLEMENTATION_AVANCEE` | Les usages principaux sont-ils couverts avec preuves, sans remplir tous les criteres V1 ? |
| `VALIDE_V1` | Tous les criteres V1 du core sont-ils satisfaits, revus et documentes ? |

Ne pas sauter un statut sans justification explicite dans le rapport.

## 5. Rapport attendu

Le rapport doit contenir :

- synthese et decision ;
- sources lues ;
- table des criteres ;
- gaps bloquants et non bloquants ;
- gates executes ;
- decision finale ;
- prochaine mission recommandee.

Placer le rapport dans `docs/project-status/` avec un nom stable :

```txt
<CORE>_<VERSION>_READINESS_REVIEW.md
```

Exemples :

- `API_CORE_V1_READINESS_REVIEW.md` ;
- `QUALITY_CORE_V2_READINESS_REVIEW.md` ;
- `DOCS_CORE_V2_READINESS_REVIEW.md`.

## 6. Mise a jour apres decision

Si le statut change ou si une revue officielle est ajoutee :

- mettre a jour `IMPLEMENTATION_MATRIX.md` ;
- mettre a jour `FOUNDATION_CURRENT_STATE.md` ;
- mettre a jour `NEXT_ACTIONS.md` ;
- mettre a jour `SESSION_HANDOFF.md` ;
- ajouter une entree dans `CHANGELOG.md` ;
- lier le rapport depuis `docs/README.md` si c'est un point d'entree durable.

## 7. Gates minimales

Pour une revue documentaire :

```bash
git diff --check
node cores/docs-core/scripts/check-doc-links.mjs
node cores/quality-core/scripts/quality-gates.mjs plan docs
npm audit
```

Ajouter les tests de scripts si Docs Core ou Quality Core est modifie :

```bash
node --test cores/docs-core/scripts/check-doc-links.test.mjs
node --test cores/quality-core/scripts/quality-gates.test.mjs
```

Pour une revue runtime, executer les gates du core dans `QUALITY_GATES_MATRIX.md`.

## 8. Erreurs a eviter

- Declarer `VALIDE_V1` sans rapport de readiness.
- Confondre CI verte et promotion automatique.
- Oublier les ADR applicables.
- Traiter les rapports historiques comme des sources courantes.
- Cacher un gap bloquant dans une note de bas de page.
