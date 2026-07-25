# Référence — Service ecosystem complet

## Finalité et graphe

Plateforme réglementée multi-équipes : identity, customers, orders, payments, documents, notifications,
search et AI inference sont autonomes.

```text
Web/Mobile → Edge/BFF
                │
  ┌─────────────┼──────────────────────────┐
Identity Customers Orders Payments Documents AI
   │         │       │       │        │      │
 own DB    own DB   own DB  own DB  Alfresco MinIO/vector index
  └──────────────── RabbitMQ ──────────────┘
             telemetry / secrets control planes
```

## Blueprint cible (extrait)

```yaml
apiVersion: enistere.io/v2alpha1
kind: SystemBlueprint
metadata: { name: regulated-commerce, version: 1.0.0 }
spec:
  architecture:
    profile: service-ecosystem
    clients: { mode: multiple }
    backend: { style: microservices }
    deployment: { coupling: independent }
    data: { ownership: per-service }
    communication: { primary: hybrid }
    operations: { maturity: distributed }
  applications:
    - { id: identity, kind: api, runtime: spring, domains: [identity] }
    - { id: customers, kind: api, runtime: nestjs, domains: [customers] }
    - { id: orders, kind: api, runtime: spring, domains: [orders] }
    - { id: payments, kind: api, runtime: nestjs, domains: [payments] }
    - { id: documents, kind: api, runtime: spring, domains: [documents] }
    - { id: ai-inference, kind: api, runtime: fastapi, domains: [recommendations] }
    - { id: customer-web, kind: web, runtime: nextjs, consumes: [customer-bff] }
    - { id: field-mobile, kind: mobile, runtime: react-native, consumes: [mobile-bff] }
  primitives:
    - { id: events, kind: broker, provider: rabbitmq }
    - { id: content, kind: content-repository, provider: alfresco, owner: documents }
    - { id: blobs, kind: object-storage, provider: minio, owner: ai-inference }
    - { id: telemetry, kind: telemetry-backend, provider: otel-compatible }
    - { id: secrets, kind: secrets, provider: provider-required }
  policies:
    dataOwnership: strict
    distributedTracing: required
    contractCompatibility: required
```

## Déploiement et contrats

Chaque service possède datastore, SLO, pipeline, version et rollback. Les événements utilisent schémas
versionnés et compatibilité contrôlée ; les APIs externes passent par BFF/gateway. Les workflows longs sont
orchestrés/chorégraphiés explicitement, jamais cachés dans des retries.

## Sécurité, audit et résilience

Identités workload, moindre privilège, segmentation, rotation de secrets et policy enforcement. Audit
technique immuable et corrélé ; règles métier appartenant aux services. Outbox, DLQ, backpressure,
bulkheads, budgets d'erreur et exercices de restauration/chaos ciblés sont requis avant production.

## IA

Le service d'inférence est isolé, sans accès direct aux bases. RAG reçoit des projections autorisées.
Model/provider changes passent evaluations, approbation et canary ; un fallback non-IA existe.

## Statut réel

| Élément | Statut | Limite |
|---|---|---|
| profil et blueprint | TARGET | représentable dans la cible seulement |
| content repository/broker/secrets | TARGET | adapters absents |
| orchestration de services autonomes | TARGET | génération complète reportée en phase 15 |
| preuve opérationnelle | aucune | pas de golden, SLO ou scénario de panne |
| système | TARGET | ne pas présenter comme supporté |
