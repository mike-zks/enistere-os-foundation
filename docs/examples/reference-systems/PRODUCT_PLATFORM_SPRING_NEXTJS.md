# Référence — Product platform Spring Boot + Next.js

## Finalité et graphe

Produit transactionnel avec modules Customers, Orders et Billing dans une API Spring, et portail Next.js.

```text
customer-web (Next.js) → core-api (Spring)
                              ├── Customers
                              ├── Orders
                              ├── Billing
                              ├── PostgreSQL
                              └── Redis
```

## Blueprint cible

```yaml
apiVersion: enistere.io/v2alpha1
kind: SystemBlueprint
metadata: { name: commerce-monolith, version: 1.0.0 }
spec:
  architecture:
    profile: product-platform
    evolutionTarget: distributed-platform
    clients: { mode: single }
    backend: { style: modular-monolith }
    deployment: { coupling: coordinated }
    data: { ownership: bounded-context }
    communication: { primary: synchronous }
    operations: { maturity: standard }
  applications:
    - id: core-api
      kind: api
      runtime: spring
      domains: [customers, orders, billing]
      capabilities: [authentication, authorization, user-management, events]
    - id: customer-web
      kind: web
      runtime: nextjs
      consumes: [core-api]
      capabilities: [authentication, authorization]
  primitives:
    - { id: db, kind: relational-database, provider: postgresql, owner: core-api }
    - { id: cache, kind: cache, provider: redis, owner: core-api }
  communications:
    - { from: customer-web, to: core-api, mode: sync, protocol: https, contract: public-api.v1 }
```

## Déploiement, contrats et données

API et Web sont deux artefacts mais une release produit coordonnée. La DB est physiquement partagée ;
chaque table/agrégat a un module owner. Les modules communiquent par ports internes et événements de
domaine. OpenAPI génère le client TypeScript.

## Audit et observabilité

Le baseline corrèle navigateur/API/modules. L'audit technique couvre auth/config/admin ; Orders et Billing
déclarent `order.cancelled` et `payment.confirmed`. Les traces portent le module. Redis ne devient jamais
source de vérité.

## Stratégie d'évolution

Billing ne peut être extrait qu'après contrat versionné, owner de données isolé, outbox, migration,
observabilité distribuée et rollback. Le profil reste `product-platform` tant que cette extraction n'est
pas prouvée ; son style backend reste `modular-monolith`.

## Statut réel

| Élément | Statut | Preuve/limite |
|---|---|---|
| Spring et Next.js pris séparément | BOOTABLE | goldens actuels |
| capabilities auth/rbac | GENERATABLE partiel | overlays existants, équivalence globale non prouvée |
| profil `product-platform` | IMPLEMENTED | représentation CSM ; génération bornée aux presets prouvés |
| système complet | PLANNED | pas de golden produit ni audit baseline complet |
