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
    style: modular-monolith
  applications: []
  domains: []
  capabilities: []
  primitives: []
  communications: []
  environments: []
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

## Styles

- standard ;
- multi-client ;
- modular-monolith ;
- modular-monolith-with-workers ;
- service-oriented ;
- microservices.

Les microservices exigent des validations renforcées.

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
    kind: database
    engine: postgresql
    owner: core-api
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
