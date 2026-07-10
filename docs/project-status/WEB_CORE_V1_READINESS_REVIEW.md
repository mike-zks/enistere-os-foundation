# WEB_CORE_V1_READINESS_REVIEW.md — Verdict de maturité Web Core Next.js V1

> Branche : `web-core-v1-readiness-review`. Date de revue : 2026-07-10.
> **Mise à jour : 2026-07-10 (post V1 Gap 3)** — critère #9 fermé, readiness **14/14 — V1 pleinement stable**.
> Sources : `CORE_SPECIFICATION.md` (§56 critères V1, §9 modules obligatoires, §10 modules optionnels),
> `strategy/04_ROADMAP_GLOBAL.md` (§10 V1), `FOUNDATION_CURRENT_STATE.md`, `IMPLEMENTATION_MATRIX.md`,
> `cores/web-nextjs/docs/WEB_CORE_V1_INCREMENT_REVIEW.md`, `e2e/`, `src/`.

---

## 1. Contexte et objectif

La revue précédente (`WEB_CORE_V1_INCREMENT_REVIEW.md`) avait conclu à
`WEB_CORE_V1_INCREMENT_STABLE_WITH_RESERVATIONS` avec deux dettes principales : CI navigateur
permanente et couverture E2E des chemins écriture Files. Ces deux points sont désormais résolus
(14 tests E2E Playwright — Health/Auth/Files lecture+liste+upload+suppression, CI niveau 3
`web-e2e-ci.yml` en place).

L'objectif de cette revue est de statuer précisément : **le Web Core peut-il être déclaré "V1
stable" selon ses propres critères d'acceptation** (`CORE_SPECIFICATION.md` §56) ?

---

## 2. Méthodologie

Évaluation critère par critère de la section **§56. Critères d'acceptation V1** (14 items
exhaustifs). Pour chaque critère : état constaté par lecture du code source (`src/`), tests (`e2e/`
+ unit), CI et documentation. Les décisions ADR qui remplacent un module prévu sont explicitement
distinguées des gaps réels.

---

## 3. Analyse §56 — Critères d'acceptation V1 (14 items)

### 3.1 ✅ Le starter web démarre avec Next.js

**SATISFAIT.** Build CI (`web-nextjs` dans `ci.yml`) vert sur toutes les branches. `next build`
déterministe, `next start` en dev disponible. App Router structurée sous `src/app/`.

### 3.2 ✅ App Router est opérationnel

**SATISFAIT.** Routing App Router en place : Server Components par défaut, Client Components
explicitement marqués `"use client"`, séparation `layout.tsx` / `page.tsx` respectée, `loading.tsx`
et `error.tsx` à la racine, `not-found.tsx` global.

### 3.3 ✅ Les layouts standards existent (fermé V1 Gap 2)

**SATISFAIT.** Structure cible (§8) : route groups `(public)/`, `(auth)/`, `(dashboard)/`.
État post V1 Gap 2 : groupe `(public)/` avec layout public (header nav + footer) — créé Gap 1.
Groupe `(protected)/` avec layout serveur (session read-only) + `DashboardShell` (header nav
protégé — Accueil/Fichiers/Envoyer) — créé Gap 2. Critère §56 #3 **fermé**.

### 3.4 ✅ L'auth flow est fonctionnel

**SATISFAIT.** BFF login/logout complet (`/api/auth/login`, `/api/auth/logout`, `/api/auth/me`),
cookies HttpOnly Secure SameSite, session vérifiée côté serveur, middleware Next.js (`middleware.ts`)
pour redirection automatique. Couverture E2E : `loginViaUi` stable sur 14 tests.

### 3.5 ✅ Les routes protégées sont fonctionnelles

**SATISFAIT.** Middleware intercepte toutes les routes `/protected/**` et `/api/**` (hors
endpoints publics). Vérification session serveur dans chaque Server Component sensible. Tests E2E :
accès non authentifié vérifié (redirect `/login`).

### 3.6 ✅ La session est sécurisée selon stratégie retenue

**SATISFAIT.** Stratégie retenue : access token en mémoire (côté serveur via BFF), refresh par
cookie HttpOnly Secure SameSite=Strict. Aucun token dans `localStorage`. Aucun `NEXT_PUBLIC_*`
exposant des secrets. Vérification `expectNoSensitiveLeak` dans 14 tests E2E.

### 3.7 ✅ La stratégie CSRF est documentée si cookies utilisés

**SATISFAIT.** CSRF token double-submit sur toutes les mutations BFF (upload, suppression,
quarantaine, restauration). Vérification `Origin` + `Referer` dans handlers BFF. Documenté dans
`SECURITY.md` et `CORE_SPECIFICATION.md` §15.

### 3.8 ✅ L'API client gère les erreurs

**SATISFAIT.** `createApiClient` / `createServerApiClient` : classification erreurs (`classifyApiError`,
`classifyFileError`), types erreurs exhaustifs, retry configuré, erreurs déshydratées proprement via
TanStack Query. 446 tests unitaires couvrant les chemins d'erreur principaux.

### 3.9 ✅ Les formulaires et validations fonctionnent (fermé V1 Gap 3)

**SATISFAIT.** `UploadForm` migré sur React Hook Form v7 + Zod v4 (V1 Gap 3 — 2026-07-10).
Schéma Zod (`uploadFormSchema`) : `file` (`z.instanceof(File)`), `category` (`z.enum`), `subjectId`
(`z.string().max(128)`). `useForm({ resolver: zodResolver(uploadFormSchema) })` : erreurs via
`formState.errors`, `aria-describedby` sur chaque champ, submit bloqué si validation échoue.
Modules §9 "React Hook Form" et "Zod" désormais présents. 4 tests unitaires couvrent les cas
de validation. **Critère §56 #9 fermé.**

### 3.10 ✅ Les états loading/error/empty sont standardisés

**SATISFAIT.** Composants partagés : `LoadingState`, `ErrorState`, `EmptyState`, `NotFoundState`.
Utilisés systématiquement dans tous les chemins Files (liste, détail, admin). Couverture test :
états vérifiés en unit et E2E.

### 3.11 ✅ Le SEO baseline est présent pour pages publiques

**SATISFAIT (V1 Gap 1 — 2026-07-10).** Route group `(public)/` créé. Landing page statique à `/` :
`metadata.robots = { index: true, follow: true }`, `openGraph` minimal, titre "Enistère OS Foundation".
`robots.ts` : `allow: ["/", "/status"]`, `disallow: ["/protected/", "/api/", "/login"]`. `sitemap.ts` :
liste `/` (priority 1) et `/status` (priority 0.5). Page technique `/status` hérite `noindex` du root
layout. §12 : "metadata pour pages publiques" — satisfait. §56 critère #11 **fermé**.

### 3.12 ✅ Les dashboards/backoffices sont non indexables

**SATISFAIT.** `middleware.ts` + `manifest.ts` (`robots: [{ rule: "noindex" }]`) sur les routes
protégées. Vérifié dans `e2e/` (`expectNoSensitiveLeak`).

### 3.13 ✅ Aucun secret n'est exposé au client ou au bundle

**SATISFAIT.** Variables `NEXT_PUBLIC_*` strictement limitées à l'URL de l'API publique. Aucun
token, URL signée, `storageKey`, `X-Amz-Signature` ou `API_INTERNAL_URL` dans le HTML rendu —
vérifié sur 14 chemins E2E via `expectNoSensitiveLeak`. CI niveau 1 `audit` détecte les
dépendances vulnérables.

### 3.14 ✅ La documentation minimale existe

**SATISFAIT.** Présents et à jour : `CORE_SPECIFICATION.md`, `ARCHITECTURE.md`, `SECURITY.md`,
`DEPENDENCIES.md`, `IMPLEMENTATION_MATRIX.md`, `FOUNDATION_CURRENT_STATE.md`, `NEXT_ACTIONS.md`,
`SESSION_HANDOFF.md`, `CHANGELOG.md`. ADR structurants : ADR-009 (UI Kit), ADR-013 (branch
protection), ADR-014 (GHCR registry).

---

## 4. Modules obligatoires §9 — état actuel

| Module §9                        | État          | Note                                              |
|----------------------------------|---------------|---------------------------------------------------|
| Structure Next.js App Router     | ✅ Présent    | `src/app/` structurée                             |
| Layouts standards                | ✅ Présent    | `(public)` + `(protected)` avec `DashboardShell` |
| Routing protégé                  | ✅ Présent    | Middleware + server check                         |
| Auth flow                        | ✅ Présent    | BFF complet HttpOnly                              |
| Session handling                 | ✅ Présent    | Token mémoire + refresh cookie                    |
| API client                       | ✅ Présent    | `createApiClient` + `createServerApiClient`       |
| Gestion erreurs API              | ✅ Présent    | Classification typée exhaustive                   |
| TanStack Query / server state    | ✅ Présent    | TanStack Query v5, HydrationBoundary              |
| State local minimal              | ✅ Présent    | `useState` et hooks dédiés                        |
| React Hook Form                  | ✅ Présent    | `useForm` + `zodResolver` dans `UploadForm`       |
| Zod                              | ✅ Présent    | `uploadFormSchema` — `upload-form-schema.ts`      |
| UI components minimal            | ✅ Présent    | UI Kit 4 (Alert/Button/Dialog/Select/Toast/…)     |
| Theme system / design tokens     | ✅ Présent    | `data-theme`, `DEFAULT_THEME`, UI Kit tokens      |
| Loading/empty/error states       | ✅ Présent    | Composants partagés standardisés                  |
| Confirmation dialogs             | ✅ Présent    | `Dialog` (UI Kit) — utilisé dans Files (suppression) |
| Toast feedback                   | ✅ Présent    | `Toast` (UI Kit) — intégré dans Files             |
| Environment config               | ✅ Présent    | `server-config.ts`, `.env.example`                |
| Constants                        | ✅ Présent    | `src/core/config/`                                |
| Logger minimal                   | ✅ Présent    | `src/core/logger/`                                |
| SEO baseline                     | ✅ Présent    | Landing page publique indexable (Gap 1)           |
| Accessibility baseline           | ✅ Présent    | Aria-labels, rôles ARIA, tests Playwright         |

---

## 5. Forces consolidées

- **Auth BFF complet** : login/logout/me/session, HttpOnly, CSRF, RBAC — aucun secret exposé.
- **Files V1 complet** : upload/download/suppression/liste/détail/admin quarantaine+restauration,
  BFF same-origin, 446 tests unitaires.
- **CI 4 niveaux** : lint+typecheck+test+build+audit (niveau 1), API runtime (niveau 2), E2E
  navigateur Playwright (niveau 3), registry GHCR (niveau 4 partiel).
- **14 tests E2E Playwright** : Health, Auth (login/logout/permissions), Files (liste/lecture/
  upload/suppression), anti-énumération, anti-leak données sensibles.
- **UI Kit 4 intégré** : Alert, Button, Dialog (native `<dialog>`), Select, Toast, Card, Input —
  accessibilité ARIA correcte.
- **TanStack Query v5** : prefetch SSR, déshydratation, invalidation cache ciblée, états loading/
  error/empty.
- **Zéro `any`, TypeScript strict** : types API, BFF, UI séparés, erreurs typées.

---

## 6. Faux négatifs — décisions ADR (ne sont PAS des gaps V1)

| Élément absent du ROADMAP §10       | Raison de l'absence                              |
|--------------------------------------|--------------------------------------------------|
| Tailwind CSS                         | ADR-009 partiel : UI Kit maison retenu à la place|
| shadcn/ui                            | ADR-009 partiel : UI Kit maison retenu à la place|
| Data table minimal                   | §10 modules optionnels — non requis par §56      |
| Radix UI primitives directes         | ADR-009 partiel : encapsulées dans UI Kit        |

Ces absences sont intentionnelles et documentées. Elles ne sont pas des gaps V1.

---

## 7. Verdict de maturité V1

**Statut : `VALIDE_V1` — V1 pleinement stable (14/14 critères satisfaits).**

**14/14 critères §56 satisfaits** (100 %, post V1 Gap 3 — 2026-07-10). Aucun critère bloquant restant.

| Critère §56                                      | Statut  | Fermé par          |
|--------------------------------------------------|---------|--------------------|
| 3. Les layouts standards existent                | ✅ Fermé | V1 Gap 1 + Gap 2  |
| 9. Les formulaires et validations fonctionnent   | ✅ Fermé | V1 Gap 3           |
| 11. Le SEO baseline est présent pour pages publiques | ✅ Fermé | V1 Gap 1        |

---

## 8. Recommandation unique — Web Core V1 gap ciblé

**Option recommandée : (1) Web Core V1 gap ciblé.**

Comparaison des 4 options envisagées :

| Option                        | Ferme critères §56 | Effort   | Dépendances externes | Verdict      |
|-------------------------------|--------------------|----------|----------------------|--------------|
| (1) Web Core V1 gap ciblé     | 3/3 manquants      | Moyen    | Aucune               | **Choisir**  |
| (2) UI Kit 5                  | 0                  | Moyen    | Aucune               | Après V1     |
| (3) Cloud staging réel        | 0                  | Élevé    | Infrastructure cloud | Après V1     |
| (4) Attente RN31 macOS        | 0                  | Nul      | macOS/Xcode hôte     | Bloqué externe|

UI Kit 5 apporterait des composants plus avancés mais n'adresse aucun des 3 critères manquants.
Cloud staging réel est une dépendance infrastructure externe. RN31 est bloqué par un hôte macOS
indisponible sur Linux.

### Plan Web Core V1 gap ciblé — 3 items ordonnés par impact/effort

**Item 1 — Public layout + landing page minimale** ✅ RÉALISÉ (2026-07-10 — branche `web-core-v1-gap-1-public-layout`)
- Route group `(public)/` avec `layout.tsx` (header nav "Enistère" + lien "Se connecter" + footer).
- `(public)/page.tsx` : landing statique, `metadata` SEO (`robots:index:true`, `openGraph`), `sitemap.ts`, `robots.ts`.
- Page technique `/status` (déplacée de `/`).

**Item 2 — Dashboard layout minimal** ✅ RÉALISÉ (2026-07-10 — branche `web-core-v1-gap-2-dashboard-layout`)
- `DashboardShell` Server Component (`src/features/dashboard/dashboard-shell.tsx`) — header nav avec 3 liens (Accueil/Fichiers/Envoyer) + lien marque "Enistère" → `/`.
- Intégré dans `(protected)/layout.tsx` sur le chemin authentifié uniquement.
- Test E2E ajouté (nav dashboard visible — 15 tests).

**Item 3 — React Hook Form + Zod : intégration UploadForm** ✅ RÉALISÉ (2026-07-10 — branche `web-core-v1-gap-3-rhf-zod`)
- `upload-form-schema.ts` : schéma Zod v4 (`uploadFormSchema`, `FILE_CATEGORY_VALUES`, `SUBJECT_ID_MAX_LENGTH`, `UploadFormValues`).
- `upload-form.tsx` : migré vers `useForm({ resolver: zodResolver(uploadFormSchema) })` — erreurs RHF, `aria-describedby`, reset complet.
- `test/upload-form.test.tsx` : 4 tests (fichier requis / catégorie requise / subjectId trop long / succès).
- Dépendances : `react-hook-form@^7.81.0`, `zod@^4.4.3`, `@hookform/resolvers@^5.4.0`.

**Ordre d'exécution :** Items 1 ✅, 2 ✅ et 3 ✅ réalisés. **V1 pleinement stable (14/14).**

---

## 9. Références

- `cores/web-nextjs/CORE_SPECIFICATION.md` §56 (critères V1), §9 (modules obligatoires)
- `strategy/04_ROADMAP_GLOBAL.md` §10 (Web Core V1 modules et livrables)
- `cores/web-nextjs/docs/WEB_CORE_V1_INCREMENT_REVIEW.md` (revue précédente)
- `docs/project-status/FOUNDATION_CURRENT_STATE.md`
- `docs/project-status/IMPLEMENTATION_MATRIX.md`
- `docs/project-status/NEXT_ACTIONS.md`
