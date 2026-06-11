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

## 9. Écarts résumés (à valider en revue)

1. **Layout plat** au lieu de `starter/` (§1) — aligné repo + mission §5.
2. **API client** : transport seam local au lieu de `@enistere/api-client-fetch`
   (§4) — périmètre mission + ADR-016 §7.
3. **Bridge tokens placeholder** au lieu d'import `@enistere/ui-kit` (§3) —
   autorisé par la mission ; core autonome.
4. **Modules différés** : Zustand, RHF/Zod, upload, notifications, logger,
   permissions (hors périmètre mission).
