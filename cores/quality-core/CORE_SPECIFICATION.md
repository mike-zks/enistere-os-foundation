# Quality Core — Spécification du Core

## 1. Résumé exécutif

Le **Quality Core** est le core de gouvernance qualité d'Enistere OS Foundation.

Son rôle est de formaliser les exigences de qualité qui s'appliquent à tous les cores, packages et
workflows du monorepo. Il ne remplace pas les CI existantes et n'ajoute aucune automatisation
nouvelle en V2. Il documente ce qui existe déjà, le rend explicite et le rend utilisable comme
référence de décision.

Cette spécification est documentaire. Elle ne crée pas de workflow GitHub, pas de script
d'exécution destructrice, pas de dépendance, pas de configuration de package, pas de code
applicatif et pas d'infrastructure réelle.

Statut courant : **SPECIFICATION_DOCUMENTAIRE** (Quality Core 2, 2026-07-11).

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

### 3.2 Hors périmètre V2 (différé VF ou V3)

- Nouveaux workflows GitHub Actions.
- Templates PR et templates d'issue GitHub.
- Scripts de génération de changelog ou d'automatisation de release.
- Publication de métriques de couverture.
- Tableaux de bord qualité temps réel.
- Intégration de linters ou outils de qualité supplémentaires.
- Tests de performance, tests de charge, tests d'accessibilité automatisés.
- Prompts IA standardisés (ADR-022, différé).

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
