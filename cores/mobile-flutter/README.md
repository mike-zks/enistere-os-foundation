# Mobile Core Flutter

> Statut : **`SPECIFICATION_DOCUMENTAIRE`** (Mobile Core Flutter 1, 2026-07-14)
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
├── CORE_SPECIFICATION.md   ← livré par Flutter 1
└── README.md               ← livré par Flutter 1
```

Aucun code Dart, `pubspec.yaml`, widget ou workflow n'existe. La prochaine mission est **Flutter 2 — Starter minimal Flutter**.

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
| Flutter 2 | Starter minimal | `pubspec.yaml` + structure `lib/` + `ThemeData` Enistere |
| Flutter 3 | Auth + navigation | `AuthController` + go_router guards + SecureStorage + login |
| Flutter 4 | Client Dio + providers | Intercepteurs + Freezed models + health/auth providers |
| Flutter 5 | Upload multipart | `UploadService` + `AppFile` descriptor |
| Flutter 6 | Tests + smoke | `flutter_test` + intégration iOS + Android |
| Flutter V1 | Readiness review | Rapport V1 Readiness |
