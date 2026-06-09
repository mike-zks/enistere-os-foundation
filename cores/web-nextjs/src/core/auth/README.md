# `core/auth` — fondations BFF Auth (serveur)

**Fondations serveur** de l'authentification Web (BFF). **Aucune authentification utilisateur n'est
encore disponible.**

## Présent (fondations)

- `cookie-config.ts` — noms (`enistere_access`/`refresh`), préfixe `__Host-` (prod), attributs
  (`HttpOnly`, `Secure` en prod, `SameSite=Lax`, `Path=/`, sans `Domain`), validation. Cadrage CSRF (noms seuls).
- `server-cookie-store.ts` — abstraction `ServerCookieStore` + `InMemoryCookieStore` (tests).
- `session-contract.ts` — contrat interne `WebAuthSession` + `sessionPresence` (présence, sans valeur).
- `web-session-adapter.ts` — `WebAuthSessionAdapter` (implémente `AuthSessionAdapter` : access/refresh en
  cookies `HttpOnly`).
- `server/` — **SERVER-ONLY** (`next/headers`) : `next-cookie-store.ts` (`cookies()`), `index.ts`
  (`getReadOnlyAuthApiClient` / `getWritableAuthApiClient`). **Exclus de node:test**, validés par typecheck/build.

Le **client API serveur authentifiable** est `core/api/server/create-authenticated-server-api-client.ts`
(par requête, modes `read-only` / `writable`).

## Absent (volontairement)

- **Routes Auth** (`/api/auth/login|refresh|logout|me|authorization`) — **aucune**.
- **CSRF opérationnel** — **absent** (cadrage uniquement).
- Middleware d'authentification, pages/formulaires de login, redirections Auth — **absents**.
- Hooks Auth TanStack Query, stockage navigateur — **absents**.
- **Aucun token exposé au navigateur, aucun login/refresh/logout réel.**

## Frontière à respecter

Le **client public** (`core/api/public/`) **ne doit pas** devenir le client authentifié. L'Auth utilise un
**BFF** + cookies `HttpOnly` + le **client serveur authentifié dédié** (jamais le singleton public).

> Détail : [`../../../docs/auth-architecture.md`](../../../docs/auth-architecture.md). Prochaine étape :
> **Web Auth 2** (login/refresh/logout via Route Handlers + CSRF).
