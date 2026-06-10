# `core/auth` — BFF Auth (serveur + état de session navigateur)

Authentification Web via **BFF** : flux `login` / `refresh` / `logout` (+ bootstrap `csrf`) et lectures
`me` / `authorization`, exposés par des Route Handlers, protégés par cookies `HttpOnly`, Origin/Referer
(mutations) et **CSRF**. L'**état de session** côté navigateur est dérivé via TanStack Query
(`features/auth`) à partir du **client BFF navigateur** (`client/`).

## Présent

- **Fondations** (Web Auth 1) : `cookie-config`, `server-cookie-store` (+ `InMemoryCookieStore`),
  `session-contract`, `web-session-adapter` (`AuthSessionAdapter`), client serveur authentifiable
  (`core/api/server/create-authenticated-server-api-client.ts`, modes read-only/writable).
- **CSRF** (`csrf/`) : `csrf-token` (génération 256 bits, validation temps constant), `csrf-cookie`
  (non HttpOnly, `__Host-` prod).
- **HTTP** (`http/`) : `allowed-origins` (Origin/Referer, fail-closed), `read-body` (corps borné),
  `validate-login` (forme/bornes), `web-response` (enveloppe + mapping d'erreurs génériques + no-store).
- **Handlers** (`handlers/`, testables — `(Request, deps) → Response`) : `csrf`, `login`, `refresh`,
  `logout` + `security` (méthode/Origin/CSRF, rotation CSRF), **`get-profile` / `get-authorization`**
  (GET-only, client **read-only**, erreurs génériques, `no-store`).
- **Routes** : `app/api/auth/{csrf,login,refresh,logout,me,authorization}/route.ts` (thin) +
  `server/route-deps.ts` (`next/headers`, SERVER-ONLY, exclu de node:test).
- **Client BFF navigateur** (`client/`) : `auth-bff-client` (`fetchSessionProfile`/`fetchAuthorization`,
  same-origin, `credentials:"include"`, envelope `{success,data}`, **aucun token lu/exposé**), `bff-error`
  (`BffAuthError`), `csrf-client`, `logout-client`.
- **État public** (`session-state.ts`) : `SessionState` (`loading`/`anonymous`/`authenticated`/`error`),
  `PublicAuthError`, `toPublicAuthError` (générique, sans cause/stack/token). Hooks dans `features/auth`.
- **Résolution serveur (Web Auth 4)** : `resolve-server-session.ts` (`resolveServerSession` read-only →
  contrat **sans token** `authenticated|anonymous|unavailable` ; `decideProtectedRender`),
  `read-only-cookie-store.ts` (`ReadOnlyServerCookieStore` get-only + `guardReadOnly` qui **lève** sur
  écriture), `request-id.ts` (`resolveRequestId` partagé). **Server-only** (exclu node:test) :
  `server/protected-session.ts` (`resolveNextServerSession` via `next/headers`) — consommé par le layout
  `app/(protected)/`.

Détail : [`../../../docs/auth-architecture.md`](../../../docs/auth-architecture.md),
[`../../../docs/protected-routes.md`](../../../docs/protected-routes.md),
[`../../../docs/csrf.md`](../../../docs/csrf.md),
[`../../../docs/session-state.md`](../../../docs/session-state.md).

## Absent (volontairement)

- **Page de connexion**, formulaire React (Web Auth 5).
- **Middleware de protection** de routes privées, redirection post-logout sophistiquée, Server Action Auth,
  RBAC d'administration, **refresh pendant le rendu serveur**, self-fetch serveur → BFF.
- forgot/reset password, OAuth, MFA. **Aucun token Auth renvoyé au navigateur ; aucun token en JS.**

> **Présent (Web Auth 4)** : **premier layout protégé** (`app/(protected)/`) résolu **côté serveur**
> (read-only) + hydratation ; redirection anonyme `/?auth=required` (temporaire) ; erreur d'indisponibilité.

## Frontière

Le **client public** (`core/api/public/`) **ne devient jamais** le client authentifié. Côté serveur, l'Auth
utilise le **client serveur authentifié dédié** (Bearer lu depuis le cookie `HttpOnly`) ; côté navigateur,
le **client BFF** (`client/`) parle **uniquement** à `/api/auth/*` (same-origin), **jamais** à l'API NestJS.
