# Contributor Onboarding

> Docs Core 5.
> Derniere mise a jour : 2026-07-12.

Ce guide aide un contributeur ou un agent IA a demarrer une mission dans Enistere OS Foundation sans
dependre de l'historique de conversation.

Pour un premier tour rapide sans mission de code, commencer par
[`DEVELOPER_QUICKSTART.md`](./DEVELOPER_QUICKSTART.md).

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

Guides transverses utiles :

- [`../guides/DOCUMENTATION_MAINTENANCE_GUIDE.md`](../guides/DOCUMENTATION_MAINTENANCE_GUIDE.md)
- [`../guides/CORE_STATUS_REVIEW_GUIDE.md`](../guides/CORE_STATUS_REVIEW_GUIDE.md)

Pour une mission IA, lire aussi :

- [`../../factory/quality/core/AI_PROMPT_GOVERNANCE.md`](../../factory/quality/core/AI_PROMPT_GOVERNANCE.md)
- [`../../factory/ai/prompts/README.md`](../../factory/ai/prompts/README.md)
- [`../../factory/ai/prompts/global/mission-brief-template.md`](../../factory/ai/prompts/global/mission-brief-template.md)

## 3. Parcours par role

### Pilote / architecte

Objectif : choisir la prochaine mission et proteger la coherence globale.

Lire :

1. `NEXT_ACTIONS.md` ;
2. `IMPLEMENTATION_MATRIX.md` ;
3. `strategy/04_ROADMAP_GLOBAL.md` ;
4. `CORE_SPECIFICATION.md` du core vise ;
5. ADR applicables ;
6. derniers rapports du core.

Livrable attendu : une mission precise avec objectif, contexte obligatoire, perimetre autorise, interdits,
gates et critere de succes.

### Agent executeur

Objectif : livrer la mission dans le perimetre.

Lire :

1. la mission fournie ;
2. les fichiers de statut cites par la mission ;
3. le core spec et les ADR cites ;
4. la matrice Quality Core pour les gates.

Livrable attendu : code ou documentation implementes, tests/gates executes, rapport final factuel.

### Reviewer technique

Objectif : verifier les risques, regressions et ecarts.

Lire :

1. diff de la PR ;
2. tests ajoutes ou modifies ;
3. `CORE_SPECIFICATION.md` ;
4. ADR applicables ;
5. `PR_QUALITY_CHECKLIST.md`.

Livrable attendu : findings classes par severite, puis questions ouvertes et resume court.

### Reviewer securite

Objectif : verifier secrets, tokens, PII, permissions, CSRF, logs et dependances.

Lire :

1. `strategy/07_SECURITY.md` ;
2. ADR securite applicables ;
3. fichiers qui manipulent auth, fichiers, logs, secrets ou infra ;
4. resultats `npm audit` et checks CI.

Livrable attendu : validation ou blocage explicite, avec preuves.

### Mainteneur release / statut

Objectif : decider une promotion ou une release sans confondre merge et publication.

Lire :

1. [`../../factory/quality/core/RELEASE_PROCESS_RUNBOOK.md`](../../factory/quality/core/RELEASE_PROCESS_RUNBOOK.md)
2. [`../guides/CORE_STATUS_REVIEW_GUIDE.md`](../guides/CORE_STATUS_REVIEW_GUIDE.md)
3. [`../checklists/RELEASE_READINESS_CHECKLIST.md`](../checklists/RELEASE_READINESS_CHECKLIST.md)
4. rapport de readiness du core concerne.

Livrable attendu : decision de statut/release, notes, tag ou prochaine action.

## 4. Demarrer une mission

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

## 5. Pendant une mission

- Modifier un seul core ou domaine a la fois.
- Eviter les refactors opportunistes.
- Ne pas modifier un workflow, un runtime ou une dependance sans mission explicite.
- Ne jamais versionner de secret, token, URL signee, fichier `.env` reel ou donnee personnelle.
- Garder les rapports historiques comme historiques.
- Mettre a jour `docs/project-status/` si le statut, les preuves ou la prochaine action changent.

## 6. Finir une mission

Pour une mission documentaire Docs/Quality :

```bash
node factory/quality/core/scripts/quality-gates.mjs run docs
node --test factory/quality/core/scripts/check-doc-links.test.mjs
node factory/quality/core/scripts/quality-gates.mjs plan docs
node --test factory/quality/core/scripts/quality-gates.test.mjs
npm audit
```

Pour une mission runtime, utiliser la matrice :

- [`../../factory/quality/core/QUALITY_GATES_MATRIX.md`](../../factory/quality/core/QUALITY_GATES_MATRIX.md)
- [`../checklists/PR_QUALITY_CHECKLIST.md`](../checklists/PR_QUALITY_CHECKLIST.md)

## 7. Rapport final attendu

Un rapport final doit mentionner :

- branche, commit et PR ;
- fichiers modifies ;
- confirmation hors perimetre ;
- decision ou architecture retenue ;
- dependances ajoutees ou absence de dependance ;
- gates executes ;
- limites connues ;
- prochaine mission recommandee.

## 8. Responsabilites

| Role | Responsabilite |
|---|---|
| Pilote / architecte | Choisit la mission, lit strategy/spec/ADR/status, cadre le perimetre, verifie le rapport, merge si CI verte |
| Agent executeur | Implemente dans le perimetre, documente, execute les gates, produit un rapport factuel |
| Reviewer | Cherche les bugs, incoherences, risques, manques de tests et ecarts de gouvernance |
| Mainteneur humain | Arbitre les decisions ouvertes, valide les releases, secrets, acces externes et promotions critiques |

## 9. Si une information semble contradictoire

1. Preferer le code et les tests.
2. Verifier `FOUNDATION_CURRENT_STATE.md` et `IMPLEMENTATION_MATRIX.md`.
3. Si la contradiction est dans un rapport historique, ne pas la corriger sauf mission dediee.
4. Si la contradiction concerne l'etat courant, corriger les documents de pilotage dans la mission.
