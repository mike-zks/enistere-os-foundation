# AI_PROMPT_GOVERNANCE.md — Gouvernance des prompts IA

> Références : `strategy/05_EXECUTION_CHAIN.md`, `strategy/10_AI_STRATEGY.md`,
> `factory/quality/core/QUALITY_GATES_MATRIX.md`, `docs/project-status/NEXT_ACTIONS.md`.
> Statut : **Quality Core 7 — prompts IA standardisés**.

## 1. Objectif

Ce document définit comment préparer, exécuter et relire une mission confiée à un agent IA
(Codex, Claude Code, Gemini ou équivalent) dans Enistere OS Foundation.

L'objectif est de rendre les prompts :

- versionnés ;
- réutilisables ;
- liés aux documents de gouvernance ;
- limités par un périmètre clair ;
- vérifiables par des gates Quality Core ;
- compatibles avec une revue humaine.

## 2. Principe

```txt
L'IA exécute ou assiste.
Le pilotage gouverne.
Les documents cadrent.
Les tests valident.
L'humain décide.
```

Un prompt ne doit jamais demander à un agent de décider seul :

- une architecture structurante ;
- une dépendance critique ;
- une release ;
- un déploiement réel ;
- une modification multi-core non cadrée ;
- une manipulation de secret.

## 3. Responsabilités par rôle

| Rôle | Responsabilité | Ne doit pas faire |
|---|---|---|
| Pilote / architecte | Lire stratégie/spec/ADR/project-status, choisir la prochaine mission, cadrer le périmètre, vérifier les rapports, décider des revues et merges | Déléguer une décision structurante sans preuve |
| Agent exécuteur | Implémenter ou documenter dans le périmètre, exécuter les gates demandés, produire un rapport factuel | Modifier hors périmètre, ajouter une dépendance non validée, inventer un état |
| Agent reviewer | Auditer cohérence, sécurité, tests, docs et périmètre | Valider seul une PR critique |
| Mainteneur humain | Valider décisions, releases, tags, déploiements, secrets, accès externes | Remplacer les gates par une confiance implicite dans l'IA |

## 4. Lectures obligatoires par mission

Chaque mission IA doit préciser les documents à lire. Par défaut :

| Type de mission | Lectures minimales |
|---|---|
| Toute mission | `docs/project-status/NEXT_ACTIONS.md`, `FOUNDATION_CURRENT_STATE.md`, `IMPLEMENTATION_MATRIX.md`, `SESSION_HANDOFF.md` |
| Mission starter | `strategy/04_ROADMAP_GLOBAL.md`, `strategy/05_EXECUTION_CHAIN.md`, `starters/<starter>/CORE_SPECIFICATION.md` |
| Sécurité / auth / cloud / CI | `strategy/07_SECURITY.md`, ADR concernés, `factory/quality/core/QUALITY_GATES_MATRIX.md` |
| Release / statut | `factory/quality/core/RELEASE_PROCESS_RUNBOOK.md`, `docs/checklists/RELEASE_READINESS_CHECKLIST.md`, `CORE_STATUS_REVIEW_CHECKLIST.md` |
| Prompt IA | `strategy/10_AI_STRATEGY.md`, ce document, `factory/ai/prompts/README.md` |

## 5. Format minimal d'un prompt de mission

Un prompt gouverné doit contenir :

1. **Mission** — nom court et objectif.
2. **Contexte obligatoire** — documents à lire avant action.
3. **Périmètre autorisé** — fichiers/dossiers modifiables.
4. **Hors périmètre** — interdits explicites.
5. **Travail attendu** — livrables concrets.
6. **Gates attendus** — commandes et validations.
7. **Documentation attendue** — fichiers de statut, README, changelog.
8. **Rapport final attendu** — format factuel : branche, commit, fichiers, checks, limites, prochaine mission.

Le template de référence est `factory/ai/prompts/global/mission-brief-template.md`.

## 6. Classification des missions

| Classe | Exemples | Gates minimaux |
|---|---|---|
| Docs-only | project-status, README, runbook, prompt | `git diff --check`, `quality-gates plan docs`, audit root si PR |
| Quality Core | gates, checklists, templates, prompts | `quality-gates.test`, `plan docs`, audit root |
| Core runtime | API, Web, Mobile, UI Kit | gates du core dans `QUALITY_GATES_MATRIX.md` + CI |
| Sécurité critique | auth, CSRF, tokens, permissions, cloud | gates core + revue sécurité + docs sécurité |
| Release | tag, GitHub Release, promotion statut | release runbook + checklist + CI main verte |
| Cloud réel | staging, backup, rollback | runbook CC11 ; à regrouper comme gate final, pas à chaque PR |

## 7. Catalogue de prompts

Le catalogue vivant est `factory/ai/prompts/README.md`. Il référence :

- prompts globaux ;
- prompts de génération ;
- prompts de revue ;
- prompts sécurité ;
- prompts documentation ;
- dossiers vides à compléter.

Un nouveau prompt doit être ajouté au catalogue dans la même PR que sa création.

## 8. Règles de sécurité

- Ne jamais inclure `.env`, secrets, tokens, clés privées, mots de passe, cookies ou URL signées.
- Remplacer toute valeur sensible par un placeholder explicite.
- Ne jamais demander à un agent de contourner un check ou une protection de branche.
- Ne jamais donner à un agent un accès production par défaut.
- Les tests Cloud réels restent des gates finaux gouvernés, pas des tâches automatiques ordinaires.

## 9. Rapport final attendu d'un agent exécuteur

Le rapport final doit contenir :

- branche ;
- commit ;
- PR si ouverte ;
- fichiers créés/modifiés/supprimés ;
- confirmation hors périmètre ;
- architecture ou décision retenue ;
- dépendances ajoutées ou absence ;
- tests et checks exécutés avec résultat ;
- limites connues ;
- prochaine mission unique recommandée.

Le rapport ne doit pas masquer les blocages : un environnement absent, un test non exécuté ou un accès
réseau indisponible doit être indiqué clairement.

## 10. Critère de conformité

Une mission IA est conforme si :

- les lectures obligatoires sont explicitement listées ;
- le périmètre est limité ;
- les interdits sont vérifiables ;
- les gates sont adaptés au risque ;
- le rapport final permet une revue sans ambiguïté ;
- aucun état futur n'est présenté comme déjà implémenté.
