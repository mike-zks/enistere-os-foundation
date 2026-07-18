# Prochaines actions

## Action unique

**Capability Packs 1B — extraction RBAC sur NestJS + Next.js + React Native**

Transformer les payloads RBAC parqués (`capabilities/rbac/targets/*`) en overlays déclaratifs
composables au-dessus de `base + auth` :

1. overlay `rbac` NestJS : fragment Prisma (Role/Permission/UserRole/RolePermission), migration
   dédiée, intégrations (`nestjs.module`, guards globaux `RolesGuard`/`PermissionsGuard` ordonnés
   après `JwtAuthGuard`), seed structurel, contrats `me/authorization` ré-ajoutés à Auth ;
2. overlay `rbac` Next.js : handler/route `authorization`, hook et vue d'autorisation ;
3. React Native : RBAC non applicable (autorisation fine côté serveur) — documenter l'absence ;
4. goldens `base+auth+rbac` vérifiés (présence RBAC, aucune capability Files injectée) ;
5. `rbac` passe à `ready`/`overlay` uniquement sur NestJS et Next.js ; Files reste `planned`.

## Ensuite

1. Capability Packs 1C : extraction Files (NestJS + Next.js + React Native).
2. Capability Packs 2 : parité Spring + Angular + Flutter.
3. R8 : golden runtimes réels sur les deux verticales.
4. R9 : compilateur de domaine CRUD NestJS/Spring.
5. R10 : upgrades et migrations blueprint.
6. R11 : distribution CLI/packages.
7. R12 : métriques d'adoption et feedback projets dérivés.
