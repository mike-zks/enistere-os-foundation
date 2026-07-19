# Prochaines actions

## Action unique

**Capability Packs 1C — Files pour NestJS, Next.js et React Native**

Transformer le dernier payload parqué (`capabilities/files/targets/*`) en overlay déclaratif
composable au-dessus de `base + auth` :

1. overlay `files` NestJS : fragment Prisma JSON (`StoredFile` + relation propriétaire dans le
   modèle intermédiaire), migration dédiée, dépendances S3/MinIO, throttlers `upload`/`download`,
   seed éventuel via registre, scripts d'exploitation et e2e historiques ;
2. overlay `files` Next.js : BFF fichiers, routes `/api/files/*`, écrans protégés, hooks et vues ;
3. overlay `files` React Native : upload seam et écran de diagnostics ;
4. aucune copie d'un fichier central : utiliser les seams Prisma, seed, OpenAPI et sections Web
   livrés par 1B-R ;
5. goldens runtime `*-files` verts (install reproductible, migrations, OpenAPI composé, tests,
   audit) ;
6. non-régression Files V1 documentée et prouvée ;
7. `files` passe à `ready`/`overlay` uniquement après preuve sur projet généré.

## Ensuite

1. Capability Packs 2 — parité Spring + Angular + Flutter.
2. R8 — golden runtimes étendus (démarrage applicatif complet) sur les deux verticales.
3. R9 — compilateur de domaine CRUD NestJS/Spring.
4. R10 — upgrades et migrations blueprint.
5. R11 — distribution CLI/packages.
6. R12 — métriques d'adoption et feedback projets dérivés.
