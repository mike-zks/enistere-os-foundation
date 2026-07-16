# WEB_ANGULAR_V1_READINESS_REVIEW.md — Web Core Angular V1 Readiness Review

**Date** : 2026-07-16  
**Branch** : `feat/web-angular-v1-readiness-review`  
**Statut avant** : `TEST_SMOKE_READY`  
**Statut après** : **`IMPLEMENTATION_AVANCEE`**
**Décision** : V1 DIFFÉRÉE — blockers identifiés

---

## 1. Contexte

Le Web Core Angular a traversé 8 missions (Angular 1→8) depuis la spécification initiale
(2026-07-15) jusqu'aux tests CDK harness et smoke (2026-07-16).

Cette revue évalue formellement les **15 critères §29** de `CORE_SPECIFICATION.md` pour
décider si `web-angular` peut être promu vers `VALIDE_V1` ou s'il doit rester en statut
avancé avec blockers documentés.

---

## 2. Résumé de la décision

| Dimension | Résultat |
|---|---|
| Critères §29 satisfaits | **11 / 15 ✅** |
| Critères §29 partiels | **3 / 15 PARTIEL** |
| Critères §29 non satisfaits | **1 / 15 ✗** |
| Blockers V1 | **2** (B1–B2) |
| Réserves non-bloquantes | **2** (R1–R2) |
| Tests | **224 / 224 ✅** |
| Build production | **SUCCESS** |
| Audit vulnérabilités | **0** |

**→ PROMOTION VALIDE_V1 refusée à ce stade.** Le core est solide et passe à
`IMPLEMENTATION_AVANCEE`, mais deux modules explicitement requis par la spécification
ne sont pas encore livrés : `RefreshInterceptor` et `PermissionDirective`.

---

## 3. Vérification des 15 critères §29

| # | Critère | Statut | Preuve / Fichiers | Réserve |
|---|---|---|---|---|
| §29.1 | L'app Angular démarre localement (ng serve) | ✅ SATISFAIT | `npm run build` → SUCCESS · `ng build` `defaultConfiguration: "production"` · `dist/web-angular/` généré | — |
| §29.2 | La navigation Angular Router fonctionne (public + protégé + guards) | ✅ SATISFAIT | `app.routes.ts` (4 routes lazy-loaded) · `authGuard` + `guestGuard` · `app.navigation.spec.ts` 5 tests RouterTestingHarness ✅ | — |
| §29.3 | Le flow auth est opérationnel (login / logout / refresh / session restore) | PARTIEL | `AuthService` : `login()` placeholder (token synthétique mémoire), `logout()` purge mémoire ✅, `restoreSession()` stub cold-start ✅ · **RefreshInterceptor absent** (seam : `authInterceptor` exclut `/auth/refresh`, 401 surfacé `Unauthorized`) | **B1** |
| §29.4 | Les tokens sont correctement gérés (access en mémoire, pas de localStorage) | ✅ SATISFAIT | `AuthService._accessToken = signal<string\|null>(null)` · jamais de `localStorage.setItem` · `auth.service.spec.ts` 8 tests | — |
| §29.5 | Les intercepteurs HttpClient fonctionnent (auth, refresh, erreurs) | PARTIEL | `authInterceptor` ✅ (Bearer injecté, auth-endpoints exclus, 6 tests) · `errorInterceptor` ✅ (AppApiError, 6 tests) · `logInterceptor` ✅ (path sanitized, 6 tests) · **RefreshInterceptor absent** | **B1** |
| §29.6 | Reactive Forms valident et soumettent correctement un formulaire de login | ✅ SATISFAIT | `LoginComponent` : `fb.nonNullable.group({email, password})` · `mat-form-field` + `mat-error` + `getFieldError()` · `login.component.spec.ts` 14 tests · `login.harness.spec.ts` 5 tests CDK | — |
| §29.7 | Le thème Material 3 Enistere est appliqué (mat.define-theme depuis tokens) | ✅ SATISFAIT | `src/styles.scss` : `mat.define-theme()` + `mat.$azure-palette`/`mat.$cyan-palette` · `@include mat.all-component-themes()` · tokens `--enistere-color-*`/`--enistere-font-*`/`--enistere-spacing-*`/`--enistere-radius-*`/`--enistere-shadow-*` · mapping `--mat-sys-primary: var(--enistere-color-action-primary)` · dark mode `[data-theme='dark']` | — |
| §29.8 | Les composants Enistere Angular existent (Loading/Empty/Error/Success) | ✅ SATISFAIT | `EnistereLoadingStateComponent`, `EnistereEmptyStateComponent`, `EnistereErrorStateComponent`, `EnistereSuccessStateComponent` · signal inputs · a11y roles · 34 tests DOM + 2 tests CDK `MatProgressSpinnerHarness` | — |
| §29.9 | L'accessibilité CDK est en place (FocusTrap modales, LiveAnnouncer états) | PARTIEL | ARIA HTML : `role="status"`, `aria-live="polite"`, `role="alert"`, `aria-live="assertive"` sur Foundation components ✅ · `@angular/cdk/a11y` installé (CDK 22.0.4) mais **FocusTrap** (modales absentes du starter) et **LiveAnnouncer** (ARIA attributes = couverture équivalente) non instanciés | **R1** |
| §29.10 | Les tests unitaires couvrent AuthService, intercepteurs et guards | ✅ SATISFAIT | `auth.service.spec.ts` 8 tests · `guards.spec.ts` 8 tests · `auth.interceptor.spec.ts` 6 tests · `error.interceptor.spec.ts` 6 tests · `log.interceptor.spec.ts` 6 tests · `return-url.utils.spec.ts` 8 tests | — |
| §29.11 | Les tests composants couvrent les états UI et les formulaires | ✅ SATISFAIT | Foundation states 34 tests · `login.component.spec.ts` 14 tests · `upload-form.component.spec.ts` 15 tests · CDK harnesses 16 tests · `app.navigation.spec.ts` 5 tests · **224 / 224 ✅** | — |
| §29.12 | Le client HTTP Angular est configuré et typé (TypeScript strict) | ✅ SATISFAIT | `tsconfig.json` : `strict`, `strictInjectionParameters`, `strictInputAccessModifiers`, `strictTemplates` · `HttpClient` + `withFetch()` + `withInterceptors()` · `APP_BASE_URL InjectionToken<string>` · `AppApiError`/`ApiErrorCode` · `RequestState<T>` | — |
| §29.13 | Les permissions RBAC s'affichent conditionnellement (PermissionDirective) | ✗ NON SATISFAIT | **PermissionService et PermissionDirective non implémentés** alors qu'ils sont explicitement requis par §9.9, §29.13 et la mission Angular 6 de §30. L'API reste l'autorité finale (ADR-006), mais le critère porte bien sur l'affichage conditionnel Angular. | **B2** |
| §29.14 | L'app tourne localement dans un navigateur moderne (Chrome, Firefox, Safari) | ✅ SATISFAIT | `npm run test:ci` : ChromeHeadless 150.0.0.0 (Chromium) ✅ · bundle statique servi via `ng serve` (même infrastructure) | — |
| §29.15 | `ng build --configuration=production` produit un bundle valide | ✅ SATISFAIT | `angular.json` : `"defaultConfiguration": "production"` · `npm run build` → `ng build` → production · 396 kB initial / 91 kB gzip · bundle complet dans `dist/web-angular/` | — |

---

## 4. Cohérence ADR-035 et roadmap

### 4.1 ADR-035 — Angular Material CDK + M3 + tokens Enistere

| Exigence ADR-035 | Statut | Preuve |
|---|---|---|
| Angular Material (CDK + Material 3) | ✅ | `@angular/material` 22.0.4 + `@angular/cdk` 22.0.4 |
| Contrôlé par tokens Enistere via `mat.define-theme()` | ✅ | `src/styles.scss` — `mat.define-theme()` + `--enistere-*` |
| Composants maison Enistere Angular ciblés | ✅ | Loading/Empty/Error/SuccessState Angular 6 |
| Reactive Forms obligatoires | ✅ | LoginComponent + UploadFormComponent |
| `@angular/cdk/testing` harnesses | ✅ | Angular 8 — 16 tests CDK harnesses |
| Angular Signals | ✅ | `signal()`, `input()`, `input.required<T>()`, `output<T>()`, `computed()` |
| NgRx différé projet dérivé | ✅ | Non ajouté ; décision documentée §32 |
| PrimeNG interdit | ✅ | Absent du `package.json` |
| shadcn/Radix interdit côté Angular | ✅ | Absent |
| Adaptateur OpenAPI Angular | PARTIEL | ADR-016 §F pendante — `HttpClient` natif livré ; adaptateur généré différé |

### 4.2 Roadmap §30 — Missions réalisées

| Mission | Statut | Livrable clé |
|---|---|---|
| Angular 1 — Core specification | ✅ | `CORE_SPECIFICATION.md` 32 § |
| Angular 2 — Starter minimal | ✅ | `package.json` + thème M3 + build 8/8 tests |
| Angular 3 — Auth flow + routing | ✅ | `AuthService` Signals + guards + `AuthInterceptor` |
| Angular 4 — Client HTTP + server state | ✅ | `HttpClient` + intercepteurs + `RequestState<T>` |
| Angular 5 — Reactive Forms + Material | ✅ | `mat-form-field` + `getFieldError()` + login form |
| Angular 6 — Composants Foundation | ✅ | Loading/Empty/Error/Success + 34 tests |
| Angular 7 — Upload fichiers | ✅ | `UploadService` + `UploadFormComponent` |
| Angular 8 — Tests + smoke | ✅ | 16 tests CDK harnesses + `RouterTestingHarness` |
| Angular V1 — Readiness review | **EN COURS** | Ce rapport |

---

## 5. Blockers V1

### B1 — RefreshInterceptor / login réel (§29.3, §29.5)

**Nature** : blocker fonctionnel V1.

- `AuthService.login()` est un placeholder (token synthétique en mémoire, aucun appel API).
- `RefreshInterceptor` absent : les 401 sont surfacés comme `Unauthorized`, sans retry automatique.
- **Seam en place** : `authInterceptor` exclut `/auth/refresh` et `/auth/logout` ; `errorInterceptor` expose `AppApiError.code === 'Unauthorized'` ; la chaîne d'intercepteurs est précâblée.
- **À livrer avant `VALIDE_V1`** : connecter `AuthService.login()` à `POST /api/v1/auth/login`
  ou à un `AuthApi` injectable testable, puis ajouter un `RefreshInterceptor` fonctionnel
  (401 → refresh coalescé → retry unique → logout/purge si échec).
- **Contrainte** : access token en mémoire uniquement ; aucun token en log, URL, `localStorage`
  ou state persistant.

### B2 — PermissionService / PermissionDirective (§29.13)

**Nature** : blocker fonctionnel V1.

- `PermissionDirective` non implémentée — listée dans §30 Angular 6 mais non livrée (périmètre réduit lors de la livraison : seuls Loading/Empty/Error/SuccessState livrés).
- **À livrer avant `VALIDE_V1`** : `PermissionService` minimal (permissions/roles en mémoire
  depuis l'état auth ou une source injectable) + `PermissionDirective` structurelle
  (`*enisterePermission`) testée, sans prétendre remplacer l'autorisation backend.
- **Contrainte** : affichage conditionnel = UX uniquement ; l'API Core reste l'autorité.

## 6. Réserves non-bloquantes

### R1 — CDK a11y (FocusTrap, LiveAnnouncer) (§29.9)

**Nature** : réserve de scope non-bloquante.

- ARIA HTML en place sur tous les composants Foundation (`role="status"`, `aria-live="polite"`, `role="alert"`, `aria-live="assertive"`, `[attr.aria-label]`).
- `@angular/cdk/a11y` est installé et disponible (CDK 22.0.4).
- **FocusTrap** : nécessite des modales/overlays — absents du starter V1 par design.
- **LiveAnnouncer** : les attributs `aria-live` HTML offrent une couverture WCAG 2.1 AA équivalente pour les états de chargement/erreur/succès.
- **Débloquant** : le projet dérivé ajoute des modales `MatDialog` et câble `FocusTrap`/`LiveAnnouncer` dans ses overlays.

### R2 — CI Angular gate (post-readiness)

**Nature** : réserve de gouvernance — **NON-BLOQUANTE** (pas un critère §29).

- Pas de workflow GitHub Actions dédié à `web-angular`.
- `web-angular` absent du scope `quality-gates.mjs`.
- PRs modifiant `cores/web-angular/` ne sont pas bloquées par un check CI automatique.
- **Recommandation** : ajouter un scope `web-angular` dans `quality-gates.mjs` et un job dans `ci.yml` (ou un `web-angular-ci.yml` dédié) — §32 : "CI Angular | Mission Angular 8+".

---

## 7. Décisions §32 tranchées ou différées

| Décision §32 | Résolution |
|---|---|
| Framework de tests unitaires | **TRANCHÉ** : Jasmine/Karma (Angular 2) |
| Version Angular LTS | **TRANCHÉ** : Angular 22.0.6 (Angular 2) |
| Préférences non sensibles | **DIFFÉRÉ** : non requis V1 |
| TanStack Query Angular | **DIFFÉRÉ** : RxJS `RequestState<T>` suffit pour V1 |
| Stratégie refresh token | **À FERMER** : blocker B1 |
| Client OpenAPI Angular | **DIFFÉRÉ** : ADR-016 §F — `HttpClient` natif + types manuels V1 |
| Framework E2E | **DIFFÉRÉ** : non requis V1 (pas de §29 E2E) |
| CI Angular | **DIFFÉRÉ** : réserve R2 (post-readiness) |
| NgRx | **DIFFÉRÉ** : projets dérivés |
| SSR / Angular Universal | **DIFFÉRÉ** : non requis V1 |
| Export tokens SCSS / Surface UI Kit Angular | **DIFFÉRÉ** : UI Kit V3 |

---

## 8. Vérifications qualité finales

| Check | Résultat |
|---|---|
| `npm run test:ci` | ✅ 224 / 224 |
| `npm run build` | ✅ SUCCESS (production) |
| `npm audit` | ✅ 0 vulnérabilités |
| `quality-gates docs` | ✅ 2 / 2 |
| `git diff --check` | ✅ |
| Nouvelles dépendances runtime | ✅ Aucune |
| Régression fonctionnelle | ✅ Aucune |

---

## 9. Décision finale

**`TEST_SMOKE_READY → IMPLEMENTATION_AVANCEE`**

Le Web Core Angular satisfait **11 / 15** critères §29 sans réserve, **3 / 15** partiellement
et **1 / 15** reste non satisfait. Le core est donc avancé, cohérent et testable, mais
`VALIDE_V1` est différé tant que B1 et B2 ne sont pas fermés.

Les réserves R1/R2 sont documentées et non bloquantes, mais elles ne compensent pas
l'absence de `RefreshInterceptor` et de `PermissionDirective`, deux éléments explicitement
nommés dans la spécification V1.

**Prochaine action** : Web Core Angular 9 — `RefreshInterceptor` + login API seam, puis
Web Core Angular 10 — `PermissionService` + `PermissionDirective`, avant une nouvelle
revue V1 finale.
