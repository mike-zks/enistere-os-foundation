# Matrice d'implémentation

## Factory

| Capacité | État | Limite actuelle |
|---|---|---|
| `doctor/init/plan/generate/verify` | Implémenté | CLI non distribuée |
| 18 combinaisons de stacks | Planifiées/testées | pas toutes démarrées en golden runtime |
| Moteur d'overlays déclaratifs | Implémenté (1A) | seule `auth` livrée ; RBAC/Files à venir |
| Composition modulaire (`modular-overlay`) | Implémentée (1A) | active si toutes les targets sont modulaires |
| Workspace unifié + lock racine reproductible | Implémenté (1A-R) | `npm install` → `npm ci` ; prouvé par golden runtime |
| CI `Factory Golden Runtime` | Implémentée (1A-R) | nestjs-base/auth, nest-next-auth, triple-auth |
| Lock déterministe + digests d'overlays | Implémenté | upgrade non livré |
| Contrat de domaine neutre | Initial | pas de génération CRUD framework |
| Agents locaux | Implémenté | exécution volontairement sous approbation |
| Deployment local/staging | Initial | staging généré à compléter par images applicatives |

## Capabilities

| Capability | Dépendances | Nest | Spring | Next | Angular | RN | Flutter |
|---|---|---|---|---|---|---|---|
| base | aucune | intégré | intégré | intégré | intégré | intégré | intégré |
| auth | base | **ready (overlay)** | planifié | **ready (overlay)** | planifié | **ready (overlay)** | planifié |
| rbac | auth | payload parqué | planifié | payload parqué | planifié | non applicable | planifié |
| files | auth | payload parqué | planifié | payload parqué | planifié | payload parqué | planifié |
| audit | à décider | intégré (base) | planifié | non défini | non défini | non défini | non défini |
| notifications | à décider | non défini | non défini | non défini | non défini | planifié | planifié |
| observability | à décider | planifié | planifié | planifié | planifié | planifié | planifié |

`auth` est `ready` en mode overlay sur NestJS/Next.js/React Native : overlay déclaratif, baseline
sans surface Auth, tests d'absence et goldens vérifiés (`factory/test/goldens.test.mjs`). Les
`payloads parqués` (`capabilities/{rbac,files}/targets/*`) contiennent le code extrait mais **sans
`overlay.json`** : la capability reste `planned` et `generate` la refuse. RBAC sur React Native est
non applicable (autorisation fine côté serveur).

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
