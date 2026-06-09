# Architecture Auth Web — fondations BFF (Web Auth 1)

> **Fondations serveur uniquement.** Aucune route Auth fonctionnelle, aucun login/refresh/logout réel,
> aucun middleware, **aucun CSRF actif**. Aucune authentification utilisateur n'est encore disponible.
> ADR-004 (session multi-client), ADR-005 (cookies/CSRF), ADR-011 (Fetch).

## 1. BFF (Backend-for-Frontend)

```
Navigateur
   ↓  (same-origin, cookies HttpOnly)
Route Handlers Next.js  /api/*        ← (V2 — non implémentés)
   ↓  (client API serveur authentifiable, par requête)
API Core NestJS  /auth/*
```

Le navigateur **ne parle jamais directement** aux endpoints Auth NestJS. Les tokens transitent via des
cookies `HttpOnly` posés par les Route Handlers Next.js (V2). Le BFF permet : refresh token inaccessible
au JS, cookies same-origin, contrôle CSRF centralisé (futur), API interne non exposée publiquement,
adaptation de la réponse Auth avant retour navigateur, propagation `X-Request-Id`.

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

## 8. Refresh (futur)

Aucun refresh réel n'est déclenché en Web Auth 1. Le refresh **coordonné single-flight** est fourni par
`@enistere/api-client-fetch` ; le `WebAuthSessionAdapter.updateTokens` posera les cookies avec les durées
de l'API. Activé seulement en mode `writable` (Route Handlers, V2).

## 9. CSRF (futur — cadrage uniquement)

**Aucune protection CSRF active.** En V2 : validation `Origin`/`Referer`, token CSRF (cookie + en-tête
`X-CSRF-Token`) sur les méthodes mutatives (login/refresh/logout), rotation. Des noms de constantes
(`CSRF_COOKIE_NAME`, `CSRF_HEADER_NAME`) sont réservés pour éviter une future duplication — **ils
n'activent aucun mécanisme**.

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

- **Pas de transaction cookie** : `updateTokens` pose access **puis** refresh ; en cas d'échec partiel,
  le code appelant doit `clearSession()`.
- Les `expiresAt` ne sont pas stockés (seul le `maxAge` l'est).
- Les modules `core/auth/server/**` (liant `next/headers`) sont validés par **typecheck/build**, non par
  `node:test` (ils requièrent le contexte de requête Next). `server-only` (npm) n'est pas utilisé (il lève
  à l'import sous `node:test`) : la frontière est garantie par `next/headers` + des **tests d'import statiques**.

## 13. Prochaine étape

**Web Auth 2** — `login` / `refresh` / `logout` via **Route Handlers BFF** (`/api/auth/*`), pose réelle
des cookies, **CSRF opérationnel**, puis `me` / `authorization`.
