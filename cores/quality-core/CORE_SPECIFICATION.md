# Quality Core — Spécification du Core

## 1. Résumé exécutif

Le **Quality Core** est le core de gouvernance qualité d'Enistere OS Foundation.

Son rôle est de formaliser les exigences de qualité qui s'appliquent à tous les cores, packages et
workflows du monorepo. Il ne remplace pas les CI existantes. Il documente ce qui existe déjà, fournit
des scripts sûrs de sélection de gates locaux et rend le processus utilisable comme référence de
décision.

Ce core reste non-runtime. Il ne crée pas de workflow GitHub, pas de script d'exécution destructrice,
pas de dépendance, pas de configuration de package, pas de code applicatif et pas d'infrastructure
réelle.

Statut courant : **IMPLEMENTATION_AVANCEE** (Quality Core Advanced Readiness Review, 2026-07-12).

> **Quality Core Advanced Readiness Review** promeut le core de `IMPLEMENTATION_PARTIELLE` a
> `IMPLEMENTATION_AVANCEE` : les criteres roadmap §13.4 sont couverts, la protection `main` est
> active, la release `foundation-v1.0.0` a utilise le processus gouverne, les prompts IA sont
> versionnes et les gates documentaires sont integres au scope `quality-gates docs`. `VALIDE_V1`
> reste differe : automatisation changelog/release, couverture publiee, dashboards qualite et
> CI qualite avancee restent hors perimetre courant ou VF.

> **Quality Core release helper** ajoute `scripts/release-helper.mjs` : helper local sans dependance
> qui liste les types de release gouvernes et genere un brouillon Markdown de notes de release depuis
> une plage de commits Git. Il ecrit uniquement sur stdout et ne cree aucun tag, aucune GitHub Release,
> aucun commit, aucun workflow et aucun fichier.

> **Quality Core V2 Readiness Review** promeut le core de `SPECIFICATION_DOCUMENTAIRE` à
> `IMPLEMENTATION_PARTIELLE` : matrice, script `quality-gates`, checklists, templates, ruleset
> actif, processus de release et usage réel lors de la publication `foundation-v1.0.0`. Les gaps
> restants (prompts IA standardisés, changelog/release automation, couverture publiée, checks
> avancés) empêchent une promotion plus haute.

> **Quality Core 7** standardise les prompts IA : `AI_PROMPT_GOVERNANCE.md`,
> `prompts/README.md` et `prompts/global/mission-brief-template.md`. Le gap roadmap §13.4
> "prompts IA versionnés" passe de partiel à cadré/opérationnel. Aucun runtime, workflow ou
> dépendance n'est ajouté.

> **Governance 3** constate l'activation réelle de la protection de `main` via GitHub
> Rulesets : ruleset `protect-main`, enforcement `active`, Pull Request obligatoire,
> suppression/non-fast-forward interdits, conversations résolues obligatoires, 8 status
> checks requis (`api-contracts`, `api-client-fetch`, `ui-kit`, `web-nextjs`, `audit`,
> `api-runtime`, `web-e2e`, `api-smoke`). Les jobs `images` restent recommandés phase 2.

> **Quality Core 5** ajoute `RELEASE_PROCESS_RUNBOOK.md` : processus de release gouverné —
> 5 définitions (merge / promotion / release Foundation / staging / production), 5 types de release,
> prérequis généraux, procédure en 8 étapes, format des notes, convention de tagging futur.
> Aucun workflow modifié. Aucune release créée. Aucune dépendance. Aucun changement runtime.

> **Quality Core 4** modernise les templates GitHub (`.github/PULL_REQUEST_TEMPLATE.md`,
> `.github/ISSUE_TEMPLATE/`) pour les aligner avec les gates qualité, les statuts de core,
> la sécurité et les checklists. Aucun workflow GitHub modifié. Aucune dépendance ajoutée.
> Aucun changement runtime.

> **Quality Core 3** ajoute `BRANCH_PROTECTION_RUNBOOK.md` : procédure d'activation manuelle
> de la protection de branche `main`, 10 noms de checks exacts (L1–L4). Statut historique :
> documenté ; statut courant : appliqué via GitHub Rulesets (Governance 3).

> **Quality Core 2** ajoute `scripts/quality-gates.mjs` (Node 24, sans dépendance) :
> sélection et exécution locale des gates qualité sûrs. Aucun workflow GitHub modifié.
> Aucune dépendance ajoutée. Aucun changement runtime.

## 2. Rôle du core

Le Quality Core doit :

- documenter les gates qualité réels du monorepo : tests, lint, typecheck, build, audit, E2E,
  images, smoke, docs/status, tokens, openapi ;
- fournir une matrice de gates utilisable par PR et par core ;
- fournir des checklists de décision pour les PRs, les releases et les revues de statut de core ;
- cadrer la relation entre les gates locaux et les gates CI ;
- définir la règle de tests Cloud (gates finaux, non locaux) ;
- préparer la gouvernance qualité V2 (roadmap §13) sans la livrer.

Le Quality Core ne doit pas :

- modifier les workflows GitHub existants ;
- ajouter de nouvelles dépendances npm ;
- exécuter des commandes destructrices ;
- modifier les cores runtime (API, Web, Mobile, UI Kit, Cloud) ;
- effectuer des tests Cloud réels ou SSH ;
- déclarer les cores Cloud / API / Mobile prêts sans revue dédiée.

## 3. Périmètre V2

### 3.1 Dans le périmètre V2 (roadmap §13.2)

- Documentation des gates qualité existants par core et par type de PR.
- Matrice gates × cores consolidée et maintenue à jour.
- Checklists PR, release et revue de statut.
- Référence aux workflows CI existants et à leur niveau de couverture.
- Cadrage de la progression de statut des cores (qui peut promouvoir, quand, avec quelles preuves).
- Préparation des ADR qualité futurs (ADR-019 à ADR-022 référencent quality-core).
- Gouvernance des prompts IA et catalogue de missions.

### 3.2 Hors périmètre V2 (différé VF ou V3)

- Nouveaux workflows GitHub Actions.
- ~~Templates PR et templates d'issue GitHub.~~ → **livré en Quality Core 4** (`.github/PULL_REQUEST_TEMPLATE.md`, `.github/ISSUE_TEMPLATE/`).
- Automatisation complète de changelog/release (écriture de `CHANGELOG.md`, tag, GitHub Release). Un
  helper local de brouillon stdout est livré par `scripts/release-helper.mjs`.
- Publication de métriques de couverture.
- Tableaux de bord qualité temps réel.
- Intégration de linters ou outils de qualité supplémentaires.
- Tests de performance, tests de charge, tests d'accessibilité automatisés.
- Prompts IA avancés automatisés ou intégrés à un RAG (ADR-022, différé).

## 4. Relation avec les ADR et la roadmap

### 4.1 ADR directement liés

| ADR | Décision | Statut implémentation | Lien Quality Core |
|---|---|---|---|
| ADR-013 | CI/CD V1 | PARTIELLEMENT_IMPLEMENTE | gates CI niveaux 1–4 documentés dans la matrice |
| ADR-014 | Registry images | PARTIELLEMENT_IMPLEMENTE | gate images documenté |
| ADR-019 | Error tracking (à rédiger) | — | sera défini via quality-core |
| ADR-020 | Tests standards (à rédiger) | — | sera consolidé dans la matrice |
| ADR-021 | CI qualité avancée (à rédiger) | — | prépare la gouvernance VF |
| ADR-022 | Prompts IA (à rédiger) | — | outillage IA qualité, hors périmètre V2 |

### 4.2 Roadmap §13 — Quality Core V2

Le Quality Core 1 (cette spécification) correspond au début du §13 : cadrage documentaire,
matrice des gates, checklists. Les chantiers §13.2 (workflows, templates, scripts, publication
couverture) sont différés à Quality Core V2/VF.

### 4.3 Roadmap §22 — Quality Core VF

Le Quality Core VF couvre : lint, formatting, unit tests, integration tests, E2E tests, dependency
audit, security audit, performance checks, accessibility checks, code review checklists, CI quality
gates. Cette spécification prépare le terrain en documentant l'existant.

## 5. Les 4 niveaux de qualité

Le monorepo distingue quatre niveaux de qualité, par ordre de rigueur croissante :

| Niveau | Périmètre | Fréquence | Obligatoire PR |
|---|---|---|---|
| **Local** | typecheck, lint, test, build sur le core modifié | à chaque commit | recommandé |
| **CI Level 1** | non-régression monorepo : api-contracts → api-client-fetch → ui-kit → web-nextjs → audit | chaque PR | oui (requis branche `main`) |
| **CI Level 2–3** | runtime API (PG+MinIO) + E2E navigateur (Playwright) | chaque PR | recommandé ; runtime requis PR API |
| **CI Level 4** | images GHCR + smoke runtime image (api-smoke) | PR→push GHCR sur `main` | gate du push |

## 6. Règle : tests Cloud = gates finaux

Les tests qui nécessitent un serveur réel, une connexion SSH, un environnement staging ou une
infrastructure persistante (Cloud Core CC10/CC11) ne sont **jamais** des gates locaux.

Ces tests sont effectués :

- manuellement selon le runbook CC11 ;
- par les workflows CI niveaux 2–4 (PG+MinIO jetables) pour les composants API/Web ;
- hors CI pour les tests staging réels (SSH, HTTPS, compose de prod).

Conséquence : une PR docs-only ou quality-core-only n'exige pas de test Cloud. Une PR qui
modifie l'API ou le Cloud Core doit passer les niveaux CI appropriés avant merge.

## 7. Gouvernance de la promotion de statut

La promotion du statut officiel d'un core (ex. IMPLEMENTATION_AVANCEE → VALIDE_V1) requiert :

1. Lecture complète de la spécification du core (`CORE_SPECIFICATION.md`).
2. Vérification des critères de validation définis dans la spécification.
3. Exécution des commandes de vérification locales.
4. Rapport de revue versionnée dans `docs/project-status/`.
5. Mise à jour de `IMPLEMENTATION_MATRIX.md`, `FOUNDATION_CURRENT_STATE.md`,
   `NEXT_ACTIONS.md`, `SESSION_HANDOFF.md` et `CHANGELOG.md`.
6. PR dédiée avec description de la justification.

Aucune promotion de statut n'est acceptée sans rapport de revue versionné.

## 8. Relation avec les cores runtime

Le Quality Core ne modifie pas les cores runtime. Il les documente.

| Core | Relation Quality Core |
|---|---|
| API Core NestJS | gates documentés dans la matrice ; tests dans CI niveau 2 |
| Web Core Next.js | gates documentés ; tests dans CI niveaux 1, 3 |
| Mobile Core React Native | gates documentés ; smoke documenté ; iOS bloqué Linux |
| UI Kit | gates documentés ; tokens:check documenté |
| Cloud Core | gates finaux staging ; runbook CC11 référencé |
| API packages | gates documentés dans CI niveau 1 |
