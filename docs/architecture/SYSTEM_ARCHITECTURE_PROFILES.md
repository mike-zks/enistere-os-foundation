# Profils d’architecture système

## Principe de classification

Enistere choisit d’abord le **cas d’usage du système**, puis décrit séparément sa topologie applicative,
son style backend, son déploiement, ses données, ses communications et sa maturité opérationnelle :

```text
cas d’usage → topologie applicative → style backend → déploiement → runtimes et primitives
```

Un profil système n’est ni un runtime, ni un nombre de clients, ni un preset de starters. Tous les profils
appliquent le Platform Baseline, la modularité métier, des contrats versionnés, un ownership explicite,
la sécurité par défaut, l’observabilité et l’audit technique.

## 1. `backend-service`

**Finalité.** Exposer une capacité backend autonome sans imposer de client officiel.

**Cas d’usage.** API partenaire, moteur de paiement ou de recommandation, backend mobile existant,
service documentaire, intégration, équipement ou agent IA.

| Dimension | Règle |
|---|---|
| Topologie | un backend principal ; interfaces HTTP, événements, jobs ou temps réel selon besoin |
| API / clients | une API principalement ; clients externes ou aucun client géré |
| Déploiement | unité backend autonome ; primitives déployées séparément |
| Données | backend owner ; aucun accès externe direct |
| Communications | synchrone par défaut ; async si le besoin le justifie |
| Sécurité | exposition explicite, M2M possible, authorization aux frontières, secrets |
| Observabilité / audit | baseline complet ; accès et opérations sensibles audités |
| Résilience | timeouts, graceful shutdown, idempotence des mutations rejouables |
| Infrastructure | DB, cache, storage ou queue uniquement selon les besoins |

**Sélectionner si** la capacité backend est le produit ou si les clients sont hors scope. **Refuser si**
Enistere doit livrer une expérience utilisateur officielle ou si plusieurs autorités backend autonomes
sont déjà requises. **Évolution :** devenir le backend d’une `product-platform` ou une unité d’une
`distributed-platform`.

## 2. `product-platform`

**Finalité.** Construire un produit numérique cohérent avec un backend principal, un domaine commun et
un ou plusieurs clients officiels.

**Cas d’usage.** SaaS, ERP, e-commerce, application métier, marketplace, plateforme immobilière ou
service public numérique.

| Dimension | Règle |
|---|---|
| Topologie | backend principal modulaire + 1..n Web/Mobile |
| API / clients | une autorité backend ; un ou plusieurs clients |
| Déploiement | releases coordonnées ; clients séparables sans autonomie métier |
| Données | infrastructure partagée possible ; ownership logique par bounded context |
| Communications | appels internes en processus ; clients via contrats générés |
| Sécurité | politique centrale, sessions par canal, frontières admin/public |
| Observabilité / audit | contexte client et module dans logs, traces et audit |
| Résilience | transactions locales ; intégrations externes isolées |
| Infrastructure | primitives principalement partagées, toujours avec owner |

Le style backend par défaut est `modular-monolith`. Le nombre de clients est une dimension
`clients.mode: single|multiple`, pas un changement de profil.

**Sélectionner si** une autorité métier et une gouvernance produit communes dominent. **Refuser si** des
domaines exigent dès maintenant autonomie de release, isolation réglementaire ou scalabilité distincte.
**Évolution :** extraire une frontière prouvée vers `distributed-platform`.

## 3. `distributed-platform`

**Finalité.** Séparer physiquement certains domaines, technologies ou charges tout en conservant un
produit global et une gouvernance commune.

**Cas d’usage.** Core transactionnel Spring, engagement NestJS, IA FastAPI, service documentaire isolé,
API publique séparée ou intégration progressive d’un existant.

| Dimension | Règle |
|---|---|
| Topologie | plusieurs backends ; gateway/BFF facultatif ; 0..n clients |
| API / clients | autorités backend explicites ; clients via gateway ou contrats autorisés |
| Déploiement | unités séparables, gouvernées et migrées ensemble |
| Données | ownership exclusif par bounded context ; aucun accès cross-database |
| Communications | sync et async explicites ; contrats versionnés |
| Sécurité | identité workload, authorization interservice, secrets par unité |
| Observabilité / audit | traces distribuées ; audit corrélé avec owner des sinks |
| Résilience | timeouts, retries bornés, breakers, idempotence, outbox/DLQ selon flux |
| Infrastructure | DB par owner possible, broker, telemetry backend et secrets |

**Sélectionner si** chaque frontière distribuée possède une justification, un owner et une stratégie
d’exploitation. **Refuser si** l’équipe ne peut pas opérer plusieurs unités ou si les transactions
globales synchrones restent nécessaires. **Évolution :** extraction ou réintégration incrémentale ;
passage à `service-ecosystem` seulement avec autonomie organisationnelle démontrée.

## 4. `service-ecosystem`

**Finalité.** Exploiter des services réellement autonomes lorsque domaines et équipes doivent évoluer,
être déployés et scaler indépendamment.

**Cas d’usage.** Organisation multi-équipes mature, domaines fortement séparés, disponibilité ou
réglementation distincte, charges très hétérogènes.

| Dimension | Règle |
|---|---|
| Topologie | services bornés, gateways/BFF, workers, control planes et clients éventuels |
| API / clients | plusieurs interfaces internes/externes ; BFF possibles |
| Déploiement | indépendant, versionné et rollbackable par service |
| Données | datastore et owner par service ; réplication par contrats/événements |
| Communications | sync/async gouvernés, compatibilité et dépréciation |
| Sécurité | identité workload, moindre privilège, segmentation, policy enforcement |
| Observabilité / audit | traces bout en bout, SLO par service, audit corrélé et durable |
| Résilience | panne partielle, bulkheads, backpressure, DLQ, outbox, budgets d’erreur |
| Infrastructure | broker, secrets, telemetry, registry et orchestration selon contexte |

Le style backend associé est `microservices`, mais ce style n’est pas lui-même un profil système.

**Sélectionner si** les preuves organisationnelles et non fonctionnelles justifient le coût. **Refuser si**
une équipe unique opère le système, si les frontières ou SLI sont inconnus, ou si une plateforme moins
distribuée satisfait les contraintes. **Évolution :** extraire depuis `distributed-platform` ; fusionner
les services trop fins si le coût dépasse le bénéfice.

## Comparaison de sélection

| Profil | Backend | Clients | Couplage de déploiement | Cas principal |
|---|---:|---:|---|---|
| `backend-service` | 1 principalement | externes ou aucun | autonome | exposer une capacité backend |
| `product-platform` | 1 principal | 1..n | coordonné | construire un produit complet |
| `distributed-platform` | plusieurs | 0..n | partiellement indépendant | séparer certains domaines/technologies |
| `service-ecosystem` | services autonomes | 0..n | indépendant | autonomie forte des domaines et équipes |

## Dimensions indépendantes

```yaml
architecture:
  profile: product-platform
  clients: { mode: multiple } # none | single | multiple
  backend: { style: modular-monolith } # modular-monolith | distributed-services | microservices
  deployment: { coupling: coordinated } # coordinated | partially-independent | independent
  data: { ownership: bounded-context } # shared | bounded-context | per-service
  communication: { primary: synchronous } # synchronous | event-driven | hybrid
  operations: { maturity: standard } # standard | advanced | distributed
```

`api`, `monolith`, `multi-client`, `modular-distributed` et `microservices` sont des alias d’entrée
historiques. Ils sont migrés respectivement vers `backend-service`, `product-platform`,
`product-platform`, `distributed-platform` et `service-ecosystem`, puis disparaissent du CSM.

## Invariants d’évolution

- aucune distribution sans contrat, owner, SLO, migration et rollback ;
- aucun service ne lit le datastore d’un autre ;
- les clients ne deviennent pas autorités métier ;
- la modularité métier est obligatoire dans tous les profils ;
- les événements sont versionnés, sécurisés et observables ;
- la distribution n’abaisse jamais le Platform Baseline ;
- profil cible, représentation et support de génération sont reportés séparément.

## Exécution dans la Factory

La sélection commence par le système :

```bash
enistere init enistere.yaml marketplace \
  --architecture=product-platform \
  --api=nestjs \
  --web=nextjs,angular \
  --mobile=react-native,flutter
```

Les sorties `ResolvedSystem` et `GenerationPlan` distinguent le profil système
du preset de composition historique :

```yaml
architectureProfile:
  id: product-platform
  representation: IMPLEMENTED
  generation: GENERATABLE
  generatable: true
compositionPreset: null # plusieurs clients : aucun preset mono-slot déduit
```

Pour une `distributed-platform`, `enistere validate` confirme la
représentation. Le slice exact Spring + NestJS avec ownership et communication
HTTP versionnée produit un plan `ready`; les autres graphes produisent un
blocker structuré. `service-ecosystem` reste toujours refusé.

| Profil | Représentation | Génération actuelle |
|---|---|---|
| `backend-service` | `IMPLEMENTED` | `GENERATABLE` sur compositions prouvées |
| `product-platform` | `IMPLEMENTED` | `GENERATABLE` sur compositions prouvées |
| `distributed-platform` | `IMPLEMENTED` | `GENERATABLE` pour le slice Spring + NestJS d’ADR-066 |
| `service-ecosystem` | `IMPLEMENTED` | `PLANNED`, statut global `TARGET` |

Le slice distribué initial exige deux owners, des domaines de données
exclusifs, une arête `synchronous/http` explicite et un graphe acyclique. Le
plan publie l’ordre de déploiement et l’ordre inverse de rollback. Cette preuve
ne généralise pas le support aux clients, capabilities, communications async ou
autres paires de runtimes.
