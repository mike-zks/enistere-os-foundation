# Contributor Onboarding

> Docs Core 3.
> Derniere mise a jour : 2026-07-12.

Ce guide aide un contributeur ou un agent IA a demarrer une mission dans Enistere OS Foundation sans
dependre de l'historique de conversation.

## 1. Regle principale

Toujours partir du repository.

Ne jamais supposer qu'un core est implemente parce qu'un rapport, un ADR ou une specification le mentionne.
Le code, les tests et les fichiers de statut courant priment.

## 2. Lecture obligatoire avant une mission

1. [`../project-status/SESSION_HANDOFF.md`](../project-status/SESSION_HANDOFF.md)
2. [`../project-status/FOUNDATION_CURRENT_STATE.md`](../project-status/FOUNDATION_CURRENT_STATE.md)
3. [`../project-status/IMPLEMENTATION_MATRIX.md`](../project-status/IMPLEMENTATION_MATRIX.md)
4. [`../project-status/NEXT_ACTIONS.md`](../project-status/NEXT_ACTIONS.md)
5. [`../project-status/DECISIONS_REGISTER.md`](../project-status/DECISIONS_REGISTER.md)
6. Le `CORE_SPECIFICATION.md` du core concerne
7. Les ADR applicables dans [`../adr/`](../adr/)

Pour une mission IA, lire aussi :

- [`../../cores/quality-core/AI_PROMPT_GOVERNANCE.md`](../../cores/quality-core/AI_PROMPT_GOVERNANCE.md)
- [`../../prompts/README.md`](../../prompts/README.md)
- [`../../prompts/global/mission-brief-template.md`](../../prompts/global/mission-brief-template.md)

## 3. Demarrer une mission

Avant d'editer :

```txt
1. Verifier la branche et l'etat Git.
2. Identifier la prochaine action autorisee.
3. Lire les docs strategy/core spec/ADR necessaires.
4. Definir le perimetre autorise.
5. Definir explicitement le hors perimetre.
6. Choisir les gates qualite.
```

Commande utile :

```bash
git status --short --branch
```

## 4. Pendant une mission

- Modifier un seul core ou domaine a la fois.
- Eviter les refactors opportunistes.
- Ne pas modifier un workflow, un runtime ou une dependance sans mission explicite.
- Ne jamais versionner de secret, token, URL signee, fichier `.env` reel ou donnee personnelle.
- Garder les rapports historiques comme historiques.
- Mettre a jour `docs/project-status/` si le statut, les preuves ou la prochaine action changent.

## 5. Finir une mission

Pour une mission documentaire Docs/Quality :

```bash
git diff --check
node cores/quality-core/scripts/quality-gates.mjs plan docs
node --test cores/quality-core/scripts/quality-gates.test.mjs
npm audit
```

Pour une mission runtime, utiliser la matrice :

- [`../../cores/quality-core/QUALITY_GATES_MATRIX.md`](../../cores/quality-core/QUALITY_GATES_MATRIX.md)
- [`../checklists/PR_QUALITY_CHECKLIST.md`](../checklists/PR_QUALITY_CHECKLIST.md)

## 6. Rapport final attendu

Un rapport final doit mentionner :

- branche, commit et PR ;
- fichiers modifies ;
- confirmation hors perimetre ;
- decision ou architecture retenue ;
- dependances ajoutees ou absence de dependance ;
- gates executes ;
- limites connues ;
- prochaine mission recommandee.

## 7. Responsabilites

| Role | Responsabilite |
|---|---|
| Pilote / architecte | Choisit la mission, lit strategy/spec/ADR/status, cadre le perimetre, verifie le rapport, merge si CI verte |
| Agent executeur | Implemente dans le perimetre, documente, execute les gates, produit un rapport factuel |
| Reviewer | Cherche les bugs, incoherences, risques, manques de tests et ecarts de gouvernance |
| Mainteneur humain | Arbitre les decisions ouvertes, valide les releases, secrets, acces externes et promotions critiques |

## 8. Si une information semble contradictoire

1. Preferer le code et les tests.
2. Verifier `FOUNDATION_CURRENT_STATE.md` et `IMPLEMENTATION_MATRIX.md`.
3. Si la contradiction est dans un rapport historique, ne pas la corriger sauf mission dediee.
4. Si la contradiction concerne l'etat courant, corriger les documents de pilotage dans la mission.
