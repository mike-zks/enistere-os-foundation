# ADR-050 — Mesure du Platform Contract de la famille Web

- Statut : Validé
- Date : 2026-07-23
- Décideur : Owner Foundation

## Contexte

Le Platform Contract minimal de la famille **API** est complet et **mesuré** (ADR-047/048/049 :
`factory/conformance/` émet `enistere.conformance.json`). L'extension à la famille **Web** commence, comme
l'API, par **rendre la conformité mesurable** avant toute convergence.

Audit direct (Phase A) des deux runtimes Web :

- **Next.js** — mûr : App Router (`src/app` avec `error.tsx`/`loading.tsx`/`not-found.tsx`), config
  publique/privée explicite (`core/config/{public-config,server-config}.ts`), **client API généré**
  (`@enistere/api-client-fetch`), a11y (`jest-axe`), tests unit + e2e.
- **Angular** — **base-only** : routing (`app.routes.ts`), `core/config/api-config.ts`, mais **aucune
  dépendance `@enistere/*`** (pas le client généré), ni gestion d'erreur/états/a11y au socle ; capabilities
  auth/rbac/files `planned`.

L'asymétrie est forte (contrairement à la paire API). La convergence prématurée serait risquée ; la **mesure
honnête** doit la précéder et en cadrer les cibles.

## Décision

**Rendre mesurable** le Platform Contract **de base** de la famille Web, sans convergence encore :

1. Définir les **invariants Web de base** (sous-ensemble de [`PLATFORM_CONTRACT`](../specifications/PLATFORM_CONTRACT.md)
   §Web, hors concerns de capability auth `session`/`contrôle d'accès`) :
   `routing`, `config-public-private`, `generated-api-client`, `ui-states` (loading/error/empty),
   `error-boundary`, `accessibility`, `observability`, `tests`, `build`.
2. **Étendre l'évaluateur** `factory/conformance/` à `family: 'web'` (`evaluateWebApp` : Next.js, Angular) ;
   généraliser l'émission de `enistere.conformance.json` à **toutes** les familles d'un projet (API + Web).
3. **Aucune convergence** dans cette mission : les cibles émergent de la mesure ; la parité capabilities Web
   (auth/rbac/files sur Angular) relève de la roadmap Phase 3, différée.

## Conséquences positives

- conformité Web **calculée** (fin de la matrice manuelle pour le Web) ; baseline honnête Next.js vs Angular ;
- l'écart Next↔Angular devient **explicite et mesuré**, cadrant une mission de convergence dédiée ;
- l'évaluateur devient **multi-familles** (API + Web), prêt pour Mobile ensuite.

## Coûts et risques

- Évaluation **structurelle** (présence de fichiers/deps/scripts), pas runtime : un `compliant` signifie
  « présent et idiomatique », pas « prouvé équivalent » (cohérent avec l'API, où la parité runtime est
  layered opt-in).

## Périmètre

Inclus : invariants Web de base ; `evaluateWebApp` (Next.js, Angular) ; `buildConformance` multi-familles ;
tests.

Exclus : convergence Web (mission dédiée) ; parité capabilities Angular (Phase 3) ; session/contrôle d'accès
(capability auth) ; famille Mobile ; metrics/tracing.

## Alternatives rejetées

- **Mesure + convergence minimale immédiate** : l'écart Next↔Angular est trop large pour une convergence sûre
  sans la mesure préalable.
- **Parité capabilities Angular maintenant** : énorme, relance la roadmap Phase 3.

## Tests

Évaluation Web sur Next.js et Angular générés (`nest-next-base`, `nestjs-angular-base`) : `enistere.conformance.json`
contient les apps `web` avec leurs invariants ; Next.js largement `compliant`, Angular base honnêtement
`missing`/`partial` sur client généré, error-boundary, états, a11y.

## Rollback

Additif (mesure) : suppression sans impact runtime.

## Suite

Mission de convergence Web dédiée (cibles issues de la mesure) ; puis famille Mobile ; capabilities Web (Phase 3).
