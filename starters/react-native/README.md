# Runtime React Native

Runtime Mobile Expo/React Native conforme à `common/2.0.0` et
`mobile/2.0.0`.

## Statut prouvé

| Portée | Conformes | Partiels | Manquants |
|---|---:|---:|---:|
| Common + Mobile v2 | 25 | 0 | 0 |

Le niveau structurel calculé reste `GENERATABLE`. Les tests comportementaux,
Expo Doctor et le golden généré avec export iOS portent la preuve
`CONFORMANT`. Aucun démarrage sur simulateur ou appareil n’est revendiqué.

## Composition

Le projet est matérialisé directement dans `starters/react-native`.

- aucun sous-dossier `base/` ;
- aucune propriété `composition.baseSource` ;
- aucune implémentation Authentication, Authorization, Files ou Notifications ;
- les capabilities sont ajoutées uniquement par les overlays de la Factory ;
- les hooks session, offline et push sont neutres, versionnés et désactivés par
  défaut.

## Contrats

Le runtime fournit :

- configuration publique typée avec HTTPS obligatoire en production ;
- erreurs mobiles canoniques ;
- logs structurés et redaction centrale ;
- correlation ID et propagation W3C `traceparent` ;
- télémétrie avec exporter versionné ;
- audit technique ;
- diagnostics, lifecycle et registre d’extensions ;
- Expo Router, client API typé, secure-storage port, état réseau, permissions,
  deep links, hooks offline/push et crash reporting ;
- build, lint, tests, Expo Doctor et export iOS.

Les ports ne livrent aucun fournisseur métier implicite. Un projet dérivé doit
composer explicitement les adapters natifs et capabilities requis.

## Commandes

```bash
npm ci
npm run typecheck
npm run lint
npm test
npm run doctor
npm run build
```

`npm run build` réalise un export iOS sans simulateur. Les scripts
`smoke:android` et `smoke:ios` exigent un environnement device adapté et ne font
pas partie de la preuve headless.

Voir [STARTER_SPECIFICATION.md](./STARTER_SPECIFICATION.md) et
[ARCHITECTURE.md](./ARCHITECTURE.md).
