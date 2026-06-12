# Mobile Core React Native — Server-State Data Layer

> Statut : **`SERVER_STATE_READY`** (V1 — RN 5 ; socle RN 1 + auth/session RN 2 + forms/offline RN 3 + client officiel RN 4/4B)
> Spécification cible : [`CORE_SPECIFICATION.md`](./CORE_SPECIFICATION.md)
> Architecture & décisions : [`ARCHITECTURE.md`](./ARCHITECTURE.md)

Socle mobile **Expo / React Native** générique et réutilisable pour les futures
applications Enistere/Kivvoo/RFashion/Bailo/etc. Ce starter pose une fondation
standardisée et gouvernée. **Il ne contient aucune logique métier.**

## Ce que ce socle fournit (périmètre de la mission)

| Brique | Module | Notes |
|---|---|---|
| Navigation | `app/` (Expo Router) + `src/navigation` | stacks **publique** `(public)` et **authentifiée** `(app)`, gate de redirection, **gardes durcies** (`expired`/`refreshing`), écran *not-found* |
| Auth engine | `src/auth/auth-engine.ts` | **machine d'état framework-agnostique** (no React/RN) : `restoreSession`/`signIn`/`signOut`/`refreshSession`/`clearSession`, **expiration**, **refresh coalescé** |
| Auth shell (React) | `src/auth` | états `loading`/`authenticated`/`unauthenticated`/`refreshing`/`expired` ; `AuthProvider` (binding `useSyncExternalStore`), `signIn`/`signOut`/`restoreSession`/`refreshSession`/`clearSession` ; **`EnistereAuthApi`** (réel) + `MobileAuthSessionAdapter` ; `PlaceholderAuthApi` (repli sans backend) |
| Secure storage | `src/storage` | `SecureStorage` (interface) + `ExpoSecureStorage` (SecureStore) + `InMemorySecureStorage` ; **`SessionStore`** (persiste refresh token + expiry + user, **validation**) ; **access token en mémoire** |
| **API client (officiel)** | `src/api` | **`@enistere/api-client-fetch`** (+ `@enistere/api-contracts`) typé — `createEnistereApiClient` (base URL/timeout, **injection Bearer** via adaptateur de session, erreurs `ApiClientError`). Refresh **possédé par l'AuthEngine** (`enableRefresh:false`) ; **pont 401** `authedRequest`/`withAuthRetry` : `401`→`refreshSession` coalescé→1 retry→purge (RN 4B). **Aucun endpoint métier.** |
| Server state (data layer) | `src/query` | `QueryClient` + `QueryProvider` (TanStack Query) **+ couche générique RN 5** : `createQueryKeys` (clés typées stables), **`useAuthedQuery`/`useAuthedMutation`** (appels authentifiés **via `authedRequest`** — pont 401), `toQueryError` (normalisation UI **sans donnée sensible**), `invalidateScope`/`purgeServerState` (purge au logout). **401 jamais retenté ; mutations sans retry ; pas de persistance ; aucun endpoint métier.** |
| Thème / tokens | `src/theme` | `ThemeProvider` + bridge tokens placeholder (light/dark) |
| UI primitives | `src/ui` | `Screen`, `Text`, `Button` (token-driven, a11y) |
| **Formulaires / validation** | `src/forms` | **React Hook Form + Zod** : `FormField`/`FormLabel`/`FormError`/`TextInputField` (token-driven, a11y), helpers `validateWith` + mapping erreurs Zod/RHF, resolver. **UX uniquement** (backend = autorité, ADR-003 §18). **Aucun formulaire métier.** |
| **Offline-ready (préparatoire)** | `src/offline` | état réseau **abstrait**, enveloppe de **mutation offline**, **queue mémoire** FIFO (`enqueue`/`dequeue`/`peek`/`clear`). **Sans persistance, sans rejeu auto, sans NetInfo/MMKV/AsyncStorage/SQLite, sans donnée sensible** (ADR-015 §19). |
| États standards | `src/states` | `LoadingState`, `ErrorState`, `EmptyState`, `OfflineState`, `UnauthorizedState` |
| Tests | `test/` | **`node --test`** sur le cœur agnostique (auth-engine, session-store, validation, form-errors, offline-queue, network-state, token-mapping, **with-auth-retry**) — **47 tests** |

## Stack

- **Expo SDK 55** (New Architecture par défaut), **Expo Router** (routing fichier).
- **React 19.2 / React Native 0.83**.
- **`@enistere/api-client-fetch` + `@enistere/api-contracts`** (client typé officiel ADR-016, sur `openapi-fetch`) — liés via `file:`, résolus par Metro.
- **TanStack Query 5** pour l'état serveur.
- **React Hook Form 7 + Zod 3** (`@hookform/resolvers`) pour les formulaires et la validation UX.
- **Expo SecureStore** pour les secrets.
- **TypeScript strict**.

## Structure

```txt
cores/mobile-react-native/
├── app/                      # Routes Expo Router (fines)
│   ├── _layout.tsx           # providers (SafeArea → Theme → Query → Auth) + Stack
│   ├── index.tsx             # gate de redirection selon l'état auth
│   ├── (public)/             # navigation publique
│   │   ├── _layout.tsx
│   │   └── sign-in.tsx       # écran placeholder public
│   ├── (app)/                # navigation authentifiée (protégée)
│   │   ├── _layout.tsx       # garde de route
│   │   └── home.tsx          # écran placeholder authentifié
│   └── +not-found.tsx        # fallback
├── src/
│   ├── api/                  # client OFFICIEL @enistere/api-client-fetch (index.ts) + with-auth-retry (pont 401, agnostique)
│   ├── auth/                 # auth-engine (agnostique), auth-api (seam) + enistere-auth-api (réel) + session-adapter + token-mapping, AuthProvider, hook
│   ├── config/               # env (EXPO_PUBLIC_*) — aucun secret
│   ├── forms/                # RHF + Zod : FormField/FormLabel/FormError/TextInputField + validation/form-errors (agnostiques) + resolver
│   ├── navigation/           # constantes de routes + gardes (expired/refreshing)
│   ├── offline/              # primitives offline-ready : network-state, mutation, queue mémoire (agnostiques)
│   ├── query/                # server-state : QueryClient/provider + query-keys + query-errors (agnostiques) + useAuthedQuery/Mutation + invalidation
│   ├── states/               # états UI standards
│   ├── storage/              # SecureStorage (interface) + Expo/InMemory impl + SessionStore
│   ├── theme/                # ThemeProvider + tokens (bridge UI Kit)
│   ├── types/                # types génériques partagés
│   └── ui/                   # primitives UI maison
├── test/                     # node --test (auth-engine, session-store, validation, form-errors, offline-queue, network-state, token-mapping, with-auth-retry, query-keys, query-errors)
├── app.json · tsconfig.json · tsconfig.test.json · babel.config.js · metro.config.js · eslint.config.js · .env.example
└── CORE_SPECIFICATION.md · README.md · ARCHITECTURE.md
```

> Layout **plat** (projet à la racine du core), cohérent avec `web-nextjs` et
> `api-nestjs`. C'est un écart **assumé** vis-à-vis du `starter/` du
> `CORE_SPECIFICATION.md` §8 — voir [`ARCHITECTURE.md`](./ARCHITECTURE.md).

## Gouvernance (ADR appliqués)

| ADR | Application dans ce socle |
|---|---|
| **ADR-003** Validation | **Zod côté client = UX uniquement** ; la validation **backend reste obligatoire** (API Core = autorité) ; aucun DTO API recopié, aucun schéma métier |
| **ADR-004** Auth/session | access token court + refresh token ; logout invalide la session |
| **ADR-008** Design tokens | tokens UI Kit = source de vérité ; bridge placeholder en attendant la surface mobile |
| **ADR-010** Stack UI RN | tokens + **ThemeProvider** + composants maison (pas de NativeWind ni lib UI) |
| **ADR-011** Client HTTP | **`fetch` via le client officiel** (`openapi-fetch`, pas d'Axios) ; tokens fournis par la couche auth (adaptateur de session), **jamais** stockés dans le client |
| **ADR-012** Server state | TanStack Query (couche server-state générique RN 5 : query-keys, `useAuthedQuery`/`useAuthedMutation`, normalisation d'erreurs, invalidation) ; **cache vidé au logout** (`purgeServerState`) ; **`401` jamais retenté** ; mutations sans retry ; pas de persistance |
| **ADR-015** Secure storage | access token **en mémoire** (injecté en Bearer via l'adaptateur), refresh token en **SecureStore** ; nettoyage au logout |
| **ADR-016** Client typé OpenAPI | **INTÉGRÉ** : `@enistere/api-client-fetch` + `@enistere/api-contracts` consommés réellement (liés `file:`, Metro) ; refresh possédé par l'AuthEngine (`enableRefresh:false`) — voir ARCHITECTURE §12 |

## Commandes

```bash
# Prérequis : les packages liés (file:) doivent être bâtis (dist) une fois, p.ex.
# depuis la racine du monorepo : npm run build  (api-contracts + api-client-fetch)
npm install          # installe les dépendances (core autonome, hors workspaces ; @enistere/* liés en file:)
npm run typecheck    # tsc --noEmit (strict) — contre les types réels du contrat
npm run lint         # expo lint (eslint-config-expo)
npm test             # nettoie build-test, tsc -p tsconfig.test.json && node --test (cœur agnostique)
npm run doctor       # npx expo-doctor
npm start            # démarre le serveur de dev Expo
```

## Configuration d'environnement

Seules les variables **`EXPO_PUBLIC_*`** sont exposées au bundle — elles sont
**publiques**. **Aucun secret** ici. Copier [`.env.example`](./.env.example) en
`.env` (gitignoré) :

- `EXPO_PUBLIC_APP_ENV` = `local` | `staging` | `production`
- `EXPO_PUBLIC_API_BASE_URL` = URL de l'API Core (sans slash final)
- `EXPO_PUBLIC_API_TIMEOUT_MS` (optionnel)

## Sécurité

- Aucun secret embarqué ; `EXPO_PUBLIC_*` réservé au public.
- Access token en mémoire ; refresh token en SecureStore ; jamais d'AsyncStorage
  pour les secrets ; jamais de token dans les logs.
- Logout : suppression des tokens **et** vidage du cache TanStack Query.

## Hors périmètre de cette mission (différé)

Présents au `CORE_SPECIFICATION.md` mais **non livrés** dans ce socle, par choix
de mission : **Zustand** (état local), **upload** (les helpers multipart
`buildUploadFormData` / RN `{uri,name,type}` existent **dans le package** mais ne
sont **pas câblés**), **notifications push**, **logger/observabilité**,
**permissions natives**, et les **hooks TanStack Query** au-dessus du client
(server-state). Et tout V2/V3 (maps, tracking, carousels, bottom sheets, crash
reporting). **L'offline reste préparatoire** : `src/offline` fournit les briques
(état réseau abstrait + queue mémoire), **sans** persistance, **sans** rejeu
automatique, **sans** détection de connectivité (NetInfo) ni **sync** réelle
(ADR-029 futur). Voir la roadmap du spec (§37/§53) et
`docs/project-status/NEXT_ACTIONS.md`.

## Vérification

- `typecheck` : ✅ (TypeScript strict, `tsc --noEmit`) — contre les **types réels** du contrat.
- `lint` : ✅ (`expo lint` / eslint-config-expo, 0 finding).
- `test` : ✅ **59/59** (`node --test` : auth-engine, session-store, validation, form-errors, offline-queue, network-state, token-mapping, with-auth-retry, **query-keys, query-errors** — server-state RN 5).
- `doctor` : ✅ **expo-doctor 19/19**.
- **bundle Metro** : ✅ `expo export -p ios` réussit — le bundle Hermes embarque le client (`createEnistereApiClient`, `/auth/login`, `/auth/refresh`, …) → **intégration prouvée au niveau bundler** (RN 4).

## Prochaine mission recommandée

**Mobile Core React Native 6 — état local (Zustand) + câblage purge au logout**
(store local générique pour l'état UI, **séparé** du server-state — aucune donnée
serveur dans Zustand ; et câbler `signOut → purgeServerState(queryClient)` dans
`AuthProvider`). Une seule mission à la fois.
