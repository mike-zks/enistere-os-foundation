# Matrice d'implémentation

## Factory

| Capacité | État | Limite actuelle |
|---|---|---|
| `doctor/init/plan/generate/verify` | Implémenté | CLI non distribuée |
| `profiles` / `profile <name>` | Implémenté (R7) | 26 profils déclarés, 19 générables |
| Matrice de profils | Implémentée (R7) | validée contre la matrice réelle par test |
| Invariant « API obligatoire » | Implémenté (R7) | demande web-only/mobile-only refusée et redirigée |
| 18 combinaisons de stacks | Planifiées/testées | distinctes des profils ; pas toutes démarrées en golden |
| Moteur d'overlays déclaratifs | Implémenté (1A/1B/1C) | Auth, RBAC et Files livrés sur la verticale TypeScript |
| Composition modulaire (`modular-overlay`) | Implémentée (1A) | active si toutes les targets sont modulaires |
| Workspace unifié + lock racine reproductible | Implémenté (1A-R) | `npm install` → `npm ci` ; prouvé par golden runtime |
| CI `Factory Golden Runtime` | Implémentée (1A-R), étendue (1B/1C/R8A) | goldens base/auth/RBAC/Files et profils base |
| Statuts de support (`not-applicable`) | Implémenté (1B) | permet les compositions mixtes sans surface factice |
| Composition Prisma structurée | Implémentée (1B-R) | modèle intermédiaire strict, sans parsing de texte |
| Registres seed/statut composables | Implémentés (1B-R) | ordre explicite, doublons/rangs ambigus refusés |
| OpenAPI composé | Implémenté (1B-R) | généré et vérifié par jeu d'opérations + digest runtime |
| Politique d'overwrite | Implémentée (1B-R) | fichiers centraux interdits, allowlist justifiée |
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
| files | base + auth + rbac | **ready (overlay)** | planifié | **ready (overlay)** | planifié | **ready (overlay)** | planifié |
| audit | à décider | intégré (base) | planifié | non défini | non défini | non défini | non défini |
| notifications | à décider | non défini | non défini | non défini | non défini | planifié | planifié |
| observability | à décider | planifié | planifié | planifié | planifié | planifié | planifié |

`auth` (1A), `rbac` (1B) et `files` (1C) sont `ready` en mode overlay : overlays déclaratifs, baselines sans la
surface correspondante, tests d'absence et goldens runtime vérifiés. `rbac` requiert explicitement
`base + auth`. Sur React Native, `rbac` est **`not-applicable`** (autorisation fine côté serveur) :
ce statut ne bloque pas la composition triple et n'injecte aucune surface mobile. Le payload parqué
`files` exige explicitement `base + auth + rbac` et n'injecte aucune surface sur les targets
planifiées.

## Profils

| Statut | Nombre | Génération | Détail |
|---|---|---|---|
| `ready` | 15 | autorisée | composables, exacts et prouvés par un golden runtime |
| `supported` | 4 | autorisée | composables avec baseline-copy sur Angular/Flutter |
| `planned` | 7 | **refusée** | cibles de parité auth/RBAC/files sur Spring/Angular/Flutter |

Le détail profil par profil est dans `PROFILE_MATRIX.md`. Aucun profil `ready` n'existe sans overlay
et golden ; aucun profil ne compose sans API.

Les goldens runtime adossent les profils `ready`, chacun sur une composition distincte ; les profils
Angular/Flutter restent `supported` tant que leurs baselines ne sont pas extraites.

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
