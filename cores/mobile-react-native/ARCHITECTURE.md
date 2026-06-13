# Mobile Core React Native — Architecture & Décisions (Starter Foundation)

Ce document explique les choix structurants du socle et les **écarts assumés**
vis-à-vis du `CORE_SPECIFICATION.md`, conformément à la mission
« Mobile Core React Native 1 — starter foundation ».

## 1. Layout plat (et non `starter/`)

Le `CORE_SPECIFICATION.md` §8 illustre une arborescence imbriquée sous
`cores/mobile-react-native/starter/`. Le socle adopte plutôt un **layout plat**
(projet Expo directement à la racine du core).

**Raison :** c'est la **convention réelle du repo**. `cores/web-nextjs` et
`cores/api-nestjs` placent leur `package.json`, `src/` et leur configuration à
la racine du core (docs dans un sous-dossier), sans niveau `starter/`. L'exemple
§5 de la mission est lui aussi plat. La cohérence inter-cores prime ; l'écart est
documenté ici comme demandé par la mission.

**Conséquence :** l'organisation `src/core` + `src/shared` + `src/features` du §8
(feature-first) n'est pas matérialisée sur un socle encore vide. Le `src/` suit
la liste de modules de la mission (`api`, `auth`, `config`, `navigation`,
`query`, `states`, `storage`, `theme`, `types`, `ui`). Le passage feature-first
se fera quand de vraies features arriveront (mission ultérieure).

## 2. Core autonome (hors workspaces npm)

Le core a son propre `package.json` + `package-lock.json` et **n'est pas** ajouté
aux `workspaces` racine. C'est cohérent avec `cores/api-nestjs` (autonome) et
avec la description du `package.json` racine (« les cores restent autonomes »).
Conséquence directe : ce socle **ne consomme pas** les packages `@enistere/*`
(workspace) — voir §4.

## 3. Thème : bridge tokens + ThemeProvider (ADR-008 / ADR-010)

ADR-010 impose « tokens Enistere + **ThemeProvider** + composants maison », sans
NativeWind ni librairie UI complète. Le socle fournit donc un `ThemeProvider`
(contexte, light/dark via `useColorScheme`) et des primitives maison
(`Screen`/`Text`/`Button`) pilotées par tokens, avec un plancher de cible tactile
(a11y).

`@enistere/ui-kit` (ADR-008) reste la **source de vérité** des tokens et est déjà
RN-safe. La mission autorisant explicitement un « bridge minimal », `src/theme/
tokens.ts` **mire la forme** des tokens UI Kit avec des **valeurs placeholder**
(neutres, pas une identité de marque). Quand la surface tokens mobile de l'UI Kit
sera disponible, on remplacera ces littéraux par des imports
`@enistere/ui-kit/tokens` — le `ThemeProvider` et les composants ne changent pas.

## 4. API : transport `fetch` générique = **seam** vers `@enistere/api-client-fetch`

- **ADR-011** retient `fetch` (pas d'Axios) ; les tokens sont fournis par la
  couche auth, jamais stockés dans le client. Le socle l'applique : `src/api`
  expose un client `fetch` générique (base URL, injection `Authorization`,
  erreurs typées `ApiError`/`NetworkError`/`TimeoutError`, timeout via
  `AbortController`), **sans aucun endpoint métier**.
- **ADR-016** désigne le client **officiel** : `@enistere/api-client-fetch`
  (+ `@enistere/api-contracts`), déjà **RN-safe** (multipart RN, consumer RN) et
  consommé par `web-nextjs`. ADR-016 §39 interdit de réécrire à la main une
  interface cliente déjà présente dans le contrat.

**Décision (et écart assumé) :** intégrer `@enistere/api-client-fetch` exige
d'ajouter le core aux `workspaces` racine + une configuration Metro monorepo —
or `package.json` racine est **hors du périmètre autorisé** de cette mission
(`cores/mobile-react-native/**` + docs de statut), et ADR-016 §7 reporte la
génération/intégration de client à une mission dédiée. Le socle livre donc un
**transport minimal générique** présenté comme un **seam** : les appels passent
par `apiClient.get/post/...`, et lors de l'intégration du client officiel, le
*token provider* et la config base URL sont conservés sans toucher les call
sites. On **ne** réimplémente **pas** ici le refresh coordonné, le multipart ni
les endpoints typés (qui appartiennent au package).

## 5. Auth shell : access token en mémoire, refresh token persistant (ADR-004 / ADR-015)

- L'**access token** vit **en mémoire** (état du `AuthProvider`) — jamais
  persisté (ADR-015 §11). Le `apiClient` le lit via un *token provider*.
- Le **refresh token** (secret) est persisté en **SecureStore** via `TokenStore`
  (ADR-015 §12). `restoreSession` lit sa présence au démarrage.
- **`signIn`/`signOut`/`restoreSession` sont des placeholders** : aucun appel
  backend (mission §3.2). Un vrai impl POSTera vers l'API Core (login),
  échangera le refresh token (refresh) et hydratera le profil via `/me`.
- **Logout** : suppression des tokens **et** `queryClient.clear()` (ADR-015
  §17/§18 — aucune donnée de l'utilisateur précédent ne survit).

## 6. Navigation (spec §16)

Expo Router, fichier-based. Les groupes `(public)` et `(app)` matérialisent les
deux stacks. `app/index.tsx` redirige selon l'état auth (loading → `LoadingState`).
`(app)/_layout.tsx` est la **garde** : loading → état de chargement,
non-authentifié/expiré → redirection vers `(public)`, authentifié → stack
protégée. `(public)/_layout.tsx` renvoie les utilisateurs authentifiés vers la
stack app (défense en profondeur). `+not-found.tsx` couvre les routes inconnues.

`typedRoutes` est **désactivé** : ses types générés (`.expo/types`) ne sont pas
présents lors d'un `tsc --noEmit` headless (CI), donc le désactiver garde le
typecheck robuste. Réactivable plus tard avec une étape de génération.

## 7. Séparation transport / état serveur / état local

- État **serveur** → TanStack Query (ADR-012).
- État **local** → **Zustand prévu** par le spec (§23) mais **différé** (hors
  périmètre de la mission). Aucun état serveur ne doit finir dans un store local
  (anti-pattern §57).
- Transport HTTP distinct du cache (ADR-016 §5).

## 8. Sécurité

Aucun secret embarqué ; `EXPO_PUBLIC_*` public uniquement ; tokens hors logs ;
SecureStore pour les secrets ; HTTPS attendu en production ; aucun appel direct
OSRM depuis le mobile (spec §35 — non concerné ici, pas de maps).

## 9. Auth/session hardening (RN 2)

RN 2 transforme le shell auth de RN 1 en une fondation durcie, **testable**.

- **`AuthEngine` framework-agnostique** (`src/auth/auth-engine.ts`, aucun import
  React/RN) : machine d'état possédant le cycle de vie de session. React s'y
  abonne via `subscribe`/`getSnapshot` (`useSyncExternalStore` dans
  `AuthProvider`). Bénéfice : la logique auth est **unit-testée en isolation**
  (`node --test`) — convention partagée avec `ui-kit`/`api-client-fetch`.
- **États** (session model) : `loading` · `authenticated` · `unauthenticated` ·
  `refreshing` · `expired`. Aucun champ métier.
- **Tokens (ADR-015)** : access token **en mémoire** (jamais persisté, jamais
  dans le snapshot React → hors arbre de composants/logs) ; **`SessionStore`**
  persiste l'enveloppe `{ refreshToken, expiresAt, user }` en SecureStore, avec
  **validation** du format restauré (fail-soft → `null`).
- **Restauration** : au démarrage, `restoreSession` lit l'enveloppe puis
  **refresh** pour re-minter un access token en mémoire ; succès → `authenticated`,
  échec → `expired` (storage purgé).
- **Refresh coalescé** : `refreshSession` partage une seule promesse in-flight →
  pas de double refresh / token stampede.
- **Expiration** : proactive (`getAccessToken()` renvoie `null` si l'access
  token est expiré, via une horloge injectable) **et** réactive (voir API).
- **API client (ADR-011)** : sur `401`, le client appelle le handler
  (`refreshSession`), et **rejoue la requête une fois** avec le nouveau token ;
  si le refresh échoue (handler → `null`), le `401` est surfacé et la couche
  auth purge la session (`expired`). Une seule reprise (pas de boucle).
- **Gardes de navigation** : `loading`/`refreshing` → loading state (pas de
  redirection) ; `authenticated` → app ; `unauthenticated`/`expired` → public
  (l'écran de connexion affiche un avis « session expirée »).
- **Seam `@enistere/api-client-fetch`** : l'`AuthApi` (`src/auth/auth-api.ts`)
  est l'interface d'intégration. RN 2 livre `PlaceholderAuthApi` (sans backend) ;
  l'adaptateur réel POSTera `/auth/login`/`/auth/refresh` (API Core) — voir §4,
  intégration reportée (périmètre racine workspace/Metro).
- **Tests** (`test/`, `node --test`, 21 cas) : auth-engine (restore valide/
  absente/expirée, signIn ok/ko, signOut purge, refresh ok/ko, coalescing,
  expiry), session-store (round-trip, absent, corrompu, invalide, clear),
  api-client (injection token, non-2xx, 401→refresh→retry, 401 sans reprise,
  timeout, network). Compilés via `tsconfig.test.json` (CommonJS, sous-ensemble
  agnostique uniquement — les fichiers RN/Expo ne sont pas compilés pour Node).

## 10. Formulaires & validation (RN 3)

RN 3 ajoute des **primitives de formulaire génériques** et une couche de
**validation UX**, **sans aucun formulaire métier**.

- **Validation = UX uniquement (ADR-003 §18)** : `src/forms/validation.ts`
  enveloppe **Zod** (`validateWith`, plus des fabriques génériques
  `requiredText`/`emailField`/`minLengthText`/…). **La validation backend reste
  obligatoire** — l'API Core NestJS est l'autorité (ADR-003 §7/§18). On **ne
  recopie aucun DTO API** et on **ne crée aucun schéma métier**
  (Kivvoo/RFashion/Bailo/…).
- **Mapping d'erreurs agnostique** : `src/forms/form-errors.ts` normalise les
  erreurs en `FieldErrorMap` (clé = nom de champ). `zodErrorToFieldErrors`
  aplatit un `ZodError` par chemin (premier message par champ) ;
  `fieldErrorMessage` lit **structurellement** une erreur React Hook Form
  (`{ message }`) **sans importer** `react-hook-form` → le module reste
  testable sous `node --test` (l'import `zod` est **type-only**).
- **Primitives React (token-driven, ADR-008/010)** : `FormField` (layout
  label + contrôle + erreur/hint, wiring `nativeID`), `FormLabel`, `FormError`
  (danger-toned, **live region** « polite » → erreurs **accessibles**, spec
  §45), `TextInputField` (input thémé lié à RHF via `Controller`, bordure
  reflétant focus/validité). `resolver.ts` expose `createZodResolver` /
  `zodResolver` comme **point d'intégration unique** RHF↔Zod.
- **Choix de version** : **Zod 3.x** (et `@hookform/resolvers` 3.x) sont retenus
  car le build de test (`tsconfig.test.json`) utilise la résolution **node
  classique**, qui n'honore pas la carte `exports`-only de Zod 4 ; Zod 3 expose
  `main`/`types` à la racine et se résout proprement pour `node --test`.

## 11. Offline-ready primitives (RN 3)

RN 3 pose les **briques préparatoires** offline, **sans activer** de stratégie
offline complète (ADR-015 §19, spec §37).

- **État réseau abstrait** (`src/offline/network-state.ts`) :
  `NetworkStatus = online | offline | unknown` + helpers purs (`isOnline`,
  `shouldQueueMutations` — **conservateur** : on file dès que ce n'est pas
  positivement `online`). **Aucune détection** de connectivité ici : **pas de
  NetInfo / `expo-network` / `navigator.onLine` / polling**. C'est le **seam**
  qu'une source réelle alimentera plus tard.
- **Enveloppe de mutation** (`src/offline/mutation.ts`) : `OfflineMutation`
  **neutre** (`id`/`type` opaque/`payload`/`createdAt` — horloge **injectée**,
  jamais `Date.now()` ici) + garde `isOfflineMutation`. **Aucune donnée
  sensible** ne doit y figurer (ADR-015 §19).
- **Queue mémoire FIFO** (`src/offline/queue.ts`) : `enqueue`/`dequeue`/`peek`/
  `clear`/`remove` + `size`/`isEmpty`/`toArray` (snapshot défensif), `maxSize`
  optionnel. **En mémoire uniquement** — **pas** de persistance
  (MMKV/AsyncStorage/SQLite), perdue au reload **par design**. Elle **ne rejoue
  rien automatiquement** et n'a **aucun** câblage réseau/timer : le drainage
  (quand `online`) est la responsabilité de l'appelant. La persistance et la
  sync relèvent d'un **ADR futur** (ADR-029).
- **Tout est framework-agnostique** (aucun import React/RN) → **unit-testé**
  sous `node --test`, comme l'AuthEngine.

## 12. Intégration réelle du client officiel (RN 4 / RN 4B)

RN 4 **remplace** le transport « seam » local par le **client officiel**
`@enistere/api-client-fetch` (+ `@enistere/api-contracts`), ADR-016. Plus aucun
transport HTTP écrit à la main : le contrat est la source de vérité.

- **Consommation = core autonome + packages liés (`file:`)** (écart assumé, voir
  §13) : le core garde **son propre lockfile** et **n'entre PAS** dans les
  `workspaces` racine. Les deux packages sont liés via des dépendances
  **`file:../../packages/*`** ; **`metro.config.js`** ajoute leurs dossiers aux
  `watchFolders` et active `unstable_enablePackageExports` (la carte `exports`
  des packages est **`import`-only**). `openapi-fetch` (seule dépendance runtime
  d'`api-client-fetch`) est déclaré **directement** dans le core → résolution
  100 % depuis `node_modules` du core (pas de React/RN dupliqué via la racine).
- **Client (`src/api/index.ts`)** : `createEnistereApiClient({ baseUrl, timeoutMs,
  session, enableRefresh: false })`. `baseUrl`/`timeoutMs` viennent de la config
  `EXPO_PUBLIC_*` ; `session` est le {@link MobileAuthSessionAdapter}. Le client
  typé expose `auth`/`files`/`raw` ; on n'utilise **aucun** endpoint métier (et
  **pas** `files.upload` — hors périmètre).
- **Adaptateur de session (`src/auth/session-adapter.ts`)** : `AuthSessionAdapter`
  pont **lecture seule**. `getAccessToken()` renvoie l'access token **en mémoire**
  de l'AuthEngine (**injection Bearer**) ; `refreshSession()` expose le refresh
  **coalescé** de l'AuthEngine au pont 401 (ci-dessous). Lié à chaud par
  `AuthProvider` via `bind({ getAccessToken, refreshSession })`/`unbind`. Le
  client **ne stocke jamais** de token (ADR-015/016 §27).
- **Refresh : l'AuthEngine reste le SEUL propriétaire (coalescé)**. Le client est
  créé avec **`enableRefresh: false`** → **une seule stratégie de refresh**, pas
  de refresh concurrent côté client ; les hooks `getRefreshToken`/`updateTokens`/
  `clearSession` de l'adaptateur sont des **no-op documentés** (jamais appelés).
- **Pont 401 (RN 4B — `src/api/with-auth-retry.ts`)** : restaure le comportement
  RN 1–3 **par-dessus** le client officiel. `authedRequest(fn)` =
  `withAuthRetry(engine.refreshSession, fn)` :
  **`401` → `AuthEngine.refreshSession()` (coalescé) → 1 seul retry → purge si
  échec**. Sur 401 (détecté par `isUnauthorizedError` = `error.isUnauthorized`,
  structurel, sans import ESM), le pont demande le refresh **coalescé** de
  l'AuthEngine (les appels concurrents partagent l'unique refresh in-flight),
  puis **rejoue la requête une fois** (la requête relit le Bearer rafraîchi via
  l'adaptateur) ; si le refresh renvoie `null` (session **purgée** → `expired`),
  le 401 est **surfacé** (pas de boucle, pas de 2ᵉ refresh). **Tout appel
  authentifié doit passer par `authedRequest`.** Le module est **pur/agnostique**
  → **testé** sous `node --test`. L'AuthEngine reste **inchangé** (restore/signIn/
  signOut/refresh coalescé/expiration proactive).
- **AuthApi réel (`src/auth/enistere-auth-api.ts`)** : `EnistereAuthApi implements
  AuthApi` POSTe `/auth/login` + `/auth/refresh` via **`client.raw`** (typé par le
  contrat) et **mappe** la réponse en `AuthSessionData` (`toAuthSessionData`,
  pur/agnostique — `accessTokenExpiresIn` **secondes** → epoch ms). C'est la
  **valeur par défaut** de `AuthProvider` ; `PlaceholderAuthApi` reste un repli
  sans backend. Les échecs lèvent un `AuthApiError` **générique** (aucun token /
  statut / corps fuité).
- **Erreurs typées** : le core ré-exporte **`ApiClientError`**
  (`kind`/`status`/`errorCode`/`requestId`) ; le `QueryClient` ne retente jamais
  un `401` (`error.isUnauthorized`).
- **Tests** : le **transport** du client (timeout, multipart, son propre
  refresh) est testé **dans le package** (`api-client-fetch` : 29 cas). Le core
  teste (`node --test`, agnostique) le **mapping pur** `toAuthSessionData` **et le
  pont 401** (`with-auth-retry` : 401→refresh→retry, refresh-null→surface+purge,
  retry-toujours-401→pas de boucle, non-401→pas de refresh) — équivalent au test
  RN 1–3. `EnistereAuthApi` + le câblage sont **typecheckés** contre le contrat
  réel (les fichiers important l'ESM ne sont pas compilés pour Node).

## 13. Écarts résumés (à valider en revue)

1. **Layout plat** au lieu de `starter/` (§1) — aligné repo + mission §5.
2. **Core autonome + packages `file:`** au lieu d'**ajout aux workspaces racine**
   (§12) — choix **validé avec l'utilisateur** : ajouter une app Expo SDK 55 au
   lockfile racine partagé (qui pilote le `npm ci` de toute la CI monorepo)
   risquait de casser web/ui-kit/CI (arbre Expo, hoisting React, scoping de
   l'override `expo-font`), pour **zéro bénéfice** sur l'intégration. Le `file:`
   + Metro atteint le **même résultat** sans toucher la racine.
3. **Bridge tokens placeholder** au lieu d'import `@enistere/ui-kit` (§3) —
   autorisé ; core autonome (les **tokens** restent un bridge ; le **client API**
   est désormais le package réel).
4. **Tests** : `node --test` sur le **cœur agnostique** (auth-engine, stores,
   validation, form-errors, offline-queue, network-state, token-mapping,
   **with-auth-retry**, **query-keys, query-errors**) ; composants/hooks RN
   (jest-expo) et logique réseau du client (testée **dans son package**)
   **hors** de ce build.
5. **Modules différés** : Zustand, upload (helpers multipart **présents** dans le
   package, non câblés), notifications, logger, permissions natives. *(Server-state
   = livré en RN 5, §14.)*
6. **Offline préparatoire seulement** : briques (état réseau + queue mémoire)
   **sans** persistance/rejeu/détection/sync (§11) — ADR-029 futur.
7. **`babel-preset-expo` ajouté** : `babel.config.js` le référençait sans le
   déclarer (lacune RN 1–3, jamais exercée car aucun bundle Metro) → ajouté
   (`~55.0.8`) pour rendre le core **réellement *bundle-able*** et vérifier
   l'intégration via `expo export`.

## 14. Couche server-state (RN 5)

RN 5 ajoute une **couche server-state générique** au-dessus de **TanStack Query**
(ADR-012) et du client officiel, **sans endpoint métier ni schéma métier**.

- **Query keys (`src/query/query-keys.ts`, agnostique)** : `createQueryKeys(scope)`
  → fabrique **namespacée, typée, stable** (`all`/`lists`/`list(params?)`/
  `details`/`detail(id)`/`of(...)`). `normalizeParams` rend la clé **stable**
  (clés triées, `undefined` retiré) → mêmes params logiques = **même clé** = cache
  hit. **Aucun secret dans une clé** (ADR-015).
- **Appels authentifiés = `useAuthedQuery` / `useAuthedMutation` (obligatoire)** :
  ces hooks enveloppent le `queryFn`/`mutationFn` du consommateur dans
  **`authedRequest`** (pont 401 RN 4B) → `401 → AuthEngine.refreshSession()
  coalescé → 1 retry → purge`. Le développeur **ne peut pas oublier** le chemin
  d'auth/refresh. Les lectures **publiques** utilisent `useQuery` simple.
- **Retry** : le `QueryClient` **ne retente jamais un `401`** (il surface
  l'`ApiClientError` brut pour cette décision) et borne les autres retries ; les
  **mutations ne retentent pas** par défaut (`retry: false`). Le **refresh sur
  401 reste exclusivement l'AuthEngine** via `authedRequest` — **aucune seconde
  stratégie**.
- **Erreurs UI (`src/query/query-errors.ts`, agnostique)** : `toQueryError(error)`
  normalise `ApiClientError` (lu **structurellement**, sans import ESM) en
  `{ kind, status, errorCode, requestId, isUnauthorized/Forbidden/NotFound,
  message }`. Le `message` est **générique et figé** par kind/status — il **n'écho
  jamais** le message brut, les `details`, un token, un header `Authorization` ni
  une URL signée (ADR-015/016 §28 : la logique UI branche sur `status`/`errorCode`,
  pas sur le message). Normalisé **à l'affichage** (pas dans le `queryFn`) pour que
  la politique de retry continue de voir l'`ApiClientError`.
- **Invalidation / purge (`src/query/invalidation.ts`)** : `invalidateScope` /
  `removeScope` (par clé de scope — une clé partielle matche tout son sous-arbre) ;
  **`purgeServerState(queryClient)`** (= `cancelQueries` + `clear`) à appeler **au
  logout** pour qu'**aucune donnée authentifiée** de l'utilisateur précédent ne
  survive (ADR-015 §18). **Le déclencheur appartient à la couche auth**
  (`src/auth`, hors périmètre RN 5) : l'intégration `signOut → purgeServerState`
  est à câbler dans `AuthProvider` (point d'extension documenté).
- **Pas de persistance de cache** (pas d'offline), **aucun token/URL signée/donnée
  sensible** en cache ou en log.
- **Tests** : `query-keys` (namespacing, stabilité, non-collision) et
  `query-errors` (mapping 401/403/404/session-expired/network/timeout/5xx,
  **non-fuite du message brut**, valeurs non-`ApiClientError`) sous `node --test`.
  Les hooks/invalidation (React/TanStack) sont **typecheckés**, hors build Node.

## 15. État local UI (Zustand) + purge logout déterministe (RN 6)

RN 6 ajoute un **état local UI générique** (séparé du server-state) et **câble le
logout** pour purger le cache TanStack Query de manière déterministe.

- **Zustand — choix gouverné** : `Zustand | Mobile RN | Local state | **Approved**`
  (strategy 06 ; spec §23/§30). Léger, sans provider, pour l'**état local simple**.
  **Strictement séparé** du server-state (ADR-012 ; anti-pattern spec §57 :
  jamais d'état serveur dans Zustand).
- **Store (`src/store/`)** : modèle **pur** `ui-state.ts` (agnostique) + binding
  Zustand `ui-store.ts` (`useUiStore`). État = **uniquement des primitives UI non
  sensibles** : `themePreference` (`'system'|'light'|'dark'`) + `flags`
  (`Record<string, boolean>`). **Sécurité structurelle** : le type n'autorise
  qu'un enum + des booléens → **aucun token, profil, URL signée ou payload serveur**
  ne PEUT y être stocké (ADR-015). **In-memory uniquement** : **pas de persistance**
  (mission ; ADR-015 §16) — l'état est éphémère (reset au redémarrage), `reset()`
  le vide aussi au logout. La logique de transition est **pure** → testée
  (`node --test`) ; le binding Zustand est **typecheck** seulement.
- **Purge logout déterministe** : `purgeServerState(queryClient)` est désormais
  **`async`** — **`await cancelQueries()` PUIS `clear()`** (les fetchs en vol sont
  réglés/annulés AVANT le vidage, donc ne repeuplent pas le cache).
- **Câblage `signOut → purge`** : `AuthProvider` (couche React) ajoute un effet qui
  **purge dès que la session se termine** — `unauthenticated` (logout `signOut`)
  **ou** `expired` (échec de refresh / `clearSession` interne). Un seul mécanisme
  couvre **tous** les chemins de fin de session ; aucune donnée du précédent
  utilisateur ne survit (ADR-015 §18). **AuthEngine reste INCHANGÉ** (la purge vit
  dans `AuthProvider`, pas dans la machine d'état agnostique) ; pas de cycle
  d'import (`AuthProvider → query → api → auth/session-adapter`, feuille).
- **Tests** (`node --test`) : `ui-state` (transitions immutables, `getFlag` défaut,
  `reset`) et `invalidation` (**ordre déterministe** `cancel`→`clear` de
  `purgeServerState` via un `QueryClient` stub ; `invalidateScope`/`removeScope`).
- **Réserve RN 6 — reset du store au logout (clarifié RN 7)** : le store UI **n'est
  PAS** réinitialisé au logout, **par choix**. Il ne contient **aucune donnée
  sensible** (le type n'autorise qu'un enum + des booléens) → **aucun risque de
  fuite** inter-session. `useUiStore.reset()` est **exposé** pour qu'une app vide
  l'état UI éphémère si elle le souhaite ; câbler `signOut → useUiStore.reset()`
  vivrait dans `AuthProvider` (`src/auth`, **hors périmètre RN 7**) → **non câblé
  ici, aucun changement de comportement**.

## 16. Upload sécurisé multipart (RN 7)

RN 7 prépare les **primitives d'upload** au-dessus du client officiel et de la
couche server-state, **sans endpoint métier, sans écran, sans logique applicative**.

- **Descripteur de fichier RN (`src/upload/file.ts`, agnostique)** : `MobileFile`
  = `{ uri, name, type }` — défini ici (pas importé) pour rester **pur/testable** ;
  **structurellement assignable** au `ReactNativeFileDescriptor` du package, donc
  passable tel quel à `apiClient.files.upload`. Helpers purs : `isMobileFile`
  (garde), **`describeFileForLog`** (descripteur **sûr** `{type,extension}` —
  **jamais** l'`uri` ni le nom brut, qui peuvent porter un chemin device ou de la
  PII), `isAllowedFileType` (**pré-check UX** exact / `image/*` / `*/*` ; **le
  backend reste l'autorité** — ADR-007).
- **Mutation d'upload (`src/upload/use-upload.ts`)** : `useUploadMutation` enveloppe
  **`useAuthedMutation`** appelant **`apiClient.files.upload(file, category,
  { subjectId, retryOnAuthRefresh: false })`** → POST `multipart/form-data` vers
  **API Core `POST /files`** (ADR-007 ; endpoint **fondation**, pas métier ; boundary
  posé par la runtime, jamais de `Content-Type` forcé — ADR-016 §26).
- **Refresh sur 401** : `retryOnAuthRefresh: false` → le refresh interne du client
  reste **off** (`enableRefresh:false`) ; **`authedRequest` (AuthEngine) possède
  l'unique retry**, qui **rejoue** l'upload → le `FormData` est **reconstruit depuis
  `file`** (jamais de rejeu d'un flux consommé). Les **mutations ne retentent pas**
  par défaut (le retry 401 est interne à `authedRequest`, pas un retry TanStack).
- **Sécurité (ADR-007/015)** : c'est une **mutation** → **aucune clé de cache**,
  résultat **transient** (jamais en cache durable). **Aucun fichier/URL signée/token/
  header `Authorization`** dans une query key, le cache, les logs ou le store local.
  L'upload renvoie **uniquement les métadonnées publiques** (`PublicStoredFileDto` —
  pas d'URL signée, pas de champ interne). Validation **taille/MIME/permissions =
  backend** (les helpers clients sont **UX** uniquement). Erreurs normalisées par
  **`toQueryError`** (étendu pour **413** « trop volumineux » / **415** « type non
  supporté »).
- **Tests** (`node --test`) : `upload-file` (`isMobileFile`, `describeFileForLog`
  **sans fuite d'`uri`**, `isAllowedFileType`) + `query-errors` 413/415. Le hook
  (React/TanStack/ESM) est **typecheck** seulement, hors build Node.
- **Différés** : écran/picker d'upload, progression, multi-upload, suppression/
  quarantaine/restauration (présents dans le package, **non câblés**).

## 17. Logger / observabilité client (RN 8)

RN 8 ajoute une **couche de logging/observabilité générique** avec **redaction
stricte**, **sans endpoint métier, sans backend d'observabilité, sans transport
réseau ni persistance**. Cohérent avec ADR-040 (schéma, redaction centralisée,
niveaux, corrélation `requestId`) adapté au client mobile et au durcissement
ADR-015 / 07_SECURITY §9.4/§13.

- **Redaction centrale (`src/logger/redaction.ts`, agnostique)** : l'**unique**
  endroit qui décide ce qui est sensible (ADR-040 §17 : « liste centralisée,
  jamais dispersée par module »). `redactValue(value)` masque récursivement
  (gardes **profondeur** + **cycle**, jamais de mutation) les **clés sensibles**
  (`isSensitiveKey`, comparées normalisées → `access_token`/`Access-Token`/
  `accessToken` matchent, `author`/`monkey` non) : `authorization`, `cookie`,
  `set-cookie`, `password`, `otp`, `token`/`accessToken`/`refreshToken`/`jwt`,
  `secret`/`clientSecret`/`apiKey`/`accessKey`/`secretKey`, `signedUrl`/
  `signature`/`credential`, `email`/`phone`, données bancaires. `redactString(s)`
  masque dans le **texte libre** : **chemins device** (`file://`/`content://`/
  `ph://` → schéma conservé, chemin masqué), **`Bearer`/`Basic`**, **JWT** (3
  segments base64url), **params d'URL signée** (`X-Amz-Signature`/`Credential`,
  `token`, `sig`, `key`… → valeur masquée, nom conservé), **emails**. `Error` →
  `{ name, message }` **redacté**, **sans `stack`** (peut contenir un chemin
  device). Marqueur `[Redacted]` (jamais d'omission silencieuse).
- **Logger (`src/logger/logger.ts`, agnostique)** : `createLogger(options)` →
  façade `debug`/`info`/`warn`/`error`. **Toute** sortie (message **et** champs)
  passe par la redaction **avant** d'atteindre le sink → un token ne peut pas
  fuir, **même via un sink custom**. **Filtrage par niveau** (`isLevelEnabled` ;
  défaut `info`, `debug` en dev). **Sink pluggable** (`LogSink`) — défaut
  `consoleSink` (`console` = sink **plateforme**, **pas** un transport réseau).
  **Horloge injectée** (jamais `Date.now()` dans le chemin testé). **Corrélation**
  : `child(context, fields?)` (contexte imbriqué + champs de base) et
  `withRequestId(id)` (stampe le `requestId`, ADR-040 §14). **Aucun log
  automatique de body request/response** (ADR-040 §18) — l'appelant choisit les
  champs sûrs.
- **Pont erreurs (`src/logger/error-fields.ts`, agnostique)** : `safeErrorFields(
  queryError)` projette une `QueryError` (RN 5, **import type-only**) vers des
  champs sûrs `{ kind, status, errorCode, requestId }` — **garde la corrélation**,
  **drop le message et tout payload**.
- **`describeFileForLog` corrigé (RN 7 → RN 8, `src/upload/file.ts`)** : ne
  renvoie **plus le nom brut** du fichier (un nom peut porter de la PII, ex.
  `john_passport.jpg`, ADR-040 §18/§22). `SafeFileDescriptor` = `{ type,
  extension }` — MIME + **extension assainie** (`[a-z0-9]{1,12}` minuscule, sinon
  `null`) ; **jamais** l'`uri` ni le `name`. *(Seule modification autorisée de
  `src/upload/file.ts` ; le test `upload-file` est adapté.)*
- **Non fourni (mission / ADR-040 §24)** : **aucune** persistance de logs,
  **aucun** transport réseau, **aucun** service externe (Sentry/Datadog/Loki),
  **aucun** log de payload automatique. La collecte/observabilité relève d'un
  ADR/Cloud Core futur (ADR-018/036). Le `console.warn` de `src/storage` n'est
  **pas** recâblé (hors périmètre RN 8) → aucun changement de comportement.
- **Tests** (`node --test`) : `logger-redaction` (clés sensibles, variantes de
  casse, cycles, `Error` sans stack, Bearer/Basic/JWT/device-uri/URL signée/email,
  profondeur) + `logger` (niveaux, horloge injectée, redaction au niveau du
  logger, `child`/`withRequestId`, `safeErrorFields`). Tout le module est
  **pur/agnostique** → entièrement testé sous Node (rien en typecheck-only).

## 18. Permissions natives génériques gouvernées (RN 9)

RN 9 ajoute une **abstraction générique, testable et gouvernée** des permissions
runtime mobiles, **sans logique métier, sans écran/picker, sans notification push
réelle, sans upload réel**. Elle **prépare** picker/upload/notifications mais ne
les livre pas.

- **Modèle pur (`src/permissions/status.ts`, agnostique)** : `PermissionKind`
  (`camera` · `mediaLibrary` · `notifications` · `locationForeground`) +
  **`PermissionStatus` normalisé** (`unknown`/`granted`/`denied`/`blocked`/
  `limited`/`unavailable`). **`normalizePermissionStatus(value)`** replie les
  formes hétérogènes (chaîne `granted`/`undetermined`/`never_ask_again`/
  `restricted`…, booléen, objet Expo `{status, granted, canAskAgain}` →
  `canAskAgain:false` ⇒ `blocked`) en **un seul** enum ; **conservateur** :
  toute valeur inconnue → `unknown` (**jamais** `granted`). Helpers **purs** :
  `canRequestPermission` (unknown/denied), `isPermissionGranted` (strict),
  `isPermissionUsable` (granted/limited), `shouldOpenSettings` (blocked),
  `isPermissionStatus`.
- **Adaptateur (`src/permissions/adapter.ts`, agnostique)** : `PermissionAdapter`
  = **seam** vers une implémentation plateforme (`expo-camera`/`expo-media-library`/
  `expo-notifications`/`expo-location`…) — `getStatus(kind)`, `request(kind)`,
  `openSettings?()`. La fondation livre **le contrat** + un placeholder ; un
  projet dérivé branche l'adaptateur réel (qui **devrait** normaliser via
  `normalizePermissionStatus`).
- **Service framework-agnostique (`src/permissions/engine.ts`)** :
  `createPermissionService({ adapter, logger? })` → `getStatus` (live, **jamais
  caché**), `request` (prompt), **`ensure`** (get → prompt **uniquement** si
  `canRequestPermission` et pas déjà `granted`), `openSettings`. **Statut jamais
  persisté** (pas de SecureStore/Zustand/TanStack Query — mission/ADR-015).
  **Logs via le logger RN 8** (injecté, optionnel) avec **champs sûrs uniquement**
  (`{ kind, status }`, des enums) — **jamais** de payload adaptateur brut, et la
  redaction RN 8 n'est **pas** contournée. Sur échec adaptateur : **warn `{ kind }`
  + `throw` d'un `PermissionAdapterError` contrôlé** (porte seulement `kind`/
  `operation`, **aucune cause sensible**) ; on ne **swallow jamais** vers un faux
  `granted`.
- **Adaptateur placeholder (`src/permissions/placeholder-adapter.ts`, agnostique)** :
  `createPlaceholderPermissionAdapter({ initial?, onRequest? })` — **simulation
  mémoire, AUCUNE dépendance native ajoutée** (objectif mission 5). `request`
  transitionne via `onRequest` (défaut : accorde sauf `blocked`/`unavailable`) ;
  `openSettings` = no-op documenté. La map mémoire est une **simulation**, jamais
  un stockage de permission.
- **Hook React (`src/permissions/use-permission.ts`, typecheck-only)** :
  `usePermission(kind, adapter, options?)` → `{ status, loading, error }` +
  `request`/`refresh`/`openSettings`. **Aucune UI.** Statut lu **live**, gardé en
  state composant (jamais persisté) ; garde de démontage. React/ESM → hors build
  Node (la logique qu'il pilote EST testée).
- **Sécurité / gouvernance** : une permission device est une **capacité locale**,
  **pas** une barrière de sécurité — l'**API Core reste l'autorité** (07_SECURITY
  §6). Aucun stockage de permission ; aucun log de donnée sensible ; redaction
  RN 8 préservée.
- **Tests** (`node --test`) : `permission-status` (normalisation chaînes/objets/
  booléens, idempotence, conservatisme, helpers) + `permission-engine` (lecture,
  request **accordé/refusé**, `ensure` sans re-prompt, `blocked`/`unavailable`
  sans prompt, **erreur adaptateur → `PermissionAdapterError` sans cause brute**,
  `openSettings` supporté/non, **aucune donnée sensible loggée** — seuls
  `{ kind, status }`). Le hook (React) est **typecheck** seulement.
- **Différés** : adaptateurs Expo réels (caméra/médias/notifications/localisation),
  picker/upload (RN 7 = primitives), **notifications push réelles**, demande de
  permission au bon moment dans un écran.

## 19. Notifications locales — primitives génériques (RN 10)

RN 10 ajoute une **couche générique de primitives de notifications locales**
au-dessus du modèle permissions RN 9, **sans push réel, sans Expo Notifications
réel, sans backend, sans token device, sans logique métier, sans UI**.

- **Message sûr (`src/notifications/message.ts`, agnostique)** : `NotificationMessage`
  `{ title, body, data? }` **borné** (`MAX_TITLE_LENGTH`/`MAX_BODY_LENGTH`/
  `MAX_DATA_KEYS`/`MAX_DATA_VALUE_LENGTH`). `sanitizeNotificationMessage` **trim +
  cap** title/body et ne garde dans `data` que des **primitives** (string/number/
  boolean, bornées ; objets/arrays/fonctions **droppés**) — **point de contrôle
  unique**. **Sécurité (07_SECURITY §13 / ADR-040)** : title/body/data sont du
  **contenu** (PII possible) → **jamais loggés** ; `describeNotificationForLog`
  renvoie **uniquement** des **métadonnées** (`{titleLength, bodyLength,
  dataKeyCount}`), **aucun contenu**. **Aucun push/device token** n'a sa place
  dans un message (mission).
- **Modèle (`src/notifications/types.ts`, agnostique)** : `NotificationDeliveryState`
  (`scheduled`/`delivered`/`cancelled`/`failed`/`unknown`) + gardes
  (`isNotificationDeliveryState`, `isTerminalDeliveryState`) ; **trigger borné**
  `NotificationTrigger` (`immediate`/`delay{seconds≥0}`/`date{timestamp}`) +
  `normalizeTrigger` (invalide → `immediate`, delay clampé) ; `LocalNotificationRequest`,
  `ScheduledNotification`. **`NotificationAdapter`** = **seam** plateforme
  (`getPermissionStatus`/`requestPermission`/`scheduleLocal`/`cancel`/`cancelAll`/
  `getDelivered?`).
- **Service (`src/notifications/engine.ts`, agnostique)** : `createNotificationService(
  {adapter, permissionService?, logger?})`. **Réutilise RN 9** : pilote un
  `PermissionService` pour le kind `notifications` (injecté, ou **construit depuis
  l'adapter** via un `PermissionAdapter` qui mappe `getPermissionStatus`/
  `requestPermission`). **`schedule(request)`** : `ensure('notifications')` →
  **si `!isPermissionUsable(status)` → `{state:'blocked', reason:'permission',
  status}` SANS toucher l'adapter** (on ne planifie **jamais** sans permission
  utilisable, mission) ; sinon **message assaini** + **trigger normalisé** →
  `adapter.scheduleLocal` → `{state:'scheduled', id}`. `cancel`/`cancelAll`/
  `getDelivered` (no-op `[]` si non supporté). **Logs via le logger RN 8** avec
  **champs sûrs uniquement** (`{id}`/`{status}`/`{state}`/`{count}` — **jamais**
  le contenu) ; échec adapter → **warn + `NotificationError`** contrôlé (seulement
  `operation`, **aucune cause sensible**).
- **Placeholder (`src/notifications/placeholder-adapter.ts`, agnostique)** :
  `createPlaceholderNotificationAdapter({permission?, onRequest?, idPrefix?})` —
  **simulation mémoire, AUCUNE dépendance native** ; ids = **compteur
  déterministe** (`local-1`/`local-2`… → pas de `Date.now()`/`Math.random()`,
  tests reproductibles) ; in-memory, jamais persisté.
- **Sécurité / gouvernance (ADR-015/040)** : **aucun stockage** (ni SecureStore/
  Zustand/Query) ; **aucun token device/push/FCM/APNs** ; **aucun contenu** de
  notification dans les logs ; permission notifications **gouvernée par RN 9**
  (API Core reste l'autorité applicative).
- **Tests** (`node --test`) : `notification-message` (bornage title/body/data,
  garde, `describeNotificationForLog` **sans contenu**, `normalizeTrigger`) +
  `notification-engine` (**permission refusée → pas de schedule**, granted/limited/
  unknown→request → schedule, `cancel`/`cancelAll`, **erreur adapter →
  `NotificationError` sans cause brute**, `getDelivered` no-op, **aucune donnée
  sensible loggée**). Module **entièrement agnostique** (aucun hook → rien en
  typecheck-only).
- **Différés** : adaptateur Expo réel (`expo-notifications`), **push distant
  (Expo Push/FCM/APNs) + token device**, handler de réponse/tap (routing),
  catégories/actions, badges, écran/réglages de notifications.

## 20. i18n / localisation — primitives génériques (RN 11)

RN 11 ajoute des **primitives i18n/localisation génériques**, testables et **sans
contenu métier, sans dépendance native, sans appel réseau, sans persistance de
locale, sans UI**. Les **projets dérivés apportent leurs catalogues métier**.

- **Modèle de locale (`src/i18n/locale.ts`, agnostique)** : `LocaleCode` (BCP-47),
  `LocaleDirection` (`ltr`/`rtl`), `DEFAULT_LOCALE` (`en`). **`normalizeLocale`**
  canonicalise casse/séparateurs (`_`→`-`) via **`Intl.getCanonicalLocales`**
  (built-in, **aucune dépendance**) → `EN_us`→`en-US`, `zh_hant_tw`→`zh-Hant-TW` ;
  invalide → **fallback** (jamais de throw). `getLanguageSubtag`, **`getLocaleDirection`**
  (RTL : ar/he/fa/ur…), **`resolveLocale`** (exact → langue seule → fallback →
  premier dispo).
- **Catalogue typé (`src/i18n/catalog.ts`, agnostique)** : `MessageCatalog` =
  map plate `clé→template`. **`interpolate`** remplace `{name}` (placeholder
  inconnu **laissé tel quel**, prévisible ; pas de ReDoS). **`createTranslator`**
  → `t`/`has`/`plural` : **clé absente → fallback catalogue → `onMissing` → la clé
  elle-même** (**jamais de throw**). **`plural`** sélectionne `${clé}.${catégorie}`
  via **`Intl.PluralRules`** (CLDR : `one`/`other`/… ; `{count}` injecté), repli
  `.other` puis la clé.
- **Formatters `Intl` (`src/i18n/format.ts`, agnostique)** : **`formatNumber`**/
  **`formatDate`**/**`formatCurrency`** — wrappers fins sur `Intl.NumberFormat`/
  `Intl.DateTimeFormat`, **ne lèvent jamais** (locale/options/devise invalides →
  repli sûr). **Pas de devise métier par défaut** : `formatCurrency(value,
  currency, locale?, options?)` exige le code ISO-4217. Valeurs passées en
  argument (pas de `Date.now()`).
- **Adaptateur (`src/i18n/adapter.ts`)** : `LocaleAdapter` = seam vers la source
  de locale device/app (`expo-localization`…) — `getLocale()` (sync), `subscribe?`.
- **Placeholder (`src/i18n/placeholder-adapter.ts`, agnostique)** :
  `createPlaceholderLocaleAdapter(initial?)` — **mémoire, AUCUNE dépendance
  native, aucune persistance** ; `setLocale` normalise + notifie ; `subscribe`.
- **Service (`src/i18n/engine.ts`, agnostique)** : `createLocalization({adapter,
  catalogs, fallbackLocale?})` — **résout** la locale active (adapter → meilleure
  dispo → fallback ; clés de catalogues **normalisées**), borne un `Translator` et
  **pré-lie** les formatters à la locale. Expose `locale`/`direction`/`t`/`plural`/
  `formatDate`/`formatNumber`/`formatCurrency`. Snapshot à la création (un hôte
  re-crée le service sur `subscribe`).
- **Sécurité / gouvernance** : aucune donnée sensible (locales/templates ne sont
  pas des secrets) ; **aucune dépendance** (tout via `Intl` built-in) ; aucun
  réseau ; aucune persistance ; **catalogues métier = projets dérivés**.
- **Tests** (`node --test`) : `i18n-locale` (normalisation/fallback/direction/
  résolution) + `i18n-catalog` (interpolation, `t` clé inconnue **sans throw**,
  fallback, **pluralisation** en/fr) + `i18n-format` (number/currency/date
  déterministes UTC, **no-throw** locale/devise invalides) + `i18n-engine`
  (résolution, fallback, match langue, formatters liés, `subscribe`). Module
  **entièrement agnostique** (aucun hook → rien en typecheck-only).
- **Différés** : adaptateur `expo-localization` réel, **persistance du choix de
  locale**, hook React + provider, RTL appliqué à l'UI, `Intl.RelativeTimeFormat`/
  `ListFormat`, chargement paresseux des catalogues, extraction/outillage de
  traduction.

## 21. Deep-linking / routing — primitives génériques (RN 12)

RN 12 ajoute une **couche pure de résolution de liens/deep-links vers routes
internes validées**, **sans dépendance native, sans logique métier, sans UI,
sans schéma métier**. Elle prépare le **tap de notification (RN 10)** et les liens
entrants futurs. **Les projets dérivés définissent leurs routes concrètes** en
mappant `route.path`/`route.params`.

- **Parseur pur (`src/linking/url.ts`, agnostique)** : `parseDeepLink(input)` →
  `{scheme, host, path, query, fragment}` — gère **custom schemes**
  (`myapp://home/details?id=1`) **et** `https` universal links, **sans** utiliser
  le `URL` global (comportement variable RN/Hermes/Node) → **déterministe**.
  `decodeSafe` (`decodeURIComponent` **sans throw**), `normalizeUrl` (trim +
  scheme/host en minuscule). **Ne parse que** — ne suit jamais, ne logge jamais,
  ne stocke jamais d'URL.
- **Modèle (`src/linking/resolve.ts`, agnostique)** : `AllowedScheme`,
  `LinkRoute` `{path, params}`, **`LinkResolution`** discriminé = **`internal`**
  (route sûre) · **`externalBlocked`** (`external_scheme`/`external_host`/
  `insecure_scheme`/`open_redirect`) · **`invalid`** (`empty`/`unparseable`/
  `unsafe_path`). `LinkingConfig` : **allowlist** `schemes` (custom + `https`) +
  `hosts` (universal links), `sensitiveParams`, bornes (`maxParams`/
  `maxParamValueLength`/`maxPathLength`).
- **Résolution (`resolveLink(input, config)`, jamais de throw)** — **sécurité
  (07_SECURITY §7/§8)** :
  - **Allowlist stricte** : custom scheme inconnu → `external_scheme` ; `https`
    host hors liste → `external_host` ; **`http` → `insecure_scheme`** ; tout
    autre → `external_scheme`.
  - **Anti open-redirect** : une route qui encode encore `//authority` ou un
    `scheme://` absolu → **`open_redirect`** ; **traversal** `..`/`.` →
    `unsafe_path`.
  - **Params sensibles supprimés** (`token`/`access_token`/`secret`/`code`/
    `signature`/`key`/`jwt`/`otp`/… + `config.sensitiveParams`) — **jamais
    conservés** dans la route ; **aucune URL complète/sensible gardée**.
  - **Bornes** : nombre de params, longueur des valeurs, longueur du path.
  - `isInternalRoute(input, config)` = `resolveLink(...).kind === 'internal'`.
- **Intégration notification (`resolveNotificationLink(data, config, options?)`)** :
  lit une **clé configurable** (défaut `link`) dans le `data` d'une notification
  (RN 10) — **aucune supposition de contenu métier** ; valeur absente/non-string
  → `invalid`.
- **Sécurité / gouvernance** : **aucun log** (donc aucun log de query sensible) ;
  **aucun stockage** de lien/token/URL ; **aucune dépendance** (parseur maison) ;
  l'application des routes (navigation réelle) appartient au projet dérivé.
- **Tests** (`node --test`) : `linking-url` (decodeSafe **sans throw**,
  parseDeepLink custom/https/relatif/invalide, normalizeUrl) + `linking-resolve`
  (custom scheme valide, universal link valide, **host externe bloqué**, **http
  bloqué**, **open-redirect** `//`/`scheme://`/`..` bloqué/rejeté, **params
  sensibles retirés**, **bornes** count/longueur, **input invalide sans throw**,
  `resolveNotificationLink` clé configurable). Module **entièrement agnostique**
  (aucun hook → rien en typecheck-only).
- **Différés** : adaptateur `expo-linking` réel (récupération de l'URL entrante/
  initiale), **câblage navigation** (Expo Router) des routes résolues, schémas/
  routes **concrets** (projets dérivés), liens authentifiés/différés post-login,
  app links Android / universal links iOS (config natale).

## 22. Analytics / télémétrie — primitives génériques (RN 13)

RN 13 ajoute une **couche générique d'analytics/télémétrie** au-dessus du
logger/redaction RN 8, **sans SDK réel** (Sentry/Amplitude/GA/Segment/Firebase/
OTel), **sans réseau, sans persistance, sans identité utilisateur réelle, sans
logique métier, sans UI**. Elle laisse les projets dérivés tracer des événements
typés **sans fuite de PII/token/URL sensible** ; le branchement d'un SDK réel
relève d'un **ADR/validation** côté projet dérivé.

- **Modèle + redaction (`src/analytics/event.ts`, agnostique)** : `AnalyticsEvent`
  `{name, properties?, timestamp?}` ; `AnalyticsEventProperties` **bornées aux
  primitives** (string/number/boolean). **Redaction dédiée mais BASÉE sur RN 8**
  (mission ; **pas de contournement**) : `isSensitiveProperty` **réutilise
  `isSensitiveKey` (RN 8)** + une couche normalisée exact/substring (même
  durcissement que le filtre de liens RN 12) ; **`sanitizeAnalyticsEvent`**
  (jamais de throw) **supprime les clés sensibles** (token/secret/signature/
  credential/password/authorization/apiKey/auth/jwt/otp/key/code/sig/email/
  phone/…), **scrube les valeurs string via `redactString` (RN 8)** (Bearer/JWT/
  device-uri/URL signée/email) et **borne** count/longueur ; ne garde que les
  primitives. `describeAnalyticsEventForLog` → **`{eventName, propertyCount}`**
  (jamais de valeur).
- **Adaptateur (`src/analytics/adapter.ts`, agnostique)** : `AnalyticsAdapter` =
  seam plateforme — `track(event)` (reçoit un événement **déjà assaini**),
  `flush?()`. **PAS de `identify`** *par design* (pas d'**identifiant utilisateur
  réel** dans la fondation, mission ; un projet dérivé l'ajoute sous sa propre
  revue privacy).
- **Service (`src/analytics/engine.ts`, agnostique)** : `createAnalyticsService(
  {adapter, logger?})` → `track(name, properties?)` **assaini avant** l'adapter ;
  **best-effort / non-intrusif** : un adapter qui échoue **ne casse jamais** le
  flux app — l'erreur est **capturée** et un `warn` **sûr** est loggé (**aucune
  cause sensible**). **Logs RN 8 sûrs** : `track` logge **uniquement**
  `{eventName, propertyCount}` (debug) ou `{eventName}` (warn) — **jamais les
  valeurs**, redaction RN 8 **non contournée**. `flush()` best-effort (no-op si
  non supporté). **Aucun `Date.now()`** (timestamp = caller/SDK).
- **Placeholder (`src/analytics/placeholder-adapter.ts`, agnostique)** :
  `createPlaceholderAnalyticsAdapter` — **buffer mémoire POUR TESTS**, `getEvents`/
  `clear` ; **AUCUN SDK, réseau ni persistance**.
- **Sécurité / gouvernance (ADR-015/040)** : **aucun SDK/réseau/persistance** ;
  **aucun identifiant utilisateur réel** ; **aucun token/device token/cookie/
  `Authorization`/URL signée/URI device** ne survit (clés droppées + valeurs
  scrubbées) ; **aucun contournement** de la redaction RN 8.
- **Tests** (`node --test`) : `analytics-event` (`isSensitiveProperty`, bornage
  count/longueur, **clés sensibles supprimées**, **valeurs scrubbées (RN 8)**,
  **valeur longue tronquée**, **sans throw** sur input invalide,
  `describeAnalyticsEventForLog` sans valeur) + `analytics-engine` (track →
  événement assaini dans l'adapter, **l'adapter ne reçoit jamais de valeur
  sensible**, **erreur adapter contrôlée — track ne throw pas**, **logger ne reçoit
  que `{eventName, propertyCount}`**, `flush` délégué/no-op/échec contrôlé, **sans
  throw**). Module **entièrement agnostique** (aucun hook → rien en typecheck-only).
- **Différés** : adaptateur SDK réel (Sentry/Amplitude/GA/Segment/Firebase) **sous
  ADR/validation**, transport réseau + batching, **consentement utilisateur**
  (opt-in/opt-out), `identify`/user-id (sous revue privacy), crash reporting,
  session/écran auto, sampling.

## 23. Accessibilité (a11y) — primitives génériques (RN 14)

RN 14 ajoute une **couche d'accessibilité générique** (ADR-010 §16, spec §45),
**pure et testable**, **sans dépendance native** (`AccessibilityInfo` réel),
**sans écran/composant UI, sans provider global obligatoire, sans stockage**.
Les **projets dérivés** appliquent les props à leurs composants et branchent un
adaptateur réel.

- **État a11y (`src/a11y/state.ts`, agnostique)** : `A11yRole` (sous-ensemble RN
  curé) ; **`A11yState`** normalisé = **quartet ADR-010 §16** (`disabled`/
  `focused`/`pressed`/`invalid`) **+** sous-ensemble RN `accessibilityState`
  (`selected`/`checked` tri-état/`busy`/`expanded`). Helpers : `isInteractiveRole`,
  **`mergeA11yState`** (override défini gagne, `undefined` ignoré), **`describeA11yStateForLog`**
  (booléens/enum **uniquement** — pas de contenu). L'état ne porte **aucune
  donnée utilisateur** → sûr en log.
- **Props (`src/a11y/props.ts`, agnostique)** : constructeurs **purs** de props
  **RN-compatibles** (`accessible`/`accessibilityRole`/`accessibilityLabel`/
  `accessibilityHint`/`accessibilityState`). `normalizeA11yText` (trim + collapse
  espaces + **borne**, vide → `undefined`) ; **`buildAccessibilityState`** mappe
  l'`A11yState` vers le **sous-ensemble RN natif** (drop `focused`/`pressed`/
  `invalid` — pas de champ RN natif ; le consommateur les utilise pour style/hint)
  ; **`buildA11yProps`** compose l'objet complet borné. **Ne rend rien, n'importe
  pas React/RN, ne logge pas** (les labels sont du contenu utilisateur).
- **Annonce (`src/a11y/announcement.ts`, agnostique)** : `A11yAnnouncement`
  `{message, assertive}` **borné** (`MAX_ANNOUNCEMENT_LENGTH`). `sanitizeAnnouncement`
  (trim/collapse/borne ; `assertive` seulement si `=== true` ; jamais de throw).
  Le **message** est du contenu à **prononcer** (non redacté, il doit atteindre
  l'adapter) mais **jamais loggé** : **`describeAnnouncementForLog`** → `{length,
  assertive}` **sans le texte** (07_SECURITY / ADR-010 §16).
- **Adaptateur (`src/a11y/adapter.ts`, agnostique)** : `A11yAdapter` = seam RN
  (`announce`, `focus?`, `isScreenReaderEnabled?`) — `A11yFocusTarget` = cible
  **logique** `{id}` (l'adapter réel mappe vers un node handle). **`A11yAdapterError`**
  contrôlé (porte seulement `operation`, **aucune cause sensible**).
- **Placeholder (`src/a11y/placeholder-adapter.ts`, agnostique)** :
  `createPlaceholderA11yAdapter({screenReaderEnabled?})` — **mémoire**
  (`getAnnouncements`/`getFocusTargets`/`clear`), **aucune dépendance native**.
- **Service (`src/a11y/engine.ts`, agnostique)** : `createA11yService({adapter,
  logger?})` → `announce`/`focus`/`isScreenReaderEnabled`. **Best-effort / non
  intrusif** : un helper a11y **ne casse jamais** le flux app — adapter en échec
  **capturé** + `warn` **sûr** (`{operation}`, aucune cause sensible) ;
  `isScreenReaderEnabled` **défaut `false`** en cas d'erreur. **Logs RN 8 sûrs**
  : `announce` logge **uniquement** `{length, assertive}` (debug) — **jamais le
  texte brut** ; redaction RN 8 non contournée.
- **Sécurité / gouvernance (07_SECURITY / ADR-010 §16)** : **aucun contenu/label/
  message utilisateur en log** ; **aucun stockage** de données a11y ; **aucune
  dépendance** ; **aucun provider global obligatoire** ; messages a11y **sans info
  sensible** (responsabilité du consommateur, scrub non imposé sur le message
  prononcé). Aligné avec les **erreurs accessibles des forms (RN 3)** et le **UI
  Kit** (ADR-008/010).
- **Tests** (`node --test`) : `a11y-props-state` (normalisation texte, rôle
  interactif, **merge d'états**, `buildAccessibilityState` sous-ensemble RN,
  `buildA11yProps`, `describeA11yStateForLog` sans contenu) + `a11y-announcement`
  (sanitize borné, **`describeAnnouncementForLog` sans texte brut**) + `a11y-engine`
  (announce/focus/isScreenReaderEnabled, **erreurs adapter contrôlées — pas de
  throw**, **logger ne reçoit jamais le texte brut**, `A11yAdapterError`). Module
  **entièrement agnostique** (aucun hook/provider → rien en typecheck-only).
- **Différés** : adaptateur `AccessibilityInfo` réel (RN) + hook/`useA11y`
  optionnel, application des props dans des composants concrets (projets dérivés
  / UI Kit), gestion fine de l'ordre de focus liée au rendu, audit a11y
  automatisé, contraste/tailles tactiles (relèvent des **tokens UI Kit**, ADR-008).

## 24. App lifecycle / état d'application — primitives génériques (RN 15)

RN 15 ajoute une **couche générique de cycle de vie applicatif**, **pure et
testable**, **sans dépendance native** (RN `AppState` réel), **sans écran, sans
hook obligatoire, sans provider global, sans stockage, sans logique métier**.
Elle prépare le **flush analytics (RN 13)**, le **refresh de session au retour
au premier plan** et la **planification de notifications (RN 10)** — sans les
implémenter.

- **État (`src/app-lifecycle/state.ts`, agnostique)** : **`AppLifecycleState`** =
  `active`/`background`/`inactive`/`unknown`. `normalizeAppLifecycleState`
  replie les valeurs RN `AppStateStatus` (incl. `extension` → `background`),
  **tolère tout input invalide** → `unknown` (jamais de throw). Helpers purs :
  `isForeground`/`isBackground` ; **`isValidTransition`** (matrice : même état =
  no-op ; `unknown` → n'importe ; **un état déterminé ne revient jamais à
  `unknown`** ; états réels interchangeables) ; **`nextAppLifecycleState(current,
  candidate)`** (applique si valide, sinon conserve ; both inputs tolérés).
- **Adaptateur (`src/app-lifecycle/adapter.ts`, agnostique)** : `AppLifecycleAdapter`
  = seam RN `AppState` (`getState()`, `subscribe(listener)→unsubscribe`).
  **`AppLifecycleAdapterError`** contrôlé (seulement `operation`, aucune cause
  sensible).
- **Placeholder (`src/app-lifecycle/placeholder-adapter.ts`, agnostique)** :
  `createPlaceholderAppLifecycleAdapter(initial?)` — **mémoire** ; `setState`
  simule un changement OS (normalise + notifie au changement) ; **aucune
  dépendance native / persistance**.
- **Service (`src/app-lifecycle/engine.ts`, agnostique)** :
  `createAppLifecycleService({adapter, logger?})` → **`getState`** (état validé
  courant), **`subscribe`** (changements validés ; unsubscribe), **`transition`**
  (pousse un candidat via la validation), **`dispose`** (désabonne l'adapter +
  vide les listeners). **Best-effort / non-intrusif** : `getState`/`subscribe`
  adapter en échec → **capturé** + `warn` sûr (`{operation}`), état défaut
  `unknown` ; un **listener qui throw est isolé** (les autres reçoivent quand
  même). **Logs RN 8 sûrs** : le cycle de vie **ne porte aucune donnée
  utilisateur** → logge **uniquement** des enums (`{from, to}` au changement,
  `{operation}` en erreur).
- **Sécurité / gouvernance** : **aucune donnée utilisateur/sensible** (que des
  enums) ; **aucun stockage** ; **aucune dépendance** ; **aucun provider global
  obligatoire** ; transitions **validées** (machine déterministe).
- **Tests** (`node --test`) : `app-lifecycle-state` (normalisation incl.
  `extension`/garbage, `isValidTransition` matrice, `nextAppLifecycleState`
  valide/ignoré/toléré) + `app-lifecycle-engine` (état initial, **changements
  adapter → service + subscribers**, transition validée, **subscribe/unsubscribe
  déterministe**, no-op même état, **listener isolé**, **erreurs adapter
  contrôlées sans throw**, `dispose`, **logs enums seulement**). Module
  **entièrement agnostique** (aucun hook/provider → rien en typecheck-only).
- **Différés** : adaptateur RN `AppState` réel + hook/`useAppLifecycle` optionnel,
  **câblage** des effets concrets (flush analytics / refresh session au
  foreground / planification notifications), gestion de l'état au démarrage à
  froid / deep-link, débounce des transitions rapides.
