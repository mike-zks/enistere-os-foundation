# Mobile RN28 — rapport de smoke visuel starter

> Date : 2026-06-14  
> Core : `cores/mobile-react-native`  
> Statut issu du smoke : **`STARTER_VISUAL_SMOKE_READY`**

## Objectif

Vérifier le starter Expo public/protégé/settings sur un runtime device/simulateur
réel, puis corriger uniquement les défauts visuels ou runtime résiduels.

## Environnement

- Hôte : Linux.
- iOS Simulator : non disponible (`xcrun` absent).
- Android Emulator : disponible, AVD `Pixel_6a`.
- Runtime app : Expo Go lancé par `npx expo start --android --localhost -c`.
- Auth de smoke : mock HTTP local temporaire sur `localhost:3000`, exposé à
  l'émulateur via `adb reverse tcp:3000 tcp:3000`.

Le mock répond uniquement à `POST /auth/login` et `POST /auth/refresh` avec une
session jetable. Il n'est pas versionné et ne modifie aucun code applicatif.

## Parcours vérifié

1. Sign-in public rendu dans Expo Go.
2. Tap `Sign in` → `POST /auth/login` reçu par le mock local.
3. Navigation vers Home protégé.
4. Tap `Open settings` → route Settings protégée accessible.
5. Scroll Settings jusqu'aux sections Privacy/Telemetry, Environment et
   Foundation diagnostics.
6. Retour Android Settings → Home.
7. Tap `Refresh session` → `POST /auth/refresh` reçu par le mock local.
8. Tap `Sign out` → retour à l'écran public.

## Observations visuelles

- Sign-in public : titre, description et bouton lisibles ; aucun débordement.
- Home protégé : header, contenu, expiration et boutons lisibles ; aucun bouton
  coupé.
- Settings haut : header retour, section Session, Preferences/UI et début
  Privacy/Telemetry lisibles ; scroll présent.
- Settings bas : Privacy/Telemetry, Environment et Foundation diagnostics
  lisibles ; contexte environnement safe sans identifiant device.
- Navigation Home ↔ Settings : fonctionnelle.
- `Refresh session` et `Sign out` : fonctionnels avec le mock local.

La date d'expiration dans Settings se replie sur deux lignes sur le profil
`Pixel_6a`, mais reste dans son conteneur et lisible. Aucun correctif code n'a
été nécessaire.

## Captures locales

Captures produites localement dans `/tmp` pendant le smoke :

- `/tmp/rn28-after-login.png`
- `/tmp/rn28-settings-top.png`
- `/tmp/rn28-settings-bottom.png`
- `/tmp/rn28-return-home.png`
- `/tmp/rn28-signout-public.png`

Ces fichiers ne sont pas versionnés pour éviter d'ajouter des artefacts binaires
temporaires au repository.

## Limites

- iOS Simulator non exécuté : hôte Linux, `xcrun` absent.
- Device physique non exécuté.
- État `expired` non manipulé pendant ce smoke sans backend réel dédié.
- Smoke encore manuel ; aucune fixture/script automatisé n'est ajouté en RN28.

## Hors périmètre confirmé

RN28 n'ajoute aucune dépendance, aucun endpoint métier, aucun SDK ou adaptateur
natif réel, aucun retry branché, aucune persistance et aucun changement à
`AuthEngine`, `withAuthRetry`, `authedRequest`, QueryClient ou mutations.
