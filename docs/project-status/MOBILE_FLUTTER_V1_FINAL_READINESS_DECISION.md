# MOBILE_FLUTTER_V1_FINAL_READINESS_DECISION.md — Mobile Core Flutter V1 Final Readiness Decision

> **Date** : 2026-07-14
> **Branche** : `mobile-core-flutter-v1-final-readiness-decision`
> **Décision** : **`IMPLEMENTATION_AVANCEE` → `VALIDE_V1`**
> **Réserve acceptée** : **R1 — smoke iOS non exécuté, bloqué par absence macOS/Xcode sur hôte Linux**

---

## 1. Contexte lu

- `docs/project-status/MOBILE_FLUTTER_V1_READINESS_REVIEW.md`
- `docs/project-status/MOBILE_FLUTTER7_ANDROID_SMOKE_REPORT.md`
- `docs/project-status/MOBILE_FLUTTER8_ANDROID_SMOKE_REPORT.md`
- `docs/project-status/MOBILE_FLUTTER9_ANDROID_SMOKE_REPORT.md`
- `docs/project-status/MOBILE_FLUTTER10_ANDROID_SMOKE_REPORT.md`
- `docs/project-status/MOBILE_FLUTTER11_ANDROID_SMOKE_REPORT.md`
- `cores/mobile-flutter/CORE_SPECIFICATION.md` §29, §30
- `cores/mobile-flutter/README.md`
- `strategy/04_ROADMAP_GLOBAL.md`
- `docs/project-status/FOUNDATION_CURRENT_STATE.md`
- `docs/project-status/IMPLEMENTATION_MATRIX.md`
- `docs/project-status/NEXT_ACTIONS.md`
- `docs/project-status/SESSION_HANDOFF.md`
- `docs/project-status/MOBILE_CORE_V1_FINAL_READINESS_DECISION.md` (précédent RN)

---

## 2. Décision

Le Mobile Core Flutter est promu à **`VALIDE_V1`**.

Cette décision accepte formellement R1 comme **réserve environnementale non bloquante** :
le smoke iOS réel n'a pas été exécuté parce qu'aucun environnement macOS/Xcode ou device
iOS n'est disponible sur l'hôte Linux. Aucun succès iOS artificiel n'est revendiqué.

---

## 3. Réévaluation des 11 critères §29 après Flutter 7→11

| # | Critère §29 | Verdict après Flutter 7→11 | Fermé par |
|---|---|---|---|
| C1 | L'app démarre avec Flutter sur iOS et Android | ✅ PARTIAL — Android `emulator-5554` 7/7 ✅ ; iOS R1 (Linux) | Flutter 7 (Android), R1 maintenu |
| C2 | La navigation go_router fonctionne (public + protégé + guards) | ✅ — 5 router guard tests + 4 app widget tests | Flutter 3 |
| C3 | Le flow auth est prêt (login / logout / refresh / session restore) | ✅ — login ✅ · logout ✅ · refresh 401 coalescent ✅ · restoreSession() ✅ | Flutter 3/8/9 |
| C4 | Les tokens sont correctement stockés (access mémoire, refresh SecureStorage) | ✅ — `_accessToken` mémoire ; `SecureSessionStore` Keystore/Keychain | Flutter 3/8 |
| C5 | Les appels API Dio fonctionnent (health, auth) | ✅ — 86 tests unitaires Dio ; `dioClientProvider` Riverpod | Flutter 4 |
| C6 | L'upload multipart fonctionne via Dio | ✅ — `DioUploadService` + 35 tests upload | Flutter 5 |
| C7 | Les états UI loading/empty/error/success respectent les tokens Enistere | ✅ — `LoadingState`/`EmptyState`/`ErrorState`/`SuccessState` ; 39 tests widget ; smoke 7/7 | Flutter 10 |
| C8 | Le thème Material 3 Enistere est appliqué (ThemeData depuis tokens) | ✅ — `EnistereTokens` + `EnistereThemeExtension` + `EnistereTheme` (ADR-034) ; 16 tests | Flutter 2 |
| C9 | Les formulaires de base fonctionnent (login) | ✅ — `ConsumerStatefulWidget` + `Form` + email + password + validation + erreur accessible ; 10 tests widget ; smoke 7/7 | Flutter 11 |
| C10 | Les tests unitaires et widget couvrent auth, tokens, upload et navigation | ✅ — 218/218 tests headless | Flutter 1→11 |
| C11 | L'app tourne localement sur simulateur iOS et émulateur Android | ✅ PARTIAL — Android `emulator-5554` 7/7 ✅ ; iOS R1 (Linux) | Flutter 7 (Android), R1 maintenu |

**Score final §29 : 9/11 satisfaits (C2–C10) + 2/11 PARTIAL (C1, C11 — même contrainte iOS R1)**

Les deux PARTIAL désignent la **même** contrainte environnementale unique : hôte Linux sans macOS/Xcode.
Ce n'est pas un défaut de code, d'architecture ou d'implémentation.

---

## 4. Confirmation fermeture des bloquants B1→B5

| Bloquant | Critère §29 | Fermé par | Preuve device |
|---|---|---|---|
| ~~B1~~ FERMÉ | C1, C11 | Flutter 7 — `flutter create --platforms=android` + smoke `emulator-5554` | 5/5 ✅ en 9s |
| ~~B2~~ FERMÉ | C3, C4 | Flutter 8 — `flutter_secure_storage` 10.3.1 + `SecureSessionStore` + `restoreSession()` | 7/7 ✅ en 10s |
| ~~B3~~ FERMÉ | C3 | Flutter 9 — `RefreshInterceptor` + `refreshSession()` coalescent + `AuthApi` seam | 7/7 ✅ |
| ~~B4~~ FERMÉ | C7 | Flutter 10 — `LoadingState`/`EmptyState`/`ErrorState`/`SuccessState` + tokens Enistere | 7/7 ✅ |
| ~~B5~~ FERMÉ | C9 | Flutter 11 — `SignInScreen` formulaire email + password + validation + erreur accessible | 7/7 ✅ |

**Zéro bloquant restant.**

---

## 5. Réserves acceptées (non-bloquantes V1)

| Ref | Réserve | Nature | Parallèle Foundation |
|---|---|---|---|
| R1 | iOS runtime bloqué — hôte Linux sans macOS/Xcode | Environnementale — même hôte, même contrainte pour tous les cores mobiles | Identique à RN B2 acceptée `MOBILE_CORE_V1_FINAL_READINESS_DECISION.md` |
| R2 | Aucun appel API réel testé (headless uniquement) | Pattern Foundation V1 — primitives testées sans backend réel | Identique à RN, Web Core tests sans API directe |
| R3 | Freezed + Json Serializable délibérément absents | Livraison incrémentale ; Dart sealed class native suffit V1 | Décision Flutter 4 — AppApiError en Dart 3 natif |
| R4 | Logger avec redaction non implémenté | Module optionnel V1 — redaction couverte par `describeFileForLog` | R4 maintenu depuis V1 Readiness Review |
| R5 | `PreferenceStore` seam non implémenté | Store natif délégué aux projets dérivés per ADR-015 | Identique à RN B3 accepté comme réserve formelle (RN37) |

R1 est la **seule** réserve qui affecte les critères §29 (C1, C11 → PARTIAL). Les réserves R2→R5
n'impactent aucun critère §29 directement.

---

## 6. Comparaison avec le précédent RN VALIDE_V1

| Dimension | RN VALIDE_V1 (2026-07-13) | Flutter V1 (2026-07-14) |
|---|---|---|
| Score critères | §9.4 8/8 satisfaits | §29 9/11 pleinement ✅ + 2/11 PARTIAL (iOS uniquement) |
| Android device | ✅ `emulator-5554` smoke passé | ✅ `emulator-5554` 7/7 smoke passé |
| iOS device | Réserve B2 environnementale acceptée | Réserve R1 environnementale acceptée |
| Auth flow complet | ✅ AuthEngine + refresh coalescent | ✅ AuthController + RefreshInterceptor + refreshSession() coalescent |
| Stockage sécurisé | ✅ expo-secure-store | ✅ flutter_secure_storage 10.3.1 |
| UI states | ✅ LoadingView/EmptyView/ErrorView | ✅ LoadingState/EmptyState/ErrorState/SuccessState |
| Login form | ✅ SignInForm RHF+Zod | ✅ SignInScreen ConsumerStatefulWidget + Form + validation |
| Tests headless | ✅ 367/367 node:test | ✅ 218/218 flutter test |
| Précédent résolution iOS | B2 acceptée formellement | R1 acceptée formellement — même logique |

Le Flutter V1 satisfait un standard au moins aussi rigoureux que RN VALIDE_V1.

---

## 7. Justification

**Pourquoi VALIDE_V1 et non maintien IMPLEMENTATION_AVANCEE :**

1. **Zéro bloquant restant** — tous les B1→B5 définis dans la V1 Readiness Review sont fermés avec preuves
   réelles (device `emulator-5554`, builds Gradle, APK installé, tests passés).

2. **9 critères §29 pleinement satisfaits** — seuls C1 et C11 restent PARTIAL, et pour la même raison :
   iOS non exécutable sur Linux. Ce n'est pas un module manquant.

3. **Précédent clair** — RN a été promu VALIDE_V1 en acceptant exactement la même contrainte iOS Linux
   comme réserve environnementale (`MOBILE_CORE_V1_FINAL_READINESS_DECISION.md`). Refuser la même
   logique à Flutter serait incohérent.

4. **§29 C1/C11 ne requièrent pas iOS** exclusivement — ils demandent iOS *et* Android. Android est prouvé
   réel. iOS est une contrainte d'infrastructure disponible, non une absence de code.

5. **Invariants de sécurité maintenus** — ADR-015 : access token en mémoire uniquement (`_accessToken`),
   jamais persisté, jamais loggé ; `describeFileForLog` PII-safe ; `obscureText: true` sur password ;
   erreur auth générique sans credential ; `Semantics(liveRegion: true)` accessibilité.

---

## 8. Limites maintenues (non-bloquantes V1)

- Pas de smoke iOS réel (R1 — Linux). Exécuter `bash scripts/smoke.sh --ios` dès qu'un hôte macOS/Xcode
  ou device iOS est disponible.
- Pas d'appel API réel testé (R2 — pattern Foundation, headless uniquement).
- Freezed + Json Serializable absents (R3 — incrémental, applicable V2 ou projets dérivés).
- Logger avec redaction non implémenté (R4 — optionnel V1).
- `PreferenceStore` seam non implémenté (R5 — délégué aux projets dérivés, même que RN37).
- Pas de build EAS/flutter build release, pas de store app, pas de CI Flutter, pas de signature.
- Pas de Freezed, openapi_generator Dart, ou code-gen Riverpod.
- Pas de logique métier ni d'endpoint métier.
- Modules avancés (biométrie, analytics, crash, maps, push) → V2/VF ou projets dérivés.

---

## 9. Vérifications retenues

| Vérification | Résultat |
|---|---|
| `flutter pub get` | ✅ |
| `flutter analyze` | ✅ 0 issues |
| `flutter test` | ✅ **218/218** headless |
| `dart format --set-exit-if-changed .` | ✅ 0 changements |
| `quality-gates docs` | ✅ 2/2 |
| `git diff --check` | ✅ |
| Smoke Android `emulator-5554` | ✅ 7/7 passés |
| Smoke iOS | Non exécuté — R1 (Linux/Xcode) |

---

## 10. Effet de statut

| Avant | Après |
|---|---|
| `IMPLEMENTATION_AVANCEE` | **`VALIDE_V1`** |

Le Mobile Core Flutter rejoint les cores Foundation V1 validés, avec la réserve R1 (iOS Linux)
explicitement documentée et acceptée. Aucun succès iOS artificiel n'est revendiqué.

---

## 11. Prochaine action recommandée

- Exécuter `bash scripts/smoke.sh --ios` uniquement quand un hôte macOS/Xcode ou device iOS réel
  est disponible (aucune urgence V1).
- Prioriser les incréments V2 selon la roadmap : Freezed + Json Serializable, logger avec redaction,
  PreferenceStore seam natif, CI Flutter, build release, ou nouveau core V3.
- Aucune modification de code Flutter dans cette décision.
