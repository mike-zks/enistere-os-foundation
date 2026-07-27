# Référence — Distributed platform polyglotte

## Finalité et graphe

Core transactionnel Spring, service engagement NestJS et intelligence documentaire FastAPI, consommés
par plusieurs clients.

```text
Next.js / Angular / RN / Flutter
              │
          API Gateway
      ┌───────┼──────────┐
 core-api   engagement   document-ai
 (Spring)    (NestJS)     (FastAPI)
    │            │          │
 PostgreSQL   PostgreSQL   MongoDB? + MinIO
      └──────── RabbitMQ ────────┘
```

## Blueprint cible

```yaml
apiVersion: enistere.io/v2alpha1
kind: SystemBlueprint
metadata: { name: distributed-platform, version: 1.0.0 }
spec:
  architecture:
    profile: distributed-platform
    clients: { mode: multiple }
    backend: { style: distributed-services }
    deployment: { coupling: partially-independent }
    data: { ownership: bounded-context }
    communication: { primary: hybrid }
    operations: { maturity: advanced }
  applications:
    - { id: core-api, kind: api, runtime: spring, domains: [accounts, contracts] }
    - { id: engagement-api, kind: api, runtime: nestjs, domains: [notifications, campaigns] }
    - { id: document-ai, kind: api, runtime: fastapi, domains: [document-intelligence] }
    - { id: portal, kind: web, runtime: nextjs, consumes: [core-api, engagement-api] }
    - { id: admin, kind: web, runtime: angular, consumes: [core-api, document-ai] }
    - { id: field-mobile, kind: mobile, runtime: flutter, consumes: [core-api, document-ai] }
  primitives:
    - { id: core-db, kind: relational-database, provider: postgresql, owner: core-api }
    - { id: engagement-db, kind: relational-database, provider: postgresql, owner: engagement-api }
    - { id: documents, kind: object-storage, provider: minio, owner: document-ai }
    - { id: messages, kind: broker, provider: rabbitmq }
    - { id: telemetry, kind: telemetry-backend, provider: otel-compatible }
  communications:
    - { from: core-api, to: engagement-api, mode: async, protocol: amqp, contract: account.changed.v1 }
```

## Slice actuellement prouvé

La Factory ne revendique pas encore la matérialisation du système polyglotte
complet ci-dessus. ADR-066 prouve uniquement :

```yaml
applications:
  - id: core-api
    kind: api
    runtime: spring
    ownership: { team: core-team, domains: [core] }
  - id: engagement-api
    kind: api
    runtime: nestjs
    consumes: [core-api]
    ownership: { team: engagement-team, domains: [engagement] }
communications:
  - id: engagement-to-core
    from: engagement-api
    to: core-api
    mode: synchronous
    protocol: http
    contract: core-api.v1
    timeoutMs: 2000
    maxAttempts: 2
    identity: workload
    failurePolicy: degrade
```

Le plan déploie `core-api` avant `engagement-api` et inverse cet ordre pour le
rollback.

## Ownership, déploiement et résilience

Chaque API possède ses données et son pipeline de release. Les appels synchrones ont timeout et breaker ;
les événements critiques utilisent outbox, idempotence et DLQ. Le gateway ne contient pas de règles
métier. Les contrats sont générés en Java, TypeScript, Python et Dart.

## Audit, observabilité et IA

Les traces traversent gateway, API et broker. Les audits techniques restent par workload mais convergent
dans une recherche gouvernée. Les événements métier gardent leur domain owner. `document-ai` déclare
providers, RAG, évaluations, quotas, human review et mode dégradé sans IA.

## Statut réel

| Élément | Statut | Limite |
|---|---|---|
| représentation | IMPLEMENTED | applications, ownership et communications dans le CSM |
| slice Spring + NestJS | GENERATABLE / BOOTABLE après golden vert | deux backends, sync HTTP, aucune capability/client |
| FastAPI base | CONFORMANT | runtime seul prouvé ; service IA de l'exemple non implémenté |
| RabbitMQ, document DB | TARGET | providers non implémentés/arbitrés |
| communication versionnée minimale | IMPLEMENTED | artefact de graphe ; aucun appel métier interservice prouvé |
| contrats polyglottes | TARGET | TypeScript seulement partiellement actif |
| système polyglotte complet | TARGET | FastAPI, clients, RabbitMQ et primitives restent hors scope |
