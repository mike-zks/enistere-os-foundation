# Capability Manifest v2 — spécification normative

## 1. Définition

Une capability est une fonctionnalité réutilisable **optionnelle, composable,
ciblable et versionnée**. Elle se compose sur les points d’extension du Platform
Baseline ; elle n’embarque ni baseline alternatif, ni runtime complet.

Source normative :

- schéma : `factory/schema/capability.schema.json` ;
- validation/résolution :
  `factory/engine/capabilities.mjs` ;
- overlays : `factory/schema/overlay.schema.json`.

## 2. Structure réelle

```text
capabilities/<id>/
├── capability.json
└── targets/<runtime>/
    ├── overlay.json
    ├── files/
    └── fragments/
```

Les migrations et preuves restent possédées par la capability et sont
référencées depuis son manifest. Une target `planned`, `unsupported` ou
`not-applicable` ne possède aucun engagement d’adapter.

## 3. Forme du manifest

Tous les champs de premier niveau sont obligatoires et le contrat est fermé :

```json
{
  "schemaVersion": "2",
  "id": "files",
  "version": "0.2.0",
  "requires": ["auth", "rbac"],
  "conflicts": [],
  "responsibilities": ["upload", "metadata"],
  "contracts": [],
  "primitives": [],
  "configuration": {},
  "targets": {},
  "migrations": [],
  "conformance": []
}
```

### 3.1 Dépendances

`requires[]` contient uniquement des IDs de capabilities. Le resolver calcule
la closure transitive et un tri topologique stable :

```text
files demandé
  ├── auth ajouté
  └── rbac ajouté
        └── auth déjà présent

ordre = auth, rbac, files
```

Le plan expose obligatoirement :

```text
capabilityGraph.requested
capabilityGraph.autoIncluded
capabilityGraph.order
capabilityGraph.edges
```

Les cycles et références inconnues bloquent. L’ordre d’entrée ne change pas
l’ordre résolu.

### 3.2 Conflits

Un conflit est :

```json
{
  "id": "other-capability",
  "reason": "Both capabilities own the same exclusive protocol."
}
```

Il doit être :

- connu ;
- symétrique ;
- déclaré avec la même raison des deux côtés ;
- distinct de `requires`.

Une paire conflictuelle présente dans la closure bloque la résolution.

### 3.3 Contrats

Un contrat possède `id`, `version` SemVer et un kind parmi :

```text
api | event | schema | ui
```

Chaque target `ready` référence seulement les contrats qu’elle expose ou
consomme. Les bindings polyglottes restent un chantier distinct.

### 3.4 Primitives

Une exigence de primitive déclare :

```json
{
  "id": "files-object-store",
  "kind": "object-storage",
  "requirement": "required",
  "purposes": ["binary-content"]
}
```

Kinds autorisés :

```text
relational-database
document-database
cache
object-storage
content-repository
queue
broker
mail
push
search
telemetry-backend
secrets
```

Le manifest ne choisit jamais un provider. Par exemple :

```text
MinIO    → provider possible de object-storage
Alfresco → provider possible de content-repository
```

Ils ne sont pas interchangeables.

### 3.5 Configuration

Chaque option est typée :

```text
enum | string | boolean | integer
```

Elle peut déclarer `default`, `required` et `sensitive`. Une option sensible ne
porte jamais sa valeur dans le manifest.

### 3.6 Target ready

Une target `ready` déclare :

```json
{
  "status": "ready",
  "mode": "overlay",
  "adapter": {
    "id": "nestjs",
    "version": "1.0.0"
  },
  "contracts": ["files-api"],
  "primitives": ["files-object-store"],
  "deploymentModes": ["embedded"],
  "migrations": ["files-nestjs-database"],
  "conformance": ["files-nestjs-contract"]
}
```

Règles :

- l’ID adapter égale la target ;
- la version égale l’adapter réellement enregistré ;
- `deploymentModes` appartient à
  `embedded|dedicated-service|shared-service` ;
- chaque référence appartient au même manifest ;
- migration et suite référencées appartiennent à la même target ;
- un overlay `ready` existe et porte la même version.

Les autres statuts sont :

```text
planned | unsupported | not-applicable
```

Ils ne peuvent déclarer ni mode, ni adapter, ni engagements.

### 3.7 Migrations

Une migration déclare :

```text
id
target
kind: database|data|index|configuration
strategy: additive|transform|rebuild
path
order
```

Le chemin est relatif à la capability, sous la target propriétaire, et doit
exister. Le manifest ne fournit aucune commande libre.

### 3.8 Conformance

Une suite déclare :

```text
id
target
level: unit|integration|contract|e2e
evidence: overlay-verification|golden-runtime|repository-test
```

Toute target `ready` référence au moins une suite. Le champ `evidence` sélectionne
un mécanisme gouverné ; il n’exécute pas une commande arbitraire.

## 4. Résolution par application

Pour chaque application ciblée, `ResolvedSystem` et `GenerationPlan` portent :

```text
inclusion
status/mode
adapter/version
contracts
primitives
deploymentModes
migrations
conformance
```

Plusieurs applications utilisant le même runtime sont résolues séparément.
Plusieurs backends polyglottes reçoivent chacun leur adapter. Cette
représentation ne vaut pas preuve de génération du système distribué.

## 5. Matérialisation

Le générateur consomme uniquement `capabilityGraph.order`. Il ne recalcule ni
dépendance ni ordre.

Le projet dérivé publie :

```text
packages/contracts/capabilities.json
enistere.lock → plan.capabilityGraph
enistere.lock → plan.capabilityTargets
```

## 6. Exclusions obligatoires

Ne sont pas des capabilities :

```text
Configuration
Canonical Errors
Structured Logging
Correlation
Observability
Technical Audit
Security Baseline
Health
Diagnostics
Testing Foundation
Lifecycle Hooks
Extension Points
Build and Quality Gates
```

Ils appartiennent au Platform Baseline. Les domaines et capabilities déclarent
leurs règles d’audit métier, pas une seconde infrastructure d’audit.

## 7. Invariants de dépôt

- aucune capability nouvelle sans ADR et preuve ;
- aucun bundle interne ;
- aucun pipeline parallèle ;
- aucune commande libre dans un manifest ;
- aucun provider fictif dans une exigence de primitive ;
- aucun dossier `starters/*/base/` ;
- aucune `composition.baseSource`.

## 8. Statut du catalogue courant

`auth`, `rbac` et `files` satisfont la forme v2. Cela ne change pas leur matrice
de support ni leur statut de parité produit.
