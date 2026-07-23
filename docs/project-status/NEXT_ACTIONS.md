# Prochaine action

## Action unique

**Étendre le Platform Contract exécutable à la famille Mobile (React Native ↔ Flutter)** : définir les
invariants Mobile de base, étendre l'évaluateur à `family: 'mobile'`, mesurer — sans convergence encore
(mesure d'abord, comme le Web).

Les familles **API** (complète) et **Web** (socle en parité) sont couvertes : le Platform Contract API est
complet (ADR-047/048/049) et le socle Web Angular a convergé **idiomatiquement** vers Next.js
([ADR-051](../adr/ADR-051-web-angular-base-convergence.md)) — `enistere.conformance.json` montre Angular base
`compliant` sur typed-config/typed-api-access/ui-states/error-handling/observability (a11y `partial`). Reste la
famille Mobile : React Native et Flutter, avec Flutter **base-only** (comme Angular l'était) — la mesure
honnête doit précéder la convergence.

Périmètre (à cadrer en Phase A) :

1. invariants Mobile de base ([Platform Contract](../specifications/PLATFORM_CONTRACT.md) §Mobile : navigation,
   config par environnement, secure storage, client API, réseau/erreurs, observabilité, tests, build) hors
   concerns de capability ;
2. `evaluateMobileApp` (React Native, Flutter) + `enistere.conformance.json` `family: 'mobile'` ;
3. mesure honnête, sans convergence.

Dette suivie (ADR-051) : parité des contrats **générés** Angular (`@enistere/api-contracts`) et
approfondissement a11y.

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
