# Prochaines actions

## Action unique

**Capability Packs 2 — parité Auth/RBAC/Files pour Spring, Angular et Flutter**

Étendre les capabilities `auth`, `rbac` et `files` validées sur la verticale TypeScript aux starters
Spring, Angular et Flutter, sans
dupliquer le contrat public ni contourner les seams de la Factory :

1. choisir séparément l'implémentation de stockage et de multipart par target, sous les ADR existants ;
2. produire les overlays Spring, Angular et Flutter avec les mêmes DTO/opérations publiques ; leurs baselines sont maintenant modulaires ;
3. ajouter les goldens générés et les gates propres à chaque target ;
4. conserver `files` indépendant des capacités futures d'admin, sync et offline ;
5. documenter la parité et les écarts avant de passer chaque target à `ready`.

La matrice de profils (R7) donne la cible mesurable de cette action : faire passer les profils
`planned` Angular/Flutter de `factory/engine/profiles.mjs` à `supported`, puis à `ready` lorsqu'un golden les prouve.
`enistere profiles` mesure l'avancement, et `factory/test/profiles.test.mjs` refuse tout statut que
la matrice réelle ne soutient pas.

## Ensuite

1. Capability Packs 2 — parité Angular + Flutter (profils `planned` → `supported` → `ready`). Spring
   base est déjà modulaire ; ses capabilities métier restent la suite dédiée.
2. R8 — golden runtimes étendus (démarrage applicatif complet) sur les deux verticales, à commencer
   par les neuf profils `supported` qui restent sans preuve runtime. Un profil ne passe `supported`
   → `ready` que lorsqu'un golden le prouve : aucune promotion automatique.
3. R9 — compilateur de domaine CRUD NestJS/Spring.
4. R10 — upgrades et migrations blueprint.
5. R11 — distribution CLI/packages.
6. R12 — métriques d'adoption et feedback projets dérivés.
