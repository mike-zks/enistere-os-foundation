# DOCUMENTATION_MAINTENANCE_GUIDE.md — Guide de maintenance documentaire

> Documentation 5.
> Derniere mise a jour : 2026-07-12.

Ce guide explique comment maintenir la documentation d'Enistere OS Foundation sans dupliquer l'etat du
repository ni affaiblir la gouvernance.

## 1. Objectif

La documentation doit permettre de comprendre :

- l'etat courant reel ;
- la prochaine action autorisee ;
- les decisions deja prises ;
- les preuves disponibles ;
- les limites connues.

Elle ne doit pas remplacer le code, les tests, les ADR ou les specifications des cores.

## 2. Hierarchie de confiance

Quand deux documents divergent, appliquer cet ordre :

1. code, tests, scripts et configurations reels ;
2. ADR valides ;
3. `specification active` du core concerne ;
4. `docs/governance/SOURCE_OF_TRUTH.md` ;
5. README, rapports, changelog et notes historiques.

Si un rapport ancien contredit l'etat courant, ne pas le modifier automatiquement. Ajouter plutot une note
dans `docs/project-status/` ou corriger le document courant qui porte la synthese.

## 3. Fichiers a mettre a jour selon le changement

| Changement | Fichiers a verifier |
|---|---|
| Nouveau statut de conformite | `IMPLEMENTATION_MATRIX.md`, `FOUNDATION_CURRENT_STATE.md`, `NEXT_ACTIONS.md`, `CHANGELOG.md` |
| Nouvelle preuve ou rapport | `docs/README.md`, rapport dans `docs/project-status/`, fichier statut concerne |
| Nouvelle decision ADR | `docs/project-status/DECISIONS_REGISTER.md`, `docs/adr/ADR_BACKLOG.md` si besoin |
| Nouvelle mission IA recurrente | `factory/ai/prompts/README.md`, `factory/quality/AI_PROMPT_GOVERNANCE.md` si le cadre change |
| Nouveau guide ou onboarding | `docs/README.md`, `factory/quality/README.md`, `docs/onboarding/CONTRIBUTOR_ONBOARDING.md` |

## 4. Regles de redaction

- Preferer un lien vers la source de verite a une duplication longue.
- Dater les rapports de revue et indiquer le perimetre.
- Distinguer l'etat courant des rapports historiques.
- Ne jamais versionner de secret, token, URL signee, PII ou `.env` reel.
- Ne pas declarer un statut superieur sans preuve et rapport de revue.
- Ne pas utiliser une mission documentaire pour modifier un runtime applicatif.

## 5. Processus de maintenance

1. Lire `FOUNDATION_CURRENT_STATE.md`, `IMPLEMENTATION_MATRIX.md` et `NEXT_ACTIONS.md`.
2. Identifier si le changement modifie un statut, une preuve, une prochaine action ou seulement un lien.
3. Lire le `specification active` du core concerne.
4. Modifier les documents sources les plus proches du changement.
5. Mettre a jour les index seulement apres avoir ajoute ou deplace un document.
6. Executer les gates documentaires.
7. Creer une PR avec le perimetre et les gates executes.

## 6. Gates documentaires

Pour une mission Documentation ou documentation centrale :

```bash
node factory/quality/scripts/quality-gates.mjs run docs
node --test factory/quality/scripts/check-doc-links.test.mjs
node factory/quality/scripts/quality-gates.mjs plan docs
node --test factory/quality/scripts/quality-gates.test.mjs
npm audit
```

Ces gates n'executent pas les tests runtime applicatifs. Si une mission touche un core runtime, utiliser la
matrice Factory Quality.

## 7. Anti-patterns

| Anti-pattern | Risque | Correction |
|---|---|---|
| Copier un long etat projet dans plusieurs README. | Divergence rapide. | Lier `FOUNDATION_CURRENT_STATE.md`. |
| Promouvoir un core parce qu'une mission est terminee. | Statut gonfle sans preuve. | Faire une readiness review. |
| Corriger tous les rapports historiques. | Churn et perte de trace. | Marquer les rapports comme historiques si necessaire. |
| Ajouter un guide sans lien depuis l'index. | Document introuvable. | Mettre a jour `docs/README.md`. |
| Ignorer `docs/specifications/` et `docs/governance/`. | Mission incoherente. | Les lire au cadrage. |

## 8. Fin de mission

Le rapport final doit mentionner :

- branche, commit, PR ;
- fichiers crees/modifies ;
- statut avant/apres si applicable ;
- hors perimetre confirme ;
- gates executes ;
- limites connues ;
- prochaine mission recommandee.
