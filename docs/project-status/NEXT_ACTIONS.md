# Prochaine action

## Mission achevée

Le contrat minimal de `distributed-platform` est exécutable
([ADR-066](../adr/ADR-066-distributed-platform-minimal-graph.md)).

| Profil | Représentation | Génération | Statut global |
|---|---|---|---|
| `backend-service` | `IMPLEMENTED` | `GENERATABLE` sur compositions prouvées | exécutable |
| `product-platform` | `IMPLEMENTED` | `GENERATABLE` sur compositions prouvées | exécutable |
| `distributed-platform` | `IMPLEMENTED` | `GENERATABLE` sur Spring + NestJS sync HTTP | scope borné |
| `service-ecosystem` | `IMPLEMENTED` | `PLANNED` | `TARGET` |

Preuves :

- ownership d’équipe et domaines de données exclusifs dans le CSM ;
- arêtes explicites et versionnées avec timeout, retry borné, identité workload
  et stratégie de panne ;
- incohérences, domaines multi-owners et cycles refusés ;
- support accordé uniquement à deux autorités Spring + NestJS sans client ni
  capability ;
- ordre topologique de déploiement et ordre inverse de rollback dans le plan ;
- artefacts déterministes ownership/communications/deployment ;
- golden `distributed-spring-nestjs` branché sur le pipeline existant, avec
  gates, boot/HTTP des deux runtimes, audit et lock reproductible ;
- autres paires, clients, capabilities et async toujours bloqués ;
- `service-ecosystem` non promu ;
- aucune source `starters/*/base/`, aucun `composition.baseSource`.

## Prochaine mission unique

> **Définir le manifeste Capability v2 et son graphe déterministe, sans
> implémenter une nouvelle capability.**

### Justification de l’ordre

Les trois profils nécessaires avant le framework de capabilities possèdent
maintenant un scope de génération réel. Les capabilities existantes restent
fondées sur des manifests plus étroits que la cible : targets, dépendances,
conflits, primitives, modes de déploiement, migrations et conformité doivent
être unifiés avant d’étendre Authentication ou d’ajouter une capability.

### Critères de sortie

- une spécification et un schéma versionnés uniques ;
- `requires` forme une closure déterministe et acyclique ;
- `conflicts` est symétrique et expliqué ;
- targets et adapters sont résolus par application, y compris multi-backend ;
- primitives et modes de déploiement sont déclarables sans provider fictif ;
- migrations et tests de conformité appartiennent au manifest ;
- les manifests Auth/RBAC/Files sont audités et migrés sans changer leur
  comportement produit ;
- aucun bundle implicite, aucun pipeline parallèle, aucune nouvelle capability ;
- aucun dossier `base/`.
