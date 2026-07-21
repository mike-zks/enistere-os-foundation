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
| `spec.architecture.style` | `architecture.style` (monolith/modular-monolith/microservices) | PARTIAL |
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
| API seule | générable | KEEP |
| API + plusieurs Web/Mobile | générable | KEEP (PR #189) |
| multi-client | partiel (via multi-surface) | PARTIAL |
| modular-monolith | style déclarable | PARTIAL |
| modular-monolith-with-workers | worker `planned`/refusé | MISSING |
| service-oriented / microservices | multi-API refusé | MISSING |

## Contraintes codées en dur

- `capabilities` est un **enum fermé** `[base,auth,rbac,files]` (`blueprint.schema.json:75`) : aucune
  capability hors de ces quatre n'est même exprimable, et sans version ni targets par application.
- `topology: "monorepo"` (const) : la seule topologie de dépôt.
- `deployment.environments` limité à `local`/`staging` : pas de `production`.
- L'invariant « une API obligatoire » est structurel (`MANDATORY_KIND`, `applications.mjs:79`) — conforme
  à la cible, mais gelé côté génération pour tout ce qui dépasse une API + surfaces.

## Profils fixes

Le moteur porte un registre de **profils nommés** (`factory/engine/profiles.mjs`) — une notion héritée du
modèle « 18 compositions » qui n'existe pas dans la cible V2 (le blueprint y décrit un système, pas un
profil parmi une liste finie). À terme : REFACTOR/DEFER vers le résolveur d'architecture.

## Traitement

| Écart | Type | Sévérité | Traitement |
|---|---|:--:|---|
| Enveloppe `version:"1"` vs `apiVersion/kind/metadata` + Canonical System Model | ARCHITECTURE | **P0** | REFACTOR |
| `primitives` / `communications` / `policies` absents | ARCHITECTURE | P1 | CREATE |
| `capabilities` enum figé (sans version/targets) | ARCHITECTURE | P1 | REFACTOR |
| `enistere.plan.json` / `enistere.conformance.json` non émis | LIFECYCLE | P1 | CREATE |
| workers / service-oriented / microservices refusés | ARCHITECTURE | P2 | CREATE (Phase distribuée) |
| Registre de profils fixes | ARCHITECTURE | P2 | REFACTOR / DEFER |
| Multi-surface générable | — | — | KEEP |
