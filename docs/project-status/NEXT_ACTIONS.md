# Prochaine action

## Mission achevée

FastAPI est le troisième adapter API de référence
([ADR-062](../adr/ADR-062-fastapi-runtime-adapter.md)).

| Runtime | Conformes | Partiels | Manquants/non conformes | Baseline v2 |
|---|---:|---:|---:|---|
| NestJS | 28 | 0 | 0 | conforme |
| Spring Boot | 28 | 0 | 0 | conforme |
| FastAPI | 28 | 0 | 0 | conforme |

Preuves FastAPI :

- base modulaire unique, sans capability ni service IA implicite ;
- configuration et erreurs canoniques testées ;
- logs, corrélation, W3C, métriques et hook OpenTelemetry versionné ;
- audit technique, sécurité, diagnostics, lifecycle et extensions testés ;
- ports neutres de persistence, migration et transaction ;
- arbre Python transitif verrouillé ;
- Ruff, 12 tests pytest et compilation ;
- golden `fastapi-base` : génération, installation, audit, déterminisme, boot
  Uvicorn et contrat HTTP réel ;
- rapport structurel calculé sans diagnostic.

Le rapport conserve `level: GENERATABLE` parce qu'il s'agit du niveau de la
preuve structurelle. L'exécution normative et le golden portent la preuve
`CONFORMANT`, sans valoir `PRODUCT_EQUIVALENT` ni `PRODUCTION_READY`.

Source :
[`platform-baseline-v2-gap.json`](../../factory/conformance/reports/platform-baseline-v2-gap.json).

## Prochaine mission unique

> **Converger Next.js et Angular contre `common/2.0.0` et `web/2.0.0`, fermer
> leurs écarts par des preuves comportementales et rendre leurs goldens de base
> conformes — sans implémenter de capability.**

### Justification de l'ordre

La phase API est complète sur les trois runtimes cibles. La roadmap place ensuite
la convergence Web avant Mobile, profils distribués et capabilities. Le scan réel
montre encore :

| Runtime | Conformes | Partiels | Manquants/non conformes |
|---|---:|---:|---:|
| Next.js | 14 | 4 | 6 |
| Angular | 7 | 10 | 7 |

Ajouter une capability Web maintenant consoliderait des écarts de corrélation,
observabilité, audit technique, lifecycle, sécurité, contrats clients et E2E.

### Critères de sortie

- même Common/Web v2, implémenté idiomatiquement dans les deux frameworks ;
- aucun invariant `PARTIAL` ou `MISSING` dans le rapport calculé ;
- configuration, erreurs, logs, correlation, observabilité, audit technique,
  sécurité, diagnostics, lifecycle et extensions prouvés ;
- routing, client typé, session/access hooks, error boundaries, forms, états UI,
  accessibilité, security headers, télémétrie et E2E prouvés ;
- goldens `nestjs-next-base` et `nestjs-angular-base` avec preuve de démarrage ;
- aucune capability, nouvelle topologie ou parité produit revendiquée.
