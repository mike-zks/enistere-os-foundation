# Systèmes de référence

Ces exemples sont normatifs pour la capacité de représentation du modèle, pas des goldens exécutables.
Chaque fichier sépare la cible et le statut prouvé au 2026-07-27. Deux variantes illustrent que le nombre
de clients ne change pas à lui seul le profil `product-platform`.

| Profil | Exemple | Statut global actuel |
|---|---|---|
| `backend-service` | [FastAPI](BACKEND_SERVICE_FASTAPI.md) | TARGET |
| `product-platform` | [Spring + Next.js](PRODUCT_PLATFORM_SPRING_NEXTJS.md) | PLANNED |
| `product-platform` | [NestJS + tous les clients](PRODUCT_PLATFORM_MULTI_CLIENT.md) | PLANNED |
| `distributed-platform` | [Spring + NestJS + FastAPI](DISTRIBUTED_PLATFORM_POLYGLOT.md) | slice Spring + NestJS générable ; exemple complet TARGET |
| `service-ecosystem` | [Écosystème complet](SERVICE_ECOSYSTEM_COMPLETE.md) | TARGET |

Un statut local plus élevé dans un exemple ne promeut pas la composition globale. Les preuves réelles
restent les matrices générées et les Conformance Reports.

Depuis ADR-065/066, `backend-service` et `product-platform` sont générables sur les
compositions de runtimes/capabilities déjà prouvées. Les statuts du tableau
restent plus bas lorsque l’exemple complet sélectionne des capabilities ou
primitives encore absentes. `distributed-platform` est générable uniquement
pour le slice Spring + NestJS d’ADR-066 ; les autres variantes conservent leurs
blockers. `service-ecosystem` reste TARGET.
