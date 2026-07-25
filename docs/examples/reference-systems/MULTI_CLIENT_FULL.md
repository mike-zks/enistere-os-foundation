# Référence — Multi-client NestJS

## Finalité et graphe

Une autorité métier sert portail client, administration et deux applications mobiles.

```text
customer-web (Next.js) ─┐
admin-web (Angular) ────┼→ core-api (NestJS) → PostgreSQL / Redis / MinIO
mobile-rn ──────────────┤                     ↘ mail / push
mobile-flutter ─────────┘
```

## Blueprint cible

```yaml
apiVersion: enistere.io/v2alpha1
kind: SystemBlueprint
metadata: { name: citizen-platform, version: 1.0.0 }
spec:
  architecture: { profile: multi-client, evolutionTarget: modular-distributed }
  applications:
    - { id: core-api, kind: api, runtime: nestjs,
        capabilities: [authentication, authorization, user-management, files, events, notifications] }
    - { id: customer-web, kind: web, runtime: nextjs, consumes: [core-api],
        capabilities: [authentication, authorization, files, notifications] }
    - { id: admin-web, kind: web, runtime: angular, consumes: [core-api],
        capabilities: [authentication, authorization, user-management, files] }
    - { id: mobile-rn, kind: mobile, runtime: react-native, consumes: [core-api],
        capabilities: [authentication, files, notifications] }
    - { id: mobile-flutter, kind: mobile, runtime: flutter, consumes: [core-api],
        capabilities: [authentication, files, notifications] }
  primitives:
    - { id: db, kind: relational-database, provider: postgresql, owner: core-api }
    - { id: cache, kind: cache, provider: redis, owner: core-api }
    - { id: media, kind: object-storage, provider: minio, owner: core-api }
    - { id: mail, kind: mail, provider: smtp }
    - { id: push, kind: push, provider: provider-required }
```

## Contrats, sécurité et déploiement

`core-api.v1` produit bindings TypeScript et Dart. Chaque client est une unité de déploiement ; l'API
reste seule autorité serveur. Web utilise sessions/cookies adaptés ; Mobile utilise secure storage et deep
links validés. Les permissions sont identiques en sémantique, idiomatiques en UX.

## Audit et observabilité

Correlation propagée depuis chaque canal. L'audit distingue acteur, client, appareil/session et opération
métier. La télémétrie client respecte consentement et privacy ; les traces convergent au backend
OpenTelemetry-compatible.

## Statut réel

| Élément | Statut | Limite |
|---|---|---|
| sept runtimes demandés | PLANNED | six présents ; FastAPI non concerné |
| cinq applications représentées | PLANNED | CSM support partiel, blueprint V2 absent |
| Angular/Flutter capabilities | PLANNED | overlays incomplets |
| contrats Dart/Java/Python | TARGET | génération absente |
| système complet | PLANNED | aucun golden produit cinq applications |
