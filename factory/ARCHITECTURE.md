# Architecture de la Factory — pipeline canonique unique

Décision : [ADR-046](../docs/adr/ADR-046-single-canonical-factory-pipeline.md). Après l'ingestion, le
**Canonical System Model** est l'unique représentation interne ; aucune couche ne relit le blueprint brut.

## Flux

```text
Blueprint utilisateur
      ↓  readBlueprint + assertBlueprint            (factory/engine/blueprint.mjs)   [entrée]
      ↓  normalizeBlueprint                         (factory/blueprint/normalize.mjs) [ingestion, seule à lire le blueprint]
Canonical System Model                              (factory/model/canonical-system.mjs)
      ↓  validateCanonicalSystem                    (factory/blueprint/validate.mjs)
      ↓  resolveSystem(csm, registry)               (factory/engine/resolver.mjs)
Resolved System                                     (factory/model/resolved-system.mjs)
      ↓  buildPlan(resolvedSystem)                  (factory/model/generation-plan.mjs)
Generation Plan
      ↓  materializeProject(plan, destination)      (factory/engine/generator.mjs)   [générateur, ne lit que le plan]
Projet généré
```

`generateProject(blueprint, output)` (générateur, orchestrateur) enchaîne toute la chaîne puis écrit
`enistere.yaml` (provenance). Le générateur proprement dit, `materializeProject`, ne reçoit que le plan.

## Couches et responsabilités

| Couche | Module | Reçoit | Responsabilité |
|---|---|---|---|
| Entrée | `engine/blueprint.mjs` | fichier | parse + schéma (`BLUEPRINT_*`) |
| Ingestion | `blueprint/normalize.mjs` | blueprint | traduction pure → CSM |
| Modèle d'intention | `model/canonical-system.mjs` | — | forme immuable + digest CSM |
| Validation modèle | `blueprint/validate.mjs` | CSM | invariants (`CSM_*`), refus des topologies non générables |
| Résolution | `engine/resolver.mjs` | **CSM** | adapters, targets résolues, dépendances, support (`RESOLUTION_*`) |
| Modèle de résolution | `model/resolved-system.mjs` | — | immuable + `resolutionDigest` |
| Planification | `model/generation-plan.mjs` | **ResolvedSystem** | plan complet immuable + `planDigest` (`PLAN_*`) |
| Génération | `engine/generator.mjs` | **GenerationPlan** | matérialisation, aucune lecture blueprint |

## Modèles

- [Canonical System Model](model/CANONICAL_SYSTEM_MODEL.md) — l'intention normalisée.
- [Resolved System Model](model/RESOLVED_SYSTEM_MODEL.md) — la résolution.
- [Generation Plan](engine/GENERATION_PLAN.md) — l'entrée unique du générateur.

Les trois sont **profondément immuables** (`model/immutable.mjs`) et **déterministes**.

## Digests

- `systemDigest` — l'intention normalisée (CSM).
- `resolutionDigest` — CSM + composants résolus, versions, targets, dépendances.
- `planDigest` — le plan exact de génération.

Tous via une sérialisation canonique à clés triées (`stableStringify`), sans timestamp, chemin absolu ni
aléatoire ; chaque digest exclut son propre champ.

## Profils

Les profils sont des **presets** (`engine/profiles.mjs`) : `materializeProfileInput(profileId)` produit
un blueprint d'entrée qui suit la chaîne normale. Ni le planner ni le générateur ne lisent un profil ;
`plan.profile` est une étiquette descriptive de traçabilité.

## Frontière d'entrée

Seules les couches d'entrée/ingestion lisent le blueprint : `blueprint.mjs` (schéma),
`normalize.mjs` (traduction), `profiles.validateBlueprintProfile` et `applications.mjs`
(`resolveApplications`/`resolveStack`, primitives d'ingestion). L'outillage de génération de goldens
construit des blueprints d'entrée (`quality/scripts/golden-runtime.mjs`) — également côté entrée.
