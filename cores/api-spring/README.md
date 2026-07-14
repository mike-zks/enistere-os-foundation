# API Core Spring Boot

> Statut : **`SPECIFICATION_DOCUMENTAIRE`** (Spring Boot 1, 2026-07-14)
> Spécification cible : [`CORE_SPECIFICATION.md`](./CORE_SPECIFICATION.md)
> Stack cible : Spring Boot 3.x + Spring Security 6.x + PostgreSQL + JPA/Hibernate + Flyway + Redis + MinIO + springdoc-openapi + JUnit 5 + Testcontainers

Socle backend **Java / Spring Boot** générique et réutilisable pour les futures applications Enistere orientées enterprise, finance, administration et systèmes d'information.

Ce core complète l'API Core NestJS (`VALIDE_V1`) en ciblant l'écosystème JVM — Spring Security établi, JPA avec transactions managées, Testcontainers pour tests d'intégration réalistes. Il ne contient aucune logique métier ni aucun code runtime à ce stade.

## Ce que ce core fournira (cible V1)

| Module | Stack | Notes |
|---|---|---|
| Auth JWT | Spring Security 6 + JWT | access token court, refresh token persisté, rotation, révocation, logout serveur |
| RBAC | Spring Security Method Security | `@PreAuthorize`, `@Roles`, `@Permissions` |
| Gestion utilisateurs | Spring Data JPA + PostgreSQL | profil courant, statut actif, association rôles, soft delete |
| Validation | Jakarta Bean Validation | `@Valid`, `MethodValidationPostProcessor`, contraintes custom |
| Gestion erreurs | `@ControllerAdvice` | `ApiError` stable sans stack trace en production |
| Migrations | Flyway | `V{n}__description.sql`, seed séparé local/test/production |
| Logs structurés | SLF4J / Logback | jamais de secret, token ou donnée personnelle |
| Audit logs | Table `audit_logs` + AOP | login/logout/refresh/rôles/upload/suppression |
| Upload fichiers | MinIO / S3 Java SDK | validation MIME/taille/extension, nommage UUID, URLs signées courtes |
| Cache | Spring Data Redis | conventions clés+TTL, blacklist refresh tokens révoqués, dégradation gracieuse |
| Jobs asynchrones | Spring `@Async` + Scheduler | tâches légères idempotentes, planification |
| Mail minimal | Spring Mail | abstraction fournisseur, envoi asynchrone, logs sans contenu |
| Health checks | Spring Boot Actuator | db/redis/storage/readiness/liveness |
| Documentation API | springdoc-openapi | export YAML versionné, compatible `@enistere/api-contracts` |
| Tests | JUnit 5 + Testcontainers | unit services + integration contrôleurs + auth + RBAC + migrations |

## Statut actuel

```txt
cores/api-spring/
├── CORE_SPECIFICATION.md   ← Spring Boot 1 (42 sections)
└── README.md               ← Spring Boot 1
```

Aucun starter, aucun `pom.xml`, aucun code Java, aucune dépendance.

## Stack technique

| Composant | Choix retenu | Décision |
|---|---|---|
| Framework | Spring Boot 3.x (LTS) | Roadmap §16 |
| Sécurité | Spring Security 6.x | Standard Spring Boot |
| ORM | Spring Data JPA / Hibernate | Standard Spring Data |
| Base de données | PostgreSQL | Cloud Core + API NestJS alignés |
| Migrations | Flyway | Décision Spring Boot 2 |
| Cache | Spring Data Redis | Cloud Core Redis |
| Stockage | MinIO / S3 Java SDK | Cloud Core MinIO aligné |
| OpenAPI | springdoc-openapi | Compatibilité `@enistere/api-contracts` |
| Tests | JUnit 5 + Testcontainers | §06_DEPENDENCY_STRATEGY.md |
| Build | Maven ou Gradle | **ADR pendante — tranchée en Spring Boot 2** |

## Cohérence avec API Core NestJS

Les deux API cores partagent les **intentions** (auth JWT, RBAC, OpenAPI, fichiers, audit, sécurité) sans dupliquer l'implémentation. Voir `CORE_SPECIFICATION.md §42` pour le tableau de correspondance complet.

## Décisions pendantes

Voir `CORE_SPECIFICATION.md §40` — les principales :

- Maven vs Gradle (build system) — ADR avant mission Spring Boot 2
- validation avancée (Jakarta BV suffit pour V1)
- cache local Caffeine vs Redis selon cas d'usage
- queue broker (Spring Async vs RabbitMQ/Kafka si volume requiert un broker)

## Missions ordonnées

| # | Mission | Livrable |
|---|---|---|
| Spring Boot 1 | Core specification | `CORE_SPECIFICATION.md` + `README.md` ✅ |
| Spring Boot 2 | Starter minimal | build system + structure `src/` + Spring Security + JWT + auth flow |
| Spring Boot 3 | PostgreSQL + JPA + Flyway + RBAC | entités, migrations, rôles, permissions |
| Spring Boot 4 | OpenAPI + Upload MinIO | springdoc + MinIO SDK + upload service |
| Spring Boot 5 | Tests + CI | JUnit + Testcontainers + health checks |
| Spring Boot V1 | Readiness review | rapport V1 — critères §30 vérifiés |
