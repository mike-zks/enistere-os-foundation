# DOCS_CORE_GUIDES_ONBOARDING_REPORT.md — Docs Core 5

> Date : 2026-07-12.
> Perimetre : documentation et gouvernance uniquement.

## Verdict

**Docs Core 5 — guides principaux et onboarding complet : REALISE.**

Docs Core passe de **`IMPLEMENTATION_PARTIELLE`** a **`IMPLEMENTATION_AVANCEE`**.

Justification :

- les guides principaux existent dans `docs/guides/` ;
- l'onboarding couvre maintenant les parcours par role ;
- le glossaire reste le point d'entree terminologique ;
- le controle de liens interne est scriptable et teste ;
- les gates documentaires sont documentes dans l'onboarding, les guides et le README Docs Core.

## Livrables

- `docs/guides/DOCUMENTATION_MAINTENANCE_GUIDE.md` ;
- `docs/guides/CORE_STATUS_REVIEW_GUIDE.md` ;
- `docs/onboarding/CONTRIBUTOR_ONBOARDING.md` enrichi par parcours de role ;
- index et project-status alignes.

## Criteres Docs Core

| Critere `IMPLEMENTATION_AVANCEE` | Preuve | Verdict |
|---|---|---|
| Onboarding documentaire complet | `CONTRIBUTOR_ONBOARDING.md` couvre lecture obligatoire, roles, demarrage, execution, gates, rapport final et contradictions. | ✅ |
| Glossaire et guides principaux presents | `GLOSSARY.md` + deux guides dans `docs/guides/`. | ✅ |
| Controle regulier des liens ou script de verification | `check-doc-links.mjs` + `check-doc-links.test.mjs`. | ✅ |
| Processus de revue documentaire integre aux gates | Guides + README Docs Core + onboarding listent les gates documentaires reproductibles. | ✅ |

## Hors perimetre confirme

- Aucun runtime applicatif modifie.
- Aucun workflow GitHub modifie.
- Aucune dependance ajoutee.
- Aucun site documentaire.
- Aucun RAG, moteur de recherche ou generation automatique.
- Aucun deploiement ou test Cloud reel.

## Verifications

```bash
node factory/quality/core/scripts/docs-link-check.mjs
node --test factory/quality/core/scripts/check-doc-links.test.mjs
node factory/quality/core/scripts/quality-gates.mjs plan docs
node --test factory/quality/core/scripts/quality-gates.test.mjs
npm audit
git diff --check
```

Resultats :

- link check : `Docs Core link check passed (57 files)` ;
- tests Docs Core : verts ;
- tests Quality Core : verts ;
- `npm audit` : 0 vulnerabilite ;
- `git diff --check` : propre.

## Limites restantes

- Le link check n'est pas encore un check CI obligatoire.
- Les ancres Markdown et liens externes ne sont pas verifies.
- Les guides restent V2 initiale ; un site documentaire ou RAG releve d'une version ulterieure.

## Prochaine mission recommandee

Docs Core 6 — CI/docs gate integration optionnelle : decider si le link check doit devenir un gate CI
obligatoire ou rester un gate local documente, puis implementer uniquement si la decision est positive.
