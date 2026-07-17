# API Client Node Example

Exemple minimal de consommation des packages officiels :

- `@enistere/api-contracts` — types OpenAPI canoniques ;
- `@enistere/api-client-fetch` — client Fetch type et wrappers.

L'exemple n'a pas besoin d'un backend reel : il injecte un `fetch` mocke dans `createEnistereApiClient`.
Il prouve trois points :

1. un appel public via `client.raw.GET('/health')` ;
2. un appel authentifie via `client.auth.getProfile()` ;
3. l'injection Bearer depuis `InMemorySessionAdapter` sans stocker le token dans le client.

## Execution depuis le repository

```bash
npm run example:api-client-node
```

## Forme attendue apres publication

Quand les packages seront distribues via GitHub Packages ou GitHub Release tarballs, un projet externe
remplacera les imports locaux par :

```js
import {
  createEnistereApiClient,
  InMemorySessionAdapter,
} from '@enistere/api-client-fetch';
```

`InMemorySessionAdapter` reste reserve aux exemples/tests/developpement. Les projets reels doivent injecter
leur propre stockage de session : cookies `HttpOnly` cote Web serveur, SecureStore/Keychain cote mobile, ou
adaptateur equivalent gouverne.

## Garde-fous

- aucun secret ;
- aucun appel reseau ;
- aucun backend ;
- aucun token logge ;
- aucun artefact genere versionne.
