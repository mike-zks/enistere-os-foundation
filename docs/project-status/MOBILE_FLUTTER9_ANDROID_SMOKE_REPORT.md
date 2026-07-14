# MOBILE_FLUTTER9_ANDROID_SMOKE_REPORT.md — Flutter 9 Android Smoke Report

> **Date** : 2026-07-14
> **Branche** : `mobile-core-flutter-9-refresh-interceptor`
> **Mission** : Mobile Core Flutter 9 — RefreshInterceptor 401 coalescent (B3)
> **Objectif** : Fermer B3 (C3) du rapport `MOBILE_FLUTTER_V1_READINESS_REVIEW.md`

---

## 1. Contexte — pourquoi B3 existait

Le Mobile Core Flutter avait un client Dio avec `_AuthInterceptor`, `LoggingInterceptor` et `ErrorInterceptor`
mais aucun mécanisme de refresh 401. Une réponse 401 était surfacée immédiatement comme `UnauthorizedError`
sans aucune tentative de renouvellement du token d'accès. `AuthController.refreshSession()` n'existait pas.
Le refresh token stocké dans `SecureSessionStore` (B2) n'était jamais consommé côté client API.

---

## 2. Livrable Flutter 9 — RefreshInterceptor + coalescence

### Nouveaux fichiers

| Fichier | Contenu |
|---|---|
| `lib/src/core/auth/auth_api.dart` | `AuthApi` interface abstraite + `PlaceholderAuthApi` (Foundation V1) |
| `lib/src/core/api/refresh_interceptor.dart` | `RefreshInterceptor` : intercepte 401, délègue refresh, retry unique, guard anti-boucle |
| `test/unit/api/refresh_interceptor_test.dart` | 9 tests unitaires (adapter MockHttpAdapter) |

### Fichiers modifiés

| Fichier | Changement |
|---|---|
| `lib/src/core/auth/auth_controller.dart` | `authApiProvider` + `refreshSession()` coalescent + `_doRefresh()` + `_purgeSession()` |
| `lib/src/core/api/dio_client.dart` | `TokenRefresher` typedef + paramètre `refresher?` optionnel + `RefreshInterceptor` dans la chaîne |
| `lib/src/core/api/dio_provider.dart` | `refresher: controller.refreshSession` câblé dans `dioClientProvider` |
| `test/unit/auth/auth_controller_test.dart` | `FakeAuthApi` + `makeContainer(authApi:)` + 5 nouveaux tests `refreshSession()` |

### Architecture B3

```
AuthApi (abstract interface)
├── PlaceholderAuthApi   ← Foundation V1 (pas de backend réel requis)
└── (real implementation) ← projets dérivés : POST /auth/refresh

AuthController
├── authApiProvider      ← injectable en tests
├── _refreshFuture       ← coalescence : 1 seul refresh en vol simultanément
├── refreshSession()     ← appelé par RefreshInterceptor ; retourne null si échec
├── _doRefresh()         ← lit refreshToken, appelle AuthApi, met à jour _accessToken
└── _purgeSession()      ← clear store + _accessToken = null + état unauthenticated

Dio interceptors (ordre d'enregistrement → ordre d'erreur Dio 5.x):
  _AuthInterceptor → LoggingInterceptor → RefreshInterceptor → ErrorInterceptor

Flux erreur 401 :
  401 raw → _AuthInterceptor.onError (next) → LoggingInterceptor.onError (log + next)
  → RefreshInterceptor.onError → refreshSession() → _AuthInterceptor injecte nouveau token
  → dio.fetch(retry, _refreshed=true) → 200 OK → handler.resolve
  Si retry → 401 : guard _refreshed=true → next → ErrorInterceptor → UnauthorizedError
  Si refreshToken absent / refresh échoue → next → ErrorInterceptor → UnauthorizedError
  Si 403 ou autre : RefreshInterceptor next → ErrorInterceptor → ForbiddenError / etc.
```

### Découverte clé : ordre des intercepteurs Dio 5.x

Dio 5.x traite les erreurs dans l'**ordre d'enregistrement** (via `catchError` chaîné), PAS en sens
inverse. `handler.next(err)` passe à l'intercepteur suivant ; `handler.reject(err)` termine la chaîne.
`RefreshInterceptor` doit donc être enregistré **avant** `ErrorInterceptor`, contrairement à ce que les
docs Dio <5.x pouvaient laisser entendre.

### Invariants ADR-015 respectés

- Access token jamais dans logs, state, exceptions, providers persistants.
- Refresh token jamais dans logs ou `AuthState`.
- `refreshSession()` retourne `null` (pas d'exception) — le caller ne peut pas extraire le token via
  une exception.
- `_doRefresh()` purge le store et met `_accessToken = null` avant tout retour null.

---

## 3. Résultats des gates qualité

### flutter pub get

```
Got dependencies!
```

### flutter analyze

```
Analyzing mobile-flutter...
No issues found! (ran in 1.5s)
```

### flutter test (174/174 headless)

```
00:07 +174: All tests passed!
```

14 nouveaux tests (+9 `refresh_interceptor_test.dart` + 5 `auth_controller_test.dart` `refreshSession()`)
+ 160 tests inchangés = 174 total.

### dart format --set-exit-if-changed .

```
Formatted 45 files (0 changed) in 0.15 seconds.
exit=0
```

### git diff --check

```
(aucune sortie — pas d'espace blanc de fin)
```

### quality-gates docs

```
✅ 2/2 gate(s) passé(s) — docs
```

---

## 4. Smoke Android — integration_test (7 tests)

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
Running Gradle task 'assembleDebug'...                             55.0s
✓ Built build/app/outputs/flutter-apk/app-debug.apk
Installing build/app/outputs/flutter-apk/app-debug.apk...        1,175ms
00:00 +0: Smoke — app startup app starts and renders without crash
00:02 +1: Smoke — app startup unauthenticated user sees SignInScreen
00:03 +2: Smoke — auth flow sign-in tap navigates to HomeScreen
00:05 +3: Smoke — auth flow logout tap returns to SignInScreen
00:07 +4: Smoke — auth flow authenticated start shows HomeScreen directly
00:08 +5: Smoke — SecureStorage (B2) SecureSessionStore write/read/clear work on device
00:09 +6: Smoke — SecureStorage (B2) app with SecureSessionStore restores session on device
00:10 +7: (tearDownAll)
00:10 +7: All tests passed!
```

**Verdict : PASSÉ — 7/7 tests en 10s. Aucune régression des 7 tests Flutter 8.**

Note : le smoke ne peut pas tester `RefreshInterceptor` sans serveur backend réel (R2 maintenu).
La preuve B3 est fournie par 14 tests unitaires headless (9 intercepteur + 5 contrôleur).

---

## 5. Tests unitaires — refresh_interceptor_test.dart (9 tests)

| Groupe | Tests |
|---|---|
| Success path | `401 triggers refresh and retries once, returning 200` ; `retry request carries the fresh Authorization header` |
| Loop prevention | `retry that returns 401 surfaces UnauthorizedError without looping` |
| Refresh failure | `refresher returns null — 401 surfaced as UnauthorizedError` ; `refresher throws — 401 surfaced as UnauthorizedError` |
| Non-401 passthrough | `403 is not intercepted — ForbiddenError, no refresh called` ; `500 passes through without refresh` |
| No token leak | `access token never appears in logs after refresh` |
| No refresher | `401 becomes UnauthorizedError without retry when no refresher` |

## 6. Tests unitaires — auth_controller_test.dart (5 nouveaux tests)

| Groupe | Tests |
|---|---|
| AuthController.refreshSession() | `returns new access token and updates _accessToken on success` |
| | `coalesces concurrent calls — AuthApi.refresh() called once` |
| | `purges session and returns null when refreshToken is absent` |
| | `purges session and returns null when AuthApi throws` |
| | `refreshed access token is never exposed in state` |

---

## 7. Statut B3

| Critère | Avant Flutter 9 | Après Flutter 9 |
|---|---|---|
| B3 — `RefreshInterceptor` | ❌ Absent — 401 surfacé sans refresh coalescent | ✅ **FERMÉ** — `RefreshInterceptor` + `refreshSession()` coalescent + retry unique + purge |
| C3 — Refresh 401 | ❌ Surfacé sans refresh | ✅ 401 → refresh → retry → 200 (ou purge si échec) |
| C3 — Session restore | ✅ (Flutter 8) | ✅ inchangé |
| C4 — Tokens stockés | ✅ PARTIAL (placeholder jusqu'à B3) | ✅ access token mémoire ✅ ; refresh token SecureStorage consommé par `refreshSession()` ✅ |

**B3 fermé. B4 (`LoadingState`/`EmptyState`/`ErrorState`/`SuccessState`) et B5 (login form) restent ouverts.**

---

## 8. Réserves maintenues

| Ref | Réserve | Statut |
|---|---|---|
| R1 | iOS — hôte Linux sans macOS/Xcode | Maintenu |
| R2 | Aucun appel API réel | Maintenu — `PlaceholderAuthApi` + pas de backend requis |
| R3 | Freezed/build_runner absent | Maintenu |
| R4 | Logger redaction | Maintenu |
| R5 | PreferenceStore seam | Maintenu |
