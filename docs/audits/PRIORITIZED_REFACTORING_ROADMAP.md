# Roadmap de refonte priorisée

> **CLOS — analyse historique, arrêtée au 2026-07-21.**
> La séquence décrite est achevée ; la roadmap maître fait foi.
> Ce document est conservé comme preuve de l'état observé à sa date : **il ne décrit
> plus le dépôt**. L'état courant fait foi —
> [`FOUNDATION_CURRENT_STATE`](../project-status/FOUNDATION_CURRENT_STATE.md),
> [`TARGET_VS_CURRENT_IMPLEMENTATION`](TARGET_VS_CURRENT_IMPLEMENTATION.md).

Dérivée des preuves de l'audit et alignée sur la
[roadmap V2](../roadmap/ENISTERE_FACTORY_V2_ROADMAP.md). Ordre par dépendance, pas par facilité.

## Phase 0 — Débloquer la base (prérequis)

- **Objectif** : base verte reproductible (le gate `audit` bloque `main`).
- **Prérequis** : aucun.
- **Livrables** : bump des CVE transitives (`brace-expansion`, `js-yaml`, `body-parser`) via lockfile ;
  merge de PR #189 (socle) et PR #190 (docs V2) sur `main`.
- **Risques** : LOW ; un bump de dépendances peut déplacer des résolutions transitives (à re-tester).
- **Critère de sortie** : `npm audit` + toute la CI verts sur `main`.

## Phase 1 — Canonical System Model

- **Objectif** : un modèle neutre intermédiaire, cible de compilation du blueprint.
- **Prérequis** : Phase 0.
- **Livrables** : envelope `apiVersion/kind/metadata` ; champs `primitives`/`communications`/`policies` ;
  `capabilities` versionnées avec targets par application ; `enistere.plan.json`.
- **Risques** : HIGH (rupture de schéma → SemVer + migration blueprint).
- **Sortie** : le plan est calculé depuis le CSM, plus depuis un « stack » figé.

## Phase 2 — Platform Contract exécutable

- **Objectif** : rendre la conformité **mesurable** (le manque le plus structurant, P0-1).
- **Prérequis** : Phase 1 (modèle stable).
- **Livrables** : suite Platform Contract par catégorie (API d'abord) ; premiers tests de parité
  observable NestJS↔Spring ; `enistere.conformance.json`.
- **Risques** : MEDIUM ; révèlera des non-conformités aujourd'hui masquées.
- **Sortie** : NestJS et Spring **prouvés conformes** à la même version du contrat.

## Phase 3 — Blueprint schema & resolver

- **Objectif** : résolveur d'architecture (graphe apps/caps/primitives/communications, ownership).
- **Prérequis** : Phases 1–2.
- **Livrables** : Architecture Resolver, résolution des primitives et communications, refus fondés.
- **Risques** : MEDIUM.
- **Sortie** : profils fixes remplacés par une résolution de composition.

## Phase 4 — Convergence API (NestJS/Spring)

- **Objectif** : parité API réelle, **Files inclus côté Spring**.
- **Prérequis** : Phase 2.
- **Livrables** : `capabilities/files/targets/spring`, goldens `spring-files`, conformité commune.
- **Sortie** : parité API prouvée par suite commune + goldens.

## Phase 5 — Architecture des contrats (polyglotte)

- **Objectif** : source canonique neutre, génération TS + Java + Dart (P0-2).
- **Prérequis** : Phases 1–2.
- **Livrables** : `contracts/{http,schemas,events,errors,permissions,telemetry}`, générateurs Java/Dart,
  fixtures ; `api-contracts`/`api-client-fetch` deviennent des *cibles* de génération.
- **Risques** : CRITICAL (touche tous les runtimes) ; séquencer seul.

## Phase 6 — Convergence Web (Next.js/Angular)

- **Objectif** : sortir Angular du base-only (P1).
- **Prérequis** : Phases 2, 5.
- **Livrables** : adapters Angular auth/rbac/files, goldens de capability Angular.

## Phase 7 — Convergence Mobile (React Native/Flutter)

- **Objectif** : sortir Flutter du base-only (P1).
- **Prérequis** : Phases 2, 5 (Dart).
- **Livrables** : adapters Flutter auth/files, goldens de capability Flutter.

## Phase 8 — Modèle de capabilities & nouvelles capabilities

- **Objectif** : structure cible (`adapters/contracts/conformance/`) + capabilities manquantes.
- **Prérequis** : Phase 5.
- **Livrables** : user-management, audit, events, notifications, observability ; nomenclature alignée
  (`auth`→authentication, `rbac`→authorization).

## Phase 9 — Goldens de parité

- **Objectif** : les quatre verticales de la roadmap V2 (NestJS/Spring × Next/Angular × RN/Flutter).
- **Prérequis** : Phases 4, 6, 7.

## Phase 10 — Lifecycle

- **Objectif** : Lifecycle Manager (diff/add/remove/upgrade/migrate/reconcile/rollback), ownership de
  fichiers, Evolution Engine (consomme `compatibility`/`migrations` du manifeste v2).
- **Prérequis** : Phases 1–3.

## Phase 11 — Architectures distribuées

- **Objectif** : workers, service-oriented, microservices (aujourd'hui `planned`/refusés).
- **Prérequis** : lifecycle + contrats + conformance matures.

## Ordre synthétique

`0 débloquer → 1 CSM → 2 Platform Contract → 3 resolver → 4 API → 5 contrats → 6 Web → 7 Mobile →
8 capabilities → 9 goldens parité → 10 lifecycle → 11 distribué`.
