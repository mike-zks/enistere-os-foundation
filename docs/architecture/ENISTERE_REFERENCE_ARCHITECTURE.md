# Architecture de référence Enistere Factory

## 1. Autorité et portée

Ce document définit la cible globale. Les spécifications détaillent les règles normatives ; l'état courant
et l'audit indiquent ce qui est réellement prouvé. L'[ADR-057](../adr/ADR-057-reference-architecture-and-platform-baseline.md)
adopte cette architecture.

La cible n'est pas une déclaration d'implémentation. Les actifs existants sont réutilisés uniquement s'ils
convergent vers elle.

## 2. Principes

1. Le système, pas le starter, est l'unité de conception.
2. Une seule chaîne transforme l'intention en artefacts et preuves.
3. Le Platform Baseline est obligatoire pour tout runtime.
4. Une capability est optionnelle, composable, ciblable et versionnée.
5. Une primitive décrit une sémantique d'infrastructure, pas seulement un produit.
6. Les contrats précèdent les adapters et restent polyglottes.
7. La complexité distribuée exige une justification mesurable.
8. La représentation d'une cible ne vaut jamais support de génération.
9. L'IA assiste ; les politiques, preuves et approbations décident.

## 3. Vue du système

```text
Requirements / Human Decisions / AI Assistance
                        │
                        ▼
                 SystemBlueprint
                        │ validate + normalize
                        ▼
                 CanonicalSystem
                        │ resolve registry, graph, policies
                        ▼
                  ResolvedSystem
                        │ deterministic planning
                        ▼
                  GenerationPlan
                        │ approved materialization
                        ▼
                 MaterializedSystem
                        │ verify contracts and qualities
                        ▼
                 ConformanceReport
```

Après normalisation, aucune couche ne relit le blueprint brut. Chaque étape a un schéma versionné, un digest
et des diagnostics.

## 4. Modèle canonique cible

```text
SystemBlueprint / CanonicalSystem
├── metadata
├── architecture
│   ├── profile
│   └── evolutionTarget?
├── applications[]
│   ├── id, kind, runtime, version
│   ├── domains[], consumes[]
│   ├── capabilities[]
│   └── deployment
├── domains[]
│   ├── ownership
│   ├── contracts
│   └── auditRules
├── capabilities[]
├── primitives[]
├── communications[]
├── environments[]
├── deployment
├── security
├── quality
├── ai
└── policies
```

`ResolvedSystem` ajoute les versions exactes, adapters, dépendances, providers, topologie, ownership,
policies effectives, incompatibilités et niveau de support. `GenerationPlan` décrit les opérations sans
écrire. `MaterializedSystem` inventorie les artefacts et leur provenance. `ConformanceReport` rattache
chaque statut à ses preuves.

## 5. Profils architecturaux

| Profil | Intention | Topologie de référence | Évolution habituelle |
|---|---|---|---|
| `backend-service` | exposer une capacité backend | un backend, aucun client officiel imposé | backend d’un produit ou unité distribuée |
| `product-platform` | livrer un produit cohérent | un backend modulaire, un ou plusieurs clients | extraction de frontières prouvées |
| `distributed-platform` | séparer certains domaines ou technologies | plusieurs backends sous gouvernance commune | extraction ou réintégration progressive |
| `service-ecosystem` | autonomie forte des domaines et équipes | services indépendants, données possédées | optimisation/agrégation par preuves |

La spécification complète est dans
[SYSTEM_ARCHITECTURE_PROFILES.md](SYSTEM_ARCHITECTURE_PROFILES.md).

`single-client`/`multiple`, `modular-monolith`/`distributed-services`/`microservices`, le couplage de
déploiement, l’ownership des données, les communications et la maturité opérationnelle sont des dimensions
orthogonales au profil.

## 6. Runtimes

### Common Runtime Contract

Tous les runtimes implémentent le
[Platform Baseline](PLATFORM_BASELINE_ARCHITECTURE.md) : configuration, erreurs canoniques, logs structurés,
corrélation, observabilité, audit technique, sécurité, health, diagnostics, tests, lifecycle hooks,
extension points et quality gates.

### API

Runtimes cibles : `nestjs`, `spring`, `fastapi`.

Le contrat API ajoute : serveur HTTP, validation d'entrée, erreurs HTTP canoniques, OpenAPI, liveness et
readiness, ports de persistence/migration/transaction, graceful shutdown, hooks Authentication,
Authorization, Files et Events, et tests de contrat.

### Web

Runtimes cibles : `nextjs`, `angular`.

Le contrat Web ajoute : routing, client API typé, hooks session et access-control, error boundaries,
fondation formulaire, états loading/error/empty, accessibilité, headers de sécurité, télémétrie et E2E.
Session et contrôle d'accès sont des coutures obligatoires ; leur comportement métier n'existe que si la
capability correspondante est composée.

### Mobile

Runtimes cibles : `react-native`, `flutter`.

Le contrat Mobile ajoute : navigation, client API, secure storage, hooks session, état réseau, gestion
d'erreur, permissions, deep links, hooks offline/push, crash reporting et fondation de build. Les hooks
n'activent pas une fonctionnalité optionnelle.

## 7. Platform Baseline

Le baseline est un contrat de production minimal, versionné et mesuré par famille. Observability comprend
logs, métriques, traces, propagation, instrumentation, health et hooks OpenTelemetry. Technical Audit
capture les événements de plateforme et les opérations sensibles.

L'audit métier est distinct :

```text
Domain/Capability → déclare l'événement et sa politique
Platform Baseline → collecte, protège, persiste/exporte et corrèle la preuve
```

## 8. Capabilities

Catalogue cible minimal :

- Authentication ;
- Authorization ;
- User Management ;
- Files ;
- Events ;
- Notifications ;
- Automation ;
- Realtime ;
- Search ;
- Feature Flags ;
- Multitenancy ;
- Workflow.

Chaque manifeste déclare identité/version, cas d'usage, contrats, adapters, targets, dépendances, conflits,
primitives, modes de déploiement, configuration, migrations, événements, audit métier et suites de
conformité. Une capability absente ne laisse pas de comportement actif.

Ne sont pas des capabilities : Configuration, Canonical Errors, Logging, Correlation, Observability,
Technical Audit, Health, Security Baseline, Diagnostics, Testing Foundation, Lifecycle Hooks, Extension
Points, Build et Quality Gates.

## 9. Primitives

| Kind | Sémantique | Providers initiaux |
|---|---|---|
| `relational-database` | transactions et relations | PostgreSQL |
| `document-database` | agrégats documentaires | MongoDB à arbitrer |
| `cache` | données temporaires, rate limit, coordination bornée | Redis |
| `object-storage` | objets/blobs, buckets et URLs signées | MinIO / S3 compatible |
| `content-repository` | documents gouvernés, métadonnées, versions, records/workflows | Alfresco |
| `queue` | travail asynchrone point-à-point | RabbitMQ queue |
| `broker` | routage et distribution de messages | RabbitMQ |
| `mail` | transport email | SMTP/provider |
| `push` | notifications appareils | provider push |
| `search` | indexation et recherche | provider à arbitrer |
| `telemetry-backend` | ingestion/stockage/visualisation de télémétrie | OpenTelemetry-compatible |
| `secrets` | stockage et rotation des secrets | provider à arbitrer |

MinIO et Alfresco ne sont pas interchangeables : le premier fournit du stockage objet, le second un dépôt
de contenu avec sémantique documentaire.

## 10. Contrats

```text
Canonical Contracts
├── OpenAPI / HTTP
├── JSON Schema
├── event schemas / AsyncAPI
├── errors and permissions
├── audit event schemas
└── generated bindings
    ├── TypeScript
    ├── Java
    ├── Python
    └── Dart
```

Une source neutre est autoritaire. Les packages spécifiques à un langage sont des dérivés vérifiés.

## 11. CLI système

| Parcours | Commandes |
|---|---|
| Découvrir | `architecture list/describe/recommend`, `runtime list`, `capability list`, `primitive list` |
| Concevoir | `init`, `validate`, `plan`, `plan --explain` |
| Matérialiser | `generate` |
| Prouver | `verify`, `inspect` |
| Évoluer | `diff`, `upgrade`, `migrate` |

`plan` reste sans écriture. `generate`, `upgrade` et `migrate` présentent les mutations, demandent les
approbations requises, écrivent un lockfile et conservent la provenance. Les refus sont diagnostiqués par
codes stables.

## 12. Lifecycle

Le lifecycle compare désiré, résolu, matérialisé et état observé. Il calcule les changements, détecte la
dérive, protège les zones appartenant à l'utilisateur, ordonne migrations et déploiements et produit un
rollback lorsque l'opération le permet.

```text
inspect → diff → plan → approve → apply → verify → record
```

Une migration irréversible exige une approbation explicite et une stratégie de restauration.

## 13. Conformité et statuts

| Statut | Signification minimale |
|---|---|
| `TARGET` | fait partie de la cible adoptée |
| `PLANNED` | séquencé et doté de critères de sortie |
| `IMPLEMENTED` | code/artefact présent et testé localement |
| `GENERATABLE` | le pipeline le matérialise de façon déterministe |
| `BOOTABLE` | installation, build et démarrage réels prouvés |
| `CONFORMANT` | suites normatives applicables réussies |
| `PRODUCT_EQUIVALENT` | comportements équivalents entre alternatives prouvés |
| `PRODUCTION_READY` | sécurité, exploitation, performance, migration et release prouvées |

Les statuts sont orthogonaux au profil : un profil `TARGET` peut rester non générable. Les preuves incluent
schémas, tests unitaires/contrat/intégration/E2E, goldens, fitness functions, sécurité, migration, rollback,
performance et exploitation.

## 14. Sécurité, observabilité et résilience

Les policies définissent identité des workloads et acteurs, moindre privilège, secret management,
classification des données, chiffrement, rétention, redaction et supply chain. Toute communication porte
un contrat, un timeout et une identité. Retry, circuit breaker, idempotence, outbox et DLQ ne sont activés
que selon le mode et le risque.

L'observabilité corrèle requête, message, tâche et audit sans exposer de secret. Les systèmes distribués
doivent permettre une trace de bout en bout.

## 15. IA

L'IA de la Factory et l'IA des projets dérivés sont deux plans distincts. La première analyse, recommande,
génère et révise sous politiques. La seconde est une charge applicative optionnelle, souvent exposée via
FastAPI, avec contrats de modèles/providers/RAG/agents/inférence et observabilité IA.

Voir [AI_REFERENCE_ARCHITECTURE.md](AI_REFERENCE_ARCHITECTURE.md).

## 16. Déploiement

Une `application` est une unité logique ; une `deploymentUnit` est une unité livrable ; un runtime est une
implémentation. Ces notions ne sont pas synonymes. Un monolithe modulaire peut regrouper plusieurs modules dans une
unité, tandis qu'un profil distribué les sépare.

Les environnements cibles restent local, test, integration, staging et production. Kubernetes est un
provider de déploiement possible, jamais un invariant.

## 17. Références

- [Spécification des profils](../specifications/ARCHITECTURE_PROFILE_SPECIFICATION.md)
- [Spécification du baseline](../specifications/PLATFORM_BASELINE_SPECIFICATION.md)
- [Spécification des primitives](../specifications/INFRASTRUCTURE_PRIMITIVE_SPECIFICATION.md)
- [Exemples de référence](../examples/reference-systems/README.md)
- [Roadmap maître](../roadmap/ENISTERE_IMPLEMENTATION_MASTER_ROADMAP.md)
- [Audit cible/existant](../audits/TARGET_VS_CURRENT_IMPLEMENTATION.md)
