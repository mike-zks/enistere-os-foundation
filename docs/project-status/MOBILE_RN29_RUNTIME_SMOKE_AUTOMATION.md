# Mobile RN29 — Runtime Smoke Automation Report

Date : 2026-06-16  
Core : `cores/mobile-react-native`  
Statut : **STARTER_SMOKE_AUTOMATION_READY**

## Objectif

RN29 formalise un smoke runtime local reproductible pour le starter Expo
public/protégé/settings, sans backend réel, sans dépendance nouvelle, sans SDK ou
adaptateur natif réel et sans logique métier.

## Script ajouté

- Commande : `npm run smoke:android`
- Fichier : `cores/mobile-react-native/scripts/smoke-android.js`
- Outils utilisés : Node stdlib, `adb`, Expo CLI via `npx`
- Rapport JSON par défaut :
  `/tmp/enistere-mobile-rn29-smoke-report.json`

Le script émet des événements JSON ligne par ligne et termine avec un statut :

- `passed` : parcours complet rejoué.
- `failed` : défaut runtime/applicatif pendant le parcours.
- `blocked` : environnement local insuffisant (`adb`, `npx`, device absent,
  port mock indisponible, Expo non prêt).

## Ce qui est automatisé

- Préflight `adb version`, `npx --version`, `adb devices -l`.
- Démarrage d'un mock auth local temporaire sur `127.0.0.1:3000`.
- `adb reverse tcp:3000 tcp:3000` pour éviter tout backend réel.
- Démarrage Expo Android via `npx expo start --android --localhost -c`.
- Attente explicite du signal Metro prêt avant interaction UI.
- Interaction par labels visibles Android (`uiautomator` + tap sur bounds), pas
  par coordonnées fragiles.
- Parcours : sign-in public, Home protégé, Settings protégé, scroll jusqu'aux
  diagnostics fondation, retour Home, refresh session, sign out.
- Nettoyage : arrêt Expo, fermeture du mock local, suppression du reverse adb.

## Résultat Android

Environnement local disponible :

- Device : Android Emulator `emulator-5554`
- Expo Go : disponible sur l'émulateur
- Commande : `npm run smoke:android`
- Résultat : **passed**
- Requêtes mock observées : `POST /auth/login` = 1, `POST /auth/refresh` = 1

Rapport structuré généré :

```txt
/tmp/enistere-mobile-rn29-smoke-report.json
status: passed
```

## Limites

- Ce smoke est **semi-automatisé** : il vérifie le parcours starter via le rendu
  Android réel et les labels visibles, mais ne fournit pas les garanties d'un
  framework E2E mobile complet.
- Il dépend d'un émulateur/device connecté avec Expo Go et d'un environnement
  capable d'utiliser `adb`.
- Il ne couvre pas iOS Simulator/macOS, device physique, captures CI, ni les
  états `expired` manipulés sans backend réel.
- Il ne décide aucun choix Detox/Maestro/Appium/Playwright mobile. Un E2E mobile
  complet reste une mission future sous décision explicite de dépendance/ADR.

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

## Vérifications RN29

- `npm run typecheck`
- `npm run lint`
- `npm test`
- `npm run doctor`
- `npx expo export -p ios`
- `npm run smoke:android`
- `git diff --check`

## Prochaine mission recommandée

**Mobile Core React Native 30 — smoke runtime iOS/simulateur ou device parity** :
rejouer le starter sur iOS Simulator/macOS ou device physique quand
l'environnement le permet, sans ajouter de dépendance ni logique métier.
