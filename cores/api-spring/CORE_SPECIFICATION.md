# API Core Spring Boot — Spécification du Core

## 1. Résumé exécutif

Le **API Core Spring Boot** définit le socle backend Java de référence pour les futures APIs Enistere orientées enterprise, finance, administration et systèmes d'information.

Il doit fournir une base modulaire, sécurisée, testable et extensible pour construire des APIs robustes sans réinventer à chaque projet l'authentification, les utilisateurs, les rôles, les permissions, la validation, les erreurs, les logs, l'audit, les uploads, le cache, les queues, la documentation OpenAPI et les health checks.

Cette spécification est documentaire. Elle ne crée aucun projet Spring Boot, `pom.xml`, `build.gradle`, code Java, dossier `src/` ou runtime. Aucune dépendance Java n'est installée.

**Positionnement** : Spring Boot complète l'API Core NestJS (`VALIDE_V1`) en ciblant les besoins enterprise Java — écosystème JVM mature, Spring Security établi, JPA/Hibernate avec transactions managées, Testcontainers pour tests d'intégration réalistes. Les deux API cores partagent les mêmes **intentions** (auth, RBAC, OpenAPI, fichiers, audit, sécurité) sans dupliquer l'implémentation.

---

## 2. Rôle du core

Le API Core Spring Boot cadre la base backend Java des projets Enistere enterprise.

Il doit :

- standardiser l'architecture des APIs Spring Boot Enistere ;
- définir les modules techniques Java communs ;
- intégrer les exigences de sécurité dès la conception (Spring Security, validation Jakarta Bean Validation, audit) ;
- faciliter l'intégration avec les cores mobile, web, cloud et qualité ;
- exposer un contrat OpenAPI compatible avec `@enistere/api-contracts` et `@enistere/api-client-fetch` ;
- éviter les choix techniques divergents entre projets Java Enistere ;
- rester générique, sans logique métier spécifique à Kivvoo, Bailo, RFashion, Vox Pulse, CIVIS ID ou tout autre projet dérivé.

---

## 3. Objectifs

- Fournir un starter API Spring Boot robuste, modulaire et production-ready à terme.
- Standardiser les patterns Spring Boot utilisés dans l'écosystème Enistere.
- Intégrer une authentification JWT avec refresh token sécurisé (Spring Security).
- Supporter RBAC et permissions fines (Spring Security Method Security).
- Standardiser la validation des entrées (Jakarta Bean Validation).
- Centraliser la gestion des exceptions (`@ControllerAdvice`).
- Fournir des logs exploitables (SLF4J/Logback structuré) et des audit logs sur actions sensibles.
- Prévoir cache Redis, jobs asynchrones, upload MinIO/S3, mail et notifications.
- Exposer une documentation OpenAPI / Swagger maintenable (springdoc-openapi).
- Préparer des tests unitaires JUnit + tests d'intégration Testcontainers.
- Rester cohérent avec l'API Core NestJS en termes de contrats, de sécurité et de standards — sans dupliquer son implémentation.

---

## 4. Problèmes à résoudre

Le core doit éviter :

- la duplication d'architectures Spring Boot entre projets ;
- les implémentations auth divergentes ;
- les validations d'entrées incohérentes ou absentes ;
- les exceptions non standardisées exposant des stack traces en production ;
- les logs contenant des secrets, tokens ou données personnelles inutiles ;
- les dépendances ajoutées sans justification (voir §06_DEPENDENCY_STRATEGY.md) ;
- les uploads non sécurisés ;
- les permissions codées de manière ad hoc dans les contrôleurs ;
- la documentation API absente ou non synchronisée ;
- les tests critiques oubliés ;
- la confusion avec l'API Core NestJS — les deux cores sont complémentaires, pas concurrents.

---

## 5. Périmètre fonctionnel

Le API Core Spring Boot couvre le socle technique commun suivant :

- configuration applicative Spring Boot ;
- connexion base de données PostgreSQL (Spring Data JPA / Hibernate) ;
- migrations de schéma (Flyway ou Liquibase) ;
- authentification JWT (Spring Security) ;
- gestion des utilisateurs ;
- rôles et permissions (RBAC Spring Security Method Security) ;
- validation des entrées (Jakarta Bean Validation) ;
- gestion centralisée des exceptions (`@ControllerAdvice`) ;
- logs applicatifs structurés (SLF4J/Logback) ;
- audit logs des actions sensibles ;
- cache Redis (Spring Data Redis) ;
- upload fichiers MinIO/S3 (S3 SDK ou Minio Java SDK) ;
- mail minimal (Spring Mail) ;
- notifications minimales ;
- jobs asynchrones (Spring Scheduler ou Spring Batch minimal) ;
- documentation OpenAPI / Swagger (springdoc-openapi) ;
- health checks (Spring Boot Actuator) ;
- intégration avec Cloud Core, Mobile Core, Web Core et Quality Core.

---

## 6. Hors périmètre

Le core ne doit pas contenir :

- logique métier propre à un produit ;
- modules e-commerce, livraison, immobilier, finance ou administration spécifiques ;
- règles de commission, paiement projet ou workflow métier ;
- secrets réels ;
- configuration production propre à un client ;
- déploiement cloud complet ;
- code runtime Java dans cette spécification ;
- choix définitif Maven vs Gradle sans ADR ;
- choix définitif JPA provider (Hibernate est le défaut Spring Data, aucune alternative ne doit être retenue sans ADR) ;
- implémentation Spring Batch avancée sans ADR.

---

## 7. Architecture cible

L'architecture cible suit les standards Java Enistere (`strategy/08_STANDARDS.md §16`) :

- **packages organisés par domaine** (feature package structure) ;
- **DTO séparés des entités** — entités JPA restent dans la couche persistence, DTO dans la couche API ;
- **controllers légers** — délèguent aux services, aucune logique métier dans les contrôleurs ;
- **services dédiés** — un service par responsabilité ;
- **validation centralisée** — Jakarta Bean Validation sur les DTO, `@ControllerAdvice` pour les exceptions ;
- **sécurité appliquée par défaut** — toute route non explicitement publique est protégée.

Principes transversaux :

- les modules techniques communs sont isolés dans des packages dédiés ;
- la configuration est centralisée et validée au démarrage ;
- les dépendances externes sont encapsulées (pas d'appel SDK direct dans les contrôleurs) ;
- les interfaces publiques sont documentées via OpenAPI.

Technologies cibles (sans installation à ce stade) :

```txt
Spring Boot 3.x (LTS)
Spring Security 6.x
Spring Data JPA
Hibernate (provider JPA par défaut)
PostgreSQL
Flyway (migrations)
Redis
MinIO / S3
Maven ou Gradle (à trancher par ADR)
springdoc-openapi
SLF4J / Logback
JUnit 5
Testcontainers
```

---

## 8. Structure cible du futur starter

Structure indicative (non créée dans cette mission) :

```txt
cores/api-spring/
├── README.md
├── CORE_SPECIFICATION.md
├── pom.xml ou build.gradle           ← à créer en Spring Boot 1
├── src/
│   ├── main/
│   │   ├── java/com/enistere/core/
│   │   │   ├── EnistereCoreApplication.java
│   │   │   ├── config/
│   │   │   │   ├── SecurityConfig.java
│   │   │   │   ├── JwtConfig.java
│   │   │   │   └── OpenApiConfig.java
│   │   │   ├── common/
│   │   │   │   ├── exception/
│   │   │   │   │   ├── GlobalExceptionHandler.java
│   │   │   │   │   └── ApiError.java
│   │   │   │   ├── validation/
│   │   │   │   └── util/
│   │   │   ├── infrastructure/
│   │   │   │   ├── security/
│   │   │   │   │   ├── JwtTokenProvider.java
│   │   │   │   │   └── JwtAuthenticationFilter.java
│   │   │   │   ├── persistence/
│   │   │   │   │   └── BaseEntity.java
│   │   │   │   ├── cache/
│   │   │   │   └── storage/
│   │   │   └── modules/
│   │   │       ├── auth/
│   │   │       ├── users/
│   │   │       ├── roles/
│   │   │       ├── permissions/
│   │   │       ├── files/
│   │   │       ├── audit/
│   │   │       └── health/
│   │   └── resources/
│   │       ├── application.yml
│   │       ├── application-local.yml
│   │       ├── application-test.yml
│   │       └── db/migration/           ← Flyway
└── src/test/
    └── java/com/enistere/core/
        ├── unit/
        └── integration/
```

Cette structure est cible. Elle ne doit pas être créée pendant cette mission de spécification.

---

## 9. Modules obligatoires

Les modules et capacités obligatoires du futur starter sont :

- **SecurityConfig** : configuration Spring Security — filtre JWT, CORS strict, CSRF désactivé pour API stateless, protection des routes, exception handlers `AuthenticationEntryPoint`/`AccessDeniedHandler`.
- **JwtTokenProvider** : génération, validation et lecture des tokens JWT (access + refresh). Secrets hors Git.
- **AuthModule** : login, refresh token, logout. Stratégies : `UsernamePasswordAuthenticationProvider` + `JwtAuthenticationFilter`.
- **UsersModule** : gestion utilisateur minimale, profil courant (`/auth/me`), association aux rôles.
- **RolesModule** : définition et attribution des rôles.
- **PermissionsModule** : permissions fines, `@PreAuthorize`, `@PostAuthorize`, method security.
- **HealthModule** : Spring Boot Actuator — health, readiness, liveness ; vérification database, Redis, stockage.
- **GlobalExceptionHandler** : `@ControllerAdvice` — format `ApiError` stable, sans stack trace en production, codes HTTP conventionnels.
- **ValidationConfig** : Jakarta Bean Validation global, `@Valid` sur tous les DTO entrants, messages d'erreur exploitables.
- **LoggingConfig** : SLF4J/Logback structuré — jamais de secret, token ou donnée personnelle dans les logs.
- **AuditModule** : audit logs des actions sensibles (voir §19).
- **OpenApiConfig** : springdoc-openapi — documentation versionnée, protection en production si nécessaire.
- **CacheConfig** : Spring Data Redis — conventions de clés, TTL, invalidation, comportement Redis absent.
- **StorageModule** : upload MinIO/S3 — validation taille, MIME, extension ; noms sûrs ; accès signé.

---

## 10. Modules optionnels

Ces modules doivent être activables selon les besoins projet sans être imposés par défaut :

- **MailModule** : Spring Mail — abstraction fournisseur, envoi asynchrone recommandé, logs sans contenu sensible.
- **NotificationModule** : notifications internes ou sortantes, templates standardisés.
- **SchedulerModule** : Spring Scheduler ou Spring Batch minimal — jobs idempotents, retry contrôlé.
- **RealtimeModule** : WebSocket Spring — authentification connexion, rooms/permissions, rate limiting.
- **SearchModule** : recherche texte ou intégration moteur si validé.
- **AdminModule** : capacités backoffice génériques.
- **WebhookModule** : exposition et consommation de webhooks sécurisés.
- **ReportModule** : exports, rapports et fichiers générés.

Chaque module optionnel doit être justifié dans le projet dérivé qui l'active.

---

## 11. Modules futurs

Les modules futurs peuvent inclure :

- multi-tenancy ;
- API keys pour intégrations serveur à serveur ;
- rate limiting avancé par utilisateur, IP ou tenant ;
- event bus interne (Spring Events ou message broker) ;
- observabilité avancée (Micrometer + Prometheus/Grafana) ;
- génération de clients OpenAPI ;
- module d'anonymisation ou suppression de données personnelles (RGPD) ;
- SSE (Server-Sent Events) pour push léger.

Ces modules nécessiteront une validation de roadmap et, pour les choix structurants, un ADR.

---

## 12. Standards API

Le core doit définir des standards pour :

- **versioning** : préfixe `/api/v1/` sur toutes les routes ;
- **format de réponse** : enveloppe JSON cohérente ou réponse directe selon convention retenue par ADR ;
- **format d'erreur** : `ApiError` { `status`, `code`, `message`, `timestamp`, `path` } — sans stack trace en production ;
- **pagination** : `Page<T>` Spring Data — `page`, `size`, `totalElements`, `totalPages` ;
- **codes HTTP** : 200/201/204/400/401/403/404/409/413/415/422/429/500/503 — documentés et stables ;
- **messages d'erreur** : exploitables pour debug, non sensibles (pas de SQL, pas de stack trace) ;
- **documentation OpenAPI** : springdoc-openapi, export YAML versionné, compatible `@enistere/api-contracts` ;
- **compatibilité mobile/web** : endpoints stables, erreurs structurées, tokens JWT standard Bearer.

Les endpoints doivent rester explicites, testables et documentés.

---

## 13. Standards sécurité

Le core doit appliquer (cf. `strategy/07_SECURITY.md §20.2`) :

- **Spring Security** activé par défaut sur toutes les routes ;
- **validation DTO** systématique via Jakarta Bean Validation (`@Valid`) ;
- **exception handler** global sans fuite de stack trace ou secret en production ;
- **method security** (`@PreAuthorize`/`@PostAuthorize`) pour permissions fines ;
- **audit logs** sur actions sensibles (login, logout, refresh, changement rôle, upload, suppression) ;
- **CORS strict** — origines autorisées uniquement, hors Git ;
- **OpenAPI protégé** en production si nécessaire — pas d'exposition des endpoints admin non protégés ;
- **secrets hors Git** — JWT secrets, database password, MinIO credentials jamais versionnés ;
- **logs sans secret** — masquage systématique des tokens, passwords, clés ;
- **rate limiting** sur endpoints sensibles (auth, upload) — Spring Security ou filtre dédié ;
- **Helmet-equivalent** : headers de sécurité HTTP (`X-Content-Type-Options`, `X-Frame-Options`, `Strict-Transport-Security` si HTTPS, `Cache-Control`) via `HttpSecurity.headers()` ;
- **OWASP Dependency Check** ou équivalent pour audit des dépendances Java.

---

## 14. Authentification

L'authentification cible repose sur Spring Security + JWT :

- **access token JWT court** (15 min recommandé) — signé avec secret fort hors Git, envoyé en `Authorization: Bearer` ;
- **refresh token plus long** (7j–30j) — stocké en base de données ou Redis, invalidable individuellement ;
- **rotation du refresh token** recommandée — chaque utilisation génère un nouveau refresh token, invalide l'ancien ;
- **révocation** — table `refresh_tokens` ou Redis Set pour invalidation serveur ;
- **logout serveur** — invalide le refresh token sans attendre expiration ;
- **`JwtAuthenticationFilter`** — extrait et valide le token sur chaque requête avant les contrôleurs ;
- **`@CurrentUser`** ou `@AuthenticationPrincipal` — récupère l'utilisateur authentifié dans les contrôleurs ;
- **`@Public`** — marque explicitement les routes non protégées.

Stratégie de stockage côté client :

- web : cookie `HttpOnly`, `Secure` en production, `SameSite=Strict` ou `Lax` selon stratégie (cf. Web Core Next.js BFF Auth) ;
- mobile : `flutter_secure_storage` (Flutter) ou SecureStore (React Native) — jamais de token en mémoire partagée.

---

## 15. Autorisation, rôles et permissions

Le core doit supporter :

- **RBAC** — rôles assignés aux utilisateurs, rôles associés aux permissions ;
- **permissions fines** — `@PreAuthorize("hasPermission(#id, 'resource', 'action')")` ou `hasAuthority('permission.name')` ;
- **Spring Security Method Security** — `@EnableMethodSecurity` activé globalement ;
- **guards dédiés** — `AccessDeniedHandler` et `AuthenticationEntryPoint` personnalisés, réponses JSON non verbeux ;
- **`@Roles`** et **`@Permissions`** annotations maison si nécessaire ;
- séparation claire entre identité (utilisateur), rôle (ensemble de permissions) et permission (action sur ressource).

Les permissions ne doivent pas être codées en dur dans les contrôleurs — elles doivent être déclarées et vérifiées via Spring Security.

---

## 16. Gestion des utilisateurs

Le `UsersModule` doit prévoir :

- modèle `User` minimal : `id`, `email` (unique, index), `passwordHash` (bcrypt), `isActive`, `createdAt`, `updatedAt` ;
- récupération du profil courant (`GET /auth/me`) ;
- création utilisateur via auth flow (register ou admin) ;
- statut actif/inactif — routes protégées refusent les utilisateurs inactifs ;
- association aux rôles via table de liaison `user_roles` ;
- champs auditables (`createdAt`, `updatedAt`, `lastLoginAt`) ;
- conventions de suppression — soft delete recommandé (champ `deletedAt`) pour audit ;
- extension possible par les projets dérivés sans modifier le core.

Le core ne doit pas imposer de profil métier spécifique (nom, prénom, téléphone, adresse — ce sont des données projet).

---

## 17. Validation des données

Toutes les entrées doivent être validées via **Jakarta Bean Validation** :

- body (DTO annotés `@Valid`) ;
- query params (`@RequestParam` + `@Validated` au niveau contrôleur) ;
- route params (`@PathVariable` + format attendu) ;
- fichiers uploadés (taille, MIME, extension dans le service) ;
- variables d'environnement (validation au démarrage via `@ConfigurationProperties` + `@Validated`) ;
- données venant d'APIs externes (avant mapping vers entités).

Un `MethodValidationPostProcessor` global active la validation sur tous les contrôleurs. Les erreurs de validation retournent HTTP 400 avec le détail des champs invalides (sans fuite de données internes).

Le choix des annotations (`@NotNull`, `@Size`, `@Email`, contraintes custom) doit rester cohérent entre DTO de même domaine.

---

## 18. Gestion des erreurs

Le core doit standardiser via `@ControllerAdvice` (`GlobalExceptionHandler`) :

- `MethodArgumentNotValidException` → 400 + champs invalides listés ;
- `ConstraintViolationException` → 400 ;
- `AuthenticationException` → 401 générique sans information sur l'existence du compte ;
- `AccessDeniedException` → 403 ;
- `EntityNotFoundException` / `ResourceNotFoundException` maison → 404 ;
- `DataIntegrityViolationException` → 409 (conflit, sans exposer les détails SQL) ;
- `MaxUploadSizeExceededException` → 413 ;
- `HttpMediaTypeNotSupportedException` → 415 ;
- `TooManyRequestsException` maison → 429 ;
- toute `Exception` non capturée → 500 générique sans stack trace.

Format `ApiError` :

```json
{
  "status": 400,
  "code": "VALIDATION_ERROR",
  "message": "Les champs suivants sont invalides",
  "errors": [{ "field": "email", "message": "Format invalide" }],
  "timestamp": "2026-07-14T10:00:00Z",
  "path": "/api/v1/auth/login"
}
```

Aucune stack trace, aucun message SQL, aucun nom de classe interne en production.

---

## 19. Logs et audit logs

Les logs applicatifs doivent être :

- structurés (JSON via Logback + logstash-logback-encoder si observabilité Cloud Core activée) ;
- sans secret (jamais de `password`, `token`, `Authorization`, `access_key`) ;
- sans données personnelles inutiles (jamais d'email ou de téléphone en clair dans les logs techniques) ;
- corrélés par `requestId` (MDC `X-Request-Id`) propagé depuis le header ou généré à l'entrée.

Les audit logs doivent couvrir (table `audit_logs` en base de données ou flux dédié) :

- `LOGIN_SUCCESS` / `LOGIN_FAILURE` ;
- `LOGOUT` ;
- `TOKEN_REFRESH` ;
- `ROLE_CHANGE` ;
- `PERMISSION_CHANGE` ;
- `FILE_UPLOAD` / `FILE_DELETE` ;
- `USER_CREATED` / `USER_DEACTIVATED` / `USER_DELETED` ;
- `ADMIN_ACCESS` ;
- `CONFIG_CHANGE` ;
- opérations critiques définies par les projets dérivés.

Chaque audit log contient : `eventType`, `userId`, `targetId`, `timestamp`, `ipAddress` (pseudonymisée si RGPD requis), `userAgent`.

---

## 20. Upload et stockage fichiers

Le module d'upload doit prévoir :

- intégration **MinIO/S3** via AWS SDK v2 pour Java ou Minio Java SDK ;
- validation taille (rejet avant traitement si Content-Length dépasse le seuil) ;
- validation type MIME (whitelist — jamais de `*/*`) ;
- validation extension (cohérente avec MIME) ;
- noms de fichiers sûrs — UUID ou hash + extension validée, jamais le nom original brut ;
- séparation **public/privé** — buckets distincts ou prefixes distincts avec politique d'accès adaptée ;
- **URLs signées** (presigned URLs) pour téléchargement de fichiers privés — durée courte, jamais en cache ou log ;
- audit log de chaque upload/suppression ;
- pas d'exposition directe d'un bucket privé sans contrôle d'accès.

---

## 21. Cache et Redis

Spring Data Redis doit être utilisé pour :

- données fréquemment consultées (cache query results, profils utilisateurs) ;
- **rate limiting** (compteurs par IP ou utilisateur via Bucket4j ou Spring Rate Limiter) ;
- **blacklist de refresh tokens révoqués** si stratégie stateless adoptée ;
- verrous courts (Redisson ou `RedisTemplate` setIfAbsent) ;
- coordination de sessions si nécessaire.

Le core doit définir :

- **conventions de clés** : `{namespace}:{entity}:{id}:{field}` — préfixées par environnement ;
- **TTL** explicite pour chaque clé — pas de clé sans expiration ;
- **invalidation** — stratégie documentée par module ;
- **comportement Redis absent** — dégradation gracieuse si Redis est indisponible (fail-open ou fail-closed selon le cas d'usage).

---

## 22. Jobs asynchrones

Le core doit prévoir pour les tâches asynchrones :

- **Spring `@Async`** pour tâches légères non critiques (envoi mail, notification) ;
- **Spring Scheduler** pour tâches planifiées simples (nettoyage tokens expirés, purge audit logs anciens) ;
- **Spring Batch minimal** pour traitements volumétriques si validé par ADR.

Les jobs doivent être :

- idempotents — réexécution sans effet de bord ;
- observables — log début/fin/erreur avec `jobName`, `duration`, `status` ;
- sans traitement de données sensibles en mémoire plus longtemps que nécessaire.

---

## 23. Notifications

Le `NotificationModule` minimal doit fournir :

- abstraction de notification — interface `NotificationService` avec implémentations interchangeables ;
- canaux : email (Spring Mail), in-app (table `notifications` en base), mobile push (futur) ;
- templates de contenu standardisés (Thymeleaf ou équivalent) ;
- journalisation des envois importants sans contenu sensible ;
- intégration future mobile push, email ou realtime.

Pas de fournisseur unique imposé sans ADR.

---

## 24. Email

Le `MailModule` minimal doit prévoir :

- abstraction fournisseur via `JavaMailSender` Spring Mail + interface maison ;
- envoi asynchrone recommandé (`@Async` + queue si volume) ;
- templates Thymeleaf pour emails transactionnels ;
- logs sans contenu sensible (log `{recipient_type, subject_type}` jamais le contenu) ;
- gestion des erreurs d'envoi — retry ou dead-letter selon volume ;
- configuration par environnement (SMTP local en dev, SMTP réel en staging/production via variables d'environnement).

Les emails métier (contenu, structure) restent à la charge des projets dérivés.

---

## 25. Temps réel

Le temps réel est optionnel (`RealtimeModule`) et doit être activé uniquement si nécessaire.

Si activé :

- **authentification des connexions WebSocket** via JWT au handshake (`HandshakeInterceptor`) ;
- contrôle des topics/rooms par permission ;
- rate limiting sur les messages entrants ;
- logs des événements critiques sans payload sensible ;
- stratégie de scaling (sticky sessions ou Redis pub/sub) à valider avec Cloud Core.

---

## 26. Documentation OpenAPI / Swagger

Le core doit prévoir (springdoc-openapi) :

- documentation complète des endpoints — HTTP method, path, paramètres, corps, réponses ;
- schémas DTO annotés `@Schema` ;
- tags par module fonctionnel ;
- version d'API dans le titre et le préfixe ;
- exemples de payload via `@Schema(example = "...")` ;
- protection en production si nécessaire (`/v3/api-docs` et `/swagger-ui/**` derrière authentification ou désactivés) ;
- export YAML versionné (`openapi.yaml`) — compatible avec `@enistere/api-contracts` Enistere.

Swagger ne doit jamais exposer de secret ou d'endpoint interne non protégé.

La stratégie OpenAPI avancée (génération de clients typés) doit être validée par ADR si elle devient structurante pour les cores consommateurs.

---

## 27. Configuration et variables d'environnement

Le core doit standardiser via `@ConfigurationProperties` + `@Validated` :

- validation des variables d'environnement **au démarrage** — échec rapide si variable requise absente ou invalide ;
- séparation `application.yml` / `application-local.yml` / `application-test.yml` / `application-prod.yml` ;
- valeurs par défaut **uniquement si sûres** (jamais de secret par défaut) ;
- **aucun secret dans Git** — fichiers `.env.example` sans valeur réelle ;
- documentation des variables dans `README.md`.

Variables typiques à prévoir (sans valeur réelle dans cette spécification) :

```txt
DB_URL, DB_USERNAME, DB_PASSWORD
JWT_ACCESS_SECRET, JWT_ACCESS_EXPIRY
JWT_REFRESH_SECRET, JWT_REFRESH_EXPIRY
REDIS_URL, REDIS_PASSWORD
MINIO_ENDPOINT, MINIO_ACCESS_KEY, MINIO_SECRET_KEY, MINIO_BUCKET_PRIVATE, MINIO_BUCKET_PUBLIC
SMTP_HOST, SMTP_PORT, SMTP_USERNAME, SMTP_PASSWORD
CORS_ALLOWED_ORIGINS
SPRING_PROFILES_ACTIVE
```

---

## 28. Base de données

La base cible est **PostgreSQL** (cf. Cloud Core).

Le core doit prévoir :

- modèle `User` minimal (§16) + tables `roles`, `permissions`, `user_roles`, `role_permissions`, `refresh_tokens`, `audit_logs` ;
- `BaseEntity` abstraite : `id` (UUID), `createdAt`, `updatedAt` gérés par Hibernate ;
- **Flyway** pour migrations versionnées (`V1__init.sql`, `V2__...`) — pas de `ddl-auto: create-drop` en production ;
- transactions gérées par Spring (`@Transactional`) sur les services, pas sur les contrôleurs ;
- index sur `email`, `userId`, `refreshToken` (hashed), `createdAt` des tables volumétriques ;
- conventions de nommage : snake_case pour tables et colonnes.

Le choix **Maven vs Gradle** doit être décidé par ADR avant la mission Spring Boot 2 (starter).

---

## 29. Migrations et seed

Le futur starter doit prévoir (Flyway) :

- migrations versionnées dans `src/main/resources/db/migration/` — `V{n}__{description}.sql` ;
- seed minimal pour rôles et permissions de base : `V99__seed_roles_permissions.sql` (non exécuté en production automatiquement) ;
- seed local non sensible — données de test sans mot de passe réel ;
- seed profil de test via `@Sql` en tests d'intégration ;
- **interdiction de seed contenant des secrets réels** ;
- rollback documenté — correction via nouvelle migration `V{n+1}__fix_...`.

---

## 30. Critères de validation V1 Spring Boot

```txt
- L'application démarre sur JVM locale sans erreur
- La connexion PostgreSQL est établie et les migrations Flyway sont appliquées
- Le flow auth fonctionne : login → access token + refresh token → /auth/me → logout
- Les tokens sont correctement gérés : access token JWT court, refresh token persisté invalidable
- Les appels API protégés exigent un JWT valide
- RBAC fonctionne : rôle admin vs. rôle user — accès différenciés vérifiés
- La validation des DTO rejette les entrées invalides (400) sans fuite interne
- Les erreurs retournent un format ApiError stable (400/401/403/404/500) sans stack trace
- L'upload MinIO fonctionne : validation MIME/taille, nommage sûr, URL signée
- Les health checks Actuator retournent l'état de la base et du cache
- La documentation OpenAPI est générée et accessible en dev
- Les tests JUnit + Testcontainers passent (unit services + integration contrôleurs + auth)
- Aucun secret dans Git, aucun token ou password dans les logs
- Audit logs présents pour les actions sensibles
- CORS strict configuré
```

---

## 31. Tests attendus

Le core doit prévoir :

- **tests unitaires JUnit 5** : services (AuthService, UserService, TokenService, PermissionService), validations, mappers DTO↔entités, JWT provider, encryption helpers ;
- **tests d'intégration Testcontainers** : contrôleurs auth (login/refresh/logout/me), endpoints protégés, RBAC, upload MinIO, health checks, migrations Flyway ;
- **tests de sécurité** : routes non protégées accessibles sans token, routes protégées refusent token absent/invalide/expiré/révoqué, rôle insuffisant → 403 ;
- **tests validation DTO** : body invalide → 400 structuré, cas limites (null, vide, format incorrect) ;
- **tests guards et filtres** : `JwtAuthenticationFilter`, `GlobalExceptionHandler` ;
- **tests Flyway** : migrations appliquées sans erreur, schema attendu présent.

Les modules critiques (auth, permissions) doivent avoir une couverture renforcée.

---

## 32. Standards qualité Java

Le futur starter doit appliquer (`strategy/08_STANDARDS.md §16`) :

- **packages organisés par domaine** — `com.enistere.core.{module}.{layer}` ;
- **DTO séparés des entités** — jamais d'entité JPA exposée dans la réponse HTTP ;
- **controllers légers** — délèguent aux services, annotations Spring Security uniquement ;
- **services dédiés** — `@Service`, logique métier testable unitairement ;
- **validation avec Jakarta Bean Validation** — `@NotBlank`, `@Email`, `@Size`, contraintes custom annotées ;
- **exceptions centralisées** — `GlobalExceptionHandler` exhaustif ;
- **Checkstyle ou SpotBugs** optionnel en CI ;
- **conventions de nommage** : `PascalCase` classes, `camelCase` méthodes, `snake_case` colonnes, `SCREAMING_SNAKE_CASE` constantes ;
- **aucun `System.out.println`** — uniquement SLF4J.

---

## 33. Observabilité et health checks

Le `HealthModule` doit prévoir (Spring Boot Actuator) :

- `GET /actuator/health` — état global (UP/DOWN) ;
- `GET /actuator/health/db` — connexion PostgreSQL ;
- `GET /actuator/health/redis` — connexion Redis si activé ;
- `GET /actuator/health/storage` — connexion MinIO si activé ;
- readiness/liveness distincts si Cloud Core cible Kubernetes ;
- logs compatibles monitoring — format structuré JSON en staging/production ;
- métriques Micrometer → Prometheus si activé (future mission ou projet dérivé).

Les endpoints Actuator doivent être protégés en production (`management.endpoints.web.exposure.include` restreint).

L'observabilité avancée (traces distribuées, dashboards Grafana) est coordonnée avec Cloud Core — hors périmètre V1.

---

## 34. Sécurité des dépendances

Toute dépendance Java doit être justifiée (`strategy/06_DEPENDENCY_STRATEGY.md §14`) :

- aucune librairie gadget — préférer les abstractions Spring Boot intégrées ;
- pas de doublon fonctionnel avec l'écosystème Spring ;
- **OWASP Dependency Check** (plugin Maven/Gradle) — audit en CI ;
- **GitHub Dependabot** — alertes de sécurité automatiques ;
- ADR requis pour : ORM alternatif à Hibernate, cache alternatif à Spring Data Redis, queue alternative, auth alternative à Spring Security, OpenAPI alternative à springdoc ;
- stratégie de mise à jour : PATCH mensuel, MINOR trimestriel, MAJOR avec analyse changelog.

---

## 35. Intégration avec Cloud Core

Le API Core Spring Boot doit s'intégrer avec Cloud Core pour :

- PostgreSQL (conteneur cloud ou RDS compatible) ;
- Redis (conteneur cloud ou ElastiCache compatible) ;
- MinIO/S3 (conteneur MinIO Enistere ou S3 compatible) ;
- variables d'environnement injectées par Cloud Core (secrets manager ou env vars Docker/Compose) ;
- reverse proxy Traefik — CORS configuré côté Spring Security ;
- logs structurés compatibles Loki si observabilité activée ;
- health checks Actuator consommés par le reverse proxy ou l'orchestrateur.

---

## 36. Intégration avec Mobile Core (Flutter et React Native)

Le core doit fournir une API compatible mobile :

- auth JWT Bearer (`Authorization: Bearer <token>`) utilisable par `flutter_secure_storage` et SecureStore RN ;
- refresh token compatible stockage sécurisé côté mobile — endpoint `POST /auth/refresh` ;
- endpoints stables et versionnés (`/api/v1/`) ;
- erreurs structurées `ApiError` exploitables côté mobile ;
- upload multipart/form-data compatible `DioUploadService` (Flutter) et `useUploadMutation` (RN) ;
- pagination `Page<T>` compatible couches server-state mobile ;
- OpenAPI exporté en YAML — compatible avec génération de clients si ADR validé.

---

## 37. Intégration avec Web Core Next.js

Le core doit fournir une API compatible web :

- refresh token en cookie `HttpOnly` si stratégie BFF retenue (cf. Web Core BFF Auth) — endpoint `POST /auth/refresh` acceptant cookie ou body selon configuration ;
- **CORS strict** — origines autorisées listées dans configuration Spring Security ;
- **protection CSRF** — non nécessaire pour API stateless Bearer, mais à évaluer si cookies HttpOnly sont utilisés (double-submit ou SameSite=Strict) ;
- endpoints dashboard/backoffice avec permissions fines ;
- erreurs standardisées `ApiError` exploitables par les hooks Web Core ;
- export OpenAPI compatible `@enistere/api-contracts`.

---

## 38. Intégration avec Quality Core et Docs Core

- **Quality Core** : appliquer les standards de tests JUnit/Testcontainers, lint, couverture critique, validation CI/CD. Le scope `quality-gates` doit couvrir le build Java et les tests.
- **Docs Core** : maintenir `CORE_SPECIFICATION.md`, `README.md`, guides, ADR et runbooks liés au core dans le format Docs Core.

---

## 39. Documentation obligatoire du core

À terme, le core devra contenir :

- `README.md` — démarrage rapide, prérequis, commandes ;
- `CORE_SPECIFICATION.md` — cette spécification ;
- `DEPENDENCIES.md` — dépendances justifiées (cf. `strategy/06_DEPENDENCY_STRATEGY.md §11`) ;
- `docs/ARCHITECTURE.md` — architecture détaillée, diagrammes ;
- `docs/SECURITY.md` — guide sécurité Spring Security ;
- `docs/TESTING.md` — stratégie tests, Testcontainers, commandes ;
- `docs/INSTALLATION.md` — prérequis JVM, Maven/Gradle, PostgreSQL, Redis, MinIO ;
- `docs/CONFIGURATION.md` — variables d'environnement documentées ;
- `CHANGELOG.md`.

---

## 40. Décisions pendantes

Ces décisions doivent être tranchées dans les missions Spring Boot 2+ ou par ADR dédié :

| Décision | Options | Impact |
|---|---|---|
| Build system | Maven vs Gradle | Mission Spring Boot 2 — structure `pom.xml` vs `build.gradle` |
| ORM | Spring Data JPA / Hibernate (défaut) vs alternative | ADR si alternative nécessaire |
| Validation | Jakarta Bean Validation (défaut Spring) vs Vavr/autre | Mission Spring Boot 2 |
| Cache avancé | Spring Data Redis vs Caffeine (cache local) | Mission Spring Boot 3+ |
| Queue | Spring `@Async` vs Spring Batch vs Quartz vs RabbitMQ | ADR si volume ou fiabilité requiert un broker |
| Mail | Spring Mail SMTP vs SendGrid vs Resend | Mission Spring Boot 4+ ou projet dérivé |
| Observabilité | Micrometer + Prometheus vs autre | Cloud Core V2+ |
| CI Java | GitHub Actions `mvn verify` ou `gradle build` | Mission Spring Boot 3+ |
| Distribution | Docker image Java / Cloud Core | Mission Spring Boot V1 final |
| API versioning | URI prefix `/api/v1/` vs header `Accept` | Spring Boot 2 |
| CSRF | Désactivé (stateless Bearer) vs double-submit (BFF avec cookies) | Spring Boot 2 — selon stratégie BFF Web |

---

## 41. Missions ordonnées

| # | Mission | Livrable | Prérequis |
|---|---|---|---|
| Spring Boot 1 | Core specification (CETTE MISSION) | `CORE_SPECIFICATION.md` + `README.md` | ADR applicables lus |
| Spring Boot 2 | Starter minimal | `pom.xml` ou `build.gradle` + structure `src/` + Spring Security + JWT + auth flow | Spring Boot 1 |
| Spring Boot 3 | PostgreSQL + JPA + Flyway + Users + Roles + Permissions | Entités, migrations, RBAC | Spring Boot 2 |
| Spring Boot 4 | Client HTTP + OpenAPI + Upload MinIO | springdoc + MinIO SDK + upload service | Spring Boot 3 |
| Spring Boot 5 | Tests JUnit + Testcontainers + CI | Tests unitaires + intégration + health | Spring Boot 4 |
| Spring Boot V1 | Readiness review | Rapport V1 — critères §30 vérifiés | Spring Boot 5 |

---

## 42. Cohérence avec API Core NestJS

Les deux API cores partagent les **intentions** sans dupliquer l'implémentation :

| Intention | NestJS | Spring Boot |
|---|---|---|
| Auth JWT | Passport JWT + `JwtAuthGuard` | Spring Security + `JwtAuthenticationFilter` |
| RBAC | `RolesGuard` + `PermissionsGuard` | `@PreAuthorize` + Method Security |
| Validation | class-validator / Zod | Jakarta Bean Validation |
| ORM | Prisma / TypeORM | Spring Data JPA / Hibernate |
| Migrations | Prisma Migrate | Flyway |
| Upload | MinIO + Multer | MinIO Java SDK + `MultipartFile` |
| Cache | Redis via ioredis | Spring Data Redis |
| Queue | BullMQ | Spring `@Async` / Spring Batch |
| OpenAPI | `@nestjs/swagger` | springdoc-openapi |
| Tests | Jest + supertest | JUnit 5 + Testcontainers |
| Health | NestJS Terminus | Spring Boot Actuator |
| Logs | Pino structuré | SLF4J / Logback structuré |
| Audit | Table `audit_logs` + interceptor | Table `audit_logs` + `@Aspect` AOP |

Les contrats OpenAPI des deux cores doivent rester compatibles avec `@enistere/api-contracts` et les cores consommateurs (Mobile, Web).
