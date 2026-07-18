# Mobile RN30 — iOS Runtime Smoke Parity Report

Date : 2026-06-17  
Core : `starters/react-native`
Statut : **STARTER_IOS_SMOKE_BLOCKED_BY_ENVIRONMENT**

## Objectif

RN30 devait vérifier la parité runtime iOS du starter Expo
public/protégé/settings, en rejouant le parcours déjà validé côté Android par
RN28 et RN29, sans backend réel, sans dépendance nouvelle, sans SDK/adaptateur
natif réel et sans logique métier.

## Résultat iOS

L'exécution runtime iOS réelle est **bloquée par l'environnement local**.

- Hôte : `Linux greenovate 7.0.10-201.fc44.x86_64`
- `xcrun` : absent (`command not found`)
- iOS Simulator : non interrogeable (`xcrun simctl list devices` impossible)
- Device iOS Expo Go : non disponible depuis cet environnement

Conclusion : aucun smoke iOS réel n'a été exécuté et aucune preuve iOS
artificielle n'est créée.

## Script ajouté

- Commande : `npm run smoke:ios`
- Fichier : `starters/react-native/scripts/smoke-ios.js`
- Outils utilisés : Node stdlib uniquement, puis préflight `npx`, `xcrun`,
  `simctl` si l'hôte est macOS
- Rapport JSON par défaut :
  `/tmp/enistere-mobile-rn30-ios-smoke-report.json`

Résultat local RN30 :

```txt
status: blocked
blocker: iOS Simulator runtime requires macOS/Xcode.
detectedPlatform: linux
expectedPlatform: darwin
```

## Procédure iOS prête à exécuter

Sur un hôte macOS avec Xcode command line tools et un iOS Simulator ou device
iOS avec Expo Go :

```bash
cd starters/react-native
npm install
npm run smoke:ios
npx expo start --ios --localhost -c
```

Puis rejouer manuellement le parcours starter, avec mock auth local temporaire
et sans backend réel :

1. écran public sign-in ;
2. sign-in via mock auth local ;
3. Home protégé ;
4. navigation Home → Settings ;
5. scroll Settings jusqu'aux diagnostics fondation ;
6. retour Settings → Home ;
7. refresh session ;
8. sign out vers l'écran public.

À reporter après exécution iOS réelle :

- hôte macOS et version Xcode ;
- simulateur/device utilisé ;
- Expo target utilisé ;
- résultat du parcours ;
- défauts visuels/runtime éventuels ;
- rapport `npm run smoke:ios`.

## Preuves Android conservées

- RN28 : smoke visuel réel Android Emulator `Pixel_6a` via Expo Go.
- RN29 : smoke Android local semi-automatisé `npm run smoke:android`, rapport
  `passed` sur `emulator-5554`.

RN30 ne dégrade pas ces preuves ; il documente uniquement le manque de runtime
iOS disponible dans l'environnement courant.

## Hors périmètre confirmé

- Aucun backend réel.
- Aucun endpoint métier.
- Aucun SDK/adaptateur natif réel.
- Aucune dépendance ajoutée.
- Aucune persistance nouvelle.
- Aucun retry branché.
- Aucun secret ou token réel.
- Aucun changement AuthEngine, `withAuthRetry`, `authedRequest`, QueryClient ou
  mutations.
- Aucun Detox, Maestro, Appium, Playwright mobile ou XCTest custom.

## Vérifications RN30

- `npm run typecheck`
- `npm run lint`
- `npm test`
- `npm run doctor`
- `npx expo export -p ios`
- `npm run smoke:ios` → `blocked` documenté
- `npm audit`
- `git diff --check`

## Prochaine mission recommandée

**Mobile Core React Native 31 — exécution iOS smoke sur macOS/device réel** :
rejouer le parcours RN28/RN29 sur iOS Simulator ou device physique dès qu'un
environnement macOS/Xcode est disponible, sans ajouter de dépendance ni logique
métier.
