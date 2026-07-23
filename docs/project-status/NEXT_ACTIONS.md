# Prochaine action

## Action unique

**Étendre le Platform Contract exécutable à la famille Web (Next.js ↔ Angular)** : définir les invariants Web
communs, les mesurer via l'évaluateur de conformité, puis converger le minimal — sans encore modifier Auth,
RBAC ou Files.

Le Platform Contract **minimal de la famille API est complet** ([ADR-047](../adr/ADR-047-executable-platform-contract-api.md),
[ADR-048](../adr/ADR-048-canonical-api-error-contract.md), [ADR-049](../adr/ADR-049-api-observability-convergence.md)) :
NestJS↔Spring sont en parité mesurée sur `config-validated`, `error-canonical`, `correlation-id`, health,
`openapi`, `base-security` et `observability` (migrations = par composition). La suite de conformité et
`enistere.conformance.json` sont en place pour être étendus à une nouvelle famille.

La famille Web a ses propres invariants ([Platform Contract](../specifications/PLATFORM_CONTRACT.md) §Web :
routage, config publique/privée, client API généré, session, contrôle d'accès, états loading/error/empty,
error boundaries, accessibilité, observabilité, tests, build). Rappel audit : Angular est **base-only**
(auth/rbac/files `planned`) — la parité capabilities Web relève d'une étape ultérieure (roadmap Phase 3).

Périmètre (à cadrer en Phase A) :

1. invariants Web communs Next.js↔Angular dans l'évaluateur (`family: 'web'`) ;
2. mesure honnête (`enistere.conformance.json` Web) ;
3. convergence minimale des divergences porteuses.

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
