# Enistere OS Foundation

Enistere OS Foundation est le socle interne destiné à standardiser la création, la documentation, la gouvernance et la qualité des projets logiciels Enistere.

La phase actuelle du repository est la **Phase 0 : stratégie et fondations**. Elle prépare les documents de vision, d'architecture, de gouvernance, de sécurité, d'IA, de standards et d'exécution.

## Objectifs

- Centraliser les documents stratégiques de référence.
- Définir une structure modulaire pour les futurs cores techniques.
- Préparer les prompts IA, templates, outils, exemples et guides.
- Poser une base claire avant toute génération de code applicatif.

## Structure

- `strategy/` : documents stratégiques de Phase 0.
- `docs/` : ADR, guides, checklists, runbooks, onboarding, décisions et glossaire.
- `cores/` : socles techniques (**API Core NestJS V1** dans `cores/api-nestjs/` ; **UI Kit** — tokens **+ 9 primitives Web** (React 19 : Button/Input/Label/Text/Spinner/VisuallyHidden + Alert/Card/FormField) — dans `cores/ui-kit/` ; **Web Core Next.js** — Next 16 / React 19 + UI Kit + **API publique (Health)** + **TanStack Query** + **BFF Auth** (login/refresh/logout/csrf) + **session/autorisations** (me/authorization, `useSession`/`useAuthorization`) + **layout protégé** (résolution Auth serveur read-only + hydratation, page `/protected`) + **page de connexion `/login`** + **états UI standardisés** (loading/empty/error/401/403/indisponible + PageHeader) — dans `cores/web-nextjs/`).
- `packages/` : **packages partagés** du monorepo (npm workspaces).
- `prompts/` : prompts IA classés par usage.
- `tools/` : futurs générateurs, scripts, validateurs et outils de release.
- `templates/` : modèles documentaires réutilisables.
- `examples/` : futurs exemples de référence.

## Packages partagés (`packages/`)

Workspaces npm (`"workspaces": ["packages/*", "cores/ui-kit", "cores/web-nextjs"]`). Issus de la preuve
ADR-016 (voir `cores/api-nestjs/docs/OPENAPI_CLIENT_PROOF.md`) :

- **`@enistere/api-contracts`** — types OpenAPI canoniques (générés depuis `cores/api-nestjs/openapi/openapi.json`), runtime-indépendant.
- **`@enistere/api-client-fetch`** — client Fetch typé (`openapi-fetch` + wrappers Enistere : auth, erreurs, timeout, refresh, multipart). Indépendant de TanStack Query, React, React Native, Angular et **Axios**.

Commandes (racine) : `npm install`, `npm run build`, `npm test`, `npm run generate:check`.

> **Statut** : packages **créés et validés localement** (builds, tests, preuve live 16/16). **Non
> publiés**. Le **Web Core** (`cores/web-nextjs/`) **instancie** `@enistere/api-client-fetch` pour les
> endpoints **publics** (Health) avec **TanStack Query** (ADR-012) et SSR/hydratation, **et pour le BFF
> Auth** (login/refresh/logout + me/authorization) — types Auth dérivés via `SchemaOf<>` ; preuve API
> réelle. La **publication** reste à venir (non requise V1).

## État du projet (pilotage)

La **source de vérité de pilotage** est le checkpoint documentaire [`docs/project-status/`](docs/project-status/README.md),
qui reflète l'**état réel du repository** (vérifié fichier par fichier). À lire avant toute
recommandation ou mission :

- [`docs/project-status/README.md`](docs/project-status/README.md) — rôles, ordre de lecture, protocoles.
- [`docs/project-status/SESSION_HANDOFF.md`](docs/project-status/SESSION_HANDOFF.md) — transfert de session (à lire en premier).
- [`docs/project-status/FOUNDATION_CURRENT_STATE.md`](docs/project-status/FOUNDATION_CURRENT_STATE.md) — photographie générale.
- [`docs/project-status/IMPLEMENTATION_MATRIX.md`](docs/project-status/IMPLEMENTATION_MATRIX.md) — matrice d'implémentation.
- [`docs/project-status/NEXT_ACTIONS.md`](docs/project-status/NEXT_ACTIONS.md) — prochaine action autorisée.

> Ne pas supposer qu'un core est implémenté parce que sa spécification existe : se référer à la matrice.

## Statut

Phase 0 (stratégie/fondations) + **API Core NestJS V1** (`cores/api-nestjs/`), **UI Kit** (`cores/ui-kit/`,
tokens + **9 primitives Web** dont Alert/Card/FormField, React 19) et **Web Core Next.js** (`cores/web-nextjs/`, Next 16 / React 19 +
UI Kit + API publique Health + TanStack Query + **BFF Auth** login/refresh/logout/csrf + **session/autorisations**
(me/authorization, `useSession`/`useAuthorization`, purge cache au logout) + **layout protégé**
(résolution Auth serveur read-only + hydratation, page `/protected`) + **page de connexion `/login`**
(login BFF, `returnTo` interne assaini) + **états UI standardisés** (loading/empty/error/401/403/indisponible + PageHeader) — `IMPLEMENTATION_PARTIELLE`) ;
**packages clients officiels** (`packages/`) validés localement, non publiés. État détaillé et vérifié : [`docs/project-status/`](docs/project-status/README.md).

