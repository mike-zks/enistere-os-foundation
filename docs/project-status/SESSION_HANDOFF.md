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
  borné), **SSR + hydratation** (page `force-dynamic`, build indépendant de l'API). Pose les **fondations
  serveur du BFF Auth** : client API **authentifiable** par requête (distinct du public), **cookies
  `HttpOnly`** (access/refresh distincts, `__Host-` prod), **`WebAuthSessionAdapter`**, modes
  **read-only/writable** — **sans route Auth, sans CSRF, sans login/refresh/logout réels, aucun token au
  navigateur**. **112 tests** + preuve **API réelle** (PostgreSQL jetable). Statut :
  **IMPLEMENTATION_PARTIELLE**. Build/dev via **webpack** (`extensionAlias` ; Turbopack ne résout pas `.js`).
- **Packages** : `@enistere/api-contracts` et `@enistere/api-client-fetch` (0.1.0, privés) — validés
  **localement** (tests + live 16/16), **non publiés** ; `api-client-fetch` **instancié (public)** dans
  le Web Core (preuve API réelle), et **session adapter authentifié** posé (fondations, non exposé).
- **Documentaires (spéc seule, aucun starter)** : `cloud`, `mobile-react-native`.
- **Vides** : `ai-core`, `api-spring`, `docs-core`, `mobile-flutter`, `quality-core`, `web-angular`.
- **Absents** : CI/CD, conteneurisation.
- **Git** : `main` poussé sur `origin` (SSH). Commits récents : `feat(web-nextjs): establish server auth foundations`,
  `feat(web-nextjs): integrate public API and query layer`, `feat(web-nextjs): initialize minimal starter`, baseline.
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
**005** (cookies web : config + session adapter posés ; **CSRF + routes absents**), **011** (Fetch instancié
public + session authentifiée Web), **012** (TanStack Query intégré Web), 016. Décidés non implémentés :
013, 014, 015. **008/009/010 partiels** (UI Kit). ADR-017→038 = backlog non rédigé. Détail : [`DECISIONS_REGISTER.md`](./DECISIONS_REGISTER.md).

## 8. Dernière étape terminée

**Web Auth 1 — fondations BFF, session serveur et cookies** (`@enistere/web-nextjs`) : architecture **BFF**
documentée ; **client API serveur authentifiable** par requête (`createAuthenticatedServerApiClient`,
distinct du public, `API_INTERNAL_URL`, no-store, X-Request-Id) ; **`WebAuthSessionAdapter`** (implémente
`AuthSessionAdapter`) sur une **abstraction `ServerCookieStore`** (+ adaptateur `next/headers` async,
+ store mémoire de test) ; **config cookies** (`enistere_access`/`refresh` distincts, `HttpOnly`,
`Secure` prod, `SameSite=Lax`, `Path=/`, **`__Host-` prod**, durées issues de l'API, validations) ; modes
**read-only (refresh off) / writable (refresh activable)** ; **aucune session globale SSR** (isolation A/B
testée). **Hors périmètre tenu** : aucune route Auth, **aucun CSRF actif**, aucun login/refresh/logout
réel, **aucun token au navigateur**, aucun log de token. **112 tests** (cookies, store, adapter, factory,
isolation, **frontières d'import statiques**, **sentinelles** non fuitées). **0 vuln**, Axios absent,
React unique 19.2.7 ; UI Kit/API Core/packages non régressés. `server-only` (npm) non utilisé (incompatible
node:test) → frontière par `next/headers` + tests statiques. Commit `feat(web-nextjs): establish server auth foundations`.

## 9. Prochaine étape

**Action unique** : **Web Auth 2** — `login`/`refresh`/`logout` via **Route Handlers BFF** (`/api/auth/*`),
pose **réelle** des cookies (fondations Web Auth 1) + **CSRF opérationnel** (mode writable). Alternative :
compléter le UI Kit ou démarrer le Mobile Core. Détail : [`NEXT_ACTIONS.md`](./NEXT_ACTIONS.md).

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
