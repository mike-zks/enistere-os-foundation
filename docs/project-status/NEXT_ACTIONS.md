# Prochaines actions

## Action unique

**Capability Packs 2 — parité Files pour Spring, Angular et Flutter**

Étendre la capability `files` validée sur la verticale TypeScript aux starters restants, sans
dupliquer le contrat public ni contourner les seams de la Factory :

1. choisir séparément l'implémentation de stockage et de multipart par target, sous les ADR existants ;
2. produire les overlays Spring, Angular et Flutter avec les mêmes DTO/opérations publiques ;
3. ajouter les goldens générés et les gates propres à chaque target ;
4. conserver `files` indépendant des capacités futures d'admin, sync et offline ;
5. documenter la parité et les écarts avant de passer chaque target à `ready`.

## Ensuite

1. Capability Packs 2 — parité Spring + Angular + Flutter.
2. R8 — golden runtimes étendus (démarrage applicatif complet) sur les deux verticales.
3. R9 — compilateur de domaine CRUD NestJS/Spring.
4. R10 — upgrades et migrations blueprint.
5. R11 — distribution CLI/packages.
6. R12 — métriques d'adoption et feedback projets dérivés.
