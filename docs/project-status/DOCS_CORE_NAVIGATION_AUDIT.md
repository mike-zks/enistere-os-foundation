# DOCS_CORE_NAVIGATION_AUDIT.md — Docs Core 2

> Date : 2026-07-12.
> Perimetre : documentation et gouvernance uniquement.

## Verdict

**Docs Core 2 — audit documentaire et dette de navigation/liens : REALISE.**

Le repository dispose maintenant :

- d'un index central : `docs/README.md` ;
- d'un Docs Core cadre : `factory/quality/core/CORE_SPECIFICATION.md` + `README.md` ;
- d'un README racine simplifie, qui ne duplique plus un etat technique long et fragile ;
- d'un registre ADR corrige pour les points UI Kit recents.

## Documents lus

- `strategy/04_ROADMAP_GLOBAL.md` §13 ;
- `strategy/05_EXECUTION_CHAIN.md` ;
- `strategy/10_AI_STRATEGY.md` ;
- `docs/README.md` ;
- `docs/project-status/README.md` ;
- `docs/project-status/FOUNDATION_CURRENT_STATE.md` ;
- `docs/project-status/IMPLEMENTATION_MATRIX.md` ;
- `docs/project-status/NEXT_ACTIONS.md` ;
- `docs/project-status/DECISIONS_REGISTER.md` ;
- `README.md`.

## Constats

| ID | Constat | Impact | Correction |
|---|---|---|---|
| D1 | `README.md` de racine dupliquait un etat projet long et date : Phase 0, UI Kit 9 primitives, Cloud CC9. | Forte probabilite de divergence avec `project-status`. | README racine rendu synthetique ; renvoi explicite vers `docs/README.md` et `docs/project-status/`. |
| D2 | `DECISIONS_REGISTER.md` indiquait encore ADR-008 comme partiel avec 12 primitives/121 tests. | Lecture ADR incompatible avec UI Kit `VALIDE_V1` et RN35. | ADR-008 passe a `IMPLEMENTE_ET_REVU` avec 19 primitives/181 tests + alignement mobile/web. |
| D3 | `FOUNDATION_CURRENT_STATE.md` section tests mentionnait encore UI Kit 121 tests/12 primitives et Web 446 tests. | Compteurs incoherents avec les validations recentes. | Compteurs alignes sur UI Kit 181 tests/19 primitives et Web Core 450 tests. |
| D4 | `docs/project-status/README.md` ne pointait pas vers le nouvel index central. | Navigation documentaire moins claire. | Lien vers `docs/README.md` ajoute lors de Docs Core 1. |

## Hors perimetre confirme

- Aucun code runtime modifie.
- Aucun workflow GitHub modifie.
- Aucune dependance ajoutee.
- Aucun script de generation documentaire.
- Aucun RAG, moteur de recherche ou site de documentation.
- Aucun deploiement ou test Cloud reel.

## Limites restantes

- Plusieurs rapports historiques contiennent volontairement des chiffres anciens. Ils sont acceptables si leur
  en-tete les marque comme historiques.
- `docs/project-status/DECISIONS_REGISTER.md` reste volumineux ; une revue ADR ciblee pourra encore reduire
  la duplication future.
- Les dossiers `docs/guides`, `docs/onboarding`, `docs/glossary` restent a structurer.

## Prochaine mission recommandee

Docs Core 3 — onboarding contributeur minimal et glossaire initial : creer un guide de demarrage pour
contributeurs/agents IA et un glossaire court des statuts/gates/cores, sans runtime ni generation automatique.
