# ADR-047 — Platform Contract minimal exécutable de la famille API

- Statut : Validé
- Date : 2026-07-23
- Décideur : Owner Foundation

## Contexte

Le pipeline canonique unique est livré ([ADR-046](ADR-046-single-canonical-factory-pipeline.md)) : la
conformité peut désormais être rendue **mesurable** sur le pipeline. Elle ne l'est pas encore :

- le [`CONFORMANCE_MODEL`](../specifications/CONFORMANCE_MODEL.md) exige une **matrice unique générée**
  (« aucun Markdown ne promeut manuellement un statut »), or `RUNTIME_CONFORMANCE_GAP_MATRIX`,
  `CAPABILITY_PARITY_GAP_MATRIX` et `IMPLEMENTATION_MATRIX` sont **écrites à la main** ;
- maturité réelle = **`Bootable`** ; aucune composition n'est prouvée `Conformant` ni `Product-equivalent`
  ([`GOLDEN_AND_CONFORMANCE_GAP_ANALYSIS`](../audits/GOLDEN_AND_CONFORMANCE_GAP_ANALYSIS.md)) ;
- **il n'existe aucune suite Platform Contract exécutable commune** (P0-1 de l'audit).

Un audit direct du code (Phase A, 2026-07-23) a **vérifié** l'état de la famille API sur le **socle**
(`starters/nestjs/src`, `starters/spring/base`) et révélé un écart source-de-vérité sur l'erreur :

| Invariant | NestJS base | Spring base | Écart |
|---|---|---|---|
| **Forme d'erreur canonique** | enveloppe **plate** `{success,statusCode,errorCode,message,details,path,timestamp,requestId}` (réf. `strategy/08_STANDARDS.md §30`, **doc défunte**) | `ApiError{status,code,message,errors,timestamp,path}` | **les deux divergent de la spec** (`PLATFORM_CONTRACT` + `CONTRACT_ARCHITECTURE` exigent **Problem Details**) |
| **Correlation ID** | `common/middleware/request-id.middleware.ts` (posé, propagé au corps d'erreur `requestId`) | absent (aucun filtre, absent du corps d'erreur) | **manquant côté Spring** |
| **Health liveness/readiness** | `health.controller.ts` : `/health`, `/health/live`, `/health/ready` (readiness = check DB) | Actuator `/actuator/health` agrégé | **divergent** |
| Logs structurés / Observabilité | module `common/logging/*` / partielle | logback par défaut / partielle | hors périmètre |

Conclusion Phase A : **ni NestJS ni Spring n'émettent le Problem Details** exigé par la spec ; NestJS suit une
doc supprimée (`08_STANDARDS`). Aligner Spring sur Problem Details ne rendrait donc PAS la paire équivalente
(NestJS diverge aussi), et migrer la forme d'erreur touche l'enveloppe consommée par `@enistere/api-client-fetch`
et les flux auth. La **forme d'erreur canonique** est donc un contrat versionné à décider séparément
(l'audit `CONTRACT_ARCHITECTURE_GAP_ANALYSIS` la classe déjà **REFACTOR**).

## Décision

Rendre exécutable et mesurable le **Platform Contract minimal de la famille API** sur le pipeline canonique,
en trois volets — **la forme d'erreur canonique est mesurée mais non convergée** (différée) :

1. **Suite Platform Contract exécutable** (famille API) : génère une composition via le pipeline canonique,
   la démarre, et assère les invariants communs minimaux — bootstrap reproductible, configuration validée,
   validation, **health liveness/readiness**, **correlation ID**, OpenAPI, migrations, sécurité de base. Elle
   **mesure** aussi la conformité de la forme d'erreur au `PLATFORM_CONTRACT` (aujourd'hui **non conforme des
   deux côtés** — enregistré, pas corrigé). Elle **émet `enistere.conformance.json`** par composition (niveau
   `CONFORMANCE_MODEL` atteint + preuve/statut par invariant).
2. **Convergence minimale du socle Spring** sur les **deux** divergences non contractuelles uniquement :
   (a) **`correlationId`** — filtre de corrélation (lecture/génération d'un id, MDC, en-tête de réponse,
   propagation dans le corps d'erreur) ;
   (b) **health liveness/readiness** — exposés de façon équivalente à NestJS (`/health`, `/health/live`,
   `/health/ready`, readiness = check DB), même forme observable.
   La forme d'erreur Spring n'est **pas** modifiée par cette mission.
3. **Fitness functions d'invariants du mandat (FF6+)** dans `factory/quality/scripts/fitness-functions.mjs` :
   verrouillent les garanties d'[ADR-046](ADR-046-single-canonical-factory-pipeline.md) contre toute
   régression — en particulier « aucun module moteur ne lit le blueprint en aval de `normalize` » et
   « un seul modèle d'intention / de résolution / de plan ».

## Conséquences positives

- conformité **calculée** pour la famille API (début de sortie des matrices manuelles), conforme au
  `CONFORMANCE_MODEL` ;
- première **équivalence observable** prouvée sur une paire de jumeaux (Nest↔Spring) pour health + correlation ;
- l'écart de forme d'erreur devient **explicite et mesuré**, plus caché ;
- les invariants du pipeline canonique deviennent **non régressables** (FF6+).

## Coûts et risques

- **Convergence health/correlation Spring** peut impacter les goldens `spring-*` → maîtrisé par
  `golden-runtime` (compositions Spring restent vertes) et par la suite.
- La paire API **reste non équivalente sur l'erreur** tant que la mission dédiée n'a pas tranché
  Problem Details vs enveloppe plate → assumé et tracé dans `conformance.json`.

## Périmètre

Inclus : familles API **NestJS** et **Spring (base)** ; suite exécutable + `enistere.conformance.json` ;
convergence Spring sur **correlationId + health** ; FF6+.

Exclus (missions dédiées ultérieures) : **forme d'erreur canonique** (décision Problem Details vs enveloppe
plate + nettoyage des références à `strategy/08_STANDARDS.md` défunte) ; **logs structurés + observabilité**
Spring ; config typée Spring étendue ; Auth/RBAC/Files (§11) ; Web/Mobile ; renommage `starters/`→`runtimes/`
et restructuration en `runtime.yaml`/`conformance/`/`golden/`.

## Alternatives rejetées

- **Enveloppe plate canonique + correction immédiate de la spec** : engagerait un format bespoke et
  risquerait une re-correction si Problem Details est retenu plus tard.
- **Problem Details migré maintenant sur Nest+Spring** : dépasse le « minimal » du §11, touche les clients
  Web/Mobile et les flux auth.
- **Requalifier à la main la matrice de conformité** : contredit le `CONFORMANCE_MODEL` (statut calculé).

## Migration

- Aucune migration de la forme d'erreur (différée).
- Spring : ajout d'un filtre de corrélation et d'un contrôleur health (`/health`, `/health/live`,
  `/health/ready`). Additif ; documenté dans le README du starter Spring.
- Le format `enistere.conformance.json` est nouveau (additif).

## Tests

- Nouvelle **suite Platform Contract exécutable** (famille API) sur Nest et Spring générés.
- `enistere.conformance.json` : niveaux atteints + statut par invariant (erreur = mesurée non conforme).
- Goldens `golden-runtime` `nestjs-*` et `spring-*` restent verts.
- FF6+ ajoutées à `fitness-functions.mjs` avec tests dédiés.
- Équivalence observable Nest↔Spring sur health + correlation vérifiée par la suite.

## Rollback

- Volets 1 (suite) et 3 (FF6+) sont **additifs** : rollback = suppression, sans impact runtime.
- Volet 2 (convergence Spring) : rollback = `git revert` du/des commit(s) ; la suite reste et re-signale
  Spring non convergé sur health/correlation.

## Suite

Missions dédiées : (1) **contrat d'erreur canonique** (Problem Details vs enveloppe plate) + nettoyage
`08_STANDARDS` ; (2) logs structurés + observabilité API ; puis extension du Platform Contract exécutable aux
familles Web et Mobile.
