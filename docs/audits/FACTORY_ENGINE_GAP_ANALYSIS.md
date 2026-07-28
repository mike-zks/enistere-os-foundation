# Analyse d'écart — Moteur Factory

> **CLOS — analyse historique, arrêtée au 2026-07-27.**
> Le moteur a été refondu depuis (ADR-067, ADR-072).
> Ce document est conservé comme preuve de l'état observé à sa date : **il ne décrit
> plus le dépôt**. L'état courant fait foi —
> [`FOUNDATION_CURRENT_STATE`](../project-status/FOUNDATION_CURRENT_STATE.md),
> [`TARGET_VS_CURRENT_IMPLEMENTATION`](TARGET_VS_CURRENT_IMPLEMENTATION.md).

Cible : [Architecture technique](../architecture/technical/ENISTERE_TECHNICAL_ARCHITECTURE.md),
[Composition Model](../specifications/COMPOSITION_MODEL.md),
[Lifecycle & Upgrade](../specifications/LIFECYCLE_AND_UPGRADE_SPECIFICATION.md).
Réel : `factory/engine/*.mjs`, `factory/cli/enistere.mjs`, `factory/quality/scripts/*`.

## Pipeline cible vs réel

| Étage cible | Module réel | État |
|---|---|:--:|
| Blueprint Compiler → Canonical System Model | `blueprint/normalize.mjs` + `model/canonical-system.mjs` | COMPLIANT |
| Architecture Resolver (graphe apps/caps/prims/comms) | `resolver.mjs` + `capabilities.mjs` ; graphes apps/comms/capabilities, besoins primitifs par capability | PARTIAL |
| Composition Planner | `plan.mjs` + `model/generation-plan.mjs` | COMPLIANT |
| Generation Engine | `generator.mjs`, `overlay.mjs`, `overlay-renderers.mjs`, `prisma-schema.mjs`, `domain.mjs` | COMPLIANT |
| Conformance Engine | `fitness-functions.mjs` (registre) + golden runtime ; **pas de Platform Contract suite** | PARTIAL |
| Lifecycle Manager | **absent** | MISSING |
| Component Registry | manifests Capability v2 locaux versionnés, digests d’overlays ; distribution/signature absentes | PARTIAL |

## Composant par composant

| Sujet | Preuve | Traitement |
|---|---|---|
| Overlays déclaratifs (engine = seul interprète) | `overlay.mjs`, `OVERLAY_CONTRACT.md` ; overlays sans script arbitraire | **KEEP** |
| Rendu adapter-owned | `overlay-renderers.mjs`, `target-adapters.mjs` (PR #189 `2a26fbe`) | **KEEP** |
| Composition Prisma structurée | `prisma-schema.mjs` (fragment typé, pas de parsing texte) | **KEEP** |
| Domain compiler (seam) | `domain.mjs` : capability synthétique ; `renderDomain` NestJS (Prisma+CRUD+client), autres `planned` | **KEEP / EXTRACT** |
| Résolution dépendances + lock reproductible | `dependencies.mjs`, `reproducibility.test.mjs` ; workspace unifié, `npm install`→`npm ci` | **KEEP** |
| Fitness functions | `fitness-functions.mjs` (FF1–FF5, invariants de **registre**) | **KEEP / EXTRACT** vers conformité runtime |
| Couplage aux starters | sept runtimes ; adapters versionnés ; vue slots conservée pour compatibilité presets | **ADAPT** |
| Couplage aux profils | `profiles.mjs` registre nommé (héritage 18 compositions) | **REFACTOR / DEFER** |
| Canonical System Model | modèle neutre unique et pipeline gardé par FF6–FF8 | **KEEP / EXTEND** |
| Primitives / communications | communications minimales résolues ; exigences primitives des capabilities résolues, providers système absents | **EXTEND** |
| Diff / add / remove / upgrade / migrate / reconcile / rollback | CLI = `doctor/profiles/profile/init/plan/generate/install/verify` (`enistere.mjs:17`) | **CREATE** |
| Ownership de fichiers (Factory/user-owned) | non modélisé ; régénération complète | **CREATE** |
| Registry versionné/signé (checksums/SBOM) | absent ; lock porte des digests d'overlays | **CREATE** |

## Déterminisme et idempotence

**Tenus.** `reproducibility.test.mjs` prouve : mêmes entrées → mêmes manifestes et même lock ;
`overlay.mjs` calcule un digest sha256 (manifeste + payload) ; lock trié stable (`generator.mjs`). C'est
une **force** à conserver telle quelle.

## Gestion des conflits et versions

- Conflits de fichiers : refus sur conflit non déclaré (`overlay.mjs`, politique
  `overwrite-policy.mjs`). **KEEP.**
- Conflits de capabilities : symétriques, expliqués et bloquants via le
  manifeste v2 + FF3. **KEEP.**
- Versions : manifest, adapters et overlays sont alignés ; migrations possédées
  et référencées par target. Leur exécution lors d’un upgrade in-place attend
  l’Evolution Engine. **PARTIAL → CREATE.**

## Synthèse des traitements

- **KEEP** : overlays, rendu adapter-owned, Prisma structuré, lock reproductible, déterminisme,
  refus de conflits, fitness functions de registre, domain seam.
- **REFACTOR** : couplage starters/slots → runtime adapters génériques ; blueprint → Canonical System
  Model ; profils fixes.
- **EXTRACT** : fitness functions de registre → conformité runtime ; domain seam → compiler de domaine
  polyglotte.
- **CREATE** : Lifecycle Manager (diff/upgrade/migrate/reconcile/rollback), ownership de fichiers,
  résolution primitives/communications, registry versionné, Evolution Engine.
- **REMOVE** : rien dans le moteur (les artefacts historiques à retirer sont documentaires et hors
  périmètre de cet audit).
