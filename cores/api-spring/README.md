# API Core Spring Boot

> Statut : **`IMPLEMENTATION_PARTIELLE`** — sous-statut `PERSISTENCE_RBAC_READY` (Spring Boot 3, 2026-07-15)
> Spécification cible : [`CORE_SPECIFICATION.md`](./CORE_SPECIFICATION.md)
> Stack : Spring Boot 4.1.0 + Spring Security 7.1.0 + JJWT 0.12.6 + PostgreSQL + Flyway 11 + Java 21 (Maven — ADR-041)

Socle backend **Java / Spring Boot** générique et réutilisable pour les futures applications Enistere orientées enterprise, finance, administration et systèmes d'information.

## Lancer le projet

```bash
# Prérequis : Java 21 (SDKMAN recommandé)
sdk use java 21.0.9-librca

# Lancer les tests (nécessite Docker — Testcontainers démarre PostgreSQL automatiquement)
./mvnw test

# Build complet (compile + test + package)
./mvnw verify

# Lancer l'application (nécessite PostgreSQL)
./mvnw spring-boot:run

# Variables d'environnement (production obligatoires)
export JWT_SECRET=<votre-secret-min-32-bytes-cryptographiquement-aleatoire>
export DB_URL=jdbc:postgresql://localhost:5432/enistere_dev
export DB_USERNAME=enistere
export DB_PASSWORD=<votre-mot-de-passe>
```

## Structure actuelle (Spring Boot 3)

```
cores/api-spring/
├── pom.xml                           ← Spring Boot 4.1.0 Parent POM (ADR-041 : Maven)
├── mvnw / mvnw.cmd                   ← Maven Wrapper 3.9.12
├── .mvn/wrapper/
│   └── maven-wrapper.properties
├── src/main/
│   ├── java/com/enistere/core/
│   │   ├── EnistereCoreApplication.java
│   │   ├── config/
│   │   │   ├── Argon2Config.java     ← @ConfigurationProperties(enistere.security.argon2)
│   │   │   ├── DatabaseConfig.java   ← @EnableJpaAuditing
│   │   │   ├── JwtConfig.java        ← @ConfigurationProperties(enistere.security.jwt)
│   │   │   └── SecurityConfig.java   ← STATELESS, JWT filter, CORS, RBAC, DaoAuthProvider
│   │   ├── common/exception/
│   │   │   ├── ApiError.java
│   │   │   └── GlobalExceptionHandler.java
│   │   ├── infrastructure/
│   │   │   ├── persistence/
│   │   │   │   └── BaseEntity.java   ← @MappedSuperclass, UUID PK, @CreatedDate/@LastModifiedDate
│   │   │   └── security/
│   │   │       ├── EnistereUserDetailsService.java ← DB-backed UserDetailsService
│   │   │       ├── JwtAuthenticationFilter.java    ← lit permissions[] du JWT
│   │   │       └── JwtTokenProvider.java           ← generateAccessToken(email, userId, permissions)
│   │   └── modules/
│   │       ├── admin/
│   │       │   └── AdminController.java   ← GET /api/v1/admin/ping (@PreAuthorize)
│   │       ├── auth/
│   │       │   ├── AuthController.java    ← login / me / logout / refresh
│   │       │   ├── AuthService.java       ← auth DB, Argon2 verify, tokens, refresh rotation
│   │       │   ├── RefreshToken.java      ← entité (hash SHA-256 uniquement)
│   │       │   ├── RefreshTokenRepository.java
│   │       │   └── dto/
│   │       │       ├── LoginRequestDto.java
│   │       │       ├── LoginResponseDto.java  ← accessToken + refreshToken
│   │       │       ├── LogoutRequestDto.java
│   │       │       ├── MeResponseDto.java     ← userId, email, roles[], permissions[]
│   │       │       └── RefreshRequestDto.java
│   │       ├── permissions/
│   │       │   ├── Permission.java       ← entité JPA
│   │       │   └── PermissionRepository.java
│   │       ├── roles/
│   │       │   ├── Role.java             ← entité JPA (@ManyToMany permissions)
│   │       │   └── RoleRepository.java
│   │       └── users/
│   │           ├── User.java             ← entité JPA (passwordHash, @ManyToMany roles)
│   │           └── UserRepository.java
│   └── resources/
│       ├── application.yml
│       └── db/migration/
│           └── V1__init_schema.sql       ← 6 tables, 5 indexes (Flyway — autorité du schéma)
├── src/test/
│   ├── java/com/enistere/core/
│   │   ├── AbstractIntegrationTest.java      ← singleton TC container + @DynamicPropertySource
│   │   ├── EnistereCoreApplicationTests.java
│   │   ├── FlywayMigrationTest.java          ← 4 tests — tables et indexes
│   │   ├── TestDataFactory.java              ← helpers user/role/permission en base
│   │   ├── infrastructure/security/
│   │   │   └── JwtTokenProviderTest.java     ← 9 tests
│   │   └── modules/
│   │       ├── admin/RbacIntegrationTest.java   ← 5 tests RBAC
│   │       └── auth/
│   │           ├── AuthControllerTest.java      ← 10 tests
│   │           └── AuthIntegrationTest.java     ← 14 tests
│   └── resources/
│       └── application-test.yml
├── CORE_SPECIFICATION.md             ← 42 sections (Spring Boot 1)
└── README.md
```

## Endpoints disponibles

| Méthode | Route | Auth | Description |
|---|---|---|---|
| `POST` | `/api/v1/auth/login` | Public | Connexion DB → access token + refresh token |
| `GET` | `/api/v1/auth/me` | JWT requis | userId, email, roles, permissions |
| `POST` | `/api/v1/auth/logout` | JWT requis | Révoque le refresh token ; sans body → 204 no-op |
| `POST` | `/api/v1/auth/refresh` | Public | Rotation refresh token → nouvelle paire |
| `GET` | `/api/v1/admin/ping` | JWT + `admin.access` | Probe RBAC — `@PreAuthorize("hasAuthority('admin.access')")` |
| `GET` | `/actuator/health` | Public | Status UP/DOWN |
| `GET` | `/actuator/info` | Public | Infos application |

## Sécurité

- **STATELESS** — aucune session serveur, `SessionCreationPolicy.STATELESS`
- **JWT claims** — `sub` (email) + `userId` (UUID) + `permissions` (List) ; access token 15 min (test : 60 s)
- **Argon2id** — `Argon2PasswordEncoder` (ADR-039) — mémoire 64 MB, 3 itérations, parallelism 1 ; test : 4 MB, 1 iter
- **Refresh token rotation** — token brut 256-bit aléatoire, hash SHA-256 (64 hex) stocké en base ; révoqué à chaque usage
- **RBAC** — `@EnableMethodSecurity` + `@PreAuthorize("hasAuthority(...)")` ; permissions issues du JWT (stateless)
- **Spring Security 7.x** — `DaoAuthenticationProvider(userDetailsService)` + `AuthenticationManager`
- **CSRF désactivé** — REST API stateless
- **CORS** — origines configurables, dev defaults `localhost:{3000,4200,8080,8081,19006}`
- **Erreurs** — `ApiError` sans stack trace ; `AccessDeniedException`/`AuthenticationException` propagées à Spring Security
- **Secrets** — jamais dans le code source ; env vars `JWT_SECRET`, `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`
- **JPA entities** — jamais exposées directement en HTTP (DTOs dédiés uniquement)

## Flyway — schéma DB

Flyway est l'autorité unique sur le schéma (`ddl-auto: none`). Migration `V1__init_schema.sql` :

| Table | Description |
|---|---|
| `users` | Comptes utilisateurs (`email`, `password_hash` Argon2) |
| `roles` | Rôles nommés |
| `permissions` | Permissions nommées (`admin.access`, etc.) |
| `user_roles` | Table de jonction M2M users ↔ roles |
| `role_permissions` | Table de jonction M2M roles ↔ permissions |
| `refresh_tokens` | Hash SHA-256 des refresh tokens, `expires_at`, `revoked_at` |

## Tests (43/43 ✅)

```
JwtTokenProviderTest     :  9 tests — génération, validation, extraction userId/permissions
FlywayMigrationTest      :  4 tests — tables et indexes (Testcontainers PostgreSQL 16-alpine)
AuthControllerTest       : 10 tests — login/me/logout/refresh/health
AuthIntegrationTest      : 14 tests — login valid/invalid, me, refresh rotation, logout, format erreur
RbacIntegrationTest      :  5 tests — admin 200, user 403, unauthenticated 401, /me permissions
EnistereCoreApplicationTests :  1 test — context loads
```

```bash
# Prérequis : Docker (Testcontainers)
./mvnw test      # 43 tests (unit + integration Testcontainers)
./mvnw verify    # compile + test + package
```

## Décisions prises

| Décision | Valeur | ADR / §ref |
|---|---|---|
| Build system | Maven + Spring Boot Parent POM | ADR-041 |
| Spring Boot | 4.1.0 (stable, Java 21) | ADR-041 |
| JWT library | JJWT 0.12.6 | — |
| Password hashing | Argon2id via `Argon2PasswordEncoder` + Bouncy Castle | ADR-039 |
| Migrations DB | Flyway 11.x + `flyway-database-postgresql` + `spring-boot-starter-flyway` | §12 |
| JPA | Spring Data JPA + Hibernate 6.x + UUID PK | §12 |
| Refresh token | Hash SHA-256 (64 hex) stocké, token brut retourné une fois | §14 |
| RBAC | `@PreAuthorize` + permissions dans JWT (stateless) | §13 |
| Tests | Testcontainers singleton + `@DynamicPropertySource` | §30 |

## Missions ordonnées

| # | Mission | Livrable | Statut |
|---|---|---|---|
| Spring Boot 1 | Core specification | `CORE_SPECIFICATION.md` + `README.md` | ✅ `SPECIFICATION_DOCUMENTAIRE` |
| Spring Boot 2A | ADR build system | `ADR-041-build-system-api-spring-maven-vs-gradle.md` | ✅ |
| Spring Boot 2 | Starter minimal | `pom.xml` + src/ + Spring Security + JWT + auth flow | ✅ `STARTER_INITIALISE` |
| Spring Boot 3 | PostgreSQL + JPA + Flyway + RBAC | entités, migrations, rôles, permissions, 43 tests | ✅ `IMPLEMENTATION_PARTIELLE / PERSISTENCE_RBAC_READY` |
| Spring Boot 4 | OpenAPI + Upload MinIO | springdoc + MinIO SDK + upload service | ⏳ |
| Spring Boot 5 | Tests + CI | JUnit + Testcontainers + health checks | ⏳ |
| Spring Boot V1 | Readiness review | rapport V1 — critères §30 vérifiés | ⏳ |
