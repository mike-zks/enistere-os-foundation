# Enistere OS Foundation

Enistere OS Foundation est le socle interne destiné à standardiser la création, la documentation,
la gouvernance, la qualité et les fondations techniques des projets logiciels Enistere.

Le repository combine aujourd'hui :

- le cadrage stratégique initial ;
- des ADR validés ;
- des cores V1 validés ou avancés ;
- des runbooks Cloud/Quality ;
- un index documentaire central.

## Objectifs

- Centraliser les documents stratégiques de référence.
- Définir une structure modulaire pour les futurs cores techniques.
- Préparer les prompts IA, templates, outils, exemples et guides.
- Poser une base claire avant toute génération de code applicatif.

## Structure

- `strategy/` : documents stratégiques de cadrage.
- `docs/` : index central Docs Core, ADR, guides, checklists, runbooks, onboarding, décisions et glossaire.
- `cores/` : socles techniques par domaine (`api-nestjs`, `web-nextjs`, `mobile-react-native`,
  `ui-kit`, `cloud`, `quality-core`, `docs-core`, et cores futurs).
- `packages/` : **packages partagés** du monorepo (npm workspaces).
- `.github/workflows/` : CI non-régression, runtime API, E2E Web et registry GHCR.
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

L'index documentaire central est [`docs/README.md`](docs/README.md).

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

Voir l'état détaillé et vérifié dans [`docs/project-status/`](docs/project-status/README.md).

Synthèse courante :

- Foundation V1 publiée : `foundation-v1.0.0`.
- `api-nestjs`, `web-nextjs`, `ui-kit`, `cloud`, `docs-core` et `quality-core` : `VALIDE_V1`.
- `mobile-react-native` : starter Expo/RN avancé, aligné UI Kit, avec smoke Android validé et iOS bloqué par environnement macOS/Xcode absent.
