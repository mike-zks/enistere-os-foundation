# Factory Quality Specification

## Objectif

Centraliser la sélection des gates, la vérification documentaire, les checklists, la préparation de
release et les règles de protection. Factory Quality ne modifie pas les runtimes applicatifs.

## Contrats

- un scope de gate expose commandes, cwd et exclusions ;
- `run` s'arrête au premier échec et propage son code ;
- les gates nécessitant device, Docker ou staging sont explicitement séparés ;
- aucune vulnérabilité n'est ignorée pour obtenir un résultat vert ;
- promotion, tag et release restent des décisions humaines.

## Sources

- `QUALITY_GATES_MATRIX.md`
- `BRANCH_PROTECTION_RUNBOOK.md`
- `RELEASE_PROCESS_RUNBOOK.md`
- `AI_PROMPT_GOVERNANCE.md`
- `scripts/`

## Validation

Les scripts utilisent Node built-in uniquement et sont couverts par `node:test`.
