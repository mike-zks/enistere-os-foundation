# FOUNDATION_CURRENT_STATE.md — État courant officiel d'Enistere OS Foundation

> **Photographie officielle** de l'état réel du repository, vérifiée fichier par fichier.
> **Dernière mise à jour : 2026-06-09.**
>
> ⚠️ **Ne pas supposer qu'un core est implémenté parce que sa spécification existe.** Un
> `CORE_SPECIFICATION.md` ≠ un starter ; un README ≠ une implémentation ; un rapport ≠ une preuve
> runtime ; un dossier ≠ un core fonctionnel ; un ADR ≠ du code ; une preuve ≠ un package officiel ;
> un package officiel ≠ une intégration dans un core client.

## 1. Statut global

Le repository combine la **Phase 0 (stratégie + ADR + spécifications)** et des **implémentations
techniques réelles** : le **API Core NestJS**, deux **packages clients officiels**, et le **UI Kit**
(design tokens **+ premières primitives Web React**). Les autres cores sont **documentaires** ou
**vides**. **Aucun client Web/Mobile applicatif n'est implémenté** (le UI Kit fournit tokens + primitives,
pas une application ni une bibliothèque complète).

| Catégorie | État |
|---|---|
| Stratégie (Phase 0) | 10 documents présents |
| ADR | 18 ADR rédigés et **Validés** (001–016, 039, 040) ; ADR-017→038 = backlog non rédigé |
| Core implémenté | **API Core NestJS** (avancé, testé, revu) |
| Core en cours | **UI Kit** (`@enistere/ui-kit`, v0.1.1) — tokens **+ 6 primitives Web React** accessibles (64 tests, 100 % couverture, a11y) ; aligné **React 19** ; **consommé par le Web Core** |
| Web Core | **`@enistere/web-nextjs`** — **IMPLEMENTATION_PARTIELLE** : Next 16 App Router + React 19, UI Kit + **API publique (Health) + TanStack Query** (SSR/hydratation) + **BFF Auth** (`login`/`refresh`/`logout`/`csrf` via Route Handlers, cookies `HttpOnly`, **CSRF** double-submit, Origin/Referer). **169 tests** + preuve API réelle Auth. Pas de `me`/page/middleware. |
| Packages officiels | `@enistere/api-contracts`, `@enistere/api-client-fetch` (validés **localement**, non publiés ; **instanciés (public)** dans le Web Core — preuve API réelle) |
| Cores documentaires | `cloud`, `mobile-react-native` (spécification seule) |
| Cores vides | `ai-core`, `api-spring`, `docs-core`, `mobile-flutter`, `quality-core`, `web-angular` |
| CI/CD, conteneurisation | **Absents** (aucun workflow ni Dockerfile dans le dépôt) |
| **État Git** | **Baseline locale créée** — commit `7dcb543` sur `main` (322 fichiers) ; remote `origin` configuré, **non poussé** |

## 2. Principes de vérité

Hiérarchie de confiance (du plus fiable au moins fiable) : **(1)** fichiers/code réels ; **(2)** tests,
scripts, `package.json`, migrations, configs ; **(3)** ADR validés ; **(4)** `CORE_SPECIFICATION.md` ;
**(5)** `strategy/` ; **(6)** README/rapports ; **(7)** CHANGELOG. En cas de contradiction, le code et
les tests réels priment ; un ADR validé prime sur un choix ouvert dans une spécification ; une
spécification ne prouve pas un starter ; un dossier vide ne prouve aucune implémentation.

## 3. Architecture du repository

```
enistere-os-foundation/
  strategy/            10 docs Phase 0 (01..10)
  docs/
    adr/               18 ADR (001–016, 039, 040) + ADR_BACKLOG + ADR_V1_BLOCKING_REVIEW
    project-status/    CE checkpoint (source de pilotage officielle)
    checklists/ decisions/ glossary/ guides/ onboarding/ runbooks/
  cores/
    api-nestjs/        IMPLÉMENTÉ (src, prisma, test, openapi, scripts, docs, proofs/)
    ui-kit/            STARTER (tokens + 6 primitives Web, React 19) — v0.1.1
    web-nextjs/        PARTIEL (Next 16 + React 19 ; UI Kit + API publique + TanStack Query + BFF Auth login/refresh/logout+CSRF)
    cloud/ mobile-react-native/                       → CORE_SPECIFICATION.md seul
    ai-core/ api-spring/ docs-core/ mobile-flutter/ quality-core/ web-angular/   → vides
  packages/
    api-contracts/     @enistere/api-contracts (0.1.0, privé)
    api-client-fetch/  @enistere/api-client-fetch (0.1.0, privé)
  package.json         racine privé, workspaces ["packages/*","cores/ui-kit","cores/web-nextjs"]
  prompts/ templates/  présents ; tools/ examples/ vides
  README.md CHANGELOG.md
```

## 4. Cores

| Core | Dossier | Spécification | Starter/code | Statut officiel |
|---|---|---|---|---|
| `api-nestjs` | oui | oui | **oui** | **IMPLEMENTATION_AVANCEE** |
| `ui-kit` | oui | oui | **oui** (tokens + primitives Web, React 19) | **IMPLEMENTATION_PARTIELLE** |
| `cloud` | oui | oui | non | **SPECIFICATION_DOCUMENTAIRE** |
| `web-nextjs` | oui | oui | **oui** (Next 16 + UI Kit + API publique + TanStack Query) | **IMPLEMENTATION_PARTIELLE** |
| `mobile-react-native` | oui | oui | non | **SPECIFICATION_DOCUMENTAIRE** |
| `ai-core` | oui (vide) | non | non | **DOSSIER_SEULEMENT** |
| `api-spring` | oui (vide) | non | non | **DOSSIER_SEULEMENT** |
| `docs-core` | oui (vide) | non | non | **DOSSIER_SEULEMENT** |
| `mobile-flutter` | oui (vide) | non | non | **DOSSIER_SEULEMENT** |
| `quality-core` | oui (vide) | non | non | **DOSSIER_SEULEMENT** |
| `web-angular` | oui (vide) | non | non | **DOSSIER_SEULEMENT** |

**API Core NestJS** — modules présents : `config`, `database` (Prisma/PostgreSQL), `health`,
`auth` (login, sessions, refresh, JWT), `users`, `roles`, `permissions`, `audit`, `files` (S3/MinIO),
`common` (logging Pino, filtres, interceptors, OpenAPI), `bootstrap`, `upload` (cadrage). **5
migrations** Prisma, **47 specs unitaires**, **12 specs e2e**, snapshot OpenAPI canonique versionné,
seed RBAC, commandes CLI fichiers. Rapports : `API_CORE_V1_REVIEW`, `AUTH_RBAC_REVIEW`, `FILES_REVIEW`,
`API_CORE_V1_IMPLEMENTATION_STATUS`, `API_CORE_V1_NEXT_ROADMAP`, `OPENAPI_CLIENT_PROOF`,
`STRUCTURED_LOGGING_COMPATIBILITY_PROOF`. Détail : [`../../cores/api-nestjs/docs/API_CORE_V1_IMPLEMENTATION_STATUS.md`](../../cores/api-nestjs/docs/API_CORE_V1_IMPLEMENTATION_STATUS.md).

## 5. Packages

| Package | Version | Privé | Build/Tests | Publié | Intégré dans un core |
|---|---|---|---|---|---|
| `@enistere/api-contracts` | 0.1.0 | oui | oui (types-only, 11 tests) | **non** | **consommé (types) dans `web-nextjs`** |
| `@enistere/api-client-fetch` | 0.1.0 | oui | oui (29 tests + live 16/16) | **non** | **instancié (public/Health) dans `web-nextjs`** |

Dépendance à sens unique : `openapi.json → api-contracts → api-client-fetch`. Le **UI Kit** et les
**paquets API** sont désormais **réellement intégrés** par le Web Core pour les endpoints **publics**
(Health) : `api-client-fetch` est **instancié** (factory serveur par requête + client public
navigateur), avec preuve **API réelle**. Reste hors périmètre : l'usage **authentifié** (BFF/cookies).

## 6. Stratégie (Phase 0)

10 documents présents (`strategy/01_VISION_FINAL.md` … `10_AI_STRATEGY.md`). Certains décrivent un état
« avant code » ou des choix désormais tranchés par des ADR : à lire comme **contexte historique**,
non comme l'état courant (voir §16). Non modifiés par cette mission.

## 7. ADR

**18 ADR rédigés et Validés** : ADR-001..016, ADR-039, ADR-040. ADR-017→038 sont **listés dans
`ADR_BACKLOG.md`** mais **non rédigés** (statut « À rédiger », futurs/non bloquants). Détail et statut
d'implémentation : [`DECISIONS_REGISTER.md`](./DECISIONS_REGISTER.md).

## 8. Implémentations

Implémenté + testé + revu : Auth, sessions, refresh, RBAC, permissions, audit, Files (S3/MinIO),
logging structuré, contrat OpenAPI canonique. Implémenté (local, non publié, non intégré) : packages
clients. Décidé mais non implémenté : UI (tokens/stacks), cookies/CSRF web, secure storage mobile,
server state (TanStack Query), CI/CD, registry. Détail : [`IMPLEMENTATION_MATRIX.md`](./IMPLEMENTATION_MATRIX.md).

## 9. Tests

API Core : **377 tests unitaires** (47 suites) + **101 tests e2e** (12 suites, PostgreSQL + MinIO
jetables), couverture disponible. Packages : api-contracts **11**, api-client-fetch **29** (`node:test`),
+ preuve live **16/16** (client officiel vs API réelle). UI Kit : **64 tests** (`node:test` + `global-jsdom`
+ Testing Library + jest-axe, **React 19**), **100 % couverture**. Web Core : **112 tests** (`node:test` :
config/URL, clients serveur/public, QueryClient/retry, query keys, transport Health, hooks, **hydratation**,
UI, mapping d'erreurs, garde anti-réseau, **Auth** : cookie-config, session adapter, factory
read-only/writable, **CSRF** (gén/validation temps constant), **Origin/Referer**, validation login, handlers
`csrf`/`login`/`refresh`/`logout`, isolation A/B, frontières d'import, **sentinelles**) + `next build` +
**sonde HTTP** + **preuve API réelle Auth** (NestJS + PostgreSQL jetable : login/refresh/logout, cookies
HttpOnly, CSRF, Origin, rotation, refresh-après-logout). Aucune CI : exécution **manuelle/locale**.

## 10. Preuves

- `OPENAPI_CLIENT_PROOF.md` — preuve `openapi-typescript`/`openapi-fetch` (concluante, **migrée** en
  packages ; code de preuve retiré, voir `cores/api-nestjs/proofs/openapi-client/README.md`).
- `STRUCTURED_LOGGING_COMPATIBILITY_PROOF.md` — compatibilité `nestjs-pino` (repli Pino direct, ADR-040).

## 11. CI/CD

**Absent.** `.github/` contient uniquement des templates PR/issue ; aucun workflow ; aucun Dockerfile
ni compose dans le dépôt. ADR-013 (CI/CD) et ADR-014 (registry) sont **Validés mais non implémentés**.

## 12. Documentation

Riche : stratégie, ADR, spécifications, rapports API, READMEs de modules. Ce checkpoint
(`docs/project-status/`) devient la **source de pilotage** ; les rapports API restent la référence
détaillée du API Core.

## 13. Risques

1. ~~Aucun commit Git~~ **RÉSOLU (local)** — baseline `7dcb543` créée sur `main` (ADR-001 exercé
   localement). Reste : **non poussée** vers `origin` (décision humaine/gouvernance).
2. **Packages intégrés (public)** — UI Kit consommé + `api-client-fetch` **instancié** (endpoints
   publics) par le Web Core ; usage **authentifié** non encore intégré. Risque de dérive si le contrat
   évolue sans régénération (mitigé par `generate:check`, non automatisé).
3. **Spécifications sans starter** — `cloud` et `mobile-react-native` peuvent être lus à tort comme implémentés.
4. **Pas de CI** — non-régression et reproductibilité reposent sur l'exécution manuelle.
5. **Strategy Phase 0 partiellement datée** — contexte historique à ne pas confondre avec l'état réel.

## 14. Incohérences

Voir la liste détaillée dans [`IMPLEMENTATION_MATRIX.md`](./IMPLEMENTATION_MATRIX.md) §contradictions
et [`DECISIONS_REGISTER.md`](./DECISIONS_REGISTER.md). Principales : ADR validés non implémentés (UI,
CI/CD, registry, secure storage, cookies, server state) ; packages « officiels » non intégrés ;
`strategy/` Phase 0 vs implémentation réelle ; rapport `OPENAPI_CLIENT_PROOF` référençant un code de
preuve désormais retiré (bannière de migration ajoutée).

## 15. Prochaine étape

Le **Web Core** (`@enistere/web-nextjs`, **`IMPLEMENTATION_PARTIELLE`**) expose désormais les **flux BFF
Auth** (`login`/`refresh`/`logout`/`csrf` via Route Handlers) : cookies `HttpOnly` access/refresh,
**CSRF** double-submit, Origin/Referer, rotation, logout idempotent — **prouvés contre l'API réelle**
(169 tests). Restent : `me`/`authorization`, page de connexion, middleware, hooks Auth. **Prochaine
action recommandée** : **Web Auth 3** — `me`/`authorization` + session via TanStack Query.
Détail : [`NEXT_ACTIONS.md`](./NEXT_ACTIONS.md).

## 16. Règles de mise à jour

Ce fichier est mis à jour **en fin de chaque mission** (voir [`README.md`](./README.md) §protocoles).
Toute affirmation doit être **vérifiable dans le repository**. Ne jamais marquer « validé » sans preuve
(tests/fichiers). Ne jamais confondre spécification, ADR, preuve, package et intégration.
