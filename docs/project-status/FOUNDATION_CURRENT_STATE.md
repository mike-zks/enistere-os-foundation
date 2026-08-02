# État courant de la Foundation

## Phase

`ARCHITECTURE_RESET_V2`

## Décision

Le corpus V2 est adopté comme architecture **cible**. Les développements d’expansion sont suspendus
jusqu’à la convergence du code avec cette cible.

L’adoption documentaire ne vaut pas implémentation. Les trois capabilities livrées satisfont leur
parité déclarée ; aucun statut `PRODUCT_EQUIVALENT` ou `PRODUCTION_READY` n’est revendiqué.
Les sept runtimes sont désormais conformes à leur Runtime Contract v2 ; aucune nouvelle capability ne
doit être ajoutée avant la fin du chantier Architecture Profiles.

Décision de refondation initiale : [`ADR-044`](../adr/ADR-044-enistere-foundation-v2-architecture-reset.md).
Architecture de référence courante :
[`ADR-057`](../adr/ADR-057-reference-architecture-and-platform-baseline.md).
Contrat exécutable courant :
[`ADR-058`](../adr/ADR-058-executable-platform-baseline-v2.md).
Convergence API courante :
[`ADR-062`](../adr/ADR-062-fastapi-runtime-adapter.md).
Convergence Web courante :
[`ADR-063`](../adr/ADR-063-web-runtime-v2-convergence.md).
Convergence Mobile courante :
[`ADR-064`](../adr/ADR-064-mobile-runtime-v2-convergence.md).
Profils système exécutables :
[`ADR-065`](../adr/ADR-065-executable-system-architecture-profiles.md).
Capability Manifest v2 :
[`ADR-067`](../adr/ADR-067-capability-manifest-v2-and-deterministic-graph.md).
Conformité produit Authentication :
[`ADR-068`](../adr/ADR-068-authentication-capability-product-conformance.md).
Conformité produit RBAC et évaluateur générique :
[`ADR-069`](../adr/ADR-069-authorization-capability-product-conformance.md).
Responsabilités par target et parité par famille :
[`ADR-070`](../adr/ADR-070-capability-responsibilities-and-family-parity.md).
Gates hermétiques :
[`ADR-071`](../adr/ADR-071-hermetic-quality-gates.md).
Schéma de capability normatif :
[`ADR-072`](../adr/ADR-072-normative-capability-schema.md).
Analyse de secrets bloquante :
[`ADR-073`](../adr/ADR-073-secret-scanning.md).
Parité de famille sur tous les runtimes :
[`ADR-074`](../adr/ADR-074-family-parity-covers-every-runtime.md).
Créance navigateur et Auth sur Angular :
[`ADR-075`](../adr/ADR-075-browser-credential-storage.md).
Frontière de matérialisation des projets dérivés :
[`ADR-086`](../adr/ADR-086-derived-project-materialization-boundary.md).

## Actifs existants à migrer

- sept starters, dont FastAPI sans capability métier ;
- CLI Factory ;
- blueprint initial ;
- moteur de profils ;
- capabilities partiellement extraites ;
- goldens partiels ;
- deployment packs ;
- packages TypeScript.

Ces éléments sont des actifs à auditer, non la définition de la cible.

## Maturité réelle

Les compositions couvertes sont **`BOOTABLE`** selon les preuves disponibles.
Les sept runtimes sont **`CONFORMANT`** aux contrats de leur famille par
exécution des suites normatives et des goldens. Aucun runtime n’est prouvé `PRODUCT_EQUIVALENT` ou
`PRODUCTION_READY`. Audit complet : [`docs/audits/`](../audits/README.md).

## Écarts (mesurés par l'audit)

- **P0** — contrats centrés TypeScript (pas de génération Java/Dart). *Partiellement adressé* : le pipeline
  canonique unique ([ADR-046](../adr/ADR-046-single-canonical-factory-pipeline.md)) et une **suite Platform
  Contract exécutable** minimale pour la famille API ([ADR-047](../adr/ADR-047-executable-platform-contract-api.md))
  existent ; NestJS, Spring et FastAPI sont conformes sur les 28 invariants Common/API v2, avec boot et
  contrat HTTP vérifiés (ADR-061/062). Restent **non implémentés** : Blueprint V2 complet et génération
  polyglotte des contrats.
- **P1** — Lifecycle Manager absent ; distribution limitée au slice Spring +
  NestJS sync HTTP ; primitives système non encore sélectionnées dans le
  Blueprint. Le manifest Capability v2 sait désormais déclarer des besoins de
  primitives provider-neutral. Observability et Technical Audit relèvent du
  baseline.

## Statut des chantiers V2

- `Canonical System Model` : **IMPLEMENTED_AND_USED** (ADR-045).
- `Resolved System Model` : **IMPLEMENTED_AND_USED** (ADR-046).
- `Single Factory Pipeline` : **IMPLEMENTED_AND_TESTED** (ADR-046).
- `Legacy Internal Pipeline` : **REMOVED** (ADR-046).
- `System profile taxonomy` : **EXECUTABLE_PARTIAL** (ADR-060/065/066) ;
  `backend-service` et `product-platform` traversent CLI/resolver/génération,
  `distributed-platform` génère le slice Spring + NestJS avec ownership,
  communications et ordre de déploiement/rollback ; ses autres variantes
  restent bloquées. `service-ecosystem` reste TARGET. Les six dimensions sont
  validées et les alias historiques restent limités à la frontière Blueprint v1.
- `Full Blueprint V2` : **PARTIAL** ; primitives et sections complètes restent TARGET.
- `Platform Contract executable (API minimal v1)` : **HISTORIQUE** (ADR-047, ADR-048, ADR-049) — suite de conformité
  calculée (`factory/conformance/`, émet `enistere.conformance.json`) ; NestJS↔Spring en **parité** sur
  `config-validated`, `error-canonical` (enveloppe plate `ApiErrorResponse`), `correlation-id`, health,
  `openapi`, `base-security` et `observability` ; pipeline gardé par des fitness functions (FF6–FF8).
- `Platform Contract executable (Web, socle)` : **IMPLEMENTED** (ADR-050, ADR-051) — évaluateur
  multi-familles ; invariants Web **idiomatiques** ; le **socle Angular a convergé** vers Next.js
  (`enistere.conformance.json` : Angular base `compliant` sur typed-config/typed-api-access/ui-states/
  error-handling/observability ; a11y `partial`). Parité des contrats **générés** Angular + capabilities Web
  (Phase 3) = différées.
- `Platform Contract executable (Mobile, socle)` : **IMPLEMENTED** (ADR-052, ADR-053) — évaluateur **3
  familles** (API + Web + Mobile) ; React Native `compliant` et **socle Flutter convergé** (ADR-053 : `core/api`
  Dio + interceptors error/logging) → `enistere.conformance.json` montre Flutter base `compliant` sur les 8
  invariants Mobile.
- **Jalon historique : les 6 runtimes ont la parité du contrat de base v1, mesurée**. Cette preuve ne vaut
  pas conformité au Platform Baseline v2 adopté par ADR-057.
- `Platform Baseline v2 + Runtime Contracts` : **IMPLEMENTED** (ADR-058) — contrat JSON versionné,
  manifests résolus jusqu'au plan, rapports schema v2, diagnostics et scan des sept runtimes.
- `API Runtime Convergence v2` : **COMPLETE** (ADR-061/062) — NestJS, Spring et FastAPI sont chacun
  `28/0/0` (`COMPLIANT/PARTIAL/MISSING`) et leurs goldens prouvent le boot/HTTP : voir
  [`platform-baseline-v2-gap.json`](../../factory/conformance/reports/platform-baseline-v2-gap.json).
- `Web Runtime Convergence v2` : **COMPLETE** (ADR-063) — Next.js et Angular
  sont chacun `24/0/0`; leurs goldens prouvent build, démarrage et contrat E2E.
- `Mobile Runtime Convergence v2` : **COMPLETE** (ADR-064) — React Native et
  Flutter sont chacun `25/0/0`; leurs goldens prouvent tests, export/build,
  audit et reproductibilité sans revendiquer de test device.
- `Starter single source` : **COMPLETE** (ADR-063) — les sept starters sont
  matérialisés à leur racine ; aucun dossier `base/` ni `composition.baseSource`.
- `Derived project materialization boundary` : **IMPLEMENTED_AND_TESTED**
  (ADR-086) — aucun payload de capability, cache ou chemin machine n'est livré ;
  les packages partagés suivent la fermeture transitive de leurs consommateurs.
- `base` comme capability : **REMOVED** du registre, des manifests de capabilities, profils et plans ;
  compatibilité Blueprint v1 effacée à l'ingestion.
- `Capability Manifest v2` : **IMPLEMENTED** (ADR-067) — closure déterministe,
  auto-inclusions tracées, conflits symétriques, adapters/contrats/primitives/
  migrations/conformité résolus par application et artefact généré.
- `Conformité produit Authentication` : **CONFORMANT** (ADR-068) — contrat neutre
  versionné, rôles autorité/client, closure d'invariants par rôle et preuves
  vérifiées dans la Foundation comme dans l'application matérialisée.

```text
auth   api  nestjs 4/4 · spring 4/4 · fastapi 4/4 ✓   web nextjs 4/4 · angular 4/4 ✓
       mobile rn 4/4 · flutter 4/4 ✓                     CONFORMANT
rbac   api  nestjs 4/4 · spring 4/4 · fastapi 4/4 ✓   web nextjs 2/4 · angular 2/4 ✓
       mobile rn n/a · flutter n/a                       CONFORMANT
files  api  nestjs 7/7 · spring 7/7 · fastapi 7/7 ✓   web nextjs 5/7 · angular 5/7 ✓
       mobile rn 1/7 · flutter 1/7 ✓                     CONFORMANT

**Authentication est tenue par les sept runtimes** (ADR-075, ADR-076, ADR-077) :
c'est la première capability CONFORMANT comme produit, les trois familles étant à
parité. **RBAC est CONFORMANT sur toutes ses targets applicables** : Angular tient
la même surface client que Next.js ; React Native et Flutter sont explicitement
`not-applicable` conformément à ADR-074. Files est également conforme : Flutter
tient l'upload, seule responsabilité due dans la famille Mobile.
```

- `Parité par famille` : **MESURÉE SUR TOUS LES RUNTIMES** (ADR-070/074) —
  Authentication, RBAC et Files satisfont la règle sur toutes leurs targets
  applicables ; `parity-gaps.json` ne porte plus aucun écart. NestJS, Spring et FastAPI tiennent les sept
  responsabilités Files et protègent leur surface par les permissions `files.*`.

- `Conformité produit RBAC` : **CONFORMANT** (ADR-069) — évaluateur générique,
  contrats produit découverts par convention, `not-applicable` traité comme
  absence légitime de rôle. La mesure a corrigé un défaut latent : un refus
  d'autorisation Spring répondait `500` au lieu de `403`.

  Les trois capabilities livrées ont leur parité déclarée. Restent notamment les
  identités applicatives dérivées du CSM, les contrats polyglottes générés et le lifecycle.

Ces éléments sont qualifiés contre le Platform Baseline v2 par les rapports de
conformance et les goldens nommés ; aucune équivalence produit au-delà des
responsabilités déclarées n'est sous-entendue.

## CI et dépendances

La CI de `main` est verte. La vague d'advisories CVE-2026 est traitée sans downgrade ni désactivation
d'audit : correctifs réels dans les lockfiles, et exceptions **documentées, scopées et datées** pour
`sharp` / `next` et la chaîne `@hono/node-server` (aucun correctif upstream), via
`factory/quality/audit-exceptions.json`. Ces exceptions se lèvent par des missions d'upgrade Next et
Angular CLI suivies dans [`NEXT_ACTIONS.md`](NEXT_ACTIONS.md).

## Action

Audit d'écart livré ([`docs/audits/`](../audits/README.md)). Prochaine action : voir
[`NEXT_ACTIONS.md`](NEXT_ACTIONS.md).
