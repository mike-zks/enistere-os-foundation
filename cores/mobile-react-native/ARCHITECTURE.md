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
  (garde), **`describeFileForLog`** (descripteur **sûr** `{name,type}` — **jamais**
  l'`uri`, qui peut être un chemin device), `isAllowedFileType` (**pré-check UX**
  exact / `image/*` / `*/*` ; **le backend reste l'autorité** — ADR-007).
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
