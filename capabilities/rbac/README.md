# Capability RBAC

Autorisation par rôles et permissions fines (ADR-006), composée **au-dessus du Platform Baseline et
d'Authentication**.

`requires: ["auth"]` — le baseline est implicite et le moteur refuse RBAC sans Auth. L'**API reste l'unique
autorité d'autorisation** : le Web ne fait que conditionner l'affichage (UX), il ne décide jamais.

## Statut par target

| Target | Statut | Mode |
|---|---|---|
| NestJS | `ready` | overlay |
| Spring | `ready` | overlay |
| Next.js | `ready` | overlay |
| React Native | `not-applicable` | — |
| Angular / Flutter | `planned` | — |

`not-applicable` (React Native) : l'autorisation fine est une préoccupation **serveur**. L'app mobile
reçoit les décisions de l'API (401/403) et ne possède aucune surface RBAC. Ce statut **ne bloque pas**
la génération d'une composition triple `auth + rbac` et **n'injecte rien** dans le mobile —
aucun overlay factice n'est créé. Voir `factory/engine/OVERLAY_CONTRACT.md` §statuts.

## NestJS (`targets/nestjs`)

- `src/roles`, `src/permissions` — modèles, repositories, services, décorateurs `@Roles`/`@Permissions`.
- `src/authorization` — contexte d'autorisation mémoïsé par requête, module et contrôleur
  `GET /auth/me/authorization` (restaure le contrat V1 `auth_getAuthorization` **sans modifier le
  contrôleur d'Auth**).
- `src/rbac` — registres propres : `RBAC_ERROR_CODES`, `RBAC_AUDIT_EVENTS`.
- Guards globaux composés dans un ordre **déterministe** via l'intégration `nestjs.global-guard`
  (`order`) : `JwtAuthGuard` (10, Auth) → `RolesGuard` (20) → `PermissionsGuard` (30).
- Prisma : fragment JSON déclaratif `fragments/rbac.prisma.json` (`Role`, `Permission`, `UserRole`,
  `RolePermission`) + extension `User.roles` dans le modèle intermédiaire de la Factory. Le schéma
  est rendu une fois, sans parsing de texte ni duplication de `User`. Migration dédiée après Auth.
- Seed structurel `seedRbac`, idempotent, enregistré via `nestjs.prisma-seed` dans le registre
  ordonné consommé par l'orchestrateur stable. Aucun utilisateur, mot de passe, donnée métier ou
  permission implicite pour tous les utilisateurs.
- Contrat OpenAPI déclaré par `operationId`, généré depuis l'application composée et vérifié
  reproductible ; aucun snapshot complet n'est livré par l'overlay.

## Next.js (`targets/nextjs`)

- BFF `GET /api/auth/authorization` et handler dédié (`src/core/authorization`).
- Client same-origin réutilisant la primitive `bffGet` d'Auth : `credentials: include`, cookies
  `HttpOnly` jamais lus par le JS, **aucun token côté navigateur**.
- Clé de cache dérivée de `authKeys.all` : la purge du cache Auth au logout évacue aussi
  l'autorisation. Aucune permission, aucun rôle et aucun secret dans la clé.
- `useAuthorization`, vue d'état et panneau d'autorisation : **affichage conditionnel uniquement**,
  aucun rôle codé en dur, aucune décision de sécurité côté rendu.
- `AuthorizationPanel` est enregistré via `nextjs.status-section` ; le shell `/status` reste stable
  et n'est jamais remplacé par RBAC.

## Spring (`targets/spring`)

- Migration Flyway V2 additive : `roles`, `permissions`, `user_roles`, `role_permissions`, sans
  seed ni attribution implicite.
- `AuthorizationService` calcule les droits depuis PostgreSQL à chaque décision ; aucun rôle ou
  permission n'entre dans le JWT.
- `GET /api/v1/auth/me/authorization` expose uniquement les codes triés nécessaires à l'UX.
- Le bean `rbacAuthorization` s'utilise avec Method Security :
  `@PreAuthorize("@rbacAuthorization.hasPermission(authentication, 'files.read')")`.
- L'identifiant utilisateur provient exclusivement de `Authentication.details`, renseigné par
  Auth après validation du JWT ; une valeur absente ou malformée refuse l'accès.

## Preuves

- Goldens runtime : `nestjs-auth-rbac`, `nest-next-auth-rbac`, `triple-auth-rbac`, `spring-auth-rbac`
  (`factory/quality/scripts/golden-runtime.mjs`).
- Non-régression V1 : historique Git et GitHub Releases (tag `foundation-v1.0.0`).
- Tests de composition : `factory/test/rbac-composition.test.mjs` et
  `factory/test/composition-seams.test.mjs`.
