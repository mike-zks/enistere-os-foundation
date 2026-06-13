# Mobile Core React Native — Generic i18n / Localization Primitives

> Statut : **`I18N_READY`** (V1 — RN 11 ; socle RN 1 → notifications RN 10)
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
| Server state (data layer) | `src/query` | `QueryClient` + `QueryProvider` (TanStack Query) **+ couche générique RN 5** : `createQueryKeys` (clés typées stables), **`useAuthedQuery`/`useAuthedMutation`** (appels authentifiés **via `authedRequest`** — pont 401), `toQueryError` (normalisation UI **sans donnée sensible**), `invalidateScope`/**`purgeServerState`** (purge **déterministe** `await cancelQueries`→`clear`, **câblée au logout** RN 6). **401 jamais retenté ; mutations sans retry ; pas de persistance ; aucun endpoint métier.** |
| **État local UI (RN 6)** | `src/store` | **Zustand** (`useUiStore`) générique, **séparé** du server-state : `themePreference` (enum) + `flags` (booléens) + `reset()`. **Uniquement des primitives UI non sensibles** (le type interdit token/profil/payload serveur) ; **in-memory, sans persistance**. Logique de transition **pure** (`ui-state`). |
| **Upload sécurisé (RN 7)** | `src/upload` | `MobileFile` `{uri,name,type}` + helpers purs (`isMobileFile`, `describeFileForLog` → **`{type,extension}`**, sans `uri` ni nom brut, RN 8, `isAllowedFileType` UX) ; **`useUploadMutation`** (via `useAuthedMutation` → `apiClient.files.upload`, pont 401 `authedRequest`, `FormData` reconstruit au retry). **Mutation** → pas de clé de cache ; **aucun fichier/URL signée/token en cache/log/store** ; validation **backend autoritaire** (ADR-007). **Aucun écran, aucun endpoint métier.** |
| **Logger / observabilité (RN 8)** | `src/logger` | Logger générique typé (`createLogger` : `debug`/`info`/`warn`/`error`, **niveaux**, **sink pluggable**, **horloge injectée**, corrélation `child`/`withRequestId`) ; **redaction centrale** (`redactValue`/`redactString` : tokens, `Authorization`, cookies, JWT, **URL signées**, **chemins device**, **PII/email**) appliquée **avant** tout sink ; `safeErrorFields(QueryError)`. **Aucune persistance, aucun transport réseau, aucun service externe, aucun log de body** (ADR-040). |
| **Permissions natives (RN 9)** | `src/permissions` | Modèle pur `PermissionKind`/`PermissionStatus` + helpers (`normalizePermissionStatus`, `canRequestPermission`, `isPermissionGranted`…) ; `PermissionAdapter` (seam Expo) + **`createPermissionService`** (live `getStatus`/`request`/`ensure`/`openSettings`, **logs sûrs** via logger RN 8, `PermissionAdapterError` contrôlé) ; **adaptateur placeholder** (no native dep) ; hook **`usePermission`** (status/loading/error, **no UI**). **Statut jamais persisté** (ni SecureStore/Zustand/Query) ; **API Core = autorité** (07_SECURITY §6). Prépare picker/upload/notifications, **ne les livre pas**. |
| **Notifications locales (RN 10)** | `src/notifications` | `NotificationMessage` **borné/sûr** (`sanitizeNotificationMessage`, `describeNotificationForLog` **sans contenu**) + `NotificationDeliveryState`/`NotificationTrigger` (`normalizeTrigger`) ; `NotificationAdapter` (seam Expo) + **`createNotificationService`** (gate sur la permission `notifications` RN 9 — **jamais de schedule sans permission usable**, `schedule`/`cancel`/`cancelAll`/`getDelivered`, **logs sûrs** via logger RN 8, `NotificationError` contrôlé) ; **adaptateur placeholder** (no native dep). **LOCAL uniquement** : **aucun push réel**, **aucun token device/FCM/APNs**, **aucun stockage**, **aucune UI**. |
| **i18n / localisation (RN 11)** | `src/i18n` | Modèle de locale (`normalizeLocale` via `Intl`, `getLocaleDirection` ltr/rtl, `resolveLocale`) + **catalogue typé** (`createTranslator` : `t`/`has`/`plural`, **interpolation `{name}`**, **pluralisation `Intl.PluralRules`**, clé inconnue **sans throw**) + **formatters `Intl`** (`formatDate`/`formatNumber`/`formatCurrency` — devise requise, **ne lèvent jamais**) ; `LocaleAdapter` (seam Expo) + **adaptateur placeholder** (no native dep) + **`createLocalization`** (résout locale + catalogue + formatters). **Aucune dépendance** (tout via `Intl`), **aucun réseau/persistance/UI** ; **catalogues métier = projets dérivés**. |
| Thème / tokens | `src/theme` | `ThemeProvider` + bridge tokens placeholder (light/dark) |
| UI primitives | `src/ui` | `Screen`, `Text`, `Button` (token-driven, a11y) |
| **Formulaires / validation** | `src/forms` | **React Hook Form + Zod** : `FormField`/`FormLabel`/`FormError`/`TextInputField` (token-driven, a11y), helpers `validateWith` + mapping erreurs Zod/RHF, resolver. **UX uniquement** (backend = autorité, ADR-003 §18). **Aucun formulaire métier.** |
| **Offline-ready (préparatoire)** | `src/offline` | état réseau **abstrait**, enveloppe de **mutation offline**, **queue mémoire** FIFO (`enqueue`/`dequeue`/`peek`/`clear`). **Sans persistance, sans rejeu auto, sans NetInfo/MMKV/AsyncStorage/SQLite, sans donnée sensible** (ADR-015 §19). |
| États standards | `src/states` | `LoadingState`, `ErrorState`, `EmptyState`, `OfflineState`, `UnauthorizedState` |
| Tests | `test/` | **`node --test`** sur le cœur agnostique (auth-engine, session-store, validation, form-errors, offline-queue, network-state, token-mapping, with-auth-retry, query-keys, query-errors, ui-state, invalidation, upload-file, logger-redaction, logger, permission-status, permission-engine, notification-message, notification-engine, **i18n-locale, i18n-catalog, i18n-format, i18n-engine**) — **144 tests** |

## Stack

- **Expo SDK 55** (New Architecture par défaut), **Expo Router** (routing fichier).
- **React 19.2 / React Native 0.83**.
- **`@enistere/api-client-fetch` + `@enistere/api-contracts`** (client typé officiel ADR-016, sur `openapi-fetch`) — liés via `file:`, résolus par Metro.
- **TanStack Query 5** pour l'état serveur ; **Zustand 5** pour l'état local UI (séparés, ADR-012 / spec §57).
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
│   ├── i18n/                 # localisation (agnostiques) : locale + catalog + format (Intl) + adapter + placeholder + engine (RN 11)
│   ├── logger/               # logger/observabilité (agnostiques) : redaction centrale + createLogger + error-fields (RN 8)
│   ├── navigation/           # constantes de routes + gardes (expired/refreshing)
│   ├── notifications/        # notifications locales (agnostiques) : message + types + engine + placeholder (RN 10)
│   ├── offline/              # primitives offline-ready : network-state, mutation, queue mémoire (agnostiques)
│   ├── permissions/          # permissions runtime (agnostiques) : status + adapter + engine + placeholder + usePermission (RN 9)
│   ├── query/                # server-state : QueryClient/provider + query-keys + query-errors (agnostiques) + useAuthedQuery/Mutation + invalidation
│   ├── states/               # états UI standards
│   ├── store/                # état local UI (Zustand) : ui-state (pur, agnostique) + ui-store (useUiStore)
│   ├── storage/              # SecureStorage (interface) + Expo/InMemory impl + SessionStore
│   ├── theme/                # ThemeProvider + tokens (bridge UI Kit)
│   ├── types/                # types génériques partagés
│   ├── ui/                   # primitives UI maison
│   └── upload/               # upload sécurisé : file (pur, agnostique) + useUploadMutation
├── test/                     # node --test (auth-engine, session-store, validation, form-errors, offline-queue, network-state, token-mapping, with-auth-retry, query-keys, query-errors, ui-state, invalidation, upload-file, logger-redaction, logger, permission-status, permission-engine, notification-message, notification-engine, i18n-locale, i18n-catalog, i18n-format, i18n-engine)
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
| **ADR-007** Fichiers/upload | **upload via l'API** (`apiClient.files.upload` → `POST /files`, RN 7) ; **API = autorité** (taille/MIME/permissions) ; client UX uniquement ; **aucune URL signée/champ interne** exposé ; pas de bypass du stockage |
| **ADR-008** Design tokens | tokens UI Kit = source de vérité ; bridge placeholder en attendant la surface mobile |
| **ADR-010** Stack UI RN | tokens + **ThemeProvider** + composants maison (pas de NativeWind ni lib UI) |
| **ADR-011** Client HTTP | **`fetch` via le client officiel** (`openapi-fetch`, pas d'Axios) ; tokens fournis par la couche auth (adaptateur de session), **jamais** stockés dans le client |
| **ADR-012** Server state | TanStack Query (couche server-state RN 5) **séparé de Zustand** (état local UI, RN 6 — anti-pattern spec §57) ; **cache purgé au logout** (`purgeServerState` **déterministe**, câblé dans `AuthProvider`) ; **`401` jamais retenté** ; mutations sans retry ; pas de persistance |
| **ADR-015** Secure storage | access token **en mémoire** (injecté en Bearer via l'adaptateur), refresh token en **SecureStore** ; **purge au logout** (storage + cache server-state) ; **aucun token/donnée sensible dans Zustand** (store = primitives UI non sensibles) |
| **ADR-016** Client typé OpenAPI | **INTÉGRÉ** : `@enistere/api-client-fetch` + `@enistere/api-contracts` consommés réellement (liés `file:`, Metro) ; refresh possédé par l'AuthEngine (`enableRefresh:false`) — voir ARCHITECTURE §12 |
| **ADR-040** Logging structuré | **logger client (RN 8)** : `createLogger` (niveaux, sink pluggable, corrélation `requestId`) + **redaction centrale** (tokens/`Authorization`/cookies/JWT/URL signées/chemins device/PII) appliquée **avant** tout sink ; **JSON structuré**, **sans transport réseau/persistance/backend d'observabilité** ni log de body — voir ARCHITECTURE §17 |
| **07_SECURITY §6** Autorisation | **permissions runtime (RN 9)** : une permission device est une **capacité locale**, **pas** une barrière de sécurité — l'**API Core reste l'autorité** ; statut **jamais persisté** (ni SecureStore/Zustand/Query) ; logs **sûrs** via le logger RN 8 (`{kind,status}` uniquement) — voir ARCHITECTURE §18 |
| **07_SECURITY §13 / ADR-040** Logs | **notifications locales (RN 10)** : le **contenu** (`title`/`body`/`data`) est potentiellement de la PII → **jamais loggé** (`describeNotificationForLog` = métadonnées seules) ; **aucun token device/push/FCM/APNs** ; **aucun stockage** ; planification **gouvernée** par la permission `notifications` (RN 9) — voir ARCHITECTURE §19 |
| **08_STANDARDS / 06_DEPENDENCY** i18n | **localisation (RN 11)** : primitives génériques **via `Intl` built-in** (**aucune dépendance** ajoutée, pas de framework i18n lourd) ; **aucun réseau**, **aucune persistance de locale**, **aucun contenu métier** (catalogues = projets dérivés) — voir ARCHITECTURE §20 |

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
  pour les secrets ; **jamais de token, cookie, `Authorization`, URL signée,
  chemin device ou PII dans les logs** — le logger (RN 8) **redacte au centre**
  toute sortie avant le sink (ADR-040 ; `redactValue`/`redactString`).
- Logout : suppression des tokens **et** **purge déterministe** du cache TanStack
  Query (`purgeServerState`, câblée dans `AuthProvider`). **Aucun token/donnée
  sensible dans le store local Zustand** (primitives UI non sensibles uniquement).

## Hors périmètre de cette mission (différé)

Présents au `CORE_SPECIFICATION.md` mais **non livrés** dans ce socle, par choix
de mission. **L'i18n (RN 11) livre les primitives** (locale, catalogue typé,
interpolation/pluralisation, formatters `Intl`, adapter, placeholder, service)
mais **PAS** d'adaptateur `expo-localization` réel, de **persistance du choix de
locale**, de hook/provider React, d'application RTL à l'UI, de chargement
paresseux des catalogues ni de **catalogues métier** (apportés par les projets
dérivés). **Les notifications (RN 10) livrent les primitives locales** (message
borné, modèle, service gouverné par la permission RN 9, placeholder) mais **PAS**
de **push distant réel** (Expo Push/FCM/APNs), de **token device**, d'adaptateur
`expo-notifications` réel, de handler de tap/routing, de catégories/actions/badges
ni d'écran. **Les permissions (RN 9) livrent l'abstraction** (modèle, adapter,
service, placeholder, `usePermission`) mais **PAS** d'adaptateurs Expo réels
(caméra/médias/notifications/localisation), d'écran ni de demande de permission
contextualisée. **Le logger (RN 8) livre les primitives** (`createLogger`, redaction centrale, `safeErrorFields`) mais **PAS**
de backend d'observabilité, de transport réseau, de persistance de logs ni de
recâblage des `console.*` existants ; la collecte/observabilité relève d'un
ADR/Cloud Core futur (ADR-018/036). **L'upload (RN 7) livre les primitives**
(`MobileFile`, `useUploadMutation`) mais **PAS** d'écran/picker, de progression,
de multi-upload ni de suppression/quarantaine/restauration (présents dans le
package, non câblés).
Et tout V2/V3 (maps, tracking, carousels, bottom sheets, crash reporting).
**Le store local Zustand n'est PAS persisté** (in-memory ; persistance de
préférences non sensibles = option future, ADR-015 §16).
**L'offline reste préparatoire** : `src/offline` fournit les briques
(état réseau abstrait + queue mémoire), **sans** persistance, **sans** rejeu
automatique, **sans** détection de connectivité (NetInfo) ni **sync** réelle
(ADR-029 futur). Voir la roadmap du spec (§37/§53) et
`docs/project-status/NEXT_ACTIONS.md`.

## Vérification

- `typecheck` : ✅ (TypeScript strict, `tsc --noEmit`) — contre les **types réels** du contrat.
- `lint` : ✅ (`expo lint` / eslint-config-expo, 0 finding).
- `test` : ✅ **144/144** (`node --test` : … notification-message, notification-engine, **i18n-locale + i18n-catalog + i18n-format + i18n-engine** — RN 11).
- `doctor` : ✅ **expo-doctor 19/19** *(les checks réseau Expo API / RN Directory flappent transitoirement dans cet environnement ; RN 11 n'ajoute aucune dépendance)*.
- **bundle Metro** : ✅ `expo export -p ios` réussit — bundle Hermes embarquant le client (RN 4).

## Prochaine mission recommandée

**Mobile Core React Native 12 — deep-linking / routing primitives génériques** :
au-dessus de notifications (RN 10) et navigation, une couche générique de
résolution de liens (parsing d'URL/deep-link → route interne **validée** + params,
**anti-open-redirect** comme le `returnTo` Web, schémas autorisés), **mappée
purement** et **testable**, **sans dépendance native** ni logique métier — gère le
tap de notification. Une seule mission à la fois. *(Adaptateurs Expo réels,
push distant et offline sync — ADR-029 — restent différés.)*
