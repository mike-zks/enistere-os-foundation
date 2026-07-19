# Matrice d'implémentation

## Factory

| Capacité | État | Limite actuelle |
|---|---|---|
| `doctor/init/plan/generate/verify` | Implémenté | CLI non distribuée |
| 18 combinaisons de stacks | Planifiées/testées | pas toutes démarrées en golden runtime |
| Moteur d'overlays déclaratifs | Implémenté (1A) | seule `auth` livrée ; RBAC/Files à venir |
| Composition modulaire (`modular-overlay`) | Implémentée (1A) | active si toutes les targets sont modulaires |
| Workspace unifié + lock racine reproductible | Implémenté (1A-R) | `npm install` → `npm ci` ; prouvé par golden runtime |
| CI `Factory Golden Runtime` | Implémentée (1A-R), étendue (1B) | 7 goldens : base/auth (×4) + auth+rbac (×3) |
| Statuts de support (`not-applicable`) | Implémenté (1B) | permet les compositions mixtes sans surface factice |
| Composition Prisma structurée | Implémentée (1B) | extension de modèle sans duplication ni regex |
| Lock déterministe + digests d'overlays | Implémenté | upgrade non livré |
| Contrat de domaine neutre | Initial | pas de génération CRUD framework |
| Agents locaux | Implémenté | exécution volontairement sous approbation |
| Deployment local/staging | Initial | staging généré à compléter par images applicatives |

## Capabilities

| Capability | Dépendances | Nest | Spring | Next | Angular | RN | Flutter |
|---|---|---|---|---|---|---|---|
| base | aucune | intégré | intégré | intégré | intégré | intégré | intégré |
| auth | base | **ready (overlay)** | planifié | **ready (overlay)** | planifié | **ready (overlay)** | planifié |
| rbac | base + auth | **ready (overlay)** | planifié | **ready (overlay)** | planifié | **non applicable** | planifié |
| files | auth | payload parqué | planifié | payload parqué | planifié | payload parqué | planifié |
| audit | à décider | intégré (base) | planifié | non défini | non défini | non défini | non défini |
| notifications | à décider | non défini | non défini | non défini | non défini | planifié | planifié |
| observability | à décider | planifié | planifié | planifié | planifié | planifié | planifié |

`auth` (1A) et `rbac` (1B) sont `ready` en mode overlay : overlays déclaratifs, baselines sans la
surface correspondante, tests d'absence et goldens runtime vérifiés. `rbac` requiert explicitement
`base + auth`. Sur React Native, `rbac` est **`not-applicable`** (autorisation fine côté serveur) :
ce statut ne bloque pas la composition triple et n'injecte aucune surface mobile. Le payload parqué
restant (`capabilities/files/targets/*`) n'a **pas d'`overlay.json`** : `files` reste `planned` et
`generate` le refuse.

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
