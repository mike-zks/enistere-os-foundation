# ADR-061 — Conformité Platform Baseline v2 des runtimes API de référence

- Statut : accepté
- Date : 2026-07-25
- Décideurs : Enistere OS Foundation
- Complète : ADR-058, ADR-059

## Décision

NestJS et Spring Boot satisfont les 28 invariants applicables des contrats
`common/2.0.0` et `api/2.0.0`. La conformité repose sur deux preuves séparées :

1. le rapport structurel ne contient plus aucun invariant `PARTIAL` ou `MISSING`
   pour ces runtimes ;
2. les quality gates exécutent les tests comportementaux et démarrent les deux
   goldens API pour vérifier leur contrat HTTP réel.

Le niveau `GENERATABLE` conservé dans le rapport de scan décrit la nature de ce
rapport, pas une rétrogradation des preuves exécutées. Les statuts ne sont pas
automatiquement cumulatifs.

## Contexte

ADR-059 avait supprimé tous les invariants manquants, mais laissait huit écarts :

- NestJS : diagnostics et transaction ports ;
- Spring Boot : configuration, diagnostics, quality gates, validation d’entrée,
  persistence ports et transaction ports.

Une simple présence de framework, de fichier Maven ou de client ORM ne suffisait
pas à fermer ces écarts.

## Choix

- ports de persistence et de transaction neutres vis-à-vis des frameworks ;
- adapters transactionnels testés sur succès et échec, avec rollback Spring observé ;
- configuration Spring typée et validée au démarrage ;
- validation Jakarta exposée derrière un port neutre et des erreurs bornées ;
- registres de diagnostics déterministes et nettoyés des détails sensibles ;
- Enforcer Java/Maven et Surefire avec échec en absence de tests ;
- même évaluateur Common/API v2, sans pipeline parallèle ;
- boot réel des goldens `nestjs-base` et `spring-base` en CI ;
- contrat HTTP vérifié sur `/health`, `/health/live` et `/health/ready` :
  états attendus, corrélation, continuation W3C et en-tête de sécurité.

## Conséquences

- NestJS et Spring obtiennent chacun `28 COMPLIANT / 0 PARTIAL / 0 MISSING` ;
- une régression de port, de test ou de quality gate réouvre l’écart ;
- l’ajout de FastAPI peut désormais cibler un contrat API stabilisé ;
- aucun exporter OpenTelemetry, backend de télémétrie, capability ou statut
  `PRODUCT_EQUIVALENT`/`PRODUCTION_READY` n’est implicite.

## Risques

- le scan reconnaît la présence conjointe d’une implémentation et de son test ;
  seule l’exécution des quality gates constitue le reçu comportemental ;
- les preuves HTTP couvrent le baseline, pas les capacités métier optionnelles ;
- les ports génériques doivent rester spécialisés par les domaines et ne pas
  devenir un repository universel.

## Tests et preuves

- `npm run lint`, `npm run build` et 53 tests NestJS ;
- `./mvnw verify` et 21 tests Spring ;
- `npm run factory:test` ;
- `factory/conformance/reports/platform-baseline-v2-gap.json` ;
- workflow `Factory Golden Runtime`, compositions `nestjs-base` et
  `spring-base`, avec `GOLDEN_RUNTIME_START=1`.

## Rollback

Le retrait d’un port, d’un adapter, d’un test ou d’un gate fait échouer le moteur
de conformité. Le rollback fonctionnel consiste à revenir à ADR-059 et à
réintroduire explicitement les statuts partiels ; aucune donnée n’est migrée.
