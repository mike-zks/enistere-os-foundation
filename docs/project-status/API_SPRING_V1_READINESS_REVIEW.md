# API_SPRING_V1_READINESS_REVIEW.md — Revue de readiness V1 API Core Spring Boot

> **Date** : 2026-07-15
> **Auteur** : revue automatique (Spring Boot 6 — mission V1 Readiness Review)
> **Sources lues** : `CORE_SPECIFICATION.md` §9/§13/§19/§20/§28/§30/§31/§33/§41` ;
> `FOUNDATION_CURRENT_STATE.md` ; `IMPLEMENTATION_MATRIX.md` ; `QUALITY_GATES_MATRIX.md` ;
> `NEXT_ACTIONS.md` ; ADR-039, ADR-040, ADR-041 ; code source Java complet.
> **Décision** : `IMPLEMENTATION_PARTIELLE / CI_JAVA_READY` → **`IMPLEMENTATION_AVANCEE`**
> **VALIDE_V1 : DIFFÉRÉ** — 2 bloquants réels (B1 audit logs, B2 URL signée).

---

## 1. Méthode

Lecture directe des fichiers Java (`find cores/api-spring/src -name "*.java"`), des migrations SQL,
de `application.yml`, `application-test.yml`, et du rapport CI (71/71 ✅). Chaque critère §30 est
vérifié contre le code, pas seulement la documentation.

---

## 2. Matrice des critères V1 — §30 CORE_SPECIFICATION.md

| # | Critère §30 | Statut | Preuve | Gap restant | Mission qui ferme |
|---|---|---|---|---|---|
| C1 | Application démarre sur JVM locale sans erreur | ✅ **SATISFAIT** | CI L5 `api-spring-ci.yml` — `./mvnw verify` 71/71 ✅ BUILD SUCCESS | — | — |
| C2 | Connexion PostgreSQL + migrations Flyway appliquées | ✅ **SATISFAIT** | `V1__init_schema.sql` (6 tables) + `V2__add_stored_files.sql` (stored_files, 3 index) ; `FlywayMigrationTest` 7 tests ; Testcontainers PostgreSQL | — | — |
| C3 | Auth flow : login → access+refresh → /auth/me → logout | ✅ **SATISFAIT** | `AuthController` (login/me/logout/refresh) ; `AuthService` complet ; `AuthIntegrationTest` 14 tests ; `AuthControllerTest` 10 tests | — | — |
| C4 | Tokens : access JWT court, refresh token persisté invalidable | ✅ **SATISFAIT** | `JwtTokenProvider` (JJWT 0.12.6, 900s) ; `RefreshToken` (SHA-256, `revoke()`, `isExpired()`, table `refresh_tokens`) ; rotation à chaque refresh | — | — |
| C5 | Appels protégés exigent un JWT valide | ✅ **SATISFAIT** | `SecurityConfig.anyRequest().authenticated()` ; `JwtAuthenticationFilter` ; `AuthControllerTest` test 401 sans token ; `FilesUploadIntegrationTest` 401 | — | — |
| C6 | RBAC : rôle admin vs user — accès différenciés vérifiés | ✅ **SATISFAIT** | `@EnableMethodSecurity` ; `AdminController` (`@PreAuthorize("hasAuthority('admin.access')")`) ; `RbacIntegrationTest` 5 tests (403 user, 200 admin) | — | — |
| C7 | Validation DTO rejette entrées invalides (400) sans fuite | ✅ **SATISFAIT** | `GlobalExceptionHandler` : `MethodArgumentNotValidException`, `BindException`, `ConstraintViolationException` → 400 + fields ; aucun stack trace (`handleGeneric` opaque) | — | — |
| C8 | ApiError stable (400/401/403/404/500) sans stack trace | ✅ **SATISFAIT** | `ApiError` record (status/code/message/errors/timestamp/path) ; `GlobalExceptionHandler` exhaustif ; `handleGeneric` → 500 opaque ; `FilesUploadIntegrationTest` non-leak | — | — |
| C9 | Upload MinIO : MIME/taille, nommage sûr, **URL signée** | ⚠️ **PARTIEL** | MIME whitelist 14 types ✅ ; taille (`maxSizeBytes`) ✅ ; `storageKey = category/UUID.ext` ✅ ; `FilesController POST /upload` ✅ ; `FilesUploadIntegrationTest` 9 tests ✅ — **URL signée ABSENTE** (pas de `GET /files/:id/download-url`, pas de presigned URL) ; MinIO réel non couvert par TC (FakeStorageService) | URL signée absente — §20 "presigned URLs pour fichiers privés, jamais en cache ou log" non implémentée | **SB7** |
| C10 | Health checks Actuator : état base et cache | ⚠️ **PARTIEL** | Spring Boot Actuator actif (`/actuator/health,info`) ; `show-details: when-authorized` ✅ ; `DataSourceHealthIndicator` auto-configuré par Spring Data JPA → `/actuator/health/db` disponible implicitement — **Redis ABSENT** (pas de Spring Data Redis, pas de `redis` health indicator) ; **storage indicator ABSENT** (MinIO health non configuré) | Redis absent — `health/redis` non disponible ; MinIO health indicator absent | **SB7** |
| C11 | Documentation OpenAPI générée et accessible en dev | ✅ **SATISFAIT** | `springdoc-openapi-starter-webmvc-ui:2.8.6` ; `OpenApiConfig` (Bearer JWT, Info) ; `/v3/api-docs` + `/swagger-ui.html` en `permitAll` ; `SecurityConfig` autorise ces paths | — | — |
| C12 | Tests JUnit + Testcontainers passent | ✅ **SATISFAIT** | 71/71 ✅ : `JwtTokenProviderTest` (7u) + `AuthControllerTest` (10u) + `AuthIntegrationTest` (14i TC) + `RbacIntegrationTest` (5i TC) + `FlywayMigrationTest` (7i TC) + `FileValidationTest` (16u) + `FilesUploadIntegrationTest` (9i TC) + context loads (1) + `FlywayMigrationTest` V2 (3i TC) | Couverture Redis, MinIO TC, download différée | **SB7** |
| C13 | Aucun secret dans Git, aucun token ou password dans les logs | ✅ **SATISFAIT** | `application.yml` : `${JWT_SECRET:...dev...}`, `${DB_PASSWORD:}`, `${FILES_ACCESS_KEY:minioadmin}` — tous via env vars ; `FileService` : logs `category/size/mimeType` uniquement (ADR-040 ; `MinioStorageService` : logs `size/contentType` uniquement — jamais `storageKey`, jamais credentials | — | — |
| C14 | Audit logs présents pour actions sensibles | ✗ **NON SATISFAIT** | **ABSENT** : pas de table `audit_logs` dans V1 ou V2 ; pas d'`AuditModule` ni d'`AuditService` ; pas d'`@Aspect` ; `AuthService.login()` ne logue aucun `LOGIN_SUCCESS/LOGIN_FAILURE` ; `FileService.upload()` ne logue aucun `FILE_UPLOAD` | Table `audit_logs` manquante ; `AuditModule` (§9 module obligatoire) absent ; aucun event `LOGIN_SUCCESS`, `FILE_UPLOAD`, `TOKEN_REFRESH` tracé | **SB7** |
| C15 | CORS strict configuré | ⚠️ **PARTIEL** | `SecurityConfig.corsConfigurationSource()` configuré ; STATELESS Bearer ✅ — **origins hardcodées** (`localhost:3000/4200/8080/8081/19006`) ; pas de `${CORS_ALLOWED_ORIGINS}` env var (§27 liste `CORS_ALLOWED_ORIGINS` comme variable à prévoir) ; non configurable sans modification du code | Origines non injectables via env var pour staging/production | **SB7** |

---

## 3. Résumé des statuts

| Catégorie | Critères | Détail |
|---|---|---|
| ✅ Satisfait | **11/15** | C1 C2 C3 C4 C5 C6 C7 C8 C11 C12 C13 |
| ⚠️ Partiel | **3/15** | C9 (URL signée absente), C10 (Redis/storage health absents), C15 (CORS hardcodé) |
| ✗ Non satisfait | **1/15** | C14 (audit logs — module obligatoire §9 absent) |

---

## 4. Bloquants V1 (gaps qui empêchent VALIDE_V1)

### B1 — Audit logs (§9 module obligatoire + §19) — NON SATISFAIT

La spécification classe `AuditModule` comme **module obligatoire** (§9), avec :
- table `audit_logs` (`eventType`, `userId`, `targetId`, `timestamp`, `ipAddress`, `userAgent`) ;
- events couverts : `LOGIN_SUCCESS`, `LOGIN_FAILURE`, `LOGOUT`, `TOKEN_REFRESH`, `FILE_UPLOAD`, `ADMIN_ACCESS` ;
- `@Aspect` Spring AOP ou interceptor dédié.

**Preuve d'absence** : ni `V1__init_schema.sql` ni `V2__add_stored_files.sql` ne contiennent de table `audit_logs` ; `find cores/api-spring/src -name "Audit*.java"` retourne vide.

**Ce bloquant ne peut pas être accepté comme réserve environnementale** — c'est un module fonctionnel absent, pas une contrainte d'infrastructure externe.

### B2 — URL signée pour téléchargement privé (§20) — ABSENT

La spécification (§20) exige :
- "URLs signées (presigned URLs) pour téléchargement de fichiers privés — durée courte, jamais en cache ou log" ;
- séparation public/privé.

**Preuve d'absence** : `FilesController` n'expose que `POST /upload`. Aucun `GET /files/:id`, `GET /files/:id/download-url`, ni génération de presigned URL via `MinioClient`.

**Ce bloquant est lié à la feature de download** — pas seulement au stockage. Il peut cependant être accepté comme réserve non bloquante sous condition d'une décision formelle documentée (voir §5).

### B3-réserve — Health checks incomplets (§33) — PARTIEL acceptable

Redis est complètement absent du runtime (pas de Spring Data Redis, pas de config Redis). Le critère C10 dit "état de la base et du cache" — le cache Redis n'étant pas implémenté (prévu SB7+), le health check Redis ne peut pas exister.

**Verdict** : réserve acceptable par délégation (le health check Redis sera présent quand Redis sera ajouté).

---

## 5. Réserves formellement acceptées

| Réserve | Justification | Impact |
|---|---|---|
| R1 — MinIO TC absent | FakeStorageService est le pattern intentionnel pour les tests unitaires/intégration Spring Boot. `MinioStorageService` existe pour la production. L'absence de TC MinIO est documentée comme différée hors périmètre de la mission upload/CI. | Non bloquant — couverture MinIO réelle à ajouter dans SB7 ou SB8. |
| R2 — CORS origines hardcodées | Valeurs de dev uniquement, sans valeur de production. Spring Security CORS configuré et actif. La variable `CORS_ALLOWED_ORIGINS` est à externaliser dans SB7. | Non bloquant — risque limité au dev local. |
| R3 — Rate limiting absent | §13 mentionne le rate limiting sur endpoints sensibles. Aucune implémentation (Bucket4j, Spring Rate Limiter). | Non bloquant pour V1 — différé SB7+ ou projet dérivé. |
| R4 — Tika/signature binaire absente | Validation MIME basée sur `Content-Type` déclaré (whitelist 14 types). Apache Tika (validation binaire) différé futur. | Non bloquant pour V1 — whitelist déclarative acceptable avec ADR. |
| R5 — Redis/cache absent | Spring Data Redis et cache non implémentés. Health indicator Redis absent par cohérence. | Non bloquant pour V1 — module différé SB7+. |

---

## 6. Décision de statut

**`IMPLEMENTATION_PARTIELLE / CI_JAVA_READY` → `IMPLEMENTATION_AVANCEE`**

### Justification

**Pour la promotion :**
- 11/15 critères §30 pleinement satisfaits avec preuve directe dans le code ;
- Auth complète (login/refresh/me/logout), RBAC @PreAuthorize, Flyway V1+V2, OpenAPI, DTO validation, ApiError, logs sûrs (ADR-040) — tous dans les tests 71/71 ✅ ;
- CI L5 reproductible (`api-spring-ci.yml`) — tout contributeur peut vérifier localement ;
- 5 réserves formellement acceptées (R1→R5).

**Contre VALIDE_V1 :**
- **B1 (audit logs)** : module obligatoire §9 absent — pas de table, pas de service, pas d'events. Ce gap ne peut pas être accepté comme réserve environnementale. Il faut une implémentation réelle.
- **B2 (URL signée)** : §20 exige explicitement les presigned URLs pour le téléchargement privé. Peut être accepté en réserve formelle si décision documentée, mais l'implémentation manque.

### Option B2-réserve-formelle (non retenue dans cette revue)

Il serait possible de déclarer B2 comme réserve formellement acceptée (style RN B3 / Flutter R3) avec justification : "download et URL signée sont des features de lecture différées — l'upload SB4 est le périmètre ciblé V1". Si cette réserve est acceptée, le seul bloquant restant est B1 (audit logs). Cette décision appartient à une mission Spring Boot 7 qui peut soit implémenter B1+B2, soit formaliser B2 comme réserve.

---

## 7. Score §30

**11/15 satisfaits — 3/15 partiels — 1/15 non satisfait**

```
C1  ✅  Démarrage JVM
C2  ✅  PostgreSQL + Flyway
C3  ✅  Auth flow
C4  ✅  Tokens JWT + refresh
C5  ✅  Routes protégées
C6  ✅  RBAC
C7  ✅  Validation DTO
C8  ✅  ApiError stable
C9  ⚠️  Upload (MIME/taille/nommage ✅ — URL signée ✗)
C10 ⚠️  Health (DB auto-✅ — Redis ✗ — storage ✗)
C11 ✅  OpenAPI générée
C12 ✅  Tests TC 71/71
C13 ✅  Aucun secret/token en log
C14 ✗   Audit logs ABSENT (module obligatoire §9)
C15 ⚠️  CORS configuré (origins hardcodées)
```

---

## 8. Prochaine action unique

**API Core Spring Boot 7 — Audit logs + health indicators + download URL signée**

Périmètre proposé :
- `AuditModule` : table `audit_logs` (migration V3), `AuditEvent` enum, `AuditService`, `@Aspect` ou interceptor ; events `LOGIN_SUCCESS/FAILURE`, `LOGOUT`, `TOKEN_REFRESH`, `FILE_UPLOAD`, `ADMIN_ACCESS` ;
- `GET /api/v1/files/:id/download-url` avec `MinioClient.getPresignedObjectUrl()` — presigned URL courte durée (TTL configurable), jamais en cache, jamais loggée ;
- `GET /api/v1/files/:id` : métadonnées sans champs internes ;
- `${CORS_ALLOWED_ORIGINS}` env var injectable ;
- Health indicator MinIO (optionnel — si trivial).

Critère de succès : B1 fermé (audit logs avec tests) + C9 complet (URL signée avec tests).
Après SB7 : relancer la revue V1 avec B1 fermé pour décision VALIDE_V1.
