# PermissionsModule — V1 (RBAC, Auth 5)

Permissions fines (ADR-006). L'API est l'**autorité finale**. **Deny by default**,
**least privilege**. Aucune permission métier dans le core.

## Convention de permission

Format stable `resource.action` (`permissions.constants.ts`) :

- minuscules ; `resource` et `action` en `[a-z0-9_]` ; un seul point ; pas d'espace ;
- longueur bornée ; **pas de wildcard `*`** en V1.

Valides : `users.read`, `roles.manage`, `audit.read`. Invalides : `Users.Read`, `users read`,
`users`, `users.*`. `resource` et `action` sont dérivés du `code` et stockés séparément.

Permissions structurelles du core (seed) : `users.read`, `roles.read`, `roles.manage`,
`permissions.read`, `permissions.manage`, `audit.read`.

## API interne (pas de CRUD public)

`PermissionsService` :

- `createPermission(input)` → `PermissionView` (code validé, conflit `PERMISSION_CODE_ALREADY_EXISTS`,
  format invalide `INVALID_PERMISSION_CODE`) ;
- `assignToRole(roleId, code, actorId?)` (audit `PERMISSION_ASSIGNED_TO_ROLE`) ;
- `removeFromRole(roleId, code, actorId?)` (audit `PERMISSION_REMOVED_FROM_ROLE`) ;
- `listRolePermissionCodes(roleId)` → `string[]` triés ;
- `getEffectivePermissions(userId)` → `string[]` (union triée/dédupliquée des permissions des
  rôles de l'utilisateur) ;
- `hasPermissions(userId, required)` → `boolean` (**logique AND**).

## Décorateur `@Permissions()`

`@Permissions('users.read', 'audit.read')` — **sémantique AND** : toutes les permissions sont
requises. Au moins une est requise (type) ; un code invalide est rejeté **à la déclaration**
(au démarrage). Une évolution `anyOf` est possible plus tard (non implémentée).

## `PermissionsGuard`

Guard global **conditionnel** : n'agit que si `@Permissions()` est présent. Deny by default.
Charge les permissions effectives **côté serveur** via le contexte d'autorisation partagé.
Refus → `403 AUTH_FORBIDDEN` **sans révéler** la permission manquante + audit
`AUTHORIZATION_PERMISSION_DENIED`.

## Calcul des permissions effectives

`permissionsEffectives(user) = union(role.permissions)` : une seule requête, triée et
dédupliquée (une permission portée par plusieurs rôles n'apparaît qu'une fois). Jamais dans
le JWT ; pas de cache Redis en V1 (cache futur possible avec invalidation stricte).

## Limites V1

Pas de CRUD public, pas de permissions directes utilisateur, pas d'ABAC/policy engine.
