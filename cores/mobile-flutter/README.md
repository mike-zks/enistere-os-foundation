# Mobile Core Flutter

> Statut : **`IMPLEMENTATION_AVANCEE`** (Flutter V1 Readiness Review, 2026-07-14)
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
cores/mobile-flutter/
├── pubspec.yaml                            ← Flutter 6 (+ integration_test: sdk: flutter)
├── analysis_options.yaml                   ← Flutter 2
├── CORE_SPECIFICATION.md                   ← Flutter 1
├── README.md                               ← Flutter 1
├── scripts/
│   └── smoke.sh                            ← Flutter 6 (smoke runner : headless / --android / --ios)
├── integration_test/
│   └── smoke_test.dart                     ← Flutter 6 (5 tests device — procédure projets dérivés)
├── lib/
│   ├── main.dart                           ← Flutter 2 (ProviderScope + EnistereApp)
│   ├── app.dart                            ← Flutter 3 (routerProvider watch)
│   └── src/
│       ├── core/
│       │   ├── api/
│       │   │   ├── app_api_error.dart     ← Flutter 4 (sealed class, 11 sous-types, Dart 3 natif)
│       │   │   ├── error_interceptor.dart ← Flutter 4 (mapDioError + ErrorInterceptor)
│       │   │   ├── logging_interceptor.dart ← Flutter 4 (method+path seulement, jamais body/token)
│       │   │   ├── dio_client.dart        ← Flutter 4 (createDioClient + _AuthInterceptor)
│       │   │   └── dio_provider.dart      ← Flutter 4 (apiConfigProvider + dioClientProvider)
│       │   ├── auth/
│       │   │   ├── auth_status.dart       ← Flutter 3 (enum loading/authenticated/unauthenticated/expired)
│       │   │   ├── auth_state.dart        ← Flutter 3 (status + userId, jamais de token)
│       │   │   ├── session_envelope.dart  ← Flutter 3 (userId opaque, pas de token)
│       │   │   ├── session_store.dart     ← Flutter 3 (seam + InMemorySessionStore placeholder)
│       │   │   └── auth_controller.dart   ← Flutter 3 (Notifier<AuthState>, token mémoire)
│       │   ├── config/
│       │   │   └── api_config.dart        ← Flutter 4 (ApiConfig : baseUrl, timeouts, commonHeaders)
│       │   ├── navigation/
│       │   │   └── router.dart            ← Flutter 3 (routerProvider GoRouter + guards)
│       │   └── upload/
│       │       ├── app_file.dart          ← Flutter 5 (AppFile + SafeFileDescriptor + describeFileForLog)
│       │       ├── file_category.dart     ← Flutter 5 (FileCategory enum + apiValue)
│       │       ├── upload_result.dart     ← Flutter 5 (UploadedFileMetadata.fromJson)
│       │       └── upload_service.dart    ← Flutter 5 (UploadService + DioUploadService)
│       ├── features/
│       │   ├── auth/
│       │   │   └── sign_in_screen.dart    ← Flutter 3 (placeholder, bouton connexion)
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
    │   │   └── dio_client_test.dart       ← Flutter 4 (11 tests)
    │   ├── auth/
    │   │   ├── auth_controller_test.dart  ← Flutter 3 (9 tests)
    │   │   └── session_store_test.dart    ← Flutter 3 (4 tests)
    │   └── upload/
    │       ├── app_file_test.dart         ← Flutter 5 (21 tests)
    │       └── upload_service_test.dart   ← Flutter 5 (14 tests)
    └── widget/
        ├── app_test.dart                  ← Flutter 3 (4 tests)
        ├── router_guard_test.dart         ← Flutter 3 (5 tests guards)
        ├── splash_screen_test.dart        ← Flutter 6 (4 tests)
        ├── sign_in_screen_test.dart       ← Flutter 6 (5 tests)
        └── home_screen_test.dart          ← Flutter 6 (7 tests)
```

La prochaine mission est **Flutter 7 — platform dirs + smoke Android** (ferme B1 — Android runtime).

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
| Flutter 7 | Platform dirs + smoke Android | Dossiers `android/` + `flutter test integration_test/ -d emulator-5554` |
| Flutter 8 | SecureStorage seam + adapter | `flutter_secure_storage` + `SecureStorageSessionStore` + `restoreSession()` |
| Flutter 9 | RefreshInterceptor | 401 → `refresh()` coalescent → 1 retry → purge |
| Flutter 10 | UI states | `LoadingState` / `EmptyState` / `ErrorState` / `SuccessState` + tokens Enistere |
| Flutter 11 | Login form | `SignInScreen` email + password + validation + erreur accessible |
| Flutter V1 final | V1 Final Readiness | `VALIDE_V1` quand Flutter 7→11 réalisés |
