# Prochaine action

## Action unique

**Converger le socle Web (Angular) vers la parité Next.js** sur les divergences porteuses mesurées — sans
encore modifier Auth, RBAC ou Files.

La **mesure Web est livrée** ([ADR-050](../adr/ADR-050-web-platform-contract-measurement.md)) : l'évaluateur
`factory/conformance/` est multi-familles et `enistere.conformance.json` couvre API + Web. La baseline
**calculée** montre un Angular **base-only** honnêtement non conforme sur : **client API généré**
(`@enistere/api-client-fetch` absent), **error-boundary** (global ErrorHandler), **états** (loading/error/empty),
**accessibilité**, config publique/privée (partielle) — Next.js étant largement conforme.

Périmètre (à cadrer en Phase A) :

1. converger le socle Angular sur les cibles tractables (client généré, error-boundary/ErrorHandler, états,
   config publique/privée) à parité avec Next.js ;
2. re-mesurer (`enistere.conformance.json` Web) pour prouver la parité de base ;
3. observabilité Web et parité capabilities Web (auth/rbac/files) restent différées (roadmap Phase 3).

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
