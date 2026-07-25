# Analyse d'écart — Blueprint

Cible : [System Blueprint Specification](../specifications/SYSTEM_BLUEPRINT_SPECIFICATION.md).
Réel : `factory/schema/blueprint.schema.json`, `factory/engine/applications.mjs`,
`factory/engine/topologies.mjs`.

## Comparaison champ par champ

| Champ cible | Réel | État |
|---|---|:--:|
| `apiVersion: enistere.io/v1alpha1` | `version: "1"` | REFACTOR |
| `kind: SystemBlueprint` | absent (`topology: "monorepo"`) | CREATE |
| `metadata.{name,version}` | `project.{name,slug}` | REFACTOR |
| `spec.architecture.profile` + dimensions | `architecture.profile` + six dimensions ; alias v1 à la frontière | IMPLEMENTED |
| `spec.applications[]` | `applications[]` **ou** sucre `stack` | PARTIAL |
| `spec.domains[]` | `domain.entities[]` | PARTIAL |
| `spec.capabilities[]` (id + version + targets) | `capabilities[]` = enum figé `[base,auth,rbac,files]` | REFACTOR |
| `spec.primitives[]` | **absent** | CREATE |
| `spec.communications[]` | **absent** | CREATE |
| `spec.environments[]` | `deployment.environments` (`local`/`staging`) | PARTIAL |
| `spec.policies{}` | **absent** | CREATE |
| `enistere.lock` | émis (`generator.mjs:304`) | KEEP |
| `enistere.plan.json` | **non émis** (plan → stdout) | CREATE |
| `enistere.conformance.json` | **non émis** | CREATE |

## Topologies

`factory/engine/applications.mjs:76` (`assertGeneratableTopology`) :

- **Générable** : une API obligatoire + multi-surface (plusieurs `web`/`mobile` sur une API). Progrès
  réel de PR #189 (`b140e16`, `examples/blueprints/multi-surface.yaml`).
- **Déclarable mais refusé (`planned`)** : `worker`, `gateway`, `bff` (`topologies.mjs`,
  `assertGeneratableTopology:83`), et **plusieurs API** (multi-service, ligne 88).

| Topologie cible | Réel | État |
|---|---|:--:|
| `backend-service` | représentable ; compositions API seules générables selon preset | ADAPT |
| `product-platform` single/multiple clients | représentable ; multi-surface générable | ADAPT |
| `distributed-platform` | représentable ; multi-API refusé à la génération | PLANNED |
| `service-ecosystem` + style `microservices` | représentable ; multi-API refusé | PLANNED |
| workers/gateway/BFF | déclarables, `planned`/refusés | MISSING |

## Contraintes codées en dur

- `capabilities` est un **enum fermé** `[base,auth,rbac,files]` (`blueprint.schema.json:75`) : aucune
  capability hors de ces quatre n'est même exprimable, et sans version ni targets par application.
- `topology: "monorepo"` (const) : la seule topologie de dépôt.
- `deployment.environments` limité à `local`/`staging` : pas de `production`.
- L'invariant « une API obligatoire » est structurel (`MANDATORY_KIND`, `applications.mjs:79`) — conforme
  à la cible, mais gelé côté génération pour tout ce qui dépasse une API + surfaces.

## Profils fixes

Le moteur porte un registre de **presets de composition** historiquement nommés profils
(`factory/engine/profiles.mjs`). Il reste la preuve des combinaisons générables, mais il est distinct de
`architecture.profile`. Blueprint v2 devra renommer le champ racine `profile` en `generationPreset`.

## Traitement

| Écart | Type | Sévérité | Traitement |
|---|---|:--:|---|
| Enveloppe `version:"1"` vs `apiVersion/kind/metadata` + Canonical System Model | ARCHITECTURE | **P0** | REFACTOR |
| `primitives` / `communications` / `policies` absents | ARCHITECTURE | P1 | CREATE |
| `capabilities` enum figé (sans version/targets) | ARCHITECTURE | P1 | REFACTOR |
| `enistere.plan.json` / `enistere.conformance.json` non émis | LIFECYCLE | P1 | CREATE |
| matérialisation workers et profils distribués refusée | ARCHITECTURE | P2 | CREATE (Phase distribuée) |
| Registre de presets encore nommé profiles | VOCABULAIRE | P2 | ADAPT lors de Blueprint v2 |
| Multi-surface générable | — | — | KEEP |
