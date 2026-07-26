# ADR-064 — Convergence Common/Mobile v2 et runtimes sans capability

- Statut : accepté
- Date : 2026-07-26
- Décideurs : Enistere OS Foundation

## Contexte

Après ADR-063, les familles API et Web étaient conformes au Platform Baseline
v2, mais React Native restait à `15/7/3` et Flutter à `6/6/13`. L’évaluateur
Mobile acceptait plusieurs indices purement structurels : un query client
valait client typé partiel, un dossier Notifications valait push hook partiel et
certains placeholders étaient comptés sans preuve comportementale.

React Native contenait en outre un moteur complet de notifications locales.
Cette surface contredisait la règle : une capability reste optionnelle et un
runtime ne fournit que des hooks neutres.

La source unique décidée par ADR-063 reste un invariant : aucun runtime ne doit
réintroduire un sous-dossier `base/` ou `composition.baseSource`.

## Décision

React Native et Flutter implémentent les mêmes contrats :

```text
common/2.0.0
mobile/2.0.0
mobile-extension/2.0.0
telemetry-exporter/2.0.0
```

Chaque adapter fournit idiomatiquement :

- configuration validée et HTTPS obligatoire en production ;
- erreur mobile canonique ;
- logs structurés, redaction et corrélation W3C ;
- métriques/traces avec exporter versionné ;
- audit technique ;
- diagnostics et signal de santé mobile ;
- lifecycle idempotent ;
- registre d’extensions versionné et exclusif ;
- navigation, client API typé, secure storage, session hook, état réseau,
  permissions, deep links, offline/push hooks, crash reporting et build.

Les hooks session, offline, push et crash reporting ne réalisent aucun flux
métier. Ils sont anonymes ou désactivés jusqu’à composition explicite.

Le moteur de notifications locales et son modèle sont retirés de React Native.
Authentication, Authorization, Files et Notifications ne peuvent apparaître
dans un runtime source que via un overlay matérialisé dans un projet dérivé.

Les sept starters restent directement sous `starters/<runtime>`. Un dossier
`base/` et `composition.baseSource` sont interdits.

## Conformité

L’évaluateur exige désormais le contrat et une preuve comportementale ; le nom
d’un fichier ou l’existence d’un placeholder ne suffit plus.

| Runtime | Conformes | Partiels | Manquants |
|---|---:|---:|---:|
| React Native | 25 | 0 | 0 |
| Flutter | 25 | 0 | 0 |

Preuves :

- React Native : typecheck, lint, 47 fichiers de tests directs, Expo Doctor
  19/19 et export iOS ;
- Flutter : format, analyze, 9 tests et build APK debug ;
- goldens `nestjs-react-native-base` et `nestjs-flutter-base` : génération,
  installation, tests, build/export, audit gouverné et lock reproductible ;
- fitness function : refus des dossiers `base/`, de `baseSource` et des racines
  Auth/Files/Notifications embarquées dans les starters Mobile.

Le rapport structurel conserve `GENERATABLE`. Les suites et goldens portent la
preuve `CONFORMANT`, sans test device, `PRODUCT_EQUIVALENT` ni
`PRODUCTION_READY`.

## Conséquences

- Les sept runtimes cibles satisfont désormais leur contrat Common + famille v2.
- Une régression Mobile produit un diagnostic calculé et bloque la quality gate.
- Un projet dérivé doit fournir explicitement les adapters natifs requis.
- Les anciens documents React Native décrivant une application Auth/Files ou un
  moteur Notifications dans le starter ne sont plus normatifs.

## Prochaine mission unique

Implémenter les quatre profils système canoniques dans la CLI et le resolver :
`backend-service`, `product-platform`, `distributed-platform` et
`service-ecosystem`, avec les six dimensions indépendantes, en commençant par
les deux profils matérialisables sans créer de pipeline parallèle.
