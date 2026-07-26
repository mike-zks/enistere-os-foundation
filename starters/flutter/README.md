# Runtime Flutter

Runtime Mobile Flutter conforme à `common/2.0.0` et `mobile/2.0.0`, matérialisé
directement à la racine `starters/flutter`.

## Statut prouvé

| Portée | Conformes | Partiels | Manquants |
|---|---:|---:|---:|
| Common + Mobile v2 | 25 | 0 | 0 |

Le niveau structurel calculé reste `GENERATABLE`. Les tests comportementaux,
l’analyse, le build APK et le golden généré portent la preuve `CONFORMANT`.
Aucun démarrage sur émulateur ou appareil n’est revendiqué.

## Composition

- aucun sous-dossier `base/` ;
- aucune propriété `composition.baseSource` ;
- aucune implémentation Authentication, Authorization, Files ou Notifications ;
- session, offline, push et crash reporting sont des hooks neutres et versionnés.

Le runtime fournit configuration et transport sûrs, erreurs canoniques, logs,
corrélation W3C, observabilité, audit technique, diagnostics, lifecycle,
extensions, navigation, client typé, secure-storage port, état réseau,
permissions, deep links et fondation Android.

## Commandes

```bash
flutter pub get
flutter analyze
flutter test
flutter build apk --debug
```

La spécification locale
[`STARTER_SPECIFICATION.md`](./STARTER_SPECIFICATION.md) décrit les limites
actuelles et les exigences de convergence.
