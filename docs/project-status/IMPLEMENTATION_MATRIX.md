# Matrice d'implémentation

## Factory

| Capacité | État | Limite actuelle |
|---|---|---|
| `doctor/init/plan/generate/verify` | Implémenté | CLI non distribuée |
| 18 combinaisons de stacks | Planifiées/testées | pas toutes démarrées en golden runtime |
| Lock déterministe | Implémenté | upgrade non livré |
| Contrat de domaine neutre | Initial | pas de génération CRUD framework |
| Agents locaux | Implémenté | exécution volontairement sous approbation |
| Deployment local/staging | Initial | staging généré à compléter par images applicatives |

## Capabilities

| Capability | Dépendances | Nest | Spring | Next | Angular | RN | Flutter |
|---|---|---|---|---|---|---|---|
| base | aucune | intégré | intégré | intégré | intégré | intégré | intégré |
| auth | base | à extraire | planifié | à extraire | planifié | à extraire | planifié |
| rbac | auth | à extraire | planifié | à extraire | planifié | à extraire | planifié |
| files | auth | à extraire | planifié | à extraire | planifié | à extraire | planifié |
| audit | à décider | planifié | planifié | non défini | non défini | non défini | non défini |
| notifications | à décider | non défini | non défini | non défini | non défini | planifié | planifié |
| observability | à décider | planifié | planifié | planifié | planifié | planifié | planifié |

`à extraire` ne signifie pas `ready`. Une capability devient disponible uniquement après overlay,
génération, tests d'absence et golden vérifié.

## Qualité et exploitation

| Élément | État |
|---|---|
| CI multi-stack | Active |
| Protection `main` | Active |
| Audit dépendances | Actif |
| Images NestJS/Next.js | Construites en CI |
| Staging V1 | Prouvé historiquement |
| Cycle upgrade Factory | Non livré |
| Métriques d'adoption | Non livrées |
