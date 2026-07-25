# Roadmap maître d'implémentation Enistere

## Règles de pilotage

Cette roadmap décrit la cible complète. Une phase peut préparer la représentation d'une phase ultérieure,
mais ne revendique son support qu'après ses critères de sortie. Une seule mission est active à la fois.
Chaque mission livre code, tests, preuves, documentation et mise à jour de statut ensemble.

## 1. Target Architecture

- **Objectifs :** adopter profils, baseline, runtimes, capabilities, primitives, pipeline, CLI, IA et statuts.
- **Dépendances :** aucune.
- **Livrables :** ADR-057, documents d'architecture/spécifications, exemples, audit et cette roadmap.
- **Sortie :** corpus cohérent, aucun Audit/Observability classé capability, liens valides.
- **Risques :** cible non actionnable ; **preuves :** revue normative et link check.
- **Prochaine mission :** rendre baseline et contrats exécutables.

## 2. Platform Kernel

- **Objectifs :** Blueprint V2 complet, CSM complet, ResolvedSystem, plan, registry local, policies, digests,
  lockfile et diagnostics.
- **Dépendances :** phase 1.
- **Livrables :** schémas versionnés, migrations d'entrée, modèles immuables, resolver/planner uniques.
- **Sortie :** quatre profils et leurs dimensions représentables ; aucune lecture du blueprint après normalisation ; plans
  déterministes et explicables.
- **Risques :** double pipeline, migration cassante ; **preuves :** fitness functions, snapshots/goldens,
  tests de migration et digest.
- **Prochaine mission :** compléter le Blueprint V2/CSM sans activer de génération fictive.

## 3. Runtime Contracts

- **Objectifs :** versionner et exécuter Common, API, Web et Mobile Contracts avec baseline complet.
- **Dépendances :** kernel minimal stable.
- **Livrables :** manifests de contrat, suites communes/famille, diagnostics, evidence schema.
- **Sortie :** Observability et Technical Audit obligatoires ; chaque invariant mesuré de façon idiomatique.
- **Risques :** tests basés sur fichiers plutôt que comportements ; **preuves :** contract tests négatifs et
  positifs sur adapters de référence.
- **Prochaine mission :** converger les trois API sur le contrat.

## 4. API Runtime Convergence

- **Objectifs :** rendre NestJS et Spring conformes, puis construire FastAPI contre le même contrat.
- **Dépendances :** phase 3.
- **Livrables :** bases API, adapters, goldens et conformance reports.
- **Sortie :** chaque runtime au moins `CONFORMANT`; aucune feature optionnelle dans la base.
- **Risques :** copier des structures non idiomatiques, ajouter FastAPI trop tôt ; **preuves :** boot réel,
  OpenAPI, erreurs, audit, OTEL, migrations, shutdown, security.
- **Prochaine mission :** créer FastAPI contre le contrat désormais prouvé par NestJS/Spring.

## 5. Web Runtime Convergence

- **Objectifs :** Next.js et Angular conformes au contrat Web, source unique chacun.
- **Dépendances :** contrats, API de référence stable.
- **Livrables :** bases, clients générés, a11y, telemetry et E2E.
- **Sortie :** `CONFORMANT` sur baseline/Web, contrats API polyglottes consommés.
- **Risques :** session/auth cachées dans la base ; **preuves :** goldens, a11y, headers, E2E.
- **Prochaine mission :** dédoublage puis conformance Angular.

## 6. Mobile Runtime Convergence

- **Objectifs :** React Native et Flutter conformes sans surcharger la base.
- **Dépendances :** contrats, API stable.
- **Livrables :** bases, secure storage/hooks, telemetry/crash, builds et smokes.
- **Sortie :** extras RN extraits ; builds Android et iOS qualifiés selon environnement.
- **Risques :** confondre hooks et capabilities, preuves iOS absentes ; **preuves :** tests devices/simulators,
  goldens et security storage.
- **Prochaine mission :** classifier puis extraire les extras RN.

## 7. Architecture Profiles

- **Objectifs :** matérialiser `backend-service` et `product-platform`, puis `distributed-platform` ;
  conserver `service-ecosystem` représentable sans support fictif.
- **Dépendances :** runtimes convergés.
- **Livrables :** profile registry, validations, recommender déterministe, topological goldens.
- **Sortie :** trois profils générables/bootables avec refus justifiés ; `service-ecosystem` reste honnête.
- **Risques :** presets concurrents du CSM ; **preuves :** normalisation identique et graph tests.
- **Prochaine mission :** golden `backend-service`, puis complexité croissante.

## 8. Capability Framework

- **Objectifs :** mécanisme universel de manifest/adapters/targets/dépendances/conflits/primitives/modes/
  migrations/conformance/install/remove/upgrade.
- **Dépendances :** baseline et extension points stabilisés.
- **Livrables :** schema capability, resolver de graphe, overlay structuré, lifecycle contract.
- **Sortie :** capability exemple ajoutée/retirée sans modifier le runtime ni une autre capability.
- **Risques :** fusion implicite, ordre codé en dur ; **preuves :** closure, conflits, absence, rollback.
- **Prochaine mission :** stabiliser le manifeste et les coutures.

## 9. Capabilities

- **Objectifs :** Authentication, Authorization, User Management, Files, Events, Notifications, Automation,
  puis Realtime, Search, Feature Flags, Multitenancy et Workflow.
- **Dépendances :** framework capability.
- **Livrables :** spécification neutre, adapters, contrats, migrations, audit métier, suites.
- **Sortie :** parité produit par targets revendiquées ; absence prouvée si non sélectionnée.
- **Risques :** packages trop couplés, targets factices ; **preuves :** conformance/goldens/E2E.
- **Prochaine mission :** Authentication après validation du framework.

## 10. Infrastructure Primitives

- **Objectifs :** providers PostgreSQL, document DB arbitrée, Redis, MinIO, Alfresco, RabbitMQ, telemetry.
- **Dépendances :** modèle primitives et modes.
- **Livrables :** adapters, configuration, backup/restore, migration, security et health.
- **Sortie :** chaque provider qualifié par mode ; MinIO/Alfresco restent sémantiquement distincts.
- **Risques :** provider lock-in, fausse abstraction ; **preuves :** tests sémantiques et de restauration.
- **Prochaine mission :** PostgreSQL, puis Redis/MinIO.

## 11. Polyglot Contracts

- **Objectifs :** source neutre et bindings TypeScript, Java, Python, Dart pour HTTP, schémas et événements.
- **Dépendances :** runtimes et capability contracts stabilisés.
- **Livrables :** generators, fixtures, compatibility checker et publication.
- **Sortie :** aucun package langage n'est autoritaire ; mêmes fixtures passent partout.
- **Risques :** dérive des generators ; **preuves :** round-trip et consumer-driven contracts.
- **Prochaine mission :** source OpenAPI/JSON Schema et bindings Java.

## 12. Product Goldens

- **Objectifs :** un golden par profil supporté et paire importante de runtimes.
- **Dépendances :** profiles, capabilities et contrats polyglottes.
- **Livrables :** projets générés éphémères, boot/E2E/security/ops proofs.
- **Sortie :** parité produit mesurée, pas seulement bases.
- **Risques :** matrice explosive ; **preuves :** matrice de risques et échantillonnage documenté.
- **Prochaine mission :** golden `product-platform` Spring+Next.js.

## 13. Domain Compiler

- **Objectifs :** compiler domaines, agrégats, use cases, contracts, migrations, clients, forms et tests.
- **Dépendances :** contrats/capabilities/goldens stables.
- **Livrables :** domain schema, compiler, extension seams et conformance.
- **Sortie :** domaine simple généré sur runtimes alternatifs avec équivalence.
- **Risques :** générateur CRUD limitant le métier ; **preuves :** golden non trivial.
- **Prochaine mission :** modèle domaine minimal contract-first.

## 14. Lifecycle

- **Objectifs :** inspect, diff, add/remove, upgrade, migrate, reconcile et rollback non destructifs.
- **Dépendances :** lock/provenance, ownership fichiers, migrations des composants.
- **Livrables :** state model, planner de changement, approval gates, recovery.
- **Sortie :** upgrade et rollback réussis sur golden modifié par utilisateur.
- **Risques :** écrasement, migrations irréversibles ; **preuves :** property tests, backups et failure drills.
- **Prochaine mission :** inspect/diff read-only.

## 15. Service Ecosystem

- **Objectifs :** génération complète du profil `service-ecosystem`, avec style backend `microservices`,
  ownership, service identity, sync/async, outbox, DLQ,
  tracing, SLO et résilience.
- **Dépendances :** `distributed-platform`, primitives, lifecycle, goldens.
- **Livrables :** topology planner, deployment/migration orchestration, failure scenarios.
- **Sortie :** golden `service-ecosystem` bootable/conformant et chaos ciblé.
- **Risques :** complexité opérationnelle ; **preuves :** panne partielle, compatibilité, restore, rollback.
- **Prochaine mission :** étendre un golden `distributed-platform` prouvé.

## 16. Registry and Distribution

- **Objectifs :** registry distant, résolution, signature, provenance, SBOM, publication et CLI distribuée.
- **Dépendances :** formats/versioning/lifecycle stables.
- **Livrables :** protocol registry, trust policy, release pipeline et cache.
- **Sortie :** installation/reproduction offline/online, signature vérifiée et révocation.
- **Risques :** supply chain et compatibilité ; **preuves :** tamper tests, reproducibility, recovery.
- **Prochaine mission :** protocole registry et modèle de confiance.

## 17. Advanced AI

- **Objectifs :** advisor, blueprint/code/review/security/migration/ops agents et Evaluation Engine.
- **Dépendances :** schémas, policies, CLI, lifecycle et preuves stables.
- **Livrables :** contracts agents, provider adapters, sandbox, approvals, evals et AI observability.
- **Sortie :** améliorations mesurées sans contourner le déterminisme ni l'autorité humaine.
- **Risques :** hallucination, fuite, actions excessives, coût ; **preuves :** evals, red-team, audit,
  approvals et budgets.
- **Prochaine mission :** Requirements Analyzer en lecture seule.

## Action unique courante

Le contrat exécutable (ADR-058) et la conformité NestJS/Spring (ADR-061) sont acquis.

> **Créer FastAPI comme troisième adapter API de référence contre Common/API v2, avec rapport de
> conformité et golden boot/HTTP — sans capability métier.**
