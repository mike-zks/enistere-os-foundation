# `core/api` — cadrage (vide en Web 1)

Emplacement réservé à la **couche d'accès API** du Web Core. **Aucun code en Web 1.**

En Web 1, il n'y a **aucun appel réseau**. Les paquets clients officiels du monorepo
(`@enistere/api-contracts`, `@enistere/api-client-fetch`) sont déclarés en dépendances et
**résolvent à la compilation** (preuve : `test/api-resolution.fixture.ts`), mais ne sont **pas
instanciés**.

Prévu (incréments ultérieurs, hors périmètre V1) :

- instanciation de `createEnistereApiClient` (depuis `@enistere/api-client-fetch`) ;
- BFF / route handlers serveur, cookies `HttpOnly`, CSRF ;
- hooks TanStack Query (ADR-012) maintenus dans ce core.

> Ne rien ajouter ici sans mission dédiée : la frontière « pas d'API en Web 1 » est explicite.
