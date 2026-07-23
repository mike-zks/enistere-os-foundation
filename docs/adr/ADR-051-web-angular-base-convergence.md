# ADR-051 — Convergence du socle Web Angular + invariants Web idiomatiques

- Statut : Validé
- Date : 2026-07-23
- Décideur : Owner Foundation

## Contexte

La mesure Web ([ADR-050](ADR-050-web-platform-contract-measurement.md)) a signalé un Angular base non conforme.
L'analyse directe (Phase A de la convergence) a révélé **deux mécompréhensions dans la mesure** :

1. **Invariants Web trop Next.js-centrés** : `generated-api-client` exigeait `@enistere/api-client-fetch`,
   `config-public-private` un split SSR, `error-boundary` un `error.tsx`. Or **Angular utilise
   idiomatiquement HttpClient + interceptors** (pas le client fetch) et est une SPA (config publique seule).
   La parité, c'est **le même contrat** (accès typé, erreur canonique, états UI), **pas la même lib** (§8.4).
2. **Faux négatifs** : la base Angular avait **déjà** les composants d'états
   (`shared/components/{loading,error,empty,success}-state`), mais l'évaluateur cherchait un mauvais nom de
   fichier (`error.component.ts`). Ce qui manquait **réellement** au socle : `core/errors/app-api-error`,
   `core/interceptors/{error,log}`, `core/server-state/request-state` — présents dans le full `src/`.

## Décision

1. **Raffiner les invariants Web** pour une mesure **idiomatique par framework** (renommages) :
   `config-public-private`→`typed-config`, `generated-api-client`→`typed-api-access`,
   `error-boundary`→`error-handling`. Next.js : api-client-fetch / `public+server-config` / `error.tsx` ;
   Angular : `api-config` (token SPA) / HttpClient + `app-api-error` / `error.interceptor`.
2. **Compléter la composition base Angular** avec ses features de contrat **de base** extraites du full `src/`
   (auth/refresh interceptors **exclus** — capability Auth) : `core/errors/app-api-error`,
   `core/interceptors/{error,log}.interceptor`, `core/server-state/request-state` ; câblage
   `withInterceptors([logInterceptor, errorInterceptor])` dans `app.config`.
3. **Résultat** : le socle Angular atteint la parité Web (typed-config, typed-api-access, ui-states,
   error-handling, observability) ; seule l'`accessibility` reste `partial`.

## Conséquences positives

- mesure Web **honnête et idiomatique** (fin des faux négatifs Next.js-centrés) ;
- socle Angular ≈ socle Next.js sur le contrat Web de base, prouvé par `enistere.conformance.json` calculé ;
- base saine pour les capabilities Web (Phase 3).

## Coûts et risques

- Les interceptors log/error sont désormais actifs sur chaque appel HTTP du socle → maîtrisé (golden
  `nestjs-angular-base` : Karma + build verts).
- **Parité des types générés** (Angular consommant `@enistere/api-contracts` au lieu de types écrits à la
  main) reste **différée** : `typed-api-access` mesure l'accès typé idiomatique, pas encore la dérivation du
  contrat généré.

## Périmètre

Inclus : raffinage des invariants Web ; extraction base Angular (error model, error/log interceptors,
request-state) + câblage `app.config`.

Exclus : auth/refresh interceptors (capability Auth) ; parité des contrats **générés** Angular (mission
dédiée) ; approfondissement a11y ; famille Mobile ; Next.js (déjà conforme).

## Alternatives rejetées

- **Exiger `@enistere/api-client-fetch` d'Angular** : impose une lib non idiomatique ; contredit §8.4.
- **Parité des types générés maintenant** : réécrit la couche API Angular, touche potentiellement l'auth.

## Migration

Additif au socle Angular (fichiers de contrat de base + câblage interceptors). Aucun changement d'API.

## Tests

`factory:test` (dont conformance Web) ; golden `nestjs-angular-base` (Karma test:ci + build) vert ;
`enistere.conformance.json` : Angular base `compliant` sur typed-config/typed-api-access/ui-states/
error-handling/observability.

## Rollback

`git revert` : la base Angular redevient un shell ; l'évaluateur re-signale les invariants correspondants.

## Suite

Missions séparées : parité des contrats **générés** Angular (`@enistere/api-contracts`) ; approfondissement
a11y ; capabilities Web (auth/rbac/files, Phase 3) ; famille Mobile.
