# Audit d'écart — Foundation V2 : implémentation vs cible

Synthèse exécutive. Détails et preuves dans les documents liés depuis
[`README.md`](README.md).

Base mesurée : `origin/main` (`179b2dc`) + PR #189 (socle V2 Phase 0 + Phase A), docs V2 comme cible.

## 1. État général

Le socle déterministe est **réel et sain** : moteur de composition par overlays déclaratifs, lock
reproductible, 354 tests Factory verts, Capability Contract v2 gelé, modèle d'applications, multi-surface,
domain compiler (NestJS), fitness functions de registre. C'est une base solide.

L'écart avec la cible V2 n'est pas un défaut de qualité, c'est un **écart de modèle et de couverture** :
la Foundation reste organisée autour du **starter** et de la verticale **TypeScript**, alors que la cible
est organisée autour du **système** (blueprint → runtime adapters → capabilities → primitives → contrats
→ conformité) et de la **neutralité polyglotte**. Maturité réelle : niveau **`Bootable`** du
[modèle de conformité](../specifications/CONFORMANCE_MODEL.md), pas `Conformant`.

## 2. Forces existantes (à conserver)

- Moteur déterministe et idempotent, overlays sans script arbitraire (`overlay.mjs`, `OVERLAY_CONTRACT.md`).
- Lock reproductible en workspace unifié, `npm install`→`npm ci` (`reproducibility.test.mjs`).
- Rendu adapter-owned (`overlay-renderers.mjs`, `target-adapters.mjs`).
- Capability Contract v2 (versions, targets, conflicts, provides, configuration, compatibility, migrations).
- Modèle d'applications + multi-surface générable (`applications.mjs`, `examples/blueprints/multi-surface.yaml`).
- Domain compiler seam (`domain.mjs`) : NestJS rend Prisma+CRUD+client.
- Fitness functions exécutables sur les registres (`fitness-functions.mjs`).
- Golden runtime : 21 compositions bootables prouvées en CI.
- Auth/RBAC extraits en overlays ; **Spring auth+rbac runtime-proven**.

## 3. Écarts critiques — P0 (bloquent le modèle cible)

| # | Écart | Type | Traitement | Preuve |
|---|---|---|---|---|
| **P0-1** | Aucune suite **Platform Contract exécutable** ni test de parité : la conformité et l'équivalence entre jumeaux ne sont **pas mesurables** | ARCHITECTURE/QUALITY | CREATE | `fitness-functions.mjs` (registre only) ; golden = boot, pas parité |
| **P0-2** | Contrats **centrés TypeScript** : source unique `packages/api-contracts`, génération TS seule, pas de Java/Dart | CONTRACT | REFACTOR/CREATE | `packages/api-contracts/scripts/generate.mjs` (openapi-typescript) |
| **P0-3** | Pas de **Canonical System Model** : enveloppe `version:"1"`, `capabilities` en enum figé, pas de primitives/communications/policies | ARCHITECTURE | REFACTOR | `factory/schema/blueprint.schema.json:12,75` |

## 4. Écarts P1 (empêchent parité ou industrialisation)

| # | Écart | Type | Traitement |
|---|---|---|---|
| P1-1 | **Lifecycle Manager absent** (diff/add/remove/upgrade/migrate/reconcile/rollback) ; pas d'ownership de fichiers | LIFECYCLE | CREATE |
| P1-2 | **Parité Web rompue** : Angular base-only (auth/rbac/files `planned`) | FUNCTIONAL | CREATE |
| P1-3 | **Parité Mobile rompue** : Flutter base-only (auth/files `planned`) | FUNCTIONAL | CREATE |
| P1-4 | **Parité API rompue sur Files** : `capabilities/files/targets/spring` absent | FUNCTIONAL | CREATE |
| P1-5 | **Primitives non modélisées** : cuites dans les packs Compose (postgres, minio) ; pas de type `primitives` | ARCHITECTURE | CREATE |
| P1-6 | **Capabilities cibles manquantes** : user-management, audit, events, notifications, observability | FUNCTIONAL | CREATE |
| P1-7 | **Artefacts de conformité non émis** : pas de `enistere.plan.json` ni `enistere.conformance.json` | LIFECYCLE | CREATE |
| P1-8 | **CI non verte** : gate `audit` rouge (CVE transitives) → base non industrialisable en l'état | OPERATIONS/SECURITY | REFACTOR |

## 5. Écarts P2/P3 (synthèse)

- **P2** — taxonomie de dépôt divergente (`starters/` vs `runtimes/`, pas de `contracts/primitives/goldens/feature-packs/platform`) ; structure runtime-adapter mince (`starter.manifest.json` vs `runtime.yaml`+extension-points/conformance) ; structure capability (`capability.json`+`targets/overlay` vs `capability.yaml`+`adapters/contracts/conformance`) ; styles d'architecture limités (workers/microservices refusés) ; registre de profils fixes (héritage 18 compositions) ; errors/permissions non versionnés en contrat ; pas de rollback/perf gates.
- **P3** — verbes CLI hors vocabulaire cible (`doctor/profiles/profile`) ; rapports de déploiement historiques (CC10/CC11) résiduels dans `deployment/docs` (hors périmètre) ; Angular/Flutter riches en tests mais du shell base uniquement.

## 6. Parité des runtimes

| Famille | Verdict | Détail |
|---|---|---|
| API — NestJS / Spring | **Quasi-parité sauf Files** | auth+rbac prouvés des deux côtés ; Files NestJS seul |
| Web — Next.js / Angular | **Pas de parité** | Angular = base only |
| Mobile — RN / Flutter | **Pas de parité** | Flutter = base only |

Détails : [matrice runtimes](RUNTIME_CONFORMANCE_GAP_MATRIX.md),
[matrice capabilities](CAPABILITY_PARITY_GAP_MATRIX.md).

## 7. Parité des capabilities

`base` : 6/6. `auth` : 4/6 (Angular, Flutter `planned`). `rbac` : 3/6 + RN `n/a` (Angular, Flutter
`planned`). `files` : 3/6 (Spring, Angular, Flutter `planned`). `user-management/audit/events/
notifications/observability` : 0/6 (absentes). Voir [parité](CAPABILITY_PARITY_GAP_MATRIX.md).

## 8. Blueprint et Factory

- Blueprint : enveloppe et modèle divergent (P0-3) ; multi-surface générable (acquis) ; workers/
  microservices refusés. Détail : [blueprint](BLUEPRINT_GAP_ANALYSIS.md).
- Factory : Generation Engine mûr (KEEP) ; Conformance Engine partiel ; **Lifecycle Manager absent** ;
  couplage starters/profils à refactorer ; primitives/communications/registry à créer. Détail :
  [factory](FACTORY_ENGINE_GAP_ANALYSIS.md).

## 9. Conformité et goldens

Niveau réel : **`Bootable`**. Les goldens prouvent génération + install reproductible + boot/build, **pas**
la conformité ni la parité. Aucune paire de jumeaux n'est prouvée équivalente. Détail :
[goldens & conformité](GOLDEN_AND_CONFORMANCE_GAP_ANALYSIS.md).

## 10. Incohérences, risques, dette

- **Incohérence de statut** : des targets `ready` (ex. Spring rbac, RN files) sont solides, mais « ready »
  au sens manifeste ≠ « conformant » au sens V2 ; le vocabulaire de statut devra être requalifié.
- **Risque majeur** : la neutralisation des contrats (P0-2) est le chantier `CRITICAL` ; mal séquencé, il
  casse tous les runtimes. À traiter seul, après un modèle stable.
- **Risque immédiat** : le gate `audit` est rouge (`brace-expansion`, `js-yaml`, `body-parser` — CVE du
  jour), reproduit en local. Il affecte `main` autant que les PR ouvertes. **Merger « une base propre sur
  main » est bloqué tant que ce bump n'est pas fait** ; le forcer serait un succès artificiel contraire à
  la gouvernance (« les audits ne sont jamais désactivés pour rendre une CI verte »).
- **Dette architecturale** : organisation starter/TS-centrée, absence de conformité commune, lifecycle
  absent — cohérente avec un projet arrivé au niveau `Bootable`, à faire converger sans casser le socle.

## Décisions nécessaires

1. Traiter le bump CVE **avant** toute consolidation sur `main` (Phase 0).
2. Investir d'abord dans la **mesurabilité** (Canonical System Model + Platform Contract exécutable) avant
   toute extraction d'adapter supplémentaire.
3. Séquencer la neutralisation des contrats seule.

## Roadmap recommandée

`0 débloquer → 1 CSM → 2 Platform Contract → 3 resolver → 4 API (Files Spring) → 5 contrats polyglottes →
6 Web (Angular) → 7 Mobile (Flutter) → 8 capabilities → 9 goldens parité → 10 lifecycle → 11 distribué`.
Détail : [roadmap](PRIORITIZED_REFACTORING_ROADMAP.md).

## Prochaine action unique

> **Rendre le Platform Contract exécutable pour la famille API** : définir un Canonical System Model
> minimal et une suite de conformité commune NestJS↔Spring (avec premiers tests de parité observable),
> sans extraire de nouvel adapter ni modifier les contrats.

C'est le plus fort levier : deux adapters API existent déjà et bootent ; les rendre **prouvablement
conformes et équivalents** débloque toute la stratégie de parité. Prérequis opérationnel : le bump CVE
(Phase 0) pour retrouver une CI verte.
