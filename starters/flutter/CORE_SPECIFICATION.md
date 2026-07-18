# Mobile Core Flutter — Spécification du Core

## 1. Résumé exécutif

Le **Mobile Core Flutter** définit le socle mobile Flutter de référence pour les futures applications Enistere.

Il fournit une base modulaire, sécurisée, maintenable et réutilisable pour construire des applications mobiles multiplateformes (iOS, Android) avec Flutter et Dart : marketplace, livraison, SaaS, outils métier, e-commerce, social ou autres usages.

Cette spécification est documentaire. Elle ne crée aucun projet Flutter, `pubspec.yaml`, code Dart, widget, dossier `lib/`, fichier de navigation ou runtime. Aucune dépendance Dart/Flutter n'est installée.

**Décision UI fondatrice** : ADR-034 — Material 3 contrôlé par tokens Enistere + composants maison ciblés.

## 2. Rôle du core

Le Mobile Core Flutter cadre la base commune des applications mobiles Flutter Enistere.

Il doit :

- standardiser la structure des applications Flutter ;
- définir les modules mobiles communs Dart/Flutter ;
- sécuriser l'authentification et la gestion des tokens ;
- standardiser les appels API, uploads, formulaires et erreurs ;
- préparer l'intégration UI Kit (tokens Enistere via ADR-034), API Core, Cloud Core et Quality Core ;
- fournir un périmètre extensible pour maps, tracking, offline, notifications et modules avancés ;
- rester cohérent avec le Mobile Core React Native en termes de intentions (tokens, états UI, sécurité, accessibilité) sans dupliquer son implémentation.

## 3. Objectifs du Mobile Core Flutter

- Fournir un starter mobile Flutter minimal puis production-ready à terme.
- Utiliser Flutter stable et Dart null-safe comme base cible.
- Standardiser go_router pour la navigation et les routes protégées.
- Standardiser Riverpod pour la gestion d'état (server-state et état local).
- Standardiser Dio pour les appels HTTP vers l'API Core NestJS.
- Standardiser Freezed + Json Serializable pour les modèles immuables et la sérialisation.
- Sécuriser les tokens (access token en mémoire, refresh token dans flutter_secure_storage).
- Appliquer les tokens Enistere via un ThemeData contrôlé (ADR-034 — Material 3 gouverné).
- Exposer des états UI standardisés : loading, empty, error, success.
- Rester générique, sans logique métier spécifique à Kivvoo, Bailo, RFashion, Vox Pulse, CIVIS ID ou tout autre projet dérivé.

## 4. Problèmes à résoudre

Le core doit éviter :

- une nouvelle structure Flutter à chaque projet ;
- des auth flows divergents ou des tokens stockés de manière non sécurisée ;
- des appels Dio dispersés sans couche d'abstraction typée ;
- des uploads multipart instables ou non sécurisés ;
- une identité Material 3 par défaut contournant les tokens Enistere (ADR-034) ;
- une absence d'états loading/empty/error/success standardisés ;
- des widgets avec logique métier ;
- des permissions natives non justifiées ;
- un starter Flutter difficile à adapter aux projets dérivés.

## 5. Périmètre fonctionnel

Le Mobile Core Flutter couvre :

- structure Flutter (lib/, test/, assets/) ;
- navigation go_router (routes publiques et protégées, guards) ;
- auth flow (login, logout, refresh, restauration de session) ;
- gestion tokens (access en mémoire, refresh en stockage sécurisé) ;
- client API Dio typé (headers, injection token, erreurs, timeout, intercepteurs) ;
- upload multipart avec Dio (multipart/form-data) ;
- state management Riverpod (server-state + état local) ;
- formulaires et validation ;
- thème Material 3 Enistere (ADR-034 — tokens Enistere, ThemeData contrôlé) ;
- composants/widgets Foundation ciblés (primitives au-dessus de Material 3) ;
- états UI loading/empty/error/success ;
- logger client générique avec redaction ;
- stockage sécurisé (flutter_secure_storage pour données sensibles) ;
- préférences non sensibles persistantes (Hive ou SharedPreferences) ;
- accessibilité Flutter (Semantics, MergeSemantics, tailles tactiles) ;
- internationalisation (flutter_localizations + ARB) ;
- configuration par environnement (dart-define ou env) ;
- testing setup (flutter_test, Mockito ou Mocktail) ;
- modules optionnels : maps, géolocalisation, tracking, push, offline, caméra/médias, analytics.

## 6. Hors périmètre (de cette mission)

Le core ne doit pas contenir dans cette mission :

- projet Flutter généré, `pubspec.yaml`, code Dart, widget ou test Flutter ;
- dépendance Dart/Flutter installée ;
- design final propre à une marque projet ;
- logique métier spécifique à un produit ;
- workflow CI Flutter ;
- export de tokens UI Kit en format Dart/Flutter (mission UI Kit V3) ;
- décision définitive client API Dart (généré depuis OpenAPI ou Dio hand-written) — voir §32 ;
- décision définitive Hive vs Isar vs SharedPreferences — voir §32 ;
- décision définitive firebase_messaging vs autre SDK push — voir §32 ;
- choix maps Flutter (google_maps_flutter vs flutter_map) — voir §32.

## 7. Architecture cible

L'architecture cible adopte une structure **feature-first** avec séparation stricte des couches.

### 7.1 Couches

```txt
Couche Présentation  — Widgets, écrans, providers Riverpod UI
Couche Domaine       — Entités, use-cases, contrats (abstract classes)
Couche Données       — Repositories, datasources, modèles Freezed, client Dio
```

### 7.2 Principes

- Dart null safety strict (`dart analyze --fatal-infos`).
- Types explicites sur toutes les interfaces publiques.
- Immutabilité par défaut (Freezed pour les modèles de données).
- Un seul source de vérité par état (Riverpod provider).
- Séparation UI et logique : widgets purs sans logique métier.
- Services injectables et testables (providers Riverpod, pas de singletons globaux).
- Gestion d'erreurs explicite : types `Either` ou sealed classes `Result<T>`.
- Aucun secret dans le code ou les assets Flutter.

### 7.3 Conventions Dart

- Fichiers en `snake_case`.
- Classes en `PascalCase`.
- Variables et méthodes en `camelCase`.
- Constantes en `SCREAMING_SNAKE_CASE` ou `lowerCamelCase const`.
- Préférer `final` et `const`.
- `async`/`await` partout — pas de `.then()` en cascade.
- `sealed class` ou `freezed` pour les unions/discriminées.

## 8. Structure cible du futur starter

Structure indicative du futur starter (non créée dans cette mission) :

```txt
starters/flutter/
├── CORE_SPECIFICATION.md
├── README.md
├── pubspec.yaml              # Flutter + Dart — mission Flutter 2+
├── analysis_options.yaml     # règles lint Flutter recommandées
├── lib/
│   ├── main.dart
│   ├── app.dart              # MaterialApp.router + ThemeData Enistere
│   ├── core/
│   │   ├── api/              # client Dio, intercepteurs, erreurs
│   │   ├── auth/             # AuthController, SessionStore, tokens
│   │   ├── config/           # env, constantes, base URL
│   │   ├── errors/           # Result<T>, AppException, ErrorMapper
│   │   ├── logger/           # Logger générique + redaction
│   │   ├── navigation/       # router, guards, routes
│   │   ├── preferences/      # PreferenceStore, service
│   │   ├── storage/          # SecureStorage, adapter
│   │   ├── theme/            # ThemeData Enistere, tokens
│   │   └── upload/           # UploadService, multipart Dio
│   ├── features/             # modules fonctionnels feature-first
│   └── shared/
│       ├── models/           # modèles Freezed partagés
│       ├── widgets/          # widgets Foundation primitifs
│       │   ├── states/       # LoadingState, EmptyState, ErrorState, SuccessState
│       │   └── ...
│       └── utils/
├── test/
│   ├── unit/
│   ├── widget/
│   └── integration/
└── assets/
    ├── fonts/
    └── images/
```

## 9. Modules obligatoires V1

### 9.1 Navigation — go_router

- Routes publiques (login, splash) et protégées (app, settings).
- Guards basés sur l'état auth Riverpod : redirection automatique.
- Gestion de la session expirée (redirect vers login, conservation du returnUrl).
- Deep linking supporté dès le starter.
- Routes nommées et typées (`GoRoute`, `ShellRoute`).
- Aucune logique métier dans les définitions de routes.

**Justification** : go_router est le package de navigation officiel recommandé par l'équipe Flutter. Il remplace Navigator 2.0 directement et fournit deep linking, redirection conditionnelle et shell routes sans surcoût.

### 9.2 State management — Riverpod

- `AsyncNotifier` / `NotifierProvider` pour le server-state et les états async.
- `StateNotifier` / `StateProvider` pour les états locaux simples.
- Séparation claire : providers d'état serveur vs providers d'état UI local.
- Code generation Riverpod (`@riverpod` annotation) si retenu.
- Pas de `StatefulWidget` pour les états partagés.
- Purge des providers auth au logout (invalidation/override).
- Patterns retry/error propagation via `AsyncValue.when`.

**Justification** : Riverpod est le successeur de Provider recommandé par la communauté Flutter. Immuable, testable, sans dépendance au `BuildContext`, et compatible avec l'architecture feature-first.

### 9.3 Client HTTP — Dio

- Instance Dio configurée par environnement (base URL, timeouts).
- Intercepteur `AuthInterceptor` : injection du Bearer token depuis l'état auth.
- Intercepteur `RefreshInterceptor` : refresh sur 401 + 1 retry coalescé (pattern identique à Mobile RN `withAuthRetry`).
- Intercepteur `ErrorInterceptor` : normalisation des erreurs en `AppException` typées.
- Aucun token stocké dans l'instance Dio (injection dynamique).
- Aucun log de body/payload sensible.
- Compatible avec les contrats OpenAPI de l'API Core NestJS.

**Justification** : Dio est le standard de facto HTTP client Flutter. Il fournit intercepteurs, timeouts, annulation, upload multipart et téléchargement progressif sans surcoût.

### 9.4 Modèles immuables — Freezed + Json Serializable

- DTOs et modèles de domaine avec `@freezed` : immutabilité, `copyWith`, `==`/`hashCode`.
- Sérialisation JSON avec `@JsonSerializable` : `fromJson`/`toJson` générés.
- Sealed classes Freezed pour les unions (états, résultats, erreurs).
- Code generation via `build_runner` : artefacts `.freezed.dart` et `.g.dart`.
- Modèles alignés avec les contrats `@enistere/api-contracts` (OpenAPI).
- Aucun DTO métier projet dans le core (génériques uniquement).

**Justification** : Freezed + Json Serializable est la combinaison standard pour la sérialisation typée et immuable en Dart. Elle évite les erreurs de `==`/`hashCode` manuels et rend les modèles testables.

### 9.5 Stockage sécurisé — flutter_secure_storage

- Stockage du refresh token et des données sensibles (Keychain iOS / Keystore Android).
- Interface `SecureStorage` abstraite — testable via mock.
- Access token **en mémoire uniquement** (provider Riverpod non persisté).
- Nettoyage complet au logout.
- Aucun token dans les préférences non sécurisées, SharedPreferences ou Hive.
- Aucun token dans les logs.

**Justification** : flutter_secure_storage est le standard Expo SecureStore pour Flutter. Il utilise Keychain (iOS) et EncryptedSharedPreferences / Keystore (Android) selon la plateforme.

### 9.6 Préférences non sensibles — Hive (ou SharedPreferences)

- Stockage des préférences non sensibles : thème, langue, onboarding vu, filtres.
- Interface `PreferenceStore` abstraite — pluggable Hive ou SharedPreferences.
- Service `PreferenceService` avec gardes : clé sensible refusée, valeur sensible droppée.
- Logs `{operation, count}` uniquement — jamais clé ni valeur.
- Pattern identique au Mobile Core RN (seam + service gardes + placeholder).

**Décision Hive vs SharedPreferences** : non tranchée dans cette spécification (voir §32). Les deux satisfont ADR-015 §15 pour les données non sensibles. La décision V1 doit évaluer : synchronicité, performance, support null-safety, dépendances natives.

**Justification** : une couche persistance non sensible est nécessaire pour les préférences utilisateur (thème, langue, onboarding) qui doivent survivre à l'arrêt de l'app.

### 9.7 Thème — Material 3 contrôlé par tokens Enistere (ADR-034)

- `ThemeData` Flutter construit depuis les tokens Enistere (couleurs, typographie, radius, spacing).
- `useMaterial3: true` activé.
- `ColorScheme` mappé depuis les tokens sémantiques Enistere (primary, secondary, error, surface, onSurface…).
- `TextTheme` mappé depuis les tokens typographiques Enistere.
- Support dark/light via `ThemeMode` et `ColorScheme.fromSeed` ou palettes manuelles.
- Aucun style Material 3 par défaut non gouverné.
- `ThemeExtension` pour les tokens supplémentaires non couverts par `ThemeData` (spacing, states custom).
- `ThemeProvider` Riverpod pour le changement dynamique dark/light.

Règle : **tokens Enistere d'abord, Material 3 comme moteur, composants maison seulement si écart réel.**

### 9.8 Composants / widgets Foundation

- Widgets Foundation construits **au-dessus** de Material 3, gouvernés par les tokens Enistere.
- Primitives obligatoires : `LoadingState`, `EmptyState`, `ErrorState`, `SuccessState`.
- Widgets bouton, texte, champ saisie, formulaire Foundation si Material 3 ne suffit pas.
- Aucun logique métier dans les widgets.
- Sémantique accessibilité systématique (`Semantics`, labels, hints).
- Tailles tactiles ≥ 44 × 44 dp (standard iOS) / ≥ 48 × 48 dp (Material).

### 9.9 Formulaires et validation

- Approche préférée : `TextEditingController` + validation Dart typée, ou `reactive_forms` / `flutter_form_builder` si retenu.
- Schémas de validation alignés avec les contrats API Core (pas de réplication de DTO métier).
- Erreurs de formulaire typées et accessibles (live region / `Semantics`).
- Aucune validation client ne remplace la validation backend (identique à ADR-003 Mobile RN).

**Note** : le choix de librairie de formulaires n'est pas tranché dans cette spécification (voir §32). Les options (reactive_forms, flutter_form_builder, approche native) seront évaluées dans la mission starter.

### 9.10 Upload fichiers — Dio multipart/form-data

- Upload via `Dio.post(FormData(...))` avec `MultipartFile.fromFileSync` ou `.fromFile`.
- Boundary posé par Dio — jamais de `Content-Type` forcé manuellement.
- Aucun fichier/URI device/URL signée/token en cache, log ou store.
- Type MIME validé côté client (pré-check UX — backend reste l'autorité).
- Retry 401 via `RefreshInterceptor` — `FormData` reconstruit au retry (pas de rejeu de flux consommé).
- `FileCategoryEnum` aligné avec `@enistere/api-contracts`.
- Retourne uniquement les métadonnées publiques (`PublicStoredFileDto`).

### 9.11 Auth flow

- `AuthController` (Riverpod Notifier) : états `loading` / `authenticated` / `unauthenticated` / `refreshing` / `expired`.
- `login(email, password)` → accès token en mémoire + refresh token flutter_secure_storage.
- `logout()` → purge mémoire + flutter_secure_storage + invalidation providers Riverpod.
- `restoreSession()` → lecture refresh token → refresh API → restauration ou unauthenticated.
- `refreshSession()` → coalescé (une seule requête simultanée) → 1 retry → purge si échec.
- Guards go_router abonnés à l'état `AuthController`.
- Compatibilité API Core NestJS `/auth/login` / `/auth/refresh` / `/auth/logout`.
- Aucun token dans les logs.

### 9.12 Logger / observabilité

- Logger générique injecté (interface `AppLogger`) : `debug`/`info`/`warn`/`error`.
- **Redaction centrale** (pattern identique RN 8) : tokens/Authorization/JWT/URL signées/chemins device/PII redactés avant tout sink.
- Aucun transport réseau/persistance de logs en V1 (sink console pour debug).
- `safeErrorFields` : sérialise `AppException` sans payload sensible.
- Logs structurés : `{level, message, timestamp, requestId?}`.
- Aucun contenu utilisateur, body de requête ou réponse dans les logs.

### 9.13 Configuration par environnement

- Variables d'environnement via `dart-define` (build-time) ou `flutter_dotenv` si retenu.
- Pas de secret dans les assets ou le code source versionné.
- `AppConfig` typé : base URL API, environment (dev/staging/prod), feature flags locaux.
- Compatibilité avec EAS / `flutter build` pour builds distincts.

### 9.14 Testing setup

- `flutter_test` comme base.
- `mocktail` ou `mockito` pour les mocks Riverpod et services.
- Tests unitaires : AuthController, services, validators, utils.
- Tests widget : états loading/empty/error/success, formulaires.
- Tests d'intégration : navigation, auth flow, upload.
- Couverture de test sur auth, tokens, upload et navigation obligatoire.

## 10. Modules optionnels

Activables selon projet :

- Notifications push (Firebase Messaging ou APNs direct — ADR nécessaire).
- Maps (google_maps_flutter vs flutter_map — ADR nécessaire).
- Géolocalisation (geolocator, permission_handler).
- Caméra / médias (image_picker, camera).
- QR code scanner (mobile_scanner).
- Bottom sheet avancé (modal_bottom_sheet).
- Biométrie locale (local_auth — optionnel, ne remplace pas l'auth serveur).
- Deep linking avancé (go_router le supporte nativement).
- Analytics / crash reporting (ADR-038 / ADR-019 — sans SDK hardcodé dans le core).
- Offline sync avancée (ADR-029 futur).
- Realtime / WebSocket (ADR futur).
- i18n avancée (arb_generator, intl_utils).
- Background tasks (workmanager, background_fetch).
- In-app purchase (in_app_purchase — ADR nécessaire).

## 11. Modules futurs V3/VF

- Export automatique de tokens UI Kit en Dart (UI Kit V3 mission).
- Client Dart généré depuis l'OpenAPI spec `@enistere/api-contracts` (vs hand-written Dio).
- Encrypted local database (isar chiffré ou hive_ce AES).
- Background sync avancée.
- Multi-tenant mobile.
- App update strategy (in_app_update Android / in-app review).
- Accessibility audit tooling (flutter_accessibility_service).
- Design token sync automatique depuis UI Kit.

Ces modules nécessiteront validation roadmap et ADR si structurants.

## 12. Stack technique et décisions validées

### 12.1 Décisions validées

| Décision | ADR | Statut |
|---|---|---|
| Stack UI Flutter — Material 3 + tokens Enistere | ADR-034 | Validé |
| Design tokens source de vérité | ADR-008 | Validé |
| Stack UI mobile contrôlée (pas de librairie UI complète imposée) | ADR-010 | Validé (RN — principes applicables Flutter) |
| Auth multi-client | ADR-004 | Validé |
| Upload files contrats | ADR-007 | Validé |
| Stockage mobile sécurisé | ADR-015 | Validé |
| Logging structuré | ADR-040 | Validé (API + Mobile RN — principes applicables Flutter) |

### 12.2 Décisions pendantes (§32)

Voir §32 — à trancher dans les missions Flutter 2+ ou ADR dédiés.

## 13. Standards Dart/Flutter

- Dart null safety strict (sound null safety, `dart analyze --fatal-infos`).
- Flutter stable channel recommandé.
- `final` et `const` par défaut.
- Pas de `dynamic` sauf justification documentée.
- Imports organisés : SDK Dart / packages Flutter / packages tiers / code interne.
- `analysis_options.yaml` avec lints Flutter recommandés + règles Enistere.
- Code generation (`build_runner`) : artefacts générés non committés sans justification.
- Séparation UI, logique et données.
- Tests sur toutes les classes de service et les composants critiques.

## 14. Standards sécurité mobile Flutter

- Aucun secret dans les assets, le code source ou les variables d'environnement runtime accessibles à l'utilisateur.
- `dart-define` pour les valeurs build-time (non accessible au runtime JS comme les EXPO_PUBLIC).
- Access token **en mémoire** (provider Riverpod non persisté).
- Refresh token dans flutter_secure_storage (Keychain/Keystore).
- Aucun token dans les logs (redaction centrale).
- Aucun token dans SharedPreferences, Hive ou cache non sécurisé.
- HTTPS obligatoire en production.
- Certificate pinning si exigé par le projet (hors scope V1 Foundation).
- Logout : purge mémoire + stockage sécurisé + invalidation providers.
- Permissions natives déclarées et justifiées dans `AndroidManifest.xml` et `Info.plist`.
- Validation client = pré-check UX uniquement ; le backend reste l'autorité finale.
- Logs : jamais de body de requête/réponse, token, URL signée, chemin device ou PII.
- Screenshots sensibles : `FLAG_SECURE` Android / `ignoresScreenCapture` iOS si nécessaire.

## 15. Navigation — go_router

La navigation cible repose sur **go_router** (package officiel Flutter team).

Exigences :

- Route publique (login, splash, not-found).
- Route protégée (shell route application).
- Guard auth : rediriger vers login si `unauthenticated`/`expired`.
- Redirection post-login vers `returnUrl` (interne uniquement — anti open-redirect).
- Gestion session expirée : redirection vers login + conservation de l'URL cible.
- Transitions personnalisables par route.
- Deep linking natif iOS/Android via go_router.
- Routes nommées constantes (`AppRoutes` class avec `static const`).
- Aucune logique métier dans les fichiers de route.

## 16. Authentification mobile

L'auth mobile doit fournir :

- Login (email + mot de passe) via API Core `POST /auth/login`.
- Logout via API Core `POST /auth/logout` (si supporté) + purge locale.
- Refresh token via API Core `POST /auth/refresh`.
- Restauration de session au démarrage (`restoreSession` avec refresh token persisté).
- État auth global via `AuthController` Riverpod.
- Gestion d'erreurs auth typées (`InvalidCredentials`, `SessionExpired`, `NetworkError`).
- Aucun workflow métier d'inscription dans le core.
- Compatibilité API Core NestJS (headers Bearer, refresh token HTTP response).

## 17. Gestion des tokens

- **Access token** : en mémoire uniquement (provider Riverpod non persisté).
- **Refresh token** : flutter_secure_storage (Keychain iOS / EncryptedSharedPreferences Android).
- Refresh automatique sur 401 (`RefreshInterceptor` Dio) : coalescé, 1 retry, puis purge.
- Expiration : vérification avant requête si possible.
- Suppression complète au logout (mémoire + stockage sécurisé).
- Aucun token dans les logs, les modèles Freezed partagés, les préférences ou le cache non sécurisé.
- Aucun token dans les providers Riverpod persistés.

## 18. Stockage sécurisé

- **flutter_secure_storage** pour données sensibles (refresh token, données hautement sensibles).
  - iOS : Keychain avec `kSecAttrAccessibleWhenUnlocked`.
  - Android : EncryptedSharedPreferences (API 23+) ou Keystore.
  - Interface abstraite `SecureStorage` testable par mock.
- **Hive ou SharedPreferences** pour données non sensibles (thème, langue, onboarding).
  - Interface abstraite `PreferenceStore` — décision Hive vs SharedPreferences à trancher (§32).
  - Service `PreferenceService` avec gardes (clé sensible refusée, valeur sensible droppée).
  - Pattern identique au Mobile Core RN `src/preferences`.
- Séparation stricte données sensibles (SecureStorage) / non sensibles (PreferenceStore) / état UI (Riverpod in-memory).

## 19. Client API — Dio

L'intégration API Core doit fournir :

- Instance Dio centralisée par environnement (base URL, headers communs, timeout).
- `AuthInterceptor` : injection du Bearer token (access token depuis `AuthController`).
- `RefreshInterceptor` : détection 401 → refresh coalescé → retry → purge.
- `ErrorInterceptor` : mapping `DioException` vers `AppException` typée (401, 403, 404, 413, 415, 422, 429, 5xx).
- `LoggingInterceptor` : logs avec redaction (pas de body, pas de token).
- DTOs Freezed + Json Serializable alignés avec les contrats OpenAPI de l'API Core.
- Aucun endpoint métier dans le core (seuls les endpoints Foundation : auth, files, health).

**Note — Client Dart vs OpenAPI génération** : la décision entre (a) écrire une couche Dio hand-written typée ou (b) générer un client Dart depuis `@enistere/api-contracts` (openapi_generator, retrofit.dart) n'est pas tranchée dans cette spécification (voir §32). Les deux approches doivent satisfaire les mêmes exigences de sécurité (pas de token dans les logs, pas de DTO métier dans le core).

## 20. Stratégie upload fichiers

- Upload via `Dio.post` avec `FormData` et `MultipartFile`.
- Boundary posé par Dio (jamais de `Content-Type: multipart/form-data` forcé manuellement).
- `UploadService` abstrait : `upload(file, category, {subjectId?})`.
- `AppFile` descriptor : `{path: String, name: String, mimeType: String}` — agnostique plateforme.
- Helper `describeFileForLog` → `{mimeType, extension}` uniquement (jamais le chemin ou le nom brut).
- Aucun fichier/URI/URL signée/token en cache Riverpod persisté, log ou préférence.
- Retry sur 401 via `RefreshInterceptor` : `MultipartFile` reconstruit au retry (pas de rejeu de stream consommé).
- Erreurs upload typées : 413 (trop volumineux), 415 (type non supporté).
- Retourne uniquement les métadonnées publiques (`PublicStoredFileDto`).
- Validation taille/MIME côté client = pré-check UX — backend reste l'autorité.

## 21. State management — Riverpod

Architecture Riverpod :

- `AsyncNotifierProvider` : états async avec loading/data/error (`AsyncValue<T>`).
- `NotifierProvider` : états synchrones complexes.
- `StateProvider` : états locaux simples.
- `Provider` : dépendances injectées (logger, config, services).
- Pas de `StatefulWidget` pour les états partagés ou cross-widget.
- Purge au logout : `ref.invalidate(authProvider)` + invalidation des providers dépendants.
- Séparation server-state (async, sync avec API) et état local UI (synchrone, in-memory).
- Aucun token/payload serveur stocké dans les providers Riverpod (transient uniquement).

## 22. Formulaires et validation

Exigences :

- Validation typée avec des règles Dart (pas de réplication de schémas backend).
- Erreurs accessibles : affichées sous le champ, annotées avec `Semantics`.
- Désactivation submit pendant le chargement (`isLoading` state).
- Confirmation pour actions destructives.
- Aucun appel réseau dans les validators synchrones.

Choix de librairie non tranché (§32) : approche native `TextEditingController` + validateurs Dart, `reactive_forms` ou `flutter_form_builder`.

## 23. Thème et UI — Material 3 contrôlé (ADR-034)

Exigences (ADR-034) :

- `ThemeData` avec `useMaterial3: true`.
- `ColorScheme` mappé depuis les tokens couleur Enistere (primary, secondary, tertiary, error, surface, onSurface, outline, shadow…).
- `TextTheme` mappé depuis les tokens typographiques Enistere (fontFamily, sizes, weights, letterSpacing).
- `ThemeExtension<EnistereTheme>` pour les tokens supplémentaires : spacing, radius custom, états UI.
- Support dark/light : deux `ThemeData` (light/dark) construits depuis les mêmes tokens.
- `ThemeMode.system` par défaut.
- Widgets Foundation créés uniquement si Material 3 ne satisfait pas fidèlement les tokens Enistere.
- Aucun style Material 3 par défaut non gouverné (ex. `ElevatedButton` doit refléter les tokens Enistere).
- Inspection automatique en revue : vérifier que les couleurs/typos viennent du ThemeData, pas hardcodées.

Les tokens Enistere restent la source de vérité. Le `ThemeData` Flutter est l'adaptateur.

## 24. États UI

Widgets Foundation obligatoires (pattern identique Mobile RN / Web Core) :

- `LoadingState` — indicateur de chargement générique.
- `EmptyState(title, description?, action?)` — état vide.
- `ErrorState(title, description?, onRetry?)` — état erreur.
- `SuccessState(title, description?, action?)` — état succès.
- `MessageState(title, description?, action?)` — message informatif.

Ces widgets doivent respecter les tokens Enistere et les exigences d'accessibilité.

## 25. Logger / observabilité

- `AppLogger` interface injectée (pas de `print()` dans le code de production).
- Implémentation V1 : sink console avec structuration minimale `{level, message, timestamp}`.
- **Redaction** : avant tout sink, filtrer Bearer/JWT/tokens/URL signées/chemins device/PII/emails.
- `safeExceptionFields(AppException)` : corrélation + code d'erreur — jamais message brut sensible.
- Pas de transport réseau ou de persistance de logs en V1 Foundation.
- Logs structurés extensibles vers Sentry / Datadog / Firebase Crashlytics en V3/VF (selon ADR-019).

## 26. Accessibilité

- `Semantics` sur tous les widgets interactifs (boutons, champs, liens).
- `MergeSemantics` pour les widgets composites.
- Labels et hints explicites pour les lecteurs d'écran (VoiceOver / TalkBack).
- Tailles tactiles ≥ 44 × 44 dp (iOS) / ≥ 48 × 48 dp (Material).
- Contrastes couleur WCAG AA minimum (3:1 pour les textes normaux, 4.5:1 recommandé).
- États disabled/focused/error/loading visibles sans couleur seule.
- Tests d'accessibilité avec `tester.setAccessibility()` dans les widget tests.

## 27. Internationalisation

- `flutter_localizations` comme base.
- Fichiers ARB (`app_en.arb`, `app_fr.arb`) pour les chaînes.
- `intl_utils` ou `flutter gen-l10n` pour la génération.
- Clé `languageCode` persistée dans les préférences non sensibles.
- Support minimal : français (fr) + anglais (en).
- Aucune donnée sensible dans les fichiers ARB.

## 28. Configuration par environnement

- Valeurs build-time via `--dart-define=KEY=value` (Flutter CLI / EAS).
- Pas de `.env` dans les assets (lisible à l'extraction de l'APK/IPA).
- `AppConfig` sealed class ou record : `apiBaseUrl`, `environment`, `logLevel`.
- Valeurs publiques uniquement (jamais de clé API secrète dans le code mobile).
- Séparation `dev` / `staging` / `prod`.

## 29. Critères de validation V1 Flutter

```txt
- L'app démarre avec Flutter sur iOS et Android
- La navigation go_router fonctionne (public + protégé + guards)
- Le flow auth est prêt (login / logout / refresh / session restore)
- Les tokens sont correctement stockés (access en mémoire, refresh SecureStorage)
- Les appels API Dio fonctionnent (health, auth)
- L'upload multipart fonctionne via Dio
- Les états UI loading/empty/error/success existent et respectent les tokens Enistere
- Le thème Material 3 Enistere est appliqué (ThemeData depuis tokens)
- Les formulaires de base fonctionnent (login)
- Les tests unitaires et widget couvrent auth, tokens, upload et navigation
- L'app tourne localement sur simulateur iOS et émulateur Android
```

## 30. Missions ordonnées

| # | Mission | Livrable | Prérequis |
|---|---|---|---|
| Flutter 1 | Core specification (CETTE MISSION) | `CORE_SPECIFICATION.md` + `README.md` | ADR-034 validé |
| Flutter 2 | Starter minimal Flutter | `pubspec.yaml` + `lib/main.dart` + structure `lib/` + `MaterialApp.router` + `ThemeData` Enistere | Flutter 1 |
| Flutter 3 | Auth flow + tokens + navigation | `AuthController` Riverpod + go_router guards + SecureStorage + login screen | Flutter 2 |
| Flutter 4 | Client Dio + server-state | `DioClient` + intercepteurs + modèles Freezed + health/auth providers | Flutter 3 |
| Flutter 5 | Upload multipart | `UploadService` Dio + `AppFile` descriptor + états upload | Flutter 4 |
| Flutter 6 | Smoke tests iOS + Android | Tests flutter_test + intégration + rapport | Flutter 5 |
| Flutter V1 | Readiness review | Rapport V1 Readiness | Flutter 6 |

## 31. Cohérence avec Mobile Core React Native

Le Mobile Core Flutter partage les **intentions** du Mobile Core React Native, pas l'implémentation :

| Intention | React Native | Flutter |
|---|---|---|
| Tokens de design | `useTheme()` + tokens Enistere | `ThemeData` Enistere (ADR-034) |
| Navigation | Expo Router (`app/` file-based) | go_router |
| Server-state | TanStack Query | Riverpod `AsyncNotifierProvider` |
| État local | Zustand | Riverpod `NotifierProvider` / `StateProvider` |
| Auth | `AuthEngine` + `AuthProvider` | `AuthController` Riverpod |
| HTTP | `@enistere/api-client-fetch` | Dio + intercepteurs |
| Stockage sécurisé | `expo-secure-store` | `flutter_secure_storage` |
| Upload | `useUploadMutation` Fetch + FormData | `UploadService` Dio + MultipartFile |
| Logger + redaction | `createLogger` + `redactString` | `AppLogger` + redaction Dart |
| Préférences | `PreferenceStore` seam + service | `PreferenceStore` seam + service |
| Tests | `node --test` + typecheck | `flutter_test` + `dart analyze` |
| Smoke | `smoke-android.js` | `flutter drive` ou `integration_test` |

Les deux cores mobiles doivent rester comparables en termes de sécurité, d'accessibilité et d'états UI. Ils n'ont pas besoin d'une implémentation identique.

## 32. Décisions pendantes

Ces décisions seront tranchées dans les missions Flutter 2+ ou par ADR dédié :

| Décision | Options | Impact |
|---|---|---|
| Client API Dart | (a) Dio hand-written typé ; (b) openapi_generator Dart depuis `@enistere/api-contracts` ; (c) retrofit.dart | Missions Flutter 3-4 |
| Préférences non sensibles | Hive vs SharedPreferences vs Isar | Mission Flutter 2 |
| Librairie formulaires | reactive_forms vs flutter_form_builder vs natif Dart | Mission Flutter 2 |
| Notifications push | firebase_messaging vs APNs direct — ADR-019 Flutter | Mission optionnelle |
| Analytics / crash | Sentry Flutter vs Firebase vs autre — ADR-019/038 | Mission optionnelle |
| Maps Flutter | google_maps_flutter vs flutter_map — ADR future | Mission optionnelle |
| Biométrie | local_auth — conditions + fallback | Mission optionnelle |
| Code gen Riverpod | `@riverpod` annotations vs manuel | Mission Flutter 2 |
| Export tokens UI Kit → Dart | UI Kit V3 mission | UI Kit V3 |
| CI Flutter | GitHub Actions `flutter test` + `flutter build` | Flutter 6+ |
| Distribution | EAS Build équivalent (`flutter build ios/apk/aab`) | Flutter V1 |
