# Capability RBAC

Autorisation par rôles et permissions fines (ADR-006), composée **au-dessus de `base + auth`**.

`requires: ["base", "auth"]` — le moteur refuse `base + rbac` sans Auth. L'**API reste l'unique
autorité d'autorisation** : le Web ne fait que conditionner l'affichage (UX), il ne décide jamais.

## Statut par target

| Target | Statut | Mode |
|---|---|---|
| NestJS | `ready` | overlay |
| Next.js | `ready` | overlay |
| React Native | `not-applicable` | — |
| Spring / Angular / Flutter | `planned` | — |

`not-applicable` (React Native) : l'autorisation fine est une préoccupation **serveur**. L'app mobile
reçoit les décisions de l'API (401/403) et ne possède aucune surface RBAC. Ce statut **ne bloque pas**
la génération d'une composition triple `base + auth + rbac` et **n'injecte rien** dans le mobile —
aucun overlay factice n'est créé. Voir `factory/engine/OVERLAY_CONTRACT.md` §statuts.

## NestJS (`targets/nestjs`)

- `src/roles`, `src/permissions` — modèles, repositories, services, décorateurs `@Roles`/`@Permissions`.
- `src/authorization` — contexte d'autorisation mémoïsé par requête, module et contrôleur
  `GET /auth/me/authorization` (restaure le contrat V1 `auth_getAuthorization` **sans modifier le
  contrôleur d'Auth**).
- `src/rbac` — registres propres : `RBAC_ERROR_CODES`, `RBAC_AUDIT_EVENTS`.
- Guards globaux composés dans un ordre **déterministe** via l'intégration `nestjs.global-guard`
  (`order`) : `JwtAuthGuard` (10, Auth) → `RolesGuard` (20) → `PermissionsGuard` (30).
- Prisma : fragment `fragments/rbac.prisma` (`Role`, `Permission`, `UserRole`, `RolePermission`) +
  extension structurée du modèle `User` d'Auth (`roles UserRole[]`) via `nestjs.prisma-model-field` —
  **aucune duplication de `User`, aucun patch regex**. Migration dédiée ordonnée après Auth.
- Seed structurel gouverné (`prisma/seed.ts`) : permissions et rôles de référence (`isSystem`),
  associations rôle↔permission, **idempotent**. Aucun utilisateur, aucun mot de passe, aucune donnée
  métier, aucune permission accordée implicitement à tous les utilisateurs.

## Next.js (`targets/nextjs`)

- BFF `GET /api/auth/authorization` et handler dédié (`src/core/authorization`).
- Client same-origin réutilisant la primitive `bffGet` d'Auth : `credentials: include`, cookies
  `HttpOnly` jamais lus par le JS, **aucun token côté navigateur**.
- Clé de cache dérivée de `authKeys.all` : la purge du cache Auth au logout évacue aussi
  l'autorisation. Aucune permission, aucun rôle et aucun secret dans la clé.
- `useAuthorization`, vue d'état et panneau d'autorisation : **affichage conditionnel uniquement**,
  aucun rôle codé en dur, aucune décision de sécurité côté rendu.

## Preuves

- Goldens runtime : `nestjs-auth-rbac`, `nest-next-auth-rbac`, `triple-auth-rbac`
  (`factory/quality/scripts/golden-runtime.mjs`).
- Non-régression V1 : `docs/project-status/RBAC_V1_NON_REGRESSION.md`.
- Tests de composition : `factory/test/rbac-composition.test.mjs`.
