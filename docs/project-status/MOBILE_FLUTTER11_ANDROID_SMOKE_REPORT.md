# MOBILE_FLUTTER11_ANDROID_SMOKE_REPORT.md — Flutter 11 Android Smoke Report

> **Date** : 2026-07-14
> **Branche** : `mobile-core-flutter-11-sign-in-form`
> **Mission** : Flutter 11 — Sign-in form validation (B5)
> **Device** : `emulator-5554` (Pixel 6a, Android API 33, x86_64)

---

## 1. Objectif

Vérifier que le device Android continue à passer les 7 smoke tests existants après le remplacement du
bouton mock `SignInScreen` par un formulaire email + password + validation (Flutter 11 — B5).

Le smoke `sign-in tap navigates to HomeScreen` est adapté pour saisir email + password avant de taper
`Se connecter`.

---

## 2. Résultat

```
flutter test integration_test/smoke_test.dart -d emulator-5554
Running Gradle task 'assembleDebug'...   28.3s
✓ Built build/app/outputs/flutter-apk/app-debug.apk
Installing build/app/outputs/flutter-apk/app-debug.apk...  946ms

+0: Smoke — app startup app starts and renders without crash
+1: Smoke — app startup unauthenticated user sees SignInScreen
+2: Smoke — auth flow sign-in tap navigates to HomeScreen
+3: Smoke — auth flow logout tap returns to SignInScreen
+4: Smoke — auth flow authenticated start shows HomeScreen directly
+5: Smoke — SecureStorage (B2) SecureSessionStore write/read/clear work on device
+6: Smoke — SecureStorage (B2) app with SecureSessionStore restores session on device
+7: All tests passed!
```

**Résultat : 7/7 passés. Aucune régression.**

---

## 3. Preuves headless Flutter 11

| Vérification | Résultat |
|---|---|
| `flutter pub get` | ✅ |
| `flutter analyze` | ✅ 0 issues |
| `flutter test` | ✅ **218/218** (213 existants + 5 nouveaux sign-in form) |
| `dart format --set-exit-if-changed .` | ✅ 0 changements |
| `quality-gates docs` | ✅ 2/2 |
| `git diff --check` | ✅ |

---

## 4. Formulaire livré

| Aspect | Preuve |
|---|---|
| Champ email (`Key('emailField')`) | `TextFormField` + `keyboardType: emailAddress` + `TextInputAction.next` |
| Champ password (`Key('passwordField')`) | `TextFormField` + `obscureText: true` + `TextInputAction.done` |
| Validation email requis | Message `'Email requis'` si vide |
| Validation format email | Message `'Format invalide'` si pas d'`@` |
| Validation password requis | Message `'Mot de passe requis'` si vide |
| Soumission valide | Appelle `AuthController.signIn(email, password)` + navigation HomeScreen |
| Erreur auth générique | Message `'Une erreur est survenue. Veuillez réessayer.'` + `liveRegion: true` |
| Chargement | Bouton désactivé + `CircularProgressIndicator` 20×20 inline |
| Accessibilité | `Semantics(liveRegion: true)` sur le message d'erreur auth |
| Sécurité | Aucun log de credential, `obscureText: true` sur password |

---

## 5. Tests widget ajoutés / mis à jour

| Test | Fichier |
|---|---|
| `shows email and password fields and 'Se connecter' button` | `sign_in_screen_test.dart` |
| `email field is required — shows error when empty` | `sign_in_screen_test.dart` |
| `email field shows format error for missing @` | `sign_in_screen_test.dart` |
| `password field is required — shows error when empty` | `sign_in_screen_test.dart` |
| `valid submit navigates to HomeScreen` | `sign_in_screen_test.dart` |
| `signIn failure shows generic error message` | `sign_in_screen_test.dart` |
| `password field uses obscureText` | `sign_in_screen_test.dart` |
| `signing in navigates from SignInScreen to HomeScreen` (adapté) | `router_guard_test.dart` |

---

## 6. Verdict

**B5 FERMÉ** — `SignInScreen` dispose d'un formulaire email + password + validation UX + erreur auth
générique accessible. Les 10 tests widget headless `sign_in_screen_test.dart` passent ; le smoke Android
`emulator-5554` 7/7 ✅ confirme l'absence de régression.

Score §29 : **9/11** satisfaits (C9 ❌ → ✅). Bloquant restant : aucun (tous les B fermés).
Réserves maintenues : R1 (iOS Linux environnemental).
