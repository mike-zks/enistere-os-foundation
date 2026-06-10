# Architecture — Web Core (V1)

## Couches

- **`app/`** — App Router : routage, layout, états (`loading`/`error`/`not-found`), métadonnées.
  Fichiers fins ; ils composent `features`/`shared`. Compilés **uniquement par Next/Turbopack**.
- **`core/`** — fondations transverses : `config` (env public/serveur, métadonnées, thème) ;
  `api` (clients **public** navigateur + **serveur par requête** + **serveur authentifié** BFF) ;
  `auth` (cookies/CSRF/Origin, handlers BFF, **client navigateur same-origin**, état de session) ;
  `query` (`QueryClient`, provider, query keys `health`/`auth` disjointes). Tous **implémentés**.
- **`shared/`** — composants présentationnels réutilisables (états de chargement/erreur/404), bâtis
  sur le UI Kit, sans dépendance au routeur → testables hors runtime Next.
- **`features/`** — unités fonctionnelles : `foundation-status` (page d'accueil), `health` (sondes via
  TanStack Query), `auth` (`useSession`/`useAuthorization`/`useLogout` + vues présentationnelles).

## Rendu

**Server Components par défaut.** Les primitives du UI Kit sont sans hook et sans `"use client"` :
elles sont sûres en Server Component. Seul `app/error.tsx` est un Client Component (Next exige que la
frontière d'erreur reçoive `reset`).

## Frontière de test (double compilation)

| Cible | Compilateur | Résolution | Imports relatifs |
| --- | --- | --- | --- |
| Build app | Next / Turbopack | `bundler` | **sans extension** |
| Tests | `tsc` → `node --test` | `nodenext` | **`.js` obligatoire** |

`src/app/` est exclu de `tsconfig.test.json` ; il est validé par `next build` + sonde HTTP. Les
composants testables (`core`/`shared`/`features`) sont **sans CSS** (le CSS n'est importé que dans
`app/layout.tsx`) et n'importent que des spécificateurs nus, ce qui évite tout conflit d'extension et
de résolution CSS sous `node:test`.

## Styles & thème

CSS chargé une seule fois dans `layout.tsx` : `@enistere/ui-kit/styles.css` (tokens + primitives,
**source de vérité de la palette**) puis `globals.css` (reset + structure, qui **référence** les
variables `--enistere-color-*` — aucune palette dupliquée). Thème via `data-theme` (clair par défaut).

## Paquets partagés

`@enistere/ui-kit` est **réellement consommé** (primitives + CSS). `@enistere/api-contracts` et
`@enistere/api-client-fetch` sont **instanciés** : client **public** (Health) côté navigateur et serveur,
et **façade Auth serveur** (BFF : login/refresh/logout, me/authorization). Les types Auth dérivent des
contrats via `SchemaOf<>` (aucun DTO recopié). Preuve **API réelle** (PostgreSQL jetable).

> **Note build (monorepo)** : la phase TypeScript de `next build` consomme les **types compilés** des
> paquets (`packages/*/dist`, **non versionnés**). Sur un clone neuf, exécuter `npm run build` à la racine
> (build topologique `api-contracts` → `api-client-fetch`) **avant** de builder le Web Core. Aucune CI
> n'impose encore cet ordre (ADR-013).
