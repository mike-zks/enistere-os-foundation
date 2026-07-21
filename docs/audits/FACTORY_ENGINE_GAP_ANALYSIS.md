# Analyse d'écart — Moteur Factory

Cible : [Architecture technique](../architecture/technical/ENISTERE_TECHNICAL_ARCHITECTURE.md),
[Composition Model](../specifications/COMPOSITION_MODEL.md),
[Lifecycle & Upgrade](../specifications/LIFECYCLE_AND_UPGRADE_SPECIFICATION.md).
Réel : `factory/engine/*.mjs`, `factory/cli/enistere.mjs`, `factory/quality/scripts/*`.

## Pipeline cible vs réel

| Étage cible | Module réel | État |
|---|---|:--:|
| Blueprint Compiler → Canonical System Model | `blueprint.mjs` (valide, ne compile pas vers un CSM neutre) | PARTIAL |
| Architecture Resolver (graphe apps/caps/prims/comms) | `applications.mjs` + `capabilities.mjs` (partiel : pas de primitives/communications) | PARTIAL |
| Composition Planner | `plan.mjs` (`buildGenerationPlan`) | PARTIAL |
| Generation Engine | `generator.mjs`, `overlay.mjs`, `overlay-renderers.mjs`, `prisma-schema.mjs`, `domain.mjs` | COMPLIANT |
| Conformance Engine | `fitness-functions.mjs` (registre) + golden runtime ; **pas de Platform Contract suite** | PARTIAL |
| Lifecycle Manager | **absent** | MISSING |
| Component Registry | manifestes locaux ; pas de registre versionné/signé | PARTIAL |

## Composant par composant

| Sujet | Preuve | Traitement |
|---|---|---|
| Overlays déclaratifs (engine = seul interprète) | `overlay.mjs`, `OVERLAY_CONTRACT.md` ; overlays sans script arbitraire | **KEEP** |
| Rendu adapter-owned | `overlay-renderers.mjs`, `target-adapters.mjs` (PR #189 `2a26fbe`) | **KEEP** |
| Composition Prisma structurée | `prisma-schema.mjs` (fragment typé, pas de parsing texte) | **KEEP** |
| Domain compiler (seam) | `domain.mjs` : capability synthétique ; `renderDomain` NestJS (Prisma+CRUD+client), autres `planned` | **KEEP / EXTRACT** |
| Résolution dépendances + lock reproductible | `dependencies.mjs`, `reproducibility.test.mjs` ; workspace unifié, `npm install`→`npm ci` | **KEEP** |
| Fitness functions | `fitness-functions.mjs` (FF1–FF5, invariants de **registre**) | **KEEP / EXTRACT** vers conformité runtime |
| Couplage aux starters | `starters.mjs` `STARTER_IDS` figé à 6 ; `plan.mjs`/`generator.mjs` raisonnent en slots api/web/mobile | **REFACTOR** |
| Couplage aux profils | `profiles.mjs` registre nommé (héritage 18 compositions) | **REFACTOR / DEFER** |
| Canonical System Model | pas de modèle neutre intermédiaire ; le plan reste orienté « stack » | **CREATE** |
| Primitives / communications | non résolus | **CREATE** |
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
- Conflits de capabilities : champ `conflicts` du manifeste v2 + FF3
  (`fitness-functions.mjs:53`). **KEEP.**
- Versions : `compatibility.runtimes` et `migrations.from` figurent au schéma v2 mais ne sont pas encore
  consommés par un Evolution Engine (inexistant). **PARTIAL → CREATE.**

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
