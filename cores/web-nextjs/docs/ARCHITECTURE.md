# Architecture — Web Core (V1)

## Couches

- **`app/`** — App Router : routage, layout, états (`loading`/`error`/`not-found`), métadonnées.
  Fichiers fins ; ils composent `features`/`shared`. Compilés **uniquement par Next/Turbopack**.
- **`core/`** — fondations transverses : `config` (env public/serveur, métadonnées, thème) ;
  `api`/`auth`/`query` en **cadrage uniquement** (vides en V1).
- **`shared/`** — composants présentationnels réutilisables (états de chargement/erreur/404), bâtis
  sur le UI Kit, sans dépendance au routeur → testables hors runtime Next.
- **`features/`** — unités fonctionnelles. V1 : `foundation-status` (contenu de la page d'accueil).

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
`@enistere/api-client-fetch` sont déclarés et **résolvent à la compilation** (preuve :
`test/api-resolution.fixture.ts`) mais ne sont **pas instanciés** en V1 (aucun appel réseau).
