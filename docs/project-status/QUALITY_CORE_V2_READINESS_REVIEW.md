# QUALITY_CORE_V2_READINESS_REVIEW.md — Revue Quality Core V2

> Date : 2026-07-12
> Décision : **SPECIFICATION_DOCUMENTAIRE → IMPLEMENTATION_PARTIELLE**
> Périmètre : `factory/quality/core`, checklists, templates GitHub, ruleset `main`, release process

## Synthèse

Le Quality Core n'est plus seulement une spécification documentaire. Il fournit désormais des
artefacts opérationnels utilisés dans le flux réel du repository :

- matrice des gates qualité par core et type de PR ;
- script local `quality-gates.mjs` avec tests ;
- checklists PR, release et revue de statut ;
- templates PR/issues alignés avec les gates ;
- runbook de protection de branche ;
- processus de release gouverné ;
- application réelle du processus lors de la publication `foundation-v1.0.0`.

Le statut `SPECIFICATION_DOCUMENTAIRE` est donc trop faible. Le statut retenu est
**IMPLEMENTATION_PARTIELLE** : le core est exploitable pour gouverner les PRs et releases, mais ne
couvre pas encore tous les livrables V2 du roadmap §13.

## Critères Roadmap §13.4

| Critère V2 | Verdict | Preuve |
|---|---|---|
| Les PR ont des templates | ✅ | `.github/PULL_REQUEST_TEMPLATE.md`, templates issues |
| Les tests peuvent être lancés | ✅ | `quality-gates.mjs`, scopes `docs/packages/ui-kit/web/mobile-static/all-safe` |
| Les scripts fonctionnent | ✅ | `quality-gates.test.mjs`, `plan docs`, `list` |
| Les releases sont documentées | ✅ | `RELEASE_PROCESS_RUNBOOK.md`, `FOUNDATION_V1_RELEASE_NOTES.md`, release `foundation-v1.0.0` |
| Les prompts IA sont versionnés | ✅ | Quality Core 7 : `AI_PROMPT_GOVERNANCE.md`, `factory/ai/prompts/README.md`, `mission-brief-template.md` |
| La documentation est structurée | ✅ | README, matrice, runbooks, checklists, project-status |
| Les checklists qualité existent | ✅ | PR, release readiness, core status review |

Score après Quality Core 7 : **7/7 satisfaits** sur le périmètre V2 documentaire/opérationnel courant.

## Gaps Non Bloquants

| Gap | Bloquant pour IMPLEMENTATION_PARTIELLE ? | Justification |
|---|---|---|
| Pas de nouveaux workflows GitHub gérés par Quality Core | Non | Hors périmètre explicitement défini ; workflows existants restent sources d'exécution |
| Pas de changelog automatique/semi-automatique | Non | Roadmap V2 restant ; process manuel gouverné fonctionne |
| Pas de publication de couverture | Non | Différé VF/V2 avancée |
| Prompts IA avancés/RAG non livrés | Non | Versionnement et format standard livrés ; automatisation avancée différée |
| Les checks `images` ne sont pas requis dans `protect-main` | Non | Documentés comme recommandés phase 2 ; `api-smoke` requis |

## Vérifications Exécutées

| Commande | Résultat |
|---|---|
| `git diff --check` | ✅ |
| `node --test factory/quality/core/scripts/quality-gates.test.mjs` | ✅ |
| `node factory/quality/core/scripts/quality-gates.mjs plan docs` | ✅ |
| `npm audit` root | ✅ 0 vulnérabilité |

## Décision

Quality Core passe à **IMPLEMENTATION_PARTIELLE**.

Justification :

- le core dépasse la seule documentation statique ;
- le script local est testable et utilisé ;
- la protection `main` est active et documentée ;
- les templates PR/issues sont en place ;
- le processus de release a été utilisé pour `foundation-v1.0.0`.

Le passage à `IMPLEMENTATION_AVANCEE` ou `VALIDE_V1` exigera au minimum un cadrage ou une livraison des
gaps V2 restants : automatisation release/changelog, métriques/couverture, ou durcissement des checks
requis.

## Prochaine Action Recommandée

Docs Core 1 — documentation centrale navigable : créer le cadrage initial du Docs Core et un index
central des docs (`strategy`, ADR, `project-status`, runbooks, prompts, quality gates), sans runtime ni
génération automatique.
