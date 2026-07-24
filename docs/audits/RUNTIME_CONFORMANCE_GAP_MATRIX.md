# Matrice de conformité des runtimes

Conformité des six runtimes actuels (`starters/`, conceptuellement de futurs *runtime adapters*) au
[Platform Contract](../specifications/PLATFORM_CONTRACT.md) et à la
[Runtime Adapter Specification](../specifications/RUNTIME_ADAPTER_SPECIFICATION.md).

Statuts : `COMPLIANT` · `PARTIAL` · `MISSING` · `NOT_APPLICABLE` · `UNKNOWN`.

> Avertissement de méthode : aucune suite exécutable **commune** ne mesure ces invariants (voir
> [P0-1](FOUNDATION_V2_IMPLEMENTATION_GAP_AUDIT.md)). Les statuts ci-dessous sont fondés sur la
> présence de fichiers/tests et sur la couverture golden runtime (boot/build prouvés), **pas** sur une
> preuve d'équivalence observable. Un `COMPLIANT` signifie « présent et exercé par les gates propres du
> runtime », non « prouvé équivalent à l'adapter jumeau ».

## Matrice

| Invariant | NestJS | Spring | Next.js | Angular | React Native | Flutter |
|---|:--:|:--:|:--:|:--:|:--:|:--:|
| Configuration validée | COMPLIANT | COMPLIANT | PARTIAL | PARTIAL | PARTIAL | PARTIAL |
| Gestion d'erreurs canonique | COMPLIANT | PARTIAL | PARTIAL | PARTIAL | PARTIAL | PARTIAL |
| Logs structurés | COMPLIANT | PARTIAL | PARTIAL | UNKNOWN | PARTIAL | PARTIAL |
| Correlation ID | COMPLIANT | PARTIAL | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN |
| Observabilité (metrics/tracing) | PARTIAL | PARTIAL | MISSING | MISSING | MISSING | MISSING |
| Sécurité de base | COMPLIANT | COMPLIANT | COMPLIANT | PARTIAL | COMPLIANT | PARTIAL |
| Contrats générés | COMPLIANT | PARTIAL | COMPLIANT | PARTIAL | PARTIAL | PARTIAL |
| Tests unitaires | COMPLIANT | COMPLIANT | COMPLIANT | COMPLIANT | COMPLIANT | COMPLIANT |
| Tests d'intégration | COMPLIANT | COMPLIANT | PARTIAL | PARTIAL | PARTIAL | PARTIAL |
| Tests de contrat | COMPLIANT | PARTIAL | PARTIAL | MISSING | MISSING | MISSING |
| Points d'extension capabilities | COMPLIANT | COMPLIANT | COMPLIANT | MISSING | COMPLIANT | MISSING |
| Lifecycle support | MISSING | MISSING | MISSING | MISSING | MISSING | MISSING |
| Golden runtime | COMPLIANT | PARTIAL | PARTIAL | PARTIAL | PARTIAL | PARTIAL |

## Preuves clés

- **NestJS** — le plus mature. Config validée (`registerAs` + class-validator, `starters/nestjs`),
  erreurs canoniques (`test/openapi-contract.e2e-spec.ts`, error-codes), logging structuré (ADR-040),
  health (`/health` + terminus, `starter.manifest.json` `healthPath`), contrat via `openapi:check`.
  Golden runtime : `nestjs-base/auth/auth-rbac/files` + `nestjs-{next,angular,react-native,flutter}-base`
  (`.github/workflows/factory-golden-runtime.yml:49-69`).
- **Spring** — base + auth + rbac **runtime-proven** (`spring-base`, `spring-auth`, `spring-auth-rbac`).
  Config Java (`starters/spring/.../config/`), gestion d'erreurs et client API décrits en
  spécification ; observabilité/tracing non prouvés. Gate `api-spring-verify` en CI.
- **Next.js** — sécurité BFF forte (CSRF/Origin, cookies HttpOnly), client API généré, capabilities
  auth/rbac/files prouvées via `nest-next-*`. Observabilité/correlation non établies.
- **Angular** — **base uniquement**. `errors/app-api-error.ts` présent, mais aucune capability
  (auth/rbac/files toutes `planned`) et golden seulement `*-angular-base`. Points d'extension capability
  absents.
- **React Native** — auth + files **runtime-proven** via `triple-*` ; RBAC `not-applicable`. Secure
  storage (ADR-015), 401 bridge. Observabilité/telemetry hors périmètre volontaire.
- **Flutter** — **base uniquement**. Tests présents (`test/unit/api/dio_client_test.dart`), mais aucune
  capability et golden seulement `*-flutter-base`. Points d'extension capability absents.

## Lecture

- **Lifecycle support = MISSING partout** : aucun runtime n'expose de seam d'upgrade/migrate/reconcile
  (voir [Factory](FACTORY_ENGINE_GAP_ANALYSIS.md)). C'est un manque **transversal**, pas par-runtime.
- **Observabilité = MISSING/PARTIAL partout** : metrics/tracing ne sont pas un invariant tenu ; le
  Platform Contract les exige (« logs, metrics et tracing »).
- **Points d'extension** : présents et prouvés sur NestJS/Spring/Next.js/RN (overlays branchés),
  **absents** sur Angular/Flutter (coquilles base-only).
- Aucun `COMPLIANT` n'est adossé à une **suite de conformité commune** : la colonne « Golden runtime »
  prouve le *boot/build*, jamais l'*équivalence produit* entre jumeaux (voir
  [Goldens & conformité](GOLDEN_AND_CONFORMANCE_GAP_ANALYSIS.md)).
