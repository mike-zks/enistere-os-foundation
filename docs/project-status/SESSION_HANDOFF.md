# SESSION_HANDOFF.md — Transfert de session (compact)

> Document court et exploitable pour démarrer une nouvelle conversation / un autre agent.
> **Source de vérité = le repository**, résumé par `docs/project-status/`. Vérifié le 2026-06-09.

## Bloc de démarrage (à copier en début de session)

```
Nous poursuivons Enistere OS Foundation.
Les fichiers du dossier docs/project-status/ sont la source officielle
de vérité. Lis-les avant toute recommandation et ne suppose aucune
implémentation absente de la matrice.
```

## 1. Projet

Enistere OS Foundation — monorepo de socles (cores) techniques + packages partagés + stratégie/ADR.

## 2. Objectif courant

Faire progresser les cores V1 **un par un**, en s'appuyant sur le API Core et les packages déjà
disponibles, sans régression et sans confondre spécification et implémentation.

## 3. État réel (résumé)

- **Implémenté** : **API Core NestJS** (auth, sessions, refresh, RBAC, permissions, audit, files
  S3/MinIO, logging Pino, OpenAPI canonique) — 377 tests unitaires + 101 e2e + revues. Statut :
  **IMPLEMENTATION_AVANCEE**.
- **En cours** : **UI Kit** (`@enistere/ui-kit`, **0.1.1**, privé) — design tokens **+ 6 primitives Web React**
  (Button, Input, Label, Text, Spinner, VisuallyHidden) pilotées par tokens, accessibles. React =
  peerDependency `>=18` ; **aligné et testé sous React 19** (64 tests, 100 %). CSS via
  `@enistere/ui-kit/styles.css`. Statut : **IMPLEMENTATION_PARTIELLE** ; **consommé par le Web Core**.
- **Partiel** : **Web Core** (`@enistere/web-nextjs`, 0.1.0, privé) — **Next 16 App Router + React 19**,
  TypeScript strict, Server Components par défaut, UI Kit consommé, thème clair via `data-theme`,
  en-têtes sécurité + pas de `X-Powered-By`. **Intègre l'API publique (Health)** : factory serveur par
  requête + client public navigateur (sans session, `enableRefresh:false`), **TanStack Query** (retry
  borné), **SSR + hydratation** (page `force-dynamic`, build indépendant de l'API). Expose les **flux BFF
  Auth** : `login`/`refresh`/`logout`/`csrf` via **Route Handlers** `/api/auth/*` — cookies `HttpOnly`
  access/refresh (jamais renvoyés au navigateur, `__Host-` prod), **CSRF double-submit** (cookie non
  HttpOnly + `X-CSRF-Token`, temps constant, rotation), **Origin/Referer** (fail-closed), corps borné,
  erreurs génériques, `X-Request-Id` propagé, logout idempotent. **Sans `me`/`authorization`, sans page,
  sans middleware, sans hook Auth.** **169 tests** + preuve **API réelle Auth** (PostgreSQL jetable).
  Statut : **IMPLEMENTATION_PARTIELLE**. Build/dev via **webpack** (`extensionAlias`). Note transport :
  le client serveur authentifié **bufferise le corps** (sinon le `fetch` patché de Next échouait sur les
  réponses non-2xx — `expected non-null body source`).
- **Packages** : `@enistere/api-contracts` et `@enistere/api-client-fetch` (0.1.0, privés) — validés
  **localement** (tests + live 16/16), **non publiés** ; `api-client-fetch` **instancié (public)** dans
  le Web Core (preuve API réelle), et **client authentifié** (BFF Auth login/refresh/logout) — preuve API réelle.
- **Documentaires (spéc seule, aucun starter)** : `cloud`, `mobile-react-native`.
- **Vides** : `ai-core`, `api-spring`, `docs-core`, `mobile-flutter`, `quality-core`, `web-angular`.
- **Absents** : CI/CD, conteneurisation.
- **Git** : `main` poussé sur `origin` (SSH). Commits récents : `feat(web-nextjs): implement secure auth BFF flows`,
  `feat(web-nextjs): establish server auth foundations`, `feat(web-nextjs): integrate public API and query layer`, baseline.
- **Audit** : **0 vulnérabilité** (TanStack Query v5 ; override `postcss ^8.5.15`).

## 4. Cores techniquement implémentés

`cores/api-nestjs/` (avancé), `cores/ui-kit/` (starter tokens + primitives, React 19) et
`cores/web-nextjs/` (Next 16 + UI Kit + API publique + TanStack Query, **IMPLEMENTATION_PARTIELLE**).

## 5. Cores documentaires

`cloud`, `mobile-react-native` (un `CORE_SPECIFICATION.md` chacun, **pas** de starter).
`ui-kit` et `web-nextjs` ont leur spéc **et** un starter.

## 6. Packages

`@enistere/api-contracts` (types OpenAPI, runtime-indépendant) ; `@enistere/api-client-fetch`
(client Fetch typé + wrappers : auth, erreurs, timeout, refresh, multipart). Workspaces npm
(`packages/*`, `cores/ui-kit`, `cores/web-nextjs`). **Non publiés** ; UI Kit **consommé** + `api-client-fetch`
**instancié (public/Health)** par le Web Core. Usage authentifié non encore intégré.

## 7. ADR clés

18 ADR **Validés** (001–016, 039, 040). Implémentés et revus : 002 (Prisma), 006 (RBAC), 007 (upload),
039 (Argon2id), 040 (logging). Partiels : 001 (monorepo), 003, **004** (session : adapter serveur Web posé),
**005** (cookies web + **CSRF** : flux BFF login/refresh/logout opérationnels, cookies `HttpOnly`, CSRF
double-submit, Origin/Referer — Web ; reste : autres mutations futures), **011** (Fetch instancié public +
**authentifié** Web), **012** (TanStack Query intégré Web), 016. Décidés non implémentés : 013, 014, 015.
**008/009/010 partiels** (UI Kit). ADR-017→038 = backlog non rédigé. Détail : [`DECISIONS_REGISTER.md`](./DECISIONS_REGISTER.md).

## 8. Dernière étape terminée

**Web Auth 2 — login, refresh, logout et protection CSRF du BFF** (`@enistere/web-nextjs`) : Route Handlers
`POST /api/auth/{login,refresh,logout}` + `GET /api/auth/csrf` (thin) → handlers testables
(`core/auth/handlers/*`, `(Request, deps)→Response`). **login** valide (corps borné/Origin/CSRF) → API →
pose cookies `HttpOnly` access/refresh (jamais renvoyés) + renouvelle CSRF + compensation `clearSession`
si écriture partielle. **refresh** : refresh cookie → 1 appel `/auth/refresh` → rotation des 2 cookies ;
échec → cookies supprimés + 401. **logout** : best-effort + **suppression locale toujours** (idempotent).
**CSRF** double-submit (cookie non HttpOnly + `X-CSRF-Token`, 256 bits, temps constant, rotation), **login
protégé contre login-CSRF**. **Origin/Referer** exact + fail-closed (`WEB_ALLOWED_ORIGINS`). Erreurs
génériques (jamais réponse brute), `X-Request-Id` propagé. **169 tests** (CSRF, Origin, validation, mapping,
4 handlers, isolation, **sentinelles**) + **preuve API réelle** (NestJS + PostgreSQL : login/refresh/logout,
cookies HttpOnly, CSRF, Origin, rotation, refresh-après-logout 401, bad-creds 401). **0 vuln**, Axios absent,
React 19.2.7 ; non-régression complète ; API NestJS non modifiée. Correctif transport (buffer du corps de
requête, `fetch(url, init)`) contre `expected non-null body source` sous le fetch patché de Next. Commit
`feat(web-nextjs): implement secure auth BFF flows`.

## 9. Prochaine étape

**Action unique** : **Web Auth 3** — `GET /api/auth/me`, `GET /api/auth/authorization`, hooks
`useSession`/`useAuthorization` (TanStack Query) + purge du cache au logout. Alternative : compléter le
UI Kit ou démarrer le Mobile Core. Détail : [`NEXT_ACTIONS.md`](./NEXT_ACTIONS.md).

## 10. Règles à ne pas violer

- Vérifier le repository ; ne jamais se fier au seul rapport précédent.
- Ne jamais inventer un starter ni déclarer « validé » sans tests + revue.
- Ne pas confondre ADR / spécification / preuve / package / intégration.
- Un seul core par mission ; ne pas modifier API Core ou packages sans mission dédiée.
- Signaler tout état Git non propre ; ne pas supprimer une preuve sans remplacement vérifié.
- Mettre à jour `docs/project-status/` + `CHANGELOG.md` en fin de mission.

## 11. Fichiers à lire (dans l'ordre)

1. `docs/project-status/SESSION_HANDOFF.md` (ce fichier)
2. `docs/project-status/FOUNDATION_CURRENT_STATE.md`
3. `docs/project-status/IMPLEMENTATION_MATRIX.md`
4. `docs/project-status/NEXT_ACTIONS.md`
5. `docs/project-status/DECISIONS_REGISTER.md`
6. Pour le API Core : `cores/api-nestjs/docs/API_CORE_V1_IMPLEMENTATION_STATUS.md`

## 12. Commandes utiles

```bash
# Vérifier l'état réel
git status --short
find cores -maxdepth 2 -type f | sort
ls packages/*/

# API Core (cores/api-nestjs/) — nécessite PostgreSQL + MinIO jetables pour e2e
npm run build && npm run lint && npm run test
npm run openapi:check

# Packages (racine)
npm install && npm run build && npm test && npm run generate:check

# UI Kit (cores/ui-kit/)
npm run test --workspace=@enistere/ui-kit

# Web Core (cores/web-nextjs/) — port 3100
npm run check --workspace=@enistere/web-nextjs   # typecheck + lint + test + build
```
