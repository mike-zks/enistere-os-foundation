# Prochaines actions

## Action unique

**Capability Packs 1C — Files pour NestJS, Next.js et React Native**

Transformer le dernier payload parqué (`capabilities/files/targets/*`) en overlay déclaratif
composable au-dessus de `base + auth` :

1. overlay `files` NestJS : fragment Prisma (`StoredFile` + relation propriétaire via extension
   structurée de `User`), migrations dédiées, dépendances S3/MinIO, throttlers `upload`/`download`,
   scripts d'exploitation, e2e historiques ;
2. overlay `files` Next.js : BFF fichiers, routes `/api/files/*`, écrans protégés, hooks et vues ;
3. overlay `files` React Native : upload seam et écran de diagnostics ;
4. goldens runtime `*-files` verts (install reproductible, migrations, tests, audit) ;
5. non-régression Files V1 documentée et prouvée ;
6. `files` passe à `ready`/`overlay` uniquement après preuve sur projet généré.

## Ensuite

1. Capability Packs 2 — parité Spring + Angular + Flutter.
2. R8 — golden runtimes étendus (démarrage applicatif complet) sur les deux verticales.
3. R9 — compilateur de domaine CRUD NestJS/Spring.
4. R10 — upgrades et migrations blueprint.
5. R11 — distribution CLI/packages.
6. R12 — métriques d'adoption et feedback projets dérivés.
