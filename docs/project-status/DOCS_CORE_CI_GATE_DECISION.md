# DOCS_CORE_CI_GATE_DECISION.md — Docs Core 6

> Date : 2026-07-12.
> Perimetre : documentation, Docs Core et Quality Core local gates uniquement.

## Decision

**Le link check Docs Core ne devient pas un check CI obligatoire separe pour le moment.**

Il devient en revanche un gate local officiel du scope Quality Core `docs` :

```bash
node factory/quality/core/scripts/quality-gates.mjs run docs
```

Le scope `docs` execute maintenant :

1. `git diff --check` ;
2. `node factory/quality/core/scripts/docs-link-check.mjs`.

## Justification

Ajouter un nouveau check CI obligatoire implique de modifier les workflows et le ruleset de protection de
`main`. Ce n'est pas justifie tant que :

- le check est deja reproductible localement ;
- les PR documentaires passent deja par la CI monorepo existante ;
- `main` est protege par les checks requis actuels ;
- Docs Core reste un core documentaire, sans runtime applicatif.

La bonne integration V2 a ce stade est donc locale et gouvernee : le gate est accessible via Quality Core,
documente, testable et utilisable avant PR.

## Livrables

- `factory/quality/core/scripts/quality-gates.mjs` : scope `docs` etendu au link check ;
- `factory/quality/core/scripts/quality-gates.test.mjs` : tests mis a jour ;
- project-status et docs de pilotage alignes.

## Hors perimetre confirme

- Aucun workflow GitHub modifie.
- Aucun ruleset GitHub modifie.
- Aucune dependance ajoutee.
- Aucun runtime applicatif modifie.
- Aucun site documentaire, RAG, moteur de recherche ou generation automatique.
- Aucun test Cloud/staging reel.

## Verifications

```bash
node factory/quality/core/scripts/quality-gates.mjs plan docs
node factory/quality/core/scripts/quality-gates.mjs run docs
node --test factory/quality/core/scripts/quality-gates.test.mjs
node --test factory/quality/core/scripts/check-doc-links.test.mjs
npm audit
git diff --check
```

Resultats :

- `quality-gates plan docs` : 2 etapes (`git diff --check`, link check) ;
- `quality-gates run docs` : 2/2 gates passes, `Docs Core link check passed (58 files)` ;
- tests Quality Core : verts ;
- tests Docs Core link check : verts ;
- `npm audit` : 0 vulnerabilite ;
- `git diff --check` : propre.

## Limites

- Le link check ne verifie toujours pas les ancres Markdown.
- Les liens externes restent hors scope.
- Le gate CI obligatoire peut etre reconsidere si la dette documentaire augmente ou si une release l'exige.

## Prochaine mission recommandee

Docs Core V1 Readiness Review — verifier si Docs Core peut passer de `IMPLEMENTATION_AVANCEE` a `VALIDE_V1`
avec les preuves actuelles : index central, chemins de lecture des cores actifs, rapports courants/historiques
distingues et gates documentaires reproductibles.
