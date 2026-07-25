# System Blueprint Specification

## Finalité

Le blueprint décrit l’intention du système sans faire d’un framework la source de vérité.

## Structure

```yaml
apiVersion: enistere.io/v1alpha1
kind: SystemBlueprint

metadata:
  name: sample
  version: 1.0.0

spec:
  architecture:
    profile: product-platform
    evolutionTarget: distributed-platform
    clients: { mode: multiple }
    backend: { style: modular-monolith }
    deployment: { coupling: coordinated }
    data: { ownership: bounded-context }
    communication: { primary: synchronous }
    operations: { maturity: standard }
  applications: []
  domains: []
  capabilities: []
  primitives: []
  communications: []
  environments: []
  deployment: {}
  security: {}
  quality: {}
  ai: {}
  policies: {}
```

## Applications

```yaml
applications:
  - id: core-api
    kind: api
    runtime: nestjs

  - id: customer-web
    kind: web
    runtime: nextjs
    consumes: [core-api]

  - id: delivery-mobile
    kind: mobile
    runtime: flutter
    consumes: [core-api]
```

Plusieurs applications d’une même famille sont autorisées.

## Profils

- backend-service ;
- product-platform ;
- distributed-platform ;
- service-ecosystem.

Les règles détaillées sont définies dans
[ARCHITECTURE_PROFILE_SPECIFICATION.md](ARCHITECTURE_PROFILE_SPECIFICATION.md). Les syntaxes historiques
`api`, `monolith`, `multi-client`, `modular-distributed` et `microservices` peuvent être migrées à la
frontière d'entrée mais ne circulent pas dans le moteur.

## Capabilities

```yaml
capabilities:
  - id: authentication
    version: "^1.0.0"
    targets:
      - core-api
      - customer-web
      - delivery-mobile
```

## Primitives

```yaml
primitives:
  - id: primary-db
    kind: relational-database
    provider: postgresql
    owner: core-api
```

Les kinds normatifs sont définis dans
[INFRASTRUCTURE_PRIMITIVE_SPECIFICATION.md](INFRASTRUCTURE_PRIMITIVE_SPECIFICATION.md).

## Platform Baseline

Le baseline n'apparaît pas dans `capabilities`. Il est configuré par policies :

```yaml
policies:
  observability: { required: true, standard: opentelemetry }
  audit: { technicalAuditRequired: true, sensitiveOperationsRequired: true }
  security: { baseline: production }
```

## Communications

```yaml
communications:
  - from: customer-web
    to: core-api
    mode: sync
    protocol: http
    contract: public-api
```

## Fichiers

- `enistere.yaml` : intention humaine ;
- `enistere.lock` : résolution exacte ;
- `enistere.plan.json` : plan ;
- `enistere.conformance.json` : preuves.

Toute évolution incompatible exige une nouvelle version et une migration.
