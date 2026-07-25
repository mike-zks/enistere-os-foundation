# Infrastructure Primitive Specification

## 1. Définition

Une primitive est un besoin d'infrastructure typé, résolu vers un provider. Elle ne contient pas de cas
d'usage métier et ne masque pas les différences sémantiques des providers.

## 2. Kinds normatifs

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

## 3. Déclaration

```yaml
primitives:
  - id: media-storage
    kind: object-storage
    provider: minio
    owner: core-api
    purposes: [media]
    modes: [local, staging, production]
    policy:
      encryption: required
      backup: required
```

Chaque primitive DOIT déclarer : id, kind, provider/version résolus, owner, consommateurs, purposes,
configuration typée, secrets par référence, modes, sécurité, health, observabilité, capacité,
sauvegarde/restauration, migration, rétention et preuves.

## 4. Providers initiaux

| Kind | Provider initial | Statut cible |
|---|---|---|
| relational database | PostgreSQL | TARGET ; actif actuel à qualifier |
| document database | MongoDB ou alternative après arbitrage | TARGET, provider PLANNED |
| cache | Redis | TARGET |
| object storage | MinIO/S3-compatible | TARGET ; actif actuel à qualifier |
| content repository | Alfresco | TARGET |
| queue/broker | RabbitMQ | TARGET |
| telemetry backend | tout backend compatible OpenTelemetry | TARGET |
| mail/push/search/secrets | adapters à arbitrer | TARGET |

## 5. Distinction obligatoire

`object-storage` fournit buckets, clés d'objets, métadonnées techniques, lifecycle et URLs signées.
`content-repository` fournit identité documentaire, versionnement, métadonnées métier, recherche,
relations, gouvernance/records et éventuellement workflow.

Par conséquent :

```text
MinIO = object-storage
Alfresco = content-repository
```

Le resolver NE DOIT PAS substituer l'un à l'autre. Une capability Files peut demander object storage,
content repository, ou les deux selon son mode.

## 6. Ownership et communications

Toute primitive persistante a un owner unique. Les autres applications y accèdent via le contrat de
l'owner, sauf primitive explicitement partagée et compatible (telemetry backend, broker, secrets control
plane). Un service NE DOIT PAS lire directement la base d'un autre.

## 7. Modes et adapters

Un adapter déclare local/test/staging/production, fonctionnalités supportées, limites, topology, ports,
images/artefacts, licences et compatibilités. Une émulation locale ne vaut pas preuve production.

## 8. Résolution et lock

`ResolvedSystem` fixe provider, version, adapter, configuration non secrète et digests. Le lockfile contient
les références, jamais les secrets. Tout changement de provider produit un plan de migration explicite.

## 9. Conformité

Les tests couvrent connexion, health, sécurité, backup/restore, migration, observabilité, panne et capacité
minimale. Les tests sémantiques sont propres au kind : transaction pour relationnel, version documentaire
pour content repository, délivrance/redelivery pour queue, export pour telemetry.
