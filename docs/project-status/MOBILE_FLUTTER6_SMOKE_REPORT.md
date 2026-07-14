# MOBILE_FLUTTER6_SMOKE_REPORT.md — Flutter 6 Smoke Report

> **Date** : 2026-07-14
> **Branche** : `mobile-core-flutter-6-tests-smoke` (PR en cours)
> **Statut** : **`TEST_WIDGET_PASSED` — Android intégration bloqué (librairie sans dossiers platform)**

---

## 1. Environnement

| Composant | Valeur |
|---|---|
| Flutter | 3.44.6 (stable) |
| Dart | 3.12.2 |
| Hôte | Fedora Linux 44, x86_64 |
| `flutter doctor` | ✅ 5/5 checks verts (Flutter, Android toolchain, Chrome, Linux, réseau) |
| Android emulator | `emulator-5554` (Android 13, API 33, sdk gphone64 x86_64) présent et `device` |
| iOS | ❌ **BLOQUÉ** — hôte Linux, pas de macOS/Xcode |

---

## 2. Tests headless (`flutter test`) — **PASSÉS** 136/136

Les tests `flutter test` s'exécutent dans une VM Dart headless, sans device requis.

### 2.1 Résumé par suite

| Suite | Tests | Résultat |
|---|---|---|
| `test/theme/enistere_theme_test.dart` | 16 | ✅ |
| `test/widget/app_test.dart` | 4 | ✅ |
| `test/widget/router_guard_test.dart` | 5 | ✅ |
| `test/widget/splash_screen_test.dart` | 4 | ✅ (**Flutter 6**) |
| `test/widget/sign_in_screen_test.dart` | 5 | ✅ (**Flutter 6**) |
| `test/widget/home_screen_test.dart` | 7 | ✅ (**Flutter 6**) |
| `test/unit/auth/auth_controller_test.dart` | 9 | ✅ |
| `test/unit/auth/session_store_test.dart` | 4 | ✅ |
| `test/unit/api/app_api_error_test.dart` | 12 | ✅ |
| `test/unit/api/error_interceptor_test.dart` | 19 | ✅ |
| `test/unit/api/logging_interceptor_test.dart` | 6 | ✅ |
| `test/unit/api/dio_client_test.dart` | 11 | ✅ |
| `test/unit/upload/app_file_test.dart` | 21 | ✅ |
| `test/unit/upload/upload_service_test.dart` | 14 | ✅ |
| **TOTAL** | **136** | **✅ 136/136** |

### 2.2 Chemins critiques couverts (widget tests)

| Chemin | Couverture | Tests |
|---|---|---|
| App startup sans crash | ✅ | `app_test: builds without error` |
| Splash screen pendant le chargement auth | ✅ | `splash_screen_test: app shows SplashScreen while auth is loading` |
| Indicateur centré sur SplashScreen | ✅ | `splash_screen_test: indicator is centred` |
| Unauthenticated → SignInScreen | ✅ | `app_test`, `router_guard_test`, `sign_in_screen_test` |
| Authenticated → HomeScreen | ✅ | `app_test`, `router_guard_test`, `home_screen_test` |
| Bouton 'Se connecter' visible | ✅ | `sign_in_screen_test: shows 'Se connecter'` |
| Touch target button ≥ 44 dp | ✅ | `sign_in_screen_test: sign-in button height meets minTouchTarget` |
| Sign-in → navigation vers Home | ✅ | `sign_in_screen_test`, `router_guard_test` |
| HomeScreen — heading et sous-titre | ✅ | `home_screen_test: heading + ADR-034` |
| HomeScreen — userId de session affiché | ✅ | `home_screen_test: shows session userId` |
| Logout → navigation vers SignIn | ✅ | `home_screen_test: logout button navigates`, `router_guard_test` |
| Redirection auth → interdit accès SignIn | ✅ | `router_guard_test: authenticated user redirected` |
| Thème Enistere — couleur primaire | ✅ | `app_test`, `sign_in_screen_test` |
| ThemeExtension accessible | ✅ | `home_screen_test: Enistere theme extension accessible` |
| Tokens spacing/radius/touchTarget | ✅ | `theme/enistere_theme_test` (16 tests) |
| Upload primitives sans réseau | ✅ | `unit/upload/` (35 tests) |
| Upload erreurs 413/415/401/réseau | ✅ | `unit/upload/upload_service_test` |
| Token/path jamais dans les logs | ✅ | `unit/upload/upload_service_test`, `unit/api/logging_interceptor_test` |

---

## 3. Tests d'intégration sur device (`integration_test/smoke_test.dart`)

### 3.1 Statut Android

**BLOQUÉ — architecture library sans dossiers platform.**

Le `mobile-flutter` core est un **package Dart/Flutter** (library), pas une application Flutter complète.
Il n'inclut pas de dossiers `android/`, `ios/`, `linux/` nécessaires à `flutter test integration_test/ -d <device>`.

```
Error: No application found for TargetPlatform.android_x64.
Please check android/AndroidManifest.xml for errors.
```

Ce blocage est **architectural et non environnemental** : l'émulateur Android `emulator-5554` (Android 13, API 33) est disponible et opérationnel sur cet hôte. Le blocage disparaîtrait en ajoutant les dossiers platform via `flutter create --platforms=android .`, ce qui est hors périmètre Flutter 6 (aucun nouveau module fonctionnel).

**Procédure pour projets dérivés** : un projet Flutter dérivé du core (qui a des dossiers platform) peut exécuter les tests de `integration_test/smoke_test.dart` directement :
```bash
# Depuis un projet dérivé ayant importé mobile_flutter
flutter test integration_test/smoke_test.dart -d emulator-5554
```

Les 5 scénarios de `integration_test/smoke_test.dart` couvrent exactement les mêmes chemins que les widget tests headless (startup, unauthenticated, sign-in, logout, session restore) — sans logique réseau réelle.

### 3.2 Statut iOS

**BLOQUÉ — hôte Linux sans macOS/Xcode.**

Identique au blocage RN30/RN31 du Mobile Core React Native. Aucune preuve iOS n'est revendiquée.
Procédure documentée : exécuter `bash scripts/smoke.sh --ios` depuis un hôte macOS avec Xcode installé et un simulateur iOS disponible.

---

## 4. Script de smoke (`scripts/smoke.sh`)

Disponible à `cores/mobile-flutter/scripts/smoke.sh`.

```bash
# Tests headless (flutter test) — aucun device requis
bash scripts/smoke.sh

# Tests headless + intégration Android (device requis)
bash scripts/smoke.sh --android

# Tests headless + intégration iOS (macOS + Xcode requis)
bash scripts/smoke.sh --ios
```

---

## 5. Vérifications qualité

| Gate | Résultat |
|---|---|
| `flutter pub get` | ✅ |
| `flutter analyze` | ✅ 0 issues |
| `flutter test` | ✅ 136/136 |
| `dart format --set-exit-if-changed .` | ✅ 0 changements |
| `git diff --check` | ✅ |
| `quality-gates docs` | ✅ 2/2 |

---

## 6. Réserves

| # | Réserve | Criticité | Plan |
|---|---|---|---|
| R1 | `integration_test/smoke_test.dart` ne peut pas être exécuté sur device depuis ce package library | Architecturale — non bloquante V1 | Ajouter dossiers platform dans un incrément futur ou depuis un projet dérivé |
| R2 | iOS non testé — hôte Linux sans macOS/Xcode | Environnementale — identique RN30/RN31 | Exécuter `smoke.sh --ios` depuis macOS/Xcode quand disponible |
| R3 | Upload primitives testées sans UI upload (pas d'écran upload dans Flutter 5) | Non bloquante | Flutter 7+ ajoutera l'écran d'upload ; primitives couvertes par 35 tests unitaires |

---

## 7. Conclusion

Le **Mobile Core Flutter** dispose d'une couverture de tests headless complète : **136/136 tests** couvrant tous les chemins critiques identifiés (startup, routing, auth, thème, upload primitives). Les tests d'intégration sur device sont fournis en fichier (`integration_test/smoke_test.dart`) et en script (`scripts/smoke.sh --android`) mais ne peuvent pas être exécutés depuis ce package library sans dossiers platform — réserve architecturale documentée.

Statut : **`UPLOAD_READY`** → **`TEST_WIDGET_PASSED`** (Flutter 6).
Prochaine étape : **Flutter V1 Readiness Review**.
