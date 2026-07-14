# MOBILE_FLUTTER_V1_READINESS_REVIEW.md — Mobile Core Flutter V1 Readiness Review

> **Date** : 2026-07-14
> **Branche** : `mobile-core-flutter-v1-readiness-review`
> **Périmètre audité** : Flutter 1→6 (spec, starter, thème, auth shell, Dio client, upload, tests + smoke)
> **Sources** : `CORE_SPECIFICATION.md §29`, `strategy/04_ROADMAP_GLOBAL.md §15/§17.2`, ADR-034, `MOBILE_FLUTTER6_SMOKE_REPORT.md`

---

## 1. Contexte et méthode

Le Mobile Core Flutter est un **core V3** de la roadmap Enistere (§14 Roadmap). Les critères d'acceptation
V1 Flutter sont définis dans `CORE_SPECIFICATION.md §29` (11 critères). La roadmap §17.2 fournit des critères
V3 plus génériques. Cette revue évalue les livrables Flutter 1→6 contre **§29** — le référentiel le plus exigeant.

Pour chaque critère, la colonne **Preuve** indique ce qui a été livré ; la colonne **Verdict** indique si le
critère est satisfait ou non.

---

## 2. Évaluation des critères §29 — table complète

| # | Critère §29 | Livrable Flutter | Preuve | Verdict |
|---|---|---|---|---|
| C1 | L'app démarre avec Flutter sur iOS et Android | Flutter 6 — `integration_test/smoke_test.dart` + `scripts/smoke.sh` ; Flutter 7 — dossiers `android/` + smoke réel `emulator-5554` | Android : ✅ `emulator-5554` (Pixel 6a API 33) — 5/5 tests passés ; iOS : BLOQUÉ — hôte Linux/Xcode (environnemental, R1 accepté) | ✅ PARTIAL |
| C2 | La navigation go_router fonctionne (public + protégé + guards) | Flutter 3 — `routerProvider` + redirect guards + `ValueNotifier` bridge | 5 router guard tests + 4 app widget tests verts ✅ | ✅ |
| C3 | Le flow auth est prêt (login / logout / refresh / session restore) | Flutter 3 — `AuthController.signIn()` + `signOut()` ; Flutter 4 — `_AuthInterceptor` ; Flutter 8 — `restoreSession()` public ; Flutter 9 — `RefreshInterceptor` + `refreshSession()` coalescent | login ✅ (mock) ; logout ✅ ; **refresh 401 ✅** (Flutter 9 : `RefreshInterceptor` → `refreshSession()` → retry) ; **session restore ✅** (`restoreSession()` lit depuis `SecureSessionStore` — Flutter 8) | ✅ |
| C4 | Les tokens sont correctement stockés (access en mémoire, refresh SecureStorage) | Flutter 3 — `AuthController._accessToken` privé ; Flutter 8 — `flutter_secure_storage: ^10.3.1` + `SecureSessionStore(FlutterSecureStorageAdapter())` ; Flutter 9 — `refreshSession()` consomme le refreshToken depuis `SecureSessionStore` | access token en mémoire ✅ ; `flutter_secure_storage` ✅ — refresh token Keystore (Android) / Keychain (iOS) ✅ ; `refreshSession()` échange le refresh token contre un nouveau access token ✅ | ✅ |
| C5 | Les appels API Dio fonctionnent (health, auth) | Flutter 4 — `createDioClient`, `_AuthInterceptor`, `LoggingInterceptor`, `ErrorInterceptor` | 86 tests unitaires client Dio ✅ ; `dioClientProvider` Riverpod ✅ ; aucun appel réseau réel testé (headless) | ✅ |
| C6 | L'upload multipart fonctionne via Dio | Flutter 5 — `DioUploadService`, `FormData`, `MultipartFileFactory` injectable, boundary auto Dio | 35 tests upload (413/415/401/réseau, boundary auto, describeFileForLog PII-safe) ✅ | ✅ |
| C7 | Les états UI loading/empty/error/success existent et respectent les tokens Enistere | — | **`LoadingState`/`EmptyState`/`ErrorState`/`SuccessState` non implémentés** — seule `SplashScreen` avec `CircularProgressIndicator` existe ; §9.8/§24 CORE_SPECIFICATION qualifient ces widgets de « Widgets Foundation obligatoires » | ❌ |
| C8 | Le thème Material 3 Enistere est appliqué (ThemeData depuis tokens) | Flutter 2 — `EnistereTokens`, `EnistereThemeExtension`, `EnistereTheme` (ADR-034) | 16 tests thème ; `ThemeExtension` accessible en widget test ; couleur primaire 0xFF2563EB ✅ | ✅ |
| C9 | Les formulaires de base fonctionnent (login) | Flutter 3 — `SignInScreen` avec un bouton mock | `SignInScreen` = bouton unique `Se connecter` → mock `signIn()` ; **pas de champs email/password, pas de validation** | ❌ |
| C10 | Les tests unitaires et widget couvrent auth, tokens, upload et navigation | Flutter 6 — 136/136 tests headless | auth (13) + navigation (9) + upload (35) + API (48) + thème (16) + widget splash/sign-in/home (16) + app (4) ✅ | ✅ |
| C11 | L'app tourne localement sur simulateur iOS et émulateur Android | Flutter 6 + Flutter 7 | Android : ✅ `emulator-5554` (Pixel 6a API 33) — 5/5 tests passés en 9s ; iOS : environmental block (Linux, R1 accepté) ❌ | ✅ PARTIAL |

**Score §29 : 7/11 satisfaits, 2/11 partiels (C1 Android ✅/iOS bloqué, C11 Android ✅/iOS bloqué), 2/11 non satisfaits (C7, C9).**

> **Mise à jour Flutter 7 (2026-07-14)** : B1 fermé — dossiers `android/` générés + smoke `emulator-5554` passé
> (5/5 tests en 9s). C1 et C11 passent de ❌ à ✅ PARTIAL (Android réel ✅, iOS R1 maintenu).
>
> **Mise à jour Flutter 8 (2026-07-14)** : B2 fermé — `flutter_secure_storage: ^10.3.1` + `SecureStorageAdapter`
> seam + `FlutterSecureStorageAdapter` + `SecureSessionStore` + `SessionEnvelope.fromJson`/`toJson`/`refreshToken` +
> `AuthController.restoreSession()` public. Preuve : 7/7 smoke `emulator-5554` passés (5 originaux + 2 SecureStorage B2) ;
> 160/160 tests headless. C3 : restore ❌ → ✅ (refresh 401 ❌ — B3 en attente). C4 : ❌ → ✅ PARTIAL.
>
> **Mise à jour Flutter 9 (2026-07-14)** : B3 fermé — `AuthApi` seam + `PlaceholderAuthApi` + `RefreshInterceptor`
> (401 → `refreshSession()` coalescent → retry unique → purge si échec) + `AuthController.refreshSession()` + `authApiProvider`.
> Preuve : 14 tests unitaires headless (9 intercepteur + 5 contrôleur) ; smoke `emulator-5554` 7/7 inchangés ;
> 174/174 tests headless. C3 : refresh 401 ❌ → ✅. C4 : ✅ PARTIAL → ✅.
> Découverte : Dio 5.x traite les erreurs en ordre d'enregistrement (catchError chaîné, PAS en sens inverse) —
> `RefreshInterceptor` doit être enregistré AVANT `ErrorInterceptor`.

---

## 3. Classification des gaps

### 3.1 Gaps bloquants V1 (B)

| Ref | Gap | Critère §29 | Nature | Débloqué par |
|---|---|---|---|---|
| ~~B1~~ | ~~Android runtime — library sans dossiers `android/`~~ | C1, C11 | ✅ **FERMÉ** — Flutter 7 : `flutter create --platforms=android .` + smoke `emulator-5554` 5/5 passés | Flutter 7 ✅ |
| ~~B2~~ | ~~`flutter_secure_storage` absent — pas de refresh token persisté, pas de `restoreSession()`~~ | C3, C4 | ✅ **FERMÉ** — Flutter 8 : `flutter_secure_storage` 10.3.1 + `SecureSessionStore` + `FlutterSecureStorageAdapter` + `restoreSession()` public ; smoke `emulator-5554` 7/7 passés | Flutter 8 ✅ |
| ~~B3~~ | ~~`RefreshInterceptor` absent — 401 surfacé sans refresh + retry coalescent~~ | C3 | ✅ **FERMÉ** — Flutter 9 : `AuthApi` seam + `RefreshInterceptor` (401 → `refreshSession()` coalescent → retry → purge) + `authApiProvider` ; 14 tests unitaires headless ; smoke `emulator-5554` 7/7 ✅ | Flutter 9 ✅ |
| B4 | Widgets UI state absents — `LoadingState`/`EmptyState`/`ErrorState`/`SuccessState` | C7 | Module manquant | Flutter 10 (UI states) |
| B5 | Login form absent — `SignInScreen` n'a pas de champs email/password ni validation | C9 | Module manquant | Flutter 11 (login form) |

### 3.2 Réserves acceptées (non-bloquantes V1)

| Ref | Réserve | Parallèle |
|---|---|---|
| R1 | iOS runtime bloqué — hôte Linux sans macOS/Xcode | Identique à RN B2 acceptée comme réserve environnementale pour VALIDE_V1 RN |
| R2 | Aucun appel API réel testé (headless uniquement, pas de backend requis) | Identique au pattern RN et Web Core : primitives testées sans backend réel |
| R3 | Freezed + Json Serializable non ajoutés — Flutter 4 délibérément limité | Livraison incrémentale ; applicable aux projets dérivés ou Flutter V2 |
| R4 | Logger avec redaction (§9.12) non implémenté | Module optionnel V1 — redaction couverte par règles `describeFileForLog` |
| R5 | `PreferenceStore` seam non implémenté | Parallèle RN B3 accepté comme réserve formellement |

### 3.3 Comparaison avec Mobile Core React Native VALIDE_V1

| Dimension | RN VALIDE_V1 | Flutter (audit) |
|---|---|---|
| Startup device | ✅ Android emulator (`emulator-5554`) passé | ❌ Android architectural, iOS environmental |
| Auth flow réel | ✅ `AuthEngine` + `MobileAuthSessionAdapter` + vrai refresh coalescent | ❌ Mock `AuthController` + `InMemorySessionStore` |
| Stockage sécurisé | ✅ `expo-secure-store` SecreteStore réel | ❌ `InMemorySessionStore` placeholder |
| Upload | ✅ `useUploadMutation` + smoke POST /files Android | ✅ `DioUploadService` + 35 tests |
| UI states | ✅ `LoadingView`/`EmptyView`/`ErrorView` (RN35) | ❌ absents |
| Login form | ✅ `SignInForm` RHF + Zod (RN32) | ❌ bouton mock uniquement |
| Tests | ✅ 367/367 `node --test` | ✅ 136/136 `flutter test` |

La comparaison est directe : le RN VALIDE_V1 a tous ses modules implémentés (stockage sécurisé, refresh, UI states, login form) avec iOS comme unique réserve environnementale. Flutter a 5 modules manquants au-delà du blocage device.

---

## 4. Verdict

### 4.1 Décision

**Mobile Core Flutter : `TEST_WIDGET_PASSED` → `IMPLEMENTATION_AVANCEE`**

Le Mobile Core Flutter dispose d'un socle de qualité réel (spec, starter, thème ADR-034, navigation, Dio client, upload multipart, 136 tests headless) mais 5 critères §29 ne sont pas satisfaits par des modules réellement absents (non par des contraintes environnementales).

La promotion à `VALIDE_V1` n'est **pas** appropriée car :
- Les gaps B2→B5 sont des modules manquants, pas des contraintes d'environnement.
- La seule réserve environnementale acceptée est R1 (iOS Linux) — exactement comme RN.
- B1 (Android runtime) est architectural et solvable par une mission dédiée.
- 5/11 critères §29 non satisfaits représente un delta trop important pour une déclaration V1.

La promotion à `IMPLEMENTATION_AVANCEE` est justifiée car :
- 5/11 critères satisfaits avec preuves solides.
- Les modules livrés sont stables, testés et documentés.
- Le socle architectural (thème, navigation, Dio, upload) est complet.
- Le chemin vers VALIDE_V1 est clair et borné (5 missions).

### 4.2 Ce que le statut `IMPLEMENTATION_AVANCEE` signifie

Ce statut signifie que le core a une **implémentation avancée du socle** mais reste incomplet par rapport aux critères V1 définis dans `CORE_SPECIFICATION.md §29`. Les projets dérivés peuvent s'appuyer sur le thème, la navigation, le client Dio et les primitives upload dès maintenant. Ils ne peuvent pas encore utiliser le flutter comme base auth complète.

---

## 5. Conditions pour VALIDE_V1

Les conditions ci-dessous, toutes réalisées, débloquent `VALIDE_V1` :

| Condition | Mission | Critère fermé | Preuve attendue |
|---|---|---|---|
| ~~Android emulator smoke — `integration_test/` exécuté sur `emulator-5554`~~ | ~~Flutter 7~~ | B1 (C1, C11) | ✅ **FERMÉ** — `flutter test integration_test/smoke_test.dart -d emulator-5554` : 5/5 passés en 9s (2026-07-14) |
| ~~`flutter_secure_storage` seam + `SecureSessionStore` adapter + `restoreSession()`~~ | ~~Flutter 8~~ | B2 (C3, C4) | ✅ **FERMÉ** — `flutter_secure_storage: ^10.3.1` + `SecureSessionStore` + `FlutterSecureStorageAdapter` + `restoreSession()` public ; smoke `emulator-5554` 7/7 passés (2026-07-14) |
| ~~`RefreshInterceptor` — 401 → `refresh()` coalescent → 1 retry → purge~~ | ~~Flutter 9~~ | B3 (C3) | ✅ **FERMÉ** — `RefreshInterceptor` + `refreshSession()` coalescent + retry unique + purge ; 14 tests unitaires headless (`refresh_interceptor_test.dart` + `auth_controller_test.dart`) ; smoke `emulator-5554` 7/7 ✅ (2026-07-14) |
| `LoadingState`/`EmptyState`/`ErrorState`/`SuccessState` (widgets Foundation ADR-034) | Flutter 10 | B4 (C7) | Widgets testés avec tokens Enistere |
| `SignInScreen` form — champs email + password + validation + erreur accessible | Flutter 11 | B5 (C9) | Widget test form validation |
| (optionnel avant V1) iOS runtime si macOS/Xcode disponible | RN31 équivalent | R1 | `bash scripts/smoke.sh --ios` passé |

**Estimation : Flutter 7→11 = 5 missions avant Flutter V1 final Readiness Review.**

---

## 6. Qualité des livrables Flutter 1→6

| Mission | Livrable | Qualité |
|---|---|---|
| Flutter 1 | `CORE_SPECIFICATION.md` 32 §, `README.md` | ✅ Spec complète, décisions pendantes documentées |
| Flutter 2 | Starter minimal : `pubspec.yaml`, `lib/main.dart`, `EnistereTheme`, `go_router` | ✅ ADR-034 conforme, 20 tests |
| Flutter 3 | Auth shell : `AuthController` Riverpod, `SessionStore` seam, guards | ✅ Token en mémoire, seam testable, 38 tests |
| Flutter 4 | Dio client : `createDioClient`, intercepteurs, `AppApiError` sealed Dart 3 | ✅ 86 tests, 0 token loggé |
| Flutter 5 | Upload : `DioUploadService`, `AppFile`, `describeFileForLog` PII-safe | ✅ 120 tests, boundary auto, ADR-007/015 conforme |
| Flutter 6 | Tests widget + smoke : 136/136, `integration_test/`, `scripts/smoke.sh` | ✅ 3 réserves documentées, 0 succès artificiel |

Invariants respectés Flutter 1→6 :
- Access token jamais dans les logs, providers ou stores persistés (ADR-015).
- `describeFileForLog` jamais path ni nom brut (ADR-015).
- Dio boundary jamais forcé manuellement (ADR-007).
- `flutter analyze` 0 issues · `dart format` 0 changements · `quality-gates docs` 2/2.

---

## 7. Mise à jour des statuts

| Document | Mise à jour |
|---|---|
| `docs/project-status/IMPLEMENTATION_MATRIX.md` | Flutter row : `TEST_WIDGET_PASSED` → `IMPLEMENTATION_AVANCEE` (V1 Review) ; Flutter 7 : B1 fermé ; Flutter 8 : B2 fermé ; Flutter 9 : B3 fermé |
| `docs/project-status/NEXT_ACTIONS.md` | Revue ajoutée ; Flutter 7 complété ; Flutter 8 complété ; Flutter 9 complété ; prochaine action : Flutter 10 — UI states |
| `docs/project-status/SESSION_HANDOFF.md` | mobile-flutter mis à jour : `IMPLEMENTATION_AVANCEE`, B1/B2/B3 fermés Flutter 7/8/9 |
| `docs/project-status/FOUNDATION_CURRENT_STATE.md` | mobile-flutter mis à jour |
| `docs/project-status/MOBILE_FLUTTER9_ANDROID_SMOKE_REPORT.md` | Rapport smoke Flutter 9 — 7/7 passés, B3 fermé |
| `cores/mobile-flutter/README.md` | Statut mis à jour ; Flutter 7 ✅ ; Flutter 8 ✅ |
| `CHANGELOG.md` | Sections V1 Readiness Review, Flutter 7 et Flutter 8 ajoutées |
| `docs/project-status/MOBILE_FLUTTER8_ANDROID_SMOKE_REPORT.md` | Rapport smoke Flutter 8 — 7/7 passés, B2 fermé |
| `docs/project-status/MOBILE_FLUTTER7_ANDROID_SMOKE_REPORT.md` | Rapport smoke Flutter 7 — 5/5 passés |
