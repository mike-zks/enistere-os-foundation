# WEB_AUTH_V1_REVIEW.md — Revue globale Auth Web (1 → 5)

> Revue **transverse de stabilisation** du socle d'authentification Web (incréments Web Auth 1 → 5), traité
> comme **un système unique**. **Aucune nouvelle fonctionnalité** ; vérification, rejeu des preuves,
> classement des dettes, verdict de stabilité. Hiérarchie de vérité : repository réel > tests/preuves
> exécutés > ADR > CORE_SPECIFICATION > strategy > checkpoint > README/rapports.

## 1. Commit revu

`447e3b5 feat(web-nextjs): add secure login experience` — branche `main`, synchronisée avec `origin/main`
(remote SSH). Working tree **propre** au démarrage.

## 2. Périmètre Auth 1 → 5

| Incrément | Apport |
|---|---|
| Web Auth 1 | Fondations serveur : client API serveur authentifiable **par requête**, cookies `HttpOnly`, `WebAuthSessionAdapter`, frontière serveur. |
| Web Auth 2 | Flux BFF **login / refresh / logout / csrf** (Route Handlers), **CSRF** double-submit, **Origin/Referer**, erreurs génériques. |
| Web Auth 3 | **Profil/autorisations** (`me`/`authorization` read-only), `useSession`/`useAuthorization`, server state TanStack Query, purge au logout. |
| Web Auth 4 | **Résolution Auth serveur read-only** + **layout protégé** (`/protected`) + hydratation. |
| Web Auth 5 | **Page `/login`** : formulaire accessible, login BFF, `returnTo` interne assaini, navigation `replace`/`refresh`. |

## 3. Architecture (réelle, vérifiée)

```
Navigateur → BFF Next.js (/api/auth/*) → API NestJS        (mutations + lecture navigateur)
Layout privé (Server Component) → cookies HttpOnly (read-only) → API NestJS /auth/me   (rendu privé)
```

Sources : `core/auth/{cookie-config,csrf,handlers,http,client,server,read-only-cookie-store,request-id,
resolve-server-session,return-to,session-state,web-session-adapter}`, `features/auth/*`, `app/api/auth/*`,
`app/(protected)/*`, `app/login/*`. **Aucun middleware.** Aucun fichier mort/dupliqué détecté à l'inventaire.

## 4. Routes (build : toutes `ƒ` dynamiques)

`/api/auth/{csrf,login,refresh,logout,me,authorization}` (Route Handlers minces → handlers testables
`(Request, deps)`), page `/protected` (layout `(protected)` + page technique), page `/login`. `/` et
`/manifest.webmanifest` publics. Build **indépendant de l'API**.

## 5. Cookies

`access`/`refresh` **distincts**, `HttpOnly`, `SameSite=Lax`, `Path=/`, **sans Domain**, `Secure` prod,
préfixe **`__Host-`** prod (validé : Secure + Path=/ + pas de Domain). `Max-Age` **issu de l'API** (tronqué
entier, rejet si ≤ 0). Cookie **CSRF** `httpOnly:false` (seul lisible JS), 4 h. Tokens validés (non vides,
sans caractères de contrôle — anti-injection d'en-tête). **Limite** : `updateTokens` non transactionnel →
compensé par `clearSession` (login) ; logout supprime **toujours** localement.

## 6. CSRF

Double-submit : jeton 256 bits base64url, **comparaison à temps constant** (longueur vérifiée d'abord),
format borné. **Rotation** après login/refresh, suppression au logout, `/csrf` (re)génère. **Mutations
protégées** : login, refresh, logout. **GET sans CSRF** : csrf, me, authorization (corrects). Prouvé runtime :
CSRF invalide → **403**.

## 7. Origin / Referer

`validateRequestOrigin` : `Origin` sinon origine du `Referer`, **fail-closed** (les deux absents → refus).
Comparaison **exacte** `scheme+host+port` (jamais `startsWith`/suffixe), wildcard rejeté, `WEB_ALLOWED_ORIGINS`
normalisé. Prouvé runtime : Origin invalide → **403**. Ordre de garde : méthode → corps/Content-Type →
Origin/Referer → CSRF → **API** (aucun appel API avant validation).

## 8. Tokens et données sensibles

`grep` (src) : `accessToken`/`refreshToken` **uniquement serveur** (`web-session-adapter`, `session-contract`,
handlers refresh/logout) ; `password` **uniquement** validation serveur (`validate-login`) + transit corps
login (`login-client`) + état local **transitoire** du formulaire ; **`localStorage`/`sessionStorage` : néant**;
`console.` **uniquement** dans les deux frontières d'erreur (`app/error.tsx`, `app/(protected)/error.tsx`) ;
**aucun en-tête `Authorization` posé côté client**. Aucun token dans hooks/props/clés de cache/URL/erreurs.

## 9. Bundle client

`grep` sur `.next/static` (build prod) : `API_INTERNAL_URL`, `DATABASE_URL`, `JWT_ACCESS_SECRET`,
`REFRESH_TOKEN_HASH_SECRET`, `S3_SECRET_ACCESS_KEY`, `enistere_access`, `enistere_refresh` → **tous absents**.
HTML/RSC privé : aucun token, aucun mot de passe (prouvé runtime). Frontière serveur par convention +
**test statique d'imports** (`server-only` non utilisé — incompatible `node:test`).

## 10. Session & cache

**Source de vérité** : navigateur → `GET /api/auth/me` ; rendu privé serveur → API `/auth/me` **directe** ;
autorité finale → **API NestJS**. **Aucune source concurrente.** États : `loading`/`authenticated`/`anonymous`
(401)/`error` (403/réseau)/`unavailable` (serveur 403/5xx/réseau). **401→anonymous, 403/5xx/réseau ≠
anonymous**, pas de flash, pas de faux `authenticated` après login. `authKeys`/`healthKeys` **disjoints**,
**aucun token/cookie/email/timestamp** dans les clés. **Purge** : login (`removeQueries(authKeys.all)` avant
navigation) et logout (Auth purgé, **Health conservé**). `QueryClient` serveur **par rendu** (aucun singleton,
aucune ISR/cache partagé pour le privé).

## 11. Résolution serveur (SSR privé)

`resolveServerSession` : cookie store **lecture seule** (`ReadOnlyServerCookieStore` get-only + `guardReadOnly`
qui **lève** sur écriture), client serveur `read-only` (`enableRefresh:false` → **aucun refresh**, **aucun
`Set-Cookie`**), appel **direct** `/auth/me` (**jamais** le BFF local). Classification : 200→authenticated,
401→anonymous, 403/5xx/réseau/réponse invalide→**unavailable** (jamais anonyme). **Aucun contenu privé** rendu
avant validation (prouvé : anonyme/indisponibilité → aucune donnée privée dans HTML/RSC). Hydratation : profil
seul, forme exacte de `useSession`, **aucun second `/me`**, aucun token sérialisé.

## 12. Login

Page `/login` (publique, `force-dynamic`) : assainit `returnTo`, résout la session → **déjà authentifié ⇒
redirige** (jamais de formulaire) ; anonyme ⇒ formulaire ; `unavailable` ⇒ formulaire + état dégradé. Login
**uniquement via le BFF** (`performBffLogin` : CSRF → `POST /api/auth/login`, `credentials:"include"`, **aucun
token lu**). `useLogin` (`useMutation` **sans `mutationKey`**) purge `authKeys` puis `router.replace(returnTo)`
+ `router.refresh()`. Erreurs **génériques** (401 **sans énumération** d'e-mail).

## 13. `returnTo` (anti open-redirect)

`sanitizeReturnTo` : chemin **interne** uniquement (sinon `/protected`) — refuse hôte/schéma externes, `//`,
`\`, `..`, contrôle/espaces, encodages trompeurs, routes Auth/API (anti-boucle), via parsing sur **origine
sentinelle** + décodage de contrôle. Prouvé runtime : `returnTo=https://evil…` → **cible réelle `/protected`**
(`NEXT_REDIRECT;replace;/protected` + meta-refresh) ; `evil` n'apparaît que **reflété** dans l'état du routeur
(JSON échappé), **jamais suivi**.

## 14. Logout

CSRF → `POST /api/auth/logout` → **suppression locale systématique** (access/refresh + CSRF), appel API
best-effort (idempotent), purge `authKeys.all` (**Health conservé**). Prouvé : `/me` → **401** après logout ;
`/protected` → **redirection `/login`**.

## 15. Refresh

`POST /api/auth/refresh` : Origin/Referer → CSRF → refresh cookie → API → **rotation access/refresh + CSRF** ;
échec → cookies supprimés + 401 générique ; **un seul** appel (aucune boucle). **Jamais déclenché** par `/me`
read-only (prouvé runtime), ni en Server Component, ni sur 403. Prouvé : refresh → `refreshed:true`, **cookie
access roté**, `/me` 200 ensuite.

## 16. RBAC (ADR-006)

`roles`/`permissions` lus via BFF (`/authorization`), helpers exact/OR/AND **sans wildcard** (affichage
conditionnel — **API = autorité finale**). **Changement de droits sans nouveau JWT** : retrait de rôle en base
→ `/authorization` reflète **immédiatement** sur la même session, `/me` reste **200** (auth ≠ rôle) — rejoué
runtime.

## 17. Contrats OpenAPI (ADR-016)

Types profil/autorisations via `SchemaOf<>` (aucun DTO/manuel) ; operationId/paths stabilisés ; **`generate:check`
= up-to-date** ; aucun modèle Prisma exposé. Dépendance à sens unique respectée.

## 18. Erreurs & request id

Quatre mappeurs **spécifiques par couche, cohérents** (pas de duplication accidentelle) : `web-response`
(`ApiClientError` → réponse BFF, serveur), `session-state.toPublicAuthError` (`BffAuthError` → session navigateur),
`login-error.toLoginError` (`BffAuthError` → login, **401 sans énumération**), `resolve-server-session`
(`ApiClientError` → résolution serveur). Tous **génériques** (jamais cause/stack/réponse brute/token).
**Request id** : `resolveRequestId` (pur, partagé) propagé navigateur → BFF → API → réponse **et** Server
Component (`headers()`) → résolveur → API (prouvé : en-tête entrant retrouvé dans les logs API).

## 19. Frontières client/serveur

Aucun Client Component n'importe `server-config`/`api/server`/`auth/server`/`auth/handlers`/`next/headers`/
`resolve-server-session`/`protected-session` (grep + **test statique** `auth-boundaries.test.ts`, étendu à la
surface login). Un seul barrel (`core/auth/server/index.ts`, server-only). **BFF non générique** : opérations
définies uniquement, pas de proxy arbitraire, pas de transmission brute des en-têtes entrants.

## 20. Validations (baseline, ×2)

`npm run check` web (typecheck + lint + **263 tests** + build) ; **tests exécutés 2×** (~5,0 s & ~5,3 s) —
**aucune instabilité, aucun hang** (le timer GC de mutation est neutralisé en test, cf. §23). Couverture
**≈ 86,1 % lignes / 87,8 % branches / 81,5 % fonctions**. UI Kit **64/64**, api-contracts **11/11**,
api-client-fetch **29/29**, `tokens:check`/`generate:check` up-to-date, **`npm audit` 0 vulnérabilité**,
Axios/Zustand **absents**, React 19.2.7 / TanStack Query 5.101.0 uniques.

## 21. Runtime réel (preuve rejouée, un système unique)

NestJS + PostgreSQL jetable, utilisateur de preuve **éphémère**, environnement **démonté** — scénario nominal
+ erreurs + refresh + droits, **33 assertions / 0 échec** : (1) anonyme `/protected` → redirection
`/login?returnTo=/protected` sans donnée privée ; (2) `/login` → 200 + formulaire ; (3) login BFF →
`authenticated` (aucun token, cookie `HttpOnly`) ; (4) authentifié `/protected` → 200 + profil hydraté,
X-Request-Id propagé, aucun mot de passe ; (5) `/authorization` rôle `administrator` (aucun token) ; (6)
**`/me` read-only sans `/auth/refresh`** ; refresh → `refreshed:true`, **cookie access roté**, `/me` 200 ;
(7) **droits sans nouveau JWT** (retrait de rôle → `/authorization` vidé sur la même session, `/me` toujours
200) ; (8) authentifié `/login` + `returnTo` externe → cible `/protected` (**aucun open redirect**) ; (9)
logout → `/me` 401 + `/protected` → `/login` ; (10) identifiants invalides → **401 générique**, CSRF invalide
→ **403**, Origin invalide → **403** ; (11) API arrêtée → `/protected` « Service indisponible » (≠ anonyme,
aucune donnée privée), `/login` formulaire dégradé ; (12) bundle sans secret.

## 22. Concurrence / multi-client

Isolation **par requête** (aucune session globale, aucun QueryClient serveur partagé — testé A/B). Double
soumission login **empêchée** (verrou `useRef` + bouton désactivé — testé). Refresh : **single-flight** côté
`api-client-fetch` (un seul `/auth/refresh` pour N 401 concurrents). **Multi-onglets** : pas de synchronisation
inter-onglets (BroadcastChannel) — un logout dans un onglet n'invalide le cache d'un autre qu'au prochain
refetch/navigation (la résolution serveur reste autorité au rendu). **Classé NON BLOQUANT / documenté** (pas
une faille : l'API reste l'autorité ; aucune opération protégée n'est accordée par le cache).

## 23. Défauts détectés & corrections

| # | Défaut | Gravité | Correction |
|---|---|---|---|
| 1 | Test `useLogin` : la mutation réglée programmait un **timer GC ref de 5 min** (gcTime mutation par défaut) maintenant le process `node --test` en vie ~300 s après la fin des tests | IMPORTANTE (CI/DX ; pas une faille) | `createTestQueryClient` impose `gcTime: Infinity` **aussi aux mutations** (corrigé dans `447e3b5`). Vérifié : suite en ~5 s, ×2. |

Aucun **défaut de sécurité** détecté. Aucune correction de code applicatif nécessaire dans cette revue (le
seul correctif, test-only, était déjà inclus dans le commit de Web Auth 5). Le faux échec initial du rejeu
runtime (`DELETE "UserRole"`) était une **erreur de script de preuve** (table réelle `user_roles`), corrigée.

## 24. Dettes

**BLOQUANTES pour la stabilité Auth V1 : AUCUNE.**

| Dette | Classe |
|---|---|
| Absence d'**E2E navigateur permanent** (Playwright) — flux validés au niveau handler/transport + preuve runtime scriptée | **IMPORTANTE** |
| Absence de **CI** : non-régression + **ordre de build monorepo** (`packages/*/dist` non versionnés) non imposés | **IMPORTANTE** |
| **Redirections en streaming** : `redirect()` délivré en **HTTP 200** (RSC `NEXT_REDIRECT` + meta-refresh), non 307 — sûr (cibles internes, aucune donnée privée), mais à **documenter pour proxys/tests** | IMPORTANTE (documenté) |
| Fenêtre `staleTime` session/autorisations (30 s) : un changement de droits peut n'être reflété côté **cache navigateur** qu'après refetch — **API reste autorité** (display-only) | NON BLOQUANTE (documenté) |
| **Multi-onglets** sans synchronisation (cf. §22) | NON BLOQUANTE (documenté) |
| **Logger Web structuré** absent (`console.error` limité aux frontières d'erreur) | NON BLOQUANTE |
| Couverture plus faible : `use-health`, branches `session-state`/messages | NON BLOQUANTE |
| Patch `next 16.2.7 → 16.2.9` (non sécuritaire ; audit 0) | NON BLOQUANTE |
| **CSP** à nonces, **rate limiting au BFF** (l'API limite déjà → 429 mappé), **HSTS**, observabilité | POST-V1 |

**Anti-patterns recherchés — tous ABSENTS** : middleware autoritaire, singleton Auth/QueryClient serveur,
token en état React / cache / props / URL, types API manuels, redirect dans un hook transport, permission dans
le JWT (lues en direct, changement sans JWT prouvé), `fetch` API direct depuis un composant, `API_INTERNAL_URL`
côté client, client public utilisé pour l'Auth, clé de cache contenant un token, self-fetch serveur → BFF.

## 25. Corrections appliquées (cette mission)

**Aucune correction de code applicatif** (aucun défaut le justifiant). Corrections **documentaires** : création
de ce rapport + mise à jour du checkpoint. Le correctif test (`gcTime` mutation) appartenait déjà au commit
`447e3b5`. `packages/`, `api-nestjs/` et les autres cores **non modifiés**.

## 26. Risques résiduels

Reproductibilité build sans CI ; dérive de contrat si l'API évolue sans régénération (`generate:check` non
automatisé) ; frontière serveur par convention (`server-only` non utilisé) ; sémantique streaming-redirect à
intégrer dans d'éventuels proxys ; durcissement production (CSP/HSTS/observabilité) différé.

## 27. Limites explicites

Pas d'E2E navigateur permanent ; pas de synchronisation multi-onglets ; redirections délivrées en 200
(streaming) ; pas de logger Web structuré ; CSP/rate-limiting BFF/HSTS différés ; la connexion mène toujours à
la page **technique** `/protected` (aucune page métier).

## 28. Statut

- **Bloc Auth Web** : verdict **§29**.
- **Web Core (global)** : **`IMPLEMENTATION_PARTIELLE`** — inchangé (la stabilité du bloc Auth n'augmente pas
  le statut global : manquent états UI/composants structurels, formulaires standardisés, Files, observabilité,
  CI/CD, déploiement).

## 29. Verdict Auth V1

```
AUTH_WEB_V1_STABLE_WITH_RESERVATIONS
```

**Aucun défaut de sécurité bloquant** : pas de fuite de token (source/HTML/RSC/bundle), session cohérente
(401→anonymous, 403/5xx/réseau distincts), **aucun open redirect** (prouvé), CSRF complet sur les mutations +
Origin/Referer fail-closed, **aucun contenu privé** exposé avant validation, caches isolés et purgés, droits
dynamiques sans nouveau JWT, contrats OpenAPI = source de vérité, **263 tests fiables (×2)** + **runtime 33/33**.
**Réserves précises avant production** : (a) ajouter une **CI** (non-régression + ordre de build des paquets) ;
(b) ajouter un **E2E navigateur** (Playwright) ; (c) traiter la **sémantique streaming-redirect** dans les
proxys/monitoring ; (d) décider de la **synchronisation multi-onglets** et de la fenêtre `staleTime` ; (e)
durcissement **CSP / HSTS / observabilité**. Ces réserves sont **opérationnelles**, non des défauts de
correction/sécurité.

## 30. Prochaine action unique

**Web Core — cadrage et implémentation des états UI et composants structurels manquants** (états
`loading`/`empty`/`error`/`success` standardisés, système de formulaires, composants réutilisables — cf.
`CORE_SPECIFICATION.md` §3/§4). La connexion et l'espace protégé fournissent désormais une **surface réelle**
à standardiser. **Alternative** (selon priorité produit) : intégration **Files** minimale. **Recommandé en
parallèle (réserve V1)** : **CI minimale** (ADR-013) + amorce **E2E navigateur**. **Ne pas** poursuivre l'Auth
avec des fonctionnalités post-V1 (register/reset/OAuth/MFA).

---

> **Verdict** : **`AUTH_WEB_V1_STABLE_WITH_RESERVATIONS`**. Le socle Auth Web (1 → 5) est **sûr, cohérent et
> exploitable** ; aucune fuite, aucun open redirect, aucune incohérence de session, aucun contenu privé exposé.
> Réserves **opérationnelles** (CI, E2E, streaming-redirect, multi-onglets, durcissement) avant production. Web
> Core global **maintenu** `IMPLEMENTATION_PARTIELLE`. Prochaine action : **états UI & composants structurels**.
