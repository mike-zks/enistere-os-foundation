# Architecture Auth Web — BFF (Web Auth 1 → 5)

> **Flux Auth BFF disponibles** : `login` / `refresh` / `logout` (+ bootstrap `csrf`) **et lecture
> `me` / `authorization`** ; protégés par cookies `HttpOnly`, Origin/Referer (mutations) et **CSRF
> opérationnel**. État de session côté navigateur via **TanStack Query** (`useSession`/`useAuthorization`).
> **Aucune page de connexion, aucun middleware de route privée, aucun SSR Auth complet** (session chargée
> côté client). ADR-004 (session), ADR-005 (cookies/CSRF), ADR-006 (RBAC), ADR-011 (Fetch), ADR-012 (server state).

## 0. Flux réels

| Route | Méthode | Rôle |
| --- | --- | --- |
| `/api/auth/csrf` | GET | Bootstrap : pose le cookie CSRF (non HttpOnly) + renvoie le jeton. |
| `/api/auth/login` | POST | Valide (body/Origin/CSRF) → API NestJS → cookies `HttpOnly` access/refresh, renouvelle le CSRF. |
| `/api/auth/refresh` | POST | Lit le refresh cookie → API `/auth/refresh` → **rotation** des deux cookies + CSRF. |
| `/api/auth/logout` | POST | API `/auth/logout` (best-effort) → **supprime toujours** les cookies (Auth + CSRF). |
| `/api/auth/me` | GET | Profil public. **Read-only (aucun refresh auto)**, pas de CSRF, `no-store`. 401 si session invalide. |
| `/api/auth/authorization` | GET | Rôles/permissions. Read-only, pas de CSRF, `no-store`. 401 si session invalide. |

Réponses navigateur : **jamais de token** (`{ success, data, requestId }`).

## 0b. Session & autorisations (navigateur, Web Auth 3)

- **Source de vérité** : `GET /api/auth/me` (pas de cookie supposé, pas de localStorage). États dérivés par
  `useSession` : `pending → loading`, succès → `authenticated`, **401 → anonymous**, **403/autre → error**.
  Pas de flash : tant que `/me` n'a pas répondu, l'état est `loading` (jamais anonyme par défaut).
- **`useAuthorization`** (activé **seulement** si authentifié) : `roles`/`permissions` + helpers
  `hasRole`/`hasAnyRole`/`hasPermission`/`hasAllPermissions` (OR/AND, **sans wildcard**, ADR-006). Les
  helpers servent à l'**affichage conditionnel** — **l'API reste l'autorité finale** : masquer un bouton
  n'est pas une protection. Les codes de l'API sont **canoniques** (paramètres seulement `trim()`).
- **Changement de droits** : les permissions sont lues **en direct** côté API ; un refetch de
  `/authorization` reflète un changement de rôle **sans nouveau JWT** (prouvé). 
- **Cache** : `authKeys` (`session`/`authorization`), `staleTime` court, **aucune persistance**. Au
  **logout** : `removeQueries(authKeys.all)` (session + authorization purgées) ; les queries **Health
  restent intactes**. Sur échec réseau navigateur↔BFF du logout : **pas de purge** (on ne prétend pas la
  session supprimée), retry possible. Aucune redirection (hors périmètre).
- **SSR** : Option A retenue — la session est chargée **côté client** après hydratation (pas d'appel `/me`
  au build ni de serveur appelant son propre BFF). Le SSR Auth complet sera étudié avant les routes protégées.

## 1. BFF (Backend-for-Frontend)

```
Navigateur
   ↓  (same-origin ; cookies HttpOnly Auth + cookie CSRF lisible ; en-tête X-CSRF-Token)
Route Handlers Next.js  /api/auth/*   (login | refresh | logout | csrf)
   ↓  (client API serveur authentifiable, PAR REQUÊTE — Bearer lu du cookie)
starter NestJS  /auth/*
```

Le navigateur **ne parle jamais directement** aux endpoints Auth NestJS. Les tokens transitent par des
cookies `HttpOnly` posés par les Route Handlers. Le BFF assure : refresh token inaccessible au JS, cookies
same-origin, **contrôle CSRF centralisé**, API interne non exposée, adaptation de la réponse (aucun token),
propagation `X-Request-Id`.

> **Note transport (BFF→API)** : le client serveur authentifié **bufferise le corps de requête** et
> reconstruit l'appel `fetch(url, init)` (corps rejouable) — sans quoi, sous le `fetch` patché de Next,
> un POST recevant une réponse non-2xx (ex. 401 login) échouait avec `expected non-null body source`
> (remonté à tort en « réseau »).

## 2. Client public vs client authentifié

| | Client **public** (Web 2) | Client **authentifié** (Web Auth 1) |
| --- | --- | --- |
| Module | `core/api/public/` | `core/api/server/create-authenticated-server-api-client.ts` |
| Session | aucune | `WebAuthSessionAdapter` (cookies) |
| Bearer | non | oui (lu depuis le cookie d'access) |
| Refresh | `enableRefresh:false` | `enableRefresh` = mode `writable` |
| Usage | navigateur (Health) | **serveur** (BFF), par requête |

**Ne pas fusionner** les deux. Le client public ne doit jamais porter de session.

## 3. Cookies

Deux cookies **distincts**, `HttpOnly` : `enistere_access`, `enistere_refresh`. `SameSite=Lax`, `Path=/`,
**aucun Domain**. `Secure` en **production** uniquement. Préfixe **`__Host-`** en production
(`__Host-enistere_*`) — exige `Secure` + `Path=/` + pas de `Domain` ; **omis** en dev/test (HTTP local).
Config : `core/auth/cookie-config.ts`.

## 4. Session

Contrat interne `WebAuthSession` (`core/auth/session-contract.ts`) — **jamais sérialisé au navigateur**.
Diagnostic `sessionPresence` : **présence** des cookies uniquement (aucune valeur de token).

## 5. Access / Refresh (décision V1 — Option A)

**Access ET refresh en cookies `HttpOnly`** (Option A). Motifs : appels BFF intégralement côté serveur,
aucune exposition au JavaScript, requêtes successives simples, séparation nette du client public.
Compromis : tout passe par le serveur (pas d'appel API direct depuis le navigateur authentifié) — accepté
pour ce socle. Options écartées : B (refresh seul HttpOnly, access recréé) — plus de complexité de
rotation ; C (access en mémoire navigateur) — exposition au JS, rejetée (ADR-005).

## 6. Contextes Next.js

| Contexte | Lecture cookie | Écriture cookie |
| --- | --- | --- |
| Server Component | ✔ | interdite (lève) |
| Route Handler | ✔ | ✔ |
| Server Action | ✔ | ✔ (sous contraintes) |
| Middleware | (hors mission) | (hors mission) |

`cookies()` (next/headers) est **asynchrone** en Next 16 : l'adaptateur `createNextCookieStore()` est `async`.

## 7. Lecture seule vs écriture

`createAuthenticatedServerApiClient({ mode })` :
- **`read-only`** (Server Component) → `enableRefresh:false` (un refresh exigerait d'écrire des cookies) ;
- **`writable`** (Route Handler / Server Action) → `enableRefresh:true` (les nouveaux tokens peuvent être
  posés).

Cette distinction empêche un refresh automatique dans un contexte incapable de sauvegarder les nouveaux
tokens. Points d'entrée serveur : `core/auth/server/index.ts` (`getReadOnlyAuthApiClient` /
`getWritableAuthApiClient`).

## 8. Refresh (réel — Web Auth 2)

`/api/auth/refresh` : lit le refresh token du cookie `HttpOnly`, appelle **une seule fois** `/auth/refresh`
(aucune boucle, aucun rejeu auto au niveau de la route), **remplace les deux cookies** via
`WebAuthSessionAdapter.updateTokens` (durées de l'API). En échec (invalide/expiré/révoqué) : **cookies
supprimés** + 401 générique. Le client est en mode **writable**.

## 9. CSRF (opérationnel — Web Auth 2)

**Double-submit cookie** : cookie CSRF **non HttpOnly** (lisible par le JS) + en-tête `X-CSRF-Token`,
comparés en **temps constant** (mêmes longueur/format). Jeton 256 bits (base64url), **sans persistance
serveur**, **sans lien avec les tokens Auth**. Bootstrap : `GET /api/auth/csrf` pose le cookie + renvoie
le jeton (`Cache-Control: no-store`, `Referrer-Policy: no-referrer`). **Rotation** après login/refresh ;
**suppression** au logout (l'ancien jeton est alors refusé). **login/refresh/logout exigent le CSRF**
(le login est protégé contre le login-CSRF). Détail : [`csrf.md`](csrf.md).

## 9b. Origin / Referer

Sur chaque route mutative : si `Origin` présent → doit appartenir à `WEB_ALLOWED_ORIGINS` (comparaison
**exacte** `scheme+host+port`, aucun suffixe) ; sinon `Referer` (origine extraite) ; **fail-closed** si
les deux sont absents. Wildcard de configuration rejeté.

## 9c. Erreurs & request ID

Réponses **génériques** (jamais la réponse brute de l'API, ni cause/stack/cookie/token). Mapping :
400 invalide · 401 auth · 403 CSRF/Origin · 413 corps trop volumineux · 415 content-type · 429 rate ·
500 BFF · 502/504 API indisponible/timeout. `X-Request-Id` : entrant validé ou généré, propagé
navigateur → BFF → API → réponse (jamais une preuve d'autorisation). Corps de login borné.

## 10. SSR & isolation

**Aucune session globale serveur.** Le client authentifié est créé **par requête** (nouvelle instance,
nouvel adaptateur, nouveau `ServerCookieStore`), sans état mutable de module. Testé : deux sessions A/B
isolées (aucune fuite de token, aucun adaptateur réutilisé).

## 10b. Résolution Auth serveur & layout protégé (Web Auth 4)

**Espaces privés** : la session est résolue **côté serveur** en **lecture seule** (Option C ; les pages
publiques restent client-only, Option A).

```
(protected)/layout.tsx  (Server Component, force-dynamic)
  → resolveNextServerSession()              // core/auth/server/protected-session.ts (next/headers)
      → createReadOnlyNextCookieStore()      // cookies() — get uniquement (aucune écriture possible)
      → resolveServerSession()               // core/auth/resolve-server-session.ts (testable, deps injectées)
          → createAuthenticatedServerApiClient({ mode:'read-only' })   // enableRefresh:false
          → API NestJS GET /auth/me          // appel DIRECT (jamais le BFF local /api/auth/me)
  → decideProtectedRender()                  // politique pure
      anonymous → redirect('/?auth=required') · unavailable → <ServiceUnavailableView/> · authenticated → hydrate+children
```

- **`ServerSessionResolution`** (sans token) : `authenticated | anonymous | unavailable`. `200`→authenticated,
  `401`→anonymous, `403`/réseau/`5xx`/réponse invalide→unavailable (**jamais** anonymous). Défense **par le
  type** : `ReadOnlyServerCookieStore` n'expose que `get` ; `guardReadOnly` **lève** sur toute écriture.
- **Aucun refresh pendant le rendu** : Server Component **lecture seule** (`enableRefresh:false`) → un access
  expiré ⇒ anonymous (pas de rotation). Une future orchestration de refresh exigerait un contexte **writable
  distinct**, jamais introduite silencieusement.
- **Hydratation** : le profil obtenu est posé **directement** dans `authKeys.session()` (`prefillSessionQuery`)
  → `useSession` authentifié **dès le premier rendu**, **sans** second appel `/me`. Aucun token sérialisé.
- **Pas de middleware**, **pas de self-fetch** vers le BFF, **pas de QueryClient serveur global**.
- **Redirection (streaming)** : `redirect()` est délivré par Next via `NEXT_REDIRECT` (RSC) + `<meta
  http-equiv="refresh">` (HTTP 200) ; honoré par le navigateur. La preuve vérifie le **signal** + l'**absence
  de donnée privée** (le shell public éventuel ne contient aucune session). Détail :
  [`protected-routes.md`](protected-routes.md).

## 10c. Page de connexion & navigation (Web Auth 5)

Page **publique** `/login` (Server Component, `force-dynamic`) : assainit `returnTo` (`sanitizeReturnTo`),
résout la session **côté serveur** → **authentifié** ⇒ **redirige** vers `returnTo` (jamais de formulaire) ;
**anonyme** ⇒ rend `<LoginForm>` ; **unavailable** ⇒ formulaire + état dégradé (BFF = autorité à la
soumission). Login **uniquement via le BFF** : `performBffLogin` (CSRF → `POST /api/auth/login`,
`credentials:"include"`, **aucun token lu**). `useLogin` (`useMutation`, **sans `mutationKey`** → aucun
credential en clé) purge `authKeys` au succès puis `LoginPanel` navigue (`router.replace(returnTo)` +
`router.refresh()`). La redirection anonyme du layout protégé pointe désormais vers
`/login?returnTo=/protected`. **Aucun middleware, aucune Server Action, aucun token en JS, aucune URL externe
dans `returnTo`.** Détail : [`login-flow.md`](login-flow.md), [`protected-routes.md`](protected-routes.md) §4b.

## 11. Sécurité

`HttpOnly` (tokens inaccessibles au JS) ; refresh jamais renvoyé au navigateur ni loggé ; tokens validés
(non vides, sans caractères de contrôle) ; durées validées (finies, positives) ; `SameSite=None` sans
`Secure` rejeté ; `ApiClientError` n'expose jamais de token/cookie/Authorization ; sentinelles de test
vérifiées absentes des erreurs/logs/bundle.

## 12. Limites

- **Pas de transaction cookie** : `updateTokens` pose access **puis** refresh ; en cas d'échec partiel, le
  handler login exécute `clearSession()` en **compensation** (testé). Logout : suppression locale **toujours**
  appliquée (même API indisponible).
- Les `expiresAt` ne sont pas stockés (seul le `maxAge` l'est).
- **Web Auth 4** ajoute un **layout/route protégé** (résolution serveur read-only + hydratation, §10b) :
  **toujours aucun middleware, aucune page de connexion, aucun refresh pendant le rendu**. La redirection
  anonyme pointe vers `/?auth=required` (interne, sans `returnUrl` libre) en attendant la page login (Web Auth 5).
  L'**API reste l'autorité finale**.
- **`me`/`authorization` en read-only** : `enableRefresh:false` → un access expiré ⇒ **401 → anonymous**
  (pas de refresh silencieux sur une lecture). Le refresh reste explicite (route dédiée / relogin).
- **Replay de l'ancien refresh** : non rejoué via le BFF (le cookie ne porte que le token courant) ; la
  rotation/révocation côté API est couverte par les tests de l'API NestJS.
- Les Route Handlers (`app/api/auth/**`) + `core/auth/server/**` (liant `next/headers`) sont validés par
  **typecheck/build + preuve API réelle**, non par `node:test` ; la logique testable vit dans
  `core/auth/{handlers,csrf,http,client}` (handlers prenant `(Request, deps)`, client BFF navigateur
  testé via `fetch` mocké). `server-only` (npm) non utilisé (lève sous `node:test`) → frontière par
  `next/headers` + tests d'import statiques.

## 13. Prochaine étape

**Revue globale Auth Web (1 → 5)** : audit du **parcours complet** (public → login → privé), rejeu des
preuves, vérification cookies / CSRF / Origin / navigation / cache / SSR / hydratation, **classement des
dettes**, et décision sur la **stabilité V1** du socle Auth Web — **sans nouvelle fonctionnalité**. Voir
[`login-flow.md`](login-flow.md) (connexion), [`protected-routes.md`](protected-routes.md) (layout protégé +
`returnTo`), [`session-state.md`](session-state.md) (états/hydratation), [`tanstack-query.md`](tanstack-query.md)
(cache).
