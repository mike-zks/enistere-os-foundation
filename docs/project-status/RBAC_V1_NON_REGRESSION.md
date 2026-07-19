# Non-régression RBAC V1 — avant / après extraction (Capability Packs 1B)

Comparaison de la capability **RBAC** entre la baseline V1 intégrée (commit `53f2b7a`) et sa
composition en overlay déclaratif (`base + auth + rbac`). Objectif : aucune garantie, sécurité ou
comportement historique n'est réduit, et `base` / `base + auth` ne régressent pas.

Preuve runtime : golden `nestjs-auth-rbac` (`factory/quality/scripts/golden-runtime.mjs`) — projet
**généré**, lock racine + `npm ci`, prisma generate/validate/migrate/seed, lint, **189 tests
unitaires**, **55 e2e** contre PostgreSQL, génération/validation OpenAPI composée, build,
`npm audit`.

## NestJS (API)

| Aspect | V1 (intégré) | 1B (overlay rbac) | Verdict |
|---|---|---|---|
| Modèles Prisma | `Role`, `Permission`, `UserRole`, `RolePermission` | identiques, déclarés dans `rbac.prisma.json` | ✅ préservé |
| Relation `User.roles` | champ du modèle `User` monolithique | contribution `fields` appliquée au modèle intermédiaire possédé par la Factory | ✅ préservé, sans parsing ni duplication de `User` |
| Contraintes uniques | `roles.code`, `permissions.code` | identiques | ✅ préservé |
| Clés composites | `user_roles(userId,roleId)`, `role_permissions(roleId,permissionId)` | identiques | ✅ préservé |
| Clés étrangères / cascade | `ON DELETE CASCADE` vers `users`, `roles`, `permissions` | identiques | ✅ préservé |
| Index | `user_roles.roleId`, `role_permissions.permissionId` | identiques | ✅ préservé |
| Migrations | `auth5_rbac` enchevêtrée avec auth/files | `20260719000200_rbac_init` dédiée, ordonnée après `auth_init` | ✅ équivalent, désenchevêtré |
| Seed structurel | permissions/rôles `isSystem`, associations, idempotent | `seedRbac` enregistré dans un registre ordonné ; orchestrateur central stable | ✅ préservé et composable |
| Modules | `RolesModule`, `PermissionsModule`, `AuthorizationModule` | identiques (`AuthorizationModule` importe les deux et est composé via `nestjs.module`) | ✅ préservé |
| Guards et ordre | `JwtAuthGuard` → `RolesGuard` → `PermissionsGuard` (ordre implicite du tableau `providers`) | ordre **explicite et validé** (`order` 10/20/30), doublons et rangs ambigus refusés | ✅ amélioration (déterminisme prouvé) |
| Décorateurs | `@Roles`, `@Permissions` | identiques | ✅ préservé |
| Contexte d'autorisation | mémoïsé par requête, jamais dans le JWT | identique | ✅ préservé |
| Endpoint | `GET /auth/me/authorization` (`auth_getAuthorization`) porté par `AuthController` | même route, même `operationId`, porté par `AuthorizationController` (RBAC) | ✅ contrat préservé (Auth non modifié) |
| DTO public | `AuthorizationSummaryResponseDto` (rôles/permissions) | identique | ✅ préservé |
| Contrat OpenAPI | 8 opérations dont `auth_getAuthorization` | généré depuis l'app composée, jeu d'opérations déclaré et document byte-identique sur deux générations | ✅ préservé sans snapshot d'overlay |
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
| Page de statut | Auth/RBAC intégrés dans la page | shell stable + registre `nextjs.status-section` ordonné | ✅ préservé et composable |
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
**explicite, validé et déterministe**. Le schéma Prisma est rendu depuis un modèle intermédiaire
strict, le seed et la page de statut utilisent des registres ordonnés, et OpenAPI provient de
l'application composée : aucun fichier central n'est possédé par le dernier overlay appliqué.
`base` et `base + auth` restent exempts de toute surface RBAC. Depuis Capability Packs 2, cette
garantie couvre aussi Spring : RBAC n'apparaît qu'avec `base + auth + rbac`, et Files Spring reste
`planned`.
