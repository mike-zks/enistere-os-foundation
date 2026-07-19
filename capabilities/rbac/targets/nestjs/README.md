# RBAC — payload NestJS parqué (non câblé)

Code RBAC (rôles, permissions, contexte d'autorisation, guards globaux, seed
structurel, e2e) extrait du starter NestJS lors de la mission Capability Packs
1A (extraction Auth). Ce payload n'est **pas** un overlay actif : il n'y a pas
d'`overlay.json`, la capability reste `planned` sur toutes les targets et
`enistere generate` refuse toujours `rbac`.

La mission Capability Packs 1B (extraction RBAC) transformera ce payload en
overlay déclaratif : réécriture des imports vers les registres Auth
(`auth-error-codes`, événements d'audit), fragment Prisma (`Role`, `Permission`,
`UserRole`, `RolePermission`), migration SQL dédiée et intégrations
(`nestjs.module`, guards globaux `RolesGuard`/`PermissionsGuard` ordonnés après
`JwtAuthGuard`).
