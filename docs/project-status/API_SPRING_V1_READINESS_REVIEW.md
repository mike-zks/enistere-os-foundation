# API_SPRING_V1_READINESS_REVIEW.md — Revue de readiness V1 API Core Spring Boot

> **Date initiale** : 2026-07-15 (SB6)
> **Mise à jour** : 2026-07-15 (SB7 — B1 fermé, B2 fermé, C15 fermé ; SB8 — C10/R1/R3/R5 fermés)
> **Auteur** : revue automatique (Spring Boot 6 → Spring Boot 7)
> **Sources lues** : `CORE_SPECIFICATION.md` §9/§13/§19/§20/§28/§30/§31/§33/§41` ;
> `FOUNDATION_CURRENT_STATE.md` ; `IMPLEMENTATION_MATRIX.md` ; `QUALITY_GATES_MATRIX.md` ;
> `NEXT_ACTIONS.md` ; ADR-039, ADR-040, ADR-041 ; code source Java complet.
> **Décision SB6** : `IMPLEMENTATION_PARTIELLE / CI_JAVA_READY` → **`IMPLEMENTATION_AVANCEE`**
> **Décision SB7** : `IMPLEMENTATION_AVANCEE` → **`VALIDE_V1`** (B1+B2+C15 fermés, 90/90 ✅)

---

## 1. Méthode

Lecture directe des fichiers Java (`find cores/api-spring/src -name "*.java"`), des migrations SQL
(V1→V3), de `application.yml`, `application-test.yml`, et du rapport CI. Chaque critère §30 est
vérifié contre le code, pas seulement la documentation.

---

## 2. Matrice des critères V1 — §30 CORE_SPECIFICATION.md

| # | Critère §30 | Statut | Preuve | Gap restant | Mission qui ferme |
|---|---|---|---|---|---|
| C1 | Application démarre sur JVM locale sans erreur | ✅ **SATISFAIT** | CI L5 `api-spring-ci.yml` — `./mvnw verify` 90/90 ✅ BUILD SUCCESS | — | — |
| C2 | Connexion PostgreSQL + migrations Flyway appliquées | ✅ **SATISFAIT** | `V1__init_schema.sql` (6 tables) + `V2__add_stored_files.sql` + `V3__add_audit_logs.sql` ; `FlywayMigrationTest` 10 tests ; Testcontainers PostgreSQL | — | — |
| C3 | Auth flow : login → access+refresh → /auth/me → logout | ✅ **SATISFAIT** | `AuthController` (login/me/logout/refresh) ; `AuthService` complet ; `AuthIntegrationTest` 14 tests ; `AuthControllerTest` 10 tests | — | — |
| C4 | Tokens : access JWT court, refresh token persisté invalidable | ✅ **SATISFAIT** | `JwtTokenProvider` (JJWT 0.12.6, 900s) ; `RefreshToken` (SHA-256, `revoke()`, `isExpired()`, table `refresh_tokens`) ; rotation à chaque refresh | — | — |
| C5 | Appels protégés exigent un JWT valide | ✅ **SATISFAIT** | `SecurityConfig.anyRequest().authenticated()` ; `JwtAuthenticationFilter` ; `AuthControllerTest` test 401 sans token ; `FilesUploadIntegrationTest` 401 | — | — |
| C6 | RBAC : rôle admin vs user — accès différenciés vérifiés | ✅ **SATISFAIT** | `@EnableMethodSecurity` ; `AdminController` (`@PreAuthorize("hasAuthority('admin.access')")`) ; `RbacIntegrationTest` 5 tests (403 user, 200 admin) | — | — |
| C7 | Validation DTO rejette entrées invalides (400) sans fuite | ✅ **SATISFAIT** | `GlobalExceptionHandler` : `MethodArgumentNotValidException`, `BindException`, `ConstraintViolationException` → 400 + fields ; aucun stack trace (`handleGeneric` opaque) | — | — |
| C8 | ApiError stable (400/401/403/404/500) sans stack trace | ✅ **SATISFAIT** | `ApiError` record (status/code/message/errors/timestamp/path) ; `GlobalExceptionHandler` exhaustif ; `handleGeneric` → 500 opaque ; `FilesUploadIntegrationTest` non-leak | — | — |
| C9 | Upload MinIO : MIME/taille, nommage sûr, **URL signée** | ✅ **SATISFAIT** | MIME whitelist 14 types ✅ ; taille (`maxSizeBytes`) ✅ ; `storageKey = category/UUID.ext` ✅ ; `FilesController POST /upload` ✅ ; **`GET /api/v1/files/{id}/download-url`** : presigned URL TTL 300s, no-store, anti-énumération 404, ownership check ; `FakeStorageService.generatePresignedDownloadUrl()` ; `FilesDownloadUrlIntegrationTest` 6 tests ✅ | — | — |
| C10 | Health checks Actuator : état base et cache | ✅ **SATISFAIT** | `spring-boot-starter-data-redis` (Lettuce) ; `RedisHealthIndicator` auto-configuré via Actuator ; `/actuator/health` → `$.components.db` UP + `$.components.redis` UP (TC `redis:7-alpine`) ; `management.endpoint.health.show-details: always` en test ; `RedisHealthIntegrationTest` 2 tests ✅ | — | — |
| C11 | Documentation OpenAPI générée et accessible en dev | ✅ **SATISFAIT** | `springdoc-openapi-starter-webmvc-ui:2.8.6` ; `OpenApiConfig` (Bearer JWT, Info) ; `/v3/api-docs` + `/swagger-ui.html` en `permitAll` ; `SecurityConfig` autorise ces paths | — | — |
| C12 | Tests JUnit + Testcontainers passent | ✅ **SATISFAIT** | **99/99 ✅** : 90 SB7 + `RateLimitIntegrationTest` 4 + `RedisHealthIntegrationTest` 2 + `MinioStorageIntegrationTest` 3 | — | — |
| C13 | Aucun secret dans Git, aucun token ou password dans les logs | ✅ **SATISFAIT** | `application.yml` via env vars uniquement ; `AuditService` : tronque ip/ua, jamais token/URL/storageKey ; `FileService.getDownloadUrl()` : log `fileId+category` jamais l'URL signée ; `AuditIntegrationTest` vérifie token+storageKey absents des audit_logs | — | — |
| C14 | Audit logs présents pour actions sensibles | ✅ **SATISFAIT** | `V3__add_audit_logs.sql` (8 colonnes, 3 index) ; `AuditService` (REQUIRES_NEW, best-effort) ; `AuditLog` entité JPA ; events : `LOGIN_SUCCESS`, `LOGIN_FAILURE`, `LOGOUT`, `TOKEN_REFRESH`, `FILE_UPLOAD`, `FILE_DOWNLOAD_URL_CREATED`, `ADMIN_ACCESS` ; `AuditIntegrationTest` 7 tests ✅ | — | — |
| C15 | CORS strict configuré | ✅ **SATISFAIT** | `CorsConfig` (`@ConfigurationProperties(prefix="enistere.security.cors")`) ; `allowed-origins: ${CORS_ALLOWED_ORIGINS:...}` injectable via env var ; parsing CSV robuste ; wildcards ignorés avec credentials ; `setAllowedOrigins()` ; `CorsIntegrationTest` 3 tests (origin autorisée ✅, origin inconnue ✗, wildcard ignoré) | — | — |

---

## 3. Résumé des statuts

### SB8 — résultat final

| Catégorie | Critères | Détail |
|---|---|---|
| ✅ Satisfait | **15/15** | C1–C15 |
| ⚠️ Partiel | **0/15** | — |
| ✗ Non satisfait | **0/15** | — |

### Évolution SB7 → SB8

| Critère | SB7 | SB8 |
|---|---|---|
| C10 (Redis/cache health) | ⚠️ PARTIEL | ✅ SATISFAIT |
| C12 (Tests TC) | ✅ 90/90 | ✅ 99/99 |

---

## 4. Bloquants V1 — statut SB7

### B1 — Audit logs — ✅ FERMÉ (SB7)

`AuditModule` implémenté :
- Migration `V3__add_audit_logs.sql` (table + 3 index) ;
- `AuditLog` entité JPA ; `AuditEventType` enum (7 valeurs) ; `AuditLogRepository` ;
- `AuditService` (`@Transactional(propagation = REQUIRES_NEW)`, best-effort, catch-all) ;
- Traçage dans `AuthService` (LOGIN_SUCCESS/FAILURE/LOGOUT/TOKEN_REFRESH), `FileService` (FILE_UPLOAD/FILE_DOWNLOAD_URL_CREATED), `AdminController` (ADMIN_ACCESS) ;
- Aucun payload sensible : ni password, ni refresh token, ni storageKey, ni URL signée dans audit_logs.

### B2 — URL signée download — ✅ FERMÉ (SB7)

`GET /api/v1/files/{id}/download-url` implémenté :
- Ownership obligatoire : `StoredFileRepository.findByIdAndOwnerId()` → 404 anti-énumération ;
- `StorageService.generatePresignedDownloadUrl()` : interface + MinioStorageService (GetPresignedObjectUrlArgs TTL configurable) + FakeStorageService (URL factice contrôlée) ;
- `FilesConfig.presignedUrlTtlSeconds` (défaut 300s, `${FILES_PRESIGNED_TTL_SECONDS:300}`) ;
- `Cache-Control: no-store` dans la réponse ;
- URL jamais loggée, jamais dans audit_logs (targetId = fileId UUID).

### C15 — CORS env var — ✅ FERMÉ (SB7)

`CorsConfig` (`@ConfigurationProperties`) injectable via `${CORS_ALLOWED_ORIGINS:...}` :
- Parsing CSV robuste (`split(",")`, trim, filter empty) ;
- `SecurityConfig` utilise `corsConfig.getAllowedOriginsList()` via `setAllowedOrigins()` — jamais `*` avec credentials ;
- `CorsIntegrationTest` vérifie origin autorisée, origin inconnue rejetée et wildcard ignoré.

---

## 5. Réserves — statut SB8

| Réserve | Statut | Détail |
|---|---|---|
| R1 — MinIO TC | ✅ **FERMÉ SB8** | `MinioStorageIntegrationTest` : TC `minio/minio:...`, upload réel, URL présignée `X-Amz-*`, `Cache-Control: no-store`. |
| R2 — CORS env var | ✅ **FERMÉ SB7** | `CorsConfig` injectable via `${CORS_ALLOWED_ORIGINS}`. |
| R3 — Rate limiting | ✅ **FERMÉ SB8** | `RateLimitInterceptor` fixed-window en mémoire ; 4 endpoints ; 429 ApiError ; `RateLimitConfig` externalisé. |
| R4 — Tika/signature binaire | Acceptée | Validation MIME whitelist 14 types sur `Content-Type` déclaré — non bloquant V1. |
| R5 — Redis/cache | ✅ **FERMÉ SB8** | `spring-boot-starter-data-redis` Lettuce ; `RedisHealthIndicator` auto-configuré ; TC `redis:7-alpine` ; 2 tests ✅. |

---

## 6. Décision de statut

**`VALIDE_V1` confirmé (SB7) + réserves C10/R1/R3/R5 fermées (SB8)**

### Justification SB8

- **15/15 critères §30 pleinement satisfaits** avec preuve directe dans le code et tests CI L5 99/99 ✅ ;
- **C10 fermé** : Redis health indicator via `spring-boot-starter-data-redis` (Lettuce) + `RedisHealthIntegrationTest` TC redis:7-alpine ;
- **R1 fermé** : `MinioStorageIntegrationTest` TC minio réel — upload + URL présignée `X-Amz-*` + `Cache-Control: no-store` ;
- **R3 fermé** : `RateLimitInterceptor` fixed-window sur 4 endpoints sensibles ; 429 `ApiError` ; `RateLimitConfig` externalisé ; désactivé en profil test ;
- **R5 fermé** : Lettuce lazy (démarrage sans Redis) ; health indicator auto-configuré via Actuator ; TC pour tests Redis.

### Aucune réserve bloquante restante

Réserve R4 (Tika/signature binaire) : whitelist MIME 14 types déclarative — acceptable V1, non bloquant.

---

## 7. Score §30 — SB8 final

**15/15 satisfaits — 0/15 partiel — 0/15 non satisfait**

```
C1  ✅  Démarrage JVM
C2  ✅  PostgreSQL + Flyway V1+V2+V3
C3  ✅  Auth flow
C4  ✅  Tokens JWT + refresh
C5  ✅  Routes protégées
C6  ✅  RBAC
C7  ✅  Validation DTO
C8  ✅  ApiError stable
C9  ✅  Upload MIME/taille/nommage + URL signée (SB7) + MinIO TC réel (SB8)
C10 ✅  Health DB + Redis (TC redis:7-alpine, SB8)
C11 ✅  OpenAPI générée
C12 ✅  Tests TC 99/99 (SB8)
C13 ✅  Aucun secret/token/URL en log ou audit_logs
C14 ✅  Audit logs complets (SB7 — AuditModule)
C15 ✅  CORS injectable via env var (SB7)
```

---

## 8. Missions SB1–SB8 — statut final

| Mission | Livrable principal | Statut |
|---|---|---|
| SB1 | CORE_SPECIFICATION.md | ✅ |
| SB2A | ADR-041 Maven vs Gradle | ✅ |
| SB2 | Starter Maven minimal (18 tests) | ✅ |
| SB3 | PostgreSQL + JPA + Flyway + RBAC (43 tests) | ✅ |
| SB4 | OpenAPI + Upload MinIO (71 tests) | ✅ |
| SB5 | CI Java + Quality Gate | ✅ |
| SB6 | V1 Readiness Review | ✅ |
| SB7 | AuditModule + URL signée + CORS (90 tests) | ✅ |
| SB8 | Redis + Rate Limit + MinIO TC (99 tests) | ✅ |

**Score §30 final : 15/15 ✅ — aucune réserve bloquante.**
