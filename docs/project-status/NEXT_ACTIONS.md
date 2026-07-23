# Prochaine action

## Action unique

**Trancher et converger le contrat d'erreur canonique de la famille API** (Problem Details RFC 7807 vs
enveloppe plate NestJS), sans encore modifier Auth, RBAC ou Files.

Le Platform Contract minimal exécutable est livré ([ADR-047](../adr/ADR-047-executable-platform-contract-api.md)) :
une suite de conformité calcule `enistere.conformance.json` par composition, et le socle Spring a convergé
avec NestJS sur `correlation-id` + health liveness/readiness. L'audit Phase A a révélé que **ni NestJS ni
Spring n'émettent** le Problem Details exigé par la spec (NestJS suit une enveloppe plate d'une doc défunte
`strategy/08_STANDARDS.md`) : la forme d'erreur est aujourd'hui **mesurée non conforme des deux côtés** et sa
convergence a été explicitement différée. C'est le prochain levier de parité API.

Périmètre :

1. ADR actant la forme d'erreur canonique (Problem Details vs enveloppe plate) ;
2. convergence NestJS **et** Spring sur cette forme, avec test de contrat côté `@enistere/api-client-fetch` ;
3. nettoyage des références à la doc défunte `strategy/08_STANDARDS.md` (re-homing dans `PLATFORM_CONTRACT`).

## Cadrage gouvernance

Cette étape modifie un **contrat consommé par les clients** (Web/Mobile, flux auth). Selon
[`ARCHITECTURE_GOVERNANCE.md`](../governance/ARCHITECTURE_GOVERNANCE.md) et la
[Definition of Ready](../governance/DEFINITION_OF_READY.md), **avant toute implémentation** :

- produire l'ADR actant la forme d'erreur (prochain numéro libre : **ADR-048**) ;
- déclarer l'impact de migration sur les clients générés et les flux auth ;
- aucune readiness sans preuve exécutable ([Definition of Done](../governance/DEFINITION_OF_DONE.md)).

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
