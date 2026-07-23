# Matrice d'implémentation

> **État d'implémentation, pas architecture cible.** Les états ci-dessous décrivent le code actuel, dont
> les statuts ont été établis sur l'ancien modèle. Ils seront requalifiés contre le
> [modèle de conformité](../specifications/CONFORMANCE_MODEL.md) lors de l'audit d'écart. Aucun statut
> listé ici ne vaut déclaration de conformité V2.

## Factory

| Capacité | État | Limite actuelle |
|---|---|---|
| `doctor/init/plan/generate/verify` | Implémenté | CLI non distribuée |
| Pipeline canonique unique | **Implémenté et testé** (ADR-046) | blueprint → CSM → ResolvedSystem → Plan → génération ; pipeline legacy supprimé |
| Canonical System Model | **Implémenté et utilisé** (ADR-045/046) | unique modèle d'intention ; le blueprint n'est plus lu après ingestion |
| Resolved System Model | **Implémenté et utilisé** (ADR-046) | unique modèle de résolution ; targets résolues (plus « toutes les apps ») |
| Generation Plan | **Implémenté et utilisé** (ADR-046) | entrée unique du générateur ; trois digests distincts, immutabilité profonde |
| Platform Contract exécutable (API) | **Complet** (ADR-047, ADR-048, ADR-049) | `factory/conformance/` émet `enistere.conformance.json` (statut calculé) ; parité Nest↔Spring sur erreur, correlation, health et observabilité (logs structurés) ; metrics/tracing différés |
| Platform Contract exécutable (Web, socle) | **Implémenté** (ADR-050, ADR-051) | évaluateur multi-familles, invariants Web idiomatiques ; socle Angular convergé vers Next.js (`enistere.conformance.json`) ; parité contrats générés + capabilities Web différées |
| Platform Contract exécutable (Mobile, mesure) | **Implémenté** (ADR-052) | évaluateur 3 familles ; `enistere.conformance.json` couvre Mobile ; baseline calculée RN (mûr) / Flutter (base-only) ; convergence Flutter différée |
| Fitness functions du pipeline (FF6–FF8) | **Implémenté** (ADR-047) | frontière d'ingestion, modèle interne unique, chaîne canonique — gardés contre régression |
| `profiles` / `profile <name>` | Implémenté (R7) | 26 profils déclarés, 21 générables |
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
| auth | base | **ready (overlay)** | **ready (overlay)** | **ready (overlay)** | planifié | **ready (overlay)** | planifié |
| rbac | base + auth | **ready (overlay)** | **ready (overlay)** | **ready (overlay)** | planifié | **non applicable** | planifié |
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
| `ready` | 21 | autorisée | composables, exacts et prouvés par un golden runtime |
| `supported` | 0 | autorisée | aucun dépassement de baseline après R8A-3 |
| `planned` | 5 | **refusée** | Files Spring et auth/RBAC/files Angular/Flutter |

Le détail profil par profil est dans `PROFILE_MATRIX.md`. Aucun profil `ready` n'existe sans overlay
et golden ; aucun profil ne compose sans API.

Les goldens runtime adossent les profils `ready`, chacun sur une composition distincte. Les six
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
