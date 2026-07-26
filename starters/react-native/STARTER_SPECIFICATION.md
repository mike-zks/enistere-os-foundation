# Spécification du runtime React Native

## 1. Portée normative

React Native est un adapter Mobile du Platform Baseline v2. Il implémente :

- `common/2.0.0` ;
- `mobile/2.0.0` ;
- `mobile-extension/2.0.0` pour ses points d’extension ;
- `telemetry-exporter/2.0.0` pour l’export d’observabilité.

Le rapport canonique doit rester à `25 COMPLIANT / 0 PARTIAL / 0 MISSING`.

## 2. Source unique

Le runtime complet réside à la racine `starters/react-native`. Un dossier
`base/`, une propriété `composition.baseSource` ou une seconde application
source sont interdits.

Les répertoires suivants sont réservés aux overlays et ne doivent pas exister
dans le starter :

```text
src/auth
src/upload
src/notifications
app/(public)
app/(app)
```

## 3. Contrat commun

Le runtime doit prouver :

1. validation de configuration et HTTPS en production ;
2. mapping d’erreur canonique ;
3. logs structurés avec redaction centrale ;
4. correlation ID et continuation W3C avec nouveau span ;
5. métriques, traces et exporter versionné ;
6. audit technique sans données sensibles ;
7. sécurité de transport et redaction ;
8. signal de santé mobile et diagnostics triés ;
9. fondation de tests ;
10. lifecycle idempotent, arrêt en ordre inverse ;
11. extensions versionnées et exclusives ;
12. typecheck, lint, doctor et build/export.

## 4. Contrat Mobile

Le runtime doit fournir navigation, client API typé, secure-storage port,
session hook neutre, état réseau, erreurs, permissions, deep links, offline
hook, push hook, crash reporting et build foundation.

Session, offline et push sont des points d’extension, pas des capabilities
activées. Le runtime ne demande aucune authentification, ne téléverse aucun
fichier et n’envoie ni ne planifie aucune notification.

## 5. Preuves

- `test/mobile-runtime-contract.test.ts` porte les preuves Common/Mobile v2 ;
- les suites spécialisées couvrent réseau, permissions, deep links, redaction
  et crash reporting ;
- `npm run typecheck`, `npm run lint`, `npm test`, `npm run doctor` et
  `npm run build` doivent réussir ;
- le golden `nestjs-react-native-base` doit générer, verrouiller, installer,
  tester et exporter l’application ;
- l’absence d’émulateur reste une limite déclarée, jamais transformée en faux
  succès.
