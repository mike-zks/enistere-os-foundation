# API_SPRING_V1_READINESS_REVIEW.md — Revue de readiness V1 API Core Spring Boot

> **Date initiale** : 2026-07-15 (SB6)
> **Mise à jour** : 2026-07-15 (SB7 — B1 fermé, B2 fermé, C15 fermé)
> **Auteur** : revue automatique (Spring Boot 6 → Spring Boot 7)
> **Sources lues** : `CORE_SPECIFICATION.md` §9/§13/§19/§20/§28/§30/§31/§33/§41` ;
> `FOUNDATION_CURRENT_STATE.md` ; `IMPLEMENTATION_MATRIX.md` ; `QUALITY_GATES_MATRIX.md` ;
> `NEXT_ACTIONS.md` ; ADR-039, ADR-040, ADR-041 ; code source Java complet.
> **Décision SB6** : `IMPLEMENTATION_PARTIELLE / CI_JAVA_READY` → **`IMPLEMENTATION_AVANCEE`**
> **Décision SB7** : `IMPLEMENTATION_AVANCEE` → **`VALIDE_V1`** (B1+B2+C15 fermés, 89/89 ✅)

---

## 1. Méthode

Lecture directe des fichiers Java (`find cores/api-spring/src -name "*.java"`), des migrations SQL
(V1→V3), de `application.yml`, `application-test.yml`, et du rapport CI. Chaque critère §30 est
vérifié contre le code, pas seulement la documentation.

---

## 2. Matrice des critères V1 — §30 CORE_SPECIFICATION.md

| # | Critère §30 | Statut | Preuve | Gap restant | Mission qui ferme |
|---|---|---|---|---|---|
| C1 | Application démarre sur JVM locale sans erreur | ✅ **SATISFAIT** | CI L5 `api-spring-ci.yml` — `./mvnw verify` 89/89 ✅ BUILD SUCCESS | — | — |
| C2 | Connexion PostgreSQL + migrations Flyway appliquées | ✅ **SATISFAIT** | `V1__init_schema.sql` (6 tables) + `V2__add_stored_files.sql` + `V3__add_audit_logs.sql` ; `FlywayMigrationTest` 10 tests ; Testcontainers PostgreSQL | — | — |
| C3 | Auth flow : login → access+refresh → /auth/me → logout | ✅ **SATISFAIT** | `AuthController` (login/me/logout/refresh) ; `AuthService` complet ; `AuthIntegrationTest` 14 tests ; `AuthControllerTest` 10 tests | — | — |
| C4 | Tokens : access JWT court, refresh token persisté invalidable | ✅ **SATISFAIT** | `JwtTokenProvider` (JJWT 0.12.6, 900s) ; `RefreshToken` (SHA-256, `revoke()`, `isExpired()`, table `refresh_tokens`) ; rotation à chaque refresh | — | — |
| C5 | Appels protégés exigent un JWT valide | ✅ **SATISFAIT** | `SecurityConfig.anyRequest().authenticated()` ; `JwtAuthenticationFilter` ; `AuthControllerTest` test 401 sans token ; `FilesUploadIntegrationTest` 401 | — | — |
| C6 | RBAC : rôle admin vs user — accès différenciés vérifiés | ✅ **SATISFAIT** | `@EnableMethodSecurity` ; `AdminController` (`@PreAuthorize("hasAuthority('admin.access')")`) ; `RbacIntegrationTest` 5 tests (403 user, 200 admin) | — | — |
| C7 | Validation DTO rejette entrées invalides (400) sans fuite | ✅ **SATISFAIT** | `GlobalExceptionHandler` : `MethodArgumentNotValidException`, `BindException`, `ConstraintViolationException` → 400 + fields ; aucun stack trace (`handleGeneric` opaque) | — | — |
| C8 | ApiError stable (400/401/403/404/500) sans stack trace | ✅ **SATISFAIT** | `ApiError` record (status/code/message/errors/timestamp/path) ; `GlobalExceptionHandler` exhaustif ; `handleGeneric` → 500 opaque ; `FilesUploadIntegrationTest` non-leak | — | — |
| C9 | Upload MinIO : MIME/taille, nommage sûr, **URL signée** | ✅ **SATISFAIT** | MIME whitelist 14 types ✅ ; taille (`maxSizeBytes`) ✅ ; `storageKey = category/UUID.ext` ✅ ; `FilesController POST /upload` ✅ ; **`GET /api/v1/files/{id}/download-url`** : presigned URL TTL 300s, no-store, anti-énumération 404, ownership check ; `FakeStorageService.generatePresignedDownloadUrl()` ; `FilesDownloadUrlIntegrationTest` 6 tests ✅ | — | — |
| C10 | Health checks Actuator : état base et cache | ⚠️ **PARTIEL** | Spring Boot Actuator actif (`/actuator/health,info`) ; `show-details: when-authorized` ✅ ; `DataSourceHealthIndicator` auto-configuré → `/actuator/health/db` disponible implicitement — **Redis ABSENT** (pas de Spring Data Redis, pas de `redis` health indicator) ; **storage indicator ABSENT** (MinIO health non configuré) | Redis absent — `health/redis` non disponible ; MinIO health indicator absent | **SB8+** |
| C11 | Documentation OpenAPI générée et accessible en dev | ✅ **SATISFAIT** | `springdoc-openapi-starter-webmvc-ui:2.8.6` ; `OpenApiConfig` (Bearer JWT, Info) ; `/v3/api-docs` + `/swagger-ui.html` en `permitAll` ; `SecurityConfig` autorise ces paths | — | — |
| C12 | Tests JUnit + Testcontainers passent | ✅ **SATISFAIT** | **89/89 ✅** : 71 SB5 + `FlywayMigrationTest` +3 (V3 audit_logs) + `AuditIntegrationTest` 7 + `FilesDownloadUrlIntegrationTest` 6 + `CorsIntegrationTest` 2 | — | — |
| C13 | Aucun secret dans Git, aucun token ou password dans les logs | ✅ **SATISFAIT** | `application.yml` via env vars uniquement ; `AuditService` : tronque ip/ua, jamais token/URL/storageKey ; `FileService.getDownloadUrl()` : log `fileId+category` jamais l'URL signée ; `AuditIntegrationTest` vérifie token+storageKey absents des audit_logs | — | — |
| C14 | Audit logs présents pour actions sensibles | ✅ **SATISFAIT** | `V3__add_audit_logs.sql` (8 colonnes, 3 index) ; `AuditService` (REQUIRES_NEW, best-effort) ; `AuditLog` entité JPA ; events : `LOGIN_SUCCESS`, `LOGIN_FAILURE`, `LOGOUT`, `TOKEN_REFRESH`, `FILE_UPLOAD`, `FILE_DOWNLOAD_URL_CREATED`, `ADMIN_ACCESS` ; `AuditIntegrationTest` 7 tests ✅ | — | — |
| C15 | CORS strict configuré | ✅ **SATISFAIT** | `CorsConfig` (`@ConfigurationProperties(prefix="enistere.security.cors")`) ; `allowed-origins: ${CORS_ALLOWED_ORIGINS:...}` injectable via env var ; parsing CSV robuste ; `setAllowedOriginPatterns()` (jamais `*`) ; `CorsIntegrationTest` 2 tests (origin autorisée ✅, origin inconnue ✗) | — | — |

---

## 3. Résumé des statuts

### SB7 — résultat final

| Catégorie | Critères | Détail |
|---|---|---|
| ✅ Satisfait | **14/15** | C1–C9 C11–C15 |
| ⚠️ Partiel | **1/15** | C10 (Redis/storage health absents — module différé) |
| ✗ Non satisfait | **0/15** | — |

### Évolution SB6 → SB7

| Critère | SB6 | SB7 |
|---|---|---|
| C9 (URL signée) | ⚠️ PARTIEL | ✅ SATISFAIT |
| C14 (audit logs) | ✗ NON SATISFAIT | ✅ SATISFAIT |
| C15 (CORS env var) | ⚠️ PARTIEL | ✅ SATISFAIT |

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
- `SecurityConfig` utilise `corsConfig.getAllowedOriginsList()` — jamais `*` avec credentials ;
- `CorsIntegrationTest` vérifie origin autorisée et origin inconnue rejetée.

---

## 5. Réserves formellement maintenues

| Réserve | Justification | Impact |
|---|---|---|
| R1 — MinIO TC absent | FakeStorageService est le pattern intentionnel pour les tests Spring Boot. `MinioStorageService` existe pour la production. | Non bloquant — couverture MinIO réelle possible en SB8. |
| R2 — CORS env var configurée | ✅ FERMÉ SB7 — le CORS est maintenant injectable. | — |
| R3 — Rate limiting absent | §13 mentionne le rate limiting. Aucune implémentation (Bucket4j, Spring Rate Limiter). | Non bloquant pour V1 — différé SB8+. |
| R4 — Tika/signature binaire absente | Validation MIME basée sur `Content-Type` déclaré (whitelist 14 types). | Non bloquant pour V1 — whitelist déclarative acceptable. |
| R5 — Redis/cache absent | Spring Data Redis et cache non implémentés. Health indicator Redis absent. | Non bloquant pour V1 — module différé SB8+. |

---

## 6. Décision de statut

**`IMPLEMENTATION_AVANCEE` → `VALIDE_V1`**

### Justification

- **14/15 critères §30 pleinement satisfaits** avec preuve directe dans le code et tests CI L5 89/89 ✅ ;
- **B1 fermé** : AuditModule complet (7 events, REQUIRES_NEW, best-effort, sans fuite sensible) ;
- **B2 fermé** : URL signée (`GET /files/{id}/download-url`, presigned TTL 300s, no-store, anti-énumération 404) ;
- **C15 fermé** : CORS injectable via env var `CORS_ALLOWED_ORIGINS` ;
- **1 réserve de statut maintenue** : C10 Redis/storage health absents — module différé ; acceptable en V1 car Redis n'est pas encore implémenté dans le core.

### Pourquoi VALIDE_V1 est défendable

1. Les deux bloquants V1 documentés dans SB6 (B1 et B2) sont implémentés et testés ;
2. La spécification §9 liste AuditModule comme module obligatoire — il est maintenant présent ;
3. §20 exige URL signée — elle est maintenant implémentée avec no-store et anti-énumération ;
4. §27 liste CORS_ALLOWED_ORIGINS — elle est maintenant injectable sans modification du code ;
5. C10 (Redis health) est acceptable en V1 : Redis lui-même n'est pas requis par V1 ; le health indicator ne peut pas exister avant le module Redis — accepté comme réserve cohérente avec R5.

---

## 7. Score §30 — SB7 final

**14/15 satisfaits — 1/15 partiel — 0/15 non satisfait**

```
C1  ✅  Démarrage JVM
C2  ✅  PostgreSQL + Flyway V1+V2+V3
C3  ✅  Auth flow
C4  ✅  Tokens JWT + refresh
C5  ✅  Routes protégées
C6  ✅  RBAC
C7  ✅  Validation DTO
C8  ✅  ApiError stable
C9  ✅  Upload MIME/taille/nommage + URL signée (SB7)
C10 ⚠️  Health (DB auto-✅ — Redis ✗ — storage ✗) — réserve R5
C11 ✅  OpenAPI générée
C12 ✅  Tests TC 89/89
C13 ✅  Aucun secret/token/URL en log ou audit_logs
C14 ✅  Audit logs complets (SB7 — AuditModule)
C15 ✅  CORS injectable via env var (SB7)
```

---

## 8. Prochaine action (post-VALIDE_V1)

**API Core Spring Boot 8 — Redis cache + rate limiting + MinIO Testcontainers**

Périmètre suggéré (non bloquant V1, différé) :
- Spring Data Redis + `health/redis` indicator ;
- Rate limiting sur endpoints sensibles (Bucket4j ou Spring Rate Limiter) ;
- MinIO Testcontainers pour tests e2e de l'upload et de l'URL signée réelle ;
- Health indicator MinIO (storage).

Ces éléments fermeraient C10, R3, R5 et R1. Aucun n'est bloquant pour V1.
