# Prochaine action

## Mission achevée

Next.js et Angular sont les deux adapters Web conformes à `common/2.0.0` et
`web/2.0.0` ([ADR-063](../adr/ADR-063-web-runtime-v2-convergence.md)).

| Runtime | Conformes | Partiels | Manquants/non conformes | Baseline v2 |
|---|---:|---:|---:|---|
| Next.js | 24 | 0 | 0 | conforme |
| Angular | 24 | 0 | 0 | conforme |

Preuves :

- configuration, erreurs, logs, corrélation W3C, observabilité, audit technique,
  diagnostics, lifecycle et extensions versionnées testés ;
- routing, clients typés, formulaires, états UI, accessibilité, télémétrie et
  sécurité testés idiomatiquement ;
- Next.js : typecheck, lint, 22 suites de tests, build et E2E ;
- Angular : 108 tests, build production et E2E sur processus démarré ;
- goldens `nestjs-next-base` et `nestjs-angular-base` : génération, installation,
  démarrage Web, audit gouverné et lock reproductible ;
- sept starters à source unique dans `starters/<runtime>`, sans dossier `base/`
  ni propriété `composition.baseSource`.

Le rapport structurel conserve `level: GENERATABLE`. Les suites normatives et
les goldens portent la preuve `CONFORMANT`, sans valoir `PRODUCT_EQUIVALENT` ni
`PRODUCTION_READY`.

Source :
[`platform-baseline-v2-gap.json`](../../factory/conformance/reports/platform-baseline-v2-gap.json).

## Prochaine mission unique

> **Converger React Native et Flutter contre `common/2.0.0` et `mobile/2.0.0`,
> fermer leurs écarts par des preuves comportementales et rendre leurs goldens
> de base conformes — sans implémenter de capability.**

### Justification de l’ordre

Les trois runtimes API et les deux runtimes Web sont conformes. La roadmap place
Mobile avant les profils distribués et le framework de capabilities. Le scan
réel conserve :

| Runtime | Conformes | Partiels | Manquants/non conformes |
|---|---:|---:|---:|
| React Native | 15 | 7 | 3 |
| Flutter | 6 | 6 | 13 |

Flutter a été aplati en source unique et débarrassé des flux Auth/Files
embarqués, mais cet assainissement structurel n’est pas une convergence.
React Native conserve également des surfaces optionnelles à extraire. Ajouter
une capability maintenant figerait ces divergences.

### Critères de sortie

- même Common/Mobile v2, implémenté idiomatiquement dans les deux frameworks ;
- aucun invariant `PARTIAL` ou `MISSING` dans le rapport calculé ;
- aucun flux Authentication, Authorization, Files ou Notifications dans les
  bases ;
- configuration, erreurs, logs, corrélation, observabilité, audit technique,
  sécurité, diagnostics, lifecycle et extensions prouvés ;
- navigation, client API, secure storage, session/access hooks, état réseau,
  permissions, deep links, offline/push hooks, crash reporting et build
  foundation prouvés ;
- goldens React Native et Flutter reproductibles, avec limites d’émulateur
  déclarées honnêtement ;
- aucune nouvelle capability, topologie ou parité produit revendiquée.
