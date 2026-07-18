# Intégration API — Web Core (transport public)

Intégration **réelle** des paquets clients officiels (`@enistere/api-contracts`,
`@enistere/api-client-fetch`) pour les **endpoints publics** uniquement (Health). **Aucune
authentification** (ADR-005/011/012 pour la suite).

## Variables & validation

| Variable | Portée | Usage |
| --- | --- | --- |
| `NEXT_PUBLIC_API_URL` | **client** (inlinée au build) | client public navigateur. Valeur publique : aucun secret. |
| `API_INTERNAL_URL` | **serveur** (runtime) | préchargement SSR. Jamais préfixée `NEXT_PUBLIC_`. Préférée si présente. |

`core/config/api-url.ts → normalizeApiBaseUrl` valide : protocole `http`/`https`, URL absolue, **aucun
credential** dans l'URL, **slash final** retiré, **wildcard** d'hôte rejeté. Lève `ApiUrlError` (message
générique). `isPublicApiConfigured()`/`isServerApiConfigured()` permettent l'état « non configuré »
(hooks désactivés, UI explicite) sans appel réseau.

## Factory serveur — par requête

`core/api/server/create-server-api-client.ts`

- **Nouvelle instance à chaque appel** (aucun client global serveur, aucun état mutable de module).
- `baseUrl = API_INTERNAL_URL` validée (ou injectée en test).
- `fetch` **`no-store`** par défaut : les sondes Health décrivent l'état **courant** (pas de cache Next).
- Aucune **session**, aucun **Bearer**, **`enableRefresh:false`**.
- Propage un `requestId` entrant si fourni, sinon en génère un (`crypto.randomUUID`).

## Client public — navigateur

`core/api/public/public-api-client.ts`

- `baseUrl = NEXT_PUBLIC_API_URL` validée.
- **Aucune** `AuthSessionAdapter`, **aucun** Bearer, **`enableRefresh:false`** (aucun refresh tenté).
- **X-Request-Id** posé par le middleware du paquet.
- Un **singleton** navigateur est acceptable **car sans session** ; `resetPublicApiClientForTests()`
  pour les tests.

> ⚠️ **Frontière** : ce client public **ne deviendra pas** le client authentifié. L'Auth (incrément
> suivant) introduira un **BFF** + cookies `HttpOnly` + un client serveur dédié. Ne pas greffer de
> session sur le client public.

## Transport Health (`run-public-request`)

Les endpoints Health ne sont pas couverts par les façades `auth`/`files` du paquet : on appelle
`client.raw.GET("/health…")` (qui porte déjà le middleware X-Request-Id). `run-public-request` ajoute :

- **timeout** (AbortController) + relais d'une annulation **externe** (TanStack Query) ;
- **normalisation** : `ApiClientError.fromHttp` (HTTP), `.timeout()`, `.network()` — jamais de corps brut ;
- **extraction** de l'enveloppe `{ success, data, timestamp } → data`.

Types via `SchemaOf<"HealthResponseDto">` etc. — **aucun DTO recopié** (preuve de résolution :
`test/api-resolution.fixture.ts`).

## Erreurs & requestId

`core/api/errors/map-api-error.ts → mapApiErrorToPublicMessage` : message **public** générique selon
`kind`/`status`, `requestId` conservé séparément, **jamais** de `cause`/stack/secret. `requestId` est
une **référence technique**, pas une preuve de sécurité.

## Cache

- Serveur : `no-store` (toujours frais).
- Client : `staleTime` court (TanStack) pour éviter un refetch immédiat après hydratation.
- **Aucun cache global utilisateur** ; aucune donnée d'authentification mise en cache (il n'y en a pas).

## Files (lecture/téléchargement — Files 1)

Opérations Files consommées **via le BFF** (jamais l'API directe depuis le navigateur), à partir de la
façade `@enistere/api-client-fetch` (`client.files.getMetadata` / `client.files.createDownloadUrl`,
operationId `files_getMetadata` / `files_createDownloadUrl`) :

- `GET /api/files/:id` → métadonnées **publiques** (`PublicStoredFileDto`) — client serveur **read-only**,
  `no-store`, validation UUID (400), 404 anti-énumération relayé.
- `POST /api/files/:id/download-url` → **URL signée courte** (`SignedDownloadResponseDto`) — Origin/Referer +
  **CSRF**, client serveur **writable**, `no-store`, réponse **minimale** `{ url, expiresAt }`.

Permission (`files.read`/`files.download`) **et** ownership restent vérifiés par l'**API NestJS** (autorité).
Aucun champ interne (storageKey/bucket/checksum) n'est exposé ; l'URL signée n'est ni journalisée ni
persistée. Détail : [`files-read-download.md`](files-read-download.md).
