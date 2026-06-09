# `@enistere/web-nextjs` — Web Core (starter minimal)

Socle **Web** d'Enistère : application **Next.js 16 (App Router)** en **TypeScript strict**,
consommant le design system **`@enistere/ui-kit`**. **Starter minimal V1** — aucune logique métier,
aucun appel réseau, aucune authentification.

> **Statut** : `STARTER_INITIALISE` (compile, build, lint, tests verts + serveur local vérifié).
> Source de vérité de pilotage : [`docs/project-status/`](../../docs/project-status/README.md).

---

## 1. Périmètre

### Inclus (V1)

- Next.js **App Router** + **TypeScript strict** (`strict`, `noUncheckedIndexedAccess`, …).
- Arborescence `app` / `core` / `shared` / `features`.
- **Server Components par défaut** (seul `app/error.tsx` est `"use client"`, contrainte Next).
- Layout racine, page technique d'accueil, `loading` / `error` / `not-found`, `manifest`.
- **Consommation réelle** du UI Kit (`@enistere/ui-kit` + `@enistere/ui-kit/styles.css`).
- Thème **clair par défaut** via `data-theme` (résolu par le UI Kit ; pas de bascule runtime).
- En-têtes de **sécurité de base** + suppression de `X-Powered-By`.
- Configuration d'environnement minimale (public vs serveur).
- Tests (node:test + Testing Library + jest-axe), build, lint, typecheck.

### Hors périmètre (V1) — volontairement absent

Auth / BFF / cookies `HttpOnly` / CSRF · login-refresh-logout · middleware d'auth · TanStack Query ·
Zustand · **Axios** · Orval · routes Files / upload multipart · Storybook · composants UI complexes ·
logique métier · OAuth / MFA · i18n complet · monitoring · workflow CI · Dockerfile · publication npm ·
**aucun type d'API recopié manuellement** · **aucun appel réseau réel**.

---

## 2. Stack & versions

| Brique | Version | Note |
| --- | --- | --- |
| Next.js | **16.2.7** | App Router · build par **Turbopack** |
| React / React DOM | **19** | version **unique** dans tout le monorepo |
| TypeScript | 5.7+ | `strict`, `noUncheckedIndexedAccess`, `noImplicitOverride` |
| Tests | `node:test` + `@testing-library/react` 16 + `jest-axe` + `global-jsdom` | pas de Vitest (0 vuln) |
| Lint | ESLint **9** (flat config) + `eslint-config-next` 16 | `next lint` retiré en Next 16 |

> **Pourquoi Next 16 / React 19** : Next 14.2.x traînait 4 advisories *high* sans correctif en
> 14.x ; le correctif npm était précisément `next@16`. Next 16 + React 19 ramène l'audit à **0
> vulnérabilité**. Le UI Kit a été aligné sur React 19 (voir [§10](#10-ui-kit--react-19)).

---

## 3. Arborescence

```
src/
  app/                      # App Router (compilé par Next uniquement)
    layout.tsx              # layout racine : importe les CSS, pose <html data-theme>
    page.tsx                # page d'accueil technique (Server Component)
    loading.tsx             # UI de chargement
    error.tsx               # frontière d'erreur ("use client" — reçoit reset)
    not-found.tsx           # UI 404
    manifest.ts             # manifeste web
    globals.css             # reset + structure (référence les variables du UI Kit)
  core/
    config/                 # public-config, server-config, metadata, theme (testables)
    api/ auth/ query/       # cadrage uniquement (README) — vides en V1
  shared/components/        # LoadingState / ErrorState / NotFoundState (UI Kit, testables)
  features/
    foundation-status/      # contenu de la page technique (testable)
  types/global.d.ts         # déclaration ambiante des imports CSS
test/                       # tests node:test (compilés à part vers build-test/)
```

---

## 4. Scripts

| Commande | Effet |
| --- | --- |
| `npm run dev` | serveur de dev (port **3100**) |
| `npm run build` | build de production (Turbopack) |
| `npm run start` | serveur de production (port 3100) |
| `npm run lint` | ESLint (flat config) |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run test` | compile `tsconfig.test.json` puis `node --test` |
| `npm run check` | typecheck + lint + test + build |

---

## 5. Conventions d'import (important)

Deux compilateurs cohabitent :

- **Next/Turbopack** (build du dossier `app/` + tsconfig `bundler`) ;
- **`tsc` nodenext** (compilation des tests vers `build-test/`, exécutés par `node --test`).

Règles :

- Les **fichiers de `test/`** importent la source via **`../src/.../x.js`** (extension `.js`
  obligatoire en `nodenext`).
- Les **fichiers `app/`** importent en **relatif sans extension** (`../shared/components/x`) :
  Turbopack ne mappe pas `.js → .tsx` par défaut.
- Les composants feuilles (`shared`, `features`) n'importent que des spécificateurs **nus**
  (`@enistere/ui-kit`, `react`) — donc aucun conflit d'extension.

`src/app/` est **exclu** de `tsconfig.test.json` : les fichiers App Router (CSS, layout) sont validés
par `next build` + une sonde HTTP locale, pas par `node:test`.

---

## 6. Environnement

Variables (voir [`.env.example`](.env.example)) — **aucune n'est requise en V1** :

- `APP_ENV`, `NEXT_PUBLIC_APP_NAME` : **publiques** (sûres côté client).
- `NEXT_PUBLIC_API_URL` : URL API publique — **commentée** (aucun appel en V1).
- `API_INTERNAL_URL` : **serveur uniquement** — jamais préfixée `NEXT_PUBLIC_`.

Règle : **aucun secret/token dans une variable `NEXT_PUBLIC_*`**. `core/config/public-config.ts` ne
lit que des valeurs publiques ; `core/config/server-config.ts` est réservé au serveur.

---

## 7. Thème

Le UI Kit résout les tokens via `data-theme` sur `<html>` : `:root` = **clair** (défaut),
`[data-theme="dark"]` = surcharges sombres. V1 fixe `data-theme="light"` dans `layout.tsx`
(pas de flash, pas de gestionnaire de thème, pas de persistance — prévu V2).

---

## 8. Sécurité

En-têtes appliqués à toutes les routes (`next.config.ts`) : `X-Content-Type-Options: nosniff`,
`Referrer-Policy`, `X-Frame-Options: DENY`, `X-DNS-Prefetch-Control: off`, `Permissions-Policy`.
`poweredByHeader: false` retire `X-Powered-By`. **CSP volontairement différée** (V2). Détails :
[`docs/SECURITY.md`](docs/SECURITY.md).

---

## 9. Tests

`node:test` (pas de second runner — voir ADR UI Kit) : configuration, thème, métadonnées,
`FoundationStatus`, états partagés, **a11y** (`jest-axe`), **non-régression de contraintes**
(dépendances interdites absentes), **résolution des paquets API** (compilation + `import.meta.resolve`,
sans appel réseau). La page d'accueil rend réellement des classes `enistere-*` (preuve de
consommation du UI Kit). Le serveur local est vérifié par sonde HTTP (statut, en-têtes, thème,
CSS, 404). Pas d'E2E lourd en V1.

---

## 10. UI Kit & React 19

L'intégration a aligné `@enistere/ui-kit` sur **React 19** (devDeps/types ; peer `react >=18`
inchangé, couvre 18 et 19). Les **64 tests** du UI Kit passent sous React 19 (aucune régression).
Voir le `CHANGELOG.md` racine.

---

## 11. Feuille de route (extraits V2)

Intégration des paquets API + hooks TanStack Query · BFF Auth (cookies `HttpOnly`, CSRF) ·
gestionnaire de thème · CSP à nonces · i18n · CI/CD.
