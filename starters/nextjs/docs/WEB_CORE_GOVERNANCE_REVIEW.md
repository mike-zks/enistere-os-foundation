# WEB_CORE_GOVERNANCE_REVIEW.md — Revue de gouvernance du Web Core Next.js

> Rapport **permanent** de revue de socle (checkpoint de gouvernance). Mission de **revue,
> vérification, consolidation, arbitrage architectural et mise à jour documentaire** — **pas**
> d'implémentation fonctionnelle (aucun middleware, page login, layout protégé ni route applicative).
> Hiérarchie de vérité appliquée : repository réel > résultats de commandes > ADR > spécification >
> strategy > checkpoint > README/rapports.

## 1. Date

**2026-06-10.**

## 2. Commit revu

`614c087 feat(web-nextjs): add session and authorization state` — branche `main`, synchronisée avec
`origin/main` (remote SSH `git@github.com:mike-zks/enistere-os-foundation.git`). Working tree propre au
démarrage de la revue.

## 3. Périmètre

Revue du **Web Core** (`starters/nextjs`, `@enistere/web-nextjs` 0.1.0, privé) dans l'état
`IMPLEMENTATION_PARTIELLE` : Next.js 16.2.7 App Router + React 19.2.7, UI Kit, API publique (Health) +
TanStack Query (SSR/hydratation), **BFF Auth** (login/refresh/logout/csrf) et **état de
session/autorisations** (me/authorization, `useSession`/`useAuthorization`, purge au logout). Non-régression
vérifiée sur le UI Kit et les paquets `@enistere/api-contracts` / `@enistere/api-client-fetch`. **Hors
périmètre** (non créés) : middleware/proxy Auth, page `/login`, formulaire, layout/route protégés,
redirections, Server Actions Auth, SSR Auth complet, RBAC d'administration.

## 4. Méthodologie

1. Vérification Git (status, log, remote, branche) et inventaire complet des fichiers (`src/app`,
   `src/core`, `src/features`, `src/shared`, `test`).
2. Lecture **fichier par fichier** du code sensible (handlers Auth, client BFF navigateur, CSRF,
   cookies, Origin/Referer, réponses BFF, état de session, queries/hooks TanStack, clés, factories
   serveur, configuration).
3. Exécution des validations réelles : typecheck, lint, tests, **couverture**, **build** (web) ;
   tokens/typecheck/build/test (UI Kit) ; generate:check/typecheck/build/test (paquets API) ;
   `npm audit`, `npm outdated`, `npm ls`.
4. Recherches de sécurité ciblées (`accessToken`, `refreshToken`, `Authorization`, `localStorage`,
   `sessionStorage`, `console.`, `API_INTERNAL_URL`, `NEXT_PUBLIC_`) + **inspection du bundle client**
   `.next/static`.
5. Sous-investigations dédiées : garantie **read-only ⇒ aucun refresh** dans `@enistere/api-client-fetch`
   (gating `enableRefresh`), séparation des **trois clients** API, frontières d'import client/serveur,
   inventaire des tests de frontière/sécurité.
6. **Répétition** de la suite de tests sensibles (2×) pour détecter toute instabilité/hang.
7. Arbitrage **SSR Auth** (options A/B/C/D) et rôle du **middleware**.
8. Corrections **minimales** des contradictions factuelles documentaires + code mort ; rapport ;
   mise à jour du checkpoint ; non-régression finale ; commit/push fast-forward.

## 5. Architecture réelle

Couches `app/` (routage mince) → `features/` (auth, health, foundation-status) → `core/` (api, auth,
query, config) → `shared/` (états présentationnels). **Server Components par défaut** ; seuls les hooks
et panneaux interactifs portent `"use client"`. Double compilation : `next build --webpack`
(`extensionAlias` `.js → .ts/.tsx`) pour l'app ; `tsc` → `node --test` (`nodenext`, imports `.js`) pour
les tests, avec `src/app` **et** `src/core/auth/server` exclus de `tsconfig.test.json`. Aucun store
global (pas de Zustand/Redux), aucun Axios. Types Auth dérivés des contrats via `SchemaOf<>` (aucun DTO
recopié).

## 6. Routes (BFF `/api/auth/*`)

Build : **6 routes `ƒ` (dynamiques)** + page `/` `ƒ`. Toutes les routes sont **minces** (délèguent à un
handler testable `(Request, deps) → Response`) et `force-dynamic` :

| Route | Méthode | Mutative | Garde | `no-store` | Notes |
|---|---|---|---|---|---|
| `/api/auth/csrf` | GET | non | 405 sinon | ✓ | bootstrap CSRF, `Referrer-Policy: no-referrer` |
| `/api/auth/login` | POST | oui | 405 → corps/Content-Type → Origin/Referer → CSRF | ✓ | compensation `clearSession` si échec ; rotation CSRF |
| `/api/auth/refresh` | POST | oui | 405 → Origin/Referer → CSRF | ✓ | un seul refresh, 401 générique, rotation CSRF |
| `/api/auth/logout` | POST | oui | 405 → Origin/Referer → CSRF | ✓ | logout local prioritaire, idempotent, supprime CSRF |
| `/api/auth/me` | GET | non | 405 sinon | ✓ | **read-only**, 401 générique, 403 distinct |
| `/api/auth/authorization` | GET | non | 405 sinon | ✓ | **read-only**, mêmes garanties que `/me` |

GET non mutatifs **sans CSRF** (correct). Erreurs **génériques** via `errorResponse`/`jsonError` — jamais
la réponse brute API, cause, stack ou détails SDK/Prisma.

## 7. Clients API

Trois clients **strictement séparés** (vérifié, aucune fuite de responsabilité) :

- **Public navigateur** (`core/api/public/public-api-client.ts`) — Health uniquement, `enableRefresh:false`,
  **sans session**, `NEXT_PUBLIC_API_URL`. N'appelle jamais `/api/auth/*`.
- **Serveur par requête** (`core/api/server/create-server-api-client.ts`) — Health, `no-store`, sans
  session, `API_INTERNAL_URL`. Aucun singleton.
- **Serveur authentifié** (`create-authenticated-server-api-client.ts`) — **par requête**, porte une
  session via `WebAuthSessionAdapter` (cookies `HttpOnly`), `enableRefresh` **seulement** en mode
  `writable`, `API_INTERNAL_URL` (jamais exposée). Seul client porteur de session.

Côté navigateur, l'état de session est lu via le **client BFF same-origin** (`core/auth/client/`) :
`fetch('/api/auth/*', {credentials:'include'})`, **aucun token/cookie lu en JS**, **jamais** d'appel
direct à l'API ni de `NEXT_PUBLIC_API_URL`. Façade `@enistere/api-client-fetch` : `getProfile()` →
`GET /auth/me`, `getAuthorization()` → `GET /auth/me/authorization`.

## 8. Cookies

`access`/`refresh` : cookies **distincts**, `HttpOnly:true`, `SameSite=Lax`, `Path=/`, **sans Domain**,
`Secure` en production, préfixe **`__Host-`** en production (validé : exige Secure + Path=/ + pas de
Domain). `maxAge` **issu de l'API** (`accessTokenExpiresIn`/`refreshTokenExpiresIn`, tronqué entier ;
rejet si ≤0/non fini). Cookie **CSRF** : `httpOnly:false` (seul cookie volontairement lisible, pour le
double-submit), `Secure` prod, `SameSite=Lax`, `Path=/`, 4 h. Suppression idempotente. **Limite connue**
(documentée) : `updateTokens` pose access **puis** refresh (pas de transaction) ; les handlers
`clearSession()` en cas d'échec partiel (login compensé). Tokens validés anti-injection d'en-tête
(rejet caractères de contrôle / vide).

## 9. CSRF

Double-submit : jeton **256 bits** base64url, **sans secret d'authentification**, sans persistance
serveur. Validation : présence cookie+header, format strict borné, **même longueur**, **comparaison à
temps constant**. **Origin/Referer** (fail-closed si les deux absents ; comparaison **exacte**
`scheme+host+port`, aucune wildcard, aucun `startsWith`). Ordre des handlers mutatifs : méthode → (corps)
→ Origin/Referer → CSRF → **API** (aucun appel API avant gardes franchies). Rotation après login/refresh,
suppression au logout. GET (`/me`, `/authorization`, `/csrf`) sans CSRF — correct.

## 10. État de session

Source de vérité navigateur = `GET /api/auth/me` (jamais dérivé d'un cache ancien, d'une réponse login,
d'une variable locale, d'un cookie supposé ni d'une permission). Machine d'états (`useSession`) :
`pending → loading` ; succès → `authenticated` (profil, **aucun token**) ; **401 → anonymous** (traité
comme succès de query dans `loadSession`, pas une erreur, donc **pas de retry**) ; **403 / 5xx / réseau /
réponse invalide → error** (403 **distinct** d'anonymous). Pas de flash anonyme : l'état reste `loading`
tant que `/me` n'a pas répondu. `toPublicAuthError` produit un message **générique** (aucune
cause/stack/cookie/token). `refetch()` exposé pour revérification.

## 11. TanStack Query

`authKeys` (`["auth"]` / `…,"session"` / `…,"authorization"`) **disjoint** de `healthKeys` (`["health"…]`).
Server state Auth : `sessionQueryOptions` / `authorizationQueryOptions` avec **`retry:false`**,
`staleTime:30s`, `gcTime:5min`, **sans persistance** (aucun localStorage/sessionStorage, aucun
PersistQueryClient). `authorizationQueryOptions(enabled)` est **activée uniquement si authentifié** →
aucun appel `/authorization` en `loading`/`anonymous`. `QueryClient` global : `refetchOnWindowFocus:false`,
retry borné `shouldRetryQuery` (réseau/timeout/5xx, jamais 4xx/429) — appliqué aux queries Health (les
queries Auth surchargent `retry:false`). Clés **stables, readonly, sérialisables**, sans URL/token/cookie/
userId/timestamp. **Détail test** : les `queryOptions` Auth imposent un `gcTime` (timer GC `ref`) → chaque
`QueryClient` de test est `clear()` en `afterEach` (sinon hang) — confirmé non régressif (suite exécutée
2× sans hang).

## 12. RBAC (ADR-006)

Le Web consomme **uniquement** `roles[]` / `permissions[]` depuis le BFF (`/authorization`). Helpers
`useAuthorization` : `hasRole` / `hasPermission` (présence **exacte**), `hasAnyRole` (**OR**),
`hasAllPermissions` (**AND**). **Aucune wildcard** ; paramètre seulement `trim()` (codes API canoniques,
pas de normalisation destructive). Sémantique d'affichage conditionnel uniquement — **l'API reste
l'autorité finale** (masquer un bouton n'est pas une protection). Changement de droits reflété **sans
nouveau JWT** (prouvé contre l'API réelle dans la mission Web Auth 3). Aucune permission inventée côté
client, aucune confusion 401/403.

## 13. Contrats OpenAPI (ADR-016)

Types Auth dérivés via `SchemaOf<"UserProfileResponseDto">` /
`SchemaOf<"AuthorizationSummaryResponseDto">` — **aucun type/DTO manuel** dupliquant le contrat. Appels
via la façade typée (operationId/paths stabilisés `/auth/me`, `/auth/me/authorization`). **`generate:check`
= `up-to-date`** (client consommé conforme au snapshot canonique `starters/nestjs/openapi/openapi.json`).
Dépendance à sens unique respectée : `openapi.json → api-contracts → api-client-fetch → web`.

## 14. Sécurité

Aucune fuite de token. Recherches : `localStorage`/`sessionStorage` **absents** ; `accessToken`/
`refreshToken` **uniquement** côté serveur (`web-session-adapter`, `session-contract`, handlers
refresh/logout) ; `Authorization` ne désigne que la **feature** autorisations (jamais d'en-tête posé en
client) ; `console.` **uniquement** dans `app/error.tsx` (frontière d'erreur Client standard, aucun token
en état React) ; `API_INTERNAL_URL` jamais en client ; `NEXT_PUBLIC_API_URL` jamais dans le chemin Auth.
Réponses BFF génériques, `X-Request-Id` propagé, `no-store`. En-têtes globaux (`next.config.ts`) :
`X-Content-Type-Options:nosniff`, `Referrer-Policy`, `X-Frame-Options:DENY`, `X-DNS-Prefetch-Control:off`,
`Permissions-Policy`, **pas de `X-Powered-By`**. **read-only ⇒ aucun refresh silencieux** : gating
`enableRefresh` confirmé dans le transport (`status===401 && refreshEnabled`), single-flight anti-boucle.

## 15. Bundle client

`grep` sur `.next/static` (build de production) : `API_INTERNAL_URL` **absent**, littéraux
`enistere_access`/`enistere_refresh` **absents**, `next/headers` **absent**. Frontière serveur préservée
(convention + test statique d'imports `auth-boundaries.test.ts` ; `server-only` non utilisé car incompatible
`node:test`).

## 16. Tests

**Web : 206 tests / 206 pass / 0 fail** (`node:test` + Testing Library + jest-axe + global-jsdom),
**exécutés 2× sans instabilité ni hang** (~5,0–5,3 s). Couverture globale ≈ **84,7 % lignes / 87,9 %
branches / 77,9 % fonctions**. Modules Auth sensibles à 100 % lignes (auth-keys, use-session,
use-authorization, use-logout, auth-queries, web-session-adapter, web-response, cookie-config via
build-test). Non-régression : **UI Kit 64/64**, **api-contracts 11/11**, **api-client-fetch 29/29**,
`tokens:check` + `generate:check` **up-to-date**, `npm audit` **0 vulnérabilité**. `npm outdated` :
seules des montées **majeures volontairement non prises** (eslint 10, jsdom 29, jest-axe 10, typescript 6)
et un patch mineur `next 16.2.7→16.2.9` (non sécuritaire). Couverture plus faible (non bloquant) :
`use-health.js` (≈59 % lignes — chemin Health navigateur), `session-state.js` (≈44 % branches — bras de
message 429/5xx non tous unit-couverts), `session-status-view`, `read-body`, `server-cookie-store`.

## 17. Runtime réel

**Non ré-exécuté dans cette revue — décision explicite et assumée.** Le code Auth/session est
**inchangé** depuis le commit `614c087` qui porte déjà une **preuve API réelle** complète (NestJS +
PostgreSQL jetable) : `login → /me → /authorization → refresh → /me → logout → /me 401`, Origin invalide,
CSRF invalide, rotation, cookies `HttpOnly`, **read-only sans appel `/auth/refresh`**, **changement de
droits sans nouveau JWT** (retrait de rôle → `roles:[]` sur la même session, `/me` toujours 200), bundle
client sans secret. Rejouer ce scénario sur un code identique n'apporterait **aucune preuve nouvelle** ;
la logique handlers/transport/hooks est par ailleurs exercée en continu par la suite `node:test` (gardes
de sécurité, 401/403/réseau, no-store, masquage de token). Aucune CI n'automatise ce runtime (ADR-013).

## 18. Dettes

**Bloquantes avant routes protégées : AUCUNE.**

| Dette | Classe | Détail / mitigation |
|---|---|---|
| Ordre de build monorepo | **IMPORTANTE** | `next build` (phase TS) dépend de `packages/*/dist` (**non versionnés**, gitignore `dist/`). Clone neuf → exécuter `npm run build` racine (topologique) **avant** le Web Core. Aucune CI ne l'impose (ADR-013). Mitigation : ordre manuel ; documenté dans `docs/ARCHITECTURE.md`. |
| Décision SSR Auth non tranchée | **IMPORTANTE** | Option A client-only aujourd'hui ; arbitrage requis avant routes protégées (cf. §20). |
| Absence d'E2E navigateur | **IMPORTANTE** | Flux session/logout couverts au niveau handler/transport (`node:test`) + preuve API réelle, mais **pas** de Playwright bout-en-bout (post-V1 / Cloud-CI). |
| Couverture de branches partielle | NON BLOQUANTE | `session-state` (messages 429/5xx), `use-health`, vues — défense en profondeur, sans risque fonctionnel. |
| Patch `next 16.2.7→16.2.9` | NON BLOQUANTE | Non sécuritaire (`audit` 0). À prendre avec une CI de validation. |
| `updateTokens` non transactionnel | NON BLOQUANTE | Documenté ; compensé par `clearSession` côté handlers. |
| CSP, `server-only`, rate limiting, HSTS, logger Web structuré | POST-V1 | Différés et documentés (`docs/SECURITY.md`). |

**Anti-patterns recherchés — tous ABSENTS** : singleton Auth serveur (factory par requête), token en état
React, types API manuels (`SchemaOf<>`), redirect dans un hook transport, permission dans le JWT (lues en
direct, changement sans JWT prouvé), `fetch` API direct depuis un composant (hooks → client BFF/public),
`API_INTERNAL_URL` côté client, client public utilisé pour l'Auth, query key contenant un token,
middleware comme autorité Auth (aucun middleware).

## 19. Risques

1. **Reproductibilité build** sans CI : ordre de build des paquets implicite (cf. §18). Risque sur clone
   neuf / futur pipeline. Mitigé localement, documenté.
2. **Dérive de contrat** si l'API évolue sans régénération (`generate:check` non automatisé).
3. **Pas de CI** : non-régression manuelle (toute la chaîne repose sur l'exécution locale).
4. **Frontière serveur par convention** (`server-only` non utilisé) : maintenue par test statique
   d'imports — robuste mais non garantie par le compilateur.

## 20. Décision SSR Auth (arbitrage)

Options comparées :

- **A — client-only** (actuel) : Server Component neutre + `useSession` côté client. Simple, BFF unique,
  pas de lecture cookie au rendu ; mais **flash loading** et protection serveur limitée.
- **B — Server Component appelle son propre `/api/auth/me`** : self-HTTP, URL absolue, propagation
  manuelle cookies/host, duplication réseau → **rejeté**.
- **C — résolution Auth serveur directe** : Server Component → cookie store read-only → client serveur
  authentifié **read-only** → API `/auth/me`, puis **hydratation TanStack Query**. Pas de self-HTTP,
  rendu Auth précoce, **réutilise les fondations Auth serveur déjà présentes** (`createAuthenticatedServerApiClient`
  read-only, déjà utilisé par le handler `/me`). Coût : second chemin d'orchestration ; pas de refresh en
  lecture (acceptable — le refresh reste dans les Route Handlers/Server Actions writable).
- **D — middleware comme autorité de session** : **rejeté** comme autorité (cf. §21).

**Décision (orientation pour Web Auth 4) : approche HYBRIDE contrôlée.**
- Pages **publiques** : Option **A** (client-only), inchangé.
- Layouts/pages **privés** : Option **C** (résolution serveur read-only) + hydratation du profil dans
  TanStack Query (même motif que le préchargement Health de `page.tsx`), supprimant le flash sur les pages
  protégées. **L'API reste l'autorité finale.**
- Middleware éventuel : **filtrage UX léger** (présence de cookie) **seulement**, jamais preuve
  d'authentification/autorisation.

**Cette stratégie n'est PAS implémentée dans cette mission** (revue uniquement).

## 21. Décision middleware / proxy

**Pas de middleware Auth lourd.** Un middleware ne peut **pas** valider un token ni connaître la
révocation serveur sans appeler l'API à chaque navigation (coût, runtime edge contraint, duplication,
risque de confondre routage et autorité Auth). **Protection réelle** = layout/page serveur (Option C) +
**autorité API**. Un middleware/proxy **optionnel** pourra faire de la **redirection UX rapide** basée sur
la simple **présence** d'un cookie — **jamais** une preuve d'authentification ni d'autorisation. Non créé
ici.

## 22. Corrections appliquées

Strictement **documentaires/factuelles + code mort** (zéro changement de comportement ; régression
couverte par les 206 tests + build verts) :

| # | Fichier | Défaut | Correctif |
|---|---|---|---|
| 1 | `package.json` | `description` : « Aucune authentification » (faux) | Décrit BFF Auth + session/autorisations ; précise « ni route protégée ni middleware ». |
| 2 | `src/core/auth/cookie-config.ts` | Commentaire « Cadrage CSRF (V1 : AUCUN mécanisme actif) » (faux) **+ export mort** `CSRF_HEADER_NAME` | Commentaire corrigé (CSRF **actif**, implémenté dans `csrf/` + `handlers/security.ts`) ; `CSRF_HEADER_NAME` (jamais importé) **supprimé** ; `CSRF_COOKIE_NAME` (utilisé) conservé. |
| 3 | `src/core/query/query-client.ts` | Commentaire « Aucune donnée d'authentification n'est mise en cache » (faux) | Décrit le cache Auth disjoint (`authKeys`, `retry:false`, sans persistance) ; politique par défaut pour Health ; aucun token en cache. |
| 4 | `README.md` | Accroche « Aucune authentification » contredisant le §1 | Accroche corrigée (BFF Auth + session ; absences réelles : page/middleware/route protégée/SSR complet). |
| 5 | `docs/SECURITY.md` | « starter minimal : pas d'auth, pas d'appel réseau, pas de stockage de token » + BFF Auth/cookies/CSRF listés « Reporté V2 » (faux) | Section **Implémenté (Auth)** ajoutée ; « Reporté V2 » réduit à CSP/rate-limiting/HSTS/observabilité/SSR-Auth ; `server-only` clarifié (non utilisé). |
| 6 | `docs/ARCHITECTURE.md` | « `api`/`auth`/`query` vides en V1 » + paquets « pas instanciés » (faux) | Couches/features décrites comme **implémentées** ; paquets **instanciés** (`SchemaOf<>`) ; **note build monorepo** ajoutée (ordre des paquets). |

`packages/api-client-fetch` et `packages/api-contracts` : **non modifiés** (git clean — vérifié). Aucun
fichier de `api-nestjs/`, `mobile-react-native/`, `cloud/`, `ui-kit/`, `docs/adr/`, `strategy/` modifié.

## 23. Éléments absents (volontaires, hors périmètre)

Page `/login`, formulaire de connexion, layout/route protégés, redirections, middleware/proxy, Server
Actions Auth, **SSR Auth complet**, RBAC d'administration, gestion Files/upload, OAuth/MFA,
forgot/reset password, CI/CD, Dockerfile/compose, E2E navigateur, CSP, rate limiting.

## 24. Statut réel

**`IMPLEMENTATION_PARTIELLE`** — **inchangé**. Le statut **n'est pas relevé** du seul fait d'une revue ;
aucune nouvelle capacité fonctionnelle n'a été ajoutée. Le socle est **cohérent, sûr et testé**.

## 25. Prochaine action unique

**Web Auth 4 — résolution Auth serveur (Option C) + premier layout protégé.** Aucune dette **bloquante**
n'a été identifiée ; l'orientation SSR Auth est désormais tranchée (hybride : C pour le privé, A pour le
public ; middleware = UX léger non autoritaire). Implémenter d'abord la résolution serveur read-only +
hydratation, puis un layout protégé minimal, l'API restant l'autorité finale.

## 26. Critères autorisant Web Auth 4

1. SSR Auth tranché (✓ — §20) et confirmé à l'implémentation.
2. Aucune dette **bloquante** (✓).
3. Non-régression verte : web `check` (typecheck+lint+206 tests+build) + couverture, UI Kit, paquets,
   audit (✓).
4. Frontière serveur/​navigateur préservée (✓) et autorité API maintenue (✓).
5. Recommandé en complément (non bloquant) : amorcer une **CI** (ADR-013) imposant l'ordre de build des
   paquets et la non-régression, avant d'élargir la surface protégée.

---

> **Verdict** : Web Core **conforme**, sûr, sans fuite de token, caches isolés, RBAC ADR-006 respecté,
> contrats OpenAPI = source des types. Corrections **documentaires factuelles** appliquées. Statut
> maintenu `IMPLEMENTATION_PARTIELLE`. **Prochaine action unique : Web Auth 4** (résolution Auth serveur
> + premier layout protégé), avec amorçage CI recommandé en parallèle.
