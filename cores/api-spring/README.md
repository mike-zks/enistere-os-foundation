# API Core Spring Boot

> Statut : **`STARTER_INITIALISE`** (Spring Boot 2, 2026-07-15)
> Spécification cible : [`CORE_SPECIFICATION.md`](./CORE_SPECIFICATION.md)
> Stack : Spring Boot 4.1.0 + Spring Security 7.1.0 + JJWT 0.12.6 + Java 21 (Maven — ADR-041)

Socle backend **Java / Spring Boot** générique et réutilisable pour les futures applications Enistere orientées enterprise, finance, administration et systèmes d'information.

## Lancer le projet

```bash
# Prérequis : Java 21 (SDKMAN recommandé)
sdk use java 21.0.9-librca

# Lancer les tests
./mvnw test

# Build complet (compile + test + package)
./mvnw verify

# Lancer l'application
./mvnw spring-boot:run

# Variables d'environnement (production obligatoires)
export JWT_SECRET=<votre-secret-min-32-bytes-cryptographiquement-aleatoire>
export STUB_USERNAME=admin@votredomaine.com
export STUB_PASSWORD=<votre-mot-de-passe>
```

## Structure actuelle (Spring Boot 2)

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
│   │   │   ├── JwtConfig.java        ← @ConfigurationProperties(enistere.security.jwt)
│   │   │   └── SecurityConfig.java   ← STATELESS, JWT filter, CORS, no CSRF
│   │   ├── common/exception/
│   │   │   ├── ApiError.java         ← {status, code, message, errors, timestamp, path}
│   │   │   └── GlobalExceptionHandler.java
│   │   ├── infrastructure/security/
│   │   │   ├── JwtTokenProvider.java ← générer/valider/extraire JWT (JJWT 0.12.x)
│   │   │   └── JwtAuthenticationFilter.java ← OncePerRequestFilter, Bearer header
│   │   └── modules/auth/
│   │       ├── AuthController.java   ← /api/v1/auth/{login,me,logout,refresh}
│   │       └── dto/
│   │           ├── LoginRequestDto.java
│   │           ├── LoginResponseDto.java
│   │           └── MeResponseDto.java
│   └── resources/
│       └── application.yml
├── src/test/
│   ├── java/com/enistere/core/
│   │   ├── EnistereCoreApplicationTests.java
│   │   ├── infrastructure/security/JwtTokenProviderTest.java  ← 7 tests
│   │   └── modules/auth/AuthControllerTest.java              ← 10 tests
│   └── resources/
│       └── application-test.yml
├── CORE_SPECIFICATION.md             ← 42 sections (Spring Boot 1)
└── README.md
```

## Endpoints disponibles

| Méthode | Route | Auth | Description |
|---|---|---|---|
| `POST` | `/api/v1/auth/login` | Public | Connexion stub → JWT access token |
| `GET` | `/api/v1/auth/me` | JWT requis | Email depuis token |
| `POST` | `/api/v1/auth/logout` | JWT requis | Stateless (client supprime le token) |
| `POST` | `/api/v1/auth/refresh` | JWT requis | 501 — refresh persistance (Spring Boot 3) |
| `GET` | `/actuator/health` | Public | Status UP/DOWN |
| `GET` | `/actuator/info` | Public | Infos application |

## Sécurité

- **STATELESS** — aucune session serveur, `SessionCreationPolicy.STATELESS`
- **JWT** — access token 15 min, JJWT 0.12.x, HS256, signature vérifiée par requête
- **Spring Security 7.x** — toutes routes protégées par défaut, filtre JWT avant UsernamePasswordAuthenticationFilter
- **CSRF désactivé** — REST API stateless
- **CORS** — origines configurables, dev defaults `localhost:{3000,4200,8080,8081,19006}`
- **Erreurs** — `ApiError` sans stack trace en production
- **Secrets** — jamais dans le code source ; env vars `JWT_SECRET`, `STUB_USERNAME`, `STUB_PASSWORD`

## Auth stub (temporaire — Spring Boot 3 remplacera par DB)

```yaml
# application.yml par défaut (dev uniquement)
enistere:
  security:
    stub:
      username: ${STUB_USERNAME:admin@enistere.dev}
      password: ${STUB_PASSWORD:dev-password-not-for-production}
```

Le stub valide les credentials en mémoire et émet un vrai JWT (cryptographie réelle). Aucune persistance. Le refresh token (`501`) nécessite PostgreSQL — Spring Boot 3.

## Tests (18/18 ✅)

```
JwtTokenProviderTest  : 7 tests — génération, validation, extraction, tampering
AuthControllerTest    : 10 tests — login/me/logout/refresh/health + auth non valide
EnistereCoreApplicationTests : 1 test — context loads
```

```bash
./mvnw test      # unit + integration (18 tests)
./mvnw verify    # compile + test + package
```

## Décisions prises

| Décision | Valeur | ADR |
|---|---|---|
| Build system | Maven + Spring Boot Parent POM | ADR-041 |
| Spring Boot | 4.1.0 (stable, Java 21) | ADR-041 |
| JWT library | JJWT 0.12.6 | — |
| Auth stub | credentials config + JWT réel, sans DB | §30 Spring Boot 3 |
| Refresh token | 501 Not Implemented | §14 — DB requise |

## Missions ordonnées

| # | Mission | Livrable | Statut |
|---|---|---|---|
| Spring Boot 1 | Core specification | `CORE_SPECIFICATION.md` + `README.md` | ✅ `SPECIFICATION_DOCUMENTAIRE` |
| Spring Boot 2A | ADR build system | `ADR-041-build-system-api-spring-maven-vs-gradle.md` | ✅ |
| Spring Boot 2 | Starter minimal | `pom.xml` + src/ + Spring Security + JWT + auth flow | ✅ `STARTER_INITIALISE` |
| Spring Boot 3 | PostgreSQL + JPA + Flyway + RBAC | entités, migrations, rôles, permissions | ⏳ |
| Spring Boot 4 | OpenAPI + Upload MinIO | springdoc + MinIO SDK + upload service | ⏳ |
| Spring Boot 5 | Tests + CI | JUnit + Testcontainers + health checks | ⏳ |
| Spring Boot V1 | Readiness review | rapport V1 — critères §30 vérifiés | ⏳ |
