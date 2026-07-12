# Docs Core

Docs Core est le core de documentation centrale d'Enistere OS Foundation.

Statut : **SPECIFICATION_DOCUMENTAIRE**.

## Livrables actuels

| Fichier | Role |
|---|---|
| `CORE_SPECIFICATION.md` | Cadrage du core, perimetre, exclusions, regles et criteres d'avancement |
| `../../docs/README.md` | Index central de la documentation Foundation |
| `../../docs/onboarding/CONTRIBUTOR_ONBOARDING.md` | Onboarding minimal contributeur/agent |
| `../../docs/glossary/GLOSSARY.md` | Glossaire initial des statuts, gates, cores et termes de securite |

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
node cores/quality-core/scripts/quality-gates.mjs plan docs
npm audit
```

Si Quality Core est modifie :

```bash
node --test cores/quality-core/scripts/quality-gates.test.mjs
```
