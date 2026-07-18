# Revue Auth/RBAC — starter NestJS V1

Revue globale et runtime du bloc Auth/RBAC (Auth 1 → Auth 5). Document permanent.

## 1. Périmètre

Authentification (login, refresh, rotation, logout), guard JWT global, RBAC + permissions
fines, audit. Modules : `AuthModule`, `UsersModule`, `RolesModule`, `PermissionsModule`,
`AuditModule`, `AuthorizationModule`. ADR de référence : 002, 003, 004, 005, 006, 011, 039.

## 2. Architecture examinée

| Module | Responsabilité | N'assume pas |
|---|---|---|
| Users | persistance/recherche/création utilisateur, contrats `PublicUser`/`AuthUser` | JWT, refresh, hashing, permissions |
| Auth | hashing (Argon2id), login, tokens, sessions, guard JWT, principal, `/auth/me*` | CRUD RBAC, métier, stockage objet |
| Roles | rôles, affectation user↔rôle, `@Roles`/`RolesGuard` | permissions fines |
| Permissions | permissions, association rôle↔permission, permissions effectives, `@Permissions`/`PermissionsGuard` | rôles |
| Audit | événements sensibles persistés, sans secret | flux bloquant |
| Authorization | agrège rôles+permissions en contexte chargé 1×/requête | logique métier |

Pas de dépendance circulaire (graphe : `Authorization → Roles/Permissions` ; `Auth → Authorization` ; guards référencés par `AppModule`). Accès Prisma confinés aux repositories. Pas de service monolithique, pas de type dupliqué injustifié.

## 3. Invariants de sécurité confirmés

- mots de passe **Argon2id** (ADR-039), paramètres centralisés/configurables, params test réduits ; `PasswordHasher` unique ; aucun appel Argon2 dispersé ;
- mot de passe/hash **jamais** journalisés ; `passwordHash` **jamais** renvoyé (`PublicUser`) ;
- refresh token opaque `<sessionId>.<secret>` ; **empreinte HMAC-SHA-256** seule persistée (secret distinct des secrets JWT) ; comparaison **temps constant** ; jamais journalisé ;
- access token JWT court, `HS256` explicite, claims **minimaux** (`sub`, `sid`, `typ`) — **aucun rôle/permission dans le JWT** ;
- session vérifiée en base à chaque requête protégée (`sid`) → révocation/rotation/logout invalident immédiatement ;
- **deny by default**, **least privilege**, API autorité finale ; autorisation chargée **côté serveur** ;
- erreurs **génériques** (`AUTH_INVALID_CREDENTIALS`, `AUTH_UNAUTHORIZED`, `AUTH_REFRESH_TOKEN_INVALID`, `AUTH_FORBIDDEN`) ; aucun détail Prisma/Argon2/JWT/Passport au client ;
- secrets hors Git ; aucun `.env` réel ; `.gitignore` couvre `node_modules`/`dist`/`coverage`/`.env*` ;
- rate limiting login + refresh (fenêtres séparées) ; Swagger désactivé en production.

## 4. Résultats runtime

| Commande | Résultat |
|---|---|
| prisma generate / validate | ✅ |
| migrate status | ✅ 3 migrations, à jour |
| build / lint | ✅ RC=0 / 0 erreur |
| test (unitaires) | ✅ 155 / 23 suites |
| test:e2e (×3) | ✅ 35 / 5 suites, stable |
| prisma:seed (×2) | ✅ idempotent |
| benchmark:argon2 | ✅ ~32 ms hash / ~28 ms verify (m=19456,t=2,p=1, dev) |
| npm audit | ✅ 0 vulnérabilité |

## 5. Matrice endpoints publics / privés

| Endpoint | Accès | Throttle |
|---|---|---|
| `GET /health` | public (`@Public`) | non |
| `POST /auth/login` | public (`@Public`) | login |
| `POST /auth/refresh` | public (`@Public`) | refresh |
| `POST /auth/logout` | public (`@Public`, idempotent) | non |
| `GET /auth/me` | **privé** (JWT) | non |
| `GET /auth/me/authorization` | **privé** (JWT) | non |
| `GET /docs` (Swagger) | non-production uniquement | n/a |

Aucune route involontairement publique. `/auth/me*` exigent un access token valide.

## 6. Matrice 401 / 403

| Situation | Réponse |
|---|---|
| Token absent / invalide / expiré | **401** `AUTH_UNAUTHORIZED` |
| Session révoquée / expirée (`sid`) | **401** `AUTH_UNAUTHORIZED` |
| Utilisateur non `ACTIVE` | **401** `AUTH_UNAUTHORIZED` |
| Identifiants login invalides (toutes causes) | **401** `AUTH_INVALID_CREDENTIALS` |
| Refresh token invalide/expiré/révoqué/réutilisé | **401** `AUTH_REFRESH_TOKEN_INVALID` |
| Authentifié, rôle requis absent | **403** `AUTH_FORBIDDEN` |
| Authentifié, permission requise absente | **403** `AUTH_FORBIDDEN` |
| Trop de tentatives login/refresh | **429** `AUTH_RATE_LIMITED` |

Jamais de 403 pour un défaut d'authentification ; jamais de 401 pour un défaut d'autorisation. Les 403 ne révèlent pas le rôle/permission manquant.

## 7. Cycle des tokens

Access token JWT signé `HS256`, durée `JWT_ACCESS_TTL` (s), claims `{ sub, sid, typ:'access' }`.
Refresh token opaque `<sessionId>.<secret>` (secret 32 octets base64url), remis une fois ; seule l'empreinte HMAC est stockée. Au refresh : nouveau secret, nouveau `sid` dans le nouvel access token. L'ancien access token reste valide jusqu'à sa courte expiration (sauf invalidation de sa session).

## 8. Cycle des sessions

`login` → session (famille F). `refresh` → transaction : crée la nouvelle session (même F) puis **révocation conditionnelle** de l'ancienne (`ROTATED`). Réutilisation d'un token `ROTATED` → `REUSE_DETECTED` + révocation de **toute la famille**. `logout` → révocation de famille (`LOGOUT`), idempotent. Sessions révoquées **conservées** (détection/audit) ; purge déléguée à un futur job.

## 9. Modèle RBAC

`User —(UserRole)— Role —(RolePermission)— Permission`. Codes : rôle normalisé minuscules ; permission `resource.action` (minuscules, pas de wildcard). `@Roles` = **OR**, `@Permissions` = **AND**. Permissions effectives = union triée/dédupliquée des permissions des rôles. Pas de permission directe utilisateur, pas de rôle métier, pas d'autorisation dans le JWT.

## 10. Audit

Événements auth (login/refresh/reuse/logout/family-revoked) et autorisation (`AUTHORIZATION_ROLE_DENIED`, `AUTHORIZATION_PERMISSION_DENIED`, `ROLE_ASSIGNED/REMOVED`, `PERMISSION_ASSIGNED/REMOVED_FROM_ROLE`). Persistés dans `audit_logs`. Métadonnées limitées (codes, familyId, sessionId, reason) ; **aucun token/hash/mot de passe**. Échec d'audit non bloquant et non sensible. Pas d'audit sur chaque requête valide (anti-DoS/croissance).

## 11. Résultats de concurrence

Rotation = `UPDATE ... WHERE revokedAt IS NULL` conditionnel dans une transaction (READ COMMITTED) : deux refresh concurrents du même token se sérialisent, un seul obtient `count===1` (succès), l'autre `count===0` → rollback + **401 générique** (course légitime, **pas** de révocation de famille). Test e2e dédié exécuté ×3 : résultat stable `[200, 401]`, une seule session active dans la famille.

## 12. Performance et nombre de requêtes

| Route | Requêtes Prisma principales |
|---|---|
| `/auth/me` | 2 (session+user join, puis profil) |
| `/auth/me/authorization` | 3 (session, rôles, permissions) |
| route `@Roles` seul | 3 (session + contexte chargé 1×) |
| route `@Permissions` seul | 3 (session + contexte chargé 1×) |
| route `@Roles` + `@Permissions` | 3 (contexte **partagé** entre guards, pas de doublon) |

Le contexte d'autorisation est mémoïsé sur la requête (mémoire de requête uniquement) et partagé entre les deux guards → pas de requêtes dupliquées. Pas de cache global (pas de fuite entre utilisateurs). Cache Redis volontairement hors V1.

## 13. Défauts trouvés

1. **Oracle de timing au login** : le statut (`INACTIVE`/`SUSPENDED`) était vérifié **avant** la vérification du mot de passe, créant un écart de temps distinguable d'un « mot de passe incorrect ».
2. **Couverture unitaire de `validateCredentials` manquante** : les cas (email inconnu, mauvais mot de passe, compte inactif/suspendu, succès) n'étaient plus testés unitairement (régression de tests lors d'une réécriture antérieure ; couverts seulement en e2e).

Aucun autre défaut : pas de fuite de logs, pas d'erreur brute de dépendance exposée, `.gitignore` complet, seed idempotent, 0 vulnérabilité npm, ordre des guards correct, routes publiques limitées.

## 14. Corrections effectuées

1. `validateCredentials` vérifie désormais le mot de passe **avant** le statut ; un compte connu inactif/suspendu paie le même coût de vérification qu'un mot de passe incorrect → **temps de réponse uniforme**, erreur toujours générique.
2. Ajout d'un bloc de tests unitaires `validateCredentials` (5 tests) couvrant anti-énumération, mauvais mot de passe, comptes inactif/suspendu (timing uniforme), succès sans `passwordHash`.

## 15. Risques acceptés

- Vérification de session/autorisation en base à chaque requête protégée (révocation immédiate) — cache Redis futur possible.
- Ancien access token valide jusqu'à sa courte expiration après rotation (pas de denylist V1) ; mitigé par le contrôle `sid`.
- Rate limiting en mémoire (mono-instance) — Redis requis en multi-instances.
- Message de la 500 « misconfiguration » (`@Public` + `@Roles`) lisible : chemin **défensif non atteignable** avec les routes actuelles ; non sensible.

## 16. Dette technique

- Tests e2e nécessitent un PostgreSQL (conteneur jetable) ; pas d'auto-provision.
- `needsRehash` implémenté mais non câblé (réservé à une future politique de re-hash au login).
- `ResponseInterceptor` n'expose pas `message`/`meta` optionnels (§30) — acceptable.
- Cascades `onDelete` sur associations RBAC : suppression d'un `Role`/`Permission` `isSystem` non protégée par CRUD (pas de CRUD public en V1).

## 17. Éléments futurs

UploadModule (ADR-007) ; administration RBAC protégée par `roles.manage`/`permissions.manage` avec protection des `isSystem` ; cache Redis (sessions + contexte authz) avec invalidation stricte ; rate limiting distribué ; job de purge sessions/audit ; cookies web + CSRF (ADR-005) côté Web Core.

## 18. Verdict

**Bloc Auth/RBAC validé comme composant V1 stable.** Cohérent, sécurisé, maintenable, conforme aux ADR (002/003/004/005/006/011/039), générique (aucun rôle/permission métier). Build/lint/tests (155 unit + 35 e2e) verts et stables, 3 migrations à jour, seed idempotent, 0 vulnérabilité. **Prêt pour la mission UploadModule.**
