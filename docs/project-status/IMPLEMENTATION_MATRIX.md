# IMPLEMENTATION_MATRIX.md — Matrice d'implémentation officielle

> Vérifiée depuis le repository (2026-07-12). Légende des statuts officiels : `ABSENT`,
> `DOSSIER_SEULEMENT`, `SPECIFICATION_DOCUMENTAIRE`, `ADR_EN_COURS`, `PREUVE_TECHNIQUE`,
> `STARTER_INITIALISE`, `CADRAGE_OPERATIONNEL` (cadrage gouverné — docs de politique/exécution, **sans** infra
> réelle ni starter), `IMPLEMENTATION_PARTIELLE`, `IMPLEMENTATION_AVANCEE`, `VALIDE_V1`, `SUSPENDU`,
> `A_REVOIR`. Colonnes : ✓ = présent/fait, — = absent/non fait.

## 1. Cores et packages

> **Mise à jour Quality Core 5 (2026-07-11)** : `RELEASE_PROCESS_RUNBOOK.md` créé dans `cores/quality-core/`. Processus de release gouverné : 5 définitions (merge / promotion / release Foundation / staging / production), 5 types de release (`foundation-v1-baseline` / `core-v1-validation` / `quality-v2-increment` / `staging-candidate` / `hotfix`), prérequis généraux (4 catégories), procédure en 8 étapes, format notes de release, convention de tagging futur (sans tag créé). `docs/checklists/RELEASE_READINESS_CHECKLIST.md` mis à jour : section Foundation Release (Partie 5). Aucun workflow modifié, aucune release créée, aucune dépendance, aucun changement runtime.
>
> **Mise à jour Governance 3 (2026-07-11)** : protection de `main` vérifiée **active via GitHub Rulesets**.
> Ruleset `protect-main`, enforcement `active`, cible `~DEFAULT_BRANCH`, suppression et non-fast-forward interdits,
> Pull Request obligatoire, conversations résolues obligatoires, status checks stricts requis :
> `api-contracts`, `api-client-fetch`, `ui-kit`, `web-nextjs`, `audit`, `api-runtime`, `web-e2e`, `api-smoke`.
> Les deux jobs `images` restent recommandés phase 2, non requis actuellement.
>
> **Mise à jour Quality Core CI-required checks alignment (2026-07-12)** : rapport
> `QUALITY_CORE_REQUIRED_CHECKS_ALIGNMENT.md`. Decision : **PROMOTION_RECOMMANDÉE, NON_APPLIQUÉE** pour les
> deux jobs `images (...)`. Le ruleset n'est pas modifié sans validation humaine/admin.
>
> **Mise à jour Quality Core coverage standardization decision (2026-07-12)** : rapport
> `QUALITY_CORE_COVERAGE_STANDARDIZATION_DECISION.md`. Decision :
> **STANDARDISATION_PARTIELLE_EXISTANTE, PAS_DE_NOUVELLE_COMMANDE**. Coverage locale reconnue pour
> UI Kit/Web/API ; pas de coverage artificielle pour les autres scopes.
>
> **Mise à jour Quality Core V1 Readiness Review (2026-07-13)** : rapport
> `QUALITY_CORE_V1_READINESS_REVIEW.md`. Quality Core passe de **`IMPLEMENTATION_AVANCEE`** à
> **`VALIDE_V1`**. Les critères roadmap §13.4 sont couverts ; les réserves restantes relèvent de V2/VF avancée.
>
> **Mise à jour Mobile Core V1 Readiness Review (2026-07-13)** : rapport
> `MOBILE_CORE_V1_READINESS_REVIEW.md`. Mobile Core React Native passe de
> **`STARTER_UI_KIT_ALIGNED`** à **`IMPLEMENTATION_AVANCEE`**. Après RN36/RN37, critères roadmap §9.4 :
> **8/8 satisfaits** ; B1 upload runtime fermé ; B3 PreferenceStore fermé comme réserve formellement acceptée.
> À cette étape, `VALIDE_V1` restait différé uniquement par **B2 — smoke iOS**
> (macOS/Xcode ou device iOS requis, ou décision formelle d'acceptation de réserve environnementale).
>
> **Mise à jour Mobile Core V1 final readiness decision (2026-07-13)** : rapport
> `MOBILE_CORE_V1_FINAL_READINESS_DECISION.md`. Mobile Core React Native passe de
> **`IMPLEMENTATION_AVANCEE`** à **`VALIDE_V1`**. B2 iOS est acceptée comme réserve
> environnementale non bloquante : `smoke:ios` reste `blocked` sur Linux, aucun succès iOS réel
> n'est revendiqué, aucun succès artificiel n'est créé. RN31 reste à exécuter dès qu'un environnement
> macOS/Xcode ou device iOS réel est disponible.
>
> **Mise à jour V3 Entry Decision (2026-07-13)** : rapport `V3_ENTRY_DECISION.md`.
> La séquence V3 s'ouvre par **Mobile Core Flutter**, mais uniquement via la décision structurante
> **ADR-034 — Flutter UI : Material 3 vs composants maison**. Aucun starter V3, aucune dépendance,
> aucun runtime modifié.
>
> **Mise à jour API Core Spring Boot 1 — Core specification (2026-07-14)** :
> `cores/api-spring/CORE_SPECIFICATION.md` (42 sections : résumé exécutif, rôle, objectifs,
> périmètre, architecture cible, structure cible, modules obligatoires V1, modules optionnels,
> standards API/sécurité/qualité Java, auth JWT Spring Security, RBAC Method Security,
> users/roles/permissions, validation Jakarta BV, gestion erreurs `@ControllerAdvice`,
> logs SLF4J/Logback, audit logs, upload MinIO, cache Redis, jobs Spring Async/Scheduler,
> OpenAPI springdoc, health Actuator, tests JUnit 5 + Testcontainers, §30 critères V1,
> §41 missions ordonnées, §42 cohérence NestJS, §40 décisions pendantes) +
> `cores/api-spring/README.md`. Aucun starter, aucun code Java, aucune dépendance.
> `quality-gates docs` 2/2 ✅ · `git diff --check` ✅.
> `api-spring` : **`DOSSIER_SEULEMENT` → `SPECIFICATION_DOCUMENTAIRE`**.
>
> **Mise à jour API Core Spring Boot 2A — ADR build system (2026-07-14)** :
> `docs/adr/ADR-041-build-system-api-spring-maven-vs-gradle.md`. Décision : **Maven** comme build
> system principal V1. `pom.xml` + Spring Boot Parent POM + `mvn verify` + Maven Wrapper (`mvnw`).
> Gradle autorisé uniquement par exception documentée dans un projet dérivé.
> `quality-gates docs` 2/2 ✅ · `git diff --check` ✅.
>
> **Mise à jour API Core Spring Boot 2 — Starter minimal Maven (2026-07-15)** :
> `cores/api-spring/pom.xml` (Spring Boot 4.1.0, JJWT 0.12.6, Java 21),
> `mvnw` / `mvnw.cmd` / `.mvn/wrapper/` (Maven Wrapper 3.9.12),
> structure Java `com.enistere.core` : `EnistereCoreApplication`, `JwtConfig`,
> `SecurityConfig` (STATELESS, JWT filter, CORS dev, no CSRF, Spring Security 7.x),
> `ApiError` record, `GlobalExceptionHandler` (`@RestControllerAdvice`),
> `JwtTokenProvider` (JJWT 0.12.x — generate/validate/extract),
> `JwtAuthenticationFilter` (`OncePerRequestFilter`),
> `AuthController` (`/api/v1/auth/{login,me,logout,refresh}`) + DTOs,
> `application.yml`, `application-test.yml`.
> Tests : **18/18 ✅** (`JwtTokenProviderTest` 7 · `AuthControllerTest` 10 · context loads 1).
> `./mvnw verify` : **BUILD SUCCESS**.
> Aucun secret hardcodé — `JWT_SECRET`, `STUB_USERNAME`, `STUB_PASSWORD` via env vars.
> Auth stub temporaire (credentials config, JWT réel, sans DB) — refresh token 501, DB en Spring Boot 3.
> `api-spring` : **`SPECIFICATION_DOCUMENTAIRE` → `STARTER_INITIALISE`**.
>
> **Mise à jour API Core Spring Boot 6 — V1 Readiness Review (2026-07-15)** :
> Rapport `API_SPRING_V1_READINESS_REVIEW.md`. Matrice §30 : **11/15 satisfaits, 3/15 partiels, 1/15 non satisfait**.
> Satisfaits : C1 démarrage JVM, C2 PostgreSQL+Flyway, C3 auth flow, C4 tokens JWT+refresh, C5 routes protégées, C6 RBAC,
> C7 validation DTO, C8 ApiError, C11 OpenAPI, C12 tests TC 71/71, C13 secrets/logs.
> Partiels : C9 (URL signée absente), C10 (Redis/storage health absents), C15 (CORS hardcodé).
> Non satisfait : C14 (audit logs — module obligatoire §9 absent, table manquante, pas d'events).
> Bloquants : **B1 audit logs** (§9 module obligatoire) ; **B2 URL signée** (§20 presigned URL absente).
> Réserves acceptées : R1 MinIO TC, R2 CORS env var, R3 rate limiting, R4 Tika, R5 Redis.
> `api-spring` : **`CI_JAVA_READY` → `IMPLEMENTATION_AVANCEE`**.
> Prochaine : **API Core Spring Boot 7 — AuditModule + download URL signée + CORS env var**.
>
> **API Core Spring Boot 7 — AuditModule + URL signée + CORS env var (2026-07-15)** :
> B1 fermé — `V3__add_audit_logs.sql` (8 colonnes, 3 index) ; `AuditLog` entité JPA ; `AuditEventType` enum (7 valeurs) ;
> `AuditService` (`@Transactional(propagation = REQUIRES_NEW)`, best-effort, catch-all) ; traçage : `AuthService`
> (LOGIN_SUCCESS, LOGIN_FAILURE, LOGOUT, TOKEN_REFRESH), `FileService` (FILE_UPLOAD, FILE_DOWNLOAD_URL_CREATED),
> `AdminController` (ADMIN_ACCESS) ; aucun payload sensible dans audit_logs (ni password, ni refresh token, ni storageKey, ni URL).
> B2 fermé — `GET /api/v1/files/{id}/download-url` : ownership-check `findByIdAndOwnerId()` + anti-énumération 404 ;
> `StorageService.generatePresignedDownloadUrl()` interface + MinioStorageService (GetPresignedObjectUrlArgs TTL 300s)
> + FakeStorageService (URL factice) ; `Cache-Control: no-store` ; `FilesConfig.presignedUrlTtlSeconds` configurable via env.
> C15 fermé — `CorsConfig` (`@ConfigurationProperties`) injectable via `${CORS_ALLOWED_ORIGINS:...}` ; CSV parsing robuste ;
> `SecurityConfig` utilise `corsConfig.getAllowedOriginsList()` — jamais wildcard `*` avec credentials.
> Tests : `FlywayMigrationTest` +3 (V3 audit_logs) ; `AuditIntegrationTest` 7 ; `FilesDownloadUrlIntegrationTest` 6 ;
> `CorsIntegrationTest` 3 ; total **90/90 ✅ BUILD SUCCESS**.
> Satisfaits C9 (URL signée ✅), C14 (audit logs ✅), C15 (CORS env var ✅). Score §30 : **14/15 ✅ / 1 ⚠️ (C10 Redis) / 0 ✗**.
> `api-spring` : **`IMPLEMENTATION_AVANCEE` → `VALIDE_V1`** (SB7).
> Réserve R5 Redis/cache différée SB8.
>
> **API Core Spring Boot 8 — Redis health + Rate limiting + MinIO TC (2026-07-15)** :
> `spring-boot-starter-data-redis` (Lettuce, version SB parent) ; `spring.data.redis.url: ${REDIS_URL:redis://localhost:6379}` ;
> `RedisHealthIndicator` auto-configuré via Actuator ; `management.health.redis.enabled: false` en test (re-enabled dans `RedisHealthIntegrationTest`).
> `RateLimitConfig @ConfigurationProperties(prefix="enistere.security.rate-limit")` + `@Validated` ;
> `RateLimitInterceptor @Component @ConditionalOnProperty(enabled, matchIfMissing=true)` fixed-window `ConcurrentHashMap<String,RateWindow>` par IP ;
> 4 endpoints : `/api/v1/auth/login`, `/api/v1/auth/refresh`, `/api/v1/files/upload`, `/api/v1/files/*/download-url` ;
> 429 via `ResponseStatusException(TOO_MANY_REQUESTS)` → `GlobalExceptionHandler.handleResponseStatus()` → `ApiError` ;
> `clearWindows()` pour isolation inter-tests ; `WebMvcConfig @Configuration WebMvcConfigurer` + `@Autowired(required=false) RateLimitInterceptor`.
> `RedisHealthIntegrationTest` : `GenericContainer("redis:7-alpine")` static + `@DynamicPropertySource` → `spring.data.redis.url` ;
> `@TestPropertySource(properties = "management.health.redis.enabled=true")` ; 2 tests (redis UP, db UP).
> `MinioStorageIntegrationTest` : `GenericContainer("minio/minio:RELEASE.2024-01-16T16-07-38Z")` static +
> `Wait.forHttp("/minio/health/live")` + `@DynamicPropertySource` (override `enistere.files.*`) +
> `@Import(MinioTestConfig.class)` + `@TestConfiguration @Primary @Bean StorageService` (override `FakeStorageService`) ;
> `testMinioClient` static pour assertions ; 3 tests (upload → `listObjects`, URL `X-Amz-*`, `Cache-Control: no-store`).
> `application-test.yml` mis à jour : `management.health.redis.enabled: false` + `show-details: always` +
> `enistere.security.rate-limit.enabled: false` + `io.lettuce/io.netty: ERROR`.
> Tests : **99/99 ✅ BUILD SUCCESS** (90 SB7 + 4 RateLimitIntegrationTest + 2 RedisHealthIntegrationTest + 3 MinioStorageIntegrationTest).
> C10 fermé (DB + Redis UP en TC) ; R1 fermé (MinIO TC réel) ; R3 fermé (rate limiting) ; R5 fermé (Lettuce + health indicator).
> Score §30 : **15/15 ✅ / 0 ⚠️ / 0 ✗**.
> `api-spring` : **`VALIDE_V1`** confirmé — aucune réserve bloquante.
>
> **Mise à jour API Core Spring Boot 3 — PostgreSQL + JPA + Flyway + RBAC (2026-07-15)** :
> `pom.xml` : `spring-boot-starter-data-jpa`, `postgresql`, `spring-boot-starter-flyway`, `flyway-database-postgresql`, `bcprov-jdk18on:1.82`, `spring-boot-testcontainers`, `testcontainers-junit-jupiter`, `testcontainers-postgresql` (TC 2.0.5 IDs).
> Migration `V1__init_schema.sql` (6 tables, 5 index). `BaseEntity`, `DatabaseConfig` (`@EnableJpaAuditing`), `Argon2Config`.
> Entités JPA : `User`, `Role`, `Permission`, `RefreshToken` (hash SHA-256).
> Repositories + JPQL `findPermissionNamesByUserId`. `EnistereUserDetailsService` DB-backed.
> `JwtTokenProvider` : `generateAccessToken(email, userId, permissions)` — claims `userId`+`permissions[]` ; suppression `extractRole`.
> `AuthService` : login Argon2 verify, refresh rotation, logout, me DTO.
> `AdminController` : `GET /api/v1/admin/ping` `@PreAuthorize("hasAuthority('admin.access')")`.
> `SecurityConfig` : `Argon2PasswordEncoder` + `DaoAuthenticationProvider(userDetailsService)`.
> `GlobalExceptionHandler` : `AccessDeniedException`/`AuthenticationException` re-throwées.
> Tests : `AbstractIntegrationTest` (singleton TC + `@DynamicPropertySource`), `TestDataFactory`, `FlywayMigrationTest` 4, `JwtTokenProviderTest` 9, `AuthControllerTest` 10, `AuthIntegrationTest` 14, `RbacIntegrationTest` 5. **43/43 ✅ BUILD SUCCESS**.
> Adaptations SB 4.x : `DaoAuthenticationProvider(uds)` (SS7), `spring-boot-starter-flyway` (FlywayAutoConfig hors `spring-boot-autoconfigure`), TC 2.0.5 artifact IDs.
> `api-spring` : **`STARTER_INITIALISE` → `IMPLEMENTATION_PARTIELLE`**, sous-statut `PERSISTENCE_RBAC_READY`.
>
> **Mise à jour Mobile Core Flutter V1 Final Readiness Decision (2026-07-14)** : rapport
> `MOBILE_FLUTTER_V1_FINAL_READINESS_DECISION.md`. Mobile Core Flutter promu de
> **`IMPLEMENTATION_AVANCEE`** à **`VALIDE_V1`**. Décision : R1 (iOS Linux) acceptée comme réserve
> environnementale non bloquante — identique à RN B2. Score §29 : 9/11 pleinement satisfaits +
> 2/11 PARTIAL (C1, C11 — même contrainte iOS, Android prouvé réel). Zéro bloquant restant.
> 218/218 tests headless · smoke `emulator-5554` 7/7 ✅. Aucun code Flutter modifié.
> `quality-gates docs` 2/2 ✅ · `git diff --check` ✅.
>
> **Mise à jour Mobile Core Flutter 11 — Sign-in form validation (2026-07-14)** : rapport
> `MOBILE_FLUTTER11_ANDROID_SMOKE_REPORT.md`. **B5 FERMÉ** — `SignInScreen` converti de `ConsumerWidget` à
> `ConsumerStatefulWidget` + `Form` + `TextFormField` email (`Key('emailField')`, `keyboardType: emailAddress`,
> `TextInputAction.next`, validation requis + format `@`) + `TextFormField` password (`Key('passwordField')`,
> `obscureText: true`, `TextInputAction.done`, validation requis) + erreur auth générique
> `Semantics(liveRegion: true)` + bouton `FilledButton` désactivé pendant loading ; `ThrowingAuthController`
> stub test ; `router_guard_test.dart` adapté. 10 tests widget headless ; smoke `emulator-5554` 7/7 ✅ ;
> 218/218 tests headless. C9 : ❌ → ✅. Score §29 : 8/11 → 9/11. Tous les bloquants B1→B5 fermés.
>
> **Mise à jour Mobile Core Flutter 10 — UI states Foundation (2026-07-14)** : rapport
> `MOBILE_FLUTTER10_ANDROID_SMOKE_REPORT.md`. **B4 FERMÉ** — `LoadingState` / `EmptyState` / `ErrorState` /
> `SuccessState` dans `lib/src/core/states/` ; tokens depuis `EnistereThemeExtension` (espacements,
> `colorDanger`/`colorSuccess`/`colorTextMuted`, primaire `ColorScheme`) ; Semantics `label` (LoadingState) +
> `liveRegion` (ErrorState/SuccessState) ; 39 tests widget headless ; smoke `emulator-5554` 7/7 ✅ (aucune
> régression) ; 213/213 tests headless. C7 : ❌ → ✅. Score §29 : 7/11 → 8/11. B5 restant.
>
> **Mise à jour Mobile Core Flutter 9 — RefreshInterceptor 401 coalescent (2026-07-14)** : rapport
> `MOBILE_FLUTTER9_ANDROID_SMOKE_REPORT.md`. **B3 FERMÉ** — `AuthApi` seam + `PlaceholderAuthApi` (Foundation V1) ;
> `RefreshInterceptor` (401 → `refreshSession()` → retry unique, guard `_refreshed` anti-boucle, 403/5xx pass-through) ;
> `AuthController.refreshSession()` coalescent (`_refreshFuture ??= _doRefresh().whenComplete(...)`) + `_purgeSession()` ;
> `authApiProvider` injectable ; `TokenRefresher` typedef ; `createDioClient(refresher:)` optionnel ;
> `dioClientProvider` câblé. Découverte clé : Dio 5.x → ordre d'enregistrement FORWARD (pas inversé) —
> `RefreshInterceptor` enregistré AVANT `ErrorInterceptor`. 14 tests unitaires headless + smoke `emulator-5554` 7/7 ✅.
> 174/174 tests headless. `flutter pub get` ✅ · `flutter analyze` 0 ✅ · `dart format` 0 ✅ ·
> `quality-gates docs` 2/2 ✅ · `git diff --check` ✅.
> C3 : refresh 401 ❌ → ✅. C4 : ✅ PARTIAL → ✅. Score §29 : 5/11 → 7/11. B4→B5 restent ouverts.
>
> **Mise à jour Mobile Core Flutter 8 — SecureStorage seam + adapter (2026-07-14)** : rapport
> `MOBILE_FLUTTER8_ANDROID_SMOKE_REPORT.md`. **B2 FERMÉ** — `flutter_secure_storage: ^10.3.1` ajouté ;
> `SecureStorageAdapter` seam (testable sans platform channels) + `FlutterSecureStorageAdapter` (Keychain/Keystore) +
> `SecureSessionStore` (purge défensive sur données corrompues) ; `SessionEnvelope.fromJson`/`toJson`/`refreshToken?`
> (toString omet refreshToken — ADR-015) ; `AuthController.restoreSession()` public (§9.11 spec) ;
> access token reste `_accessToken` en mémoire — jamais persisté. 23 tests unitaires (`FakeSecureStorageAdapter` :
> write/read/clear, validation défensive, garantie access token, signOut, sérialisation) ; 2 tests smoke SecureStorage device.
> Smoke `emulator-5554` (Pixel 6a, API 33, x86_64) : **7/7 tests passés en 10s** ✅ (5 originaux + 2 SecureStorage B2).
> 160/160 tests headless. `flutter pub get` ✅ · `flutter analyze` 0 issues ✅ · `flutter test` 160/160 ✅ ·
> `dart format` 0 ✅ · `quality-gates docs` 2/2 ✅ · `git diff --check` ✅.
> C3 : restore ✅ (refresh 401 ❌ — B3). C4 : ❌ → ✅ PARTIAL. B3→B5 restent ouverts.
>
> **Mise à jour Mobile Core Flutter 7 — platform dirs + smoke Android (2026-07-14)** : rapport
> `MOBILE_FLUTTER7_ANDROID_SMOKE_REPORT.md`. **B1 FERMÉ** — dossiers `android/` générés via
> `flutter create --platforms=android --org com.enistere .` ; smoke `emulator-5554` (Pixel 6a, API 33, x86_64) :
> `assembleDebug` 512.2s ✅ · APK installé 924ms ✅ · **5/5 tests integration_test passés en 9s** ✅.
> Tests : app démarre sans crash, utilisateur non authentifié → `SignInScreen`, sign-in → `HomeScreen`,
> logout → `SignInScreen`, session restore → `HomeScreen`. 136 tests headless inchangés.
> `flutter pub get` ✅ · `flutter analyze` 0 issues ✅ · `flutter test` 136/136 ✅ · `dart format` 0 ✅ ·
> `quality-gates docs` 2/2 ✅ · `git diff --check` ✅.
> C1 et C11 : ❌ → ✅ PARTIAL (Android réel, iOS R1 maintenu). B2→B5 restent ouverts.
>
> **Mise à jour Mobile Core Flutter V1 Readiness Review (2026-07-14)** : rapport
> `MOBILE_FLUTTER_V1_READINESS_REVIEW.md`. Mobile Core Flutter passe de **`TEST_WIDGET_PASSED`** à
> **`IMPLEMENTATION_AVANCEE`**. Score §29 : 5/11 satisfaits, 1/11 partiel, 5/11 non satisfaits.
> Bloquants V1 : B1 Android runtime (library sans `android/`), B2 `flutter_secure_storage` absent,
> B3 `RefreshInterceptor` absent, B4 états UI absents (`LoadingState`/`EmptyState`/`ErrorState`/`SuccessState`),
> B5 login form absent (`SignInScreen` bouton mock uniquement). Réserves acceptées : R1 iOS Linux
> (identique RN B2), R2 pas de backend réel, R3 Freezed/build_runner délibérément absent.
> Chemin vers VALIDE_V1 : Flutter 7 (platform dirs + smoke Android) → Flutter 8 (SecureStorage) →
> Flutter 9 (RefreshInterceptor) → Flutter 10 (UI states) → Flutter 11 (login form) → Flutter V1 final.
> `quality-gates docs` 2/2 ✅ · `git diff --check` ✅.
>
> **Mise à jour Mobile Core Flutter 6 (2026-07-14)** : tests widget/intégration + smoke livrés —
> `test/widget/splash_screen_test.dart` (4 tests : SplashScreen render, CircularProgressIndicator, centré, app en loading avec `_BlockingSessionStore`),
> `test/widget/sign_in_screen_test.dart` (5 tests : heading, bouton, touch target ≥ 44 dp, navigation, couleur primaire),
> `test/widget/home_screen_test.dart` (7 tests : heading, AppBar, logout icon, userId, ADR-034, ThemeExtension, logout → SignInScreen),
> `integration_test/smoke_test.dart` (5 tests device — architecture library sans platform dirs, procédure pour projets dérivés),
> `scripts/smoke.sh` (smoke runner : headless / --android / --ios),
> `docs/project-status/MOBILE_FLUTTER6_SMOKE_REPORT.md` (136/136 tests headless, blocage Android architectural documenté, iOS bloqué Linux).
> `integration_test: sdk: flutter` ajouté en dev_dependency.
> `flutter test` 136/136 ✅ · `flutter analyze` 0 issues ✅ · `dart format` 0 changements ✅ · `quality-gates docs` 2/2 ✅.
> Mobile Core Flutter : **`UPLOAD_READY`** → **`TEST_WIDGET_PASSED`**.
>
> **Mise à jour Mobile Core Flutter 5 (2026-07-14)** : upload multipart primitives livrés —
> `lib/src/core/upload/app_file.dart` (`AppFile`, `SafeFileDescriptor`, `describeFileForLog`, `isValidAppFile`, `isAllowedUploadContentType`),
> `lib/src/core/upload/file_category.dart` (`FileCategory` + `.apiValue`),
> `lib/src/core/upload/upload_result.dart` (`UploadedFileMetadata.fromJson`),
> `lib/src/core/upload/upload_service.dart` (`UploadService` interface + `DioUploadService`, `MultipartFileFactory` injectable).
> `http_parser: ^4.0.0` ajouté. Tests 120/120 — unit/upload/app_file (21) + unit/upload/upload_service (14) + tests Flutter 1→4 inchangés.
> Mobile Core Flutter : **`DIO_CLIENT_READY`** → **`UPLOAD_READY`**.
>
> **Mise à jour Mobile Core Flutter 3 (2026-07-14)** : auth shell + guards livrés —
> `lib/src/core/auth/` (`AuthStatus`, `AuthState`, `SessionEnvelope`, `SessionStore` seam +
> `InMemorySessionStore`), `AuthController` (`Notifier<AuthState>`, access token mémoire uniquement),
> `routerProvider` (GoRouter + `ValueNotifier<AuthState>` bridge, guards loading/auth/unauth),
> `SplashScreen`, `SignInScreen`, `HomeScreen` (sign-out). Tests 38/38 — unit auth (9), session (4),
> router guard widget (5), theme (16), app widget (4). `flutter analyze` 0 issues.
> Mobile Core Flutter : **`STARTER_INITIALISE`** → **`AUTH_SHELL_READY`**.
>
> **Mise à jour Mobile Core Flutter 2 (2026-07-14)** : starter minimal livré — `pubspec.yaml` (flutter_riverpod 3.3.2,
> go_router 17.3.0, flutter_lints 6.0.0, mocktail 1.0.5), `lib/main.dart`, `lib/app.dart` (`MaterialApp.router`
> + `ProviderScope`), `lib/src/theme/` (`EnistereTokens`, `EnistereThemeExtension`, `EnistereTheme` ADR-034),
> `lib/src/app/router.dart`, `lib/src/features/home/home_screen.dart`. Tests 20/20. Analyse 0 issue.
> Mobile Core Flutter : **`SPECIFICATION_DOCUMENTAIRE`** → **`STARTER_INITIALISE`**.
>
> **Mise à jour Mobile Core Flutter 1 (2026-07-14)** : `cores/mobile-flutter/CORE_SPECIFICATION.md` + `README.md` créés.
> Mobile Core Flutter passe de **`DOSSIER_SEULEMENT`** à **`SPECIFICATION_DOCUMENTAIRE`**. Stack cible :
> go_router, Riverpod (`AsyncNotifierProvider`/`NotifierProvider`), Dio (intercepteurs Auth/Refresh/Error/Logging),
> Freezed + Json Serializable, flutter_secure_storage, Material 3 + tokens Enistere (ADR-034). 32 sections :
> modules obligatoires V1, auth, tokens, stockage, upload multipart, logger/redaction, préférences seam, i18n,
> a11y, tests, missions ordonnées Flutter 1→V1, décisions pendantes (client API Dart, Hive vs SharedPreferences,
> formulaires). Aucun code Dart, `pubspec.yaml`, dépendance ou workflow.
>
> **Mise à jour ADR-034 (2026-07-14)** : `ADR-034-flutter-ui-material3-vs-custom.md` validé.
> Décision : **Material 3 contrôlé par tokens Enistere + composants maison ciblés** pour le futur
> Mobile Core Flutter. Aucun starter Flutter, aucune dépendance, aucun runtime.
>
> **Mise à jour Mobile Core RN37 (2026-07-13)** : rapport `MOBILE_RN37_PREFERENCE_STORE_DECISION.md`.
> Décision PreferenceStore native strategy : **store natif délégué aux projets dérivés — réserve formellement acceptée**.
> Analyse des 4 options (seam/placeholder, AsyncStorage, MMKV, délégation) selon ADR-015 §15/§16 / compatibilité
> Expo Go / impact dépendance / sécurité / smoke / valeur Foundation. MMKV rejeté (JSI → brise Expo Go + smoke).
> AsyncStorage rejeté (choix arbitraire entre deux options valides). Option D retenue : seam `PreferenceStore` +
> `createPreferenceService` + gardes + placeholder + tests agnostiques = « storage service » §9.3. Pattern identique
> à tous les seams Foundation. ADR-015 délègue explicitement aux projets. **B3 fermé réserve acceptée.**
> Avant décision finale V1, `VALIDE_V1` était différé uniquement par **B2 — parité iOS** (Linux).
> Aucune dépendance, aucun changement runtime.
>
> **Mise à jour Mobile Core RN36 (2026-07-13)** : rapport `MOBILE_CORE_V1_READINESS_REVIEW.md` §B1
> mis à jour. `app/(app)/upload.tsx` ajouté (écran protégé générique, RHF+Zod, `useUploadMutation` via
> client officiel, `LoadingState`/`MessageState`/`ErrorState`, ADR-007/015 : aucun URI/token/payload serveur en
> log/cache/store). Smoke Android étendu : `POST /files` mock + fixture `enistere-smoke.txt` + vérification
> `Upload complete` + `uploadCount >= 1`. Critères §9.4 : **8/8 satisfaits** (B1 fermé). À la date RN36,
> `VALIDE_V1` restait différé par B2 et B3 ; RN37 a ensuite fermé B3 comme réserve formellement acceptée.
>
> **Mise à jour API Core VALIDE_V1 review (2026-07-12)** : le API Core NestJS passe de
> **`IMPLEMENTATION_AVANCEE`** à **`VALIDE_V1`**. Critères roadmap §8.4 et
> `CORE_SPECIFICATION.md` §41 satisfaits. Vérifications locales : lint, build, test **386/386**,
> `openapi:check` à jour, audit 0 vulnérabilité. Les e2e complets restent couverts par la CI
> `api-runtime` avec PostgreSQL + MinIO jetables.
>
> **Mise à jour Foundation V1 Baseline Readiness Review (2026-07-12)** : baseline
> `foundation-v1-baseline` déclarée **`READY_FOR_RELEASE_DECISION`** avant publication.
> Preuves : API/Web/UI Kit `VALIDE_V1`, packages API `IMPLEMENTATION_AVANCEE`, Quality Core documentaire,
> `all-safe` local validé (`NODE_ENV=test`) + audit root 0 vuln, CI L1-L4 verte sur `main`, ruleset
> `protect-main` actif.
>
> **Mise à jour Foundation V1 Release Publication (2026-07-12)** : release `foundation-v1-baseline`
> publiée. Tag annoté **`foundation-v1.0.0`**, commit `2981f2c`, billet GitHub Release publié.
>
> **Mise à jour Quality Core V2 Readiness Review (2026-07-12)** : Quality Core passe de
> **`SPECIFICATION_DOCUMENTAIRE`** à **`IMPLEMENTATION_PARTIELLE`**. Rapport :
> `QUALITY_CORE_V2_READINESS_REVIEW.md`. Critères roadmap §13.4 : 7/7 satisfaits après Quality Core 7
> sur le périmètre V2 documentaire/opérationnel courant. Le processus de release a été utilisé en réel
> pour `foundation-v1.0.0`.
>
> **Mise à jour Quality Core 7 (2026-07-12)** : prompts IA standardisés et catalogués :
> `AI_PROMPT_GOVERNANCE.md`, `prompts/README.md`, `prompts/global/mission-brief-template.md`.
> Aucun runtime, workflow ou dépendance ajouté.
>
> **Mise à jour Docs Core 1 (2026-07-12)** : démarrage du Docs Core comme
> **`SPECIFICATION_DOCUMENTAIRE`**. Livrables : `cores/docs-core/CORE_SPECIFICATION.md`,
> `cores/docs-core/README.md`, `docs/README.md` (index central strategy/ADR/project-status/runbooks/
> prompts/quality gates). Aucun runtime, workflow, dépendance, RAG ou site documentaire.
>
> **Mise à jour Docs Core 2 (2026-07-12)** : audit documentaire de navigation réalisé :
> `DOCS_CORE_NAVIGATION_AUDIT.md`. Corrections ciblées du README racine, de `DECISIONS_REGISTER.md`
> (ADR-008) et des compteurs UI Kit/Web dans `FOUNDATION_CURRENT_STATE.md`.
>
> **Mise à jour Docs Core 3 (2026-07-12)** : onboarding contributeur minimal et glossaire initial :
> `docs/onboarding/CONTRIBUTOR_ONBOARDING.md`, `docs/glossary/GLOSSARY.md`. Aucun runtime,
> workflow, dépendance, génération automatique ou RAG.
>
> **Mise à jour Docs Core 4 (2026-07-12)** : revue de liens documentaire ciblée :
> `cores/docs-core/scripts/check-doc-links.mjs` + tests `node:test` + rapport
> `DOCS_CORE_LINK_CHECK_REPORT.md`. Résultat local : `Docs Core link check passed (53 files)`.
> Docs Core passe de **`SPECIFICATION_DOCUMENTAIRE`** à **`IMPLEMENTATION_PARTIELLE`**.
>
> **Mise à jour Docs Core V2 Readiness Review (2026-07-12)** : rapport
> `DOCS_CORE_V2_READINESS_REVIEW.md`. Decision : Docs Core reste **`IMPLEMENTATION_PARTIELLE`**.
> Les criteres V2 globaux sont couverts par l'ensemble Quality+Docs, mais les criteres internes
> `IMPLEMENTATION_AVANCEE` restent bloques par l'absence de guides principaux et par l'onboarding encore minimal.
>
> **Mise à jour Docs Core 5 (2026-07-12)** : guides principaux et onboarding complet livres :
> `DOCUMENTATION_MAINTENANCE_GUIDE.md`, `CORE_STATUS_REVIEW_GUIDE.md`,
> onboarding par role et rapport `DOCS_CORE_GUIDES_ONBOARDING_REPORT.md`. Docs Core passe de
> **`IMPLEMENTATION_PARTIELLE`** à **`IMPLEMENTATION_AVANCEE`**. Aucun runtime, workflow, dependance,
> RAG ou site documentaire.
>
> **Mise à jour Docs Core 6 (2026-07-12)** : decision `DOCS_CORE_CI_GATE_DECISION.md`.
> Le link check ne devient pas un check CI obligatoire separe ; il est integre au scope local
> `quality-gates docs` (`git diff --check` + link check). Aucun workflow GitHub ni ruleset modifie.
>
> **Mise à jour Docs Core V1 Readiness Review (2026-07-12)** : rapport
> `DOCS_CORE_V1_READINESS_REVIEW.md`. Docs Core passe de **`IMPLEMENTATION_AVANCEE`** à
> **`VALIDE_V1`** : index central stable, chemins de lecture des cores actifs, distinction courant/historique,
> gates documentaires reproductibles via Quality Core.
>
> **Mise à jour Cloud Core V1 Readiness Review (2026-07-12)** : rapport
> `CLOUD_CORE_V1_READINESS_REVIEW.md`. Cloud Core passe de **`IMPLEMENTATION_PARTIELLE`** à
> **`IMPLEMENTATION_AVANCEE`**. CC10/CC11 justifient le statut avance (staging HTTPS reel, backups/restores,
> rollback, runbooks), mais `VALIDE_V1` est differe jusqu'a decision Redis/Compose V1.
>
> **Mise à jour Cloud Core 12 (2026-07-12)** : rapport
> `CLOUD_CORE_12_REDIS_COMPOSE_DECISION.md`. Redis est reporte post-V1/V2 en coherence avec API Core ;
> `docker-compose.cc10.yml` devient le compose serveur/staging V1 officiel. Cloud Core passe de
> **`IMPLEMENTATION_AVANCEE`** à **`VALIDE_V1`**.
>
> **Mise a jour Quality Core Advanced Readiness Review (2026-07-12)** : rapport
> `QUALITY_CORE_ADVANCED_READINESS_REVIEW.md`. Quality Core passe de
> **`IMPLEMENTATION_PARTIELLE`** a **`IMPLEMENTATION_AVANCEE`** : criteres roadmap §13.4 7/7,
> gates locaux, checklists, templates, prompts, ruleset actif, release Foundation appliquee et Docs Core
> connecte au scope `quality-gates docs`. `VALIDE_V1` reste differe par les automatisations avancees.
>
> **Mise a jour Quality Core release helper (2026-07-12)** : rapport
> `QUALITY_CORE_RELEASE_HELPER_REPORT.md`. Ajout de `scripts/release-helper.mjs` et tests :
> helper stdout-only pour brouillon de notes de release depuis les commits Git. Aucun tag, GitHub Release,
> workflow, dependance, runtime ou ecriture de fichier.
>
> **Mise a jour Quality Core coverage/reporting baseline (2026-07-12)** : rapport
> `QUALITY_CORE_COVERAGE_REPORTING_BASELINE.md`. Ajout de `scripts/quality-report.mjs` et tests :
> synthese stdout-only des gates de tests et de la disponibilite coverage locale. Coverage locale disponible
> pour Web et API ; aucun pourcentage global calcule.
>
> **Mise à jour Quality Core 4 (2026-07-11)** : templates GitHub modernisés. `.github/PULL_REQUEST_TEMPLATE.md` : sections Quality Gates (scope / commandes exécutées / gates exclus), Hors périmètre confirmé, Sécurité renforcée, Statut / gouvernance (si project-status modifié). `.github/ISSUE_TEMPLATE/` : `bug_report.md` (environnement, reproduction, impact sécurité, gate concerné), `feature_request.md` (core ciblé, roadmap, hors périmètre, critères), `security_issue.md` (canal privé si sensible, classification impact, scopes sensibles). `.github/ISSUE_TEMPLATE/config.yml` : lien Security Advisories. `cores/quality-core/CORE_SPECIFICATION.md` et `README.md` mis à jour. Aucun workflow modifié, aucune dépendance, aucun changement runtime.
>
> **Mise à jour Quality Core 3 (2026-07-11)** : `BRANCH_PROTECTION_RUNBOOK.md` ajouté dans `cores/quality-core/`. Procédure d'activation manuelle de la protection de branche `main` : 10 noms de checks exacts (8 requis immédiats + 2 recommandés phase 2), options recommandées (PR obligatoire, checks requis, branches à jour, admins inclus différé), checklist post-activation. `.github/workflows/README.md` mis à jour avec le tableau complet. **Protection branche `main` : documentée, non appliquée** — action humaine requise. Aucun workflow modifié, aucune dépendance, aucun changement runtime.
>
> **Mise à jour Quality Core 2 (2026-07-11)** : `scripts/quality-gates.mjs` ajouté (Node 24, sans dépendance) — `list` / `plan <scope>` / `run <scope>` ; 7 scopes (`docs`/`packages`/`ui-kit`/`web`/`root-audit`/`mobile-static`/`all-safe`) ; arrêt au premier échec, code de sortie propagé. Tests : `scripts/quality-gates.test.mjs` (**36/36 tests node:test**, vérification des plans sans exécution). Statut : **SPECIFICATION_DOCUMENTAIRE** (inchangé). Aucun workflow modifié, aucune dépendance, aucun changement runtime.
>
> **Mise à jour Quality Core 1 (2026-07-11)** : Quality Core passe de **`DOSSIER_SEULEMENT`** à **`SPECIFICATION_DOCUMENTAIRE`**. `CORE_SPECIFICATION.md` + `README.md` + `QUALITY_GATES_MATRIX.md` créés dans `cores/quality-core/`. Checklists PR/release/revue créées dans `docs/checklists/`. Aucun workflow modifié, aucune dépendance, aucun changement runtime.
>
> **Mise à jour UI Kit VALIDE_V1 review (2026-07-11)** : Le UI Kit passe de **`IMPLEMENTATION_AVANCEE`** à **`VALIDE_V1`** après revue officielle (rapport `UI_KIT_V1_READINESS_REVIEW.md` §8). Critères §12.4 **4/4** + §59 **9/9**. Justification : tokens ADR-008 ✅, 19 primitives Web testées et documentées, consommation Web Core VALIDE_V1 prouvée, cohérence mobile/web prouvée par RN35 (tokens verbatim + 13 tests). Réserves non bloquantes documentées (§10) : Storybook différé, composants avancés V2/VF, composants RN dans Mobile Core (ADR-010 intentionnel). Vérifications : typecheck ✅ lint ✅ 181/181 ✅ build ✅ tokens:check ✅ audit 0 vuln ✅ diff --check ✅.
>
> **Mise à jour Mobile RN35 (2026-07-11)** : Mobile Core React Native passe à **`STARTER_UI_KIT_ALIGNED`**. Tokens hex/typographie/radius alignés verbatim UI Kit. Aliases `LoadingView`/`EmptyView`/`ErrorView`. 13 tests token-alignment + 367/367 total. Gap bloquant UI Kit V1 fermé : §12.4 **4/4**, §59 **9/9**.
>
> **Mise à jour UI Kit V1 Readiness Review (2026-07-11)** : Le UI Kit passe de **`IMPLEMENTATION_PARTIELLE`** à **`IMPLEMENTATION_AVANCEE`** après revue officielle. Score initial : **3/4 critères §12.4** + **8/9 critères §59** ; gap bloquant VALIDE_V1 = composants React Native de base (différés ADR-010). Fermé par RN35 : scores finaux **4/4 §12.4** + **9/9 §59**.

> **Mise à jour ADR-035 (2026-07-15)** : `docs/adr/ADR-035-angular-ui-material-vs-primeng.md` validé.
> Décision : **Angular Material (CDK + Material 3) contrôlé par tokens Enistere + composants maison ciblés**
> pour le futur Web Core Angular. Angular CDK = couche comportementale/a11y ; tokens Enistere pilotent
> l'identité via `mat.define-theme()` + CSS custom properties `--mat-*` ; composants maison Enistere Angular
> ciblés (LoadingState/EmptyState/ErrorState/SuccessState) ; Reactive Forms obligatoire ;
> `@angular/cdk/testing` pour les tests composants ; pas de PrimeNG ni shadcn/Radix côté Angular ;
> ADR-016 §F (adaptateur OpenAPI Angular) décidé par preuve dans Web Core Angular.
> Aucun starter Angular, aucune dépendance npm, aucun runtime.
> `web-angular` reste **`DOSSIER_SEULEMENT`** ; prochaine action : Web Core Angular 1 — Core specification.
>
> **Mise à jour Web Core Angular 1 — Core specification (2026-07-15)** : `cores/web-angular/CORE_SPECIFICATION.md`
> (32 §) + `cores/web-angular/README.md` créés. Spécification complète : architecture Angular standalone feature-first,
> Reactive Forms obligatoires, Angular Material CDK + M3 + tokens Enistere (ADR-035), HttpClient + intercepteurs
> (Auth/Refresh/Error/Log), Angular Signals (état local), RxJS services (server state), `@angular/cdk/a11y`
> (FocusTrap/LiveAnnouncer/FocusMonitor/ListKeyManager), composants maison Enistere Angular
> (Loading/Empty/Error/SuccessState), `PermissionService` + `PermissionDirective` RBAC, 15 critères §29 V1,
> missions ordonnées Angular 1→V1 (9 missions), 13 décisions pendantes §32.
> `web-angular` : **`DOSSIER_SEULEMENT` → `SPECIFICATION_DOCUMENTAIRE`**.
> `quality-gates docs` 2/2 ✅ · `git diff --check` ✅. Prochaine action : Web Core Angular 3 — Auth flow + routing protégé.
>
> **Mise à jour Web Core Angular 2 — Starter minimal Angular (2026-07-15)** : 22 fichiers créés dans `cores/web-angular/` —
> `package.json` (@angular/core 22.0.6, @angular/material/cdk 22.0.4, typescript 6.0.3, @angular/cli 22.0.7 +
> @angular/build 22.0.7 ; override `vite` 7.3.6 pour audit 0 ; `engines.node: >=24.15.0 || >=22.22.3` documente la cible prod),
> `angular.json` (builder `@angular/build:application`, esbuild, karma test runner),
> `tsconfig.json` (strict + `strictTemplates` + ES2022 + `useDefineForClassFields: false` + `moduleResolution: bundler`),
> `karma.conf.js` (ChromeHeadlessNoSandbox — `--no-sandbox --disable-gpu --disable-dev-shm-usage`),
> `src/main.ts` (`bootstrapApplication(AppComponent, appConfig)`),
> `src/styles.scss` (thème Material 3 : `mat.define-theme()` + `mat.$azure-palette`, `@include mat.all-component-themes()`,
> tokens Enistere `--enistere-*` → `--mat-sys-*`, dark mode `[data-theme='dark']`, `mat.$cyan-palette` tertiaire),
> `src/app/app.config.ts` (`provideRouter(routes, withComponentInputBinding())`, `provideHttpClient(withFetch())`, `provideAnimationsAsync()`),
> `src/app/app.routes.ts` (lazy `HomeComponent`, wildcard `redirectTo: ''`), `src/app/app.component.ts` (standalone, `RouterOutlet`),
> `src/app/pages/home/home.component.ts` (page shell publique, `.status-value = 'STARTER_INITIALISE'`).
> Tests : **8/8 ✅** via `architect web-angular:test` (ChromeHeadless 150.0.0.0 : 3 AppComponent + 5 HomeComponent).
> Build : `architect web-angular:build` SUCCESS (340 KB initial, zéro erreur TypeScript strict).
> Contrainte Node : Angular CLI 22.x requiert `^22.22.3 || ^24.15.0` ; environnement = Node 24.14.0 → build/tests via `./node_modules/.bin/architect`.
> `web-angular` : **`SPECIFICATION_DOCUMENTAIRE` → `STARTER_INITIALISE`**.
> `quality-gates docs` 2/2 ✅ · `git diff --check` ✅. Prochaine action : Web Core Angular 3 — Auth flow + routing protégé.
>
> **Mise à jour Web Core Angular 3 — Auth flow + routing protégé (2026-07-16)** :
> `AuthService` signal-based avec access token mémoire privé et signal public read-only, `AuthState`
> loading/authenticated/unauthenticated/refreshing/expired, guards fonctionnels `authGuard`/`guestGuard`,
> `sanitizeReturnUrl` anti open-redirect, `AuthInterceptor` Bearer mémoire, routes `/login` et `/dashboard`
> protégée, pages login/dashboard shells accessibles. Tests Angular : **76/76** ✅ après correction
> read-only. `web-angular` : **`STARTER_INITIALISE` → `AUTH_ROUTING_READY`**.
>
> **Mise à jour Web Core Angular 4 — Client HTTP + server-state RxJS (2026-07-16)** :
> `APP_BASE_URL = new InjectionToken<string>('APP_BASE_URL')` + `ApiConfig` interface (timeout documenté différé) ;
> `AppApiError` (`code: ApiErrorCode` union 12 valeurs, `statusCode: number | null`, `requestId: string | null`) +
> `mapHttpError()` (400→'BadRequest', 401→'Unauthorized', 403→'Forbidden', 404→'NotFound', 409→'Conflict',
> 413→'FileTooLarge', 415→'UnsupportedType', 422→'ValidationError', 429→'RateLimited', 5xx→'ServerError',
> status 0→'NetworkError', x-request-id extrait, corps jamais exposé) + `isAppApiError()` type-guard ;
> `errorInterceptor` : `HttpErrorResponse` → `AppApiError`, 401 surfacé sans refresh automatique ;
> `logInterceptor` : `sanitizePath()` (pathname seul, jamais query params/URL signée), logs
> `method + path + status + duration` UNIQUEMENT — jamais body/Authorization/query params sensibles ;
> `RequestState<T>` factories `idleState`/`loadingState`/`successState`/`errorState` + `createRequestState<T>(source$)`
> (startWith loading → map success → catchError AppApiError) ;
> `app.config.ts` mis à jour : `withInterceptors([authInterceptor, logInterceptor, errorInterceptor])` +
> `{ provide: APP_BASE_URL, useValue: '' }`.
> Tests : `api-config.spec.ts` (2), `app-api-error.spec.ts` (17), `error.interceptor.spec.ts` (6),
> `log.interceptor.spec.ts` (7, dont vérification absence Authorization/body/query params), `request-state.spec.ts` (9).
> `web-angular` : **`AUTH_ROUTING_READY` → `HTTP_SERVER_STATE_READY`**.
>
> **Mise à jour Web Core Angular 5 — Reactive Forms + Angular Material (2026-07-16)** :
> `form-error.utils.ts` (`getFieldError()` pur — required/email/minlength/maxlength/pattern) ;
> `login.component.ts` (`MatFormFieldModule` + `MatInputModule` + `MatButtonModule` + `getFieldError` protégé) ;
> `login.component.html` (`mat-form-field` outline + `matInput` + `mat-label` + `mat-error` via `@if (getFieldError(); as err)` + `button mat-flat-button`) ;
> `login.component.scss` (styles custom input supprimés, `.login-field` + `.login-submit` overrides) ;
> `home.component.html` badge `FORMS_MATERIAL_READY`. Tests : **136/136 ✅**.
> `web-angular` : **`HTTP_SERVER_STATE_READY` → `FORMS_MATERIAL_READY`**. Prochaine action :
> Web Core Angular 6 — Composants Foundation Enistere.
>
| Élément | Dossier | Spéc. | ADR | Starter | Code | Tests | Revue | Statut officiel | Dernière preuve | Prochaine condition |
|---|---|---|---|---|---|---|---|---|---|---|
| API Core NestJS | ✓ | ✓ | ✓ (002,003,004,006,007,016,039,040…) | ✓ | ✓ | ✓ (**386 u** + e2e CI runtime) | ✓ (`API_CORE_V1_READINESS_REVIEW.md` + rapports permanents) | **VALIDE_V1** | lint/build/test 386/386/openapi:check/audit 0 vuln + CI runtime | — (V1 déclaré) |
| `@enistere/api-contracts` | ✓ | n/a | ✓ (016) | ✓ | ✓ | ✓ (12) | ✓ (proof) | **IMPLEMENTATION_AVANCEE** (local) | build + generate:check | publication (non requise V1) |
| `@enistere/api-client-fetch` | ✓ | n/a | ✓ (011,012,016) | ✓ | ✓ | ✓ (30 + live 16/16) | ✓ (proof) | **IMPLEMENTATION_AVANCEE** (local) | live 16/16 ; **instancié (public + authentifié/BFF Auth + façade Files lecture) dans le Web Core** | publication (non requise V1) |
| Cloud Core | ✓ | ✓ | ✓ (013,014,007…) | — | **cadrage (CC1) + CI runtime API (CC2) + CI E2E navigateur (CC3) + registry GHCR (CC5/CC8) + staging HTTPS réel (CC10) + durcissement opérationnel (CC11) + decision Redis/Compose (CC12)** : `api-runtime-ci.yml` (PG+MinIO, migrations, unit+e2e, openapi:check) **+ `web-e2e-ci.yml`** (stack réelle + Playwright/Chromium : Health/Auth/Files) **+ `registry-ci.yml`** (`api-smoke`, images GHCR immuables) **+ `docker-compose.cc10.yml`** (compose serveur/staging V1 officiel, reverse proxy compatible Traefik + Let's Encrypt, `sha-5bf4c0f`) **+ CC11** : `backup-postgres.sh` + `backup-minio.sh` + `rotate-smoke-account.sh` + `CC11_OPERATIONAL_RUNBOOK.md` + `CC11_STAGING_OPERATIONAL_REPORT.md` | **e2e API + E2E navigateur en CI** (niveaux 2–3) + **staging CC10/CC11 versionné** | ✓ (`CLOUD_CORE_V1_READINESS_REVIEW.md`, `CLOUD_CORE_12_REDIS_COMPOSE_DECISION.md`) | **VALIDE_V1** | **quatre workflows CI** niveaux 1–4 partiel (`ci`/`api-runtime`/`web-e2e`/**`registry`**) + **CC10 STAGING RÉEL HTTPS** : 4 conteneurs `healthy`, auth BFF + upload + URL signée + téléchargement bout-en-bout validés ; **CC11 SOCLE OPÉRATIONNEL VÉRIFIÉ** : health HTTPS/TLS, backup PG+restore, backup MinIO+restore, rollback/roll-forward, rotation smoke ; **CC12** : Redis reporté V2, CC10 compose V1 officiel | — (V1 déclaré) |
| Web Core Next.js | ✓ | ✓ | ✓ (004,005,006,007,009,011,012,016…) | **✓** | **✓ (App Router + UI Kit + API publique Health + TanStack Query + BFF Auth + me/authorization + session state + layout protégé serveur read-only Option C + hydratation + page /protected + page de connexion /login + états UI Web UI 1 + Files 1 lecture/téléchargement + Files 2 upload multipart BFF + Files 3 suppression BFF : assertDelete, DELETE /api/files/:id, UUID 400 avant appel API, CSRF/Origin 403 avant appel API, client `writable`, 409→NOT_DELETABLE, anti-énumération 404, deleteFile BFF client, useDeleteFile mutation+anti-double+removeQueries, Dialog confirmation UI Kit 4, onDeleteSuccess prop, FileDetailsWithNav + Files 4 liste BFF : GET /api/files, validation limit/offset 400 avant appel API, client read-only, FileListResponse, listFiles BFF client, fileKeys.list stable, useFileList retry:false, FileListView états loading/vide/erreur/liste pagination + Files 6 revue V1 : D1 cache delete→list, D2 cache upload→list, D3 message 409 neutre, D4 upload 409→QUOTA_EXCEEDED ; rapport WEB_FILES_V1_REVIEW.md ; verdict stable avec réserves mineures + Files 7 admin BFF : handlers quarantaine/restauration, routes /api/files/[id]/quarantine+/restore, client BFF quarantineFile/restoreFile, hooks useQuarantineFile/useRestoreFile mutation+anti-double+fileKeys.all, AdminFileActions UI admin séparée, page /protected/files/[id]/admin — CSRF+Origin, API autorité, jamais Bearer navigateur + V1 Gap 1 : layout public `(public)/`, landing page statique `/`, robots.ts, sitemap.ts + V1 Gap 2 : DashboardShell Server Component, (protected)/layout.tsx + V1 Gap 3 : upload-form-schema.ts (Zod v4), upload-form.tsx (RHF useForm+zodResolver), react-hook-form@^7.81.0/zod@^4.4.3/@hookform/resolvers@^5.4.0 ; 14/14 critères §56 — VALIDE_V1)** | **✓ (450 tests, a11y + sonde HTTP + preuve API réelle Auth/session + protégé 26/26 + login 22/22 + Files API+MinIO 21/21 + revue V1 runtime 49/49 + 15 tests E2E)** | **✓ (gouvernance + revue Auth V1 `WEB_AUTH_V1_REVIEW.md` + revue incrément V1 `WEB_CORE_V1_INCREMENT_REVIEW.md` → `WEB_CORE_V1_INCREMENT_STABLE_WITH_RESERVATIONS` + revue Files V1 `WEB_FILES_V1_REVIEW.md` → stable avec réserves mineures + `WEB_CORE_V1_READINESS_REVIEW.md` → VALIDE_V1 14/14)** | **VALIDE_V1** | build/lint/typecheck/**450 tests** verts + preuves API réelles (Auth/session ; protégé ; login ; runtime V1 33/33 ; **Files API+MinIO 21/21** ; **revue incrément V1 49/49** incl. URL expirée + pannes) | — (V1 déclaré) |
| Mobile Core React Native | ✓ | ✓ | ✓ (003,004,008,010,011,012,015,016…) | **✓ (Expo SDK 55 + Expo Router)** | **✓ (RN 1→37)** : primitives RN 1→25 ; Settings RN26 ; shell RN27 ; smoke Android RN28/RN29 ; iOS RN30 bloqué Linux ; RN31 en attente macOS/Xcode ; sign-in RN32 ; thème RN33 ; patch Expo SDK RN34 ; RN35 tokens alignés UI Kit + aliases `*View` ; **RN36 upload runtime starter proof** (écran protégé `upload.tsx` + smoke Android `POST /files`) ; **RN37 PreferenceStore native strategy decision** (store natif délégué aux projets dérivés, B3 fermé comme réserve formellement acceptée). Aucun réseau métier, endpoint métier, SDK/adaptateur natif réel, retry branché, persistance nouvelle ni changement AuthEngine/`withAuthRetry`/`authedRequest`/QueryClient/mutations. | **✓ (55 fichiers `node --test` / 367 cas + `expo export -p ios` + smoke Android Emulator + smoke iOS blocked documenté)** | **✓ (`MOBILE_CORE_V1_FINAL_READINESS_DECISION.md` : VALIDE_V1 ; B2 iOS accepté comme réserve environnementale documentée)** | **VALIDE_V1** | typecheck + lint + **test 55 fichiers / 367 cas** + **expo-doctor 19/19** + **expo export -p ios** + **smoke Android Emulator `emulator-5554` passed** + **`npm run smoke:ios` blocked** (`detectedPlatform: linux`) verts/documentés (local) | — (V1 déclaré ; RN31 quand environnement Apple disponible) |
| UI Kit (`@enistere/ui-kit`) | ✓ | ✓ | ✓ (008,009,010) | **✓** | **✓ (tokens + 19 primitives Web : Button/Input/Label/Text/Spinner/VisuallyHidden + Alert/Card/FormField + Dialog/Select/Toast + Badge/Divider/Skeleton + LoadingState/EmptyState/ErrorState/SuccessState)** | **✓ (181, a11y/jest-axe, React 19)** | **✓ (UI Kit VALIDE_V1 review 2026-07-11 : §12.4 4/4 + §59 9/9 ; rapport `UI_KIT_V1_READINESS_REVIEW.md` §8 ; réserves non bloquantes §10)** | **VALIDE_V1** | typecheck ✅ lint ✅ **181/181** ✅ build ✅ tokens:check ✅ audit 0 vuln ✅ diff --check ✅ + **réellement consommé Web Core VALIDE_V1** + **cohérence mobile/web prouvée RN35** | — (V1 déclaré) |
| AI Core | ✓ (vide) | — | — | — | — | — | — | **DOSSIER_SEULEMENT** | — | spécification |
| API Core Spring Boot | ✓ | ✓ (42 §) | ADR-041 (Maven, Validé) | ✓ (SB 2 : Spring Boot 4.1.0 + JJWT 0.12.6 + Spring Security 7.x STATELESS + JWT filter + auth stub shell) | ✓ (SB 3 : User/Role/Permission/RefreshToken JPA, migration Flyway V1, Argon2id, AuthService, refresh rotation SHA-256, RBAC `@PreAuthorize`, AdminController) | ✓ (43 tests : JwtTokenProviderTest 9 + FlywayMigrationTest 4 + AuthControllerTest 10 + AuthIntegrationTest 14 + RbacIntegrationTest 5 + contextLoads 1 — Testcontainers singleton) | — (rapport V1 non réalisé) | **IMPLEMENTATION_PARTIELLE** (sous-statut `PERSISTENCE_RBAC_READY`, 2026-07-15) | `./mvnw verify` 43/43 ✅ BUILD SUCCESS ; `git diff --check` ✅ | Spring Boot 4 (OpenAPI + MinIO) puis Spring Boot V1 readiness review |
| Docs Core | ✓ | ✓ | — | — | ✓ (script link check + guides + `quality-gates docs`) | ✓ (`check-doc-links.test.mjs`, `quality-gates.test.mjs`) | ✓ (`DOCS_CORE_NAVIGATION_AUDIT.md`, `DOCS_CORE_LINK_CHECK_REPORT.md`, `DOCS_CORE_V2_READINESS_REVIEW.md`, `DOCS_CORE_GUIDES_ONBOARDING_REPORT.md`, `DOCS_CORE_CI_GATE_DECISION.md`, `DOCS_CORE_V1_READINESS_REVIEW.md`) | **VALIDE_V1** | documentation centrale stable, chemins de lecture des cores actifs, gates docs reproductibles | — (V1 déclaré) |
| Mobile Core Flutter | ✓ | ✓ (spec 32 §) | ADR-034 (Validé, appliqué V1) | ✓ (starter Flutter 2) | ✓ (auth shell Flutter 3 + Dio client Flutter 4 + upload primitives Flutter 5 + SecureStorage Flutter 8 + RefreshInterceptor Flutter 9 + UI states Flutter 10 + sign-in form Flutter 11) | ✓ (218 tests : theme + unit/auth + unit/secure_session_store + widget × 3 + widget/sign_in_screen (10) + widget/states + unit/api × 5 + unit/upload + intégration × 7) | ✓ (`MOBILE_FLUTTER_V1_READINESS_REVIEW.md` — 9/11 §29, B1→B5 fermés, réserves R1→R5 ; `MOBILE_FLUTTER7_ANDROID_SMOKE_REPORT.md` — B1 ; `MOBILE_FLUTTER8_ANDROID_SMOKE_REPORT.md` — B2 ; `MOBILE_FLUTTER9_ANDROID_SMOKE_REPORT.md` — B3 ; `MOBILE_FLUTTER10_ANDROID_SMOKE_REPORT.md` — B4 ; `MOBILE_FLUTTER11_ANDROID_SMOKE_REPORT.md` — B5 ; `MOBILE_FLUTTER_V1_FINAL_READINESS_DECISION.md` — promotion V1) | **VALIDE_V1** | Flutter V1 Final Readiness Decision (2026-07-14) : B1→B5 fermés, score §29 9/11 + 2 PARTIAL iOS R1 ; 218/218 tests headless ; smoke `emulator-5554` 7/7 ✅ ; R1 iOS Linux acceptée comme réserve environnementale non bloquante, sans succès iOS artificiel | — (V1 déclaré ; smoke iOS uniquement quand macOS/Xcode ou device iOS réel disponible) |
| Quality Core | ✓ | ✓ | — | — | ✓ (scripts `quality-gates` + `release-helper` + `quality-report` testés ; release process utilisé) | ✓ (`QUALITY_CORE_V2_READINESS_REVIEW.md` + `QUALITY_CORE_ADVANCED_READINESS_REVIEW.md` + `QUALITY_CORE_RELEASE_HELPER_REPORT.md` + `QUALITY_CORE_COVERAGE_REPORTING_BASELINE.md` + `QUALITY_CORE_REQUIRED_CHECKS_ALIGNMENT.md` + `QUALITY_CORE_COVERAGE_STANDARDIZATION_DECISION.md` + `QUALITY_CORE_V1_READINESS_REVIEW.md`) | ✓ | **VALIDE_V1** | `CORE_SPECIFICATION.md` + `QUALITY_GATES_MATRIX.md` + `BRANCH_PROTECTION_RUNBOOK.md` + `RELEASE_PROCESS_RUNBOOK.md` + `AI_PROMPT_GOVERNANCE.md` + 3 checklists + `scripts/quality-gates.mjs` + `scripts/release-helper.mjs` + `scripts/quality-report.mjs` + templates GitHub + prompts catalogués + release `foundation-v1.0.0` gouvernée + Docs Core connecté au gate docs + décision checks `images` + coverage UI Kit/Web/API reconnue | — (V1 déclaré) |
| Web Core Angular | ✓ | **✓ (`CORE_SPECIFICATION.md` 32 §, `README.md` — Angular 1, 2026-07-15)** | **ADR-035 (Validé, 2026-07-15)** | **✓ (Angular 2 starter + Angular 3 auth/routing + Angular 4 HTTP/server-state + Angular 5 `mat-form-field`+`matInput`+`mat-error`+`getFieldError()`+`mat-flat-button`)** | **✓ (Angular 3→5 — HTTP générique, intercepteurs typés, server-state RxJS, Angular Material form fields, utilitaire pur validation)** | **✓ (136/136 ; Angular 3+4 + `form-error.utils.spec.ts` × 9 + login Material × 4 nouveaux tests + home badge)** | — | **FORMS_MATERIAL_READY** | `architect web-angular:build` SUCCESS · `architect web-angular:test` 136/136 ✅ · `npm audit` 0 vuln | Web Core Angular 6 — Composants Foundation Enistere |

### 1.1 Foundation baseline

| Élément | Statut | Dernière preuve | Prochaine condition |
|---|---|---|---|
| Foundation V1 baseline | **FOUNDATION_V1_RELEASED** | `FOUNDATION_V1_BASELINE_READINESS_REVIEW.md` ; `FOUNDATION_V1_RELEASE_NOTES.md` ; tag `foundation-v1.0.0` ; GitHub Release publiée | — |
| Foundation V1 release notes | **FOUNDATION_V1_RELEASED** | `FOUNDATION_V1_RELEASE_NOTES.md` ; release <https://github.com/mike-zks/enistere-os-foundation/releases/tag/foundation-v1.0.0> | — |

## 2. Infrastructure transverse

| Élément | Spéc/ADR | Implémenté | Tests | Statut | Prochaine condition |
|---|---|---|---|---|---|
| CI/CD | ADR-013 Validé | **CI niveaux 1–3 + niveau 4 partiel** : `ci.yml` (non-régression monorepo) + `api-runtime-ci.yml` (runtime API : PG+MinIO, migrations, unit+e2e, openapi:check) + `web-e2e-ci.yml` (E2E navigateur : stack réelle + Playwright, Health/Auth/Files) + **`registry-ci.yml`** (niveau 4 partiel : build + push GHCR, `api-smoke`, sans déploiement) + **Ruleset GitHub `protect-main` actif** (PR obligatoire, strict status checks, 8 checks requis ; `images (...)` recommandés pour activation humaine) | — (baseline locale + **simulations** : runtime API + **E2E 15 tests verts** (Health→`/status`/Auth + **nav dashboard** +1/Files lecture + liste + upload + suppression)) | **PARTIELLEMENT_IMPLEMENTE** | action humaine éventuelle : rendre les 2 checks `images` requis ; couverture publiée, release, déploiement, environnements |
| Registry images | ADR-014 Validé | **`registry-ci.yml`** + Dockerfiles API/Web (build + **smoke-run image API `api-smoke`** CC8, gate du push) + push GHCR sur `main`, tags immuables, non-root, sans secret/PAT | ✓ build + **smoke runtime image** (moteur Prisma chargé) | **PARTIELLEMENT_IMPLEMENTE** | déploiement, scan/signature d'image, semver/release ; rendre `api-smoke` requis |
| Conteneurisation (Docker) | ADR-014 | **Dockerfiles API/Web** (multi-stage, non-root ; Web standalone) + `.dockerignore` ; **compose staging exemple** (CC6) ; **fix moteur Prisma 3.0.x** (CC8 : `binaryTargets` + `openssl` au build) | ✓ build/config ; ✅ **CC8 re-validé : image API `healthy`** (moteur 3.0.x), image Web `healthy` | **PARTIELLEMENT_IMPLEMENTE** | compose de prod, Traefik ; rebuild GHCR image API (CI au merge) |
| Déploiement staging | ADR-013 | runbooks + compose/`.env` exemples (CC6) + dry-run (CC7) + image API corrigée (CC8) + **exécution LOCALE** (CC9 : stack `healthy`) + **CC10 STAGING RÉEL HTTPS VALIDÉ** (`docker-compose.cc10.yml` : reverse proxy compatible Traefik, Let's Encrypt HTTP-01, `sha-5bf4c0f`, 4 conteneurs `healthy` ; HTTPS valide ; auth BFF + upload + URL signée + téléchargement 200) + **CC11 SOCLE OPÉRATIONNEL** : 3 scripts versionnés (backup PG/MinIO, rotation smoke), runbook + rapport | ✅ **bout-en-bout validé sur serveur staging Enistere** + **socle opérationnel CC11 : health, backup, restore, rollback, rotation smoke** | **STAGING_OPERATIONNEL_VERIFIE** | environnements protégés, monitoring continu, rollback automatisé, scan/signature image |
| Observabilité (métriques/traces) | ADR-018/036 à rédiger | — | — | **NON_COMMENCE** | Cloud Core |
| Git (commits/branches) | ADR-001 Validé | **historique Git actif** ; `main` aligné sur `origin/main` ; protection via ruleset `protect-main` active | — | **PARTIELLEMENT_IMPLEMENTE** | maintenir le flux PR et les checks requis |

## 3. Matrice détaillée — API Core NestJS

| Domaine | Documenté | Implémenté | Testé | Revu | Version cible | Reste à faire |
|---|---|---|---|---|---|---|
| Socle NestJS / bootstrap | ✓ | ✓ | ✓ | ✓ | V1 | — |
| Configuration + validation env | ✓ | ✓ | ✓ | ✓ | V1 | — |
| Database Prisma/PostgreSQL | ✓ | ✓ | ✓ | ✓ | V1 | — |
| Health (live/ready) | ✓ | ✓ | ✓ | ✓ | V1 | — |
| Auth (login, JWT, sessions, refresh) | ✓ | ✓ | ✓ | ✓ | V1 | — |
| Users | ✓ | ✓ | ✓ | ✓ | V1 | register public (dérivé) |
| Roles + Permissions (RBAC) | ✓ | ✓ | ✓ | ✓ | V1 | admin RBAC (V2) |
| Audit | ✓ | ✓ | ✓ | ✓ | V1 | — |
| Files + Storage S3/MinIO | ✓ | ✓ | ✓ | ✓ | V1 | antivirus/média/présigné (V2) |
| Logging structuré (Pino) | ✓ | ✓ | ✓ | ✓ | V1 | collecte Loki (Cloud) |
| OpenAPI canonique + check | ✓ | ✓ | ✓ | ✓ | V1 | — |
| Client contracts (package) | ✓ | ✓ | ✓ | ✓ | V1 | publication |
| Client fetch (package) | ✓ | ✓ | ✓ | ✓ | V1 | intégration cores |
| CI/CD | ✓ (ADR-013) | **CI runtime API** (`api-runtime-ci.yml` : PG+MinIO, migrations, unit+e2e, openapi:check) | ✓ (niveau 2) | — | V1 | déploiement (niveau 4) |
| Redis (cache distribué) | ✓ | — | — | — | V2 | multi-instance |
| Queues/jobs (BullMQ) | ✓ | — | — | — | V2 | Redis |
| Mail / Notifications | ✓ | — | — | — | V2/V3 | infra |
| Observabilité (métriques/traces) | ✓ | — | — | — | V2 | Cloud Core |

Légende domaines : voir aussi la matrice native `cores/api-nestjs/docs/API_CORE_V1_IMPLEMENTATION_STATUS.md`
(référence détaillée maintenue dans le core). Ce tableau en est la synthèse de pilotage.

## 4. Contradictions détectées (documentées, NON corrigées)

| ID | Source A | Source B | État réel | Impact | Action recommandée | Priorité |
|---|---|---|---|---|---|---|
| C1 | Travail substantiel présent | `git log` / remote | **Résolu** : historique Git actif ; `main` et `origin/main` alignés (`574cdcf`, merge RN 3) | Traçabilité locale et distante OK | Maintenir le flux PR ; aucun push direct `main` | RÉSOLU |
| C2 | Packages dits « officiels » | Import dans les cores | **Intégré (public + authentifié + Files lecture)** : UI Kit **consommé** + `api-contracts`/`api-client-fetch` **instanciés** par le Web Core pour Health, le BFF Auth (login/refresh/logout/me/authorization) **et la façade Files** (métadonnées + URL signée, types `PublicStoredFileDto`/`SignedDownloadResponseDto` via `SchemaOf<>`), preuve API + MinIO réelle. Reste : publication (non requise V1) | Lecture « intégré » vraie pour public, authentifié **et Files** | — (publication différée) | RÉSOLU |
| C3 | ADR-005/012/013/014/015 Validés | Code correspondant partiel | ADR-008 **implémenté et revu** (tokens + 19 primitives UI Kit + consommation Web + alignement mobile RN35) ; ADR-009 **partiel** (web : Tailwind/Radix absents par décision) ; **ADR-010 appliqué côté mobile** (ThemeProvider + composants maison, pas de NativeWind) ; **ADR-011/012 appliqués** (web + mobile : fetch + TanStack Query) ; **ADR-015 implémenté** (mobile secure storage : access token mémoire, refresh token SecureStore) ; **ADR-003 mobile** (RN 3 : Zod UX via RHF, backend autoritatif) ; ADR-005/013/014 décidés, partiels | Lecture « fait » erronée pour les ADR encore partiels | Implémenter au fil des cores | IMPORTANTE |
| C4 | `strategy/` Phase 0 (« avant code ») | API Core implémenté | Phase 0 partiellement dépassée | Contexte trompeur | Lire strategy comme historique | MINEURE |
| C5 | `OPENAPI_CLIENT_PROOF.md` cite `proofs/openapi-client/*` | Code de preuve retiré | Pointeur seul | Liens internes partiellement périmés | Bannière de migration déjà ajoutée | MINEURE |
| C6 | `cores/{cloud,mobile-react-native}` ont une spéc | Starter | `cloud` = **VALIDE_V1** ; **`mobile-react-native` `VALIDE_V1`** (Expo SDK 55, primitives RN 1→37, Settings, runtime Android, upload runtime prouvé RN36, B3 PreferenceStore formellement accepté RN37, iOS bloqué par Linux sans `xcrun` accepté comme réserve environnementale, formulaire, thème, doctor 19/19, alignement UI Kit) | Confusion spéc↔implémentation | Statut explicite (cette matrice) ; RN31 reste souhaitable dès environnement Apple disponible | RÉSOLU |
| C7 | Docs Web « starter sans auth » (`README`/`SECURITY.md`/`ARCHITECTURE.md` ; commentaires `cookie-config`/`query-client`) | BFF Auth + session implémentés | **Résolu** (revue de gouvernance 2026-06-10) : corrections factuelles appliquées + export mort `CSRF_HEADER_NAME` supprimé | Lecture « sans auth » erronée | — | RÉSOLU |
| C8 | `next build` (phase TS) du Web Core | `packages/*/dist` **non versionnés** (gitignore `dist/`) | **Atténué** : la **CI minimale** (`.github/workflows/ci.yml`) impose l'ordre topologique (`api-contracts → api-client-fetch → ui-kit → web-nextjs`) ; chaque job aval rebuild ses dépendances (validé par simulation runner neuf, dist effacés) | Risque résiduel = clone **local** sans CI | **Atténué (CI)** ; documenter l'ordre `npm run build` racine pour le dev local | RÉSOLU (CI) / MINEURE (local) |

## 5. Dette documentaire

| Élément | Classe |
|---|---|
| Ordre de build monorepo (`packages/*/dist` non versionnés) — **désormais imposé par la CI minimale** (`.github/workflows/ci.yml`) ; reste à documenter pour le dev local | MINEURE (CI en place) |
| **CI minimale présente** (ADR-013 partiel) ; restent : protection de branche, couverture publiée, **E2E navigateur**, CI runtime API, release/déploiement | IMPORTANTE |
| Historique Git actif et `main` aligné sur `origin/main` ; rester vigilant sur le flux PR et les checks requis | SUIVI |
| Packages non intégrés (à clarifier dans les futurs cores) | IMPORTANTE |
| `strategy/` Phase 0 vs état réel (non versionné par ADR) | IMPORTANTE |
| `OPENAPI_CLIENT_PROOF.md` réfère un code retiré | MINEURE |
| `tools/` et `examples/` vides | MINEURE |
| ADR-017→033 et ADR-036→038 cités au backlog mais non rédigés | HISTORIQUE (attendu) |
