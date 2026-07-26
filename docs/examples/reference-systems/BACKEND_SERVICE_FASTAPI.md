# Référence — Backend service FastAPI

## Finalité et graphe

API headless d'analyse documentaire avec endpoint métier et service IA optionnel.

```text
clients externes → document-api (FastAPI)
                         ├── PostgreSQL
                         ├── MinIO
                         └── telemetry backend
```

## Blueprint cible

```yaml
apiVersion: enistere.io/v2alpha1
kind: SystemBlueprint
metadata: { name: document-api, version: 1.0.0 }
spec:
  architecture:
    profile: backend-service
    clients: { mode: none }
    backend: { style: modular-monolith }
    deployment: { coupling: coordinated }
    data: { ownership: bounded-context }
    communication: { primary: synchronous }
    operations: { maturity: standard }
  applications:
    - id: document-api
      kind: api
      runtime: fastapi
      capabilities: [authentication, authorization, files]
  domains:
    - id: documents
      owner: document-api
      auditRules: [document.uploaded, document.deleted]
  primitives:
    - { id: db, kind: relational-database, provider: postgresql, owner: document-api }
    - { id: objects, kind: object-storage, provider: minio, owner: document-api }
    - { id: telemetry, kind: telemetry-backend, provider: otel-compatible }
  policies:
    observability: { required: true, standard: opentelemetry }
    audit: { technicalAuditRequired: true, sensitiveOperationsRequired: true }
```

## Contrats et déploiement

Une unité `document-api`, OpenAPI public, schémas JSON et client(s) hors scope. PostgreSQL porte métadonnées
et ownership ; MinIO porte les blobs. Déploiement conteneurisé avec migrations ordonnées, readiness et
rollback applicatif.

## Baseline, audit et IA

FastAPI implémente le contrat API complet. L'audit technique couvre démarrage, auth, configuration,
permissions et opérations administratives ; le domaine déclare upload/delete. Une extension IA peut
ajouter extraction ou classification avec provider, evaluation et human review, sans changer le profil.

## Statut réel

| Élément | Statut | Preuve/limite |
|---|---|---|
| représentation cible | IMPLEMENTED partiel | profil et dimensions normalisés ; Blueprint V2 complet à livrer |
| runtime FastAPI base | CONFORMANT | 28/0/0 + golden `fastapi-base` boot/HTTP |
| composition complète décrite | PLANNED | capabilities FastAPI et primitives typées non générables |
| PostgreSQL/MinIO | IMPLEMENTED partiel | actifs existants sur autres runtimes, non qualifiés ici |
| système produit | TARGET | seule la base sans capability est prouvée |
