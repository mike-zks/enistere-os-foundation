# MOBILE_FLUTTER7_ANDROID_SMOKE_REPORT.md — Flutter 7 Android Smoke Report

> **Date** : 2026-07-14
> **Branche** : `mobile-core-flutter-7-platform-dirs-android-smoke`
> **Mission** : Mobile Core Flutter 7 — platform dirs + smoke Android
> **Objectif** : Fermer B1 (Android runtime) du rapport `MOBILE_FLUTTER_V1_READINESS_REVIEW.md`

---

## 1. Contexte — pourquoi B1 existait

Le Mobile Core Flutter était un package Dart/Flutter sans dossiers platform (`android/`, `ios/`, etc.).
La commande `flutter test integration_test/ -d <device>` requiert un projet Flutter complet avec les
dossiers platform correspondants. Le package était utilisable comme bibliothèque (tests headless) mais
pas comme application installable sur device.

---

## 2. Livrable Flutter 7 — platform dirs Android

### Commande utilisée

```bash
cd cores/mobile-flutter
flutter create --platforms=android --org com.enistere .
```

### Fichiers générés

| Fichier | Rôle |
|---|---|
| `android/app/src/main/kotlin/com/enistere/mobile_flutter/MainActivity.kt` | Entry point Android — `FlutterActivity()` |
| `android/app/src/main/AndroidManifest.xml` | Manifest app (permissions, activity, intents) |
| `android/app/src/debug/AndroidManifest.xml` | Manifest debug (profiling network) |
| `android/app/src/profile/AndroidManifest.xml` | Manifest profiling |
| `android/app/build.gradle.kts` | Config build module app |
| `android/build.gradle.kts` | Config build racine |
| `android/settings.gradle.kts` | Settings projet Gradle |
| `android/gradle.properties` | Propriétés Gradle |
| `android/gradle/wrapper/gradle-wrapper.properties` | Version Gradle wrapper |
| `android/.gitignore` | Ignores Android build artifacts |
| `android/app/src/main/res/*/` | Ressources launcher, thèmes, styles |
| `.gitignore` | Root gitignore Flutter (généré) |
| `.metadata` | Metadata Flutter tooling (à versionner) |

### Fichiers supprimés post-génération

| Fichier | Raison |
|---|---|
| `test/widget_test.dart` | Template incompatible (`MyApp` inexistant) — supprimé |

### Vérifications sécurité

- Aucun secret dans les fichiers générés
- `MainActivity.kt` = `FlutterActivity()` uniquement (pas de logique métier)
- `AndroidManifest.xml` = déclarations d'activité standard Flutter, aucune permission sensible
- `applicationId` = `com.enistere.mobile_flutter` (identifiant app sans données projet métier)
- Fichiers IDE (`.idea/`, `*.iml`) couverts par `.gitignore` (non versionnés)

---

## 3. Résultats des gates qualité

### flutter pub get

```
Got dependencies!
```

### flutter analyze

```
Analyzing mobile-flutter...
No issues found! (ran in 2.0s)
```

### flutter test (136/136 headless)

```
136 tests passed
```

### dart format --set-exit-if-changed .

```
Formatted 40 files (0 changed) in 0.12 seconds.
```

---

## 4. Smoke Android — integration_test

### Device

| Attribut | Valeur |
|---|---|
| Device ID | `emulator-5554` |
| Model | Pixel 6a |
| Platform | Android API 33 (x86_64) |
| Flutter channel | stable 3.44.6 |

### Commande

```bash
flutter test integration_test/smoke_test.dart -d emulator-5554
```

### Résultat

```
00:00 +0: loading integration_test/smoke_test.dart
Running Gradle task 'assembleDebug'...                          512.2s
✓ Built build/app/outputs/flutter-apk/app-debug.apk
Installing build/app/outputs/flutter-apk/app-debug.apk...          924ms
00:00 +0: Smoke — app startup app starts and renders without crash
00:03 +1: Smoke — app startup unauthenticated user sees SignInScreen
00:04 +2: Smoke — auth flow sign-in tap navigates to HomeScreen
00:05 +3: Smoke — auth flow logout tap returns to SignInScreen
00:08 +4: Smoke — auth flow authenticated start shows HomeScreen directly
00:08 +5: (tearDownAll)
00:09 +5: All tests passed!
```

**Verdict : PASSÉ — 5/5 tests en 9s.**

| Étape | Durée | Résultat |
|---|---|---|
| `assembleDebug` Gradle | 512.2s | ✅ APK généré |
| Installation APK | 924ms | ✅ Installé sur emulator-5554 |
| Tests integration | 9s | ✅ 5/5 passés |

---

## 5. Tests integration_test/smoke_test.dart — scénarios

| # | Scénario | Attendu |
|---|---|---|
| 1 | App startup sans crash | `SplashScreen` visible |
| 2 | Utilisateur non authentifié | `SignInScreen` visible |
| 3 | Sign-in → `HomeScreen` | `HomeScreen` avec userId |
| 4 | Logout → `SignInScreen` | Retour `SignInScreen` |
| 5 | Session restore → `HomeScreen` | `HomeScreen` avec userId persisté |

---

## 6. Statut B1

| Critère | Avant Flutter 7 | Après Flutter 7 |
|---|---|---|
| B1 — Android runtime | ❌ Library sans `android/` | ✅ **FERMÉ** — dossiers platform générés, smoke `emulator-5554` passé |
| C1 — App démarre iOS/Android | ❌ BLOQUÉ architectural+env | ✅ Android réel (emulator-5554) ; iOS reste bloqué Linux (R1 accepté) |
| C11 — App tourne localement | ❌ BLOQUÉ | ✅ Android emulator-5554 passé |

**B1 fermé. B2→B5 restent ouverts.**

---

## 7. Réserves maintenues

| Ref | Réserve | Statut |
|---|---|---|
| R1 | iOS — hôte Linux sans macOS/Xcode | Maintenu — identique à RN B2 |
| R2 | Aucun appel API réel | Maintenu |
| R3 | Freezed/build_runner absent | Maintenu |
| R4 | Logger redaction | Maintenu |
| R5 | PreferenceStore seam | Maintenu |
