# MOBILE_FLUTTER8_ANDROID_SMOKE_REPORT.md — Flutter 8 Android Smoke Report

> **Date** : 2026-07-14
> **Branche** : `mobile-core-flutter-8-secure-storage`
> **Mission** : Mobile Core Flutter 8 — SecureStorage adapter for SessionStore (B2)
> **Objectif** : Fermer B2 (C3/C4) du rapport `MOBILE_FLUTTER_V1_READINESS_REVIEW.md`

---

## 1. Contexte — pourquoi B2 existait

Le Mobile Core Flutter n'avait pas d'adapter `flutter_secure_storage` réel. `SessionStore` était uniquement
implémenté via `InMemorySessionStore` (placeholder). La méthode `restoreSession()` n'était pas publique et
ne lisait aucune session persistée. Le refresh token n'était jamais sauvegardé entre les sessions.

---

## 2. Livrable Flutter 8 — SecureStorage seam + adapter

### Dépendance ajoutée

```yaml
# pubspec.yaml
dependencies:
  flutter_secure_storage: ^10.3.1  # Keychain (iOS) / EncryptedSharedPreferences+Keystore (Android)
```

Version résolue : `flutter_secure_storage 10.3.1`.
`minSdkVersion` = 24 (Flutter 3.44.6 par défaut) — satisfait l'exigence minSdk 23 de flutter_secure_storage 10.x.

### Nouveaux fichiers

| Fichier | Contenu |
|---|---|
| `lib/src/core/auth/secure_session_store.dart` | `SecureStorageAdapter` interface + `FlutterSecureStorageAdapter` + `SecureSessionStore` |
| `test/unit/auth/secure_session_store_test.dart` | 23 tests unitaires (FakeSecureStorageAdapter) |

### Fichiers modifiés

| Fichier | Changement |
|---|---|
| `pubspec.yaml` | `flutter_secure_storage: ^10.3.1` ajouté |
| `lib/src/core/auth/session_envelope.dart` | `factory fromJson` + `toJson` + `refreshToken?` + `toString()` sans refreshToken |
| `lib/src/core/auth/auth_controller.dart` | `_initialize()` → `restoreSession()` public (§9.11 spec) |
| `integration_test/smoke_test.dart` | 2 nouveaux tests SecureStorage B2 (groupe "Smoke — SecureStorage (B2)") |

### Architecture du seam

```
SecureStorageAdapter (abstract interface)
├── FlutterSecureStorageAdapter   ← production (Keychain / EncryptedSharedPreferences+Keystore)
└── FakeSecureStorageAdapter      ← tests unitaires (in-memory Map, sans platform channels)

SecureSessionStore implements SessionStore
├── read()   → jsonDecode → SessionEnvelope.fromJson ; purge défensive si corrupt
├── write()  → jsonEncode(envelope.toJson()) → adapter.write
└── clear()  → adapter.delete

AuthController
├── _accessToken : String?   ← JAMAIS persisté (ADR-015)
└── restoreSession()         ← public, lit SessionEnvelope depuis SecureSessionStore
```

### Invariant access token

L'access token est maintenu **exclusivement** dans `AuthController._accessToken` (mémoire uniquement).
Il n'apparaît jamais dans `SessionEnvelope`, les logs, `AuthState`, les providers persistants ou les
rapports. Seul le `refreshToken` est persisté dans `flutter_secure_storage`. (ADR-015)

---

## 3. Résultats des gates qualité

### flutter pub get

```
Got dependencies!
```

### flutter analyze

```
Analyzing mobile-flutter...
No issues found! (ran in 2.4s)
```

### flutter test (160/160 headless)

```
00:07 +160: All tests passed!
```

23 nouveaux tests (`secure_session_store_test.dart`) + 137 tests inchangés = 160 total.

### dart format --set-exit-if-changed .

```
Formatted 42 files (0 changed) in 0.13 seconds.
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
Running Gradle task 'assembleDebug'...                            112.0s
✓ Built build/app/outputs/flutter-apk/app-debug.apk
Installing build/app/outputs/flutter-apk/app-debug.apk...        1,191ms
00:00 +0: Smoke — app startup app starts and renders without crash
00:02 +1: Smoke — app startup unauthenticated user sees SignInScreen
00:03 +2: Smoke — auth flow sign-in tap navigates to HomeScreen
00:05 +3: Smoke — auth flow logout tap returns to SignInScreen
00:07 +4: Smoke — auth flow authenticated start shows HomeScreen directly
00:08 +5: Smoke — SecureStorage (B2) SecureSessionStore write/read/clear work on device
00:08 +6: Smoke — SecureStorage (B2) app with SecureSessionStore restores session on device
00:09 +7: (tearDownAll)
00:10 +7: All tests passed!
```

**Verdict : PASSÉ — 7/7 tests en 10s.**

| Étape | Durée | Résultat |
|---|---|---|
| `assembleDebug` Gradle | 112.0s | ✅ APK généré (cache Gradle chaud) |
| Installation APK | 1 191ms | ✅ Installé sur emulator-5554 |
| Tests integration | 10s | ✅ 7/7 passés |

---

## 5. Tests integration_test/smoke_test.dart — scénarios

| # | Groupe | Scénario | Attendu |
|---|---|---|---|
| 1 | Smoke — app startup | App startup sans crash | `SplashScreen` visible |
| 2 | Smoke — app startup | Utilisateur non authentifié | `SignInScreen` visible |
| 3 | Smoke — auth flow | Sign-in → `HomeScreen` | `HomeScreen` avec userId |
| 4 | Smoke — auth flow | Logout → `SignInScreen` | Retour `SignInScreen` |
| 5 | Smoke — auth flow | Session restore → `HomeScreen` | `HomeScreen` avec userId |
| 6 | Smoke — SecureStorage (B2) | `SecureSessionStore` write/read/clear sur device | Round-trip complet sur Keystore réel |
| 7 | Smoke — SecureStorage (B2) | App restaure session via `SecureSessionStore` | `HomeScreen` avec userId `'secure-user'` |

---

## 6. Tests unitaires — secure_session_store_test.dart (23 tests)

| Groupe | Tests |
|---|---|
| read/write/clear | 6 tests (null quand vide, write/read, refreshToken conservé, clear, overwrite, sans refreshToken) |
| Validation défensive | 5 tests (JSON invalide purgé, userId manquant purgé, userId vide purgé, userId null purgé, objet vide purgé) |
| Garantie access token | 4 tests (JSON stocké sans accessToken, clés toJson sans 'access', toString omet refreshToken, write est void) |
| signOut purge | 2 tests (clear après write supprime tout, clear idempotent) |
| Sérialisation SessionEnvelope | 6 tests (fromJson/toJson userId seul, avec refreshToken, equality) |

---

## 7. Statut B2

| Critère | Avant Flutter 8 | Après Flutter 8 |
|---|---|---|
| B2 — `flutter_secure_storage` | ❌ Absent — `InMemorySessionStore` uniquement | ✅ **FERMÉ** — 10.3.1 + `SecureSessionStore` + `FlutterSecureStorageAdapter` + `restoreSession()` |
| C3 — Session restore | ❌ Absent — `_initialize()` privé sans SecureStorage | ✅ `restoreSession()` public lit depuis `SecureSessionStore` |
| C3 — Refresh 401 | ❌ Surfacé sans refresh coalescent | ❌ Toujours absent — B3 (RefreshInterceptor) |
| C4 — Tokens stockés | ❌ `flutter_secure_storage` absent | ✅ PARTIAL — access token mémoire ✅ ; refresh token Keystore/Keychain ✅ (placeholder jusqu'à B3) |

**B2 fermé. B3→B5 restent ouverts.**

---

## 8. Réserves maintenues

| Ref | Réserve | Statut |
|---|---|---|
| R1 | iOS — hôte Linux sans macOS/Xcode | Maintenu — identique à RN B2 |
| R2 | Aucun appel API réel | Maintenu |
| R3 | Freezed/build_runner absent | Maintenu |
| R4 | Logger redaction | Maintenu |
| R5 | PreferenceStore seam | Maintenu |
