# MOBILE_RN34_ANDROID_SMOKE_REPORT.md — Smoke Android RN34

> Branche : `docs/mobile-rn34-android-smoke-proof`
> Commit : `docs(mobile): record rn34 android smoke success`
> Contexte : RN34 a été mergée avec expo-doctor 19/19. Le rapport initial indiquait `npm run smoke:android` `blocked` (aucun device). Ce document enregistre l'exécution réussie ultérieure.

## Résultat

| Champ | Valeur |
|---|---|
| Status | **passed** |
| Device | `emulator-5554` (Pixel_6a — AVD Android Emulator) |
| Started | `2026-07-08T20:25:05.551Z` |
| Finished | `2026-07-08T20:26:06.966Z` |
| Durée | ~61 secondes |
| Mode | semi-automated (UIAutomator + mock auth 127.0.0.1:3000) |
| loginCount | **1** (mock `/auth/login` POST intercepté et validé) |
| refreshCount | **1** (mock `/auth/refresh` POST intercepté et validé) |
| Rapport JSON | `/tmp/enistere-mobile-rn29-smoke-report.json` |

## Parcours vérifié

1. Preflight : `adb devices -l` détecte `emulator-5554` (1 device).
2. Mock auth server démarré sur `127.0.0.1:3000` ; `adb reverse tcp:3000 tcp:3000`.
3. `npx expo start --android --localhost -c` → Metro bundler prêt → ouverture sur Pixel_6a.
4. UI : label `Sign in` détecté → formulaire Email/Password rempli → soumission.
5. Mock `/auth/login` intercepté → `loginCount=1` validé → UI post-login (`Open settings`) détectée.
6. Navigation Settings → `Refresh session` tapé → mock `/auth/refresh` intercepté → `refreshCount=1` validé.
7. `Sign out` tapé → retour écran Sign in (`Sign in` détecté).
8. `smoke-pass` émis ; `adb reverse --remove tcp:3000` ; rapport JSON écrit.

## Conformité aux contraintes RN34B

- Aucun changement de code (`app/`, `src/`, `scripts/`) — uniquement des fichiers de documentation.
- Aucune dépendance nouvelle, aucun package-lock modifié.
- Aucun changement API/Web/UI Kit/Cloud/packages.
- iOS : statut RN31 inchangé (`STARTER_IOS_SMOKE_BLOCKED_BY_ENVIRONMENT`, Linux sans `xcrun`).
- Aucun endpoint métier réel, aucun réseau de production : serveur mock local uniquement.
- Aucun stockage de credential, aucun log de password/email brut.
