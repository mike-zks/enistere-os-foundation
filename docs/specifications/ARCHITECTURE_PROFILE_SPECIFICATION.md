# Architecture Profile Specification

## 1. Objet normatif

Cette spécification définit comment un profil système et ses dimensions d’architecture sont déclarés,
validés, recommandés et résolus. **DOIT**, **NE DOIT PAS**, **DEVRAIT** et **PEUT** sont normatifs.

## 2. Profils canoniques

`spec.architecture.profile` DOIT valoir :

```text
backend-service | product-platform | distributed-platform | service-ecosystem
```

Un profil exprime le cas d’usage et la gouvernance du système. Il NE DOIT PAS encoder seul le nombre de
clients, le style backend, l’ownership des données ou le couplage de déploiement.

## 3. Dimensions obligatoires du CSM

```yaml
architecture:
  profile: product-platform
  evolutionTarget: distributed-platform
  clients:
    mode: multiple
  backend:
    style: modular-monolith
  deployment:
    coupling: coordinated
  data:
    ownership: bounded-context
  communication:
    primary: synchronous
  operations:
    maturity: standard
```

Valeurs autorisées :

| Dimension | Valeurs |
|---|---|
| `clients.mode` | `none`, `single`, `multiple` |
| `backend.style` | `modular-monolith`, `distributed-services`, `microservices` |
| `deployment.coupling` | `coordinated`, `partially-independent`, `independent` |
| `data.ownership` | `shared`, `bounded-context`, `per-service` |
| `communication.primary` | `synchronous`, `event-driven`, `hybrid` |
| `operations.maturity` | `standard`, `advanced`, `distributed` |

`evolutionTarget` PEUT nommer un autre profil canonique. Il exprime une intention, jamais une
matérialisation simultanée.

## 4. Contraintes des profils

| Profil | Backends | Clients gérés | Style par défaut | Données | Déploiement |
|---|---:|---:|---|---|---|
| `backend-service` | 1 principalement | 0 | `modular-monolith` | owner backend | autonome |
| `product-platform` | 1 principal | 1..n | `modular-monolith` | modules/bounded contexts | coordonné |
| `distributed-platform` | 2..n | 0..n | `distributed-services` | owner par domaine | partiellement indépendant |
| `service-ecosystem` | 2..n | 0..n | `microservices` | owner par service | indépendant |

Des workers ne comptent pas comme backend d’autorité, mais DOIVENT avoir un owner, un runtime/adapter et
un contrat de lifecycle.

## 5. Compatibilité d’entrée

La frontière Blueprint PEUT accepter temporairement les alias suivants :

| Alias historique | Profil canonique | Dimension fixée ou déduite |
|---|---|---|
| `api` | `backend-service` | `clients.mode: none` |
| `monolith` | `product-platform` | `backend.style: modular-monolith` |
| `multi-client` | `product-platform` | `clients.mode: multiple` |
| `modular-distributed` | `distributed-platform` | `backend.style: distributed-services` |
| `microservices` | `service-ecosystem` | `backend.style: microservices` |

Le normalizer DOIT les convertir. Aucun alias historique NE DOIT circuler dans `CanonicalSystem`,
`ResolvedSystem`, `GenerationPlan` ou les nouveaux lockfiles.

Le champ `profile` historique à la racine du Blueprint v1 désigne un **preset de composition**
(`nestjs-base`, par exemple), pas un profil système. Il reste toléré pour compatibilité et DOIT être
renommé `generationPreset` lors de la migration Blueprint v2.

## 6. Validation commune

Tout profil DOIT :

- référencer des applications uniques ;
- faire correspondre `clients.mode` aux clients déclarés ;
- identifier les owners des données persistantes ;
- résoudre chaque communication vers deux endpoints existants ;
- définir protocole, mode, contrat, timeout et identité ;
- appliquer le Platform Baseline à chaque runtime ;
- produire des diagnostics structurés pour toute target ou adapter absent.

`backend-service` NE DOIT PAS posséder de client officiel. `product-platform` DOIT en posséder au moins
un. Une topologie représentable mais non matérialisable DOIT conserver son CSM et recevoir un statut de
génération `PLANNED` ou un diagnostic de plan explicite.

La validation DOIT distinguer :

```text
structure Blueprint
→ représentation CSM
→ support de résolution
→ autorisation de génération
```

Plusieurs autorités backend sont valides pour la représentation d’une
`distributed-platform` ou d’un `service-ecosystem`. Elles NE DOIVENT PAS être
rejetées à la frontière Blueprint. Tant que leur matérialisation n’est pas
prouvée, le resolver DOIT produire
`RESOLUTION_TOPOLOGY_NOT_GENERATABLE` et le plan DOIT être bloqué.

Les cohérences minimales suivantes sont obligatoires :

| Profil | Contraintes de dimensions |
|---|---|
| `backend-service` | `clients.mode: none`, `backend.style: modular-monolith` |
| `product-platform` | `clients.mode: single|multiple`, `backend.style: modular-monolith` |
| `distributed-platform` | `backend.style: distributed-services`, ownership non partagé, operations `advanced|distributed` |
| `service-ecosystem` | `backend.style: microservices`, déploiement `independent`, données `per-service`, operations `distributed` |

## 7. Validations distribuées

`distributed-platform` et `service-ecosystem` DOIVENT en plus :

- interdire l’accès direct au datastore d’un autre owner ;
- versionner les contrats synchrones et asynchrones ;
- définir timeouts, budgets de retry et idempotence ;
- propager le contexte et le tracing distribué ;
- associer une stratégie de panne à chaque dépendance ;
- décrire migration, ordre de déploiement et rollback ;
- identifier owner opérationnel et SLI/SLO par unité.

`service-ecosystem` DOIT fournir une justification organisationnelle et une politique de dépréciation des
contrats. L’absence de ces preuves produit un refus de recommandation ou de génération.

## 8. Recommandation

`enistere architecture recommend` DOIT :

1. collecter cas d’usage, clients, domaines, autonomie de release, ownership, équipes et contraintes ;
2. choisir le profil le moins distribué qui satisfait les exigences ;
3. expliquer le choix, les alternatives et les refus ;
4. afficher le statut de représentation et de génération séparément ;
5. demander confirmation avant d’écrire un blueprint.

L’IA PEUT proposer. Le recommender et le resolver déterministes valident.

## 9. Parcours CLI exécutable

`enistere init` DOIT recevoir le profil système avant les runtimes :

```bash
enistere init enistere.yaml marketplace \
  --architecture=product-platform \
  --api=nestjs \
  --web=nextjs,angular \
  --mobile=react-native,flutter
```

En mode non interactif, l’absence de `--architecture` DOIT être refusée.
`enistere validate` valide la représentation indépendamment du support de
génération. `enistere plan --explain` DOIT exposer séparément
`architectureProfile`, `compositionPreset`, `support` et les diagnostics.

Un preset de composition mono-backend NE DOIT PAS être attribué à un système
multi-client ou multi-backend uniquement parce que sa première application
correspond au preset.

## 10. Support et conformité

```yaml
status:
  architecture: TARGET
  representation: IMPLEMENTED
  generation: PLANNED
  evidence: []
```

Un profil représentable NE DOIT PAS être présenté comme `GENERATABLE`. Les preuves minimales sont :
schema/normalization tests, graph validation, plan déterministe, golden topologique, boot, contract tests,
security gates, assertions observability/audit et scénario de défaillance adapté.
