# DOCS_CORE_V2_READINESS_REVIEW.md — Docs Core V2 Readiness Review

> Date : 2026-07-12.
> Perimetre : documentation et gouvernance uniquement.

## Synthese

**Decision : Docs Core reste `IMPLEMENTATION_PARTIELLE`.**

Docs Core est coherent avec la trajectoire V2 : index central, audit de navigation, onboarding minimal,
glossaire initial et controle local des liens internes. En revanche, la specification du core fixe un seuil
plus strict pour `IMPLEMENTATION_AVANCEE` : onboarding documentaire complet, glossaire et guides principaux
presents, controle regulier des liens et processus de revue documentaire integre aux gates.

Le seuil `IMPLEMENTATION_PARTIELLE` est atteint et prouve. Le seuil `IMPLEMENTATION_AVANCEE` reste bloque par
l'absence de guides principaux et par le caractere encore minimal de l'onboarding/glossaire.

## Sources lues

- `strategy/04_ROADMAP_GLOBAL.md` §13 ;
- `strategy/02_GOVERNANCE.md` ;
- `factory/quality/core/CORE_SPECIFICATION.md` ;
- `factory/quality/core/README.md` ;
- `docs/project-status/DOCS_CORE_NAVIGATION_AUDIT.md` ;
- `docs/project-status/DOCS_CORE_LINK_CHECK_REPORT.md` ;
- `docs/checklists/CORE_STATUS_REVIEW_CHECKLIST.md` ;
- `docs/project-status/FOUNDATION_CURRENT_STATE.md` ;
- `docs/project-status/IMPLEMENTATION_MATRIX.md` ;
- `docs/project-status/NEXT_ACTIONS.md` ;
- `docs/project-status/SESSION_HANDOFF.md`.

## Roadmap V2 §13.4

| Critere V2 | Couverture observee | Verdict |
|---|---|---|
| Les PR ont des templates | Quality Core 4 livre les templates PR/issues, Docs Core les reference via l'index. | ✅ |
| Les tests peuvent etre lances | Quality Core expose les plans ; Docs Core ajoute `check-doc-links.test.mjs`. | ✅ |
| Les scripts fonctionnent | `check-doc-links.mjs` passe localement sur 54 fichiers. | ✅ |
| Les releases sont documentees | Quality Core 5 + release `foundation-v1.0.0` documentee ; Docs Core indexe le statut. | ✅ |
| Les prompts IA sont versionnes | Quality Core 7 + `factory/ai/prompts/README.md` ; Docs Core indexe les prompts. | ✅ |
| La documentation est structuree | `docs/README.md`, onboarding, glossaire, project-status et rapports Docs Core. | ✅ |
| Les checklists qualite existent | Checklists Quality Core presentes et referencees. | ✅ |

**Lecture :** les criteres V2 globaux sont couverts pour le couple Quality Core + Docs Core. Cette couverture
ne suffit pas a promouvoir Docs Core seul au niveau `IMPLEMENTATION_AVANCEE`, car ses criteres internes sont
plus precis.

## Criteres Docs Core

| Niveau | Critere `CORE_SPECIFICATION.md` §8 | Etat | Verdict |
|---|---|---|---|
| `IMPLEMENTATION_PARTIELLE` | Index central maintenu sur plusieurs missions. | Docs Core 1→4 l'ont maintenu. | ✅ |
| `IMPLEMENTATION_PARTIELLE` | Conventions de navigation appliquees. | Audit Docs Core 2 + README racine simplifie. | ✅ |
| `IMPLEMENTATION_PARTIELLE` | Liens vers cores actifs et rapports V1/V2 majeurs. | `docs/README.md` et project-status couvrent les chemins. | ✅ |
| `IMPLEMENTATION_PARTIELLE` | Dette documentaire suivie. | Audit navigation + rapport link check. | ✅ |
| `IMPLEMENTATION_AVANCEE` | Onboarding documentaire complet. | Onboarding present mais volontairement minimal. | ⚠️ |
| `IMPLEMENTATION_AVANCEE` | Glossaire et guides principaux presents. | Glossaire initial present ; guides principaux absents. | ❌ |
| `IMPLEMENTATION_AVANCEE` | Controle regulier des liens ou script de verification. | Script de verification present et teste. | ✅ |
| `IMPLEMENTATION_AVANCEE` | Processus de revue documentaire integre aux gates. | Gate local documente, pas encore integre comme gate CI obligatoire. | ⚠️ |

## Verification locale

Commandes executees pendant Docs Core 4 puis relancees pendant cette revue :

```bash
node factory/quality/core/scripts/docs-link-check.mjs
node --test factory/quality/core/scripts/check-doc-links.test.mjs
node factory/quality/core/scripts/quality-gates.mjs plan docs
node --test factory/quality/core/scripts/quality-gates.test.mjs
npm audit
git diff --check
```

Resultats :

- link check : `Docs Core link check passed (54 files)` apres ajout de ce rapport ;
- tests Docs Core : verts ;
- tests Quality Core : verts ;
- `npm audit` : 0 vulnerabilite ;
- `git diff --check` : propre.

## Gaps

| Gap | Bloquant pour `IMPLEMENTATION_AVANCEE` ? | Justification |
|---|---|---|
| Guides principaux absents dans `docs/guides/`. | Oui | La specification les cite explicitement pour `IMPLEMENTATION_AVANCEE`. |
| Onboarding encore minimal. | Oui | Suffisant pour demarrer, pas encore complet pour contribuer sans contexte conversationnel. |
| Link check non obligatoire en CI. | Non immediat | Le script est reproductible ; l'integration CI peut rester une mission ulterieure gouvernee. |
| Pas de site docs / RAG / recherche. | Non | Explicitement hors perimetre V2 initial de Docs Core. |

## Decision

Docs Core reste **`IMPLEMENTATION_PARTIELLE`**.

La prochaine mission doit fermer le gap principal : produire les guides documentaires de base et enrichir
l'onboarding pour que la documentation soit utilisable par un contributeur sans contexte conversationnel.

## Prochaine mission recommandee

**Docs Core 5 — guides principaux et onboarding complet** :

- creer `docs/guides/DOCUMENTATION_MAINTENANCE_GUIDE.md` ;
- creer `docs/guides/CORE_STATUS_REVIEW_GUIDE.md` ou equivalent ;
- enrichir `docs/onboarding/CONTRIBUTOR_ONBOARDING.md` avec un parcours de lecture par role ;
- relier les guides dans `docs/README.md` et `factory/quality/core/README.md` ;
- conserver un perimetre documentaire uniquement : aucun runtime, workflow, dependance, RAG ou site docs.
