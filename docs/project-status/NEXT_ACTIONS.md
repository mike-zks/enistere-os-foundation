# Prochaine action

## Action unique

**Converger les logs structurés + l'observabilité minimale de la famille API** (Spring vers la parité NestJS),
pour compléter le Platform Contract API — sans encore modifier Auth, RBAC ou Files.

Le contrat d'erreur canonique est tranché et convergé ([ADR-048](../adr/ADR-048-canonical-api-error-contract.md)) :
l'enveloppe plate `ApiErrorResponse` est le contrat canonique, Spring l'émet désormais (avec `requestId`), et
`enistere.conformance.json` montre `error-canonical` + `correlation-id` + health **compliant des deux côtés**.
Il reste, dans la matrice de conformité API, un invariant `MISSING` des deux côtés : **observabilité
(logs structurés, metrics, tracing)**. C'est le dernier levier de parité de la famille API avant l'extension
aux familles Web et Mobile.

Périmètre :

1. logs structurés (JSON, corrélés au `requestId`) côté Spring, à parité avec le module NestJS `common/logging` ;
2. observabilité minimale (metrics/health détaillé) exposée de façon équivalente ;
3. extension de l'évaluateur de conformité à l'invariant `observability`.

## Cadrage gouvernance

Selon [`ARCHITECTURE_GOVERNANCE.md`](../governance/ARCHITECTURE_GOVERNANCE.md) et la
[Definition of Ready](../governance/DEFINITION_OF_READY.md), commencer par une analyse directe du dépôt après
merge, et aucune readiness sans preuve exécutable ([Definition of Done](../governance/DEFINITION_OF_DONE.md)).

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
