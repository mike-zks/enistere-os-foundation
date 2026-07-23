# Prochaine action

## Action unique

**Converger le socle Flutter vers la parité React Native** : compléter la base Flutter avec ses features de
contrat de base présentes dans le full `lib/src/core/api` (client Dio, error/logging interceptors,
`app_api_error`), en excluant l'auth (refresh interceptor) — sans encore modifier Auth, RBAC ou Files.

La **mesure Mobile est livrée** ([ADR-052](../adr/ADR-052-mobile-platform-contract-measurement.md)) :
l'évaluateur `factory/conformance/` couvre les **3 familles** (API + Web + Mobile). La baseline **calculée**
montre React Native `compliant` sur tout le contrat de base, et un Flutter **base-only** honnêtement non
conforme sur `typed-api-access`, `error-handling`, `observability` (pas de `core/api` au socle) — analogue à
l'Angular avant convergence.

Périmètre (à cadrer en Phase A) :

1. extraire du full `lib/src/core/api` les features de contrat de base (dio_client, error_interceptor,
   logging_interceptor, app_api_error) vers la composition base Flutter, câblées dans le provider Dio ;
2. re-mesurer (`enistere.conformance.json` Mobile) ; golden `nestjs-flutter-base` (flutter analyze/test) vert ;
3. parité des contrats **générés** + capabilities Mobile (Phase 3) restent différées.

Après cette convergence, **les 6 runtimes auront la parité de contrat de base** (convergence runtime,
roadmap Phase 2, mesurable). Dette suivie : contrats générés Angular/Flutter (`@enistere/api-contracts`), a11y.

## Cadrage gouvernance

Selon [`ARCHITECTURE_GOVERNANCE.md`](../governance/ARCHITECTURE_GOVERNANCE.md) et la
[Definition of Ready](../governance/DEFINITION_OF_READY.md), commencer par une analyse directe du dépôt après
merge (ne pas supposer les contrats Web suffisants), et aucune readiness sans preuve exécutable
([Definition of Done](../governance/DEFINITION_OF_DONE.md)).

## Dette suivie — missions d'upgrade dédiées

Deux advisories CVE-2026 sans correctif upstream sont couvertes par des exceptions documentées
(`factory/quality/audit-exceptions.json`, échéance 2026-10-31, revue forcée par le gate `audit-check`).
Elles se lèvent **hors du chemin critique** de l'action ci-dessus, chacune selon
[`DEPENDENCY_POLICY.md`](../governance/DEPENDENCY_POLICY.md) (matrice de compatibilité, tests, preuve golden) :

1. **Upgrade Next** — jusqu'à un Next promouvant `sharp` ≥ 0.35.0 → lève les exceptions `sharp` / `next` ;
2. **Upgrade Angular CLI** — jusqu'à ce que la chaîne `@angular/cli` → `@modelcontextprotocol/sdk` tire
   `@hono/node-server` ≥ 2.0.5 → lève la chaîne hono.

## Interdictions temporaires

- nouvelle capability ;
- nouveau runtime ;
- nouvelle topologie ;
- promotion de profil ;
- extension du Domain Compiler ;
- microservices.
