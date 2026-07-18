# Mobile Core Flutter

> Statut : **`VALIDE_V1`** (Flutter V1 Final Readiness Decision, 2026-07-14 — §29 9/11 + 2 PARTIAL iOS R1 ; B1→B5 tous fermés ; R1 iOS Linux acceptée comme réserve environnementale non bloquante — identique à RN)
> Spécification cible : [`CORE_SPECIFICATION.md`](./CORE_SPECIFICATION.md)
> Décision UI : [`ADR-034`](../../docs/adr/ADR-034-flutter-ui-material3-vs-custom.md) — Material 3 contrôlé par tokens Enistere

Socle mobile **Flutter / Dart** générique et réutilisable pour les futures applications Enistere.
Ce core est la déclinaison Flutter du Mobile Core React Native (V1 validé).
Il ne contient aucune logique métier ni aucun code runtime.

## Ce que ce core fournira (cible V1)

| Module | Stack | Notes |
|---|---|---|
| Navigation | `go_router` | Routes publiques + protégées, guards auth, deep linking |
| State management | `Riverpod` (`AsyncNotifierProvider`, `NotifierProvider`) | Server-state + état local ; purge au logout |
| Client HTTP | `Dio` + intercepteurs | AuthInterceptor, RefreshInterceptor (401), ErrorInterceptor, LoggingInterceptor |
| Modèles immuables | `Freezed` + `Json Serializable` | DTOs typés alignés avec `@enistere/api-contracts` (OpenAPI) |
| Stockage sécurisé | `flutter_secure_storage` | Refresh token Keychain/Keystore ; access token en mémoire |
| Préférences | `PreferenceStore` seam (Hive/SharedPreferences) | Données non sensibles : thème, langue, onboarding |
| Auth flow | `AuthController` Riverpod | login / logout / refresh / restoreSession |
| Upload fichiers | `Dio` + `FormData` + `MultipartFile` | Multipart sécurisé, redaction URI/token/URL signée |
| Thème / UI | Material 3 + tokens Enistere (ADR-034) | `ThemeData` depuis tokens, `ThemeExtension`, dark/light |
| États UI | `LoadingState`, `EmptyState`, `ErrorState`, `SuccessState` | Primitives Foundation alignées UI Kit |
| Formulaires | À décider (reactive_forms / natif Dart) | Validation typée, erreurs accessibles |
| Logger | `AppLogger` + redaction Dart | Sink console V1 ; extensible vers Sentry/Firebase |
| i18n | `flutter_localizations` + ARB | FR + EN, clé langue persistée en préférences |
| Accessibilité | `Semantics`, tailles tactiles, contrastes | WCAG AA, VoiceOver, TalkBack |
| Tests | `flutter_test`, `mocktail` | Unit + widget + integration ; smoke iOS + Android |

## Statut actuel

```txt
starters/flutter/
├── pubspec.yaml                            ← Flutter 6 (+ integration_test: sdk: flutter)
├── analysis_options.yaml                   ← Flutter 2
├── CORE_SPECIFICATION.md                   ← Flutter 1
├── README.md                               ← Flutter 1
├── scripts/
│   └── smoke.sh                            ← Flutter 6 (smoke runner : headless / --android / --ios)
├── integration_test/
│   └── smoke_test.dart                     ← Flutter 6 + Flutter 8 (7 tests device — 5 originaux + 2 SecureStorage B2, B3+B4 passants)
├── lib/
│   ├── main.dart                           ← Flutter 2 (ProviderScope + EnistereApp)
│   ├── app.dart                            ← Flutter 3 (routerProvider watch)
│   └── src/
│       ├── core/
│       │   ├── api/
│       │   │   ├── app_api_error.dart     ← Flutter 4 (sealed class, 11 sous-types, Dart 3 natif)
│       │   │   ├── error_interceptor.dart ← Flutter 4 (mapDioError + ErrorInterceptor)
│       │   │   ├── logging_interceptor.dart ← Flutter 4 (method+path seulement, jamais body/token)
│       │   │   ├── dio_client.dart        ← Flutter 4+9 (createDioClient + _AuthInterceptor + TokenRefresher)
│       │   │   ├── dio_provider.dart      ← Flutter 4+9 (apiConfigProvider + dioClientProvider + refresher)
│       │   │   └── refresh_interceptor.dart ← Flutter 9 (RefreshInterceptor — 401→refresh coalescent→retry→purge)
│       │   ├── auth/
│       │   │   ├── auth_status.dart       ← Flutter 3 (enum loading/authenticated/unauthenticated/expired)
│       │   │   ├── auth_state.dart        ← Flutter 3 (status + userId, jamais de token)
│       │   │   ├── auth_api.dart          ← Flutter 9 (AuthApi seam + PlaceholderAuthApi)
│       │   │   ├── session_envelope.dart  ← Flutter 8 (userId + refreshToken? ; fromJson/toJson ; toString sans refreshToken)
│       │   │   ├── session_store.dart     ← Flutter 3 (seam + InMemorySessionStore placeholder)
│       │   │   ├── secure_session_store.dart ← Flutter 8 (SecureStorageAdapter + FlutterSecureStorageAdapter + SecureSessionStore)
│       │   │   └── auth_controller.dart   ← Flutter 8+9 (restoreSession() + refreshSession() coalescent ; token mémoire — jamais persisté)
│       │   ├── config/
│       │   │   └── api_config.dart        ← Flutter 4 (ApiConfig : baseUrl, timeouts, commonHeaders)
│       │   ├── navigation/
│       │   │   └── router.dart            ← Flutter 3 (routerProvider GoRouter + guards)
│       │   ├── states/
│       │   │   ├── loading_state.dart     ← Flutter 10 (LoadingState — indicateur + message + Semantics label)
│       │   │   ├── empty_state.dart       ← Flutter 10 (EmptyState — title + description + action OutlinedButton)
│       │   │   ├── error_state.dart       ← Flutter 10 (ErrorState — title + message + action + Semantics liveRegion + colorDanger)
│       │   │   └── success_state.dart     ← Flutter 10 (SuccessState — title + message + action + Semantics liveRegion + colorSuccess)
│       │   └── upload/
│       │       ├── app_file.dart          ← Flutter 5 (AppFile + SafeFileDescriptor + describeFileForLog)
│       │       ├── file_category.dart     ← Flutter 5 (FileCategory enum + apiValue)
│       │       ├── upload_result.dart     ← Flutter 5 (UploadedFileMetadata.fromJson)
│       │       └── upload_service.dart    ← Flutter 5 (UploadService + DioUploadService)
│       ├── features/
│       │   ├── auth/
│       │   │   └── sign_in_screen.dart    ← Flutter 11 (ConsumerStatefulWidget + Form + email + password + validation + erreur auth)
│       │   ├── home/
│       │   │   └── home_screen.dart       ← Flutter 3 (ConsumerWidget + sign-out)
│       │   └── splash/
│       │       └── splash_screen.dart     ← Flutter 3 (CircularProgressIndicator)
│       └── theme/
│           ├── enistere_tokens.dart       ← Flutter 2 (tokens verbatim UI Kit)
│           ├── enistere_theme_extension.dart ← Flutter 2 (ThemeExtension)
│           └── enistere_theme.dart        ← Flutter 2 (ThemeData light/dark ADR-034)
└── test/
    ├── theme/
    │   └── enistere_theme_test.dart       ← Flutter 2 (16 tests)
    ├── unit/
    │   ├── api/
    │   │   ├── app_api_error_test.dart    ← Flutter 4 (12 tests)
    │   │   ├── error_interceptor_test.dart ← Flutter 4 (19 tests)
    │   │   ├── logging_interceptor_test.dart ← Flutter 4 (6 tests)
    │   │   ├── dio_client_test.dart       ← Flutter 4 (11 tests)
    │   │   └── refresh_interceptor_test.dart ← Flutter 9 (9 tests — _CaptureAdapter)
    │   ├── auth/
    │   │   ├── auth_controller_test.dart  ← Flutter 3+9 (14 tests — 9 existants + 5 refreshSession)
    │   │   ├── session_store_test.dart    ← Flutter 3 (4 tests)
    │   │   └── secure_session_store_test.dart ← Flutter 8 (23 tests — FakeSecureStorageAdapter)
    │   └── upload/
    │       ├── app_file_test.dart         ← Flutter 5 (21 tests)
    │       └── upload_service_test.dart   ← Flutter 5 (14 tests)
    └── widget/
        ├── app_test.dart                  ← Flutter 3 (4 tests)
        ├── router_guard_test.dart         ← Flutter 3 (5 tests guards)
        ├── splash_screen_test.dart        ← Flutter 6 (4 tests)
        ├── sign_in_screen_test.dart       ← Flutter 11 (10 tests — email/password, validation, navigation, obscureText, erreur auth)
        ├── home_screen_test.dart          ← Flutter 6 (7 tests)
        └── states_test.dart               ← Flutter 10 (39 tests — LoadingState/EmptyState/ErrorState/SuccessState)
```

La prochaine mission est **Flutter V1 final — V1 Final Readiness Decision** (`VALIDE_V1` quand toutes les conditions remplies).

## Stack technique

| Composant | Choix retenu | ADR |
|---|---|---|
| Stack UI | Material 3 + tokens Enistere + composants maison ciblés | ADR-034 (Validé) |
| Design tokens | Enistere UI Kit (source de vérité) | ADR-008 (Validé) |
| Stockage sécurisé | flutter_secure_storage | ADR-015 (principes applicables) |
| HTTP client | Dio | Roadmap §15 |
| State management | Riverpod | Roadmap §15 |
| Navigation | go_router | Roadmap §15 |
| Modèles | Freezed + Json Serializable | Roadmap §15 |

## Cohérence avec Mobile Core React Native

Les deux cores mobiles partagent les mêmes **intentions** (tokens, sécurité, états UI, accessibilité) sans dupliquer l'implémentation. Voir `CORE_SPECIFICATION.md §31` pour le tableau de correspondance complet.

## Décisions pendantes

Voir `CORE_SPECIFICATION.md §32` — les principales :
- Client API Dart : Dio hand-written vs openapi_generator Dart vs retrofit.dart
- Préférences non sensibles : Hive vs SharedPreferences
- Librairie formulaires : reactive_forms vs flutter_form_builder vs natif
- Notifications push, analytics, maps : ADR futurs

## Missions ordonnées

| # | Mission | Livrable |
|---|---|---|
| Flutter 1 | Core specification | `CORE_SPECIFICATION.md` + `README.md` ✅ |
| Flutter 2 | Starter minimal | `pubspec.yaml` + structure `lib/` + `ThemeData` Enistere ✅ |
| Flutter 3 | Auth shell + guards | `AuthController` + `SessionStore` seam + GoRouter guards ✅ |
| Flutter 4 | Client Dio + providers | `ApiConfig` + `AppApiError` sealed + `createDioClient` + `dioClientProvider` ✅ |
| Flutter 5 | Upload multipart | `UploadService` + `AppFile` descriptor ✅ |
| Flutter 6 | Tests + smoke | `flutter_test` 136/136 + `integration_test/` + `scripts/smoke.sh` ✅ |
| Flutter V1 | Readiness review | `MOBILE_FLUTTER_V1_READINESS_REVIEW.md` — `IMPLEMENTATION_AVANCEE`, 5 bloquants ✅ |
| Flutter 7 | Platform dirs + smoke Android | Dossiers `android/` + smoke `emulator-5554` 5/5 ✅ — B1 FERMÉ |
| Flutter 8 | SecureStorage seam + adapter | `flutter_secure_storage` + `SecureSessionStore` + `restoreSession()` ✅ — B2 FERMÉ |
| Flutter 9 | RefreshInterceptor | 401 → `refresh()` coalescent → 1 retry → purge ✅ — B3 FERMÉ |
| Flutter 10 | UI states | `LoadingState` / `EmptyState` / `ErrorState` / `SuccessState` + tokens Enistere ✅ — B4 FERMÉ |
| Flutter 11 | Login form | `SignInScreen` email + password + validation + erreur accessible ✅ — B5 FERMÉ |
| Flutter V1 final | V1 Final Readiness | `VALIDE_V1` quand Flutter 7→11 réalisés |
