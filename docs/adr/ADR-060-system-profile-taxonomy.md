# ADR-060 — Taxonomie des profils système et dimensions d’architecture

- Statut : Validé
- Date : 2026-07-25
- Décideur : Owner Foundation
- Supersède : taxonomie des profils de l’ADR-057

## Décision

Enistere remplace les cinq catégories `api`, `monolith`, `multi-client`, `modular-distributed` et
`microservices` par quatre profils système fondés sur le cas d’usage :

```text
backend-service
product-platform
distributed-platform
service-ecosystem
```

Le modèle porte séparément :

```text
clients.mode
backend.style
deployment.coupling
data.ownership
communication.primary
operations.maturity
```

La modularité métier reste un invariant général. `multi-client` devient une topologie client,
`modular-monolith` et `microservices` deviennent des styles backend. Un nombre élevé de clients
n’implique donc pas un backend distribué, et plusieurs APIs n’impliquent pas des microservices autonomes.

Le champ Blueprint v1 racine `profile`, utilisé pour des compositions comme `nestjs-base`, conserve
temporairement sa sémantique de preset. Il ne doit pas être confondu avec `architecture.profile`.
Blueprint v2 le renommera `generationPreset`.

## Compatibilité

Les anciens noms restent acceptés à la frontière d’entrée et sont convertis :

| Entrée historique | Sortie canonique |
|---|---|
| `api` | `backend-service` |
| `monolith` | `product-platform` |
| `multi-client` | `product-platform` + clients multiples |
| `modular-distributed` | `distributed-platform` |
| `microservices` | `service-ecosystem` + style backend microservices |

Ils ne sont jamais réémis dans le CSM. Les documents historiques peuvent les conserver dans leur contexte ;
les documents canoniques actifs utilisent uniquement la nouvelle taxonomie.

## Support réel

Les quatre profils sont représentables par le CSM. Cette représentation n’accorde aucun statut de
génération :

| Profil | Représentation | Génération |
|---|---|---|
| `backend-service` | IMPLEMENTED | GENERATABLE sur les compositions prouvées |
| `product-platform` | IMPLEMENTED | GENERATABLE sur les compositions prouvées |
| `distributed-platform` | IMPLEMENTED | PLANNED |
| `service-ecosystem` | IMPLEMENTED | PLANNED |

Le registre de presets existant et ses goldens restent la preuve précise des combinaisons effectivement
générables.

## Justification

L’ancienne taxonomie mélangeait finalité, nombre de clients et niveau de distribution. Elle pouvait
recommander une architecture plus complexe uniquement parce qu’un produit possède plusieurs canaux.
La séparation en dimensions rend la recommandation explicable, l’évolution progressive et la validation
plus précise.

## Conséquences

- le Blueprint et le CSM portent une architecture multidimensionnelle ;
- `enistere architecture list|describe|recommend` utilise les profils système ;
- `enistere profiles` et `enistere profile` continuent de décrire les presets de composition ;
- les futurs diagnostics comparent la topologie déclarée aux dimensions ;
- la génération distribuée reste refusée tant que ses preuves ne sont pas livrées ;
- ADR-057 reste valide pour le Platform Baseline, les runtimes, primitives, capabilities, IA et roadmap.

## Tests et preuves

- tests de normalisation des quatre profils et des alias ;
- validation de chaque dimension ;
- inférence `backend-service` ou `product-platform` selon les clients ;
- commandes CLI déterministes ;
- recherche documentaire excluant l’ancienne classification des documents actifs ;
- suite Factory complète et link checker.

## Rollback

Un revert restaure l’ancien schéma d’entrée. Les blueprints historiques restent lisibles dans les deux
directions grâce aux alias de frontière.
