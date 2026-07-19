# Non-régression RBAC V1 — avant / après extraction (Capability Packs 1B)

Comparaison de la capability **RBAC** entre la baseline V1 intégrée (commit `53f2b7a`) et sa
composition en overlay déclaratif (`base + auth + rbac`). Objectif : aucune garantie, sécurité ou
comportement historique n'est réduit, et `base` / `base + auth` ne régressent pas.

Preuve runtime : golden `nestjs-auth-rbac` (`factory/quality/scripts/golden-runtime.mjs`) — projet
**généré**, lock racine + `npm ci`, prisma generate/validate/migrate/seed, lint, **189 tests
unitaires**, **55 e2e** contre PostgreSQL, `openapi:check`, build, `npm audit`.

## NestJS (API)

| Aspect | V1 (intégré) | 1B (overlay rbac) | Verdict |
|---|---|---|---|
| Modèles Prisma | `Role`, `Permission`, `UserRole`, `RolePermission` | identiques (fragment `rbac.prisma`) | ✅ préservé |
| Relation `User.roles` | champ du modèle `User` monolithique | ajoutée au `User` d'Auth par `nestjs.prisma-model-field` (extension structurée) | ✅ préservé, sans duplication de `User` |
| Contraintes uniques | `roles.code`, `permissions.code` | identiques | ✅ préservé |
| Clés composites | `user_roles(userId,roleId)`, `role_permissions(roleId,permissionId)` | identiques | ✅ préservé |
| Clés étrangères / cascade | `ON DELETE CASCADE` vers `users`, `roles`, `permissions` | identiques | ✅ préservé |
| Index | `user_roles.roleId`, `role_permissions.permissionId` | identiques | ✅ préservé |
| Migrations | `auth5_rbac` enchevêtrée avec auth/files | `20260719000200_rbac_init` dédiée, ordonnée après `auth_init` | ✅ équivalent, désenchevêtré |
| Seed structurel | permissions/rôles `isSystem`, associations, idempotent | identique (`prisma/seed.ts` livré par l'overlay) | ✅ préservé |
| Modules | `RolesModule`, `PermissionsModule`, `AuthorizationModule` | identiques (`AuthorizationModule` importe les deux et est composé via `nestjs.module`) | ✅ préservé |
| Guards et ordre | `JwtAuthGuard` → `RolesGuard` → `PermissionsGuard` (ordre implicite du tableau `providers`) | ordre **explicite et validé** (`order` 10/20/30), doublons et rangs ambigus refusés | ✅ amélioration (déterminisme prouvé) |
| Décorateurs | `@Roles`, `@Permissions` | identiques | ✅ préservé |
| Contexte d'autorisation | mémoïsé par requête, jamais dans le JWT | identique | ✅ préservé |
| Endpoint | `GET /auth/me/authorization` (`auth_getAuthorization`) porté par `AuthController` | même route, même `operationId`, porté par `AuthorizationController` (RBAC) | ✅ contrat préservé (Auth non modifié) |
| DTO public | `AuthorizationSummaryResponseDto` (rôles/permissions) | identique | ✅ préservé |
| Contrat OpenAPI | 8 opérations dont `auth_getAuthorization` | snapshot composé identique pour la surface RBAC | ✅ préservé |
| Codes d'erreur | `AUTH_FORBIDDEN`, `ROLE_*`, `PERMISSION_*` dans le registre global | registre propre `RBAC_ERROR_CODES` (mêmes valeurs) | ✅ préservé (namespacé) |
| Événements d'audit | `AUTHORIZATION_*_DENIED`, `ROLE_*`, `PERMISSION_*` | registre propre `RBAC_AUDIT_EVENTS` (mêmes valeurs) | ✅ préservé (namespacé) |
| 401 vs 403 | 401 avant les guards d'autorisation, 403 sur refus | identique (couvert e2e) | ✅ préservé |
| Fuite de données | aucun hash/token/modèle Prisma dans les réponses | identique (couvert e2e + contrat) | ✅ préservé |
| Tests historiques | unitaires roles/permissions/guards + `auth-rbac.e2e-spec` | identiques, **plus** 3 scénarios (isolation inter-utilisateurs, rotation de refresh, rôle fourni par le client) | ✅ préservé et étendu |

## Next.js (Web)

| Aspect | V1 (intégré) | 1B (overlay rbac) | Verdict |
|---|---|---|---|
| Route BFF | `GET /api/auth/authorization` | identique | ✅ préservé |
| Handler | `get-authorization-handler` sous `core/auth/handlers` | même logique, sous `core/authorization` (namespace RBAC) | ✅ préservé (emplacement) |
| Client | `fetchAuthorization` dans `auth-bff-client` | `core/authorization/authorization-client` réutilisant la primitive `bffGet` d'Auth | ✅ préservé, sans duplication |
| Clé de cache | `authKeys.authorization()` | `authorizationKeys.summary()` **dérivée de `authKeys.all`** | ✅ préservé (purge au logout conservée) |
| Hook | `useAuthorization` | identique | ✅ préservé |
| Vue d'état | `AuthorizationStatusView` (comptes de rôles/permissions) | identique, rendue par `AuthorizationPanel` | ✅ préservé |
| Cookies / CSRF | `HttpOnly`, `credentials: include`, aucun token JS | inchangés (Auth non modifié) | ✅ préservé |
| Autorité | API autoritaire, UI conditionnelle uniquement | identique | ✅ préservé |

## React Native

| Aspect | V1 | 1B | Verdict |
|---|---|---|---|
| Surface RBAC | aucune | aucune (`not-applicable`) | ✅ inchangé |
| Composition triple | — | `base + auth + rbac` générable ; le mobile reste `base + auth` | ✅ non bloquant |
| Tests mobiles | 364 | 364 (identiques) | ✅ aucune régression |

## Preuves d'absence / de présence

| Sélection | Attendu | Prouvé par |
|---|---|---|
| `base` | aucun Auth, aucun RBAC | `rbac-composition.test.mjs` (absence `src/auth`, `src/roles`) |
| `base + auth` | Auth présent, **aucun** RBAC | absence `src/roles`/`src/permissions`/`src/authorization`, prisma sans `Role` ni `User.roles` |
| `base + auth + rbac` | Auth + RBAC, **aucun** Files | présence guards/modèles/migration/contrôleur, absence `src/files` |

## Écarts assumés (aucune perte de garantie)

1. **Emplacement de fichiers** : la surface d'autorisation vit sous `src/authorization` (NestJS) et
   `src/core|features/authorization` (Next.js) au lieu de `src/auth/**`. Motif : RBAC ne doit pas
   écrire dans l'arbre d'Auth. Le **contrat public (routes, `operationId`, DTO) est inchangé**.
2. **Endpoint porté par un contrôleur RBAC** : `AuthorizationController` remplace la méthode de
   `AuthController`. Motif : Auth ne dépend pas de RBAC (dépendance supprimée en 1A). Route et
   contrat identiques.
3. **`bffGet` exporté par Auth** : primitive interne rendue réutilisable pour éviter de dupliquer la
   politique same-origin côté RBAC. Aucun changement de comportement d'Auth.

## Conclusion

Aucune garantie RBAC V1 n'est perdue. Deux améliorations : l'ordre des guards globaux devient
**explicite, validé et déterministe**, et le schéma Prisma est **composé sans duplication** de `User`
par une opération structurée (jamais un patch textuel). `base` et `base + auth` restent exempts de
toute surface RBAC, et Files reste `planned`.
