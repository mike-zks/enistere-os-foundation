# RolesModule — V1 (RBAC, Auth 5)

Rôles RBAC génériques (ADR-006). Un rôle regroupe des permissions. **Aucun rôle métier**
n'est imposé par le core.

## Conventions de rôle

- `code` : identifiant logique stable, **normalisé en minuscules** (`administrator`, `user`,
  `auditor`) ; unique.
- `name` : libellé lisible.
- `isSystem` : protège les rôles structurels du core (suppression/édition à contrôler à terme).
- les rôles regroupent des responsabilités, pas des écrans UI.

## API interne (pas de CRUD public)

`RolesService` :

- `createRole(input)` → `RoleView` (code normalisé, conflit `ROLE_CODE_ALREADY_EXISTS`) ;
- `findByCode(code)` / `roleExists(code)` ;
- `assignRoleToUser(userId, roleCode, actorId?)` (audit `ROLE_ASSIGNED`) ;
- `removeRoleFromUser(userId, roleCode, actorId?)` (audit `ROLE_REMOVED`) ;
- `getUserRoleCodes(userId)` → `string[]` triés ;
- `userHasRole(userId, roleCode)` → `boolean`.

`RolesService` expose des `RoleView`/codes, jamais le modèle Prisma brut (ADR-002).

## Décorateur `@Roles()`

`@Roles('administrator', 'auditor')` — **sémantique OR** : posséder au moins un des rôles
suffit. Au moins un rôle est requis (vérifié au type) ; les codes sont normalisés.

## `RolesGuard`

Guard global **conditionnel** : n'agit que si `@Roles()` est présent. Charge les rôles
**côté serveur** (jamais depuis le JWT ni le client), via le contexte d'autorisation chargé
une fois par requête. Refus → `403 AUTH_FORBIDDEN` + audit `AUTHORIZATION_ROLE_DENIED`. Si la
route porte `@Roles()` sans principal (ex. `@Public()` mal combiné), le guard échoue de façon
sûre (erreur interne, accès refusé).

## Limites V1

Pas de CRUD public, pas de permissions directes utilisateur, pas de scope/tenant, pas de
rôle métier. Voir `src/permissions/README.md` et `src/auth/README.md`.
