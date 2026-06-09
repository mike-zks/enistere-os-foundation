# Architecture Auth Web — BFF (Web Auth 1 + Web Auth 2)

> **Flux Auth BFF disponibles** : `login` / `refresh` / `logout` (+ bootstrap `csrf`), protégés par
> cookies `HttpOnly`, Origin/Referer et **CSRF opérationnel**. **Profil/autorisations (`me`,
> `authorization`) NON implémentés**, **aucune page de connexion**, **aucun middleware de route privée**,
> aucun hook TanStack Query Auth. ADR-004 (session), ADR-005 (cookies/CSRF), ADR-011 (Fetch).

## 0. Flux réels (Web Auth 2)

| Route | Méthode | Rôle |
| --- | --- | --- |
| `/api/auth/csrf` | GET | Bootstrap : pose le cookie CSRF (non HttpOnly) + renvoie le jeton. |
| `/api/auth/login` | POST | Valide (body/Origin/CSRF) → API NestJS → pose les cookies `HttpOnly` access/refresh, renouvelle le CSRF. |
| `/api/auth/refresh` | POST | Lit le refresh cookie → API `/auth/refresh` → **rotation** des deux cookies + CSRF. |
| `/api/auth/logout` | POST | API `/auth/logout` (best-effort) → **supprime toujours** les cookies (Auth + CSRF). |

Réponses navigateur : **jamais de token** (`{ success, data:{ authenticated|refreshed|loggedOut }, requestId }`).

## 1. BFF (Backend-for-Frontend)

```
Navigateur
   ↓  (same-origin ; cookies HttpOnly Auth + cookie CSRF lisible ; en-tête X-CSRF-Token)
Route Handlers Next.js  /api/auth/*   (login | refresh | logout | csrf)
   ↓  (client API serveur authentifiable, PAR REQUÊTE — Bearer lu du cookie)
API Core NestJS  /auth/*
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
- Pas de `me`/`authorization`, pas de middleware de route privée, pas de page de connexion, pas de hook
  TanStack Query Auth (Web Auth 3).
- **Replay de l'ancien refresh** : non rejoué via le BFF (le cookie ne porte que le token courant) ; la
  rotation/révocation côté API est couverte par les tests de l'API NestJS.
- Les Route Handlers (`app/api/auth/**`) + `core/auth/server/**` (liant `next/headers`) sont validés par
  **typecheck/build + preuve API réelle**, non par `node:test` ; la logique testable vit dans
  `core/auth/{handlers,csrf,http}` (handlers prenant `(Request, deps)`). `server-only` (npm) non utilisé
  (lève sous `node:test`) → frontière par `next/headers` + tests d'import statiques.

## 13. Prochaine étape

**Web Auth 3** — `GET /api/auth/me`, `GET /api/auth/authorization`, hooks `useSession`/`useAuthorization`
(TanStack Query) et purge du cache au logout.
