# Mobile Core React Native — Starter Foundation

> Statut : **`STARTER_FOUNDATION_INITIEE`** (V1, socle minimal)
> Spécification cible : [`CORE_SPECIFICATION.md`](./CORE_SPECIFICATION.md)
> Architecture & décisions : [`ARCHITECTURE.md`](./ARCHITECTURE.md)

Socle mobile **Expo / React Native** générique et réutilisable pour les futures
applications Enistere/Kivvoo/RFashion/Bailo/etc. Ce starter pose une fondation
standardisée et gouvernée. **Il ne contient aucune logique métier.**

## Ce que ce socle fournit (périmètre de la mission)

| Brique | Module | Notes |
|---|---|---|
| Navigation | `app/` (Expo Router) + `src/navigation` | stacks **publique** `(public)` et **authentifiée** `(app)`, gate de redirection, écran *not-found* |
| Shell d'auth | `src/auth` | états `loading`/`authenticated`/`unauthenticated`, `signIn`/`signOut`/`restoreSession` **placeholder, sans backend** |
| Secure storage | `src/storage` | abstraction `SecureStorage` (interface) + impl `ExpoSecureStorage` (SecureStore) ; **refresh token only** |
| API client | `src/api` | transport `fetch` générique (base URL, injection token, erreurs typées, timeout) ; **aucun endpoint métier** |
| Server state | `src/query` | `QueryClient` + `QueryProvider` (TanStack Query) |
| Thème / tokens | `src/theme` | `ThemeProvider` + bridge tokens placeholder (light/dark) |
| UI primitives | `src/ui` | `Screen`, `Text`, `Button` (token-driven, a11y) |
| États standards | `src/states` | `LoadingState`, `ErrorState`, `EmptyState`, `OfflineState`, `UnauthorizedState` |

## Stack

- **Expo SDK 55** (New Architecture par défaut), **Expo Router** (routing fichier).
- **React 19.2 / React Native 0.83**.
- **TanStack Query 5** pour l'état serveur.
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
│   ├── api/                  # transport fetch générique (client, errors, types, config)
│   ├── auth/                 # shell auth (session, provider, hook)
│   ├── config/               # env (EXPO_PUBLIC_*) — aucun secret
│   ├── navigation/           # constantes de routes + redirection auth
│   ├── query/                # QueryClient + provider
│   ├── states/               # états UI standards
│   ├── storage/              # secure storage (interface + impl) + token store
│   ├── theme/                # ThemeProvider + tokens (bridge UI Kit)
│   ├── types/                # types génériques partagés
│   └── ui/                   # primitives UI maison
├── app.json · tsconfig.json · babel.config.js · eslint.config.js · .env.example
└── CORE_SPECIFICATION.md · README.md · ARCHITECTURE.md
```

> Layout **plat** (projet à la racine du core), cohérent avec `web-nextjs` et
> `api-nestjs`. C'est un écart **assumé** vis-à-vis du `starter/` du
> `CORE_SPECIFICATION.md` §8 — voir [`ARCHITECTURE.md`](./ARCHITECTURE.md).

## Gouvernance (ADR appliqués)

| ADR | Application dans ce socle |
|---|---|
| **ADR-004** Auth/session | access token court + refresh token ; logout invalide la session |
| **ADR-008** Design tokens | tokens UI Kit = source de vérité ; bridge placeholder en attendant la surface mobile |
| **ADR-010** Stack UI RN | tokens + **ThemeProvider** + composants maison (pas de NativeWind ni lib UI) |
| **ADR-011** Client HTTP | `fetch` (pas d'Axios) ; tokens fournis par la couche auth, jamais stockés dans le client |
| **ADR-012** Server state | TanStack Query pour l'état serveur ; cache vidé au logout |
| **ADR-015** Secure storage | access token **en mémoire**, refresh token en **SecureStore** ; nettoyage au logout |
| **ADR-016** Client typé OpenAPI | `@enistere/api-client-fetch` est le client officiel cible ; ce transport est un **seam** temporaire (voir ARCHITECTURE) |

## Commandes

```bash
npm install          # installe les dépendances (core autonome, hors workspaces)
npm run typecheck    # tsc --noEmit (strict)
npm run lint         # expo lint (eslint-config-expo)
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
de mission : **Zustand** (état local), **React Hook Form + Zod** (formulaires),
**upload `fetch + FormData`**, **notifications push**, **logger/observabilité**,
**permissions natives**, et tout V2/V3 (maps, tracking, offline, carousels,
bottom sheets, crash reporting). Voir la roadmap du spec (§53) et
`docs/project-status/NEXT_ACTIONS.md`.

## Vérification

- `typecheck` : ✅ (TypeScript strict, `tsc --noEmit`).
- `lint` : ✅ (`expo lint` / eslint-config-expo).
- `doctor` : voir le rapport de session ; checks de versions alignés sur SDK 55.

## Prochaine mission recommandée

**Mobile Core React Native 2 — auth/session hardening** (refresh réel,
intégration `@enistere/api-client-fetch`, persistance/expiration de session,
tests). Une seule mission à la fois.
