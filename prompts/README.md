# Prompts IA — Catalogue gouverné

> Références : `strategy/10_AI_STRATEGY.md`, `strategy/05_EXECUTION_CHAIN.md`,
> `cores/quality-core/AI_PROMPT_GOVERNANCE.md`.

## Objectif

Ce dossier contient les prompts versionnés d'Enistere OS Foundation.

Un prompt versionné est un support de travail pour agent IA. Il ne remplace pas :

- la décision humaine ;
- les ADR ;
- les `CORE_SPECIFICATION.md` ;
- les gates Quality Core ;
- la revue de PR.

## Règles d'utilisation

Avant toute mission IA :

1. Lire `prompts/global/master-context.md`.
2. Lire le prompt spécifique de mission ou de revue.
3. Lire les documents obligatoires listés dans le prompt.
4. Vérifier `docs/project-status/NEXT_ACTIONS.md` et `IMPLEMENTATION_MATRIX.md`.
5. Respecter le périmètre autorisé et les interdits.

## Catalogue

| Prompt | Usage | Statut |
|---|---|---|
| `global/master-context.md` | Contexte général à fournir à tout agent IA | actif |
| `global/execution-template.md` | Template générique d'exécution | actif |
| `global/review-template.md` | Template générique de revue | actif |
| `global/mission-brief-template.md` | Template gouverné pour missions Claude/Codex/Gemini | actif |
| `architecture/core-specification-generator.md` | Générer une spécification de core documentaire | actif |
| `documentation/readme-generator.md` | Générer ou améliorer un README fidèle au repository | actif |
| `review/core-specification-review.md` | Relire un `CORE_SPECIFICATION.md` | actif |
| `security/security-review.md` | Relire sécurité : secrets, auth, tokens, cloud, dépendances | actif |

## Dossiers à compléter

| Dossier | État |
|---|---|
| `devops/` | vide — futur prompts Cloud/CI, sous gouvernance sécurité |
| `generation/` | vide — futur prompts génération module/composant |
| `ux-ui/` | vide — futur prompts design/UI/a11y |

## Format minimal d'un nouveau prompt

Un nouveau prompt doit contenir :

- rôle attendu ;
- contexte ;
- objectif ;
- entrées nécessaires ;
- périmètre autorisé ;
- hors périmètre ;
- documents obligatoires ;
- livrables attendus ;
- gates ou vérifications ;
- format de réponse attendu.

## Responsabilités

| Rôle | Responsabilité |
|---|---|
| Pilote / architecte | Préparer la mission, vérifier roadmap/spec/ADR/project-status, décider du périmètre |
| Agent exécuteur | Produire les livrables dans le périmètre, exécuter les gates, rapporter les limites |
| Agent reviewer | Identifier défauts, risques, incohérences, tests manquants |
| Mainteneur humain | Valider les décisions structurantes, releases, tags et accès externes |

## Interdits

- Aucun secret réel dans un prompt.
- Aucune demande de contournement de CI, branch protection ou audit.
- Aucune mission multi-core sans périmètre explicite.
- Aucun déploiement réel sans runbook et validation humaine.
- Aucun état futur présenté comme déjà disponible.
