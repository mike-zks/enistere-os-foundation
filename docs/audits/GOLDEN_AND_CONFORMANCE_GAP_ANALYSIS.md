# Analyse d'écart — Goldens et conformité

> Rapport fondé sur l'ancien modèle de statuts. Depuis ADR-057, `TARGET` et `PLANNED` précèdent les niveaux
> de preuve ; voir [TARGET_VS_CURRENT_IMPLEMENTATION.md](TARGET_VS_CURRENT_IMPLEMENTATION.md).

Cible : [Conformance Model](../specifications/CONFORMANCE_MODEL.md), Conformance Engine de
l'[architecture technique](../architecture/technical/ENISTERE_TECHNICAL_ARCHITECTURE.md).
Réel : `factory/test/*.test.mjs`, `factory/quality/scripts/{golden-runtime,fitness-functions}.mjs`,
`.github/workflows/factory-golden-runtime.yml`.

## Niveaux de conformité atteints

Le [modèle](../specifications/CONFORMANCE_MODEL.md) définit :
`TARGET → PLANNED → IMPLEMENTED → GENERATABLE → BOOTABLE → CONFORMANT → PRODUCT_EQUIVALENT →
PRODUCTION_READY`.

| Niveau | Preuve disponible | Atteint ? |
|---|---|---|
| TARGET/PLANNED | architecture adoptée / travail séquencé | **oui, selon composant** |
| Implemented | code des overlays/starters | **oui** (targets `ready`) |
| Generatable | `goldens.test.mjs` (structurel), tests d'absence | **oui** |
| Bootable | `golden-runtime` : install reproductible + gates réels (+ `GOLDEN_RUNTIME_START`) | **oui, partiel** (compositions couvertes) |
| **Conformant** | suites applicables communes | **non** — pas de Platform Contract suite |
| **Product-equivalent** | équivalence observable entre jumeaux | **non** |
| Production-ready | sécurité/exploitation/migration/perf/release | **non** |

## Ce que les goldens prouvent réellement

`golden-runtime.mjs` génère une composition en répertoire temporaire, prouve `npm install`→`npm ci`, puis
exécute les **gates propres de chaque application** (lint/test/build/e2e/openapi:check). C'est une preuve
de **génération + installation reproductible + boot/build**, pas de parité.

Compositions en CI (`factory-golden-runtime.yml:49-69`) :

- **NestJS** : `base`, `auth`, `auth-rbac`, `files` + `{next,react-native,angular,flutter}-base`.
- **Next.js** : `nest-next-auth`, `nest-next-auth-rbac`, `nest-next-files`.
- **React Native** : `triple-auth`, `triple-auth-rbac` (RBAC n/a), `triple-files`.
- **Spring** : `spring-base`, `spring-auth`, `spring-auth-rbac` + `{next,react-native,angular,flutter}-base`.
- **Angular / Flutter** : **uniquement** `*-base`.

## Boot ≠ parité

| Confusion à éviter | Réalité |
|---|---|
| « golden vert = conforme » | golden = *bootable/build*, pas *conformant* |
| « golden vert = parité » | aucun test ne compare l'observable NestJS vs Spring |
| « Angular/Flutter ont beaucoup de tests » | tests du **shell base** ; aucune capability exercée |
| « fitness functions = conformité d'archi » | FF1–FF5 valident le **registre** (manifestes/profils), pas le runtime |

## Suites manquantes (Conformance Engine)

| Suite cible | Réel | État |
|---|---|:--:|
| schema validation | tests de schéma présents | KEEP |
| Platform Contract tests | **absent** | CREATE (P0) |
| capability conformance | **absent** (par-composition seulement) | CREATE |
| architecture fitness functions | registre seulement | EXTRACT |
| contract tests | NestJS (`openapi-contract.e2e`) ; pas de suite commune | PARTIAL |
| runtime goldens | présents (voir ci-dessus) | KEEP |
| E2E goldens | partiels (auth flows TS) | PARTIAL |
| security gates | `audit-check.mjs`, secret scanning CI | PARTIAL |
| migration/rollback tests | `migrations.test.mjs` (structurel) ; pas de rollback | PARTIAL |
| performance budgets | **absent** | CREATE |

## Compositions réellement prouvées (résumé)

- **Prouvées bootables avec capabilities** : NestJS (auth/rbac/files), Next.js (auth/rbac/files),
  React Native (auth/files), Spring (auth/rbac).
- **Prouvées bootables base uniquement** : Angular, Flutter (toutes stacks).
- **Jamais prouvées conformes ni équivalentes** : aucune paire de jumeaux.

## Traitement

| Écart | Type | Sévérité | Traitement |
|---|---|:--:|---|
| Pas de Platform Contract suite exécutable | QUALITY/ARCHITECTURE | **P0** | CREATE |
| Pas de test de parité (product-equivalence) | QUALITY | **P0** | CREATE |
| Goldens de capability absents pour Angular/Flutter | QUALITY | P1 | CREATE (après adapters) |
| Pas de rollback/perf gates | QUALITY/OPERATIONS | P2 | CREATE |
| Golden runtime, fitness de registre, tests d'absence | QUALITY | — | KEEP |
