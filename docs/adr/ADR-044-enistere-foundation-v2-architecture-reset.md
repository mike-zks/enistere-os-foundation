# ADR-044 — Refondation d'architecture Enistere Foundation V2

- Statut : Validé
- Date : 2026-07-20
- Décideur : Owner Foundation

## Contexte

[ADR-042](ADR-042-ai-native-project-factory-architecture.md) a fait sortir la Foundation du modèle
`cores/` pour en faire une Project Factory AI-native pilotée par un blueprint. Cette transition a réussi :
CLI déterministe, six starters, overlays de capability déclaratifs, goldens runtime, lock de provenance.

Elle a cependant conservé le **starter** comme unité centrale. Les conséquences apparaissent aujourd'hui :

- la topologie est figée à « une API obligatoire, un Web optionnel, un Mobile optionnel », soit
  18 compositions ; elle ne décrit ni le multi-applications, ni les workers, ni le multi-clients ;
- la parité entre implémentations alternatives d'une même famille n'est pas formalisée : rien ne définit
  ce que NestJS et Spring Boot doivent garantir de façon identique ;
- les contrats sont orientés TypeScript, ce qui désavantage structurellement les runtimes non-JS ;
- les statuts (`ready`, `planned`) sont déclarés par manifeste plutôt que calculés depuis une suite de
  conformité commune ;
- le lifecycle (upgrade, migration, rollback) reste incomplet ;
- la documentation a accumulé deux architectures concurrentes, `strategy/` et `docs/`, avec des matrices
  de profils dupliquées et des rapports de mission traités comme sources actives.

## Décision

> L'unité centrale d'Enistere n'est plus le starter autonome, mais le **système** défini par un blueprint,
> composé de runtime adapters, capabilities, primitives, contrats et politiques, puis vérifié par des
> suites de conformité.

Le modèle canonique devient :

```text
Enistere System =
Blueprint
+ Runtime Adapters
+ Capabilities
+ Infrastructure Primitives
+ Domain Definitions
+ Governance Policies
```

Le corpus documentaire V2 est adopté comme base canonique. `docs/governance/SOURCE_OF_TRUTH.md` fixe la
hiérarchie d'autorité. L'ancienne architecture documentaire `strategy/` est retirée de la branche active.

## Concepts adoptés

- **Platform Contract** : garanties communes exigées de tout runtime, par catégorie.
- **Runtime Adapter** : implémentation interchangeable d'une famille (API, Web, Mobile, Worker). Les
  starters actuels sont conceptuellement de futurs runtime adapters.
- **Capability** : responsabilité transverse définie par contrat, jamais par un framework.
- **Infrastructure Primitive** : dépendance d'exécution déclarée (PostgreSQL, Redis, S3, SMTP, scheduler).
- **Domain Definition** : modèle métier neutre compilé vers les runtimes.
- **Conformance Model** : niveaux `Declared` → `Implemented` → `Generatable` → `Bootable` → `Conformant`
  → `Product-equivalent` → `Production-ready`, adossés à des preuves exécutables.
- **Governance Policies** : DoR, DoD, gouvernance d'architecture et politiques opérationnelles.

## Conséquences positives

- la topologie n'est plus limitée à 18 combinaisons ;
- la parité entre implémentations alternatives devient un critère explicite et testable ;
- les contrats cessent d'être définis par une stack particulière ;
- un statut ne peut plus être promu par déclaration Markdown ;
- le lifecycle et la migration deviennent des objets de première classe ;
- une seule architecture documentaire reste active.

## Coûts et risques

- l'écart entre la cible documentée et le code existant est réel et non encore mesuré ;
- le modèle de conformité exige des suites de tests qui n'existent pas toutes ;
- la neutralisation des contrats vis-à-vis de TypeScript représente un chantier substantiel ;
- risque de documentation d'anticipation : la cible pourrait être prise pour l'état livré.

Mesure compensatoire : `docs/project-status/FOUNDATION_CURRENT_STATE.md` distingue explicitement la cible
adoptée, les actifs existants et les écarts. Aucune parité produit n'est revendiquée.

## Stratégie de migration

1. adopter le corpus documentaire (cet ADR) ;
2. auditer les écarts entre la cible et l'implémentation, sans refonte de code ;
3. formaliser les suites de conformité ;
4. requalifier les runtimes existants contre le Platform Contract ;
5. neutraliser les contrats ;
6. ouvrir la topologie ;
7. compléter le lifecycle.

Aucune expansion n'est autorisée avant convergence : ni nouvelle capability, ni nouveau runtime, ni
nouvelle topologie, ni promotion de profil.

## Documents canoniques

- `docs/specifications/` — Platform Contract, Runtime Adapter, Capability, System Blueprint, Primitive,
  Composition Model, Conformance Model, Lifecycle & Upgrade ;
- `docs/architecture/` — fonctionnelle, technique, capability, contract, security, operations, AI ;
- `docs/governance/` — Source of Truth, gouvernance, DoR, DoD, politiques opérationnelles ;
- `docs/strategy/` — vision, positionnement, utilisateurs, principes, périmètre ;
- `docs/roadmap/ENISTERE_FACTORY_V2_ROADMAP.md`.

## Hors périmètre

Cet ADR est documentaire et conceptuel. Il ne modifie ni le code, ni les schémas, ni les manifests, ni les
workflows. Il ne renomme pas `starters/` en `runtimes/`. Il ne déclare aucun composant conforme. Il ne
promeut ni ne rétrograde aucune capability.

## ADR supersédés

- [ADR-042](ADR-042-ai-native-project-factory-architecture.md) — *Superseded by ADR-044*. Sa décision de
  sortir de `cores/` et son modèle de gouvernance des agents restent acquis ; sa définition du starter
  comme unité centrale et sa topologie « API obligatoire, Web et Mobile optionnels » sont remplacées.

## ADR conservés

Les ADR 001 à 041 et 043 restent valides dans leur portée technique locale (persistance, validation,
session, CSRF, RBAC, upload, design tokens, stacks UI, client HTTP, état serveur, CI/CD, registry,
stockage mobile sécurisé, génération de client OpenAPI, hachage, logging, build Maven, versioning). Ils
décrivent des choix d'implémentation, non le modèle d'architecture, et seront requalifiés lors de l'audit
d'écart s'ils entrent en tension avec le Platform Contract.

## Alternatives rejetées

- prolonger ADR-042 en ajoutant seulement des topologies : ne traite ni la parité, ni la neutralité des
  contrats, ni la conformité calculée ;
- attendre la convergence du code avant d'adopter la cible : maintient deux architectures concurrentes ;
- archiver l'ancienne documentation dans le dépôt actif : crée une source concurrente durable.
