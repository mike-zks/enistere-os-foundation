# `@enistere/web-nextjs` — Web Core

Socle **Web** d'Enistère : application **Next.js 16 (App Router)** en **TypeScript strict**, consommant
le design system **`@enistere/ui-kit`**, l'**API publique** (endpoints Health) via les paquets clients
officiels et **TanStack Query** pour le server state. **Aucune authentification** (BFF/cookies/CSRF
viendront dans un incrément ultérieur).

> **Statut** : `IMPLEMENTATION_PARTIELLE` (compile, build, lint, tests verts + serveur local + preuve
> API réelle). Source de vérité de pilotage : [`docs/project-status/`](../../docs/project-status/README.md).

---

## 1. Périmètre

### Inclus

- Next.js **App Router** + **TypeScript strict** (`strict`, `noUncheckedIndexedAccess`, …).
- Arborescence `app` / `core` / `shared` / `features` ; **Server Components par défaut**.
- **Consommation réelle** du UI Kit (`@enistere/ui-kit` + `styles.css`) ; thème clair via `data-theme`.
- **Intégration de l'API publique** (Health) : factory serveur **par requête**, client **public**
  navigateur (sans session), transport typé depuis `@enistere/api-contracts`/`@enistere/api-client-fetch`.
- **TanStack Query** : `QueryClient` (retry borné), `QueryProvider`, query keys, hooks Health.
- **SSR + préchargement + hydratation** contrôlés ; build **indépendant** d'une API disponible.
- Normalisation d'erreurs Web, propagation **X-Request-Id**, en-têtes de **sécurité** + pas de `X-Powered-By`.
- États `loading` / `error` / `not-found`, métadonnées, `manifest`.
- Tests (node:test + Testing Library + jest-axe) + preuve avec **API réelle** (PostgreSQL jetable).
- **Fondations BFF Auth serveur** : client API **authentifiable** (par requête, distinct du public),
  **adaptateur de session** + configuration **cookies `HttpOnly`** (access/refresh distincts), modes
  **read-only / writable**. Détail : [`docs/auth-architecture.md`](docs/auth-architecture.md).

### Hors périmètre — volontairement absent

**Routes Auth** (`/api/auth/*`) · login/refresh/logout réels · **CSRF opérationnel** · middleware d'auth ·
pages/formulaires de login · token exposé au navigateur · endpoints **authentifiés** · routes Files /
upload · **Axios** · **Zustand**/Redux/Jotai · Orval · Storybook · logique métier · OAuth / MFA · i18n
complet · monitoring · workflow CI · Dockerfile · publication npm · **aucun type d'API recopié**.

---

## 2. Stack & versions

| Brique | Version | Note |
| --- | --- | --- |
| Next.js | **16.2.7** | App Router · build **webpack** (cf. [§5](#5-conventions-dimport)) |
| React / React DOM | **19** | version **unique** dans tout le monorepo |
| Server state | `@tanstack/react-query` **5** | retry borné, SSR/hydratation ; **aucun Axios** |
| Clients API | `@enistere/api-client-fetch` + `@enistere/api-contracts` | Fetch typé, sans Axios |
| TypeScript | 5.7+ | `strict`, `noUncheckedIndexedAccess`, `noImplicitOverride` |
| Tests | `node:test` + `@testing-library/react` 16 + `jest-axe` + `global-jsdom` | pas de Vitest (0 vuln) |
| Lint | ESLint **9** (flat config) + `eslint-config-next` 16 | `next lint` retiré en Next 16 |

> **Pourquoi Next 16 / React 19** : Next 14.2.x traînait des advisories *high* sans correctif en 14.x ;
> le correctif npm était `next@16`. Next 16 + React 19 (+ override `postcss`) ramène l'audit à **0
> vulnérabilité**. Le UI Kit a été aligné sur React 19 (voir [§11](#11-ui-kit--react-19)).

---

## 3. Arborescence

```
src/
  app/                       # App Router
    layout.tsx               # Server Component : CSS + <html data-theme> + <AppProviders>
    page.tsx                 # force-dynamic : prefetch Health (SSR) + HydrationBoundary
    providers/app-providers  # Client Component : enveloppe QueryProvider (layout reste serveur)
    loading/error/not-found/manifest
  core/
    config/                  # api-url (validation), public-config, server-config, metadata, theme
    api/
      run-public-request     # timeout + normalisation ApiClientError pour `client.raw`
      server/                # createServerApiClient (public) + createAuthenticatedServerApiClient (BFF)
      public/                # createPublicApiClient + singleton navigateur (sans session)
      health/                # getHealth/getLiveness/getReadiness (types via SchemaOf<>)
      errors/                # mapApiErrorToPublicMessage
    auth/                    # FONDATIONS BFF : cookie-config, server-cookie-store, session-contract,
      server/                #   web-session-adapter ; server/ = SERVER-ONLY (next/headers) — exclu node:test
    query/                   # query-client (retry), query-provider, keys/health-keys
  features/
    foundation-status/       # page technique (matrice d'intégrations) — testable
    health/                  # queries (queryOptions), hooks, health-panel, health-probe-view
test/                        # node:test (compilés vers build-test/)
```

---

## 4. Scripts

| Commande | Effet |
| --- | --- |
| `npm run dev` | serveur de dev (port **3100**, webpack) |
| `npm run build` | build de production (webpack) |
| `npm run start` | serveur de production (port 3100) |
| `npm run lint` / `typecheck` | ESLint / `tsc --noEmit` |
| `npm run test` / `test:coverage` | compile `tsconfig.test.json` puis `node --test` |
| `npm run check` | typecheck + lint + test + build |

---

## 5. Conventions d'import

Deux compilateurs cohabitent : **Next** (build de `app/` + graphe importé) et **`tsc` nodenext**
(compilation des tests vers `build-test/`, exécutés par `node --test`).

- **Convention unique** : tous les imports relatifs utilisent l'extension **`.js`** (style `nodenext`,
  requis par `node:test`).
- Le build utilise **webpack** (`next build --webpack`) avec `experimental.extensionAlias`
  (`.js → .ts/.tsx`). **Turbopack** ne résout pas encore ces imports `.js` ; webpack le fait. C'est la
  seule raison de ce choix de bundler (documentée ici).
- `src/app/` **et** `src/core/auth/server/` sont **exclus** de `tsconfig.test.json` : les fichiers App
  Router et les modules **SERVER-ONLY** liant `next/headers` (cookie store, entrée Auth serveur) sont
  validés par `next build` + typecheck, pas par `node:test`. `server-only` (npm) n'est pas utilisé (il
  lève à l'import sous `node:test`) ; la frontière est garantie par `next/headers` + tests d'import statiques.

---

## 6. Environnement

Variables (voir [`.env.example`](.env.example)) — **aucune n'est requise** pour build/lint/tests :

- `APP_ENV`, `NEXT_PUBLIC_APP_NAME` : **publiques**.
- `NEXT_PUBLIC_API_URL` : URL **publique** (navigateur) des endpoints Health. Facultative : sans elle,
  l'UI affiche « non configuré » et n'émet aucune requête. **Aucun secret** (inlinée au build).
- `API_INTERNAL_URL` : URL **interne, serveur uniquement** (préchargement SSR), jamais préfixée
  `NEXT_PUBLIC_`. Préférée côté serveur si présente.

Toutes les URLs sont **validées** (`http(s)`, absolues, sans credentials, slash final normalisé,
wildcard rejeté — `core/config/api-url.ts`). Détail : [`docs/api-integration.md`](docs/api-integration.md).

---

## 7. Intégration API (transport)

- **Factory serveur par requête** (`createServerApiClient`) : nouvelle instance à chaque appel, aucun
  état module, `API_INTERNAL_URL`, `fetch` **`no-store`**, aucun Bearer, aucun refresh.
- **Client public navigateur** (`createPublicApiClient` + singleton) : `NEXT_PUBLIC_API_URL`, **aucune
  session**, `enableRefresh:false`, **X-Request-Id** (`crypto.randomUUID`).
- Les endpoints Health (non couverts par les façades auth/files) passent par `client.raw` + un petit
  transport (`run-public-request`) : **timeout**, normalisation en **`ApiClientError`**, extraction de
  l'enveloppe — **sans recopier de DTO** (types via `SchemaOf<>` des contrats).

> ⚠️ Le client **public** ne doit PAS devenir le futur client **authentifié** (qui passera par un BFF
> + cookies `HttpOnly`). Voir [`src/core/auth/README.md`](src/core/auth/README.md). Détail :
> [`docs/api-integration.md`](docs/api-integration.md).

---

## 8. TanStack Query & SSR

`QueryClient` (retry **borné** : jamais sur 4xx/429, borné sur réseau/5xx ; `refetchOnWindowFocus`
off), `QueryProvider` (client, une instance par navigateur), `AppProviders` (le layout reste **Server
Component**). Query keys standardisées (`healthKeys`). Hooks `useHealth/useLiveness/useReadiness`
(désactivés si l'API publique n'est pas configurée). La page précharge `health_get` côté serveur,
`dehydrate` + `HydrationBoundary` ; `staleTime` évite un refetch immédiat après hydratation. La page
est **`force-dynamic` + `no-store`** : le **build ne dépend d'aucune API**. Détail :
[`docs/tanstack-query.md`](docs/tanstack-query.md).

---

## 9. Erreurs & corrélation

`mapApiErrorToPublicMessage` produit un message **public générique** depuis `kind`/`status`/`errorCode`
(jamais de `cause`/stack/secret) ; le `requestId` est conservé comme référence technique. Cas couverts :
réseau, timeout, réponse invalide, 429, 500, 503 (401/403 normalisés **sans** workflow d'auth).

---

## 10. Tests & preuve

`node:test` : validation d'URL/config, factory serveur (instance par appel, no-Bearer, isolation),
client public (no-Authorization, `enableRefresh:false`, requestId, **aucun import serveur** — vérifié
statiquement), `QueryClient` (politique de retry, isolation du cache), query keys, transport Health
(succès/erreur/timeout/requestId), hooks (succès/erreur/refetch/désactivé), **hydratation** (donnée
fraîche → pas de refetch), UI Health (états + a11y), mapping d'erreurs, et **garde anti-réseau** (toute
requête réelle non mockée fait échouer un test). **Fondations Auth** : config cookies (Secure/env,
préfixes, durées, rejets), cookie store mémoire, `WebAuthSessionAdapter` (lecture/écriture/clear, tokens
vides/contrôle rejetés, aucune valeur en erreur), factory authentifiée (instance/appel, isolation A/B,
Bearer issu du cookie, read-only refresh off vs writable refresh tenté), **frontières d'import statiques**,
**sentinelles** non fuitées. Build + sonde HTTP locale. **Preuve API réelle** : API NestJS + PostgreSQL
jetable (Health/live/ready, hydratation SSR, API down → rendu contrôlé, API up → succès) — **sans authentification**.

---

## 11. Fondations BFF Auth (serveur)

Architecture **BFF** : le navigateur parlera aux Route Handlers Next `/api/auth/*` (V2), qui poseront des
cookies `HttpOnly` et appelleront l'API via un **client serveur authentifiable** (`core/api/server/
create-authenticated-server-api-client.ts`, par requête, distinct du client public). Présent : config
cookies (`enistere_access`/`refresh`, `HttpOnly`, `Secure` prod, `SameSite=Lax`, `Path=/`, `__Host-` prod),
abstraction `ServerCookieStore` (+ mémoire pour tests, adaptateur `next/headers`), `WebAuthSessionAdapter`,
modes **read-only** (refresh off) / **writable** (refresh activable). **Absent** : routes Auth, CSRF actif,
login/refresh/logout réels, token côté navigateur. Détail : [`docs/auth-architecture.md`](docs/auth-architecture.md)
et [`src/core/auth/README.md`](src/core/auth/README.md).

---

## 12. UI Kit & React 19

`@enistere/ui-kit` est aligné sur **React 19** (peer `react >=18`, couvre 18 et 19) ; ses **64 tests**
passent sous React 19 (aucune régression). Voir le `CHANGELOG.md` racine.

---

## 13. Feuille de route

**Prochain incrément** : **Web Auth 2** — `login` / `refresh` / `logout` via Route Handlers BFF
(`/api/auth/*`), pose réelle des cookies, **CSRF opérationnel**, puis `me` / `authorization`. Puis :
écrans authentifiés, gestionnaire de thème, CSP à nonces, i18n, CI/CD.
