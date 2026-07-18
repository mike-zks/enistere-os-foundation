# @enistere/api-client-fetch

> **Client Fetch typé Enistere** au-dessus d'[`openapi-fetch`](https://openapi-ts.dev/openapi-fetch/)
> + [`@enistere/api-contracts`](../api-contracts). Fournit le wrapper validé (auth, erreurs, timeout,
> refresh) — **indépendant de TanStack Query, React, React Native, Angular et Axios**.
> **Distribué en tarball GitHub Release** (version `0.1.0`, tag `packages-api-typescript-v0.1.0`).

## Création du client

```ts
import { createEnistereApiClient } from '@enistere/api-client-fetch';

const client = createEnistereApiClient({
  baseUrl: 'https://api.example.test',
  session,                 // AuthSessionAdapter (fourni par la plateforme)
  // fetch,                // injectable (SSR / RN / tests) — défaut globalThis.fetch
  // credentials: 'include',// cookies web (optionnel, par instance)
  // timeoutMs: 15000,
  // createRequestId: () => crypto.randomUUID(),
});

const profile = await client.auth.getProfile();          // typé depuis le contrat
const file = await client.files.upload(blob, 'IMAGE');   // multipart Web
```

Façades : `client.auth` (`login`, `refresh`, `logout`, `getProfile`, `getAuthorization`),
`client.files` (`upload`, `getMetadata`, `createDownloadUrl`, `delete`, `quarantine`, `restore`).
Échappatoire bas niveau : `client.raw` (le client `openapi-fetch` typé).

## AuthSessionAdapter

```ts
interface AuthSessionAdapter {
  getAccessToken(): Promise<string | null>;
  getRefreshToken(): Promise<string | null>;
  updateTokens(tokens: AuthTokens): Promise<void>; // atomique côté implémentation
  clearSession(): Promise<void>;
}
```

API **asynchrone** (compatible SecureStore). Ce package ne fournit **aucune** implémentation de
production : SecureStore (React Native) et cookies httpOnly (web) vivent dans les cores de plateforme.
`InMemorySessionAdapter` est fourni **pour les tests/exemples uniquement** (ne pas utiliser en prod).

## Comportements

- **Bearer** : injecté depuis l'adaptateur (jamais en URL, log ou erreur). Routes publiques
  (login/refresh/logout) sans dépendance au token.
- **Cookies web** : `credentials: 'include'` optionnel, par instance. Le package ne lit/écrit aucun
  cookie, ne gère pas le CSRF (responsabilité de l'intégration web).
- **Timeout** : `AbortController` par requête ; erreur `timeout` distincte ; combinable à une
  annulation utilisateur (re-levée telle quelle, jamais masquée).
- **X-Request-Id** : posé en sortie si `createRequestId` est fourni ; lu en réponse et dans le corps
  d'erreur ; exposé dans `ApiClientError.requestId`.
- **Refresh coordonné** : uniquement sur 401, jamais sur 403/login/refresh ; **single-flight** (une
  seule requête `/auth/refresh` partagée) ; **rejeu unique** ; nettoyage de session une fois en cas
  d'échec → `ApiClientError` `session_expired`.
- **Upload** : `FormData` reconstruit depuis la source re-lisible (jamais de rejeu d'un corps
  consommé) ; rejeu après refresh activable (`retryOnAuthRefresh`, défaut `true`).

## Erreurs

`ApiClientError` (`kind`: `http` | `network` | `timeout` | `invalid_response` | `session_expired`),
champs whitelistés (`status`, `errorCode`, `message`, `details?`, `requestId?`) — **jamais** de token,
d'en-tête Authorization, d'URL signée ni de réponse brute. Helpers : `isUnauthorized`, `isForbidden`,
`isNotFound`, `isConflict`, `isRateLimited`. **Ne jamais** brancher la logique sur `message` (préférer
`status`/`errorCode`/`kind`).

## Multipart

- **Web** : `createWebUploadFormData(blob, category, subjectId?)` ou directement `client.files.upload`.
- **React Native** : `createReactNativeUploadFormData({ uri, name, type }, category, subjectId?)`.
  Le `Content-Type` n'est **jamais** forcé (boundary posé par la runtime). Différence d'environnement
  documentée : le `FormData` de Node (undici, strict) refuse le descripteur RN ; la runtime React
  Native l'accepte.

## Plateformes

- **Next.js serveur** : créer une instance **par requête** (`fetch` injecté, session du contexte) —
  **jamais** un client authentifié global partagé entre utilisateurs.
- **Next.js navigateur** : `fetch` standard, `credentials` optionnels.
- **React Native** : `fetch`/`FormData` globaux, session SecureStore injectée — aucun module Node,
  aucune lib DOM requise, aucune dépendance Expo. **Aucun Axios.**
- **Server state** : les hooks TanStack Query (ADR-012) sont **hors de ce package** ; ils sont
  maintenus dans les cores Web/Mobile et consomment ce client.

## Versionnement & interdiction

`0.1.0` (pré-1.0). Dépend de `@enistere/api-contracts` (lien workspace en développement ; une plage
SemVer `0.1.0` est figée pour la première publication coordonnée). Distribution cible décidée :
**GitHub Packages npm registry** pour le scope `@enistere/*`, avec repli gouverné par artefacts
**GitHub Release** (`npm pack` tarballs). La première distribution utilise le repli GitHub Release :

```bash
npm install \
  https://github.com/mike-zks/enistere-os-foundation/releases/download/packages-api-typescript-v0.1.0/enistere-api-contracts-0.1.0.tgz \
  https://github.com/mike-zks/enistere-os-foundation/releases/download/packages-api-typescript-v0.1.0/enistere-api-client-fetch-0.1.0.tgz
```

La publication GitHub Packages npm registry reste différée ; aucun hook TanStack Query, aucun adaptateur
Next.js/SecureStore concret n'est ajouté dans ce package.

Dry-run de packaging :

```bash
npm run pack:dry-run --workspace=@enistere/api-client-fetch
```

En environnement restreint où le cache npm utilisateur est en lecture seule :

```bash
npm_config_cache=/tmp/enistere-npm-cache npm run pack:dry-run --workspace=@enistere/api-client-fetch
```
