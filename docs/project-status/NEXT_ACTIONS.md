# Prochaine action

## Action unique

**Rendre exécutable le Platform Contract minimal de la famille API sur le pipeline canonique unique** —
sans encore modifier les fonctionnalités Auth, RBAC ou Files.

Le pipeline canonique unique est livré ([ADR-046](../adr/ADR-046-single-canonical-factory-pipeline.md)) :
blueprint → CSM → ResolvedSystem → Plan → génération, le blueprint n'étant plus lu après ingestion.
L'étape suivante rend la conformité **mesurable** sur la famille API, en consommant ce pipeline.

C'est le levier le plus fort : deux adapters API (NestJS, Spring) existent déjà et bootent ; les rendre
**prouvablement conformes et équivalents** débloque toute la stratégie de parité (voir
[`docs/audits/`](../audits/README.md)).

Périmètre :

1. suite Platform Contract exécutable pour la catégorie API, **consommant le CSM**
   ([Platform Contract](../specifications/PLATFORM_CONTRACT.md)) ;
2. premiers tests de parité observable NestJS↔Spring ;
3. émission de `enistere.conformance.json`.

## Cadrage gouvernance

Cette étape introduit un **nouveau standard de contrat** (Platform Contract exécutable). Selon
[`ARCHITECTURE_GOVERNANCE.md`](../governance/ARCHITECTURE_GOVERNANCE.md) et la
[Definition of Ready](../governance/DEFINITION_OF_READY.md), **avant toute implémentation** :

- produire l'ADR actant le standard (prochain numéro libre : **ADR-047**) ;
- écrire la spécification et les critères de conformité (spécification avant implémentation) ;
- déclarer targets, dépendances, conflits et migration ;
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
