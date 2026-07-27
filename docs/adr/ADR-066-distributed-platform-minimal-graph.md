# ADR-066 — Graphe minimal exécutable de `distributed-platform`

- **Statut :** Accepté
- **Date :** 2026-07-27
- **Décideurs :** Enistere OS Foundation
- **Complète :** ADR-060, ADR-065

## Contexte

ADR-065 a rendu les quatre profils système représentables et a séparé le profil
d’architecture des presets historiques. Toute topologie multi-backend restait
cependant bloquée : le CSM ne portait ni autorité de données ni communication
exploitable, et le golden supposait un unique `apps/api`.

Promouvoir toutes les plateformes distribuées après un seul exemple serait
mensonger. Le premier incrément doit être assez petit pour être prouvé, tout en
fixant les invariants qui empêchent une distribution accidentelle.

## Décision

### 1. Ownership par autorité

Une application backend distribuée déclare :

```yaml
ownership:
  team: core-team
  domains: [accounts]
```

`domains` représente l’autorité exclusive sur les données du bounded context,
pas un provider d’infrastructure. Un domaine ne peut avoir qu’une autorité. Les
providers et primitives restent la responsabilité d’une phase ultérieure.

### 2. Graphe de communications

Chaque dépendance `consumes` d’une `distributed-platform` possède une arête
explicite :

```yaml
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

Les endpoints doivent exister et être distincts. Le contrat est versionné.
Timeout, retry borné, identité workload et stratégie de panne sont obligatoires.
Le premier slice refuse les cycles : l’ordre de déploiement est topologique et
le rollback prend l’ordre inverse.

### 3. Slice générable

Seul le périmètre suivant est `GENERATABLE` :

- exactement deux autorités API ;
- une Spring Boot et une NestJS ;
- aucun client officiel ;
- aucune capability optionnelle ;
- ownership complet et domaines exclusifs ;
- communications synchrones HTTP ;
- graphe acyclique.

Les autres formes de `distributed-platform` restent représentables mais
`blocked` avec `RESOLUTION_TOPOLOGY_NOT_GENERATABLE`. Le profil
`service-ecosystem` reste `TARGET` et `PLANNED`.

### 4. Pipeline et matérialisation

Ownership et communications traversent l’unique chaîne :

```text
Blueprint → CSM → ResolvedSystem → GenerationPlan → Materialization
```

Le plan contient les unités, dépendances, ordre de déploiement et ordre de
rollback. La matérialisation produit :

- `packages/contracts/ownership.json` ;
- `packages/contracts/communications.json` ;
- `infrastructure/deployment-plan.json` ;
- `docs/ARCHITECTURE.md`.

Le générateur continue de copier chaque runtime depuis
`starters/<runtime>/` vers `apps/<application-id>`. Aucun sous-dossier
`base/`, aucune `composition.baseSource` et aucun pipeline parallèle ne sont
introduits.

## Preuves et niveau revendiqué

Le golden `distributed-spring-nestjs` vérifie :

- génération des deux applications nommées ;
- ownership exclusif et arête versionnée matérialisés ;
- ordre de déploiement/rollback déterministe ;
- verrouillage reproductible des dépendances ;
- gates réels Spring et NestJS ;
- démarrage séquentiel des deux backends ;
- health/live/ready, corrélation, continuation W3C et security headers sur
  chaque runtime ;
- audit des dépendances.

Cette preuve vaut `GENERATABLE` et, lorsque le golden CI est vert, `BOOTABLE`
pour ce slice. Elle ne prouve ni appel métier interservice, ni résilience en
charge, ni primitives isolées, ni `PRODUCT_EQUIVALENT`, ni
`PRODUCTION_READY`.

## Conséquences

- Le troisième profil système possède un premier incrément exécutable honnête.
- Les manifests de capabilities pourront ensuite être stabilisés contre un
  système réellement multi-backend.
- Async/AMQP, FastAPI distribué, clients officiels, gateways, primitives
  dédiées et scénarios de panne restent hors périmètre.
- L’ancien diagnostic CSM « plusieurs API non générables » disparaît : le CSM
  valide la représentation, le resolver décide du support prouvé.

## Prochaine mission unique

Définir le manifeste Capability v2 et son graphe déterministe
(`targets`, `requires`, `conflicts`, `primitives`, migrations et conformité),
sans implémenter une nouvelle capability.
