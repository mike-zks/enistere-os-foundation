# `core/auth` — BFF Auth (serveur)

Authentification Web via **BFF** : flux `login` / `refresh` / `logout` (+ bootstrap `csrf`) exposés par
des Route Handlers, protégés par cookies `HttpOnly`, Origin/Referer et **CSRF**.

## Présent

- **Fondations** (Web Auth 1) : `cookie-config`, `server-cookie-store` (+ `InMemoryCookieStore`),
  `session-contract`, `web-session-adapter` (`AuthSessionAdapter`), client serveur authentifiable
  (`core/api/server/create-authenticated-server-api-client.ts`, modes read-only/writable).
- **CSRF** (`csrf/`) : `csrf-token` (génération 256 bits, validation temps constant), `csrf-cookie`
  (non HttpOnly, `__Host-` prod).
- **HTTP** (`http/`) : `allowed-origins` (Origin/Referer, fail-closed), `read-body` (corps borné),
  `validate-login` (forme/bornes), `web-response` (enveloppe + mapping d'erreurs génériques + no-store).
- **Handlers** (`handlers/`, testables — `(Request, deps) → Response`) : `csrf`, `login`, `refresh`,
  `logout` + `security` (méthode/Origin/CSRF, rotation CSRF).
- **Routes** : `app/api/auth/{csrf,login,refresh,logout}/route.ts` (thin) + `server/route-deps.ts`
  (`next/headers`, SERVER-ONLY, exclu de node:test).

Détail : [`../../../docs/auth-architecture.md`](../../../docs/auth-architecture.md) et
[`../../../docs/csrf.md`](../../../docs/csrf.md).

## Absent (volontairement)

- `GET /api/auth/me`, `GET /api/auth/authorization` (Web Auth 3).
- **Page de connexion**, formulaire React, hooks TanStack Query Auth.
- **Middleware de protection** de routes privées, redirections Auth, RBAC UI.
- forgot/reset password, OAuth, MFA. **Aucun token Auth renvoyé au navigateur ; aucun token en JS.**

## Frontière

Le **client public** (`core/api/public/`) **ne devient jamais** le client authentifié. L'Auth utilise le
**client serveur authentifié dédié** (Bearer lu depuis le cookie `HttpOnly`).
