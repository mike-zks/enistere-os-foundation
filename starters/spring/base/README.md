# starter Spring Boot

> Statut : **`VALIDE_V1`** (Spring Boot 8, 2026-07-15 — §30 15/15 ✅)
> Spécification cible : [`STARTER_SPECIFICATION.md`](./STARTER_SPECIFICATION.md)
> Stack : Spring Boot 4.1.0 + Spring Security 7.1.0 + JJWT 0.12.6 + PostgreSQL + Flyway 11 + MinIO SDK 8.5.17 + Spring Data Redis (Lettuce) + Java 21 (Maven — ADR-041)

Socle backend **Java / Spring Boot** générique et réutilisable pour les futures applications Enistere orientées enterprise, finance, administration et systèmes d'information.

## Lancer le projet

```bash
# Prérequis : Java 21 (SDKMAN recommandé)
sdk use java 21.0.9-librca

# Lancer les tests (nécessite Docker — Testcontainers démarre PostgreSQL automatiquement)
./mvnw test

# Build complet (compile + test + package)
./mvnw verify

# Lancer l'application (nécessite PostgreSQL + MinIO)
./mvnw spring-boot:run

# Variables d'environnement obligatoires (production)
export JWT_SECRET=<votre-secret-min-32-bytes-cryptographiquement-aleatoire>
export DB_URL=jdbc:postgresql://localhost:5432/enistere_dev
export DB_USERNAME=enistere
export DB_PASSWORD=<votre-mot-de-passe>
export MINIO_ENDPOINT=http://localhost:9000
export MINIO_BUCKET=enistere
export MINIO_ACCESS_KEY=<clé>
export MINIO_SECRET_KEY=<secret>

# Variables optionnelles avec valeurs par défaut
export CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:4200  # CSV
export FILES_PRESIGNED_TTL_SECONDS=300                                   # secondes
export REDIS_URL=redis://localhost:6379                                   # optionnel — URL Redis (Lettuce)
export RATE_LIMIT_AUTH_CAPACITY=10                                        # requêtes max par fenêtre sur /auth/login et /auth/refresh
export RATE_LIMIT_AUTH_REFILL_SECONDS=60                                  # durée fenêtre en secondes
```

## Structure (Spring Boot 8 — VALIDE_V1)

```
starters/spring/
├── pom.xml
├── mvnw / mvnw.cmd
├── src/main/
│   ├── java/com/enistere/core/
│   │   ├── EnistereCoreApplication.java  ← @ConfigurationPropertiesScan
│   │   ├── config/
│   │   │   ├── Argon2Config.java         ← @ConfigurationProperties(enistere.security.argon2)
│   │   │   ├── CorsConfig.java           ← @ConfigurationProperties(enistere.security.cors) — ${CORS_ALLOWED_ORIGINS}
│   │   │   ├── DatabaseConfig.java       ← @EnableJpaAuditing
│   │   │   ├── FilesConfig.java          ← @ConfigurationProperties(enistere.files) — presignedUrlTtlSeconds
│   │   │   ├── JwtConfig.java
│   │   │   ├── RateLimitConfig.java      ← @ConfigurationProperties(enistere.security.rate-limit) — capacity/refill
│   │   │   ├── SecurityConfig.java       ← STATELESS + CORS injectable + RBAC
│   │   │   ├── StorageConfig.java        ← MinioClient bean @Profile("!test")
│   │   │   └── WebMvcConfig.java         ← HandlerInterceptor registry (RateLimitInterceptor conditionnel)
│   │   ├── common/exception/
│   │   │   ├── ApiError.java
│   │   │   └── GlobalExceptionHandler.java
│   │   ├── infrastructure/
│   │   │   ├── persistence/BaseEntity.java
│   │   │   ├── ratelimit/
│   │   │   │   └── RateLimitInterceptor.java    ← fixed-window, @ConditionalOnProperty(enabled)
│   │   │   ├── security/
│   │   │   │   ├── EnistereUserDetailsService.java
│   │   │   │   ├── JwtAuthenticationFilter.java  ← setDetails(userId) pour audit downstream
│   │   │   │   └── JwtTokenProvider.java
│   │   │   └── storage/
│   │   │       ├── StorageService.java          ← interface (uploadFile + generatePresignedDownloadUrl)
│   │   │       └── MinioStorageService.java     ← @Profile("!test") — GetPresignedObjectUrlArgs
│   │   └── modules/
│   │       ├── admin/AdminController.java        ← GET /admin/ping + audit ADMIN_ACCESS
│   │       ├── audit/
│   │       │   ├── AuditEventType.java           ← 7 valeurs
│   │       │   ├── AuditLog.java                 ← entité JPA (sans BaseEntity — append-only)
│   │       │   ├── AuditLogRepository.java
│   │       │   └── AuditService.java             ← @Transactional(REQUIRES_NEW) + best-effort
│   │       ├── auth/
│   │       │   ├── AuthController.java           ← login/me/logout/refresh + ip/ua extraction
│   │       │   ├── AuthService.java              ← audit LOGIN_SUCCESS/FAILURE/LOGOUT/TOKEN_REFRESH
│   │       │   └── dto/
│   │       ├── files/
│   │       │   ├── FilesController.java          ← POST /upload + GET /{id}/download-url
│   │       │   ├── FileService.java              ← upload (audit) + getDownloadUrl (audit, no-log URL)
│   │       │   ├── StoredFile.java
│   │       │   ├── StoredFileRepository.java     ← findByIdAndOwnerId (anti-énumération)
│   │       │   └── dto/
│   │       │       ├── DownloadUrlResponseDto.java  ← fileId, url, expiresIn
│   │       │       └── StoredFileResponseDto.java   ← jamais storageKey/bucket/signedUrl
│   │       ├── permissions/ ├── roles/ └── users/
│   └── resources/
│       ├── application.yml
│       └── db/migration/
│           ├── V1__init_schema.sql       ← 6 tables, 5 index
│           ├── V2__add_stored_files.sql  ← stored_files, 3 index
│           └── V3__add_audit_logs.sql    ← audit_logs, 3 index
└── src/test/
    ├── java/com/enistere/core/
    │   ├── AbstractIntegrationTest.java
    │   ├── FlywayMigrationTest.java             ← 10 tests (V1+V2+V3)
    │   ├── config/CorsIntegrationTest.java      ← 2 tests
    │   ├── infrastructure/
    │   │   ├── health/RedisHealthIntegrationTest.java       ← 2 tests — TC redis:7-alpine
    │   │   ├── ratelimit/RateLimitIntegrationTest.java      ← 4 tests — 429 ApiError
    │   │   └── storage/FakeStorageService.java              ← @Profile("test")
    │   ├── modules/
    │   │   ├── admin/RbacIntegrationTest.java
    │   │   ├── audit/AuditIntegrationTest.java  ← 7 tests (sans payload sensible)
    │   │   ├── auth/
    │   │   └── files/
    │   │       ├── FilesDownloadUrlIntegrationTest.java     ← 6 tests
    │   │       ├── FilesUploadIntegrationTest.java
    │   │       └── MinioStorageIntegrationTest.java         ← 3 tests — TC minio réel
    └── resources/application-test.yml
```

## Endpoints disponibles

| Méthode | Route | Auth | Description |
|---|---|---|---|
| `POST` | `/api/v1/auth/login` | Public | Connexion DB → access + refresh token |
| `GET` | `/api/v1/auth/me` | JWT | userId, email, roles, permissions |
| `POST` | `/api/v1/auth/logout` | JWT | Révoque le refresh token |
| `POST` | `/api/v1/auth/refresh` | Public | Rotation refresh token → nouvelle paire |
| `POST` | `/api/v1/files/upload` | JWT | Upload multipart → DTO public (jamais storageKey/bucket) |
| `GET` | `/api/v1/files/{id}/download-url` | JWT | URL signée courte durée (TTL 300s) — `Cache-Control: no-store` |
| `GET` | `/api/v1/admin/ping` | JWT + `admin.access` | Probe RBAC |
| `GET` | `/actuator/health` | Public | Status UP/DOWN |
| `GET` | `/actuator/info` | Public | Infos application |
| `GET` | `/v3/api-docs` | Public | OpenAPI JSON |
| `GET` | `/swagger-ui.html` | Public | Swagger UI |

## Sécurité

- **STATELESS** — `SessionCreationPolicy.STATELESS` ; aucune session serveur
- **JWT** — `sub` (email) + `userId` (UUID) + `permissions` (List) ; access 15 min
- **Argon2id** — `Argon2PasswordEncoder` (ADR-039)
- **Refresh token rotation** — hash SHA-256 stocké ; révoqué à chaque usage
- **RBAC** — `@EnableMethodSecurity` + `@PreAuthorize("hasAuthority(...)")`
- **AuditModule** — `AuditService` (REQUIRES_NEW, best-effort) — 7 events ; aucun payload sensible (ni password, ni refresh token, ni storageKey, ni URL signée, ni body fichier)
- **URL signée** — générée server-side ; jamais loggée, jamais dans audit_logs, `Cache-Control: no-store`, ownership obligatoire (404 anti-énumération)
- **CORS** — origines injectables via `${CORS_ALLOWED_ORIGINS:...}` (CSV) — jamais `*` avec credentials
- **Rate limiting** — `RateLimitInterceptor` fixed-window en mémoire sur `/auth/login`, `/auth/refresh`, `/files/upload`, `/files/*/download-url` ; 429 `ApiError` ; `RateLimitConfig` externalisé (`enistere.security.rate-limit.*`)
- **Redis** — `spring-boot-starter-data-redis` (Lettuce lazy) ; URL `${REDIS_URL:redis://localhost:6379}` ; `RedisHealthIndicator` auto-configuré
- **Secrets** — jamais dans le code source ; env vars uniquement
- **DTOs** — entités JPA jamais exposées en HTTP

## Flyway — migrations

| Migration | Tables | Description |
|---|---|---|
| `V1__init_schema.sql` | `users`, `roles`, `permissions`, `user_roles`, `role_permissions`, `refresh_tokens` | Auth + RBAC + refresh |
| `V2__add_stored_files.sql` | `stored_files` | Upload fichiers (13 colonnes, 3 index) |
| `V3__add_audit_logs.sql` | `audit_logs` | Audit (8 colonnes, 3 index) — append-only |

## AuditModule

`AuditService.record(eventType, userId, targetType, targetId, ipAddress, userAgent)` — `@Transactional(REQUIRES_NEW)`.

| Événement | Tracé dans | userId | targetId |
|---|---|---|---|
| `LOGIN_SUCCESS` | `AuthService.login()` | user.getId() | — |
| `LOGIN_FAILURE` | `AuthService.login()` | null | — |
| `LOGOUT` | `AuthService.logout()` | callerUserId | — |
| `TOKEN_REFRESH` | `AuthService.refresh()` | userId | — |
| `FILE_UPLOAD` | `FileService.upload()` | owner.getId() | fileId UUID |
| `FILE_DOWNLOAD_URL_CREATED` | `FileService.getDownloadUrl()` | ownerId | fileId UUID |
| `ADMIN_ACCESS` | `AdminController.ping()` | userId | "ping" |

## Tests (99/99 ✅)

```
JwtTokenProviderTest              :  9 tests
FlywayMigrationTest               : 10 tests (V1+V2+V3 tables, colonnes, index)
FileValidationTest                : 16 tests (MIME whitelist, taille)
AuthControllerTest                : 10 tests
AuthIntegrationTest               : 14 tests
RbacIntegrationTest               :  5 tests
FilesUploadIntegrationTest        :  9 tests
AuditIntegrationTest              :  7 tests (sans payload sensible)
FilesDownloadUrlIntegrationTest   :  6 tests (401/200/no-store/404 anti-enum/no-leak)
CorsIntegrationTest               :  3 tests (origin autorisée / inconnue / wildcard ignoré)
EnistereCoreApplicationTests      :  1 test
RateLimitIntegrationTest          :  4 tests (login 429, upload 429, download-url 429, non limité)
RedisHealthIntegrationTest        :  2 tests (redis UP, db UP — TC redis:7-alpine)
MinioStorageIntegrationTest       :  3 tests (object exists, URL X-Amz-*, no-store — TC minio)
```

```bash
./mvnw test      # 99/99 ✅ — nécessite Docker (Testcontainers)
./mvnw verify    # compile + test + package
```

## Décisions

| Décision | Valeur | Référence |
|---|---|---|
| Build system | Maven + Spring Boot Parent POM | ADR-041 |
| Spring Boot | 4.1.0 (stable, Java 21) | ADR-041 |
| JWT | JJWT 0.12.6 | — |
| Password hashing | Argon2id (`Argon2PasswordEncoder` + Bouncy Castle) | ADR-039 |
| Migrations DB | Flyway 11.x | §12 |
| Storage | MinIO SDK 8.5.17 + FakeStorageService @Profile("test") | ADR-007 |
| Audit | AuditService REQUIRES_NEW + best-effort | §9 |
| URL signée | GetPresignedObjectUrlArgs TTL configurable, no-store | §20 |
| CORS | CorsConfig @ConfigurationProperties + CSV env var | §27 |
| Rate limiting | RateLimitInterceptor fixed-window en mémoire, @ConditionalOnProperty | §13 |
| Redis | spring-boot-starter-data-redis Lettuce lazy, ${REDIS_URL} | §24 |
| Tests | Testcontainers singleton + JdbcTemplate assertions | §30 |

## Missions

| # | Mission | Statut |
|---|---|---|
| SB1 | Core specification | ✅ `SPECIFICATION_DOCUMENTAIRE` |
| SB2A | ADR-041 build system Maven | ✅ |
| SB2 | Starter minimal + auth JWT | ✅ `STARTER_INITIALISE` |
| SB3 | PostgreSQL + JPA + Flyway + RBAC | ✅ `PERSISTENCE_RBAC_READY` |
| SB4 | OpenAPI + Upload MinIO | ✅ `FILE_UPLOAD_READY` |
| SB5 | CI Java L5 + quality gate | ✅ `CI_JAVA_READY` |
| SB6 | V1 Readiness Review | ✅ `IMPLEMENTATION_AVANCEE` |
| SB7 | AuditModule + URL signée + CORS env var | ✅ `VALIDE_V1` |
| SB8 | Redis + Rate limiting + MinIO TC (§30 15/15) | ✅ **`VALIDE_V1`** |
