# Prochaine action

## Mission achevée

NestJS et Spring Boot satisfont désormais tous les invariants Common/API v2
([ADR-061](../adr/ADR-061-api-runtime-baseline-v2-conformance.md)).

| Runtime | Conformes | Partiels | Manquants/non conformes | Baseline v2 |
|---|---:|---:|---:|---|
| NestJS | 28 | 0 | 0 | conforme |
| Spring Boot | 28 | 0 | 0 | conforme |

Preuves :

- ports neutres de persistence et de transaction ;
- transactions Prisma et Spring testées sur succès et échec, avec rollback Spring observé ;
- configuration Spring typée et validée ;
- validation d’entrée Spring derrière un port neutre ;
- diagnostics déterministes et nettoyés des détails sensibles ;
- quality gates Maven explicites ;
- rapport calculé sans diagnostic pour les deux APIs ;
- tests comportementaux NestJS, Spring et Factory ;
- boot et contrat HTTP réels obligatoires sur les goldens `nestjs-base` et
  `spring-base` : health/live/ready, corrélation, W3C et sécurité.

Le rapport structurel conserve `level: GENERATABLE`. La conformité est promue par
l’exécution des suites normatives et du golden ; elle ne vaut ni
`PRODUCT_EQUIVALENT`, ni `PRODUCTION_READY`.

Source :
[`platform-baseline-v2-gap.json`](../../factory/conformance/reports/platform-baseline-v2-gap.json).

## Prochaine mission unique

> **Créer le runtime API FastAPI comme troisième adapter de référence, directement
> contre `common/2.0.0` et `api/2.0.0`, puis produire son rapport de conformité et
> son golden de boot/contrat HTTP — sans capability métier.**

### Justification de l’ordre

Le préalable imposé avant FastAPI est maintenant satisfait : les deux adapters
existants n’ont plus aucun écart Common/API v2 et la preuve de runtime est
exécutable. FastAPI peut donc implémenter un contrat stabilisé au lieu de devenir
une troisième variante à réconcilier.

### Critères de sortie

- une base FastAPI unique, idiomatique et sans capability implicite ;
- 28 invariants Common/API v2 évalués par le moteur existant ;
- configuration, erreurs, logs, correlation/W3C, observabilité, audit technique,
  sécurité, health, diagnostics, lifecycle, extensions et quality gates testés ;
- ports persistence/migration/transaction sans imposer un provider métier ;
- génération déterministe d’un `backend-service` FastAPI ;
- boot réel et même preuve HTTP que NestJS/Spring ;
- aucun support distribué, IA métier ou statut `PRODUCTION_READY` revendiqué.
