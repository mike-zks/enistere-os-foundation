# Prochaine action

## Action unique

**Jalon atteint : les 6 runtimes ont la parité de contrat de base, mesurée.** Le socle Flutter a convergé
([ADR-053](../adr/ADR-053-flutter-base-convergence.md)) — `enistere.conformance.json` montre Flutter base
`compliant` sur les 8 invariants Mobile. La **convergence runtime de base** (roadmap Phase 2) est donc couverte
et mesurée pour NestJS, Spring, Next.js, Angular, React Native et Flutter.

**Prochaine action unique : parité des contrats GÉNÉRÉS (Angular + Flutter)** — faire consommer aux clients
Angular et Flutter les types dérivés du contrat canonique (`@enistere/api-contracts` / génération polyglotte,
[`CONTRACT_ARCHITECTURE`](../architecture/CONTRACT_ARCHITECTURE.md)) au lieu de types écrits à la main, comme
Next.js consomme déjà `@enistere/api-client-fetch`. C'est le dernier écart de contrat de base avant la parité
**produit** (product-equivalence) et l'audit le classe P0 (« génération Java/Dart absente »).

Point de pilotage : c'est un **checkpoint majeur**. Alternatives légitimes selon la priorité de l'owner :
convergence des contrats générés (ci-dessus) ; OU parité capabilities Web/Mobile (auth/rbac/files sur
Angular/Flutter, roadmap Phase 3) ; OU pause de consolidation (rapport de readiness global du Platform Contract).

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
