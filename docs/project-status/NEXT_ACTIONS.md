# Prochaines actions

## Action unique

**Capability Packs 1A-R — clôture des preuves runtime `base+auth`** (avant tout travail RBAC).

La reproductibilité et l'exécution réelle des compositions Auth passent avant l'extraction RBAC :

1. workspace unifié + lock racine déterministe (`npm install` → `npm ci`) sur les projets générés ;
2. CI obligatoire `Factory Golden Runtime` verte pour `nestjs-base`, `nestjs-auth`, `nest-next-auth`,
   `triple-auth` (install reproductible + gates réels par application, PostgreSQL jetable) ;
3. gates Auth des trois targets prouvés sur le projet **généré** (pas seulement le starter source) ;
4. non-régression Auth V1 documentée et prouvée
   (`docs/project-status/AUTH_V1_NON_REGRESSION.md`).

## Ensuite

1. **Capability Packs 1B — extraction RBAC** sur NestJS + Next.js (RN non applicable). Réintroduire
   la surface d'autorisation retirée d'Auth (`authorizationQueryOptions`, `fetchAuthorization`,
   `authKeys.authorization`, guards `RolesGuard`/`PermissionsGuard`, seed structurel) via l'overlay RBAC.
2. Capability Packs 1C — extraction Files (NestJS + Next.js + React Native).
3. Capability Packs 2 — parité Spring + Angular + Flutter.
4. R8 — golden runtimes réels étendus (démarrage applicatif complet) sur les deux verticales.
5. R9 — compilateur de domaine CRUD NestJS/Spring.
6. R10 — upgrades et migrations blueprint.
7. R11 — distribution CLI/packages.
8. R12 — métriques d'adoption et feedback projets dérivés.
