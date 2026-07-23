# ADR-052 — Mesure du Platform Contract de la famille Mobile

- Statut : Validé
- Date : 2026-07-23
- Décideur : Owner Foundation

## Contexte

Les familles API (complète) et Web (socle en parité) sont couvertes et **mesurées**
(`factory/conformance/`). La famille **Mobile** est la dernière de la convergence runtime. Comme pour le Web,
elle commence par **rendre la conformité mesurable** avant toute convergence.

Audit direct (Phase A) des deux runtimes Mobile :

- **React Native** — mûr : navigation expo-router (`app/`), config typée (`src/config/env.ts`), accès API
  (`@tanstack/react-query` + `src/query/query-client.ts`), états riches (`src/states/*`), gestion d'erreur
  (`query-errors`, `retry`), observabilité (`src/logger`, telemetry, crash-reporting).
- **Flutter** — **base-only** : la base (`base/lib/src`) a navigation (`router.dart`, go_router), config
  (`api_config.dart`) et états (`core/states/*`), mais **pas de `core/api/`** — le client Dio, les
  interceptors d'erreur et de logging, et `app_api_error` vivent dans le full `lib/src/core/api` seulement.

L'asymétrie reproduit celle du Web (RN mûr ≈ Next.js ; Flutter base-only ≈ Angular). La **mesure honnête**
doit précéder la convergence.

## Décision

**Rendre mesurable** le Platform Contract **de base** de la famille Mobile, sans convergence :

1. Définir les **invariants Mobile de base** (sous-ensemble de [`PLATFORM_CONTRACT`](../specifications/PLATFORM_CONTRACT.md)
   §Mobile, hors concerns de capability : session, secure storage, permissions, deep links, notifications,
   offline) : `navigation`, `typed-config`, `typed-api-access`, `ui-states`, `error-handling`,
   `observability`, `tests`, `build`.
2. **Étendre l'évaluateur** `factory/conformance/` à `family: 'mobile'` (`evaluateMobileApp` : React Native,
   Flutter), mesuré **idiomatiquement** par runtime (RN : TS/expo-router/react-query ; Flutter :
   Dart/go_router/Dio). `enistere.conformance.json` couvre désormais API + Web + Mobile.
3. **Aucune convergence** : les cibles émergent de la mesure ; la complétion du socle Flutter (extraction de
   `core/api` du full src, comme l'Angular) et la parité capabilities Mobile relèvent d'étapes ultérieures.

## Conséquences positives

- conformité Mobile **calculée** ; baseline honnête RN vs Flutter ;
- l'évaluateur couvre les **trois familles** (API, Web, Mobile) — la convergence runtime est entièrement
  mesurable ;
- l'écart Flutter base devient explicite, cadrant une convergence dédiée.

## Coûts et risques

- Évaluation **structurelle** (présence de fichiers/deps idiomatiques), pas runtime : cohérent avec API et Web.

## Périmètre

Inclus : invariants Mobile de base ; `evaluateMobileApp` (React Native, Flutter) ; tests.

Exclus : convergence du socle Flutter (mission dédiée) ; parité capabilities Mobile (Phase 3) ; secure
storage/session/permissions/deep-links/notifications/offline (capability/feature) ; iOS build réel
(macOS/Xcode).

## Alternatives rejetées

- **Mesure + convergence Flutter immédiate** : l'écart est large ; la mesure honnête doit précéder.
- **Invariants RN-centrés** : répéterait l'erreur corrigée par ADR-051 — la mesure est idiomatique par runtime.

## Tests

Évaluation Mobile sur RN et Flutter générés (`nestjs-react-native-base`, `nestjs-flutter-base`) : RN largement
`compliant` ; Flutter base honnêtement `missing` sur typed-api-access/error-handling/observability (pas de
`core/api`).

## Rollback

Additif (mesure) : suppression sans impact runtime.

## Suite

Convergence du socle Flutter (extraction `core/api`) ; capabilities Mobile (Phase 3) ; puis Domain Compiler /
Lifecycle (roadmap Phases 6-7).
