# Matrice d'implémentation

> **État d'implémentation, pas architecture cible.** Les états ci-dessous décrivent le code actuel, dont
> les statuts ont été établis sur l'ancien modèle. Ils seront requalifiés contre le
> [modèle de conformité](../specifications/CONFORMANCE_MODEL.md) lors de l'audit d'écart. Aucun statut
> listé ici ne vaut déclaration de conformité V2.

## Factory

| Capacité | État | Limite actuelle |
|---|---|---|
| `doctor/init/plan/generate/verify` | Implémenté | CLI non distribuée |
| `architecture list/describe/recommend` | Implémenté (ADR-060) | recommandation déterministe initiale ; écriture guidée du Blueprint à compléter |
| Pipeline canonique unique | **Implémenté et testé** (ADR-046) | blueprint → CSM → ResolvedSystem → Plan → génération ; pipeline legacy supprimé |
| Canonical System Model | **Implémenté et utilisé** (ADR-045/046) | unique modèle d'intention ; le blueprint n'est plus lu après ingestion |
| Resolved System Model | **Implémenté et utilisé** (ADR-046) | unique modèle de résolution ; targets résolues (plus « toutes les apps ») |
| Generation Plan | **Implémenté et utilisé** (ADR-046) | entrée unique du générateur ; trois digests distincts, immutabilité profonde |
| Platform Contract exécutable (API) | **Conforme sur NestJS/Spring/FastAPI** (ADR-061/062) | 28 conformes/0 partiel/0 manquant chacun ; suites comportementales et goldens boot/HTTP obligatoires |
| Platform Contract exécutable (Web) | **Conforme sur Next.js/Angular** (ADR-063) | 24 conformes/0 partiel/0 manquant chacun ; preuves comportementales et goldens démarrés |
| Platform Contract exécutable (Mobile) | **Conforme sur React Native/Flutter** (ADR-064) | 25 conformes/0 partiel/0 manquant chacun ; preuves comportementales et goldens build/export |
| Platform Baseline v2 exécutable | **Implémenté** (ADR-058/061/062/063/064) | Common/API/Web/Mobile versionnés ; sept runtimes conformes ; rapport calculé dans `factory/conformance/reports/` |
| Source unique des starters | **Implémentée et gardée** (ADR-063/064) | sept racines `starters/<runtime>` ; `base/`, `composition.baseSource` et capabilities Mobile embarquées interdits |
| Requalification de `base` | **Implémentée** (ADR-058) | baseline implicite ; `base` absent du graphe capability/CSM/plan, toléré uniquement en entrée Blueprint v1 puis effacé |
| Fitness functions du pipeline (FF6–FF8) | **Implémenté** (ADR-047) | frontière d'ingestion, modèle interne unique, chaîne canonique — gardés contre régression |
| `profiles` / `profile <name>` | Implémenté (R7/ADR-062) | presets de composition historiques : 27 déclarés, 23 générables |
| Matrice de presets | Implémentée (R7) | validée contre la matrice réelle par test |
| Invariant « API obligatoire » | Implémenté (R7) | demande web-only/mobile-only refusée et redirigée |
| 27 combinaisons de stacks | Planifiées/testées | 3 API × 3 Web × 3 Mobile ; distinctes des profils |
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

| Capability | Dépendances | Nest | Spring | FastAPI | Next | Angular | RN | Flutter |
|---|---|---|---|---|---|---|---|---|
| auth | aucune | **ready (overlay)** | **ready (overlay)** | non supporté | **ready (overlay)** | planifié | **ready (overlay)** | planifié |
| rbac | auth | **ready (overlay)** | **ready (overlay)** | non supporté | **ready (overlay)** | planifié | **non applicable** | planifié |
| files | auth + rbac | **ready (overlay)** | **ready (overlay)** | non supporté | **ready (overlay)** | planifié | **ready (overlay)** | planifié |
| notifications | à décider | non défini | non défini | non défini | non défini | non défini | planifié | planifié |

`auth` (1A), `rbac` (1B) et `files` (1C) sont `ready` en mode overlay : overlays déclaratifs, baselines sans la
surface correspondante, tests d'absence et goldens runtime vérifiés. `rbac` requiert explicitement
`auth`. Sur React Native, `rbac` est **`not-applicable`** (autorisation fine côté serveur) :
ce statut ne bloque pas la composition triple et n'injecte aucune surface mobile. Le payload parqué
`files` exige explicitement `auth + rbac` et n'injecte aucune surface sur les targets
planifiées.

## Presets de composition

| Statut | Nombre | Génération | Détail |
|---|---|---|---|
| `ready` | 23 | autorisée | composables, exacts et prouvés par un golden runtime |
| `supported` | 0 | autorisée | aucun dépassement de baseline après R8A-3 |
| `planned` | 4 | **refusée** | auth/RBAC/files Angular/Flutter selon le preset |

Le détail profil par profil est dans `PROFILE_MATRIX.md`. Aucun profil `ready` n'existe sans overlay
et golden ; aucun profil ne compose sans API.

Les goldens runtime adossent les profils `ready`, chacun sur une composition distincte. Les sept
baselines sont modulaires ; les capabilities Angular/Flutter encore `planned` restent refusées.

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
