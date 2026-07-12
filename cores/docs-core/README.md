# Docs Core

Docs Core est le core de documentation centrale d'Enistere OS Foundation.

Statut : **IMPLEMENTATION_AVANCEE**.

Decision de revue : `DOCS_CORE_GUIDES_ONBOARDING_REPORT.md` ferme les gaps principaux identifies par
`DOCS_CORE_V2_READINESS_REVIEW.md` et promeut Docs Core a `IMPLEMENTATION_AVANCEE`.

## Livrables actuels

| Fichier | Role |
|---|---|
| `CORE_SPECIFICATION.md` | Cadrage du core, perimetre, exclusions, regles et criteres d'avancement |
| `../../docs/README.md` | Index central de la documentation Foundation |
| `../../docs/onboarding/CONTRIBUTOR_ONBOARDING.md` | Onboarding contributeur/agent avec parcours par role |
| `../../docs/glossary/GLOSSARY.md` | Glossaire initial des statuts, gates, cores et termes de securite |
| `../../docs/guides/DOCUMENTATION_MAINTENANCE_GUIDE.md` | Guide de maintenance documentaire |
| `../../docs/guides/CORE_STATUS_REVIEW_GUIDE.md` | Guide de revue de statut d'un core |
| `scripts/check-doc-links.mjs` | Controle local des liens Markdown internes |
| `../../docs/project-status/DOCS_CORE_V2_READINESS_REVIEW.md` | Revue de readiness V2 et decision de statut |
| `../../docs/project-status/DOCS_CORE_GUIDES_ONBOARDING_REPORT.md` | Rapport Docs Core 5 et promotion `IMPLEMENTATION_AVANCEE` |

## Responsabilite

Docs Core organise la navigation documentaire. Il ne remplace pas :

- les ADR ;
- les specifications de chaque core ;
- les runbooks specialises ;
- les rapports de statut ;
- les gates Quality Core.

## Lecture recommandee

1. `../../docs/README.md`
2. `../../docs/onboarding/CONTRIBUTOR_ONBOARDING.md`
3. `../../docs/project-status/README.md`
4. `../../docs/project-status/SESSION_HANDOFF.md`
5. `../../docs/project-status/NEXT_ACTIONS.md`
6. `../../cores/quality-core/README.md`

## Hors perimetre actuel

- aucun site de documentation ;
- aucun RAG ;
- aucun moteur de recherche ;
- aucune generation automatique ;
- aucun workflow GitHub ;
- aucun runtime applicatif.

## Gates

Pour une mission Docs Core documentaire :

```bash
git diff --check
node cores/docs-core/scripts/check-doc-links.mjs
node cores/quality-core/scripts/quality-gates.mjs plan docs
npm audit
```

Si Docs Core ou Quality Core est modifie :

```bash
node --test cores/docs-core/scripts/check-doc-links.test.mjs
node --test cores/quality-core/scripts/quality-gates.test.mjs
```
