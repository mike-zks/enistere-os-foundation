# NEXT_ACTIONS.md — Prochaines actions autorisées

> Vérifié depuis le repository (2026-07-12). Ordre cohérent avec l'état réel, les dépendances, les ADR
> validés et les packages déjà disponibles. **Une seule action à la fois.**

## 1. Prochaine action UNIQUE

> ✅ **Quality Core V2 Readiness Review : RÉALISÉ** (2026-07-12).
> Rapport : `docs/project-status/QUALITY_CORE_V2_READINESS_REVIEW.md`.
> Décision : **`SPECIFICATION_DOCUMENTAIRE` → `IMPLEMENTATION_PARTIELLE`**.
> Justification : matrice, script `quality-gates`, checklists, templates, ruleset actif, release process
> et usage réel lors de `foundation-v1.0.0`.
>
> ✅ **Quality Core 7 — prompts IA standardisés : RÉALISÉ** (2026-07-12).
> Livrables : `cores/quality-core/AI_PROMPT_GOVERNANCE.md`, `prompts/README.md`,
> `prompts/global/mission-brief-template.md`.
>
> ✅ **Docs Core 1 — documentation centrale navigable : RÉALISÉ** (2026-07-12).
> Livrables : `cores/docs-core/CORE_SPECIFICATION.md`, `cores/docs-core/README.md`, `docs/README.md`.
> Statut : **`SPECIFICATION_DOCUMENTAIRE`**. Aucun runtime, workflow, dépendance, RAG ou site docs.
>
> ✅ **Docs Core 2 — audit documentaire et dette de navigation/liens : RÉALISÉ** (2026-07-12).
> Rapport : `docs/project-status/DOCS_CORE_NAVIGATION_AUDIT.md`.
> Corrections : README racine synthétique, ADR-008 aligné UI Kit V1/RN35, compteurs UI Kit/Web mis à jour.
>
> ✅ **Docs Core 3 — onboarding contributeur minimal et glossaire initial : RÉALISÉ** (2026-07-12).
> Livrables : `docs/onboarding/CONTRIBUTOR_ONBOARDING.md`, `docs/glossary/GLOSSARY.md`.
> Aucun runtime, workflow, dépendance, génération automatique ou RAG.
>
> ✅ **Docs Core 4 — revue de liens documentaires ciblée : RÉALISÉ** (2026-07-12).
> Livrables : `cores/docs-core/scripts/check-doc-links.mjs`,
> `cores/docs-core/scripts/check-doc-links.test.mjs`, `DOCS_CORE_LINK_CHECK_REPORT.md`.
> Décision : **`SPECIFICATION_DOCUMENTAIRE` → `IMPLEMENTATION_PARTIELLE`**.
>
> ✅ **Docs Core V2 Readiness Review : RÉALISÉ** (2026-07-12).
> Rapport : `docs/project-status/DOCS_CORE_V2_READINESS_REVIEW.md`.
> Decision : Docs Core reste **`IMPLEMENTATION_PARTIELLE`**. Les criteres V2 globaux sont couverts par
> l'ensemble Quality+Docs, mais le seuil `IMPLEMENTATION_AVANCEE` du Docs Core attend les guides principaux
> et un onboarding complet.
>
> ✅ **Docs Core 5 — guides principaux et onboarding complet : RÉALISÉ** (2026-07-12).
> Livrables : `docs/guides/DOCUMENTATION_MAINTENANCE_GUIDE.md`,
> `docs/guides/CORE_STATUS_REVIEW_GUIDE.md`, onboarding par role, rapport
> `DOCS_CORE_GUIDES_ONBOARDING_REPORT.md`.
> Decision : Docs Core passe de **`IMPLEMENTATION_PARTIELLE`** à **`IMPLEMENTATION_AVANCEE`**.
>
> ✅ **Docs Core 6 — decision CI/docs gate integration : RÉALISÉ** (2026-07-12).
> Rapport : `docs/project-status/DOCS_CORE_CI_GATE_DECISION.md`.
> Decision : pas de nouveau check CI obligatoire ; link check integre au scope local
> `node cores/quality-core/scripts/quality-gates.mjs run docs`.
> Aucun workflow GitHub, ruleset, runtime, dependance, RAG ou site documentaire.
>
> **Prochaine action** : Docs Core V1 Readiness Review — verifier si Docs Core peut passer de
> `IMPLEMENTATION_AVANCEE` à `VALIDE_V1`.
>
> ✅ **Docs Core V1 Readiness Review : RÉALISÉ** (2026-07-12).
> Rapport : `docs/project-status/DOCS_CORE_V1_READINESS_REVIEW.md`.
> Decision : Docs Core passe de **`IMPLEMENTATION_AVANCEE`** à **`VALIDE_V1`**.
>
> **Prochaine action** : retour pilotage global — choisir le prochain core prioritaire selon prerequis
> disponibles. Candidats : Mobile RN31 si macOS/Xcode ou device iOS reel disponible ; Cloud durcissement
> final si une release/staging le requiert ; sinon cadrer explicitement le prochain core V2/V3.
>
> ✅ **Cloud Core V1 Readiness Review : RÉALISÉ** (2026-07-12).
> Rapport : `docs/project-status/CLOUD_CORE_V1_READINESS_REVIEW.md`.
> Decision : Cloud Core passe de **`IMPLEMENTATION_PARTIELLE`** à **`IMPLEMENTATION_AVANCEE`**.
> `VALIDE_V1` est differe : Redis/Compose V1 doivent etre tranches sans relancer les tests serveur reels hors
> gate final.
>
> **Prochaine action UNIQUE** : **Cloud Core 12 — decision Redis/Compose V1**.
> Objectif : trancher Redis (livraison minimale non publique ou report V2 coherent API Core) et aligner la
> structure Compose V1 (`base/local/staging` ou CC10 comme compose serveur officiel), sans acces serveur reel
> sauf decision explicite de gate final.
>
> ✅ **Cloud Core 12 — decision Redis/Compose V1 : RÉALISÉ** (2026-07-12).
> Rapport : `docs/project-status/CLOUD_CORE_12_REDIS_COMPOSE_DECISION.md`.
> Decisions : Redis reporte post-V1/V2 ; `docker-compose.cc10.yml` devient le compose serveur/staging V1
> officiel ; Cloud Core passe de **`IMPLEMENTATION_AVANCEE`** à **`VALIDE_V1`**.
>
> **Prochaine action** : retour pilotage global. Candidats non bloques : Quality Core `IMPLEMENTATION_AVANCEE`
> review ; ou autre core V2/V3 apres cadrage explicite. Mobile RN31 reste conditionne a macOS/Xcode ou device iOS.

> ✅ **Quality Core Advanced Readiness Review : RÉALISÉ** (2026-07-12).
> Rapport : `docs/project-status/QUALITY_CORE_ADVANCED_READINESS_REVIEW.md`.
> Decision : Quality Core passe de **`IMPLEMENTATION_PARTIELLE`** a **`IMPLEMENTATION_AVANCEE`**.
> Justification : criteres roadmap §13.4 7/7, gates locaux, checklists, templates, prompts, ruleset actif,
> release `foundation-v1.0.0` appliquee et Docs Core connecte au scope `quality-gates docs`.
>
> **Prochaine action** : retour pilotage global. Candidats non bloques : Quality Core automation ciblee
> (changelog/release semi-automation ou coverage reporting) ; ou cadrage d'un core V3. Mobile RN31 reste
> conditionne a macOS/Xcode ou device iOS reel.

> ✅ **Quality Core release helper : RÉALISÉ** (2026-07-12).
> Rapport : `docs/project-status/QUALITY_CORE_RELEASE_HELPER_REPORT.md`.
> Livrables : `cores/quality-core/scripts/release-helper.mjs` +
> `cores/quality-core/scripts/release-helper.test.mjs`.
> Fonction : lister les types de release gouvernes et generer un brouillon Markdown sur stdout depuis
> une plage de commits Git. Aucun tag, GitHub Release, workflow, dependance ou fichier genere.
>
> **Prochaine action** : Quality Core coverage/reporting baseline — premiere synthese locale de couverture
> ou de statut tests, sans workflow obligatoire ni artefact publie.

> ✅ **Quality Core coverage/reporting baseline : RÉALISÉ** (2026-07-12).
> Rapport : `docs/project-status/QUALITY_CORE_COVERAGE_REPORTING_BASELINE.md`.
> Livrables : `cores/quality-core/scripts/quality-report.mjs` +
> `cores/quality-core/scripts/quality-report.test.mjs`.
> Fonction : synthese stdout-only des gates tests et de la disponibilite coverage locale. Coverage locale
> disponible pour Web et API ; aucun pourcentage global calcule.
>
> **Prochaine action** : Quality Core CI-required checks alignment — verifier si les deux jobs `images (...)`
> doivent rester recommandes ou devenir requis dans `protect-main`, sans modifier le ruleset sans validation humaine.

> ✅ **Quality Core CI-required checks alignment : RÉALISÉ** (2026-07-12).
> Rapport : `docs/project-status/QUALITY_CORE_REQUIRED_CHECKS_ALIGNMENT.md`.
> Decision : **PROMOTION_RECOMMANDÉE, NON_APPLIQUÉE**. Le ruleset `protect-main` garde 8 checks requis ;
> les deux jobs `images (...)` sont mûrs pour devenir requis mais nécessitent une action humaine/admin.
>
> **Prochaine action** : Quality Core coverage standardization decision — décider si les scopes sans coverage
> standardisée doivent recevoir une commande coverage locale ou si le baseline reste informatif.

> ✅ **Quality Core coverage standardization decision : RÉALISÉ** (2026-07-12).
> Rapport : `docs/project-status/QUALITY_CORE_COVERAGE_STANDARDIZATION_DECISION.md`.
> Decision : **STANDARDISATION_PARTIELLE_EXISTANTE, PAS_DE_NOUVELLE_COMMANDE**. UI Kit/Web/API ont une
> coverage locale reconnue ; les autres scopes restent informatifs pour éviter un signal artificiel.
>
> **Prochaine action** : Quality Core V1 Readiness Review — vérifier si Quality Core peut passer de
> `IMPLEMENTATION_AVANCEE` à `VALIDE_V1`.

> ✅ **Quality Core V1 Readiness Review : RÉALISÉ** (2026-07-13).
> Rapport : `docs/project-status/QUALITY_CORE_V1_READINESS_REVIEW.md`.
> Decision : Quality Core passe de **`IMPLEMENTATION_AVANCEE`** à **`VALIDE_V1`**. Les critères roadmap
> §13.4 sont couverts ; les réserves restantes relèvent de V2/VF avancée.
>
> ✅ **Mobile Core V1 Readiness Review : RÉALISÉ** (2026-07-13).
> Rapport : `docs/project-status/MOBILE_CORE_V1_READINESS_REVIEW.md`.
> Décision : Mobile Core React Native passe de **`STARTER_UI_KIT_ALIGNED`** à
> **`IMPLEMENTATION_AVANCEE`**. Après RN36/RN37, critères roadmap §9.4 : **8/8 satisfaits** ;
> B1 upload runtime fermé, B3 PreferenceStore fermé comme réserve formellement acceptée.
> À cette étape, `VALIDE_V1` restait différé uniquement par **B2 — smoke iOS**
> (macOS/Xcode ou device iOS requis, ou décision formelle d'acceptation de réserve environnementale).
>
> ✅ **Mobile Core RN36 — upload runtime starter proof : RÉALISÉ** (2026-07-13).
> Livrables : `app/(app)/upload.tsx` (écran protégé RHF+Zod, `useUploadMutation` via client officiel,
> `LoadingState`/`MessageState`/`ErrorState`) + `ROUTES.upload` + lien Home + smoke Android étendu
> (`POST /files` mock, fixture `enistere-smoke.txt` via `adb shell`, vérification `Upload complete` +
> `uploadCount >= 1`). Gap B1 fermé. Critères §9.4 : **8/8 satisfaits**. À la date RN36,
> `VALIDE_V1` restait différé par B2 et B3 ; RN37 a ensuite fermé B3 comme réserve formellement acceptée.
> Vérifications : typecheck ✅, lint ✅, test 367/367 ✅, expo-doctor 19/19 ✅, export iOS ✅,
> `git diff --check` ✅, `quality-gates docs` 2/2 ✅.
>
> ✅ **Mobile Core RN37 — PreferenceStore native strategy decision (B3) : RÉALISÉ** (2026-07-13).
> Rapport : `docs/project-status/MOBILE_RN37_PREFERENCE_STORE_DECISION.md`.
> Décision : **store natif (MMKV/AsyncStorage) délégué aux projets dérivés — réserve formellement acceptée**.
> MMKV rejeté (JSI natif → brise Expo Go + smoke). AsyncStorage rejeté (choix arbitraire entre deux options
> valides selon ADR-015). Option D retenue : seam `PreferenceStore` + `createPreferenceService` + gardes +
> placeholder + 367 tests agnostiques constituent le « storage service » Foundation V1 (§9.3 roadmap).
> Pattern identique aux 10 autres seams+placeholders de la Foundation (permissions, notifications,
> biometrics, i18n, analytics, crash, network, lifecycle, feature flags, clipboard).
> ADR-015 §15/§16 délèguent **explicitement** le choix du store natif aux projets dérivés.
> Gap B3 **fermé comme réserve formellement acceptée non-bloquante**.
>
> ✅ **Mobile Core V1 final readiness decision : RÉALISÉ** (2026-07-13).
> Rapport : `docs/project-status/MOBILE_CORE_V1_FINAL_READINESS_DECISION.md`.
> Décision : Mobile Core React Native passe de **`IMPLEMENTATION_AVANCEE`** à **`VALIDE_V1`**.
> B2 iOS est acceptée comme réserve environnementale non bloquante : le script `smoke:ios` existe,
> RN30/RN31 documentent le blocage Linux/macOS, aucun smoke iOS réel n'est revendiqué et aucun succès
> artificiel n'est créé. RN31 reste à exécuter dès qu'un environnement macOS/Xcode ou device iOS réel
> est disponible.
>
> **Prochaine action** : retour pilotage post-V1. Candidats prioritaires : incréments V2/VF Mobile
> (adaptateurs natifs opt-in, tests mobile plus complets) ou démarrage d'un prochain core selon roadmap.

> ✅ **V3 Entry Decision : RÉALISÉ** (2026-07-13).
> Rapport : `docs/project-status/V3_ENTRY_DECISION.md`.
> Décision : ouvrir la séquence V3 par **Mobile Core Flutter**, mais uniquement par la décision
> structurante **ADR-034 — Flutter UI : Material 3 vs composants maison**. Aucun starter Flutter,
> aucune dépendance, aucun changement runtime.
>
> **Prochaine action UNIQUE** : **V3 ADR 034 — Flutter UI stack decision**.
> Objectif : rédiger et valider ADR-034 avant toute spécification ou implémentation du Mobile Core Flutter.

> ✅ **V3 ADR 034 — Flutter UI stack decision : RÉALISÉ** (2026-07-14).
> ADR : `docs/adr/ADR-034-flutter-ui-material3-vs-custom.md`.
> Décision : **Material 3 contrôlé par tokens Enistere + composants maison ciblés**.
> Material 3 est le moteur Flutter, pas l'identité visuelle autonome. Aucun starter Flutter, aucune dépendance,
> aucun runtime.
>
> ✅ **Mobile Core Flutter 1 — Core specification : RÉALISÉ** (2026-07-14).
> Livrables : `cores/mobile-flutter/CORE_SPECIFICATION.md` (32 sections : objectifs, modules obligatoires V1,
> stack go_router/Riverpod/Dio/Freezed, auth, tokens, stockage sécurisé, thème Material 3 Enistere ADR-034,
> logger/redaction, préférences, accessibilité, i18n, tests, missions ordonnées Flutter 1→V1, décisions pendantes)
> + `cores/mobile-flutter/README.md`. Statut `mobile-flutter` : `DOSSIER_SEULEMENT` → **`SPECIFICATION_DOCUMENTAIRE`**.
> Aucun code Dart, `pubspec.yaml`, dépendance ou workflow CI ajouté.
>
> ✅ **Mobile Core Flutter 2 — Starter minimal Flutter : RÉALISÉ** (2026-07-14).
> Livrables : `cores/mobile-flutter/pubspec.yaml` (flutter_riverpod 3.3.2, go_router 17.3.0),
> `analysis_options.yaml`, `lib/main.dart`, `lib/app.dart` (`MaterialApp.router` + `ProviderScope`),
> `lib/src/theme/` (`EnistereTokens`, `EnistereThemeExtension`, `EnistereTheme`),
> `lib/src/app/router.dart` (GoRouter), `lib/src/features/home/home_screen.dart`.
> Tests : 20/20 (`flutter test`). `flutter analyze` — 0 issues. `dart format` — 0 changements.
> Statut `mobile-flutter` : **`SPECIFICATION_DOCUMENTAIRE`** → **`STARTER_INITIALISE`**.
> Aucune logique métier, aucun endpoint réel, aucun SDK analytics/crash.
>
> ✅ **Mobile Core Flutter 3 — Auth shell + routing guards : RÉALISÉ** (2026-07-14).
> Livrables : `lib/src/core/auth/` (`AuthStatus`, `AuthState`, `SessionEnvelope`, `SessionStore` seam +
> `InMemorySessionStore` placeholder, `AuthController` Riverpod `Notifier`),
> `lib/src/core/navigation/router.dart` (`routerProvider` GoRouter + `ValueNotifier` bridge + redirect guards),
> `lib/src/features/splash/splash_screen.dart`, `lib/src/features/auth/sign_in_screen.dart`,
> `lib/src/features/home/home_screen.dart` mis à jour (sign-out).
> Invariant sécurité : access token en mémoire uniquement (`AuthController._accessToken`), jamais dans
> `AuthState`, jamais dans les logs, jamais dans les préférences.
> Tests : `flutter test` 38/38 ✅ · `flutter analyze` 0 issues ✅ · `dart format` 0 changements ✅.
> Statut `mobile-flutter` : **`STARTER_INITIALISE`** → **`AUTH_SHELL_READY`**.
> Aucun backend réel, aucun appel réseau, aucun stockage persistant réel.
>
> **Prochaine action** : **Mobile Core Flutter 4 — Client Dio + providers**.
> Objectif : `DioClient` + intercepteurs (Auth/Logging) + `Freezed` modèles + health provider.
> Aucun endpoint métier.

> ✅ **Mobile Core Flutter 4 — Client Dio + providers : RÉALISÉ** (2026-07-14).
> `dio: ^5.10.0` ajouté. `ApiConfig` + `AppApiError` (sealed class Dart 3 native, 11 sous-types, aucun Freezed) + `createDioClient` (`_AuthInterceptor` → `LoggingInterceptor` → `ErrorInterceptor`) + `dioClientProvider` Riverpod. Token injecté dynamiquement via `tokenReader`, jamais stocké. 401 surfacé sans refresh automatique. LoggingInterceptor : jamais body/Authorization/token. 86/86 tests ✅ · analyze 0 ✅ · format 0 ✅ · quality-gates docs ✅.
> Statut `mobile-flutter` : **`AUTH_SHELL_READY`** → **`DIO_CLIENT_READY`**.

> ✅ **Mobile Core Flutter 5 — Upload multipart primitives : RÉALISÉ** (2026-07-14).
> `http_parser: ^4.0.0` ajouté. `AppFile` descriptor pur (`path`/`name`/`mimeType`/`sizeBytes?`) + `SafeFileDescriptor` + `describeFileForLog` (mimeType+extension sanitisée uniquement, jamais path/nom brut) + `isValidAppFile` + `isAllowedUploadContentType` (exact, group wildcard `image/*`, `*/*`). `FileCategory` enum (9 valeurs) + `.apiValue`. `UploadedFileMetadata` DTO (id+category uniquement, jamais URL signée/bucket/device path). `DioUploadService` implements `UploadService` : `FormData` + `MultipartFile` injectable — jamais `Content-Type: multipart/form-data` forcé manuellement ; Dio pose le boundary. Erreurs mappées via `AppApiError` : 413→`TooLargeError`, 415→`UnsupportedTypeError`, 401→`UnauthorizedError`, réseau→`NetworkError`. Aucun retry automatique. 120/120 tests ✅ · analyze 0 ✅ · format 0 ✅ · quality-gates docs ✅.
> Statut `mobile-flutter` : **`DIO_CLIENT_READY`** → **`UPLOAD_READY`**.

> ✅ **Mobile Core Flutter 6 — Tests + smoke : RÉALISÉ** (2026-07-14).
> `integration_test: sdk: flutter` ajouté en dev_dependency.
> Tests widget ajoutés : `test/widget/splash_screen_test.dart` (4 tests — render, CircularProgressIndicator, centré, app en loading via `_BlockingSessionStore`), `test/widget/sign_in_screen_test.dart` (5 tests — heading, bouton, touch target ≥ 44 dp, navigation, couleur primaire), `test/widget/home_screen_test.dart` (7 tests — heading, AppBar, logout icon, userId, ADR-034 text, ThemeExtension accessible, logout → SignInScreen).
> `integration_test/smoke_test.dart` (5 tests device — startup, unauthenticated, sign-in, logout, session restore) : architecture library sans dossiers platform, procédure pour projets dérivés, Android emulator disponible mais bloqué architecturalement.
> `scripts/smoke.sh` : smoke runner documenté (headless / --android / --ios).
> `docs/project-status/MOBILE_FLUTTER6_SMOKE_REPORT.md` : rapport versionné — 136/136 tests headless, 18 chemins critiques, blocage Android architectural (R1), iOS bloqué Linux (R2), 3 réserves documentées.
> `flutter test` 136/136 ✅ · `flutter analyze` 0 issues ✅ · `dart format` 0 changements ✅ · `quality-gates docs` 2/2 ✅.
> Statut `mobile-flutter` : **`UPLOAD_READY`** → **`TEST_WIDGET_PASSED`**.
>
> **Prochaine action** : **Mobile Core Flutter V1 Readiness Review** — vérifier si Mobile Core Flutter peut passer de `TEST_WIDGET_PASSED` à `VALIDE_V1` selon les critères de la spécification.

> ✅ **Mobile Core Flutter V1 Readiness Review : RÉALISÉ** (2026-07-14).
> Rapport : `docs/project-status/MOBILE_FLUTTER_V1_READINESS_REVIEW.md`.
> Décision : Mobile Core Flutter passe de **`TEST_WIDGET_PASSED`** à **`IMPLEMENTATION_AVANCEE`**.
> Score §29 : 5/11 satisfaits (navigation ✅, upload ✅, thème ✅, tests ✅, API Dio ✅).
> 5 bloquants : B1 Android runtime (library sans `android/`), B2 `flutter_secure_storage` absent,
> B3 `RefreshInterceptor` absent, B4 UI states (`LoadingState`/`EmptyState`/`ErrorState`/`SuccessState`),
> B5 login form (`SignInScreen` bouton mock). Réserves acceptées : R1 iOS Linux, R2 pas de backend réel,
> R3 Freezed délibérément absent, R4 logger redaction, R5 PreferenceStore seam.
> `VALIDE_V1` différé : B2→B5 sont des modules manquants réels, pas des contraintes environnementales.
>
> ✅ **Mobile Core Flutter 7 — platform dirs + smoke Android : RÉALISÉ** (2026-07-14).
> Rapport : `docs/project-status/MOBILE_FLUTTER7_ANDROID_SMOKE_REPORT.md`.
> Livrables : `cores/mobile-flutter/android/` (via `flutter create --platforms=android --org com.enistere .`),
> `.gitignore` Flutter, `.metadata` Flutter tooling, rapport `MOBILE_FLUTTER7_ANDROID_SMOKE_REPORT.md`.
> Smoke `emulator-5554` (Pixel 6a, API 33, x86_64) : `assembleDebug` 512.2s ✅ · APK 924ms ✅ · **5/5 passés en 9s**.
> 136 tests headless inchangés. `flutter pub get` ✅ · `flutter analyze` 0 ✅ · `flutter test` 136/136 ✅ ·
> `dart format` 0 ✅ · `quality-gates docs` 2/2 ✅ · `git diff --check` ✅.
> **B1 FERMÉ.** C1/C11 §29 : ❌ → ✅ PARTIAL (Android réel, iOS R1 maintenu). B2→B5 restent ouverts.

> ✅ **Mobile Core Flutter 8 — SecureStorage seam + adapter : RÉALISÉ** (2026-07-14).
> Rapport : `docs/project-status/MOBILE_FLUTTER8_ANDROID_SMOKE_REPORT.md`.
> Livrables : `flutter_secure_storage: ^10.3.1` ; `SecureStorageAdapter` seam + `FlutterSecureStorageAdapter` +
> `SecureSessionStore` (purge défensive) ; `SessionEnvelope.fromJson`/`toJson`/`refreshToken?` (toString sans refreshToken) ;
> `AuthController.restoreSession()` public (§9.11) ; `FakeSecureStorageAdapter` + 23 tests unitaires ; 2 tests smoke B2 device.
> Smoke `emulator-5554` (Pixel 6a, API 33, x86_64) : **7/7 passés en 10s** (5 originaux + 2 SecureStorage B2).
> 160/160 tests headless. `flutter pub get` ✅ · `flutter analyze` 0 ✅ · `flutter test` 160/160 ✅ ·
> `dart format` 0 ✅ · `quality-gates docs` 2/2 ✅ · `git diff --check` ✅.
> **B2 FERMÉ.** C3 : restore ✅ (refresh B3). C4 : ❌ → ✅ PARTIAL. B3→B5 restent ouverts.
>
> ✅ **Mobile Core Flutter 9 — RefreshInterceptor 401 coalescent (B3) : RÉALISÉ** (2026-07-14).
> Rapport : `docs/project-status/MOBILE_FLUTTER9_ANDROID_SMOKE_REPORT.md`.
> Livrables : `AuthApi` seam + `PlaceholderAuthApi` ; `RefreshInterceptor` (401 → `refreshSession()` → retry
> unique → purge si échec, guard `_refreshed` anti-boucle, 403/5xx pass-through) ; `AuthController.refreshSession()`
> coalescent (`_refreshFuture ??=`) + `_purgeSession()` ; `authApiProvider` injectable ; `TokenRefresher` typedef ;
> `createDioClient(refresher:)` optionnel ; `dioClientProvider` câblé.
> Découverte clé : Dio 5.x traite les erreurs en ordre d'enregistrement (catchError chaîné, PAS inversé) —
> `RefreshInterceptor` enregistré AVANT `ErrorInterceptor`. 14 tests unitaires ; smoke `emulator-5554` 7/7 ✅ inchangés ;
> 174/174 tests headless. `flutter pub get` ✅ · `flutter analyze` 0 ✅ · `dart format` 0 ✅ ·
> `quality-gates docs` 2/2 ✅ · `git diff --check` ✅.
> **B3 FERMÉ.** C3 : refresh 401 ❌ → ✅. C4 : ✅ PARTIAL → ✅. Score §29 : 5/11 → 7/11.
>
> ✅ **Mobile Core Flutter 10 — UI states Foundation (B4) : RÉALISÉ** (2026-07-14).
> Rapport : `docs/project-status/MOBILE_FLUTTER10_ANDROID_SMOKE_REPORT.md`.
> Livrables : `lib/src/core/states/loading_state.dart` / `empty_state.dart` / `error_state.dart` /
> `success_state.dart` — widgets Foundation ADR-034 alignés `EnistereThemeExtension` (espacements, couleurs
> `colorDanger`/`colorSuccess`/`colorTextMuted`, primaire `ColorScheme`) ; Semantics `label` (LoadingState) +
> `liveRegion` (ErrorState/SuccessState) ; 39 tests widget headless ; smoke `emulator-5554` 7/7 ✅ (aucune
> régression) ; 213/213 tests headless.
> **B4 FERMÉ.** C7 : ❌ → ✅. Score §29 : 7/11 → 8/11. Bloquant restant : B5 (login form).

> ✅ **Mobile Core Flutter 11 — Sign-in form validation (B5) : RÉALISÉ** (2026-07-14).
> Rapport : `docs/project-status/MOBILE_FLUTTER11_ANDROID_SMOKE_REPORT.md`.
> Livrables : `lib/src/features/auth/sign_in_screen.dart` converti de `ConsumerWidget` à
> `ConsumerStatefulWidget` + `Form` (`GlobalKey<FormState>`) + `TextFormField` email (`Key('emailField')`,
> `keyboardType: emailAddress`, `TextInputAction.next`, validation requis + format `@`) + `TextFormField`
> password (`Key('passwordField')`, `obscureText: true`, `TextInputAction.done`, validation requis) +
> erreur auth générique `Semantics(liveRegion: true)` ; 10 tests widget headless ; `router_guard_test.dart`
> adapté ; smoke `emulator-5554` 7/7 ✅ ; 218/218 tests headless.
> **B5 FERMÉ.** C9 : ❌ → ✅. Score §29 : 8/11 → 9/11. Tous les bloquants B1→B5 fermés.
>
> ✅ **Mobile Core Flutter V1 Final Readiness Decision : RÉALISÉE** (2026-07-14).
> Rapport : `docs/project-status/MOBILE_FLUTTER_V1_FINAL_READINESS_DECISION.md`.
> Décision : Mobile Core Flutter promu de **`IMPLEMENTATION_AVANCEE`** à **`VALIDE_V1`**.
> R1 (iOS Linux) acceptée comme réserve environnementale non bloquante — identique à RN B2 (`MOBILE_CORE_V1_FINAL_READINESS_DECISION.md`).
> Score §29 : 9/11 pleinement satisfaits + 2/11 PARTIAL (C1, C11 — même contrainte iOS R1).
> Zéro bloquant. 218/218 headless · smoke `emulator-5554` 7/7 ✅. Aucun succès iOS artificiel.
>
>
> ✅ **V3 Post Flutter Roadmap Decision : RÉALISÉE** (2026-07-14).
> Rapport : `docs/project-status/V3_POST_FLUTTER_ROADMAP_DECISION.md`.
> Décision : poursuivre V3 par **API Core Spring Boot 1 — Core specification**. Flutter V2 est reporté
> car Mobile Flutter est déjà `VALIDE_V1`; Web Angular reste derrière ADR-035; AI Core reste hors séquence V3 §14.
>
> ✅ **API Core Spring Boot 1 — Core specification : RÉALISÉ** (2026-07-14).
> Livrables : `cores/api-spring/CORE_SPECIFICATION.md` (42 sections : rôle, objectifs, périmètre,
> architecture cible, structure cible, modules obligatoires V1, modules optionnels/futurs,
> standards API/sécurité/qualité Java, auth JWT Spring Security 7.x, RBAC Method Security,
> users/roles/permissions, validation Jakarta BV, erreurs `@ControllerAdvice` `ApiError`,
> logs SLF4J/Logback structurés, audit logs, upload MinIO Java SDK, cache Redis, jobs Spring
> `@Async`/Scheduler, OpenAPI springdoc, health Actuator, tests JUnit 5 + Testcontainers,
> §30 critères V1, §40 décisions pendantes Maven/Gradle, §41 missions ordonnées, §42 cohérence NestJS)
> + `cores/api-spring/README.md`.
> Aucun starter, aucun code Java, aucune dépendance.
> `api-spring` : **`DOSSIER_SEULEMENT` → `SPECIFICATION_DOCUMENTAIRE`**.
>
> ✅ **API Core Spring Boot 2A — ADR build system Maven vs Gradle : RÉALISÉ** (2026-07-14).
> Livrable : `docs/adr/ADR-041-build-system-api-spring-maven-vs-gradle.md`.
> Décision : **Maven** comme build system principal V1 (`pom.xml`, Spring Boot Parent POM, `mvn verify`).
> `ADR_BACKLOG.md`, `DECISIONS_REGISTER.md`, docs project-status mis à jour.
> `quality-gates docs` 2/2 ✅ · `git diff --check` ✅.
>
> ✅ **API Core Spring Boot 2 — Starter minimal Maven : RÉALISÉ** (2026-07-15).
> Livrables : `cores/api-spring/pom.xml` (Spring Boot 4.1.0 Parent POM, JJWT 0.12.6, Java 21),
> `mvnw` / `mvnw.cmd` / `.mvn/wrapper/maven-wrapper.properties` (Maven Wrapper 3.9.12),
> structure Java `com.enistere.core` : `EnistereCoreApplication`, `JwtConfig`, `SecurityConfig`
> (STATELESS, JWT filter, CORS, no CSRF), `ApiError`, `GlobalExceptionHandler`,
> `JwtTokenProvider`, `JwtAuthenticationFilter`, `AuthController` + DTOs
> (`/api/v1/auth/{login,me,logout,refresh}`), `application.yml`, `application-test.yml`.
> Adaptations SB4 : `@AutoConfigureMockMvc` absent → `MockMvcBuilders.webAppContextSetup` + `springSecurity()` ;
> `ObjectMapper` non injecté → instance locale test ; `spring.jackson.time-zone` retiré (SB4 JacksonProperties) ;
> `HttpMessageNotReadableException` géré (400 vs 500).
> Tests : **18/18 ✅** (`JwtTokenProviderTest` 7, `AuthControllerTest` 10, `EnistereCoreApplicationTests` 1).
> `./mvnw verify` : **BUILD SUCCESS**.
> Aucun secret hardcodé : `JWT_SECRET`, `STUB_USERNAME`, `STUB_PASSWORD` via env vars.
> `api-spring` : **`SPECIFICATION_DOCUMENTAIRE` → `STARTER_INITIALISE`**.
>
> ✅ **API Core Spring Boot 3 — PostgreSQL + JPA + Flyway + RBAC : RÉALISÉ** (2026-07-15).
> Entités JPA (User/Role/Permission/RefreshToken), migration Flyway V1 (6 tables, 5 index),
> Argon2id (ADR-039), refresh tokens SHA-256 rotatifs, RBAC `@PreAuthorize` + permissions JWT stateless,
> Testcontainers singleton + `@DynamicPropertySource`. `./mvnw verify` **43/43 ✅**.
> `api-spring` : **`STARTER_INITIALISE` → `IMPLEMENTATION_PARTIELLE`**, sous-statut `PERSISTENCE_RBAC_READY`.
>
> ✅ **API Core Spring Boot 4 — OpenAPI + Upload MinIO/S3 : RÉALISÉ** (2026-07-15).
> Livrables : `springdoc-openapi-starter-webmvc-ui:2.8.6` + `io.minio:minio:8.5.17` ; `OpenApiConfig` (Bearer JWT, springdoc SB 4.x) ; `FilesConfig` (`@ConfigurationProperties(prefix="enistere.files")` + `@Validated`) ; migration Flyway `V2__add_stored_files.sql` (13 colonnes + 3 index) ; entité `StoredFile` + `FileCategory`/`FileStatus` enums + `StoredFileRepository` ; DTO public `StoredFileResponseDto` (sans `storageKey`/`bucket`/`signedUrl`/`ownerId`) ; `StorageService` interface + `MinioStorageService` (`@Profile("!test")`) + `FakeStorageService` test (`@Profile("test")`) ; `FileService` (validation MIME whitelist 14 types, taille, nom sanitisé, `storageKey` 100% serveur) ; `FilesController` (`POST /api/v1/files/upload`, `@Tag`, `@Operation`, `Authentication auth`) ; `GlobalExceptionHandler` : 413 `MaxUploadSizeExceededException`, 415 `HttpMediaTypeNotSupportedException`, `BindException` ; `SecurityConfig` : `/v3/api-docs/**`/`/swagger-ui/**` `permitAll` ; `application.yml` : `spring.servlet.multipart.max-file-size: 10MB` + `enistere.files.*` env vars ; `application-test.yml` : dummy files.* + springdoc disabled. Tests : `FileValidationTest` (16 tests unitaires), `FilesUploadIntegrationTest` (9 tests : 401, 201 public DTO, non-leak, 400 manquant/invalide, 415 MIME bloqué, empty, subjectId), `FlywayMigrationTest` +3 tests V2. `./mvnw verify` **71/71 ✅ BUILD SUCCESS**.
> Non livré (Spring Boot 5) : liste/delete/download/URL signée, MinIO Testcontainers, validation Tika binaire, quarantaine.
> `api-spring` : **`PERSISTENCE_RBAC_READY` → `FILE_UPLOAD_READY`**.
>
> ✅ **API Core Spring Boot 5 — CI Java + Quality Gate Spring Boot : RÉALISÉ** (2026-07-15).
> Livrables : `.github/workflows/api-spring-ci.yml` (L5 : Java 21 Temurin + Maven Wrapper + `./mvnw verify --no-transfer-progress` + Testcontainers PostgreSQL ; Docker natif `ubuntu-latest` ; FakeStorageService ; aucun MinIO réel, aucun secret) ; `cores/quality-core/scripts/quality-gates.mjs` — scope `api-spring` ajouté (8ème scope, `SPRING_CWD = cores/api-spring`, `./mvnw verify --no-transfer-progress`, descriptions et exclusions documentées, `all-safe` mis à jour) ; `cores/quality-core/scripts/quality-gates.test.mjs` — 36 → **42 tests** (suite `buildPlan — api-spring`, `listScopes` 7→8, `all-safe` n'inclut pas api-spring) ; `cores/quality-core/QUALITY_GATES_MATRIX.md` — L5 dans légende, api-spring dans matrice et §2.9, `api-spring-verify` check recommandé §3.
> `api-spring` : **`FILE_UPLOAD_READY` → `CI_JAVA_READY`**. Aucun changement métier api-spring. Aucun changement NestJS/Web/Mobile/UI Kit/Cloud.
>
> ✅ **API Core Spring Boot 6 — V1 Readiness Review : RÉALISÉ** (2026-07-15).
> Rapport : `docs/project-status/API_SPRING_V1_READINESS_REVIEW.md`.
> Matrice §30 : **11/15 satisfaits** (C1 démarrage, C2 PG+Flyway, C3 auth flow, C4 tokens, C5 routes protégées, C6 RBAC, C7 DTO validation, C8 ApiError, C11 OpenAPI, C12 TC 71/71, C13 secrets/logs), **3/15 partiels** (C9 URL signée absente, C10 Redis/storage health absents, C15 CORS origines hardcodées), **1/15 non satisfait** (C14 audit logs — table absente, AuditModule §9 absent).
> Bloquants V1 : **B1 audit logs** (§9 module obligatoire — `audit_logs` table + AuditService + events LOGIN/FILE_UPLOAD manquants) ; **B2 URL signée** (§20 presigned URL absent — pas de `GET /files/:id/download-url`).
> Réserves acceptées : R1 MinIO TC, R2 CORS env var, R3 rate limiting, R4 Tika, R5 Redis (toutes différées SB7+).
> `api-spring` : **`CI_JAVA_READY` → `IMPLEMENTATION_AVANCEE`**.
>
> ✅ **API Core Spring Boot 7 — AuditModule + URL signée + CORS env var : RÉALISÉ** (2026-07-15).
> B1 fermé — migration `V3__add_audit_logs.sql` (8 colonnes, 3 index) ; `AuditLog` + `AuditEventType` (7 valeurs) + `AuditService` (`@Transactional(REQUIRES_NEW)`, best-effort) ; traçage complet : LOGIN_SUCCESS/FAILURE, LOGOUT, TOKEN_REFRESH, FILE_UPLOAD, FILE_DOWNLOAD_URL_CREATED, ADMIN_ACCESS ; aucun payload sensible (ni password, ni refresh token, ni storageKey, ni URL) dans audit_logs.
> B2 fermé — `GET /api/v1/files/{id}/download-url` : ownership `findByIdAndOwnerId()` + 404 anti-énumération ; `StorageService.generatePresignedDownloadUrl()` + `MinioStorageService` (GetPresignedObjectUrlArgs) + `FakeStorageService` ; `Cache-Control: no-store` ; `FilesConfig.presignedUrlTtlSeconds` via env.
> C15 fermé — `CorsConfig` injectable via `${CORS_ALLOWED_ORIGINS:...}` ; CSV robuste ; `SecurityConfig` utilise `getAllowedOriginsList()` jamais wildcard.
> Tests : `AuditIntegrationTest` 7 + `FilesDownloadUrlIntegrationTest` 6 + `CorsIntegrationTest` 3 + `FlywayMigrationTest` +3 = **90/90 ✅ BUILD SUCCESS**. Score §30 : **14/15 ✅ / 1 ⚠️ (C10 Redis différé) / 0 ✗**.
> `api-spring` : **`IMPLEMENTATION_AVANCEE` → `VALIDE_V1`**.
>
> ✅ **API Core Spring Boot 8 — Redis cache + rate limiting + MinIO Testcontainers : RÉALISÉ** (2026-07-15).
> R1 fermé — `MinioStorageIntegrationTest` : TC `minio/minio:RELEASE.2024-01-16T16-07-38Z` ; upload réel `MinioStorageService` → `statObject` TC ; URL présignée `X-Amz-*` réelle (pas fake-storage.test) ; `Cache-Control: no-store` vérifié. `@TestConfiguration @Primary StorageService` override de `FakeStorageService` ; `@DynamicPropertySource` override de `enistere.files.*` ; `@Import(MinioTestConfig.class)`.
> R3 fermé — `RateLimitInterceptor` (fixed-window en mémoire, `@ConditionalOnProperty`) ; 4 endpoints : `/api/v1/auth/login`, `/api/v1/auth/refresh`, `/api/v1/files/upload`, `/api/v1/files/*/download-url` ; 429 via `GlobalExceptionHandler.handleResponseStatus()` → `ApiError` ; aucun log de token/email/body ; `RateLimitConfig` (`@ConfigurationProperties(prefix="enistere.security.rate-limit")`) ; `WebMvcConfig` enregistre l'intercepteur conditionnellement ; disabled par défaut en test (`enabled: false` dans `application-test.yml`) ; `RateLimitIntegrationTest` 4 tests.
> R5 fermé — `spring-boot-starter-data-redis` (Lettuce) ; `spring.data.redis.url=${REDIS_URL:redis://localhost:6379}` ; `RedisHealthIndicator` auto-configuré via Actuator ; `RedisHealthIntegrationTest` TC `redis:7-alpine` + `@DynamicPropertySource` → `/actuator/health` $.components.redis.status = UP ; disabled par défaut (`management.health.redis.enabled: false`) re-enabled dans `RedisHealthIntegrationTest` via `@TestPropertySource`.
> C10 fermé — `/actuator/health` retourne `db` UP (PostgreSQL) + `redis` UP (TC Redis) avec `show-details: always`.
> Tests : **99/99 ✅ BUILD SUCCESS** (90 SB7 + 4 RateLimit + 2 RedisHealth + 3 MinioTC). Score §30 : **15/15 ✅**.
> `api-spring` : **`VALIDE_V1`** (réserves R1/R3/R5 + C10 fermées).
>
> **Prochaine action** : V3 ADR-035 — Angular UI stack decision.
>
> Note iOS Flutter smoke : exécuter `bash scripts/smoke.sh --ios` quand un hôte macOS/Xcode ou device iOS réel est disponible (contrainte environnementale non bloquante).

> ✅ **V3 ADR-035 — Angular UI stack decision : RÉALISÉ** (2026-07-15).
> ADR : `docs/adr/ADR-035-angular-ui-material-vs-primeng.md`.
> Décision : **Angular Material (CDK + Material 3) contrôlé par tokens Enistere + composants maison ciblés**.
> Angular CDK = moteur comportemental/a11y ; tokens Enistere pilotent l'identité via `mat.define-theme()` ;
> composants maison Enistere Angular ciblés (LoadingState/EmptyState/ErrorState/SuccessState).
> Reactive Forms obligatoire. Pas de PrimeNG, pas de shadcn/Radix côté Angular.
> ADR-016 §F (adaptateur OpenAPI Angular) décidé par preuve dans Web Core Angular 1.
> Aucun starter Angular, aucune dépendance npm, aucun runtime créé.
>
> **Historique** : cette prochaine action était SB8 (Redis+RateLimit+MinIO Testcontainers) ; réalisé 2026-07-15.

> ✅ **V3 Web Core Angular 1 — Core specification : RÉALISÉ** (2026-07-15).
> Livrables : `cores/web-angular/CORE_SPECIFICATION.md` (32 §) + `cores/web-angular/README.md`.
> Spécification documentaire complète : architecture Angular standalone feature-first, Reactive Forms
> obligatoires, Angular Material CDK + M3 + tokens Enistere (ADR-035), HttpClient + intercepteurs,
> Angular Signals, RxJS services, `@angular/cdk/a11y`, composants maison Enistere Angular,
> RBAC `PermissionService`/`PermissionDirective`, 15 critères §29 V1, missions ordonnées Angular 1→V1,
> 13 décisions pendantes (§32 : client OpenAPI, tests, E2E, TanStack Query Angular, NgRx...).
> `web-angular` : **`DOSSIER_SEULEMENT` → `SPECIFICATION_DOCUMENTAIRE`**.
> `quality-gates docs` 2/2 ✅ · `git diff --check` ✅.
>
> **Prochaine action** : **Web Core Angular 2 — Starter minimal Angular**.
> Objectif : créer `package.json` + `src/main.ts` + `app.config.ts` + structure `src/` + thème Material 3 Enistere.
> Prérequis : Angular 1 ✅.
>
> **Historique** : cette prochaine action était V3 ADR-035 ; réalisé 2026-07-15.

> ✅ **Foundation V1 Release Publication : RÉALISÉE** (2026-07-12).
> Notes publiées : `docs/project-status/FOUNDATION_V1_RELEASE_NOTES.md`.
> Statut : **`FOUNDATION_V1_RELEASED`**. Tag : `foundation-v1.0.0`.
> GitHub Release : <https://github.com/mike-zks/enistere-os-foundation/releases/tag/foundation-v1.0.0>.
>
> **Historique** : cette prochaine action était l'arbitrage post-release ; Quality Core V2 Readiness Review
> est réalisée le 2026-07-12.

> ✅ **Foundation V1 Baseline Readiness Review : RÉALISÉ** (2026-07-12).
> Rapport : `docs/project-status/FOUNDATION_V1_BASELINE_READINESS_REVIEW.md`.
> Verdict historique : **`READY_FOR_RELEASE_DECISION`** — le périmètre `foundation-v1-baseline` était
> prêt pour décision humaine de release avant publication.
> Preuves : API/Web/UI Kit `VALIDE_V1`, packages API `IMPLEMENTATION_AVANCEE`, Quality Core documentaire,
> ruleset `protect-main` actif, CI `main` L1-L4 verte après PR #88, `all-safe` local validé avec
> `NODE_ENV=test` plus audit root 0 vuln hors sandbox.
>
> **Historique** : cette prochaine action était Foundation V1 Release Notes 1 ; elle est réalisée le 2026-07-12.

> ✅ **API Core VALIDE_V1 review : RÉALISÉ** (2026-07-12).
> Rapport : `docs/project-status/API_CORE_V1_READINESS_REVIEW.md`.
> Décision : `API Core NestJS` passe de **`IMPLEMENTATION_AVANCEE`** à **`VALIDE_V1`**.
> Critères vérifiés : roadmap §8.4 + `CORE_SPECIFICATION.md` §41.
> Vérifications : `lint` ✅, `build` ✅, `test 386/386` ✅, `openapi:check` ✅, `npm audit` 0 vuln ✅.
> Les e2e complets restent couverts par la CI `api-runtime` (PostgreSQL + MinIO jetables).
>
> **Historique** : cette prochaine action était Foundation V1 Baseline Readiness Review ; elle est réalisée le 2026-07-12.

> ✅ **Governance 3 — protection `main` vérifiée active via GitHub Rulesets : RÉALISÉ** (2026-07-11).
> Preuve GitHub : `protect-main` (`ruleset_id=17522775`), target `branch`, enforcement `active`, conditions
> `~DEFAULT_BRANCH`. Règles : suppression interdite, non-fast-forward interdit, Pull Request obligatoire,
> conversations résolues obligatoires, status checks stricts. Checks requis actifs : `api-contracts`,
> `api-client-fetch`, `ui-kit`, `web-nextjs`, `audit`, `api-runtime`, `web-e2e`, `api-smoke`.
> Les deux checks `images (...)` ne sont pas requis actuellement ; ils restent recommandés phase 2.
>
> **Historique** : cette prochaine action était API Core VALIDE_V1 review ; elle est réalisée le 2026-07-12.

> ✅ **Governance 2 — alignement des statuts Quality Core après QC5 : RÉALISÉ** (2026-07-11).
> Sweep documentaire ciblé après le merge de Quality Core 5 : `FOUNDATION_CURRENT_STATE.md` ne liste plus
> `quality-core` comme dossier vide ; `SESSION_HANDOFF.md` référence maintenant Quality Core 5
> (`RELEASE_PROCESS_RUNBOOK.md`, templates GitHub, checklists, `quality-gates.mjs`) ; la synthèse courante
> ADR-014 est alignée sur `PARTIELLEMENT_IMPLEMENTE` (registry GHCR, sans déploiement automatique).
> Aucun workflow, runtime, dépendance, tag ou release GitHub modifié.
>
> **Historique** : cette prochaine action était l'activation de la protection de branche ; Governance 3 confirme qu'elle est active via GitHub Rulesets.

> ✅ **Quality Core 5 — release process runbook : RÉALISÉ** (2026-07-11).
> `cores/quality-core/RELEASE_PROCESS_RUNBOOK.md` créé. 5 définitions (merge / promotion / release Foundation / staging / production). 5 types : `foundation-v1-baseline`, `core-v1-validation`, `quality-v2-increment`, `staging-candidate`, `hotfix`. Prérequis généraux (état `main`, CI, qualité locale, documentation, sécurité, Cloud). Procédure en 8 étapes. Format notes de release. Convention de tagging futur (`foundation-vX.Y.Z`, `core-web-vX.Y.Z`, `quality-v2.N`, etc.). Aucun tag créé, aucune release créée, aucun workflow modifié.
> `docs/checklists/RELEASE_READINESS_CHECKLIST.md` : section Foundation Release (Partie 5) ajoutée.
> Vérifications : `git diff --check` ✅, `npm audit` 0 vuln ✅, `plan docs` ✅, `test 36/36` ✅.
>
> **Historique** : cette prochaine action était l'activation de la protection de branche ; Governance 3 confirme qu'elle est active via GitHub Rulesets.

> ✅ **Quality Core 4 — alignement templates PR / Issues avec Quality Core : RÉALISÉ** (2026-07-11).
> `.github/PULL_REQUEST_TEMPLATE.md` modernisé : sections Quality Gates (scope / commandes exécutées / gates exclus), Hors périmètre confirmé, Sécurité renforcée, Statut / gouvernance.
> `.github/ISSUE_TEMPLATE/` mis à jour : `bug_report.md` (environnement, reproduction, impact sécurité, gate concerné), `feature_request.md` (core ciblé, roadmap, hors périmètre, critères d'acceptation), `security_issue.md` (canal privé si sensible, classification, scopes sensibles). `config.yml` ajouté (Security Advisories).
> `cores/quality-core/CORE_SPECIFICATION.md` et `README.md` mis à jour.
> Vérifications : `git diff --check` ✅, `npm audit` 0 vuln ✅, `plan docs` ✅, `test 36/36` ✅.
> Aucun workflow GitHub modifié. Aucune dépendance. Aucun changement runtime.
>
> **Historique** : cette prochaine action était l'activation de la protection de branche ; Governance 3 confirme qu'elle est active via GitHub Rulesets.

> ✅ **Quality Core 3 — runbook de protection de branche et checks requis : RÉALISÉ** (2026-07-11).
> `BRANCH_PROTECTION_RUNBOOK.md` créé dans `cores/quality-core/`. Procédure manuelle complète :
> branche cible `main`, 10 noms de checks exacts (8 requis immédiats : `api-contracts`/`api-client-fetch`/`ui-kit`/`web-nextjs`/`audit`/`api-runtime`/`web-e2e`/`api-smoke` ; 2 recommandés phase 2 : `images (api-nestjs, …)` / `images (web-nextjs, …)`), options recommandées, checklist post-activation. `.github/workflows/README.md` mis à jour.
> **Protection branche `main` : activée depuis Governance 3 via GitHub Rulesets** (`protect-main`, 8 checks requis).
> Vérifications : `git diff --check` ✅, `npm audit` 0 vuln ✅, `plan docs` ✅, `test 36/36` ✅.
>
> **Historique** : cette prochaine action était l'activation de la protection de branche ; Governance 3 confirme qu'elle est active via GitHub Rulesets.

> ✅ **Quality Core 2 — script local de sélection des gates qualité : RÉALISÉ** (2026-07-11).
> `scripts/quality-gates.mjs` ajouté dans `cores/quality-core/scripts/`. Node 24, sans dépendance.
> Commandes : `list` / `plan <scope>` / `run <scope>`. 7 scopes : `docs`, `packages`, `ui-kit`, `web`, `root-audit`, `mobile-static`, `all-safe`.
> Gates exclus par design : Cloud/staging, smoke Android/iOS, E2E Playwright, api-nestjs e2e.
> `scripts/quality-gates.test.mjs` : **36/36 tests node:test** (plans vérifiés sans exécution des commandes).
> Vérifications : `node cores/quality-core/scripts/quality-gates.mjs list` ✅, `plan all-safe` ✅, `plan mobile-static` ✅, tests 36/36 ✅, `git diff --check` ✅, `npm audit` 0 vuln ✅.
> Aucun workflow GitHub modifié. Aucune dépendance. Aucun changement runtime.
>
> **Historique** : cette prochaine action a été remplacée par API Core VALIDE_V1 review, réalisée le 2026-07-12.

> ✅ **Quality Core 1 — cadrage opérationnel des gates qualité V2 : RÉALISÉ** (2026-07-11).
> Démarrage de `cores/quality-core` comme core de gouvernance qualité. Statut : **`SPECIFICATION_DOCUMENTAIRE`**.
> Fichiers créés : `CORE_SPECIFICATION.md` (objectif, périmètre V2, 4 niveaux, règle tests Cloud, gouvernance statut), `README.md` (commandes, guide PR, responsabilités), `QUALITY_GATES_MATRIX.md` (8 cores × 11 types de gate).
> Checklists créées : `docs/checklists/PR_QUALITY_CHECKLIST.md`, `RELEASE_READINESS_CHECKLIST.md`, `CORE_STATUS_REVIEW_CHECKLIST.md`.
> Vérifications : `git diff --check` ✅, `npm audit` root 0 vuln ✅. Aucun workflow GitHub modifié. Aucune dépendance. Aucun changement runtime.
>
> **Historique** : cette prochaine action a été remplacée par la chaîne Quality Core puis API Core VALIDE_V1 review, réalisées.

> ✅ **UI Kit VALIDE_V1 review — RÉALISÉ** (2026-07-11).
> Revue officielle de promotion du UI Kit de `IMPLEMENTATION_AVANCEE` à `VALIDE_V1`.
> Critères §12.4 **4/4** confirmés (tokens ✅ + 19 primitives Web ✅ + docs ✅ + cohérence visuelle mobile/web ✅ RN35).
> Critères §59 **9/9** confirmés. Consommation prouvée : Web Core VALIDE_V1 + Mobile Core STARTER_UI_KIT_ALIGNED.
> Réserves non bloquantes documentées : Storybook différé, composants avancés V2/VF, composants RN dans Mobile Core (ADR-010 intentionnel).
> Rapport mis à jour : `docs/project-status/UI_KIT_V1_READINESS_REVIEW.md` §8/§10/§11.
> Vérifications : `typecheck` ✅, `lint` ✅, `test 181/181` ✅, `build` ✅, `tokens:check` ✅, `audit` 0 vuln ✅, `git diff --check` ✅.
>
> **Prochaine action** : à décider. Candidats : Mobile Core RN31 (iOS smoke — macOS requis) ; Quality Core V1 (industrialisation maintenant que UI Kit et Web Core sont VALIDE_V1).

> ✅ **Mobile RN35 — Alignement UI Kit / états UI mobile : RÉALISÉ** (2026-07-11).
> Ferme le gap bloquant identifié par la revue V1 UI Kit : cohérence mobile/web prouvée par les valeurs.
> `src/theme/tokens.ts` : couleurs hex, typographie et radius alignés verbatim sur
> `cores/ui-kit/generated/typescript/tokens.ts` (tokensVersion 0.1.0). `src/states/index.ts` : aliases
> `LoadingView`/`EmptyView`/`ErrorView` sur les composants `*State` existants. `test/theme-token-alignment.test.ts` :
> **13 nouveaux tests** (spacing, radius, typography, a11y, couleurs light/dark, resolveTheme). `tsconfig.test.json`
> mis à jour pour inclure `src/theme/tokens.ts`. `ARCHITECTURE.md` : §40 documentant l'alignement.
> Score UI Kit : §12.4 **4/4** (cohérence mobile/web ✅), §59 **9/9** (compatibilité RN ✅).
> `UI_KIT_V1_READINESS_REVIEW.md` mis à jour : gap bloquant = 0, scores finaux.
> Vérifications : `typecheck` ✓, `lint` ✓, `test 367/367` ✓, `doctor` 19/19 ✓, `git diff --check` ✓.
>
> **Prochaine action** : le UI Kit peut désormais prétendre à `VALIDE_V1` (périmètre web+mobile prouvé).
> Mission suivante à décider (UI Kit VALIDE_V1 review ou autre priorité).

> ✅ **UI Kit V1 Readiness Review — Revue de stabilité V1 : RÉALISÉ** (2026-07-11).
> Revue officielle de maturité V1 du UI Kit après UI Kit 6 et Web Core UI 2. Lecture complète :
> roadmap §12, CORE_SPECIFICATION §59, ADR-008/009/010, FOUNDATION_CURRENT_STATE, IMPLEMENTATION_MATRIX,
> NEXT_ACTIONS, SESSION_HANDOFF, CHANGELOG. Score initial : **3/4 critères §12.4** + **8/9 critères §59**.
> Statut : **`IMPLEMENTATION_PARTIELLE` → `IMPLEMENTATION_AVANCEE`** (justifié : 19 primitives Web, 181 tests,
> états UI complets, tokens ADR-008 ✅, consommé par Web Core VALIDE_V1).
> Gap bloquant VALIDE_V1 identifié : composants React Native de base absents (différés ADR-010, appartiennent au Mobile Core).
> Rapport versionné : `docs/project-status/UI_KIT_V1_READINESS_REVIEW.md`.
> Vérifications : `typecheck` ✓, `lint` ✓, `test 181/181` ✓, `build` ✓, `tokens:check` ✓, `audit` 0 vuln ✓, `git diff --check` ✓.
>
> **Prochaine action UNIQUE** : **Mobile RN35** — fermée (voir ci-dessus).

> ✅ **Web Core UI 2 — Intégration des state primitives UI Kit 6 : RÉALISÉ** (2026-07-11).
> États génériques Web (`LoadingState`, `EmptyState`, `ErrorState`) remplacés par les primitives UI Kit 6.
> Props conservées (rétrocompatible) : `label`/`inline` (Loading), `title`/`description`/`action`/`inline` (Empty),
> `title`/`description`/`requestId`/`onReset`/`inline` (Error). `role="alert"` et `role="status"` assurés par UI Kit.
> États spécialisés Web conservés : `UnauthorizedState` (401), `ForbiddenState` (403), `ServiceUnavailableState`,
> `NotFoundState` — sémantique HTTP spécifique maintenue, Alert-based structure inchangée.
> **0 régression** (450/450 tests). Aucune nouvelle dépendance, aucun changement BFF/Auth/Files/Cloud/Mobile.
> `typecheck`/`lint`/`test 450/450`/`build`/`audit`/`diff --check` verts.
>
> **Prochaine action UNIQUE** : à décider.

> ✅ **UI Kit 6 — State primitives / états UI standards : RÉALISÉ** (2026-07-11).
> 4 nouvelles primitives. **15 → 19 primitives**. **146 → 181 tests** (+35, 0 régression). Aucune nouvelle
> dépendance. CSS : uniquement `var(--enistere-*)`, classes préfixées `enistere-`, aucun hex.
> **LoadingState** : `<div role="status">` centré, Spinner interne décoratif, `message?`, `size?`.
> **EmptyState** : `<div>` centré (pas de rôle ARIA imposé), `title` obligatoire, `description?`, `action?` slot.
> **ErrorState** : `<div role="alert">` (assertif), `title`, `message?`, `action?`, glyphe ✕ décoratif CSS `::before`.
> **SuccessState** : `<div role="status">` (poli), `title`, `message?`, `action?`, glyphe ✓ décoratif CSS `::before`.
> `test/components-css.test.ts` et `test/consumers/react.consumer.tsx` mis à jour. `tokens:generate` régénéré,
> `tokens:check` up-to-date. Docs : `docs/components.md`, `README.md`, project-status, `CHANGELOG.md` mis à jour.
> `typecheck`/`lint`/`test 181/181`/`build`/`tokens:check`/`audit`/`diff --check` verts.
>
> **Prochaine action UNIQUE** : **à décider** — intégration des états UI Kit 6 dans le Web Core (remplacement des
> composants LoadingState/EmptyState/ErrorState/SuccessState maison), ou nouvelle mission CLI/composant.

> ✅ **Cloud Core CC11 — Durcissement opérationnel staging : RÉALISÉ** (2026-07-11).
> Socle opérationnel du staging CC10 vérifié sur 5 axes :
> **Health** : `staging.enistere.com` + `s3-staging.enistere.com` + `s3/health/live` = **200 HTTPS** ; API interne `health/ready` = **200** (DB up) ; TLS Let's Encrypt **`Verify return code: 0`**.
> **Backup PostgreSQL** : `backup-postgres.sh` → `staging-pg-*.sql.gz` **4.7 Ko** horodaté `chmod 600` ; restore test `enistere_staging_restore` → comptages exacts (Permission 12, Role 2, User 1, RolePermission 12, UserRole 1) ; DB temporaire supprimée.
> **Backup MinIO** : `backup-minio.sh` → **1 fichier 67 B** (`minio/mc mirror`) ; restore test objet dans `restore-test/` → **succès** ; nettoyé.
> **Rollback image** : `sha-484f98d` déployé **`healthy`** (web 200 + status 200) ; roll-forward `sha-5bf4c0f` **`healthy`** (web 200 + status 200).
> **Rotation smoke** : `rotate-smoke-account.sh` → compte smoke staging regénéré en argon2id — **valeur non conservée**.
> Livrables versionnés : `backup-postgres.sh`, `backup-minio.sh`, `rotate-smoke-account.sh`, `CC11_OPERATIONAL_RUNBOOK.md`, `CC11_STAGING_OPERATIONAL_REPORT.md`. **Aucun secret dans le dépôt.**
>
> **Prochaine action UNIQUE** : **à décider hors Cloud réel immédiat** — RN31 reste bloqué tant qu'aucun hôte macOS/Xcode n'est disponible ; pour Cloud, les tests de déploiement réel restants doivent être regroupés comme gate final, pas déclenchés à chaque mission.

> ✅ **Cloud Core CC10 — Staging réel HTTPS : RÉALISÉ** (2026-07-11).
> `docker-compose.cc10.yml` : reverse proxy compatible Traefik + Let's Encrypt HTTP-01, images `sha-5bf4c0f`, serveur staging Enistere.
> 4 conteneurs `healthy`. `staging.enistere.com` = **200 HTTPS** (Let's Encrypt valide via DNS/CDN).
> `s3-staging.enistere.com` = **200 HTTPS**. 5 migrations Prisma. Bucket MinIO privé `enistere-staging-files`.
> Seed RBAC : 12 permissions + rôles `administrator`/`user` + utilisateur test non documenté (argon2id, JS pur via volume mount).
> Auth BFF : CSRF → login **200**, `/me` **200**, `/authorization` **200** (12 permissions confirmées).
> Upload PNG → MinIO **VALIDATED 200**. URL pré-signée `https://s3-staging.enistere.com/...` → téléchargement
> **200** (67 octets, DNS/CDN → reverse proxy → MinIO). **Bout-en-bout validé. Aucun secret dans le dépôt.**
>
> **Prochaine action UNIQUE** : **Cloud Core 11** — réalisé (voir ci-dessus).

> ✅ **UI Kit 5 — Primitives data/feedback légères (Badge / Divider / Skeleton) : RÉALISÉ** (2026-07-10).
> 3 nouvelles primitives. **12 → 15 primitives**. **121 → 146 tests** (+25, 0 régression). Aucune nouvelle
> dépendance. CSS : uniquement `var(--enistere-*)`, classes préfixées `enistere-`. Badge : `<span>` inline,
> `variant` (neutral/info/success/warning/danger), `size` (sm/md). Divider : `<div>` décoratif (`aria-hidden`)
> ou sémantique avec `label` (`role="separator"` + `aria-orientation`). Skeleton : `<div>` `aria-hidden`, animation
> pulse CSS conditionnelle `prefers-reduced-motion`. `test/components-css.test.ts` et `test/consumers/react.consumer.tsx`
> mis à jour. `tokens:generate` régénéré, `tokens:check` up-to-date. Docs : `cores/ui-kit/docs/components.md`,
> `cores/ui-kit/README.md`, `FOUNDATION_CURRENT_STATE.md`, `IMPLEMENTATION_MATRIX.md`, `CHANGELOG.md` mis à jour.
> `typecheck`/`lint`/`test 146/146`/`build`/`tokens:check`/`audit`/`diff --check` verts.
>
> **Prochaine action UNIQUE** : **Cloud Core CC10** — staging réel HTTPS (en cours ci-dessus).

> ✅ **Web Core V1 Gap 3 — RHF + Zod UploadForm : RÉALISÉ** (2026-07-10).
> `uploadFormSchema` Zod v4 (`upload-form-schema.ts`) : `file` (`z.instanceof(File)`, "Fichier requis."),
> `category` (`z.enum(FILE_CATEGORY_VALUES)`, "Catégorie requise."), `subjectId` (`z.string().max(128)`
> optionnel). `UploadForm` migré de `useState` vers `useForm({ resolver: zodResolver(uploadFormSchema) })`
> — `setValue("file", f)` dans onChange (file input non enregistré par RHF pour gérer `File` vs `FileList`),
> `register("category")` + `register("subjectId")`, erreurs via `formState.errors` + `aria-describedby`.
> Anti-double-soumission, section succès, reset complet : inchangés. 4 tests ajoutés (`test/upload-form.test.tsx`)
> : fichier requis, catégorie requise, référence trop longue, succès. Dépendances ajoutées :
> `react-hook-form@^7.81.0`, `zod@^4.4.3`, `@hookform/resolvers@^5.4.0`. **Critère §56 #9 fermé.**
> **Readiness V1 : 13/14 → 14/14 — V1 pleinement stable.** **450 tests** (446+4). 15 tests E2E inchangés.
> `typecheck`/`lint`/`test 450/450`/`build`/`audit`/`diff --check` verts. Branch `web-core-v1-gap-3-rhf-zod`.
>
> **Prochaine action UNIQUE** : **UI Kit 5** — Badge/Divider/Skeleton — réalisé (voir ci-dessus).

> ✅ **Web Core V1 Gap 2 — Dashboard layout minimal : RÉALISÉ** (2026-07-10).
> `DashboardShell` Server Component ajouté (`src/features/dashboard/dashboard-shell.tsx`) — header de
> navigation avec 3 liens (Accueil `/protected`, Fichiers `/protected/files`, Envoyer un fichier
> `/protected/files/upload`) + lien de retour "Enistère" → `/`. Liens HTML natifs (`<a>`) pour
> compatibilité `tsconfig.test.json` (pas de `next/link` dans `src/features/`). Intégré dans
> `(protected)/layout.tsx` — uniquement sur le chemin authentifié, après résolution de session ;
> le chemin `ServiceUnavailableView` reste sans shell. **Critère §56 #3 fermé** (layouts standards :
> layout public ✓ Gap 1 + layout dashboard ✓ Gap 2). **Readiness V1 : 13/14.** Test E2E ajouté
> (navigation dashboard visible après login — 14 → 15 tests). `typecheck`/`lint`/`test 446/446`/
> `build`/`audit`/`diff --check` verts. Branch `web-core-v1-gap-2-dashboard-layout`.
>
> **Prochaine action UNIQUE** : **Web Core V1 Gap 3** — React Hook Form + Zod (critère §56 n°9 :
> "les formulaires et validations fonctionnent"). Migration `UploadForm` sur RHF + schéma Zod, ou
> création d'un formulaire exemple dédié. Ferme le dernier critère manquant → **V1 pleinement stable
> 14/14**.

> ✅ **Web Core V1 Gap 1 — Public layout + landing page minimale : RÉALISÉ** (2026-07-10).
> Route group `(public)/` ajouté — layout public (header nav Enistère + lien "Se connecter" + footer)
> en Server Component pur, sans vérification de session. Landing page statique à `/` : h1 "Enistère OS
> Foundation", description, liste des modules, liens vers `/login` et `/status`. Page technique de
> statut déplacée de `/` vers `/status` (FoundationStatus + HealthPanel + SessionPanel conservés,
> dynamique). SEO baseline : `metadata` par page (`robots: index: true` sur la landing, noindex sur
> `/status` par héritage du root layout), `robots.ts`, `sitemap.ts` (NEXT_PUBLIC_APP_URL configurable).
> E2E health test adapté (`page.goto("/")` → `"/status"`, 14 tests toujours verts). CSS public layout
> + landing dans `globals.css`. Build : `/` = statique, `/status` = dynamique, `/robots.txt` et
> `/sitemap.xml` présents. `typecheck`/`lint`/`test 446/446`/`build`/`audit`/`diff --check` verts.
> **Critères §56 fermés : #11 (SEO baseline pages publiques). #3 avancé (layout public présent ;
> dashboard layout = Item 2 restant). Readiness V1 passe de 11/14 à 12/14.** Branch
> `web-core-v1-gap-1-public-layout`.
>
> **Prochaine action UNIQUE** : **Web Core V1 Gap 2** — dashboard layout minimal (ferme critère §56
> n°3 complètement : groupe `(dashboard)/` ou extension `(protected)/` avec navigation latérale
> minimale — lien "Fichiers", lien "Accueil"). Suivi : Item 3 (RHF+Zod, critère n°9). Après ces
> 2 items : V1 pleinement stable (14/14).

> ✅ **Web Core V1 Readiness Review : RÉALISÉ** (2026-07-10).
> Revue de maturité complète du Web Core Next.js selon les 14 critères d'acceptation V1 (§56
> `CORE_SPECIFICATION.md`). Verdict : **`IMPLEMENTATION_PARTIELLE` — 11/14 critères satisfaits**.
> 3 critères bloquants : (3) layouts standards absents (pas de groupe `(public)/` ni `(dashboard)/`),
> (9) formulaires/validations sans RHF/Zod, (11) SEO baseline absent (aucune page publique).
> Forces confirmées : auth BFF complet, Files V1 complet (upload/suppression/admin), 14 tests E2E,
> CI 4 niveaux, UI Kit 4, TanStack Query v5, 446 tests unitaires, zéro secret exposé.
> Faux négatifs : absence Tailwind/shadcn intentionnelle (ADR-009), data table optionnel (§10).
> Rapport : `docs/project-status/WEB_CORE_V1_READINESS_REVIEW.md`. Branche
> `web-core-v1-readiness-review`.
>
> **Prochaine action UNIQUE** : **Web Core V1 gap ciblé — Item 1** (public layout + landing page
> minimale) — ferme les critères §56 n°3 et n°11 en une session. Suivi : Item 2 (dashboard layout
> minimal, critère n°3 complet) puis Item 3 (RHF+Zod UploadForm ou form example, critère n°9).
> Après Items 1+2 : déclaration "V1 stable avec réserves" (12/14). Après Item 3 : V1 pleinement
> stable (14/14). Alternatives écartées : UI Kit 5 (0 critère §56 fermé), Cloud staging (dépendance
> externe), RN31 macOS (hôte indisponible sur Linux).

> ✅ **Web Core Files 8 — E2E Playwright upload/suppression : RÉALISÉ** (2026-07-10).
> Extension des tests E2E navigateur aux chemins d'écriture Files : upload (`UploadForm` → formulaire →
> confirmation UI `<section aria-label="Fichier envoyé">` → liste → détail) et suppression (fixture API
> isolée `uploadFileViaApi` → Dialog confirmation → `router.replace("/protected")` → anti-énumération 404
> → liste sans fichier). **14 tests E2E** (12 → 14, +2). `helpers.ts` : `uploadFileViaApi` +
> `TEST_PNG_B64` exportés ; `files.spec.ts` : deux nouveaux `describe` (`Files (upload)` + `Files
> (suppression)`). Aucun workflow, runtime, BFF ni package modifié. **446 tests** unitaires inchangés.
> `typecheck`/`lint`/`test 446/446`/`build`/`audit`/`diff --check` verts. Branch
> `web-core-files-8-e2e-upload-delete`.
>
> **Prochaine action UNIQUE** : **Mobile Core React Native 31** (iOS smoke sur macOS/Xcode — précondition
> externe, non disponible sur Linux).

> ✅ **Web/Core Governance 1 — alignement CI requise et ADR-013 : RÉALISÉ** (2026-07-09).
> Revue de cohérence gouvernance/CI après Web Core Files 7. Vérifications (aucun blocage) :
> (1) les noms des jobs CI (`api-contracts`/`api-client-fetch`/`ui-kit`/`web-nextjs`/`audit` dans
> `ci.yml`, `api-runtime` dans `api-runtime-ci.yml`, `web-e2e` dans `web-e2e-ci.yml`, `images` dans
> `registry-ci.yml`) correspondent **exactement** aux 7+1 checks documentés (`README.md`,
> `GITHUB_BRANCH_PROTECTION_CHECKLIST.md`) ; (2) les 4 niveaux CI sont en place (niveaux 1–3 + niveau 4
> partiel registry) ; (3) ADR-013 `PARTIELLEMENT_IMPLEMENTE` (branch protection non appliquée — action
> humaine en attente) et ADR-014 `PARTIELLEMENT_IMPLEMENTE` (registry GHCR — CC5) confirmés.
> **Corrections documentaires** : `README.md` workflows (dernier paragraphe obsolète : « ADR-014
> `NON_IMPLEMENTE` » et « niveaux 1–3, manque niveau 4 » — corrigés) ; `SESSION_HANDOFF.md` §5
> (statut mobile `RETRY_READY` → `STARTER_EXPO_DOCTOR_GREEN`, 346 → 355 tests). Aucun workflow
> ni comportement runtime modifié. `git diff --check` vert.
>
> **Prochaine action UNIQUE** : **Mobile Core React Native 31** (iOS smoke sur macOS/Xcode — précondition
> externe, non disponible sur Linux) ; à défaut : **Web Core Files 8** (extension Playwright E2E pour
> les parcours upload/suppression — `web-e2e-ci.yml` couvre la lecture mais pas les chemins d'écriture
> Files 2/3).

> ✅ **Web Core Files 7 : RÉALISÉ** (`web-nextjs/` → **446 tests**, +53). Files 7 ajoute les BFF
> handlers et primitives UI minimales pour les actions admin quarantaine/restauration. Handlers
> `handleQuarantineFile` + `handleRestoreFile`, routes `/api/files/[id]/quarantine` + `/restore`,
> client BFF `quarantineFile`/`restoreFile` (same-origin, credentials:include, CSRF, jamais Bearer),
> hooks `useQuarantineFile`/`useRestoreFile` (mutation sans mutationKey, anti-double-soumission,
> `fileKeys.all` invalidation), `AdminFileActions` (rendu conditionnel par permission), page admin
> `/protected/files/[id]/admin`. CSRF+Origin sur toutes les mutations. L'API reste l'autorité.
> `typecheck`/`lint`/`test 446/446`/`build`/`audit`/`diff --check` verts. Branch `web-core-files-7-admin-bff`.
>
> **Prochaine action UNIQUE** : à décider par décision humaine. Candidats :
> **Mobile Core React Native 31** (iOS smoke sur macOS/Xcode dès qu'un hôte est disponible),
> **Web Core — CI minimale** (ADR-013 — réserve transverse n°1).

> ✅ **Web Core Files 6 : RÉALISÉ** (`web-nextjs/` → **393 tests**, +3). Files 6 réalise la revue
> globale Files V1 bout-en-bout. 4 défauts corrigés : D1 (cache delete→list, `useDeleteFile.onSuccess`),
> D2 (cache upload→list, `useUploadFile.onSuccess` manquant), D3 (message 409 neutre dans `classifyFileError`),
> D4 (upload 409→`QUOTA_EXCEEDED`, handler ciblé avant `filesErrorResponse`). 3 tests ajoutés, 1 mis à jour.
> Rapport versionné `docs/project-status/WEB_FILES_V1_REVIEW.md`. Verdict : **stable avec réserves mineures**
> (6 réserves documentées R1–R6, aucune bloquante). `typecheck`/`lint`/`test 393/393`/`build`/`audit`/
> `diff --check` verts. Branch `web-core-files-6-v1-review`.
>
> **Prochaine action UNIQUE** : décidée → **Web Core Files 7** (admin BFF quarantaine/restauration, ci-dessus).

> ✅ **Web Core Files 5 : RÉALISÉ** (`web-nextjs/e2e/` → **12 tests E2E**, +5). Files 5 ajoute 5
> tests Playwright pour `/protected/files` : propriétaire voit le fichier seedé (champs publics,
> aucun champ interne) ; clic → navigation vers `/protected/files/:id` (href + heading h1) ; 1 fichier
> seedé → aucune pagination ; anonyme → redirection `/login` ; sans permission → Alert `role=alert`
> (`test.skip` si `E2E_NOPERM_EMAIL` absent). Déterministe (1 fichier VALIDATED via `global-setup.ts`),
> compatible CI (`web-e2e-ci.yml`). **390/390 tests unitaires inchangés**, typecheck/lint/build/audit verts.
>
> **Prochaine action UNIQUE** : à décider → **Web Core Files 6** (revue globale Files V1, ci-dessus).

> ✅ **Web Core Files 4 : RÉALISÉ** (`web-nextjs` → **390 tests**). Files 4 ajoute la liste paginée
> de fichiers BFF : `GET /api/files` handler (validation query limit 1–50 / offset ≥ 0, 400 sans
> appel API si invalide, client `read-only`, `no-store`, aucun CSRF), `FileListResponse` type dérivé
> du contrat, `listFiles({ limit?, offset? })` client BFF navigateur (same-origin, `credentials:include`,
> aucun Bearer), `fileKeys.list({ limit, offset })` clé stable, `useFileList` hook (`retry:false`),
> `FileListView` composant client (états loading/vide/erreur/liste, champs publics uniquement, pagination
> Précédent/Suivant, liens `/protected/files/:id`), page `/protected/files` (Server Component, délègue
> `searchParams` à `FileListView`). **390/390 tests**, typecheck/lint/test/build/audit verts.
>
> **Prochaine action UNIQUE** : décidée → **Web Core Files 5** (E2E Playwright liste, ci-dessus).

> ✅ **API Core Files 5 : RÉALISÉ** (`api-nestjs` → **386 tests unitaires + 7 e2e Files 5**). Files 5
> ajoute `GET /files?limit=&offset=` — liste paginée read-only des fichiers du propriétaire courant.
> `files.read` requis, ownership-scoped, exclusion `DELETED` (`deletedAt: null`), tri `createdAt desc`,
> pagination offset-based (`limit` 1–50, défaut 20 ; `offset ≥ 0`). Trick limit+1 (aucun COUNT séparé).
> Réponse publique : `{ items: PublicStoredFile[], limit, offset, nextOffset: number | null }` — aucun
> champ interne. `FileListQueryDto` + `FileListResponseDto` ajoutés. `FilesService.listOwnedFiles()`.
> OpenAPI régénéré (`files_list`, `FileListResponseDto`). `api-contracts` régénéré. `FilesApi.list()`.
> **386/386 tests unitaires API**, `api-contracts` **12/12**, `api-client-fetch` **30/30**,
> typecheck/build verts.
>
> **Prochaine action UNIQUE** : à décider par décision humaine. Candidats :
> **Web Core Files 4** (liste BFF `GET /api/files` — consomme `FilesApi.list()`, `useFileList` hook,
> page `/protected/files`),
> **Mobile Core React Native 31** (iOS smoke sur macOS/Xcode dès qu'un hôte est disponible).

> ✅ **Web Core Files 3 : RÉALISÉ** (`web-nextjs` → **357 tests**). Files 3 ajoute la suppression
> fichier sécurisée BFF : `DELETE /api/files/:id` (UUID 400 avant appel API, CSRF/Origin 403 avant
> appel API, client `writable`), client BFF `deleteFile` (same-origin, aucun Bearer), mutation
> `useDeleteFile` (sans `mutationKey`, anti-double-soumission, `queryClient.removeQueries` après
> succès), bouton « Supprimer » + Dialog confirmation UI Kit 4 dans `FileDetails`, navigation
> post-succès via `onDeleteSuccess` prop, 409→NOT_DELETABLE, anti-énumération 404.
> **357/357 tests**, typecheck/lint/test/build/audit verts.
>
> **Prochaine action UNIQUE** : décidée → **API Core Files 5** (ci-dessus).

> ✅ **Web Core Files 2 : RÉALISÉ** (`web-nextjs` → **333 tests**). Files 2 ajoute l'upload Web
> sécurisé BFF multipart : BFF ciblé `POST /api/files/upload` (CSRF/Origin obligatoires, validation
> fichier+catégorie, client `writable`), client BFF navigateur `uploadFile` (FormData sans
> Content-Type forcé, same-origin, aucun Bearer), mutation `useUploadFile` (sans `mutationKey`,
> anti-double-soumission, résultat jamais en QueryCache), `UploadForm` (9 catégories Select,
> fichier+subjectId, Alert erreur/succès), page `/protected/files/upload`, mapping 413/415.
> L'API Core reste l'autorité MIME/taille/permissions (ADR-007). Aucun upload direct MinIO/S3,
> aucun log de nom/contenu. **333/333 tests**, typecheck/lint/test/build/audit verts.
>
> **Prochaine action UNIQUE** : à décider par décision humaine. Candidats :
> **Mobile Core React Native 31** (iOS smoke sur macOS/Xcode dès qu'un hôte est disponible),
> ou **Web Core** (suite Files : delete, admin, prévisualisation).

> ✅ **UI Kit 4 : RÉALISÉ** (`ui-kit` → **12 primitives Web React**). UI Kit 4 ajoute
> Dialog (modale `<dialog>` native, `showModal()`/`close()`, focus trap, ESC, backdrop nativement,
> `aria-modal`), Select (`<select>` natif + chevron CSS-only, `size`, `invalid` → `aria-invalid`,
> `forwardRef` sur `<select>`) et Toast/ToastRegion (notification non-modale, `variant` →
> `role`/`aria-live`/`aria-atomic`, 6 positions). Aucune logique métier, aucun Radix/shadcn/Tailwind
> (ADR-009). `@enistere/ui-kit` passe de 9 à **12 primitives**, 78 → **121 tests** (0 régression).
> `npm run tokens:generate` régénéré, `npm run tokens:check` vert, `npm run lint` vert,
> `git diff --check` vert.

> ✅ **Mobile Core React Native 34 : RÉALISÉ** (`mobile-react-native` →
> **`STARTER_EXPO_DOCTOR_GREEN`**). RN 34 aligne les patchs Expo SDK 55
> nécessaires (`expo` 55.0.26→55.0.27, `expo-linking` 55.0.15→55.0.16,
> `expo-secure-store` 55.0.14→55.0.15) pour ramener expo-doctor de 18/19 à
> **19/19**. Aucun changement de code runtime. Typecheck, lint, test 355/355,
> expo-doctor **19/19**, expo export -p ios, npm audit 0 vuln, git diff --check
> verts. **`npm run smoke:android` passed** (`emulator-5554` / Pixel_6a, 2026-07-08 —
> loginCount=1, refreshCount=1).
>
> **Prochaine action UNIQUE** : à décider par décision humaine. Candidats :
> **Mobile Core React Native 31** dès qu'un hôte macOS/Xcode est disponible
> (exécution iOS smoke réelle — précondition externe), ou
> **UI Kit 4** (primitives interactives Dialog/Select/Toast).

> ✅ **Mobile Core React Native 33 : RÉALISÉ** (`mobile-react-native` →
> **`STARTER_THEME_PREFERENCE_READY`**). RN 33 câble la préférence de thème
> locale (`system`/`light`/`dark`) au `ThemeProvider` via
> `ThemePreferenceProvider` (lit `useUiStore.themePreference`, passe `scheme` ou
> `undefined` pour suivre l'OS). L'écran Settings expose un sélecteur
> System/Light/Dark. `reset()` remet la préférence à `'system'`. In-memory
> uniquement (ADR-015 §16). Typecheck, lint, test 355/355, expo export -p ios,
> npm audit 0 vuln, git diff --check verts. Expo-doctor 18/19 (drift patch
> pré-existant, corrigé en RN34).

> ✅ **Mobile Core React Native 32 : RÉALISÉ** (`mobile-react-native` →
> **`STARTER_SIGN_IN_FORM_READY`**). RN 32 remplace le bouton sign-in avec
> credentials hardcodés par un formulaire générique email/password utilisant RHF
> + Zod via les primitives RN3 existantes (`emailField`, `requiredText`,
> `TextInputField`, `createZodResolver`). Erreurs de champ accessibles, état
> loading, erreur auth générique sans fuite. `scripts/smoke-android.js` adapté
> pour remplir les champs du formulaire (`tapInputAndType`, `findInputByLabel`).
> `scripts/smoke-ios.js` procedure mise à jour. Typecheck, lint, test 355/355,
> expo export -p ios, npm audit et git diff --check verts.

> ✅ **Mobile Core React Native 31 : EN ATTENTE PRÉCONDITION EXTERNE**
> (`STARTER_IOS_SMOKE_BLOCKED_BY_ENVIRONMENT` maintenu). Hôte Linux,
> `xcrun` absent. Aucun smoke iOS réel ne peut être exécuté ici. RN31 est
> prête à exécuter sur macOS/Xcode — procédure documentée dans
> `docs/project-status/MOBILE_RN30_IOS_SMOKE_PARITY.md` et mise à jour
> dans `scripts/smoke-ios.js` (RN32) pour le formulaire. RN32 progresse
> sur un livrable V1 actionnable dans l'environnement courant.

> ✅ **Mobile Core React Native 30 : RÉALISÉ / BLOQUÉ ENVIRONNEMENT** (`mobile-react-native` →
> **`STARTER_IOS_SMOKE_BLOCKED_BY_ENVIRONMENT`**). RN 30 ajoute
> `npm run smoke:ios` et documente la parité iOS : l'environnement courant est
> Linux (`greenovate`) sans `xcrun`, donc aucun runtime iOS réel ne peut être
> exécuté ici. Android reste couvert par RN28/RN29. `expo export -p ios`,
> typecheck, lint, test, expo-doctor, smoke iOS `blocked` documenté et
> `git diff --check` sont verts.

> ✅ **Mobile Core React Native 27 : RÉALISÉ** (`mobile-react-native` →
> **`STARTER_RUNTIME_HARDENED`**). RN 27 durcit le shell Expo
> public/protégé/settings sans nouvelle primitive ni logique métier : boutons
> bornés/full-width avec label réductible, conteneurs Sign-in/Home contraints,
> lignes Settings wrap-safe. `expo export -p ios`, typecheck, lint, test,
> expo-doctor et `git diff --check` sont verts. L'export web reste non applicable
> sans `react-native-web`, dépendance non ajoutée.
>
> **Historique RN27** : cette prochaine action était RN28 ; elle est désormais
> réalisée sous forme de smoke visuel Android.

> ✅ **Mobile Core React Native 26 : RÉALISÉ** (`mobile-react-native` →
> **`STARTER_SETTINGS_READY`**). RN 26 ajoute une route Settings protégée
> (`app/(app)/settings.tsx` + `ROUTES.settings`) et un lien depuis Home pour
> aligner le starter avec `strategy/04_ROADMAP_GLOBAL.md` §9 Mobile Core React
> Native V1. L'écran expose session, reset UI Zustand, consentement placeholder
> RN21, contexte safe RN22 et diagnostics de primitives, sans réseau, endpoint
> métier, SDK réel, adaptateur natif réel, persistance nouvelle ni retry branché.
>
> **Historique RN26** : cette prochaine action était RN27 ; elle est désormais
> réalisée sous forme de durcissement runtime starter.

> ✅ **Mobile Core React Native 25 : RÉALISÉ** (`mobile-react-native` →
> **`TELEMETRY_COORDINATOR_READY`**). RN 25 ajoute `src/telemetry` : contexte
> télémétrie sûr basé RN 22, gate consentement RN 21 default-deny, et
> `createTelemetryCoordinator({ consent, environment, analytics?, crash?, logger? })`
> avec `track`, `captureError`, `captureMessage` **opt-in uniquement**. Aucun SDK
> réel, réseau, persistance, identify/user-id, émission au démarrage ni retry RN 24.
> Logs sûrs `{operation,category,allowed}`. **355 cas `test(...)`** ; typecheck,
> lint, test, doctor et `git diff --check` verts.
>
> **Historique RN25** : la prochaine action était RN26 ; elle est désormais
> réalisée sous forme de starter Settings V1.

> ✅ **Mobile Core React Native 1→24 : RÉALISÉS** (`mobile-react-native` → **`RETRY_READY`**). RN 4/4B/5 :
> client officiel **`@enistere/api-client-fetch`** intégré + **pont 401** `authedRequest` + **couche server-state**
> TanStack Query générique (`createQueryKeys`, `useAuthedQuery`/`useAuthedMutation` via `authedRequest`,
> `toQueryError` sans donnée sensible, `invalidateScope`/`purgeServerState`). **RN 6 — état local UI + purge logout** :
> **Zustand** `useUiStore` générique (primitives UI **non sensibles** : `themePreference` + `flags` booléens)
> **séparé** du server-state (anti-pattern spec §57), **in-memory sans persistance** ; **purge logout déterministe
> câblée** dans `AuthProvider` (`await cancelQueries`→`clear` dès `unauthenticated`/`expired` = signOut + expiry,
> **AuthEngine inchangé**). **RN 7 — upload sécurisé (multipart)** : descripteur RN `MobileFile {uri,name,type}`
> (structurellement assignable au `ReactNativeFileDescriptor` du package) + helpers **purs** (`isMobileFile`,
> `describeFileForLog` **sans `uri`**, `isAllowedFileType` pré-check UX) + `useUploadMutation` via `useAuthedMutation`
> → `apiClient.files.upload(file, category, {subjectId, retryOnAuthRefresh:false})` (refresh 401 possédé par
> l'AuthEngine, `FormData` reconstruit au retry) ; **mutation → aucune clé de cache** ; **aucun fichier/URL
> signée/token/Authorization** en query key/cache/log/store ; `toQueryError` étendu **413/415** ; **backend
> autoritaire** (ADR-007). **RN 8 — logger/observabilité (avec redaction)** : logger générique typé (`createLogger` :
> `debug`/`info`/`warn`/`error`, niveaux, **sink pluggable**, horloge injectée, corrélation `child`/`withRequestId`)
> + **redaction centrale** (`redactValue`/`redactString` : tokens/`Authorization`/cookies/JWT/**URL signées**/**chemins
> device**/**PII**) appliquée **avant** tout sink ; `safeErrorFields(QueryError)` ; **correctif `describeFileForLog`**
> (plus de nom brut → `{type,extension}`) ; **aucune persistance/transport réseau/service externe/log de body**
> (ADR-040). **RN 9 — permissions natives génériques (gouvernées)** : modèle pur `PermissionKind`/`PermissionStatus`
> + `normalizePermissionStatus`/`canRequestPermission`/`isPermissionGranted` ; `PermissionAdapter` (seam Expo) +
> `createPermissionService` (live `getStatus`/`request`/`ensure`/`openSettings`, **logs sûrs** via logger RN 8,
> `PermissionAdapterError` contrôlé) ; **adaptateur placeholder** (no native dep) ; hook `usePermission` (**no UI**).
> **Statut jamais persisté** (ni SecureStore/Zustand/Query) ; **API Core = autorité** (07_SECURITY §6). **RN 10 —
> notifications client (primitives locales, sans push réel)** : `NotificationMessage` borné/sûr (`sanitizeNotificationMessage`,
> `describeNotificationForLog` **sans contenu**) + `NotificationDeliveryState`/`NotificationTrigger` ; `NotificationAdapter`
> (seam Expo) + `createNotificationService` (**gate** sur la permission `notifications` RN 9 — **jamais de schedule
> sans permission usable**, `schedule`/`cancel`/`cancelAll`/`getDelivered`, **logs sûrs**, `NotificationError` contrôlé) ;
> **adaptateur placeholder** (no native dep). **LOCAL uniquement** : aucun push réel, aucun token device/FCM/APNs, aucun
> stockage, aucune UI. **RN 11 — i18n / localisation primitives génériques** : modèle de locale (`normalizeLocale` via
> `Intl`, `getLocaleDirection` ltr/rtl, `resolveLocale`) + **catalogue typé** (`createTranslator` : `t`/`has`/`plural`,
> interpolation `{name}`, pluralisation `Intl.PluralRules`, clé inconnue **sans throw**) + **formatters `Intl`**
> (`formatDate`/`formatNumber`/`formatCurrency` — devise requise, **ne lèvent jamais**) ; `LocaleAdapter` + placeholder
> (no native dep) + `createLocalization`. **Aucune dépendance** (tout via `Intl`), **aucun réseau/persistance/UI** ;
> **catalogues métier = projets dérivés**. **RN 12 — deep-linking / routing primitives génériques** : parseur pur
> (`parseDeepLink`/`decodeSafe`/`normalizeUrl`) + **`resolveLink`** (`internal`/`externalBlocked`/`invalid`) — **allowlist
> stricte** schemes/hosts, **anti-open-redirect** (`//`/`scheme://`/`..`), **params sensibles supprimés**, bornes ;
> `isInternalRoute` ; **`resolveNotificationLink`** (clé configurable, tap notification RN 10). **Aucun log** (ni query
> sensible), **aucun stockage** de lien/URL, **aucune dépendance** ; routes concrètes = projets dérivés. **RN 13 —
> analytics / télémétrie primitives génériques (avec redaction, sans SDK réel)** : `AnalyticsEvent` borné + **redaction
> dédiée basée RN 8** (`sanitizeAnalyticsEvent` : `isSensitiveProperty` réutilise `isSensitiveKey` + scrub valeurs via
> `redactString`, bornes, **sans throw**) ; `AnalyticsAdapter` (track/flush?, **pas de `identify`**) + `createAnalyticsService`
> (track **best-effort non-intrusif**, **logs sûrs** `{eventName,propertyCount}`, erreurs adapter contrôlées) + placeholder
> mémoire. **Aucun SDK réel/réseau/persistance/user-id**. **RN 14 — accessibilité (a11y) primitives génériques**
> (ADR-010 §16 / spec §45) : props RN-compatibles (`buildA11yProps` : `role`/`label`/`hint`/`state`, `normalizeA11yText`
> borné) + **`A11yState`** normalisé (`disabled`/`focused`/`pressed`/`invalid` + RN state ; `mergeA11yState`,
> `isInteractiveRole`) + **annonce** lecteur d'écran (`sanitizeAnnouncement`, `describeAnnouncementForLog` **sans texte**)
> + `A11yAdapter` (announce/focus?/isScreenReaderEnabled?, `A11yAdapterError` contrôlé) + placeholder + `createA11yService`
> (best-effort **non-intrusif**, **logs sûrs** `{length,assertive}`). **Aucun `AccessibilityInfo` réel/provider global/
> stockage/UI/dépendance**. **RN 15 — app lifecycle primitives génériques** : modèle d'état `AppLifecycleState`
> (`active`/`background`/`inactive`/`unknown`) + helpers purs (`normalizeAppLifecycleState`, `isForeground`/`isBackground`,
> `isValidTransition`, `nextAppLifecycleState`) ; `AppLifecycleAdapter` (seam RN `AppState`) + placeholder +
> `createAppLifecycleService` (`getState`/`subscribe`/`transition`/`dispose`, transitions **validées**, **logs sûrs**
> `{from,to}` — que des enums, erreurs adapter contrôlées, listener isolé). **Aucun `AppState` réel/provider global/
> stockage/dépendance**. **RN 16 — connectivité réseau (network status) primitives génériques** : **étend `src/offline`**
> (RN 3 inchangé, `shouldQueueMutations` **canonique**) — `NetworkConnectionType` borné + `normalizeNetworkStatus`/
> `normalizeConnectionType` ; `NetworkAdapter` (seam RN NetInfo, `NetworkAdapterError`) + placeholder + `createNetworkService`
> (`getStatus(): NetworkState`/`shouldQueue`/`subscribe`/`transition`/`dispose`, `changedAt` via horloge injectée, **logs
> sûrs** `{from,to,type}` enums, erreurs contrôlées, listener isolé). **Aucun NetInfo réel/dépendance/offline sync/
> persistance/donnée sensible.** **RN 17 — feature flags / config primitives génériques** : **étend `src/config`** (env
> inchangé ; **distinct des `flags` UI Zustand RN 6**) — `FlagValue` (boolean/string/number) + `FlagSet` bornés
> (`MAX_FLAG_KEY_LENGTH`/`MAX_FLAG_VALUE_LENGTH`/`MAX_FLAGS`) + `sanitizeFlagSet` tolérant + **getters typés à défaut sûr** ;
> `FlagAdapter` (seam local/remote-config, `FlagAdapterError`) + placeholder mémoire + `createFlagService`
> (`getFlag`/`getAll`/`subscribe`/`refresh`/`dispose`, **non-intrusif**, **logs `{count}`/`{operation}` — jamais clé ni
> valeur**). **Aucun SDK remote-config réel/réseau/persistance/user targeting réel/secret/donnée sensible.** **RN 18 —
> gate biométrique local primitives génériques** (ADR-015 §20/§21) : `src/biometrics` — disponibilité
> (`available`/`notEnrolled`/`unsupported`/`unknown`) + type borné + résultat
> (`success`/`refused`/`cancelled`/`lockout`/`unavailable`/`error`) ; helpers tolérants (**junk → `unknown`/`error`,
> jamais `success`**) ; `BiometricAdapter` (seam Expo `LocalAuthentication`/Keychain, `BiometricAdapterError`) +
> placeholder mémoire + `createBiometricService` (`getAvailability`/`isAvailable`/`authenticate`, **aucun faux succès** —
> `unavailable` sans prompt si inutilisable, **logs `{availability,type}`/`{outcome}`/`{operation}` — jamais prompt ni
> cause native**). **Gate d'UX local — ne remplace JAMAIS l'auth serveur.** **Aucun `LocalAuthentication`/Keychain réel,
> aucun secret/biométrie/résultat stocké.** **RN 19 — crash / error-reporting primitives génériques (seam, sans SDK
> réel)** (ADR-040 §17/§18/§19 / ADR-015 §12/§21/§24) : `src/crash-reporting` — `CrashReportEvent` borné
> (`severity`/`source`/`name`/`message`/`stack?`/`context`) **rédigé via redaction RN 8** + bornes (`sanitizeCrashMessage`/
> `sanitizeCrashStack` **jamais de stack brute** / `sanitizeCrashContext` clés sensibles → `[Redacted]`) ;
> `CrashReporterAdapter` (seam Sentry/Crashlytics, `CrashReporterAdapterError`) + placeholder mémoire (copies défensives) +
> `createCrashReporterService` (`captureError`/`captureMessage`/`setContext`/`flush`, **best-effort non-intrusif** — sync
> throw + async reject capturés, **jamais de faux succès**, **logs `{operation,severity,source}` — jamais le contenu**).
> **Sans SDK réel/réseau/persistance/batching/crash handler global ; ne décide pas ADR-019 ; aucun token/PII/body/stack
> brute/user-id.** **RN 20 — préférences non sensibles persistantes primitives génériques (seam, sans MMKV/AsyncStorage
> réel)** (ADR-015 §15/§16) : `src/preferences` — `PreferenceValue` (bool/string/number) + `PreferenceSet` bornés +
> `isValidPreferenceKey` (format **+ non sensible**, réutilise `isSensitiveKey`) + `isSensitivePreferenceValue` +
> `sanitizePreferenceSet` + getters typés à défaut sûr ; `PreferenceStore` (seam **async** MMKV/AsyncStorage,
> `PreferenceStoreError`) + placeholder mémoire (copies défensives) + `createPreferenceService` (`get`/`getBoolean`/
> `getString`/`getNumber`/`set`/`remove`/`clear`/`getAll`/`subscribe` — **garde les écritures** + **assainit les
> lectures**, **best-effort**, listener isolé, **logs `{operation,count}` — jamais clé ni valeur**). **Données NON
> sensibles uniquement** (clé/valeur sensible → drop), **distinct** de SecureStore/Zustand RN 6/TanStack Query. **Sans
> MMKV/AsyncStorage réel/réseau/secret/PII ; ne décide aucun stockage natif.** **RN 21 — consentement télémétrie /
> privacy gate primitives génériques** (ADR-038) : `src/consent` — `ConsentCategory`
> (`analytics`/`crash`/`performance`/`diagnostics`) + `ConsentStatus` (`granted`/`denied`/`unknown`) + `ConsentSet` ;
> `normalizeConsentCategory`/`normalizeConsentStatus`/`sanitizeConsentSet`/`isConsentGranted`/**`isTelemetryAllowed`**
> (**default-deny** — `granted` seul autorise, `unknown`/`denied`/absent/invalide bloquent) ; `ConsentStore` (seam,
> `ConsentStoreError`) + **`createPreferenceConsentStore`** (persistance **déléguée aux préférences RN 20** sous clés non
> sensibles `privacy.consent.*`, `clear()` ne touche que ces clés) + placeholder mémoire (copies défensives) +
> `createConsentService` (`get`/`set`/`isAllowed`/`getAll`/`clear`/`subscribe`, best-effort — store défaillant → non
> autorisé, listener isolé, **logs `{operation,category,status}`/`{operation,count}` — jamais de valeur utilisateur**).
> **Gate à consulter AVANT émission analytics RN 13 / crash RN 19 ; sans SDK réel/réseau/UI/identifiant/PII ; ne décide
> pas ADR-038 ; ne câble pas analytics/crash.** **RN 22 — environnement / métadonnées app primitives génériques non
> identifiantes (seam, sans `expo-application`/`expo-device` réel)** : `src/app-environment` — `AppEnvironmentSnapshot`
> **borné, allow-list stricte** (`os` ios/android/web/unknown + `osVersionMajor` **majeur seulement** + `appVersion`/
> `buildNumber`/`buildChannel`/`locale`/`environment`) + normalizers tolérants (**`normalizeMajorVersion`** `17.5.1`→`17`,
> `normalizeLocaleField` via i18n) + **`sanitizeAppEnvironmentSnapshot`** (lit **uniquement** les clés autorisées → drop
> deviceId/IDFA/AndroidID/pushToken/serial/model/IP) + `describeAppEnvironmentForLog` (grossier) ; `AppEnvironmentAdapter`
> (seam `expo-application`/`expo-device`, `AppEnvironmentAdapterError`) + placeholder mémoire (copies défensives) +
> `createAppEnvironmentService` (`getSnapshot`/`describeForContext`, best-effort → `{os:unknown}` si throw, **ne persiste
> rien**, **logs `{operation}`+grossiers**). **Contexte sûr pour analytics RN 13 / crash RN 19 — gaté par consentement
> RN 21 ; sans `expo-device`/`expo-application` réel/réseau/identifiant device/PII/collecte auto ; ne décide ni
> ADR-038/ADR-019/ADR-018.** **RN 23 — presse-papiers (clipboard) sécurisé primitives génériques (seam, sans
> `expo-clipboard` réel)** (ADR-040 §17/§18 / ADR-015 §21/§24) : `src/clipboard` — `ClipboardSensitivity`
> (`normal`/`sensitive`) + `ClipboardOperationResult` (`success`/`unavailable`/`rejected`/`error`) + `normalizeClipboardText`
> (borné) + **`isSensitiveClipboardText`** (redaction RN 8 : Bearer/JWT/email/URL signée/URI device → sensible) +
> `describeClipboardTextForLog` (**`{length,sensitivity}` seul**, jamais le contenu) ; `ClipboardAdapter` (seam
> `expo-clipboard` `setString`/`getString?`/`hasString?`/`clear?`, `ClipboardAdapterError`) + placeholder mémoire (slot
> transitoire) + `createClipboardService` (`copy`/`getString`/`hasString`/`clear` — **refuse le contenu sensible sans
> `allowSensitive` → `rejected` adapter non appelé**, `getString` opt-in explicite jamais loggé, `clear` no-op sûr,
> best-effort, **logs `{operation,result,sensitivity,length}` — jamais le contenu**). **Canal transitoire/non fiable ;
> clipboard non stocké (pas de preferences/Zustand/Query/SecureStore) ; sans `expo-clipboard` réel/réseau/persistance/UI/
> lecture auto.** **RN 24 — retry / backoff générique** : `src/retry` fournit `RetryPolicy` borné (`maxAttempts`
> **inclut l'appel initial**), `computeBackoffDelay(attempt, policy, rng?)` exponentiel borné + jitter déterministe via
> `rng`, `isRetryableError`/`getRetryDecision` (network/timeout/408/429/5xx retryable ; 4xx/401/403/session-expired/
> inconnu non retryable ; raison enum sûre) et `withRetry(fn, policy, {sleep, rng, shouldRetry?, logger?})`
> (**sleep injecté**, **401/403/session-expired hard-blockés même via `shouldRetry`**, erreur finale originale propagée,
> logs `{attempt,delayMs}` seuls). **Aucun réseau réel, aucune dépendance, aucun `Date.now()` testé, aucun branchement
> automatique** (AuthEngine, `withAuthRetry`/`authedRequest`, QueryClient et mutations inchangés). **346 tests
> `node --test`**. Vérifs : **typecheck + lint + test 346/346 + expo-doctor 19/19 + git diff --check verts**
> (**RN 24 n'ajoute aucune dépendance**). **Aucune logique métier.**
> *(Garde CI `npm ls zustand` au root inchangée — mobile autonome, hors scope.)*
>
> **Historique RN24** : cette prochaine action était RN25 ; elle est désormais
> **réalisée**. La prochaine action unique actuelle est RN26 (voir note RN25 en
> tête de section).
>
> **(Décision roadmap)** **Cloud Core en PAUSE contrôlée** (cf. [`ROADMAP_ALIGNMENT_REVIEW.md`](./ROADMAP_ALIGNMENT_REVIEW.md)) ;
> **Cloud Core 10** (serveur staging réel + HTTPS/DNS/pare-feu) **reporté** jusqu'à disponibilité d'un **serveur
> réel** (dépendance **externe**, hors socle). **(Actions HUMAINES)** confirmer la **protection de branche `main`**
> (7 checks + `images`) et **ajouter `api-smoke`** aux checks requis.

**Justification** : la **revue stratégique d'alignement** (2026-06-11, `ROADMAP_ALIGNMENT_REVIEW.md`) a acté une
pause Cloud après **Cloud Core 1→9** : la séquence a livré une **vraie valeur** (CI non-régression, **images GHCR
bootables** après le fix CC8, `api-smoke`, runbooks, **staging local exécuté**) mais le prochain pas Cloud
(**CC10 serveur réel**) dépend de **ressources externes indisponibles** et relève de l'**ops par déploiement**,
pas du **socle réutilisable**. Cette décision de retour aux priorités V1 a depuis été **exécutée** : Mobile RN 1,
RN 2 et RN 3 sont réalisés. La suite la plus cohérente est donc d'achever l'intégration mobile transverse déjà
préparée : **remplacer le transport seam par le client officiel `@enistere/api-client-fetch`**, sans endpoint
métier. **Ne pas** créer de production ni d'automatisation de déploiement. **Flux PR obligatoire** (push direct
`main` refusé).

**Alternative (justifiée, décision humaine)** : **durcissement registry** (scan/signature/SBOM) ; **UI Kit 4** ;
**Files 2** (upload Web) ; **Mobile Core**.

**Note gouvernance** : `main` protégé (**repo public**, flux PR). **CC6** mergé (PR #4 → `b001ce8`) ; **CC6B**
mergé (PR #5 → `7b07e5e`) ; **CC7** mergé (PR #6 → `5118283`) ; **CC8** mergé (PR #7 → `d1e6242` — image API
corrigée + `api-smoke`) ; **CC8B/8C** post-merge validé (images corrigées publiées `sha-d1e6242`) ; **CC9**
(cette mission) **exécute la stack en local Type D** (images corrigées, health verts, endpoint Option A joignable)
et ajoute le commit `docs(cloud): record controlled staging execution` (rapport + checkpoint) via PR. Statuts :
Cloud Core **`IMPLEMENTATION_PARTIELLE`**, ADR-013 **`PARTIELLEMENT_IMPLEMENTE`**, ADR-014
**`PARTIELLEMENT_IMPLEMENTE`** ; déploiement staging **`EXECUTION_LOCALE_CONTROLEE`** (stack exécutée en **local**,
sans serveur réel/HTTPS/exposition ; URL signée + Auth/Files **non validés** ⇒ **non** opérationnel/production).
**CC9 mergé (PR #9 → `5589198`).** **Revue stratégique d'alignement** (cette mission, `ROADMAP_ALIGNMENT_REVIEW.md`)
→ **décision : Cloud Core en PAUSE contrôlée**, **retour priorités V1 → Mobile Core RN** ; décision exécutée via
RN 1 (PR #11), RN 2 et RN 3 (PR #12). `main` est aligné sur `origin/main` au merge RN 3 (`574cdcf`).

## 2. Actions immédiatement suivantes (ordre recommandé)

1. ✅ **Mobile Core React Native 1 — starter foundation** (priorité **#2 V1** roadmap) — **RÉALISÉ** (PR #11 mergé). *(Sans logique métier ; un seul core.)*
2. ✅ **Mobile Core React Native 2 — auth/session hardening** — **RÉALISÉ** : AuthEngine agnostique (refresh coalescé + expiration), SessionStore SecureStore + validation, API client 401→refresh→retry, gardes expired/refreshing, **21 tests `node --test`** ; typecheck/lint/test/doctor verts. *(Sans logique métier ; un seul core.)*
3. ✅ **Mobile Core React Native 3 — forms, validation & offline-ready primitives** — **RÉALISÉ** : primitives form RHF + Zod (token-driven, erreurs accessibles), validation UX (`validateWith` + mapping, ADR-003 §18, backend autoritatif), offline préparatoire (queue mémoire, sans persistance/rejeu/NetInfo/donnée sensible), **44 tests `node --test`** ; typecheck/lint/test/doctor verts. *(Sans logique métier ; un seul core.)*
4. ✅ **Mobile Core React Native 4 — intégration réelle `@enistere/api-client-fetch`** — **RÉALISÉ** : client officiel `@enistere/api-client-fetch` + `@enistere/api-contracts` consommés (liés `file:` + Metro, **core autonome — root non touché**), `MobileAuthSessionAdapter` + `EnistereAuthApi`, **AuthEngine préservé** (`enableRefresh:false`), **47 tests** + bundle `expo export` ios. *(Sans logique métier ; un seul core.)*
5. ✅ **Mobile Core React Native 5 — server-state data layer** — **RÉALISÉ** : couche TanStack Query générique (query-keys stables, `useAuthedQuery`/`useAuthedMutation` via `authedRequest`, `toQueryError` sans donnée sensible, `invalidateScope`/`purgeServerState`), 401 jamais retenté, mutations sans retry, pas de persistance ; **59 tests** ; typecheck/lint/test/doctor verts. *(Sans logique métier ; un seul core.)*
6. ✅ **Mobile Core React Native 6 — état local (Zustand) + câblage purge au logout** — **RÉALISÉ** : `useUiStore` générique (primitives UI non sensibles, séparé du server-state), purge logout déterministe câblée dans `AuthProvider` (`await cancelQueries`→`clear` dès `unauthenticated`/`expired`), AuthEngine inchangé ; **67 tests** ; typecheck/lint/test verts. *(Sans logique métier ; un seul core.)*
7. ✅ **Mobile Core React Native 7 — upload sécurisé (multipart)** — **RÉALISÉ** : descripteur RN `MobileFile {uri,name,type}` (assignable au `ReactNativeFileDescriptor` du package) + helpers purs (`isMobileFile`, `describeFileForLog` sans `uri`, `isAllowedFileType`), `useUploadMutation` via `useAuthedMutation` → `apiClient.files.upload(…, {retryOnAuthRefresh:false})` (refresh 401 = AuthEngine, `FormData` reconstruit au retry), mutation sans clé de cache, `toQueryError` étendu 413/415, **backend autoritaire** (ADR-007), aucun endpoint métier/écran ; **71 tests** ; typecheck/lint/test verts. *(Sans logique métier ; un seul core.)*
8. ✅ **Mobile Core React Native 8 — logger/observabilité client (avec redaction)** — **RÉALISÉ** : `createLogger` (niveaux, sink pluggable, horloge injectée, corrélation `child`/`withRequestId`) + **redaction centrale** (`redactValue`/`redactString` : tokens/`Authorization`/cookies/JWT/URL signées/chemins device/PII) appliquée **avant** tout sink ; `safeErrorFields(QueryError)` ; correctif `describeFileForLog` (`{type,extension}`, plus de nom brut) ; **aucune persistance/transport/service externe/log de body** (ADR-040) ; **89 tests** ; typecheck/lint/test/doctor verts. *(Sans logique métier ; un seul core.)*
9. ✅ **Mobile Core React Native 9 — permissions natives génériques (gouvernées)** — **RÉALISÉ** : modèle pur `PermissionKind`/`PermissionStatus` + helpers (`normalizePermissionStatus`/`canRequestPermission`/`isPermissionGranted`…), `PermissionAdapter` (seam Expo) + `createPermissionService` (live `getStatus`/`request`/`ensure`/`openSettings`, logs sûrs via logger RN 8, `PermissionAdapterError` contrôlé), **adaptateur placeholder** (no native dep), hook `usePermission` (no UI) ; **statut jamais persisté** ; **API Core = autorité** (07_SECURITY §6) ; **106 tests** ; typecheck/lint/test/doctor verts. *(Sans logique métier ; un seul core.)*
10. ✅ **Mobile Core React Native 10 — notifications client (primitives locales génériques, sans push réel)** — **RÉALISÉ** : `NotificationMessage` borné/sûr (`sanitizeNotificationMessage`, `describeNotificationForLog` sans contenu), modèle (delivery-state/trigger), `NotificationAdapter` (seam Expo) + `createNotificationService` (gate sur permission `notifications` RN 9 — jamais de schedule sans permission usable, `schedule`/`cancel`/`cancelAll`/`getDelivered`, logs sûrs, `NotificationError` contrôlé), **adaptateur placeholder** (no native dep) ; **LOCAL only** (aucun push/token device/stockage/UI) ; **122 tests** ; typecheck/lint/test/doctor verts. *(Sans logique métier ; un seul core.)*
11. ✅ **Mobile Core React Native 11 — i18n / localisation primitives génériques** — **RÉALISÉ** : modèle de locale (`normalizeLocale` via `Intl`, `getLocaleDirection`, `resolveLocale`) + catalogue typé (`createTranslator` : `t`/`has`/`plural`, interpolation, pluralisation `Intl.PluralRules`, clé inconnue sans throw) + formatters `Intl` (`formatDate`/`formatNumber`/`formatCurrency`, devise requise, ne lèvent jamais) + `LocaleAdapter` + placeholder (no native dep) + `createLocalization` ; **aucune dépendance** (Intl built-in), aucun réseau/persistance/UI, catalogues métier = projets dérivés ; **144 tests** ; typecheck/lint/test/doctor verts. *(Sans logique métier ; un seul core.)*
12. ✅ **Mobile Core React Native 12 — deep-linking / routing primitives génériques** — **RÉALISÉ** : parseur pur (`parseDeepLink`/`decodeSafe`/`normalizeUrl`, custom + https, sans `URL` global) + `resolveLink` (`internal`/`externalBlocked`/`invalid`) — allowlist stricte schemes/hosts, **anti-open-redirect** (`//`/`scheme://`/`..`), **params sensibles supprimés**, bornes ; `isInternalRoute` ; `resolveNotificationLink` (clé configurable) ; **aucun log/stockage/dépendance** ; routes concrètes = projets dérivés ; **159 tests** ; typecheck/lint/test/doctor verts. *(Sans logique métier ; un seul core.)*
13. ✅ **Mobile Core React Native 13 — analytics / télémétrie primitives génériques (avec redaction, sans SDK réel)** — **RÉALISÉ** : `AnalyticsEvent` borné + **redaction dédiée basée RN 8** (`sanitizeAnalyticsEvent` : `isSensitiveProperty` réutilise `isSensitiveKey` + scrub valeurs via `redactString`, bornes, sans throw) ; `AnalyticsAdapter` (track/flush?, **pas de `identify`**) + `createAnalyticsService` (track best-effort non-intrusif, logs sûrs `{eventName,propertyCount}`, erreurs adapter contrôlées) + placeholder mémoire ; **aucun SDK réel/réseau/persistance/user-id** ; **175 tests** ; typecheck/lint/test/doctor verts. *(Sans logique métier ; un seul core.)*
14. ✅ **Mobile Core React Native 14 — accessibilité (a11y) primitives génériques** — **RÉALISÉ** : props RN-compatibles (`buildA11yProps`/`normalizeA11yText`) + `A11yState` normalisé (`disabled`/`focused`/`pressed`/`invalid` + RN state ; `mergeA11yState`/`isInteractiveRole`) + annonce (`sanitizeAnnouncement`/`describeAnnouncementForLog` sans texte) + `A11yAdapter` (announce/focus?/isScreenReaderEnabled?, `A11yAdapterError` contrôlé) + placeholder + `createA11yService` (best-effort non-intrusif, logs sûrs `{length,assertive}`) ; **aucun `AccessibilityInfo` réel/provider global/stockage/UI/dépendance** ; **196 tests** ; typecheck/lint/test/doctor + `git diff --check` verts. *(Sans logique métier ; un seul core.)*
15. ✅ **Mobile Core React Native 15 — app lifecycle primitives génériques** — **RÉALISÉ** : modèle d'état `AppLifecycleState` (`active`/`background`/`inactive`/`unknown`) + helpers purs (`normalizeAppLifecycleState`/`isForeground`/`isBackground`/`isValidTransition`/`nextAppLifecycleState`) ; `AppLifecycleAdapter` (seam RN `AppState`) + placeholder + `createAppLifecycleService` (`getState`/`subscribe`/`transition`/`dispose`, transitions validées, logs sûrs `{from,to}`, erreurs adapter contrôlées, listener isolé) ; **aucun `AppState` réel/provider global/stockage/dépendance** ; **212 tests** ; typecheck/lint/test/doctor + `git diff --check` verts. *(Sans logique métier ; un seul core.)*
16. ✅ **Mobile Core React Native 16 — connectivité réseau (network status) primitives génériques** — **RÉALISÉ** : **étend `src/offline`** (RN 3 inchangé, `shouldQueueMutations` canonique) — `NetworkConnectionType` borné + `normalizeNetworkStatus`/`normalizeConnectionType` ; `NetworkAdapter` (seam RN NetInfo, `NetworkAdapterError`) + placeholder + `createNetworkService` (`getStatus`/`shouldQueue`/`subscribe`/`transition`/`dispose`, `changedAt` via horloge injectée, logs sûrs `{from,to,type}`, erreurs contrôlées, listener isolé) ; **aucun NetInfo réel/dépendance/offline sync/persistance/donnée sensible** ; **227 tests** ; typecheck/lint/test/doctor + `git diff --check` verts. *(Sans logique métier ; un seul core.)*
17. ✅ **Mobile Core React Native 17 — feature flags / config primitives génériques** — **RÉALISÉ** : **étend `src/config`** (env inchangé ; **distinct des `flags` UI Zustand RN 6**) — `FlagValue` (boolean/string/number) + `FlagSet` bornés + `sanitizeFlagSet` tolérant + **getters typés à défaut sûr** ; `FlagAdapter` (seam local/remote-config, `FlagAdapterError`) + placeholder mémoire + `createFlagService` (`getFlag`/`getAll`/`subscribe`/`refresh`/`dispose`, non-intrusif, **logs `{count}`/`{operation}` — jamais clé ni valeur**) ; **aucun SDK remote-config réel/réseau/persistance/user targeting réel/secret/donnée sensible** ; **244 tests** ; typecheck/lint/test/doctor + `git diff --check` verts. *(Sans logique métier ; un seul core.)*
18. ✅ **Mobile Core React Native 18 — gate biométrique local primitives génériques (ADR-015 §20)** — **RÉALISÉ** : `src/biometrics` — disponibilité (`available`/`notEnrolled`/`unsupported`/`unknown`) + type borné + résultat (`success`/`refused`/`cancelled`/`lockout`/`unavailable`/`error`) ; helpers tolérants (**junk → `unknown`/`error`, jamais `success`**) ; `BiometricAdapter` (seam `LocalAuthentication`/Keychain, `BiometricAdapterError`) + placeholder mémoire + `createBiometricService` (`getAvailability`/`isAvailable`/`authenticate`, **aucun faux succès** — `unavailable` sans prompt si inutilisable, **logs sûrs** `{availability,type}`/`{outcome}`/`{operation}`) ; **gate d'UX local — ne remplace jamais l'auth serveur** ; **aucun `LocalAuthentication`/Keychain réel/secret/biométrie/résultat stocké ou loggé** ; **262 tests** ; typecheck/lint/test/doctor + `git diff --check` verts. *(Sans logique métier ; un seul core.)*
19. ✅ **Mobile Core React Native 19 — crash / error-reporting primitives génériques (seam, sans SDK réel — ADR-019)** — **RÉALISÉ** : `src/crash-reporting` — `CrashReportEvent` borné (`severity`/`source`/`name`/`message`/`stack?`/`context`) **rédigé via redaction RN 8** + bornes (`sanitizeCrashMessage`/`sanitizeCrashStack` **jamais de stack brute**/`sanitizeCrashContext`) ; `CrashReporterAdapter` (seam Sentry/Crashlytics, `CrashReporterAdapterError`) + placeholder mémoire (copies défensives) + `createCrashReporterService` (`captureError`/`captureMessage`/`setContext`/`flush`, **best-effort non-intrusif** — sync throw + async reject capturés, **jamais de faux succès**, **logs `{operation,severity,source}`**) ; **sans SDK réel/réseau/persistance/batching/crash handler global ; ne décide pas ADR-019 ; aucun token/PII/body/stack brute/user-id** ; **279 tests** ; typecheck/lint/test/doctor + `git diff --check` verts. *(Sans logique métier ; un seul core.)*
20. ✅ **Mobile Core React Native 20 — préférences non sensibles persistantes primitives génériques (seam, sans MMKV/AsyncStorage réel — ADR-015 §15/§16)** — **RÉALISÉ** : `src/preferences` — `PreferenceValue` (bool/string/number) + `PreferenceSet` bornés + `isValidPreferenceKey` (format + non sensible) + `isSensitivePreferenceValue` + `sanitizePreferenceSet` + getters typés à défaut sûr ; `PreferenceStore` (seam async MMKV/AsyncStorage, `PreferenceStoreError`) + placeholder mémoire (copies défensives) + `createPreferenceService` (`get`/`getBoolean`/`getString`/`getNumber`/`set`/`remove`/`clear`/`getAll`/`subscribe`, **garde écritures** + **assainit lectures**, best-effort, listener isolé, **logs `{operation,count}`**) ; **données non sensibles uniquement (clé/valeur sensible → drop) ; distinct de SecureStore/Zustand RN 6/TanStack Query ; sans MMKV/AsyncStorage réel/réseau/secret/PII ; ne décide aucun stockage natif** ; **294 tests** ; typecheck/lint/test/doctor + `git diff --check` verts. *(Sans logique métier ; un seul core.)*
21. ✅ **Mobile Core React Native 21 — consentement télémétrie / privacy gate primitives génériques (ADR-038)** — **RÉALISÉ** : `src/consent` — `ConsentCategory` (`analytics`/`crash`/`performance`/`diagnostics`) + `ConsentStatus` (`granted`/`denied`/`unknown`) + `ConsentSet` ; helpers `normalize*`/`sanitizeConsentSet`/`isConsentGranted`/**`isTelemetryAllowed`** (**default-deny**) ; `ConsentStore` (seam, `ConsentStoreError`) + **`createPreferenceConsentStore`** (persistance déléguée aux préférences RN 20 sous clés non sensibles `privacy.consent.*`) + placeholder mémoire (copies défensives) + `createConsentService` (`get`/`set`/`isAllowed`/`getAll`/`clear`/`subscribe`, best-effort, listener isolé, **logs enums/count**) ; **gate à consulter avant émission analytics RN 13 / crash RN 19 ; sans SDK réel/réseau/UI/identifiant/PII ; ne décide pas ADR-038 ; ne câble pas analytics/crash** ; **309 tests** ; typecheck/lint/test/doctor + `git diff --check` verts. *(Sans logique métier ; un seul core.)*
22. ✅ **Mobile Core React Native 22 — environnement / métadonnées app primitives génériques (seam, non identifiant)** — **RÉALISÉ** : `src/app-environment` — `AppEnvironmentSnapshot` borné/allow-list (`os`/`osVersionMajor` **majeur**/`appVersion`/`buildNumber`/`buildChannel`/`locale`/`environment`) + normalizers tolérants (`17.5.1`→`17`, locale via i18n) + **`sanitizeAppEnvironmentSnapshot`** (lit uniquement les clés autorisées → drop deviceId/IDFA/AndroidID/pushToken/serial/model/IP) + `describeAppEnvironmentForLog` ; `AppEnvironmentAdapter` (seam `expo-application`/`expo-device`, `AppEnvironmentAdapterError`) + placeholder mémoire (copies défensives) + `createAppEnvironmentService` (`getSnapshot`/`describeForContext`, best-effort → `{os:unknown}` si throw, ne persiste rien, **logs `{operation}`+grossiers**) ; **contexte sûr pour analytics RN 13 / crash RN 19 gaté par consentement RN 21 ; sans `expo-device`/`expo-application` réel/réseau/identifiant device/PII/collecte auto ; ne décide ni ADR-038/ADR-019/ADR-018** ; **320 tests** ; typecheck/lint/test/doctor + `git diff --check` verts. *(Sans logique métier ; un seul core.)*
23. ✅ **Mobile Core React Native 23 — presse-papiers (clipboard) sécurisé primitives génériques (seam, sans `expo-clipboard` réel)** — **RÉALISÉ** : `src/clipboard` — `ClipboardSensitivity` (`normal`/`sensitive`) + `ClipboardOperationResult` (`success`/`unavailable`/`rejected`/`error`) + `normalizeClipboardText` (borné) + **`isSensitiveClipboardText`** (redaction RN 8) + `describeClipboardTextForLog` (`{length,sensitivity}`) ; `ClipboardAdapter` (seam `expo-clipboard`, `ClipboardAdapterError`) + placeholder mémoire (slot transitoire) + `createClipboardService` (`copy`/`getString`/`hasString`/`clear`, **refuse le contenu sensible sans opt-in → `rejected` adapter non appelé**, `getString` opt-in jamais loggé, `clear` no-op sûr, best-effort, **logs sans contenu**) ; **aucun log de contenu ; clipboard non stocké ; sans `expo-clipboard` réel/réseau/persistance/UI/lecture auto** ; **330 tests** ; typecheck/lint/test/doctor + `git diff --check` verts. *(Sans logique métier ; un seul core.)*
24. ✅ **Mobile Core React Native 24 — retry / backoff primitives génériques (purs, horloge injectée)** — **RÉALISÉ** : `src/retry` — `RetryPolicy` borné (`maxAttempts` inclut l'appel initial), `computeBackoffDelay` exponentiel borné + jitter déterministe via `rng`, `isRetryableError`/`getRetryDecision` structurels, `withRetry(fn, policy, {sleep, rng, shouldRetry?, logger?})` à `sleep` injecté ; **401/403/session-expired hard-blockés**, erreur finale originale propagée, logs `{attempt,delayMs}` seuls ; **aucun branchement AuthEngine/withAuthRetry/QueryClient/mutations** ; **346 tests** ; typecheck/lint/test/doctor + `git diff --check` verts. *(Sans logique métier ; un seul core.)*
25. ✅ **Mobile Core React Native 25 — telemetry context composition opt-in** — **RÉALISÉ** : `src/telemetry` compose consentement RN 21 + contexte safe RN 22 + services analytics RN 13/crash RN 19 ; no-op si consentement absent/refusé ; logs `{operation,category,allowed}` ; aucun SDK réel/réseau/persistance/identity/auto-start/retry RN 24 ; **355 cas `test(...)`** ; typecheck/lint/test/doctor + `git diff --check` verts.
26. ✅ **Mobile Core React Native 26 — V1 usable starter shell / settings générique** — **RÉALISÉ** : route protégée Settings, lien depuis Home, diagnostics session/UI/consent placeholder/environnement safe/foundation ; aligné `strategy/04_ROADMAP_GLOBAL.md` §9 ; aucun réseau/endpoint métier/SDK réel/adaptateur natif/persistance/retry branché ; typecheck/lint/test/doctor + `git diff --check` verts.
27. ✅ **Mobile Core React Native 27 — durcissement runtime du starter Expo** — **RÉALISÉ** : export Expo iOS vert, tentative `npm start`, correction d'ergonomie starter public/Home/Settings ; aucun réseau, dépendance, SDK/adaptateur natif réel, endpoint métier, retry ou changement Auth/Query.
28. ✅ **Mobile Core React Native 28 — smoke visuel device/simulateur du starter** — **RÉALISÉ** : Android Emulator `Pixel_6a` via Expo Go, public/Home/Settings/scroll/retour/refresh/sign out validés ; aucune correction code nécessaire.
29. ✅ **Mobile Core React Native 29 — automatisation du smoke runtime starter** — **RÉALISÉ** : `npm run smoke:android` rejoue localement public → Home → Settings → scroll → retour → refresh → sign out sans backend réel, via mock auth temporaire + `adb reverse` + Expo Android + labels UI Android.
30. ✅ **Mobile Core React Native 30 — smoke runtime iOS/simulateur ou device parity** — **RÉALISÉ / BLOQUÉ ENVIRONNEMENT** : `npm run smoke:ios` vérifie macOS/`xcrun`/`simctl`/`npx`, produit un rapport JSON `blocked` sur l'hôte Linux sans `xcrun`, et documente la procédure macOS/device ; aucune preuve iOS artificielle, aucune dépendance/logique métier.
31. **Mobile Core React Native 31 — exécution iOS smoke sur macOS/device réel** — **EN ATTENTE PRÉCONDITION EXTERNE** : Linux, `xcrun` absent. Procédure mise à jour par RN32 pour le formulaire sign-in. À rejouer sur macOS/Xcode dès disponibilité.
32. ✅ **Mobile Core React Native 32 — formulaire sign-in générique RHF/Zod** — **RÉALISÉ** : `app/(public)/sign-in.tsx` remplace le bouton hardcodé par un formulaire email/password RHF+Zod via primitives RN3 (`emailField`, `requiredText`, `TextInputField`, `createZodResolver`) ; `smoke-android.js` adapté (`findInputByLabel`, `tapInputAndType`) ; `smoke-ios.js` procédure mise à jour ; aucune dépendance, aucun endpoint métier, aucun changement AuthEngine/QueryClient/mutations ; typecheck/lint/test 355/355/export iOS/audit verts. `mobile-react-native` → **`STARTER_SIGN_IN_FORM_READY`**.
33. ✅ **Mobile Core React Native 33 — câblage préférence de thème** — **RÉALISÉ** : `ThemePreferenceProvider` (`src/theme/`) lit `useUiStore.themePreference` et passe `scheme` au `ThemeProvider` (`'system'`→OS, `'light'`/`'dark'`→forcé) ; Settings expose 3 boutons System/Light/Dark ; `reset()` remet à `'system'` ; in-memory uniquement (ADR-015 §16) ; aucune dépendance, aucun endpoint métier, aucun changement AuthEngine/QueryClient/mutations ; typecheck/lint/test 355/355/export iOS/audit verts. `mobile-react-native` → **`STARTER_THEME_PREFERENCE_READY`**.
34. ✅ **Mobile Core React Native 34 — alignement patch Expo SDK / doctor green** — **RÉALISÉ** : `expo` 55.0.26→55.0.27, `expo-linking` 55.0.15→55.0.16, `expo-secure-store` 55.0.14→55.0.15 via `npx expo install` ; aucun changement code runtime ; expo-doctor **19/19** ; typecheck/lint/test 355/355/export iOS/audit verts. `mobile-react-native` → **`STARTER_EXPO_DOCTOR_GREEN`**.
35. ✅ **UI Kit 4** — primitives interactives Dialog/Select/Toast — **RÉALISÉ** : 12 primitives Web React, 121 tests, tokens CSS only, a11y jest-axe, React 19, aucune régression.
36. **Cloud Core 10 — préparation serveur staging sécurisé** — **reporté** (dépend d'un serveur réel + HTTPS/DNS/pare-feu ; Cloud en **pause contrôlée**).
37. **Web Core Files 2** — upload sécurisé côté Web (multipart, finalisation, états).

**Alternative envisageable (justifiée)** : avancer **Cloud Core / CI-CD (ADR-013)** plus tôt pour
sécuriser la non-régression (aucune CI aujourd'hui) et préparer la publication des packages. Reste
**non recommandé en premier** car il n'apporte pas de valeur produit immédiate et le UI Kit débloque
deux cores. À arbitrer par décision humaine.

## 3. Actions bloquées

| Action | Bloquée par |
|---|---|
| Intégrer les packages API (public) dans le Web Core | **FAIT** — `api-client-fetch` instancié (Health), preuve API réelle |
| Usage **authentifié** des packages (Web) | **FAIT** — login/refresh/logout + CSRF (Web Auth 2) **et** me/authorization + session/autorisations (Web Auth 3), preuve API réelle |
| Premier layout/route protégé (Web) | **FAIT** — Web Auth 4 : résolution serveur read-only (Option C) + hydratation, page `/protected` |
| Page de connexion `/login` + navigation Auth (Web) | **FAIT** — Web Auth 5 : formulaire, login BFF, `returnTo` interne assaini, `replace`/`refresh`, preuve API réelle 22/22 |
| Bloc **Auth Web (1→5)** stable V1 ? | **REVU** — verdict **`AUTH_WEB_V1_STABLE_WITH_RESERVATIONS`** (`WEB_AUTH_V1_REVIEW.md`) : sûr/cohérent, aucun défaut bloquant ; réserves opérationnelles (CI, E2E, streaming-redirect, multi-onglets, CSP) |
| Auth post-V1 (register/reset/OAuth/MFA) | **hors périmètre V1** — ne pas poursuivre l'Auth |
| États UI & composants structurels (Web/UI Kit) | **FAIT** — Web UI 1 : Alert/Card/FormField (UI Kit, socle désormais 121 tests avec UI Kit 4) + LoadingState/EmptyState/ErrorState/Unauthorized/Forbidden/ServiceUnavailable/PageHeader (Web, 270 tests), intégrés + axe |
| Files Web (lecture/téléchargement) | **FAIT** — Web Core Files 1 : BFF ciblé `GET /api/files/:id` + `POST /api/files/:id/download-url`, client BFF, `fileKeys`, `useFileMetadata`/`useCreateDownloadUrl` (URL jamais en cache), page `/protected/files/[id]`, **307 tests** + preuve API+MinIO 21/21 |
| Revue globale Web Core (incrément V1) | **FAIT** — verdict **`WEB_CORE_V1_INCREMENT_STABLE_WITH_RESERVATIONS`** (`WEB_CORE_V1_INCREMENT_REVIEW.md`) : 307 tests ×2 + runtime réel 49/49, aucun défaut bloquant ; réserves : CI/ordre de build, E2E |
| CI minimale (ADR-013) | **FAIT** — `.github/workflows/ci.yml` (GitHub Actions, ordre de build imposé, `npm ci` Node 24, audit, gardes deps) ; ADR-013 **partiel** (restent branch protection, E2E, runtime API, déploiement) |
| Cloud Core 1 — cadrage CI/CD & environnements | **FAIT** — `cores/cloud/docs/` (baseline, environnements, checklist branch protection, politique CI 4 niveaux, secrets/registry, plans) |
| Cloud Core 2 — CI runtime API (niveau 2) | **FAIT** — `.github/workflows/api-runtime-ci.yml` (PostgreSQL+MinIO jetables, migrations, unit+e2e, openapi:check, build, audit) |
| Cloud Core 3 — E2E navigateur (niveau 3) | **FAIT** — `.github/workflows/web-e2e-ci.yml` + `cores/web-nextjs/e2e/` (Playwright/Chromium ; stack réelle API+PG+MinIO+Web ; Health/Auth/Files ; **7 tests verts** en simulation) |
| Cloud Core 4 — durcissement CI & gouvernance | **FAIT** — 7 checks `main` figés + checklist actionnable + politiques artefacts/couverture/pinning/actionlint tranchées ; workflows inchangés |
| Cloud Core 5 — Registry GHCR (niveau 4 partiel) | **FAIT + MERGÉ + VALIDÉ** (PR #1 `b41a953`, vérif PR #2 `bfd33dc`) — `registry-ci.yml` + Dockerfiles API/Web ; **Registry CI verte sur `main`**, **images GHCR publiques** `api-nestjs`/`web-nextjs` (tags `main-`/`sha-`, **pas de `latest`**) ; ADR-014 → partiel |
| Protection de branche `main` | **APPLIQUÉE** (repo public) — la PR est désormais **exigée** (push direct `main` refusé). Vérifier que les 7 checks (+ `images`) sont bien requis |
| Cloud Core 6 — déploiement staging manuel | **FAIT + MERGÉ** (PR #4 → `b001ce8`) — `cores/cloud/staging/` + runbooks ; `CADRE_MANUEL_DOCUMENTE` ; checks requis **verts** (PR + `main`), images GHCR `main-b001ce8` publiées (pas de `latest`) |
| Cloud Core 7 — préparation serveur staging & dry-run contrôlé | **FAIT** — **dry-run local réel** (images GHCR `sha-7b07e5e`, `.env` hors dépôt) : `compose config`/`pull` OK, **image Web boote**, **MAIS image API crash-loop** (Prisma engine OpenSSL 1.1.x vs runtime bookworm 3.0.x) → staging `DRY_RUN_EXECUTE` (**défaut bloquant**) ; décision MinIO Option A ; runbook migrations corrigé. Détail `STAGING_DRY_RUN_REPORT.md` |
| Cloud Core 8 — corriger l'image runtime API (Prisma engine) | **FAIT + MERGÉ** (PR #7 → `d1e6242`) — `binaryTargets debian-openssl-3.0.x` + `openssl` au stage build → moteur 3.0.x ; **`api-smoke`** gate le push. **CC8B post-merge VÉRIFIÉ** : `api-smoke` + push GHCR **success**, **images corrigées publiées** (`sha-d1e6242` API/Web, no `latest`), image API **démarre** (dry-run post-merge `healthy`, 200/200/200) |
| Cloud Core 9 — exécution staging contrôlée | **FAIT (local Type D)** — stack réelle (images GHCR corrigées `sha-d1e6242`), migrations depuis l'image, **API/Web `healthy`**, `/health/live`+`/health/ready`+`/`+`/login`=200, endpoint MinIO Option A **joignable** ; ⚠️ **non validé** : URL signée bout-en-bout + Auth/Files (pas d'utilisateur ; seed bloqué) ; **pas de serveur réel/HTTPS** → `EXECUTION_LOCALE_CONTROLEE` |
| Cloud Core 10 — préparation serveur staging sécurisé | **REPORTÉ (Cloud en pause contrôlée)** — dépend d'un **serveur réel** + HTTPS/DNS/pare-feu + SSH (ressource externe) ; reprise pour valider **en réel** URL signée (presign API, Option A) + Auth/Files |
| **Mobile Core React Native 1 — starter foundation** | **FAIT** — `mobile-react-native` → **`STARTER_FOUNDATION_INITIEE`** : starter Expo SDK 55 + Expo Router (navigation publique/authentifiée, shell auth sans backend, secure storage SecureStore ADR-015, transport `fetch` ADR-011 en seam vers `api-client-fetch` ADR-016, TanStack Query ADR-012, ThemeProvider+tokens ADR-008/010, états standards) ; typecheck + lint + expo-doctor 19/19 verts ; aucune logique métier |
| **Mobile Core React Native 2 — auth/session hardening** | **FAIT** — `mobile-react-native` → **`AUTH_SESSION_HARDENED`** : AuthEngine agnostique (restore/signIn/signOut/refresh/clear, refresh coalescé, expiration) ; SessionStore SecureStore + validation (access token mémoire) ; API client 401→refresh→retry ; gardes expired/refreshing ; seam `@enistere/api-client-fetch` ; **21 tests `node --test`** ; typecheck/lint/test/doctor verts |
| **Mobile Core React Native 3 — forms, validation & offline-ready primitives** | **FAIT** — `mobile-react-native` → **`FORMS_OFFLINE_PRIMITIVES_READY`** : primitives form **RHF + Zod** (FormField/FormLabel/FormError/TextInputField, token-driven, erreurs accessibles) ; validation **UX** (`validateWith` + mapping Zod/RHF, ADR-003 §18, **backend autoritatif**, aucun DTO/schéma métier) ; **offline préparatoire** (état réseau abstrait + queue mémoire FIFO, **sans** persistance/rejeu/NetInfo/donnée sensible, ADR-015 §19) ; **44 tests `node --test`** ; typecheck/lint/test/doctor verts |
| **Mobile Core React Native 4 — intégration réelle `@enistere/api-client-fetch`** | **FAIT** — `mobile-react-native` → **`API_CLIENT_INTEGRATED`** : client officiel `@enistere/api-client-fetch` + `@enistere/api-contracts` consommés (liés `file:` + `metro.config.js`, **core autonome — root package.json NON touché**, choix validé avec l'utilisateur) ; `MobileAuthSessionAdapter` (injection Bearer, aucun token stocké) + `EnistereAuthApi` (`/auth/login`+`/auth/refresh` typés) ; **AuthEngine préservé** (`enableRefresh:false`) ; `ApiClientError` ; **47 tests `node --test`** + **bundle `expo export` ios** ; typecheck/lint/test/doctor verts ; packages liés `api-contracts` 11/11 + `api-client-fetch` 29/29 |
| **Mobile Core React Native 5 — server-state data layer** | **FAIT** — `mobile-react-native` → **`SERVER_STATE_READY`** : couche TanStack Query générique (`createQueryKeys`, `useAuthedQuery`/`useAuthedMutation` via `authedRequest`, `toQueryError` sans donnée sensible, `invalidateScope`/`purgeServerState`) ; 401 jamais retenté, mutations sans retry, pas de persistance, aucun endpoint métier ; **59 tests `node --test`** ; typecheck/lint/test/doctor verts |
| **Mobile Core React Native 6 — état local (Zustand) + purge au logout** | **FAIT** — `mobile-react-native` → **`LOCAL_STATE_READY`** : `useUiStore` Zustand générique (primitives UI non sensibles : `themePreference` + `flags` booléens, **séparé** du server-state, **sans persistance**) ; **purge logout déterministe câblée** dans `AuthProvider` (`await cancelQueries`→`clear` dès `unauthenticated`/`expired`, AuthEngine inchangé) ; **67 tests `node --test`** ; typecheck/lint/test verts |
| **Mobile Core React Native 7 — upload sécurisé (multipart)** | **FAIT** — `mobile-react-native` → **`UPLOAD_READY`** : descripteur RN `MobileFile {uri,name,type}` (**structurellement assignable** au `ReactNativeFileDescriptor` du package) + helpers **purs** (`isMobileFile`, `describeFileForLog` **sans `uri`** — pas de chemin device en log, `isAllowedFileType` pré-check UX exact/`*`/`*/*`) ; `useUploadMutation` via `useAuthedMutation` → `apiClient.files.upload(file, category, {subjectId, retryOnAuthRefresh:false})` (**refresh 401 possédé par l'AuthEngine**, `FormData` reconstruit au retry) ; **mutation → aucune clé de cache**, **aucun fichier/URL signée/token/Authorization** en query key/cache/log/store ; `toQueryError` étendu **413/415** ; **backend autoritaire** (ADR-007), aucun endpoint métier/écran ; **71 tests `node --test`** ; typecheck/lint/test verts |
| **Mobile Core React Native 8 — logger/observabilité client (avec redaction)** | **FAIT** — `mobile-react-native` → **`OBSERVABILITY_READY`** : `createLogger` (`debug`/`info`/`warn`/`error`, **niveaux**, **sink pluggable**, **horloge injectée**, corrélation `child`/`withRequestId`) + **redaction centrale** (`redactValue`/`redactString` : tokens/`Authorization`/cookies/JWT/**URL signées**/**chemins device**/**PII**) appliquée **avant** tout sink ; `safeErrorFields(QueryError)` (corrélation `requestId`, sans payload) ; **correctif `describeFileForLog`** (`{type,extension}`, plus de nom brut/PII) ; **aucune persistance/transport réseau/service externe/log de body** (ADR-040) ; **89 tests `node --test`** ; typecheck/lint/test + **expo-doctor 19/19** verts |
| **Mobile Core React Native 9 — permissions natives génériques (gouvernées)** | **FAIT** — `mobile-react-native` → **`PERMISSIONS_READY`** : modèle pur `PermissionKind`/`PermissionStatus` + **`normalizePermissionStatus`** (chaînes/objets Expo/booléens, conservateur) + helpers (`canRequestPermission`/`isPermissionGranted`/`isPermissionUsable`/`shouldOpenSettings`) ; `PermissionAdapter` (seam Expo) + **`createPermissionService`** (live `getStatus`/`request`/`ensure`/`openSettings`, **logs sûrs** `{kind,status}` via logger RN 8, **`PermissionAdapterError`** contrôlé sans cause sensible) ; **adaptateur placeholder** (no native dep) ; hook **`usePermission`** (status/loading/error, **no UI**) ; **statut jamais persisté** (ni SecureStore/Zustand/Query) ; **API Core = autorité** (07_SECURITY §6) ; **106 tests `node --test`** ; typecheck/lint/test + **expo-doctor 19/19** verts |
| **Mobile Core React Native 10 — notifications client (primitives locales, sans push réel)** | **FAIT** — `mobile-react-native` → **`NOTIFICATIONS_READY`** : `NotificationMessage` **borné/sûr** (`sanitizeNotificationMessage`, `describeNotificationForLog` **sans contenu**) + modèle (delivery-state/`normalizeTrigger`) ; `NotificationAdapter` (seam Expo) + **`createNotificationService`** (**gate** sur la permission `notifications` RN 9 — **jamais de schedule sans permission usable**, `schedule`/`cancel`/`cancelAll`/`getDelivered`, **logs sûrs** `{id,status,state,count}`, **`NotificationError`** contrôlé) ; **adaptateur placeholder** (no native dep, ids déterministes) ; **LOCAL only** (aucun push/token device/FCM/APNs, aucun stockage, aucune UI) ; **122 tests `node --test`** ; typecheck/lint/test + **expo-doctor 19/19** verts |
| **Mobile Core React Native 11 — i18n / localisation primitives génériques** | **FAIT** — `mobile-react-native` → **`I18N_READY`** : modèle de locale (`normalizeLocale` via **`Intl.getCanonicalLocales`**, `getLocaleDirection` ltr/rtl, `resolveLocale`) + **catalogue typé** (`createTranslator` : `t`/`has`/`plural`, interpolation `{name}`, pluralisation **`Intl.PluralRules`**, clé inconnue **sans throw**) + **formatters `Intl`** (`formatDate`/`formatNumber`/`formatCurrency` — devise requise, **ne lèvent jamais**) ; `LocaleAdapter` (seam Expo) + **placeholder** (no native dep, no persistence) + **`createLocalization`** ; **aucune dépendance** (Intl built-in), aucun réseau/persistance/UI, **catalogues métier = projets dérivés** ; **144 tests `node --test`** ; typecheck/lint/test + **expo-doctor 19/19** verts |
| **Mobile Core React Native 12 — deep-linking / routing primitives génériques** | **FAIT** — `mobile-react-native` → **`LINKING_READY`** : parseur pur (`parseDeepLink`/`decodeSafe`/`normalizeUrl`, custom schemes + `https`, **sans `URL` global**) + **`resolveLink`** (`internal`/`externalBlocked`/`invalid`) — **allowlist stricte** schemes/hosts, **anti-open-redirect** (`//`/`scheme://`/`..`), **params sensibles supprimés**, bornes ; `isInternalRoute` ; **`resolveNotificationLink`** (clé configurable, tap notification RN 10) ; **aucun log** (ni query sensible), **aucun stockage** de lien/URL, **aucune dépendance** ; routes concrètes = projets dérivés ; **159 tests `node --test`** ; typecheck/lint/test + **expo-doctor 19/19** verts |
| **Mobile Core React Native 13 — analytics / télémétrie primitives génériques (avec redaction, sans SDK réel)** | **FAIT** — `mobile-react-native` → **`ANALYTICS_READY`** : `AnalyticsEvent` borné + **redaction dédiée basée RN 8** (`sanitizeAnalyticsEvent` : `isSensitiveProperty` **réutilise `isSensitiveKey`** + scrub valeurs via **`redactString`**, bornes count/longueur, **sans throw**) ; `AnalyticsAdapter` (track/flush?, **pas de `identify`**) + **`createAnalyticsService`** (track **best-effort non-intrusif** — ne casse jamais le flux app, **logs sûrs** `{eventName,propertyCount}` via logger RN 8, erreurs adapter **contrôlées** sans cause sensible) ; **adaptateur placeholder** mémoire (tests) ; **aucun SDK réel/réseau/persistance/user-id réel/token** ; **175 tests `node --test`** ; typecheck/lint/test + **expo-doctor 19/19** verts |
| **Mobile Core React Native 14 — accessibilité (a11y) primitives génériques** | **FAIT** — `mobile-react-native` → **`A11Y_READY`** : props RN-compatibles (**`buildA11yProps`**/`normalizeA11yText` borné) + **`A11yState`** normalisé (ADR-010 §16 : `disabled`/`focused`/`pressed`/`invalid` + RN state ; `mergeA11yState`/`isInteractiveRole`) + **annonce** lecteur d'écran (`sanitizeAnnouncement`, `describeAnnouncementForLog` **sans texte**) + `A11yAdapter` (announce/focus?/isScreenReaderEnabled?, **`A11yAdapterError`** contrôlé) + **placeholder** mémoire + **`createA11yService`** (best-effort **non-intrusif**, **logs sûrs** `{length,assertive}` — jamais le texte) ; **aucun `AccessibilityInfo` réel/provider global/stockage/UI/dépendance** ; **196 tests `node --test`** ; typecheck/lint/test + **expo-doctor 19/19** + `git diff --check` verts |
| **Mobile Core React Native 15 — app lifecycle primitives génériques** | **FAIT** — `mobile-react-native` → **`APP_LIFECYCLE_READY`** : modèle **`AppLifecycleState`** (`active`/`background`/`inactive`/`unknown`) + helpers purs (`normalizeAppLifecycleState` tolérant, `isForeground`/`isBackground`, **`isValidTransition`** matrice, `nextAppLifecycleState`) ; `AppLifecycleAdapter` (seam RN `AppState`) + **`AppLifecycleAdapterError`** contrôlé + **placeholder** mémoire + **`createAppLifecycleService`** (`getState`/`subscribe`/`transition`/`dispose`, transitions **validées**, **best-effort non-intrusif** — erreurs adapter contrôlées + listener **isolé**, **logs sûrs** `{from,to}`/`{operation}` enums seulement) ; **aucun `AppState` réel/provider global/stockage/dépendance** ; **212 tests `node --test`** ; typecheck/lint/test + **expo-doctor 19/19** + `git diff --check` verts |
| **Mobile Core React Native 16 — connectivité réseau (network status) primitives génériques** | **FAIT** — `mobile-react-native` → **`NETWORK_STATUS_READY`** : **étend `src/offline`** (pas de module concurrent ; RN 3 inchangé, **`shouldQueueMutations` canonique**) — `NetworkConnectionType` borné (jamais SSID/carrier/IP) + `normalizeNetworkStatus`/`normalizeConnectionType` tolérants ; `NetworkAdapter` (seam RN NetInfo) + **`NetworkAdapterError`** contrôlé + **placeholder** mémoire + **`createNetworkService`** (`getStatus(): NetworkState`/`shouldQueue`/`subscribe`/`transition`/`dispose`, `changedAt` via **horloge injectée**, **best-effort non-intrusif** — erreurs adapter contrôlées + **listener isolé**, **logs sûrs** `{from,to,type}` enums) ; **aucun NetInfo réel/dépendance/offline sync/persistance/donnée sensible** ; **227 tests `node --test`** (dont `network-state` RN 3 inchangé) ; typecheck/lint/test + **expo-doctor 19/19** + `git diff --check` verts |
| **Mobile Core React Native 17 — feature flags / config primitives génériques** | **FAIT** — `mobile-react-native` → **`FEATURE_FLAGS_READY`** : **étend `src/config`** (env inchangé ; **séparé des `flags` UI Zustand RN 6**) — `FlagValue` (boolean/string/number) + `FlagSet` **bornés** (`MAX_FLAG_KEY_LENGTH`/`MAX_FLAG_VALUE_LENGTH`/`MAX_FLAGS`) + `isValidFlagKey`/`normalizeFlagValue`/`sanitizeFlagSet` tolérants + **getters typés à défaut sûr** (`getBooleanFlag`/`getStringFlag`/`getNumberFlag`/`getFlagValue<T>` — valeur rendue **seulement si le type correspond**) + `describeFlagsForLog` → **`{count}` seulement** ; `FlagAdapter` (seam local/remote-config) + **`FlagAdapterError`** contrôlé + **placeholder** mémoire + **`createFlagService`** (`getFlag`/`getAll`/`subscribe`/`refresh`/`dispose`, **best-effort non-intrusif** — erreurs adapter contrôlées + **listener isolé**, **logs sûrs** `{count}`/`{operation}` — **jamais clé ni valeur**) ; **aucun SDK remote-config réel/réseau/persistance/user targeting réel/secret/donnée sensible** ; **244 tests `node --test`** ; typecheck/lint/test + **expo-doctor 19/19** + `git diff --check` verts |
| **Mobile Core React Native 18 — gate biométrique local primitives génériques (ADR-015 §20)** | **FAIT** — `mobile-react-native` → **`BIOMETRIC_GATE_READY`** : `src/biometrics` — `BiometricAvailability` (`available`/`notEnrolled`/`unsupported`/`unknown`) + `BiometricType` borné (`fingerprint`/`facial`/`iris`/`unknown`) + `BiometricAuthOutcome` (`success`/`refused`/`cancelled`/`lockout`/`unavailable`/`error`) ; helpers **tolérants** (**junk → `unknown`/`error`, jamais `success`**) + objets **gelés** ; `BiometricAdapter` (seam Expo `LocalAuthentication`/Keychain) + **`BiometricAdapterError`** contrôlé + **placeholder** mémoire (`setAvailability`/`setNextOutcome` + compteur `authenticateCalls`) + **`createBiometricService`** (`getAvailability`/`isAvailable`/`authenticate`, **stateless**, **aucun faux succès** — `unavailable` **sans prompt** si inutilisable, adapter qui throw → `error`, **ne throw jamais**, **logs sûrs** `{availability,type}`/`{outcome}`/`{operation}` — **jamais prompt ni cause native**) ; **gate d'UX local — ne remplace JAMAIS l'auth serveur (API Core = autorité)** ; **aucun `LocalAuthentication`/Keychain réel/secret/biométrie/résultat/profil stocké** ; **262 tests `node --test`** ; typecheck/lint/test + **expo-doctor 19/19** + `git diff --check` verts |
| **Mobile Core React Native 19 — crash / error-reporting primitives génériques (seam, sans SDK réel — ADR-019)** | **FAIT** — `mobile-react-native` → **`CRASH_REPORTING_READY`** : `src/crash-reporting` — `CrashReportEvent` **borné** (`severity`/`source`/`name`/`message`/`stack?`/`context`) **rédigé via la redaction centrale RN 8** (`sanitizeCrashMessage`/**`sanitizeCrashStack`** — chemins device/tokens/URL signées/emails scrubés + cap frames, **jamais de stack brute** ; `sanitizeCrashContext` — clés sensibles → `[Redacted]`, primitives bornées, cap keys) + `normalizeCrashSeverity`/`normalizeCrashSource` tolérants + `createCrashReportEvent` (gelé) + `describeCrashEventForLog` → **`{severity,source}` seul** ; `CrashReporterAdapter` (seam Sentry/Crashlytics) + **`CrashReporterAdapterError`** contrôlé + **placeholder** mémoire (copies défensives) + **`createCrashReporterService`** (`captureError`/`captureMessage`/`setContext`/`flush`, **best-effort non-intrusif** — sync throw + async reject **capturés**, **jamais de faux succès / re-throw / rejection non gérée**, **logs sûrs** `{operation,severity,source}` — **jamais le contenu**) ; **sans SDK réel/réseau/persistance/batching/crash handler global ; ne décide PAS ADR-019 ; aucun token/cookie/URL signée/URI device/PII/body/stack brute/user-id réel** ; **279 tests `node --test`** ; typecheck/lint/test + **expo-doctor 19/19** + `git diff --check` verts |
| **Mobile Core React Native 20 — préférences non sensibles persistantes primitives génériques (seam, sans MMKV/AsyncStorage réel — ADR-015 §15/§16)** | **FAIT** — `mobile-react-native` → **`PREFERENCES_READY`** : `src/preferences` — `PreferenceValue` (bool/string/number) + `PreferenceSet` **bornés** (`MAX_PREFERENCE_KEY_LENGTH`/`MAX_PREFERENCE_VALUE_LENGTH`/`MAX_PREFERENCES`) + **`isValidPreferenceKey`** (format **+ non sensible**, réutilise `isSensitiveKey`) + `normalizePreferenceValue` + **`isSensitivePreferenceValue`** (string que la redaction RN 8 modifierait) + **`sanitizePreferenceSet`** (drop clés/valeurs sensibles + cap) + **getters typés à défaut sûr** + `describePreferencesForLog` → **`{count}` seul** ; `PreferenceStore` (seam **async** MMKV/AsyncStorage) + **`PreferenceStoreError`** contrôlé + **placeholder** mémoire (copies défensives) + **`createPreferenceService`** (`get`/`getBoolean`/`getString`/`getNumber`/`set`/`remove`/`clear`/`getAll`/`subscribe` — **garde les écritures** (clé/valeur sensible → **drop**) + **assainit les lectures**, **best-effort non-intrusif** sans throw, **listener isolé**, **logs sûrs** `{operation,count}` — **jamais clé ni valeur**) ; **données NON sensibles persistables uniquement — distinct de SecureStore (secrets)/Zustand RN 6 (UI in-memory)/TanStack Query (server-state)** ; **aucun MMKV/AsyncStorage réel/réseau/secret/PII ; ne décide aucun stockage natif** ; **294 tests `node --test`** ; typecheck/lint/test + **expo-doctor 19/19** + `git diff --check` verts |
| **Mobile Core React Native 21 — consentement télémétrie / privacy gate primitives génériques (ADR-038)** | **FAIT** — `mobile-react-native` → **`CONSENT_GATE_READY`** : `src/consent` — `ConsentCategory` (`analytics`/`crash`/`performance`/`diagnostics`) + `ConsentStatus` (`granted`/`denied`/`unknown`) + `ConsentSet` ; `normalizeConsentCategory` (inconnue → ignorée) + `normalizeConsentStatus` (junk → `unknown`, **jamais `granted`**) + **`sanitizeConsentSet`** tolérant + `isConsentGranted` + **`isTelemetryAllowed`** = **default-deny** (true **seulement** si catégorie connue ET `granted`) + `describeConsentEntryForLog`/`describeConsentForLog` ; `ConsentStore` (seam async) + **`ConsentStoreError`** contrôlé + **`createPreferenceConsentStore`** (persistance **déléguée aux préférences RN 20**, clés non sensibles `privacy.consent.*`, `clear()` ne touche que ces clés) + **placeholder** mémoire (copies défensives) + **`createConsentService`** (`get`/`set`/`isAllowed`/`getAll`/`clear`/`subscribe`, **best-effort non-intrusif** — store défaillant → `unknown` (non autorisé) sans throw, catégorie inconnue ignorée, **listener isolé**, **logs sûrs** `{operation,category,status}`/`{operation,count}` — **jamais de valeur utilisateur**) ; **gate à consulter AVANT émission analytics RN 13 / crash RN 19 ; aucun SDK réel/réseau/UI/identifiant/PII ; ne décide PAS ADR-038 ; ne câble pas analytics/crash** ; **309 tests `node --test`** ; typecheck/lint/test + **expo-doctor 19/19** + `git diff --check` verts |
| **Mobile Core React Native 22 — environnement / métadonnées app primitives génériques (seam, non identifiant)** | **FAIT** — `mobile-react-native` → **`APP_ENVIRONMENT_READY`** : `src/app-environment` — `AppEnvironmentSnapshot` **borné, allow-list stricte** (`os` ios/android/web/unknown + `osVersionMajor` **majeur seulement** + `appVersion`/`buildNumber`/`buildChannel`/`locale`/`environment`) + normalizers **tolérants** (`normalizeOs`, **`normalizeMajorVersion`** `17.5.1`→`17`, `normalizeAppVersion`/`normalizeBuildNumber` allow-listés bornés, `normalizeBuildChannel`, `normalizeRuntimeEnvironment`, `normalizeLocaleField` via i18n) + **`sanitizeAppEnvironmentSnapshot`** (lit **uniquement** les clés autorisées → **drop** deviceId/IDFA/AndroidID/installationId/pushToken/serial/model/IP ; objet **gelé**) + `describeAppEnvironmentForLog` (grossier) ; `AppEnvironmentAdapter` (seam **synchrone** `expo-application`/`expo-device`) + **`AppEnvironmentAdapterError`** contrôlé + **placeholder** mémoire (copies défensives, strippe les identifiants seedés) + **`createAppEnvironmentService`** (`getSnapshot`/`describeForContext`, **best-effort non-intrusif** — adapter qui throw → `{os:unknown}` sans throw, **ne persiste rien**, **ne collecte rien auto**, **logs sûrs** `{operation}`+champs grossiers) ; **contexte sûr pour analytics RN 13 / crash RN 19 — gaté par le consentement RN 21 ; aucun `expo-device`/`expo-application` réel/réseau/identifiant device (IDFA/Android ID/installation id/serial/MAC/IP)/modèle précis/PII ; ne décide ni ADR-038/ADR-019/ADR-018** ; **320 tests `node --test`** ; typecheck/lint/test + **expo-doctor 19/19** + `git diff --check` verts |
| **Mobile Core React Native 23 — presse-papiers (clipboard) sécurisé primitives génériques (seam, sans `expo-clipboard` réel)** | **FAIT** — `mobile-react-native` → **`CLIPBOARD_READY`** : `src/clipboard` — `ClipboardSensitivity` (`normal`/`sensitive`) + `ClipboardOperationResult` (`success`/`unavailable`/`rejected`/`error`) + `normalizeClipboardText` (borné `MAX_CLIPBOARD_TEXT_LENGTH`) + **`isSensitiveClipboardText`** (réutilise la **redaction RN 8** : Bearer/JWT/email/URL signée/URI `file`/`content` → sensible) + `classifyClipboardSensitivity` + **`describeClipboardTextForLog`** → **`{length,sensitivity}` seul** (jamais le contenu) ; `ClipboardAdapter` (seam `expo-clipboard` : `setString`/`getString?`/`hasString?`/`clear?`) + **`ClipboardAdapterError`** contrôlé + **placeholder** mémoire (slot transitoire, `peek` test-only) + **`createClipboardService`** (`copy`/`getString`/`hasString`/`clear` — **`copy` refuse un texte sensible** (détecté **ou** `markSensitive`) sauf `allowSensitive:true` → **`rejected`, adapter NON appelé** ; **`getString` opt-in explicite** jamais auto, valeur sensible renvoyée mais **jamais loggée** ; **`clear` no-op sûr** si absent ; **best-effort non-intrusif** — adapter qui throw → `error` sans throw ; **logs sûrs** `{operation,result,sensitivity,length}` — **jamais le contenu**) ; **canal transitoire/non fiable ; clipboard NON stocké (pas de preferences/Zustand/Query/SecureStore) ; aucun `expo-clipboard` réel/réseau/persistance/UI/lecture auto** ; **330 tests `node --test`** ; typecheck/lint/test + **expo-doctor 19/19** + `git diff --check` verts |
| **Mobile Core React Native 24 — retry / backoff primitives génériques (purs, horloge injectée)** | **FAIT** — `mobile-react-native` → **`RETRY_READY`** : `src/retry` — `RetryPolicy` **borné** (`maxAttempts` **inclut l'appel initial**) + `normalizeRetryPolicy` ; **`computeBackoffDelay(attempt, policy, rng?)`** (exponentiel borné + jitter déterministe via `rng`) ; **`isRetryableError`/`getRetryDecision`** (network/timeout/408/429/5xx retryable ; 4xx/401/403/session-expired/inconnu non retryable ; raison enum sûre) + `isAuthOwnedError` ; **`withRetry(fn, policy, {sleep, rng, shouldRetry?, logger?})`** (`sleep` injecté, **401/403/session-expired hard-blockés même via `shouldRetry`**, erreur finale originale propagée, logs `{attempt,delayMs}` seuls). **Aucun réseau réel, aucune dépendance, aucun `Date.now()` testé, aucun branchement automatique sur AuthEngine/withAuthRetry/QueryClient/mutations** ; **346 tests `node --test`** ; typecheck/lint/test + **expo-doctor 19/19** + `git diff --check` verts |
| **Mobile Core React Native 25 — telemetry context composition opt-in** | **FAIT** — `mobile-react-native` → **`TELEMETRY_COORDINATOR_READY`** : `src/telemetry` compose consentement RN 21 default-deny + contexte environnement safe RN 22 + services analytics RN 13/crash RN 19 ; `track`/`captureError`/`captureMessage` opt-in ; no-op contrôlé si consentement absent/refusé ; logs `{operation,category,allowed}` seuls ; aucun SDK réel/réseau/persistance/identity/auto-start/retry RN 24 ; **355 cas `test(...)`** ; typecheck/lint/test + expo-doctor 19/19 + `git diff --check` verts |
| **Mobile Core React Native 26 — V1 usable starter shell / settings générique** | **FAIT** — `mobile-react-native` → **`STARTER_SETTINGS_READY`** : route Settings protégée + lien Home ; sections Session, Preferences/UI, Privacy/Telemetry placeholder RN21, Environment safe RN22, Foundation diagnostics ; aligne le starter avec `strategy/04_ROADMAP_GLOBAL.md` §9 Mobile V1 ; aucun réseau/endpoint métier/SDK réel/adaptateur natif/persistance/retry branché ; typecheck/lint/test + expo-doctor 19/19 + `git diff --check` verts |
| **Mobile Core React Native 27 — durcissement runtime du starter Expo** | **FAIT** — `mobile-react-native` → **`STARTER_RUNTIME_HARDENED`** : shell Expo public/protégé/settings durci ; boutons wrap-safe/full-width, conteneurs Sign-in/Home contraints, lignes Settings multi-ligne ; `expo export -p ios` OK, `npm start` tenté, export web bloqué par absence volontaire de `react-native-web` ; aucun réseau/dépendance/SDK/adaptateur natif réel/endpoint métier/retry/câblage Auth-Query modifié |
| **Mobile Core React Native 28 — smoke visuel device/simulateur du starter** | **FAIT** — `mobile-react-native` → **`STARTER_VISUAL_SMOKE_READY`** : Android Emulator `Pixel_6a` via Expo Go ; sign-in public, Home protégé, Settings protégé, scroll, retour Home, refresh session et sign out validés avec mock auth local temporaire ; aucune correction UI/runtime requise ; typecheck/lint/test/doctor/export iOS/smoke Android + `git diff --check` verts |
| **Mobile Core React Native 29 — automatisation du smoke runtime starter** | **FAIT** — `mobile-react-native` → **`STARTER_SMOKE_AUTOMATION_READY`** : `npm run smoke:android` ajoute un smoke Android local reproductible sans backend réel ; mock auth temporaire, `adb reverse`, Expo Android, pilotage par labels UI Android, rapport JSON `passed` sur `emulator-5554` ; aucun réseau métier/dépendance/SDK/adaptateur natif réel/retry/changement Auth-Query |
| **Mobile Core React Native 30 — smoke runtime iOS/simulateur ou device parity** | **FAIT / BLOQUÉ ENVIRONNEMENT** — `mobile-react-native` → **`STARTER_IOS_SMOKE_BLOCKED_BY_ENVIRONMENT`** : `npm run smoke:ios` ajoute un préflight iOS sans dépendance ; l'hôte local est Linux sans `xcrun`, donc aucun runtime iOS réel n'est exécuté ; procédure macOS/device documentée, Android RN28/RN29 conservé |
| Files Web (upload) | **débloqué** — c'est **Web Core Files 2** ; non prioritaire (pas de défaut bloquant ; CI désormais en place) |
| Middleware Auth « autoritaire » (Web) | **rejeté (checkpoint)** — un middleware ne valide pas un token / ne connaît pas la révocation ; UX léger (présence de cookie) seulement |
| Intégrer les packages dans le Mobile | **FAIT (RN 4)** — `@enistere/api-client-fetch` + `@enistere/api-contracts` **consommés** par le core mobile (liés `file:` + Metro, **sans** ajout aux workspaces racine — choix validé) ; bundle Metro prouvé ; **couche server-state RN 5 livrée** (hooks `useAuthedQuery`/`useAuthedMutation`) |
| Publier les packages | **CI minimale présente** (ADR-013 partiel) mais **registry/publication non décidés** (ADR-014 non implémenté) |
| Mobile Core Flutter | spécification absente ; **ADR-034 validé** |
| Web Core Angular | spécification absente ; **ADR-035 validé** — blocker UI levé |
| AI / Docs / Quality Cores | spécifications absentes |
| API Core Spring Boot | spécification absente |

## 4. Prérequis

- Commit Git de référence (gouvernance) — **avant tout**.
- Pour UI Kit : aucun prérequis technique manquant (ADR-008/009/010 Validés).
- Pour Web/Mobile : UI Kit initialisé + packages disponibles (déjà le cas).

## 5. Critères d'entrée (avant de démarrer la prochaine action)

1. Avoir lu `SESSION_HANDOFF.md`, `FOUNDATION_CURRENT_STATE.md`, `IMPLEMENTATION_MATRIX.md`, ce fichier.
2. Avoir vérifié le repository réel (ne rien supposer absent de la matrice).
3. Avoir signalé toute divergence entre les docs de statut et le repository.
4. Disposer d'une mission **explicite** ciblant **un seul** core.

## 6. Critères de sortie (fin de la prochaine action)

1. Core ciblé exécutable (build + lint + typecheck + tests verts) **et** revu.
2. Aucune régression du API Core, du UI Kit ni des packages.
3. `docs/project-status/` mis à jour (matrice, état, décisions si l'implémentation change, prochaines actions, handoff).
4. `CHANGELOG.md` mis à jour.
5. État Git propre / commit effectué.

## 7. Interdits pour la prochaine mission

- Initialiser **plus d'un** core à la fois.
- Modifier le API Core ou les packages sans mission explicite dédiée.
- Modifier des ADR ou des `CORE_SPECIFICATION.md` sans décision.
- Ajouter des dépendances non couvertes par un ADR validé.
- Déclarer un core « validé » sans tests + revue.
- Supprimer une preuve sans vérifier qu'elle est remplacée.
