# Prochaine action

## Mission achevée

React Native et Flutter sont les deux adapters Mobile conformes à
`common/2.0.0` et `mobile/2.0.0`
([ADR-064](../adr/ADR-064-mobile-runtime-v2-convergence.md)).

| Runtime | Conformes | Partiels | Manquants | Baseline v2 |
|---|---:|---:|---:|---|
| React Native | 25 | 0 | 0 | conforme |
| Flutter | 25 | 0 | 0 | conforme |

Preuves :

- configuration, erreurs, logs, corrélation W3C, observabilité, audit
  technique, diagnostics, lifecycle et extensions testés ;
- navigation, clients typés, secure storage, session, réseau, permissions,
  deep links, hooks offline/push, crash reporting et build testés ;
- React Native : typecheck, lint, 47 fichiers de tests, Expo Doctor 19/19 et
  export iOS ;
- Flutter : format, analyze, 9 tests et build APK debug ;
- goldens `nestjs-react-native-base` et `nestjs-flutter-base` : génération,
  installation, tests, build/export, audit gouverné et lock reproductible ;
- sept starters à source unique dans `starters/<runtime>`, sans dossier `base/`
  ni propriété `composition.baseSource` ;
- aucune implémentation Auth, Files ou Notifications dans les starters Mobile.

Le rapport structurel conserve `level: GENERATABLE`. Les suites et goldens
portent la preuve `CONFORMANT`, sans valoir test device, `PRODUCT_EQUIVALENT` ni
`PRODUCTION_READY`.

Source :
[`platform-baseline-v2-gap.json`](../../factory/conformance/reports/platform-baseline-v2-gap.json).

## Prochaine mission unique

> **Rendre les profils système canoniques `backend-service` et
> `product-platform` exécutables dans la CLI et le resolver, avec leurs six
> dimensions indépendantes, puis préparer `distributed-platform` sans déclarer
> `service-ecosystem` générable.**

### Justification de l’ordre

Les phases Runtime Contracts et convergence des sept runtimes sont complètes.
La phase 7 de la roadmap est Architecture Profiles ; elle précède le framework
de capabilities. Le dépôt possède déjà un modèle canonique et une décision
normative sur quatre profils, mais la CLI et certains registres conservent
encore un vocabulaire historique orienté combinaisons de starters.

### Critères de sortie

- la CLI demande d’abord le type de système, pas un framework ;
- les sorties canoniques sont uniquement `backend-service`,
  `product-platform`, `distributed-platform`, `service-ecosystem` ;
- les anciens noms restent des alias d’entrée versionnés, jamais des sorties ;
- client topology, backend style, deployment coupling, data ownership,
  communication et operations maturity restent des dimensions indépendantes ;
- `backend-service` et `product-platform` sont planifiables/générables avec
  goldens ;
- `distributed-platform` est représenté et refusé avec diagnostics là où le
  support manque ;
- `service-ecosystem` reste `TARGET`, sans support fictif ;
- aucun pipeline parallèle et aucune nouvelle capability.
