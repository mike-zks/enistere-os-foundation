# Architecture du Platform Baseline

## Intention

Le Platform Baseline est le socle de production obligatoire de chaque runtime Enistere. Il n'est ni
sélectionnable, ni supprimable, ni commercialisé comme capability. Un runtime incomplet peut être
`IMPLEMENTED` ou `BOOTABLE`, mais il n'est pas `CONFORMANT`.

## Implémentation exécutable

Le contrat v2 adopté par
[ADR-058](../adr/ADR-058-executable-platform-baseline-v2.md) est défini dans
`factory/conformance/contracts/platform-baseline.v2.json`. Les manifests le résolvent dans le pipeline et
`npm run factory:baseline-gap` recalcule l'écart des six runtimes. Le rapport courant ne déclare aucun
runtime conforme.

## Composants communs

```text
Platform Baseline
├── Configuration
├── Canonical Errors
├── Structured Logging
├── Correlation
├── Observability
├── Technical Audit
├── Security Baseline
├── Health
├── Diagnostics
├── Testing Foundation
├── Lifecycle Hooks
├── Extension Points
└── Build and Quality Gates
```

| Composant | Garantie |
|---|---|
| Configuration | schéma typé, validation au démarrage, séparation secrets/non-secrets |
| Canonical Errors | codes stables, mapping contrôlé, aucune fuite sensible |
| Structured Logging | JSON/structure, niveaux, redaction, contexte runtime |
| Correlation | identifiant propagé entre requêtes, tâches, messages, audit et traces |
| Observability | logs, métriques, traces, instrumentation et export OpenTelemetry |
| Technical Audit | preuve protégée des événements techniques/sécurité sensibles |
| Security Baseline | defaults sûrs, headers/transport, secrets, dépendances, moindre privilège |
| Health | diagnostic interne et signaux adaptés au mode de déploiement |
| Diagnostics | codes actionnables pour opérateurs, CLI et conformance |
| Testing Foundation | harness unit/contract/integration et fixtures de baseline |
| Lifecycle Hooks | pre/post generate, start, stop, migrate, verify, upgrade |
| Extension Points | ports stables où capabilities et domaines contribuent |
| Build/Quality Gates | build reproductible, lint/type checks, tests, security et provenance |

## Observability obligatoire

Le socle fournit :

- logs structurés corrélés et redacted ;
- métriques de requêtes, erreurs, latence, saturation et dépendances ;
- traces et propagation W3C lorsque le transport le permet ;
- instrumentation des requêtes, messages, jobs, erreurs et appels sortants ;
- health, readiness et liveness lorsqu'ils ont un sens ;
- hooks OpenTelemetry indépendants du backend ;
- contexte de déploiement, version et runtime ;
- intégration contrôlée aux outils d'exploitation.

Le backend de télémétrie reste une primitive configurable. L'absence d'un backend local ne supprime pas
l'instrumentation.

## Audit technique obligatoire

Le baseline enregistre au minimum, selon applicabilité :

- démarrage, arrêt et changement de version ;
- authentifications techniques et échecs de sécurité ;
- modifications de configuration et de secrets par référence, jamais leur valeur ;
- changements de permissions/policies ;
- opérations administratives et appels sensibles ;
- migrations, upgrades et actions lifecycle ;
- acteur, workload, horodatage, correlation/trace ID, résultat et contexte.

Les événements sont structurés, versionnés, redacted, protégés contre la modification et soumis à
rétention/accès explicites. Une panne du sink suit une policy définie : buffer, fail-closed pour opérations
critiques ou alerte ; jamais une perte silencieuse.

## Audit métier

Les domaines et capabilities déclarent :

- nom et version de l'événement ;
- déclencheur et résultat ;
- acteur et sujet métier ;
- niveau de sensibilité ;
- champs autorisés/interdits ;
- rétention et accès ;
- criticité et comportement en cas de panne.

Ils publient via un port du baseline. Le baseline ne décide pas qu'une commande, un paiement ou un contrat
doit être audité : cette règle appartient au domaine.

## Contrats par famille

### API Runtime Base

Ajoute HTTP, validation, OpenAPI, health/readiness, persistence/migration/transaction ports, graceful
shutdown et hooks Authentication, Authorization, Files et Events. Les adapters cibles sont NestJS, Spring
Boot et FastAPI.

### Web Runtime Base

Ajoute routing, client API, hooks session/access-control, error boundaries, forms, états partagés,
accessibilité, security headers, telemetry et E2E. Les adapters sont Next.js et Angular.

### Mobile Runtime Base

Ajoute navigation, client API, secure storage, hooks session, network state, error handling, permissions,
deep links, hooks offline/push, crash reporting et build Android/iOS. Les adapters sont React Native et
Flutter.

## Extension sans contamination

Une capability contribue uniquement via des ports déclarés :

```text
Capability
├── routes/UI/actions
├── contracts and permissions
├── migrations
├── telemetry instruments
└── business audit declarations
          │
          ▼
Baseline extension points
```

Elle ne remplace pas le logger, le contexte, le moteur d'audit, les erreurs ou les gates.

## Exploitation et modes

Le même contrat s'applique localement, en test, staging et production. Les providers et niveaux
d'échantillonnage peuvent varier, pas les interfaces ni les politiques de sécurité. Readiness/liveness sont
exigées seulement pour les runtimes long-lived déployés sur une plateforme qui les consomme.

## Versionnement

Le baseline possède une version commune et une version par contrat de famille. Une modification additive
est compatible ; un changement d'enveloppe, de port ou de sémantique exige migration, compatibilité
temporaire et mise à jour des suites.

## Conformité

Les suites vérifient comportements, pas noms de librairies. Une implémentation idiomatique est autorisée si
elle satisfait les mêmes entrées, sorties, erreurs, signaux, sécurité et scénarios de panne.
