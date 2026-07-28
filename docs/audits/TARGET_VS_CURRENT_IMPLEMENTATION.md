# Audit — Architecture cible vs implémentation actuelle

- Date : 2026-07-27
- Branche auditée : `feat/architecture-profiles-v2`
- Référence de départ : merge de la PR #212 (`40640f2`)
- Nature : audit vivant cible/existant, actualisé par les preuves d'ADR-065

## Méthode

La cible a d'abord été définie dans l'ADR-057 et les spécifications associées. Le dépôt a ensuite été
inspecté : Factory, schémas, CLI, modèles, conformance, starters/manifests, capabilities, packages,
deployment, exemples, tests, CI et documents canoniques.

Classification :

- `KEEP` : conforme et réutilisable ;
- `ADAPT` : bon actif, extension bornée ;
- `REFACTOR` : structure/contrat à reconstruire sans tout jeter ;
- `REPLACE` : mécanisme incompatible à substituer ;
- `REMOVE` : actif ou classification à supprimer ;
- `CREATE` : manque net.

## Résumé

Le pipeline canonique, les modèles internes initiaux, les goldens, les sept runtimes et les overlays sont de
bons actifs. Les quatre profils système et leurs dimensions sont désormais représentables et normalisés.
Le Blueprint V2 complet, les primitives, les topologies distribuées, le lifecycle et les contrats
polyglottes manquent encore. Les 27 « profils » historiques restent des presets de composition distincts.

## Matrice des actifs

| Actif actuel | Classe | Cible / action | État constaté |
|---|---|---|---|
| pipeline Blueprint→CSM→Resolved→Plan→Generation | KEEP | prolonger vers MaterializedSystem/Report | implémenté et testé |
| `factory/model/canonical-system.mjs` | ADAPT | modèle V2 complet | applications/policies partiels |
| `factory/model/resolved-system.mjs` | ADAPT | graph/primitives/contracts/support complet | pipeline utilisé |
| `factory/model/generation-plan.mjs` | ADAPT | opérations, risques, approvals, support | digests déjà présents |
| blueprint schema v1 | REPLACE | enveloppe V2 + migration frontière | taxonomie système adaptée ; enveloppe/champs historiques restants |
| profiles/topologies engine | ADAPT | compléter graphe distribué | profils système et presets désormais séparés dans ResolvedSystem/Plan |
| CLI système + presets historiques | ADAPT | lifecycle futur | `init/validate/plan --explain` orientés profil système ; presets conservés séparément |
| lock/provenance/digests | ADAPT | registry resolution et lifecycle | fondations présentes |
| conformance engine | ADAPT | remplacer progressivement probes critiques par comportements | baseline v2 exécutable depuis ADR-058 |
| fitness functions FF6–FF8 | KEEP | préserver pipeline unique | preuves présentes |
| sept starters existants | KEEP | préserver les Runtime Contracts | sept adapters conformes à Common + famille v2 |
| NestJS base | KEEP | préserver Common/API v2 et faire évoluer les adapters | 28/0/0 + golden boot/HTTP |
| Spring base source unique | KEEP | préserver Common/API v2 et faire évoluer les adapters | 28/0/0 + golden boot/HTTP |
| anciens doubles `base/` Angular/Flutter | REMOVE | source unique | supprimés et interdits par fitness function |
| ancien moteur Notifications React Native | REMOVE | hook push neutre | supprimé et interdit par fitness function |
| FastAPI runtime | KEEP | préserver Common/API v2 ; ajouter des capabilities uniquement par overlay | 28/0/0 + golden boot/HTTP |
| capabilities auth/rbac/files | ADAPT | manifests vNext, audit métier, parité targets | overlays réels mais partiels |
| `capabilities/base` | REMOVE | baseline n'est pas une capability | **retiré par ADR-058** |
| planned capability Audit | REMOVE | Technical Audit dans baseline | classification retirée des manifests pendant la mission |
| planned capability Observability | REMOVE | Observability dans baseline | classification retirée des manifests pendant la mission |
| User Management/Events/etc. | CREATE | catalogue ordonné après framework | absents |
| PostgreSQL integration | ADAPT | primitive typée/providers/modes | présent dans APIs/goldens |
| MinIO integration | ADAPT | `object-storage` | présent via Files/deployment |
| Alfresco | CREATE | `content-repository` | absent |
| Redis | CREATE/ADAPT | `cache` typé | usages ponctuels à recenser |
| RabbitMQ | CREATE | queue/broker | absent |
| telemetry backend adapters | CREATE | primitive OpenTelemetry-compatible | absence de stack qualifiée |
| packages TypeScript contracts/client | ADAPT | dérivés de source neutre | TS aujourd'hui central |
| Java/Python/Dart bindings | CREATE | génération polyglotte | absents |
| deployment Compose/runbooks | ADAPT | packs par profil et primitives | actifs staging utiles |
| lifecycle manager | CREATE | inspect/diff/upgrade/migrate | spécification seulement |
| Factory AI local adapter/approval | ADAPT | orchestration/policies/evals | prototype utile |
| derived-system AI runtime | CREATE | services FastAPI gouvernés | absent |
| exemples blueprints actuels | ADAPT | migrer vers V2 et goldens | syntaxe/support actuels |
| documents V2 existants | ADAPT | aligner ADR-057/060 | taxonomie active corrigée ; détails lifecycle à compléter |
| anciennes roadmaps actives | REPLACE | roadmap maître unique | séquence trop courte |

## Profils

| Profil cible | Représentation actuelle | Génération actuelle | Décision |
|---|---|---|---|
| `backend-service` | CLI/CSM/resolver/plan | compositions API prouvées | KEEP |
| `product-platform` | CLI/CSM/resolver/plan, multi-client | compositions backend+clients prouvées | KEEP |
| `distributed-platform` | CSM + resolver + plan avec ownership/communications | slice Spring + NestJS sync HTTP | ADAPT pour clients/async/primitives |
| `service-ecosystem` | représentable ; style `microservices` distinct | non | CREATE après lifecycle |

## Runtimes et baseline

| Runtime | Actif | Limite face à la cible | Classe |
|---|---|---|---|
| NestJS | starter + overlays + goldens | conforme v2 ; backend OTEL et parité produit non prouvés | KEEP |
| Spring | starter source unique + overlays | conforme v2 ; image/deployment et parité produit à qualifier | KEEP |
| FastAPI | starter modulaire + golden | conforme v2 ; capabilities et providers absents | KEEP |
| Next.js | starter + E2E + golden | Common/Web v2 conforme ; parité produit non prouvée | KEEP |
| Angular | starter source unique + E2E + golden | Common/Web v2 conforme ; capabilities absentes | KEEP |
| React Native | starter source unique | Common/Mobile v2 conforme ; test device non prouvé | KEEP |
| Flutter | starter source unique | Common/Mobile v2 conforme ; APK debug prouvé, test device non prouvé | KEEP |

La conformité antérieure « 6 runtimes en parité de contrat de base » se rapporte au contrat minimal v1.
Le baseline v2 est exécutable (ADR-058) ; ADR-061/062 prouvent les trois APIs
conformes sur leurs 28 invariants, ADR-063 les deux runtimes Web conformes sur
leurs 24 invariants et ADR-064 les deux runtimes Mobile conformes sur leurs
25 invariants.

## Contradictions documentaires corrigées

- Audit et Observability retirés du catalogue canonique des capabilities ;
- `base` requalifié en baseline, non capability ;
- quatre profils système, leurs dimensions et sept runtimes deviennent la cible ;
- MinIO et Alfresco sont distingués ;
- la roadmap courte V2 est remplacée comme autorité par la roadmap maître ;
- les statuts incluent `TARGET` et `PLANNED` avant les niveaux de preuve ;
- l'IA Factory est séparée de l'IA dérivée.

Les ADR historiques gardent leur texte comme historique. Les ADR-057 et ADR-060 indiquent précisément ce qu'ils supersèdent.
Les entrées `plannedCapabilities` contradictoires ont été retirées des manifests : ce nettoyage de
classification ne revendique aucune amélioration d'implémentation.

## Risques prioritaires

1. **P0 — parité API rompue sur `files` :** les trois capabilities sont
   désormais mesurées (ADR-068 → ADR-070). Authentication et RBAC sont
   `CONFORMANT` ; `files` ne l’est pas. Spring tient 2 des 7 responsabilités que
   NestJS tient, alors que les deux appartiennent à la **même famille API** et
   sont censés être interchangeables : manquent `delete`, `metadata`,
   `quarantine`, `quota`, `reconciliation`. C’est le seul écart de parité mesuré
   du dépôt, et il est bloquant pour `files`.

   La mesure a aussi corrigé, en amont, quatre divergences Spring sur Auth puis
   un défaut plus grave sur RBAC — un refus d’autorisation répondait `500` au
   lieu de `403`, invisible aux suites locales qui n’exerçaient pas le refus via
   HTTP.
2. **P0 — blueprint/CSM partiels :** sélection et résolution des providers de
   primitives et Blueprint V2 complet manquent.
3. **P1 — distribution partielle :** async, clients, isolation des primitives et
   appels métier interservice non prouvés.
4. **P1 — contrats centrés TypeScript :** équivalence Java/Python/Dart non prouvable.

## Conclusion et action unique

Les actifs du kernel et des runtimes justifient une convergence plutôt qu'une réécriture totale.
ADR-061 a fermé les écarts des deux APIs existantes ; ADR-062 a ajouté FastAPI
dans le même pipeline ; ADR-063 a fermé les écarts Web et supprimé les dernières
représentations `base/` ; ADR-064 a fermé les écarts Mobile et retiré
Notifications du runtime React Native ; ADR-065 rend les deux profils simples
exécutables ; ADR-066 rend le slice distribué Spring + NestJS générable sans
promouvoir les autres graphes.

> **Prochaine mission unique : rendre Authentication conforme au contrat
> Capability v2 sur ses targets actuellement `ready`, sans nouvelle target ni
> nouvelle capability.**
