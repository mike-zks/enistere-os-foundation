# Référence — Modular-distributed polyglotte

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
  architecture: { profile: modular-distributed }
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
| représentation | TARGET | modèle cible documenté |
| FastAPI, RabbitMQ, document DB | TARGET | non implémentés/arbitrés |
| communications distribuées | TARGET | pipeline actuel ne matérialise pas cette topologie |
| contrats polyglottes | TARGET | TypeScript seulement partiellement actif |
| système | TARGET | aucune preuve de génération/boot/conformité |
