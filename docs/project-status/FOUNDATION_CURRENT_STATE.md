# FOUNDATION_CURRENT_STATE.md — État courant officiel d'Enistere OS Foundation

> **Photographie officielle** de l'état réel du repository, vérifiée fichier par fichier.
> **Dernière mise à jour : 2026-06-10.**
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
| Core en cours | **UI Kit** (`@enistere/ui-kit`, v0.1.1) — tokens **+ 9 primitives Web React** accessibles (Button/Input/Label/Text/Spinner/VisuallyHidden + **Alert/Card/FormField**, Web UI 1) ; **78 tests, 100 % couverture**, a11y ; aligné **React 19** ; **consommé par le Web Core** |
| Web Core | **`@enistere/web-nextjs`** — **IMPLEMENTATION_PARTIELLE** : Next 16 App Router + React 19, UI Kit + **API publique (Health) + TanStack Query** + **BFF Auth** (`login`/`refresh`/`logout`/`csrf`, cookies `HttpOnly`, **CSRF**, Origin/Referer) + **session/autorisations** (`me`/`authorization` read-only, `useSession`/`useAuthorization`, purge au logout) + **layout protégé** (résolution Auth **serveur** read-only Option C + hydratation, page `/protected`) + **page de connexion `/login`** (formulaire accessible, login BFF, `returnTo` interne assaini anti open-redirect, navigation `replace`/`refresh`) + **états UI & composants structurels** (Web UI 1 : `Alert`/`Card`/`FormField` consommés ; `LoadingState`/`EmptyState`/`ErrorState`/`UnauthorizedState`(401)/`ForbiddenState`(403)/`ServiceUnavailableState`/`PageHeader`, intégrés accueil/Health/frontières/Auth) + **Files lecture/téléchargement** (Web Files 1 : BFF ciblé `GET /api/files/:id` + `POST /api/files/:id/download-url`, validation UUID, **CSRF/Origin** sur download-url, client BFF navigateur, `fileKeys`, `useFileMetadata` + `useCreateDownloadUrl` (**URL signée jamais en cache/log**), page `/protected/files/[id]`, **404 anti-énumération** ; **aucun upload/suppression/admin**, **aucun champ interne** exposé). **307 tests** + preuves API réelles (Auth/session **26/26** + login **22/22** + **Files API+MinIO 21/21**). **Pas de middleware, pas de Server Action Auth, pas de token en JS, pas de proxy générique.** |
| Packages officiels | `@enistere/api-contracts`, `@enistere/api-client-fetch` (validés **localement**, non publiés ; **instanciés (public + authentifié/BFF)** dans le Web Core — preuve API réelle) |
| Cloud Core | **`cores/cloud`** — **IMPLEMENTATION_PARTIELLE** (CC1 cadrage + **CC2 CI runtime API** + **CC3 CI E2E navigateur**) : `api-runtime-ci.yml` (PostgreSQL+MinIO jetables, migrations, unit+e2e, openapi:check) **+ `web-e2e-ci.yml`** (stack réelle API+PG+MinIO+Web + **Playwright/Chromium** : Health/Auth/Files) + cadrage (baseline, politiques, checklist branch protection) ; **aucune infra de déploiement/registry/monitoring** |
| Cores documentaires | `mobile-react-native` (spécification seule) |
| Cores vides | `ai-core`, `api-spring`, `docs-core`, `mobile-flutter`, `quality-core`, `web-angular` |
| CI/CD, conteneurisation | **CI niveaux 1–3 + registry (niveau 4 partiel)** : `ci.yml` + `api-runtime-ci.yml` + `web-e2e-ci.yml` + **`registry-ci.yml`** (build + push images GHCR, **images publiques validées** ; ADR-013/014 **partiels**) ; **Dockerfiles** API/Web (multi-stage, non-root) ; **staging manuel cadré** (CC6 : compose/`.env` exemples + runbooks, `CADRE_MANUEL_DOCUMENTE`) ; **déploiement réel absent** |
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
    web-nextjs/        PARTIEL (Next 16 + React 19 ; UI Kit + API publique + TanStack Query + BFF Auth login/refresh/logout/csrf + me/authorization + session state + UI 1 états + Files 1 lecture/téléchargement)
    cloud/             IMPLEMENTATION_PARTIELLE (spec + README + docs/ + CI runtime API + E2E navigateur + registry GHCR : api-runtime-ci.yml, web-e2e-ci.yml, registry-ci.yml + Dockerfiles)
    mobile-react-native/                              → CORE_SPECIFICATION.md seul
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
| `cloud` | oui | oui | **partiel** (CI runtime API + cadrage docs ; pas d'infra déploiement) | **IMPLEMENTATION_PARTIELLE** |
| `web-nextjs` | oui | oui | **oui** (Next 16 + UI Kit + API publique + TanStack Query + BFF Auth + session/autorisations + UI 1 états + Files 1 lecture) | **IMPLEMENTATION_PARTIELLE** |
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
| `@enistere/api-contracts` | 0.1.0 | oui | oui (types-only, 11 tests) | **non** | **consommé (types) dans `web-nextjs`** (Health + Auth + **Files** : `PublicStoredFileDto`/`SignedDownloadResponseDto` via `SchemaOf<>`) |
| `@enistere/api-client-fetch` | 0.1.0 | oui | oui (29 tests + live 16/16) | **non** | **instancié (public/Health + authentifié/BFF Auth + façade Files lecture) dans `web-nextjs`** |

Dépendance à sens unique : `openapi.json → api-contracts → api-client-fetch`. Le **UI Kit** et les
**paquets API** sont désormais **réellement intégrés** par le Web Core pour les endpoints **publics**
(Health) **et authentifiés** (BFF Auth : login/refresh/logout/me/authorization) : `api-client-fetch` est
**instancié** (factory serveur par requête + client public navigateur + façade Auth serveur), avec preuve
**API réelle**. Côté navigateur, l'état de session est lu via le **client BFF same-origin** (`/api/auth/*`),
sans token ni appel direct à l'API.

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
logging structuré, contrat OpenAPI canonique. Implémenté côté Web Core : UI Kit consommé, API publique
(Health) + TanStack Query (SSR/hydratation), **BFF Auth** (cookies `HttpOnly`, CSRF double-submit,
Origin/Referer), **état de session/autorisations** (`me`/`authorization` read-only, `useSession`/
`useAuthorization`, purge cache au logout), **états UI standardisés** (UI 1) **et Files en lecture** (Files 1 :
BFF ciblé métadonnées + URL signée + téléchargement direct, `useFileMetadata`/`useCreateDownloadUrl`, page
`/protected/files/[id]` — **sans upload/suppression/admin**, **404 anti-énumération**, URL signée jamais
mise en cache/journalisée). Implémenté (local, non publié) : packages clients. Décidé mais non implémenté :
secure storage mobile, **SSR Auth complet**, **upload/admin Files côté Web**, CI/CD, registry.
Détail : [`IMPLEMENTATION_MATRIX.md`](./IMPLEMENTATION_MATRIX.md).

## 9. Tests

API Core : **377 tests unitaires** (47 suites) + **101 tests e2e** (12 suites, PostgreSQL + MinIO
jetables), couverture disponible. Packages : api-contracts **11**, api-client-fetch **29** (`node:test`),
+ preuve live **16/16** (client officiel vs API réelle). UI Kit : **78 tests** (`node:test` + `global-jsdom`
+ Testing Library + jest-axe, **React 19**), **100 % couverture** (9 primitives, dont Alert/Card/FormField).
Web Core : **307 tests** (`node:test` :
config/URL, clients serveur/public, QueryClient/retry, query keys, transport Health, hooks, **hydratation**,
UI, mapping d'erreurs, garde anti-réseau, **Auth** : cookie-config, session adapter, factory
read-only/writable, **CSRF** (gén/validation temps constant), **Origin/Referer**, validation login, handlers
`csrf`/`login`/`refresh`/`logout`/`me`/`authorization`, isolation A/B, frontières d'import, **sentinelles** ;
**session/autorisations** : client BFF navigateur (envelope, same-origin, 401/403/réseau, aucun token),
`authKeys` disjoints, `useSession` (401→anonymous / 403→error), `useAuthorization` (désactivé en anonyme,
helpers OR/AND sans wildcard), `useLogout` (purge Auth / Health conservé ; échec réseau → pas de purge), UI
session/authorization + a11y ; **Web Auth 4** : résolveur serveur read-only (200/401/403/5xx/réseau/invalide,
isolation, **aucun refresh**, **aucune écriture cookie**), `decideProtectedRender`, **hydratation** (authentifié
au 1ᵉʳ rendu, **0 appel `/me`**, aucun token), vues indisponibilité/notice ; **Web Auth 5** : `sanitizeReturnTo`
(anti open-redirect), validation login, client BFF login (CSRF/body/statuts/**aucune fuite mot de passe**),
`useLogin` (**purge authKeys**, **double-soumission empêchée**, aucun credential en cache), `LoginForm`
(a11y ×4) ; **Files 1** : handlers BFF (UUID **400 sans appel API**, **401/403/404/409/503 distincts**, CSRF/Origin
sur download-url, `no-store`, `requestId`, **aucun champ interne**, read-only **sans refresh**), client BFF Files
(same-origin, `credentials:include`, **aucun Authorization**, **URL absente des erreurs**), `useFileMetadata`
(clé disjointe, désactivée si UUID invalide, 404/503, retry false), `useCreateDownloadUrl` (CSRF→POST, **URL
jamais en cache**, anti-double-clic, 409), `isUuid`/`formatFileSize` (BigInt)/`formatDateTime`/`isSafeDownloadUrl`/
`triggerDownload` (schémas dangereux refusés, ancre nettoyée), `classifyFileError`, vue métadonnées + axe) +
`next build` + **sonde HTTP** + **preuve API réelle** (NestJS + PostgreSQL jetable) : Auth + session
(login → `/me` → `/authorization` → logout → `/me` 401 ; **read-only sans refresh** ; **droits sans nouveau
JWT**), **espace protégé 26/26** et **connexion 22/22** (anonyme `/protected` → **redirection `/login`** ;
`/login` → formulaire ; login BFF → `authenticated` sans token ; authentifié `/login` → redirection hors login ;
**`returnTo` externe → `/protected`** (aucun open redirect) ; logout → `/login` ; 401 sans énumération ; 403 CSRF ;
bundle/HTML sans secret/mot de passe), **et Files (API NestJS + MinIO jetables) 21/21** (upload auto-VALIDATED +
objet → propriétaire `GET /api/files/:id` **200** publics no-store sans champ interne → `download-url` **200**
`{url,expiresAt}` → **téléchargement réel MinIO** (octets == upload, image/png) → sans permission **403** →
**non-propriétaire avec permission → 404** → quarantaine **409** → objet supprimé **503** → logout **401** + page →
`/login` ; **aucun** storageKey/bucket/X-Amz-Signature/credentials en métadonnées, logs ou bundle). Une **CI
minimale** (`.github/workflows/ci.yml`) rejoue désormais la non-régression du monorepo (hors e2e/runtime).

## 10. Preuves

- `OPENAPI_CLIENT_PROOF.md` — preuve `openapi-typescript`/`openapi-fetch` (concluante, **migrée** en
  packages ; code de preuve retiré, voir `cores/api-nestjs/proofs/openapi-client/README.md`).
- `STRUCTURED_LOGGING_COMPATIBILITY_PROOF.md` — compatibilité `nestjs-pino` (repli Pino direct, ADR-040).

## 11. CI/CD

**CI minimale présente** (ADR-013 **partiellement implémenté**) : `.github/workflows/ci.yml` (GitHub Actions,
Node 24, `npm ci`, `permissions: contents:read`, `concurrency`) impose l'ordre de validation **api-contracts →
api-client-fetch → ui-kit → web-nextjs → audit** : `generate:check`, typecheck/lint/build/test, `pack:check`
UI Kit, **build Web indépendant de l'API**, `npm audit` (0 vuln) et **gardes Axios/Zustand absents**
(ADR-011/012). **Aucun secret, aucun Docker, aucune base/stockage, aucun déploiement, aucun registry.**
**Restent** (au-delà de la CI minimale `ci.yml`) : protection de branche, couverture publiée, release/versioning,
déploiement, environnements protégés. **ADR-014 (registry/GHCR) → `PARTIELLEMENT_IMPLEMENTE`** (Cloud Core 5,
ci-dessous : build + push images). Détail : `.github/workflows/README.md`.
Le **Cloud Core 1** (cadrage) gouverne cette CI ; le **Cloud Core 2** ajoute le **niveau 2**
(`api-runtime-ci.yml` : API NestJS contre PostgreSQL + MinIO jetables, migrate deploy, unit + e2e,
openapi:check, build, audit) ; le **Cloud Core 3** ajoute le **niveau 3** (`web-e2e-ci.yml` : **E2E navigateur**
sur stack réelle API + PostgreSQL + MinIO + Web + **Playwright/Chromium** ; parcours **Health/Auth/Files** ;
utilisateurs + fichier VALIDATED éphémères ; `APP_ENV=development` pour cookies HTTP). **Valeurs de test
jetables**, **aucun secret GitHub**, données éphémères, traces `retain-on-failure` (**aucun artefact poussé**).
Le **Cloud Core 5** ajoute le **niveau 4 partiel** (`registry-ci.yml` + **Dockerfiles** API/Web multi-stage
non-root, Web **standalone**) : build des images + **push GHCR sur `main`** (tags immuables `sha-`/`main-`,
**pas de `latest`**, labels OCI, auth `GITHUB_TOKEN`, **aucun secret/PAT/`.env`**) — **sans déploiement**.
**Politique CI à 4 niveaux** : 1–3 présents, **4 partiel** (registry ; déploiement futur). Le **Cloud Core 4** a figé les
**7 checks** à rendre bloquants sur `main` (= `name:` des jobs) et tranché les politiques artefacts/couverture/
pinning ; la protection de branche `main` reste une **action humaine manuelle**. Enfin le **Cloud Core 5** a
livré la **registry GHCR** (niveau 4 partiel) : `registry-ci.yml` + Dockerfiles API/Web (multi-stage, non-root,
Web standalone) → build + **push images sur `main`** (tags immuables, labels OCI, `GITHUB_TOKEN`, **sans
déploiement/secret/PAT**) — `docker build` API+Web **validé localement**, ADR-014 → `PARTIELLEMENT_IMPLEMENTE`.
Enfin le **Cloud Core 6 — déploiement staging manuel** a livré le **cadrage** staging (`cores/cloud/staging/` :
compose+`.env` exemples validés `docker compose config` + runbooks **déploiement/rollback**) — `CADRE_MANUEL_DOCUMENTE`,
**aucune exécution réelle/secret/automatisation/`latest`** ; **CC5B validé** (images GHCR publiques). **Prochaine
action** : **Cloud Core 7 — exécution réelle staging sur serveur** (secrets hors dépôt) **ou** dry-run GitHub
**ou** durcissement registry (scan/signature) ; **action humaine** : confirmer la protection de branche `main`.

## 12. Documentation

Riche : stratégie, ADR, spécifications, rapports API, READMEs de modules. Ce checkpoint
(`docs/project-status/`) devient la **source de pilotage** ; les rapports API restent la référence
détaillée du API Core.

## 13. Risques

1. ~~Aucun commit Git~~ **RÉSOLU (local)** — baseline `7dcb543` créée sur `main` (ADR-001 exercé
   localement). Reste : **non poussée** vers `origin` (décision humaine/gouvernance).
2. **Packages intégrés (public + authentifié)** — UI Kit consommé + `api-client-fetch` **instancié**
   (endpoints publics **et** BFF Auth) par le Web Core ; types Auth dérivés via `SchemaOf<>`. Risque de
   dérive si le contrat évolue sans régénération (mitigé par `generate:check`, non automatisé).
3. **Spécifications sans starter** — `cloud` et `mobile-react-native` peuvent être lus à tort comme implémentés.
4. **CI minimale en place** (`.github/workflows/ci.yml`) — non-régression du monorepo automatisée (ordre de
   build imposé, `npm ci`, audit, gardes deps). Risque résiduel : **pas de protection de branche**, pas d'E2E
   navigateur, pas de CI runtime API ; reproductibilité hors-CI (clone local) à documenter.
5. **Strategy Phase 0 partiellement datée** — contexte historique à ne pas confondre avec l'état réel.

## 14. Incohérences

Voir la liste détaillée dans [`IMPLEMENTATION_MATRIX.md`](./IMPLEMENTATION_MATRIX.md) §contradictions
et [`DECISIONS_REGISTER.md`](./DECISIONS_REGISTER.md). Principales : ADR validés non implémentés (UI,
CI/CD, registry, secure storage, cookies, server state) ; packages « officiels » non intégrés ;
`strategy/` Phase 0 vs implémentation réelle ; rapport `OPENAPI_CLIENT_PROOF` référençant un code de
preuve désormais retiré (bannière de migration ajoutée).

## 15. Prochaine étape

Le **Web Core** (`@enistere/web-nextjs`, **`IMPLEMENTATION_PARTIELLE`**) expose désormais les **flux BFF
Auth** (`login`/`refresh`/`logout`/`csrf`) **et l'état de session/autorisations** (`me`/`authorization`
read-only, hooks `useSession`/`useAuthorization`, purge du cache Auth au logout, `403` distinct d'`anonymous`,
helpers OR/AND sans wildcard) — **prouvés contre l'API réelle**. Le **Checkpoint de gouvernance** a été réalisé
([`WEB_CORE_GOVERNANCE_REVIEW.md`](../../cores/web-nextjs/docs/WEB_CORE_GOVERNANCE_REVIEW.md)), **Web Auth 4** a
livré le **layout protégé** (résolution Auth **serveur read-only** Option C + **hydratation**, page `/protected`,
redirection anonyme, indisponibilité), puis **Web Auth 5** la **page de connexion `/login`** : formulaire
accessible, **login BFF** (CSRF, **aucun token**), **`returnTo` interne assaini** (anti open-redirect),
navigation **`replace`/`refresh`**, redirection d'un utilisateur déjà authentifié — **sans middleware, sans
Server Action Auth, sans token en JS** (**263 tests** + preuves API réelles **26/26** + **22/22** ; détails
[`protected-routes.md`](../../cores/web-nextjs/docs/protected-routes.md),
[`login-flow.md`](../../cores/web-nextjs/docs/login-flow.md)). La **Revue globale Auth Web (1 → 5)** a été
**réalisée** (rapport [`WEB_AUTH_V1_REVIEW.md`](../../cores/web-nextjs/docs/WEB_AUTH_V1_REVIEW.md)) — verdict
**`AUTH_WEB_V1_STABLE_WITH_RESERVATIONS`** : socle Auth **sûr et cohérent** (aucune fuite de token, **aucun open
redirect**, session cohérente, contenu privé jamais exposé, droits sans nouveau JWT), **263 tests fiables ×2** +
**runtime 33/33**, **aucun défaut bloquant** ; réserves **opérationnelles** (CI, E2E navigateur,
streaming-redirect, multi-onglets, CSP/HSTS). Puis **Web Core UI 1** a livré les **états UI & composants
structurels** : primitives UI Kit `Alert`/`Card`/`FormField` (**78 tests**) + compositions Web
(`LoadingState`/`EmptyState`/`ErrorState`/`UnauthorizedState`(401)/`ForbiddenState`(403)/`ServiceUnavailableState`/
`PageHeader`, **270 tests**), intégrées (accueil/Health/frontières/Auth), accessibles (axe), **sans donnée
sensible** (détail [`ui-states.md`](../../cores/web-nextjs/docs/ui-states.md)). Enfin **Web Core Files 1** a livré
la **première feature de données** en **lecture seule** : deux **Route Handlers BFF ciblés** (`GET /api/files/:id`,
`POST /api/files/:id/download-url`, jamais un proxy générique ; validation **UUID** → 400 sans appel API ;
**CSRF/Origin** sur download-url ; mapping d'erreurs distinct préservant **404 anti-énumération**/409/503), un
**client BFF navigateur** (aucun Bearer), `fileKeys` **disjoints**, `useFileMetadata` (query) + **`useCreateDownloadUrl`**
(**mutation** : URL signée **consommée puis abandonnée**, jamais en cache/log), téléchargement par **ancre
temporaire** (`https`-only), et une page privée `/protected/files/[id]` réutilisant les états UI — **l'API restant
l'autorité** (permission + ownership), **aucun champ interne** exposé, **sans upload/suppression/admin**
(**307 tests** + **preuve API + MinIO réelle 21/21** ; détail
[`files-read-download.md`](../../cores/web-nextjs/docs/files-read-download.md)). Enfin la **Revue globale Web
Core — incrément V1** a traité l'incrément complet (Health + Auth 1→5 + UI 1 + Files 1) comme **un système
unique** : verdict **`WEB_CORE_V1_INCREMENT_STABLE_WITH_RESERVATIONS`** (rapport
[`WEB_CORE_V1_INCREMENT_REVIEW.md`](../../cores/web-nextjs/docs/WEB_CORE_V1_INCREMENT_REVIEW.md)) — socle **sûr
et cohérent** (aucune fuite de token/URL signée/donnée privée, CSRF + Origin/Referer, **indisponible ≠
anonyme**, 404 anti-énumération, droits dynamiques **sans nouveau JWT**, clés de cache disjointes), **307 tests
fiables ×2** + **runtime réel 49/49** (PostgreSQL + MinIO, parcours critique rejoué ×2, incluant **URL signée
réellement expirée → 403** et **pannes API/MinIO**), **aucun défaut bloquant** ; réserves **opérationnelles**
(CI + ordre de build monorepo, E2E navigateur) et **mineures** (CSP/HSTS, 429, contrastes, cache Files au
logout). **Corrections documentaires seules** (`.env.example` + `SECURITY.md`, zéro comportement). Statuts
**maintenus** `IMPLEMENTATION_PARTIELLE` (un verdict d'incrément n'augmente pas le statut du core ; ni
Tailwind/Radix/shadcn ni bibliothèque exhaustive). Enfin la **CI minimale (ADR-013)** a été **mise en place**
(`.github/workflows/ci.yml`) : non-régression du monorepo (ordre `api-contracts → api-client-fetch → ui-kit →
web-nextjs → audit`, `npm ci` Node 24, `generate:check`, build/lint/test, `npm audit` 0 vuln, gardes
Axios/Zustand) — **sans secret/Docker/registry/déploiement** ; ADR-013 passe **`PARTIELLEMENT_IMPLEMENTE`**.
Enfin le **Cloud Core 1 — cadrage d'exécution CI/CD & environnements** a été **réalisé** (`cores/cloud/docs/` +
`cores/cloud/README.md`) : baseline d'exécution (17 sections), environnements logiques, **checklist de
protection de branche** (manuelle), **politique CI à 4 niveaux**, politiques secrets/registry, plans runtime
API & E2E — **sans déploiement, Docker, registry, secret ni infra réelle**. Cloud Core →
**`CADRAGE_OPERATIONNEL`** (Cloud Core 1). Puis le **Cloud Core 2** a livré la **CI runtime API NestJS**
(niveau 2, `api-runtime-ci.yml`), et le **Cloud Core 3** la **CI E2E navigateur** (niveau 3,
`web-e2e-ci.yml` : stack réelle API + PostgreSQL + MinIO + Web + **Playwright/Chromium** ; parcours
**Health/Auth/Files** ; **sans secret/déploiement/registry** ; validé localement, **7 tests Playwright verts**)
— Cloud Core → **`IMPLEMENTATION_PARTIELLE`** (trois workflows CI niveaux 1–3). Enfin le **Cloud Core 4 —
durcissement CI & gouvernance de branche** (documentaire) a **figé les 7 checks** à rendre bloquants sur `main`
(`api-contracts`/`api-client-fetch`/`ui-kit`/`web-nextjs`/`audit` + `api-runtime` + `web-e2e`) et **tranché les
politiques** : artefacts = aucun upload (Option A), couverture = exécutée non publiée, pinning = `@v4` (SHA
futur), `actionlint` futur — **workflows inchangés, aucun job renommé**. ADR-013 reste **partiel** (niveaux 1–3
+ **protection de branche documentée non appliquée**), ADR-014 **non implémenté**. **Prochaine action (humaine)** :
**appliquer** la protection de branche `main` (`GITHUB_BRANCH_PROTECTION_CHECKLIST.md`) ; **prochaine mission** :
**Cloud Core 5 — Registry GHCR sans déploiement** (niveau 4). Détail : [`NEXT_ACTIONS.md`](./NEXT_ACTIONS.md).

## 16. Règles de mise à jour

Ce fichier est mis à jour **en fin de chaque mission** (voir [`README.md`](./README.md) §protocoles).
Toute affirmation doit être **vérifiable dans le repository**. Ne jamais marquer « validé » sans preuve
(tests/fichiers). Ne jamais confondre spécification, ADR, preuve, package et intégration.
