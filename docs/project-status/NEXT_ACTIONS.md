# Prochaines actions

## Action unique

**Capability Packs 2 — Files Spring**

Auth et RBAC Spring sont désormais autonomes et composés. Étendre `files` à Spring avant de passer
à Angular et Flutter, sans
dupliquer le contrat public ni contourner les seams de la Factory :

1. composer Files Spring au-dessus de `base + auth + rbac` avec les mêmes DTO/opérations publiques ;
2. ajouter le golden généré et les gates Spring ;
3. conserver `files` indépendant des capacités futures d'admin, sync et offline ;
4. documenter la parité et les écarts avant de passer la target à `ready`.

La matrice de profils (R7) donne la cible mesurable de cette action : faire passer les profils
`planned` Angular/Flutter de `factory/engine/profiles.mjs` à `supported`, puis à `ready` lorsqu'un golden les prouve.
`enistere profiles` mesure l'avancement, et `factory/test/profiles.test.mjs` refuse tout statut que
la matrice réelle ne soutient pas.

## Ensuite

1. Capability Packs 2 — parité Angular + Flutter (profils `planned` → `ready` avec overlay et golden).
2. R8 — golden runtimes étendus avec démarrage applicatif complet sur les verticales prêtes. Un
   profil ne passe à `ready` que lorsqu'un golden le prouve : aucune promotion automatique.
3. R9 — compilateur de domaine CRUD NestJS/Spring.
4. R10 — upgrades et migrations blueprint.
5. R11 — distribution CLI/packages.
6. R12 — métriques d'adoption et feedback projets dérivés.
