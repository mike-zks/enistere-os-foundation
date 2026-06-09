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
| Core en cours | **UI Kit** (`@enistere/ui-kit`) — tokens **+ 6 primitives Web React** accessibles (64 tests, 100 % couverture, a11y jest-axe) |
| Packages officiels | `@enistere/api-contracts`, `@enistere/api-client-fetch` (validés **localement**, non publiés, **non intégrés**) |
| Cores documentaires | `cloud`, `web-nextjs`, `mobile-react-native` (spécification seule) |
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
    cloud/ web-nextjs/ mobile-react-native/ ui-kit/   → CORE_SPECIFICATION.md seul
    ai-core/ api-spring/ docs-core/ mobile-flutter/ quality-core/ web-angular/   → vides
  packages/
    api-contracts/     @enistere/api-contracts (0.1.0, privé)
    api-client-fetch/  @enistere/api-client-fetch (0.1.0, privé)
  package.json         racine privé, workspaces ["packages/*"]
  prompts/ templates/  présents ; tools/ examples/ vides
  README.md CHANGELOG.md
```

## 4. Cores

| Core | Dossier | Spécification | Starter/code | Statut officiel |
|---|---|---|---|---|
| `api-nestjs` | oui | oui | **oui** | **IMPLEMENTATION_AVANCEE** |
| `ui-kit` | oui | oui | **oui** (tokens + primitives Web) | **IMPLEMENTATION_PARTIELLE** |
| `cloud` | oui | oui | non | **SPECIFICATION_DOCUMENTAIRE** |
| `web-nextjs` | oui | oui | non | **SPECIFICATION_DOCUMENTAIRE** |
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
| `@enistere/api-contracts` | 0.1.0 | oui | oui (types-only, 11 tests) | **non** | **non** |
| `@enistere/api-client-fetch` | 0.1.0 | oui | oui (29 tests + live 16/16) | **non** | **non** |

Dépendance à sens unique : `openapi.json → api-contracts → api-client-fetch`. **Aucun** core client
(`web-nextjs`, `mobile-react-native`, …) ne consomme ces packages aujourd'hui (vérifié par recherche
d'import). Un package créé et testé **n'est pas** une intégration.

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
+ Testing Library + jest-axe), **100 % couverture**. Aucune CI : exécution **manuelle/locale**.

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
2. **Packages non intégrés** — créés/validés mais aucun core ne les consomme ; risque de dérive si le
   contrat évolue sans régénération (mitigé par `generate:check`, non automatisé).
3. **Spécifications sans starter** — 4 cores documentaires peuvent être lus à tort comme implémentés.
4. **Pas de CI** — non-régression et reproductibilité reposent sur l'exécution manuelle.
5. **Strategy Phase 0 partiellement datée** — contexte historique à ne pas confondre avec l'état réel.

## 14. Incohérences

Voir la liste détaillée dans [`IMPLEMENTATION_MATRIX.md`](./IMPLEMENTATION_MATRIX.md) §contradictions
et [`DECISIONS_REGISTER.md`](./DECISIONS_REGISTER.md). Principales : ADR validés non implémentés (UI,
CI/CD, registry, secure storage, cookies, server state) ; packages « officiels » non intégrés ;
`strategy/` Phase 0 vs implémentation réelle ; rapport `OPENAPI_CLIENT_PROOF` référençant un code de
preuve désormais retiré (bannière de migration ajoutée).

## 15. Prochaine étape

Le UI Kit fournit désormais **tokens + 6 primitives Web** (`@enistere/ui-kit`). **Action unique
recommandée** : initialiser le **Web Core Next.js minimal** (consommant `@enistere/api-client-fetch` +
`@enistere/ui-kit` + `styles.css`, hooks TanStack Query ADR-012) — OU compléter le UI Kit (composants
de formulaire/feedback supplémentaires) si jugé prioritaire. Détail : [`NEXT_ACTIONS.md`](./NEXT_ACTIONS.md).

## 16. Règles de mise à jour

Ce fichier est mis à jour **en fin de chaque mission** (voir [`README.md`](./README.md) §protocoles).
Toute affirmation doit être **vérifiable dans le repository**. Ne jamais marquer « validé » sans preuve
(tests/fichiers). Ne jamais confondre spécification, ADR, preuve, package et intégration.
