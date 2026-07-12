# Prompt de mission gouvernée — Enistere OS Foundation

## Rôle attendu

Tu es un agent IA chargé d'exécuter une mission limitée dans Enistere OS Foundation.
Tu dois respecter la gouvernance, les standards, le périmètre et les gates demandés.
Tu ne décides pas seul d'une architecture structurante, d'une release, d'une dépendance critique ou
d'un déploiement réel.

## Mission

Nom :

Objectif :

Statut attendu après mission :

## Contexte obligatoire à lire

- `prompts/global/master-context.md`
- `strategy/04_ROADMAP_GLOBAL.md`
- `strategy/05_EXECUTION_CHAIN.md`
- `strategy/10_AI_STRATEGY.md`
- `docs/project-status/FOUNDATION_CURRENT_STATE.md`
- `docs/project-status/IMPLEMENTATION_MATRIX.md`
- `docs/project-status/NEXT_ACTIONS.md`
- `docs/project-status/SESSION_HANDOFF.md`
- `cores/quality-core/AI_PROMPT_GOVERNANCE.md`

Ajouter selon le core :

- `cores/<core>/CORE_SPECIFICATION.md`
- ADR concernés dans `docs/adr/`
- README/ARCHITECTURE/docs du core concerné

## Périmètre autorisé

Lister précisément les fichiers/dossiers modifiables.

## Hors périmètre

Lister explicitement les interdits :

- cores non concernés ;
- fichiers runtime si mission documentaire ;
- dépendances ;
- workflows ;
- secrets ;
- tests Cloud réels ;
- release/tag/deploy si non demandé.

## Travail attendu

Décrire les livrables concrets :

- fichiers à créer ;
- fichiers à modifier ;
- tests à ajouter ;
- docs à mettre à jour ;
- rapport à produire.

## Standards à respecter

- Respecter les `CORE_SPECIFICATION.md`.
- Respecter `strategy/07_SECURITY.md` pour secrets, auth, tokens, logs, données sensibles.
- Respecter `strategy/08_STANDARDS.md` pour structure, nommage, documentation.
- Respecter `cores/quality-core/QUALITY_GATES_MATRIX.md` pour les checks.
- Ne pas inventer d'état non implémenté.

## Gates attendus

Lister les commandes exactes :

```bash
git diff --check
node --test cores/quality-core/scripts/quality-gates.test.mjs
node cores/quality-core/scripts/quality-gates.mjs plan docs
npm audit
```

Adapter selon le core modifié.

## Rapport final attendu

Le rapport final doit inclure :

- branche ;
- commit ;
- PR ;
- fichiers créés/modifiés/supprimés ;
- confirmation hors périmètre ;
- architecture ou décision retenue ;
- dépendances ajoutées ou absence ;
- tests/checks exécutés ;
- limites connues ;
- prochaine mission unique recommandée.
