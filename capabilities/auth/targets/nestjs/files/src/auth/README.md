# AuthModule — V1

starter NestJS comme autorité d'authentification (ADR-004). Stratégie : **access
token JWT court + refresh token opaque révocable avec rotation**. Hachage des mots
de passe : **Argon2id** (ADR-039).

## État actuel — étape Auth 5 (RBAC + permissions fines)

Endpoints exposés :

```txt
POST /auth/login              (public, rate-limité)   — Auth 2
POST /auth/refresh            (public, rate-limité)   — Auth 3
POST /auth/logout             (public, idempotent)    — Auth 3
GET  /auth/me                 (protégé)               — Auth 4
GET  /auth/me/authorization   (protégé)               — Auth 5
```

Implémenté :

- login Argon2id + émission access/refresh (Auth 2) ;
- rotation atomique, détection de réutilisation, révocation de famille, logout (Auth 3) ;
- **stratégie Passport JWT** (`jwt-access`) validant signature, expiration, algorithme
  (`HS256`), conformité des claims **et** état de la session référencée par `sid` ;
- **`JwtAuthGuard`** global : **protection privée par défaut**, contournée uniquement
  par `@Public()` ;
- décorateurs **`@Public()`** et **`@CurrentUser()`** ;
- contrat **`AuthenticatedPrincipal`** (`userId`, `sessionId`) ;
- **`GET /auth/me`** : profil public de l'utilisateur authentifié (Auth 4) ;
- **RBAC + permissions fines** (Auth 5) : `@Roles()` (OR), `@Permissions()` (AND),
  `RolesGuard`/`PermissionsGuard` globaux conditionnels, `GET /auth/me/authorization` ;
- distinction stricte **401 / 403** ;
- audit des rejets sensibles (auth + autorisation).

**Non implémenté** (volontairement) : administration RBAC (CRUD public rôles/permissions),
permissions directes utilisateur, scopes/tenant, cookies web, CSRF, register public,
reset/forgot password, OTP, MFA, OAuth/social, scheduler de purge.

## Protection privée par défaut

`JwtAuthGuard` est enregistré globalement (`APP_GUARD`). Toutes les routes sont donc
**protégées par défaut** ; une route n'est accessible sans access token que si elle est
explicitement marquée `@Public()`. Routes publiques actuelles : `GET /health`,
`POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout`. Le logout reste public car
il s'authentifie via le refresh token, pas via l'access token. Swagger (non-production)
n'est pas un handler Nest et n'est pas affecté par le guard.

`@Public()` ne contourne **que** l'authentification : il ne doit pas servir à contourner de
futurs guards (RBAC, permissions).

## Principal et `@CurrentUser()`

Le guard attache un `AuthenticatedPrincipal { userId, sessionId }` à la requête (jamais de
`passwordHash`, `tokenHash`, refresh token, rôle ou donnée métier). `@CurrentUser()` injecte
ce principal (ou `@CurrentUser('userId')` une propriété), sans dépendance à Prisma ; il lève
une 401 générique si le principal est absent.

## Contrôle de session par `sid`

Après la validation cryptographique du JWT, la session référencée par `sid` est vérifiée en
base : elle doit exister, appartenir à `sub`, ne pas être révoquée, ne pas être expirée et
appartenir à un utilisateur **ACTIVE**. Conséquence : un logout, une rotation ou une
révocation de famille **invalide immédiatement** les access tokens liés à la session
concernée, sans attendre leur expiration.

## Impact performance

Chaque requête protégée effectue **une** requête Prisma pour valider la session (jointure
`RefreshSession` + `User` via `findByIdWithUser`). `GET /auth/me` ajoute **une** lecture
utilisateur (profil public à jour) — soit 2 requêtes au total. Les index existants couvrent
la recherche par `id` (PK), `userId` et `familyId`. La vérification DB par requête protégée
est **acceptée en V1** pour garantir la révocation immédiate. Optimisation future possible :
cache Redis des sessions à TTL court (ne jamais conserver une session révoquée trop
longtemps) — **non** ajouté dans cette version.

## `GET /auth/me`

Route protégée. Lit le principal via `@CurrentUser()`, charge l'utilisateur via
`UsersService.findById`, revérifie qu'il existe et reste ACTIVE (sinon 401), et renvoie un
`PublicUser` (`id`, `email`, `status`, `createdAt`, `updatedAt`, `deactivatedAt`). Jamais de
`passwordHash`, `RefreshSession`, `tokenHash`, refresh token, audit log ni donnée métier.

## Distinction 401 / 403

`401 Unauthorized` : token absent/invalide/expiré, session révoquée/expirée, utilisateur
non authentifiable. `403 Forbidden` (`AUTH_FORBIDDEN`) : utilisateur authentifié mais
rôle/permission insuffisant (Auth 5). Jamais de 403 pour un défaut d'authentification, ni de
401 pour un défaut d'autorisation.

## Autorisation RBAC (Auth 5)

RBAC + permissions fines (ADR-006), **API autorité finale**, **deny by default**.

- `@Roles(...)` (OR) et `@Permissions(...)` (AND) déclarent les exigences d'une route.
- Guards globaux **conditionnels** : `RolesGuard` et `PermissionsGuard` n'agissent que si leur
  metadata est présente. Ordre garanti (enregistré dans `AppModule`) :
  `JwtAuthGuard → RolesGuard → PermissionsGuard → controller`.
- Les rôles/permissions ne sont **jamais** dans le JWT : ils sont chargés **côté serveur** à
  chaque requête, via un **contexte d'autorisation chargé une seule fois par requête**
  (`AuthorizationContextService`) et partagé entre les deux guards.
- Un changement de rôle/permission est pris en compte **immédiatement** (pas besoin de
  réémettre le JWT).
- `GET /auth/me/authorization` renvoie `{ roles, permissions }` (codes triés) pour l'**UI
  conditionnelle** uniquement ; ce n'est pas une preuve d'autorisation côté serveur.

Voir `src/roles/README.md` et `src/permissions/README.md`.

### Impact performance RBAC

Une route avec `@Roles`/`@Permissions` effectue : 1 requête de session (`JwtAuthGuard`) +
le contexte d'autorisation chargé **une fois** (rôles + permissions) et partagé entre les
guards. `/auth/me/authorization` charge le contexte (rôles + permissions). Pas de cache Redis
en V1 (cache futur possible avec invalidation stricte au changement de rôle/permission).

### Combinaison `@Public()` + autorisation

Une route `@Public()` ne doit pas déclarer `@Roles()`/`@Permissions()`. Si cela arrive, les
guards d'autorisation détectent l'absence de principal et **échouent de façon sûre** (erreur
interne, accès refusé) plutôt que d'exposer la route.

## Format du refresh token

Opaque : `<sessionId>.<secret>`.

- `sessionId` (UUID) localise la session ; `secret` = 32 octets aléatoires base64url ;
- seule l'empreinte **HMAC-SHA-256** du secret est persistée (`tokenHash`), jamais le
  token brut ;
- parsing strict (UUID valide, secret URL-safe borné, exactement deux segments).

## Cycle de session

```txt
login  → (accessToken, refreshToken A, famille F)
refresh(A) → révoque A (ROTATED, replacedBy=B), crée B (famille F) → (accessToken', B)
refresh(B) → ... rotation continue ...
reuse(A)   → A déjà ROTATED → REUSE_DETECTED → révocation de toute la famille F → 401
logout(X)  → révoque la famille de X (LOGOUT) → refresh ultérieur refusé → 401
```

## États d'une session

`active` (existe, utilisateur actif, `revokedAt` nul, non expirée, empreinte correcte),
`expired`, `revoked`, `rotated`, `compromised`. Une session révoquée ou expirée ne
produit jamais de nouveaux tokens. L'expiration n'est pas traitée comme une réutilisation
malveillante ; seul un token déjà `ROTATED` réutilisé déclenche la révocation de famille.

## Conservation des sessions révoquées

Les sessions révoquées **ne sont pas supprimées** : elles sont nécessaires à la détection
de réutilisation et à l'audit. Une purge des sessions révoquées/expirées au-delà d'une
durée de rétention est à prévoir via un **futur job** (non implémenté ici, pas de scheduler).

## Concurrence

La rotation crée la nouvelle session puis exécute une **révocation conditionnelle** de
l'ancienne (`UPDATE ... WHERE revokedAt IS NULL`). Sous l'isolation PostgreSQL par défaut
(READ COMMITTED), deux refresh concurrents avec le même token se sérialisent sur la ligne :
un seul obtient `count === 1` et réussit ; l'autre obtient `count === 0`, la transaction
est annulée (aucune nouvelle session ne subsiste) et l'appel échoue en `401` générique.
Ce conflit de course n'est **pas** une réutilisation malveillante et ne révoque pas la
famille. Aucun verrou pessimiste explicite n'est requis ; la stratégie repose sur l'update
conditionnel atomique.

## Audit (AuditModule)

Événements : `AUTH_LOGIN_SUCCEEDED`, `AUTH_LOGIN_FAILED`, `AUTH_REFRESH_SUCCEEDED`,
`AUTH_REFRESH_FAILED`, `AUTH_REFRESH_REUSE_DETECTED`, `AUTH_LOGOUT`,
`AUTH_SESSION_FAMILY_REVOKED`. Persistés dans `audit_logs` (Prisma). **Aucun token, hash,
mot de passe ni payload complet** n'est journalisé ; un échec d'audit n'interrompt jamais
le flux d'authentification.

## Codes d'erreur

| Interne / audit | Réponse publique |
|---|---|
| `AUTH_INVALID_CREDENTIALS` | `401 AUTH_INVALID_CREDENTIALS` |
| `AUTH_REFRESH_TOKEN_INVALID` / `_EXPIRED` / `_REVOKED` / `_REUSED` / `AUTH_REFRESH_FAILED` | `401 AUTH_REFRESH_TOKEN_INVALID` (générique) |
| `AUTH_ACCESS_TOKEN_INVALID` / `_EXPIRED` / `AUTH_SESSION_INVALID` | `401 AUTH_UNAUTHORIZED` (générique) |
| `AUTH_RATE_LIMITED` | `429 AUTH_RATE_LIMITED` |

Les échecs d'accès protégé (token absent/invalide/expiré, session invalide) renvoient tous
le même `401 AUTH_UNAUTHORIZED` ; les distinctions restent internes/audit. Idem refresh.

## Access token après refresh

Le nouvel access token porte le **nouveau** `sid` (nouvelle session), conserve `sub` et
`typ: "access"`, et a une nouvelle expiration. L'ancien access token reste valide jusqu'à
sa courte expiration (pas de denylist en V1) — conséquence assumée.

## Logout et Web

L'API renvoie une réponse adaptée aux clients API/mobile (`{ status: "logged_out" }`).
Le Web Core devra, séparément (ADR-005) : supprimer son cookie HttpOnly, appeler le logout
serveur et gérer CSRF. Non implémenté ici (pas de cookie).

## Étapes suivantes

- administration RBAC (endpoints de gestion rôles/permissions) si un besoin le justifie ;
- cache Redis optionnel du contexte d'autorisation avec invalidation stricte ;
- permissions directes utilisateur / scopes (tenant) si un projet les requiert (ADR dédié) ;
- intégration UI conditionnelle côté Web/Mobile à partir de `/auth/me/authorization`.

## Règles (ADR-004 / ADR-039 / 07_SECURITY)

- secrets et clés hors Git ; tokens, hash et empreintes jamais journalisés ;
- refresh token jamais stocké en clair ; secret d'empreinte distinct des secrets JWT ;
- erreurs génériques ; rate limiting ; HTTPS en production ; CORS strict ;
- authentification, session et autorisation séparées.
