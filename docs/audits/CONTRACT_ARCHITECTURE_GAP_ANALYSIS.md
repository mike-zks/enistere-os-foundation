# Analyse d'écart — Architecture des contrats

> **CLOS — analyse historique, arrêtée au 2026-07-21.**
> Les contrats produit neutres existent pour auth, rbac et files (ADR-068 à ADR-070).
> Ce document est conservé comme preuve de l'état observé à sa date : **il ne décrit
> plus le dépôt**. L'état courant fait foi —
> [`FOUNDATION_CURRENT_STATE`](../project-status/FOUNDATION_CURRENT_STATE.md),
> [`TARGET_VS_CURRENT_IMPLEMENTATION`](TARGET_VS_CURRENT_IMPLEMENTATION.md).

Cible : [Contract Architecture](../architecture/CONTRACT_ARCHITECTURE.md).

## Source canonique actuelle

- Source unique : `packages/api-contracts/contract/openapi.json` (un seul OpenAPI, ADR-016).
- Génération : `packages/api-contracts/scripts/generate.mjs` → `openapi-typescript` →
  types TypeScript (`src/generated/`). Client : `packages/api-client-fetch` (fetch typé TS).
- Consommation : le starter NestJS **est** la source effective du contrat (il produit l'OpenAPI vérifié
  par `openapi:check`) ; Spring **reproduit** ce contrat dans son propre code, vérifié par
  `api-spring-verify`.

## Confrontation à la cible

La cible exige `contracts/{http,schemas,events,errors,permissions,telemetry}/`, une génération
**polyglotte** (TypeScript, **Java**, **Dart**, server bindings, test fixtures) et pose :

> « Aucun package TypeScript n'est la source unique d'un contrat polyglotte. »

| Dimension | Cible | Réel | Écart |
|---|---|---|:--:|
| Répertoire canonique | `contracts/` racine | `packages/api-contracts/` | REFACTOR |
| HTTP (OpenAPI) | oui | oui | KEEP |
| Schemas (JSON Schema) | source dédiée | dérivés de l'OpenAPI | PARTIAL |
| Events (AsyncAPI/`.vN`) | oui | **absent** | CREATE |
| Errors (Problem Details) | contrat versionné | codes épars par capability | REFACTOR |
| Permissions (id versionnés) | contrat | épars (RBAC) | REFACTOR |
| Telemetry | contrat | **absent** | CREATE |
| Génération TS | oui | oui | KEEP |
| Génération **Java** | oui | **absente** (Spring code à la main) | CREATE |
| Génération **Dart** | oui | **absente** | CREATE |
| Server bindings / fixtures | oui | partiels (TS) | REFACTOR |

## Dépendance à TypeScript

La chaîne entière est TS : outil de génération (`openapi-typescript`), package publié
(`@enistere/api-contracts`), client (`@enistere/api-client-fetch`). Les runtimes non-JS (Spring, Flutter)
ne **consomment** pas un artefact généré depuis la source canonique — ils réimplémentent le contrat, puis
sont vérifiés *a posteriori*. Le contrat est donc **centré TypeScript**, contrairement à l'exigence de
neutralité.

## Question imposée par la mission

> Est-il aujourd'hui possible de garantir que Spring et NestJS exposent **exactement le même produit
> contractuel** ?

**Non.** Preuves :

1. Il n'existe pas de contrat polyglotte neutre : l'OpenAPI est produit/porté par la verticale TS, non
   une source dont Java serait un consommateur généré (`packages/api-contracts/scripts/generate.mjs`
   n'émet que du TS).
2. L'équivalence Spring↔NestJS est **asseurée par composition**, pas par contrat : `api-spring-verify`
   et les goldens `spring-auth`/`spring-auth-rbac` prouvent que Spring boote et se comporte, mais aucune
   **suite de conformité de contrat commune** ne compare l'observable des deux adapters (voir
   [P0-1](FOUNDATION_V2_IMPLEMENTATION_GAP_AUDIT.md)).
3. La parité de surface est déjà rompue : Spring n'expose pas `files`, donc le « produit contractuel »
   diffère factuellement (voir [parité](CAPABILITY_PARITY_GAP_MATRIX.md)).

## Traitement

| Écart | Type | Sévérité | Traitement |
|---|---|:--:|---|
| Contrats centrés TS, pas de génération Java/Dart | CONTRACT | **P0** | CREATE / REFACTOR |
| Pas de `contracts/{events,telemetry}` | CONTRACT | P1 | CREATE |
| Errors/permissions non versionnés en contrat | CONTRACT | P2 | REFACTOR |
| `api-contracts` / `api-client-fetch` (TS) | CONTRACT | — | KEEP (deviennent une *cible de génération* parmi d'autres) |
