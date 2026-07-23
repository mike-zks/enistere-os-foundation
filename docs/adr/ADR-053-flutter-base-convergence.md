# ADR-053 — Convergence du socle Flutter (parité Mobile de base)

- Statut : Validé
- Date : 2026-07-23
- Décideur : Owner Foundation

## Contexte

La mesure Mobile ([ADR-052](ADR-052-mobile-platform-contract-measurement.md)) a montré un socle Flutter
**base-only** : navigation, config et états présents, mais **pas de `core/api/`** — d'où `typed-api-access`,
`error-handling` et `observability` non conformes (React Native, lui, `compliant` partout).

L'analyse directe (Phase A) du full `lib/src/core/api` a révélé un **couplage auth** :

- `app_api_error.dart`, `error_interceptor.dart`, `logging_interceptor.dart` — **auto-contenus** (base) ;
- `dio_client.dart` et `dio_provider.dart` — **couplés à l'auth** : `createDioClient` assemble aussi le
  `refresh_interceptor` (via `tokenReader`/`refresher`), et `dio_provider` lit `authControllerProvider`.

La convergence n'est donc **pas une copie pure** (contrairement au socle Angular) : le client et le provider
Dio doivent être **adaptés** pour la base (sans auth).

## Décision

**Compléter la composition base Flutter** avec ses features de contrat de base :

1. **Copier** les fichiers auto-contenus : `app_api_error`, `error_interceptor`, `logging_interceptor`.
2. **Adapter** pour la base (auth exclue) :
   - `dio_client.dart` — `createDioClient({config, logger?})` assemblant **logging → error canonique**
     seulement (pas de `_AuthInterceptor` ni `refresh_interceptor`) ;
   - `dio_provider.dart` — `apiConfigProvider` + `dioClientProvider` (client logging+error, sans
     `authController`).
3. **Dépendances** : ajouter `dio` et `flutter_riverpod` au `pubspec.yaml` de la base ; câbler `ProviderScope`
   dans `main.dart`.
4. La **capability Auth** surcouchera le token/refresh interceptor sur ce client de base.

## Conséquences positives

- le socle Flutter atteint la **parité Mobile de base** (typed-api-access, error-handling, observability) ;
- **les 6 runtimes** (NestJS, Spring, Next.js, Angular, React Native, Flutter) ont désormais la **parité de
  contrat de base**, entièrement **mesurée** par `enistere.conformance.json` ;
- base saine pour la capability Auth Mobile (Phase 3).

## Coûts et risques

- Le socle Flutter dépend maintenant de Dio + Riverpod → maîtrisé (golden `nestjs-flutter-base` :
  `flutter analyze` + `flutter test` + `dart format` verts).
- **Parité des contrats générés** Flutter (client dérivé d'`@enistere/api-contracts` plutôt qu'un client Dio
  écrit à la main) reste **différée**, comme pour Angular.

## Périmètre

Inclus : extraction/adaptation base Flutter (`core/api` : app_api_error, error/logging interceptors, dio_client,
dio_provider) + deps + `ProviderScope`.

Exclus : `refresh_interceptor` et `auth_controller` (capability Auth) ; secure storage ; parité des contrats
**générés** Flutter (mission dédiée) ; capabilities Mobile (Phase 3) ; Next.js/RN (déjà conformes).

## Alternatives rejetées

- **Copier `dio_client`/`dio_provider` tels quels** : embarque le refresh interceptor et le couplage
  `authController` dans le socle → viole la séparation base/capability.

## Migration

Additif au socle Flutter (`core/api` de base + deps + `ProviderScope`). Aucun changement d'API.

## Tests

Golden `nestjs-flutter-base` (`flutter analyze` + `flutter test` + `dart format`) vert ; `factory:test` ;
`enistere.conformance.json` : Flutter base `compliant` sur les 8 invariants Mobile de base.

## Rollback

`git revert` : le socle Flutter redevient un shell ; l'évaluateur re-signale typed-api-access/error-handling/
observability.

## Suite

Parité des contrats **générés** (Angular + Flutter) ; capabilities Mobile (auth/rbac/files, Phase 3) ; puis
Domain Compiler / Lifecycle (roadmap Phases 6-7).
