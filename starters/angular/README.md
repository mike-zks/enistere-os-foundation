# starter Angular

Socle web Angular de référence pour les backoffices, dashboards administratifs, SI internes et portails opérateurs Enistere.

**Statut** : `VALIDE_V1`

**ADR fondateur** : [ADR-035 — Angular Material (CDK + M3) + tokens Enistere](../../docs/adr/ADR-035-angular-ui-material-vs-primeng.md)

---

## Rôle

Le starter Angular cadre la base commune des applications Angular enterprise Enistere :

- Architecture Angular standalone (feature-first)
- Angular Router avec guards fonctionnels
- Reactive Forms obligatoires (Angular Material form fields)
- Angular Material CDK + Material 3 contrôlé par les tokens Enistere (ADR-035)
- HttpClient + intercepteurs (auth, refresh 401, erreurs, logging)
- Angular Signals pour l'état local ; RxJS services pour le server state
- `@angular/cdk/a11y` : FocusTrap, LiveAnnouncer, FocusMonitor, ListKeyManager
- Composants maison Enistere Angular (LoadingState / EmptyState / ErrorState / SuccessState)
- RBAC via `PermissionService` + `PermissionDirective` (API Core = autorité)

---

## Positionnement

| Aspect | starter Next.js | starter Angular |
|---|---|---|
| Cible | Landing pages, SaaS, portails publics, dashboards légers | Backoffices, SI administratifs, portails opérateurs |
| Moteur UI | shadcn/ui + Radix UI (React) | Angular Material CDK + M3 (ADR-035) |
| Tokens | `@enistere/ui-kit` CSS custom properties | `mat.define-theme()` + `--mat-*` + `--enistere-*` |
| Auth | BFF Next.js + cookies HttpOnly + CSRF | HttpClient + intercepteurs + stratégie token (§17) |
| Formulaires | React Hook Form + Zod | Reactive Forms (obligatoire) |
| Routing | App Router Next.js | Angular Router (standalone) |
| État local | Zustand | Angular Signals |
| Server state | TanStack Query | RxJS services (TanStack Query Angular optionnel) |

---

## Spécification

Lire [`STARTER_SPECIFICATION.md`](./STARTER_SPECIFICATION.md) avant toute mission Angular.

Sections clés :

- **§7** — Architecture cible (standalone, feature-first, couches)
- **§8** — Structure indicative du futur starter
- **§9** — Modules obligatoires V1 (routing, auth, HTTP, Reactive Forms, thème, a11y, tests)
- **§12** — Décisions validées vs pendantes
- **§22** — Thème Material 3 Enistere (ADR-035)
- **§24** — Accessibilité CDK a11y
- **§29** — Critères de validation V1 (15 critères §29.1→§29.15)
- **§30** — Missions ordonnées (Angular 1→V1)
- **§32** — Décisions pendantes (client OpenAPI, tests, E2E, TanStack Query, SSR)

---

## Décision UI (ADR-035)

**Option D retenue** : Angular Material (CDK + Material 3) contrôlé par tokens Enistere + composants maison ciblés.

- **PrimeNG interdit** comme bibliothèque UI principale.
- **shadcn/Radix interdit** côté Angular (bibliothèques React uniquement).
- **Reactive Forms obligatoires** (Template-driven tolérés uniquement pour formulaires triviaux auto-contenus).
- ADR-016 §F (adaptateur OpenAPI Angular) décidé par preuve dans Angular 2+ — non tranché ici.

---

## Missions ordonnées

| # | Mission | Livrable | Statut |
|---|---|---|---|
| Angular 1 | Core specification | `STARTER_SPECIFICATION.md` + `README.md` | ✅ Réalisé (2026-07-15) |
| Angular 2 | Starter minimal Angular | `package.json` + structure `src/` + thème Material 3 Enistere | ✅ Réalisé (2026-07-16) |
| Angular 3 | Auth flow + routing protégé | `AuthService` (Signals) + guards + intercepteurs | ✅ Réalisé (2026-07-16) |
| Angular 4 | Client HTTP + server state | HttpClient + ErrorInterceptor + services RxJS + modèles typés | ✅ Réalisé (2026-07-16) |
| Angular 5 | Reactive Forms + Angular Material | formulaires + validation + `mat-form-field` | ✅ Réalisé (2026-07-16) |
| Angular 6 | Composants Foundation Enistere | Loading/Empty/Error/SuccessState standalone, signal inputs, a11y roles, tokens Enistere | ✅ Réalisé (2026-07-16) |
| Angular 7 | Upload fichiers | UploadService + FormData + états upload | ✅ Réalisé (2026-07-16) |
| Angular 8 | Tests + smoke | TestBed + CDK testing harness + rapport | ✅ Réalisé (2026-07-16) |
| Angular 9 | RefreshInterceptor + login API seam | `AuthApi` seam + login Observable + refresh coalescé + retry 401 unique | ✅ Réalisé (2026-07-16) |
| Angular 10 | PermissionService + PermissionDirective | RBAC UX conditionnel, API Core autorité | ✅ Réalisé (2026-07-16) |
| Angular V1 | Readiness review | Rapport V1 Readiness | ✅ Réalisé (2026-07-16) |

---

## Statut

`VALIDE_V1` — **14 / 15 critères §29 satisfaits**, **1 / 15 partiel** et **0 / 15 non satisfait**. Le dernier blocker V1 (**B2 PermissionService/PermissionDirective**) est fermé par Angular 10 ; la réserve §29.9 CDK a11y reste non bloquante. Vérifications Angular 10 : **267 / 267 tests ✅ · BUILD SUCCESS · 0 vulnérabilité**.

Rapport de readiness : `docs/project-status/WEB_ANGULAR_V1_READINESS_REVIEW.md` (2026-07-16).

Auth Angular 9 : `AuthApi` seam injectable + `PlaceholderAuthApi`, `AuthService.login()` Observable, access token en mémoire uniquement, `refreshSession()` coalescé, `RefreshInterceptor` 401 → refresh → retry unique → logout/purge si échec, `FormData` retry sans `Content-Type` forcé. Permissions Angular 10 : `PermissionService` in-memory + `PermissionDirective` structurelle `*enisterePermission`, affichage conditionnel UX uniquement, purge au logout/expiration. Primitives upload Angular : `FileCategory` (9 valeurs) + `AppFile` + `UploadService` HttpClient+FormData (Content-Type jamais forcé) + `UploadFormComponent` Reactive Forms + états Foundation + CDK harnesses + `RouterTestingHarness` (Angular 8).

**Blockers V1 :** aucun.

**Réserves non-bloquantes :**
- **R1** — CDK a11y FocusTrap/LiveAnnouncer : ARIA HTML équivalent ; FocusTrap nécessite des modales (§29.9)
- **R2** — CI Angular gate : non requis §29 ; reporté mission qualité/CI (§32)

**Prochaine action** : Quality/Governance — ajouter un gate CI `web-angular` dédié (réserve R2), ou poursuivre un autre core prioritaire selon roadmap.

---

## ADR référencés

| ADR | Décision |
|---|---|
| [ADR-008](../../docs/adr/ADR-008-design-tokens-ui-kit.md) | Tokens Enistere source de vérité |
| [ADR-016](../../docs/adr/ADR-016-openapi-typed-client-generation.md) | Client OpenAPI Angular décidé par preuve (§F) |
| [ADR-035](../../docs/adr/ADR-035-angular-ui-material-vs-primeng.md) | Angular Material CDK + M3 + tokens Enistere |
| ADR-004 | Auth multi-client |
| ADR-007 | Upload fichiers |
| ADR-040 | Logging structuré (principes applicables Angular) |
