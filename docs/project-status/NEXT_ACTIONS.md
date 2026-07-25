# Prochaine action

## Mission achevée

NestJS et Spring Boot ont convergé sur les invariants prioritaires Common/API v2
([ADR-059](../adr/ADR-059-api-runtime-baseline-v2-convergence.md)).

Preuves :

- lifecycle explicite et arrêt gracieux testés ;
- registres `api-extension/2.0.0` pour Authentication, Authorization, Files et Events ;
- sécurité HTTP et CORS borné ;
- propagation W3C, métriques et hook `telemetry/2.0.0` ;
- mêmes assertions Common/API exécutées par le moteur de conformité ;
- aucun invariant `MISSING` pour les deux APIs.

## Écart calculé API

| Runtime | Conformes | Partiels | Manquants/non conformes | Conforme v2 |
|---|---:|---:|---:|---|
| NestJS | 26 | 2 | 0 | non |
| Spring Boot | 22 | 6 | 0 | non |

Écarts restants :

- NestJS : `diagnostics`, `transaction-ports` ;
- Spring Boot : `configuration`, `diagnostics`, `build-quality-gates`,
  `input-validation`, `persistence-ports`, `transaction-ports`.

Source :
[`platform-baseline-v2-gap.json`](../../factory/conformance/reports/platform-baseline-v2-gap.json).

## Prochaine mission unique

> **Achever la convergence NestJS/Spring Common/API v2 en supprimant les huit
> statuts `PARTIAL`, puis produire une preuve de boot et de contrat HTTP pour
> chaque runtime — sans ajouter FastAPI ni nouvelle capability.**

### Critères de sortie

- ports neutres persistence/transaction dans les deux APIs ;
- configuration Spring typée et validée ;
- validation d’entrée et diagnostics comportementaux communs ;
- quality gates Maven explicites ;
- aucun invariant Common/API `PARTIAL` ou `MISSING` ;
- boot contrôlé et contrat HTTP prouvés pour NestJS et Spring ;
- statut maximal accordé par preuve, sans revendiquer `PRODUCTION_READY`.
