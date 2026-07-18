# Examples Core 1 — API Client Node smoke example

Date : 2026-07-17

## Objectif

Fermer le gap concret `examples/` vide en ajoutant un premier exemple consommateur executable.

L'exemple montre comment consommer les packages officiels :

- `@enistere/api-contracts` ;
- `@enistere/api-client-fetch`.

## Livrables

- `examples/README.md` — index des exemples ;
- `examples/api-client-node/README.md` — guide d'execution et forme attendue apres publication ;
- `examples/api-client-node/smoke.mjs` — smoke Node sans backend ;
- `package.json` — script `example:api-client-node`.

## Architecture

Le smoke injecte un `fetch` mocke dans `createEnistereApiClient`.

Il prouve :

1. un appel public `client.raw.GET('/health')` sans session et sans header `Authorization` ;
2. un appel authentifie `client.auth.getProfile()` avec `InMemorySessionAdapter` ;
3. l'injection Bearer depuis l'adaptateur de session, sans stocker le token dans le client.

L'exemple importe temporairement le `dist` local :

```js
import {
  createEnistereApiClient,
  InMemorySessionAdapter,
} from '../../packages/api-client-fetch/dist/index.js';
```

Apres publication GitHub Packages ou GitHub Release tarballs, un projet externe remplacera cet import par
`@enistere/api-client-fetch`.

## Garde-fous

- aucun backend requis ;
- aucun appel reseau ;
- aucun secret ;
- aucun token logge ;
- aucun artefact genere versionne ;
- aucun changement runtime dans les cores.

## Verification attendue

```bash
npm run example:api-client-node
node factory/quality/core/scripts/quality-gates.mjs run docs
git diff --check
```

## Limites

Cet exemple ne remplace pas une publication reelle des packages. Il prouve l'usage local et documente la forme
attendue pour un consommateur externe.

## Prochaine action recommandee

**Developer Quickstart 1** — parcours d'onboarding 15 minutes : installation, gates minimales, exemple API client,
lecture des statuts et liens vers les specs essentielles.
