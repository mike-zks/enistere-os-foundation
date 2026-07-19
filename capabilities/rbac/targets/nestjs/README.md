# RBAC — overlay NestJS (actif)

Overlay déclaratif livré par Capability Packs 1B. Voir [`../../README.md`](../../README.md) pour le
contrat de la capability et [`overlay.json`](overlay.json) pour les opérations déclarées.

Points saillants :

- guards globaux ordonnés (`RolesGuard` 20, `PermissionsGuard` 30) après `JwtAuthGuard` (10) ;
- fragment Prisma RBAC + extension structurée de `User` (aucune duplication) ;
- migration `20260719000200_rbac_init` ordonnée après `auth_init` ;
- contrôleur `GET /auth/me/authorization` propre à RBAC (le contrôleur d'Auth n'est pas modifié) ;
- seed structurel gouverné et idempotent.
