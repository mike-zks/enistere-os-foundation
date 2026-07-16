# Changelog

Tous les changements notables de ce repository seront documentés dans ce fichier.

Le format suit une approche simple inspirée de Keep a Changelog, avec des sections par version ou jalon.

## [Unreleased]

### AI Core 1 — Core specification

- `cores/ai-core/CORE_SPECIFICATION.md` : création de la spécification AI Core (Prompt Registry, Context Builder, Redaction Layer, RAG/Retrieval, Agent Orchestrator, Evaluation Harness, Provider Adapters, Audit Trail, sécurité, readiness).
- `cores/ai-core/README.md` : création du README de core et des missions futures.
- `ai-core` : **`DOSSIER_SEULEMENT` → `SPECIFICATION_DOCUMENTAIRE`**.
- Aucun runtime, SDK IA, provider, RAG runtime, base vectorielle, endpoint, workflow, dépendance ou secret.

### Quality Web Angular CI gate

- `.github/workflows/web-angular-ci.yml` : ajout d'un workflow dédié au core Angular (`npm ci`, `npm run test:ci`, `npm run build`, `npm audit`) avec job `web-angular`.
- `cores/quality-core/scripts/quality-gates.mjs` : ajout du scope local `web-angular` (`test:ci`, `build`, `audit`) ; scope explicitement exclu de `all-safe` car Karma/ChromeHeadless doit être lancé séparément.
- `cores/quality-core/scripts/quality-gates.test.mjs` : couverture du nouveau scope et des exclusions `all-safe`.
- `cores/quality-core/scripts/quality-report.mjs` : ajout du scope `web-angular` à la synthèse locale tests/couverture.
- `QUALITY_GATES_MATRIX.md`, `BRANCH_PROTECTION_RUNBOOK.md`, `README.md` Quality Core et `WEB_ANGULAR_V1_READINESS_REVIEW.md` mis à jour ; réserve Angular R2 fermée.
- Le check `web-angular` est documenté comme promotion recommandée, non appliquée automatiquement dans le ruleset `protect-main`.

### Web Core Angular 10 — PermissionService + PermissionDirective

- `cores/web-angular/src/app/core/permissions/permission.service.ts` : ajout de `PermissionService` signal-based, in-memory, avec normalisation défensive des rôles/permissions, rejet des wildcards et helpers RBAC.
- `cores/web-angular/src/app/core/permissions/permission.directive.ts` : ajout de la directive standalone `*enisterePermission`, compatible permission simple, listes, objet `{ role, roles, permission, permissions, mode }`, modes `all`/`any`.
- `AuthService` purge désormais les permissions sur erreur login, refresh expiré, logout et restore cold-start.
- `DashboardComponent` ajoute une preuve de contenu conditionnel `files.upload` sans logique métier ; affichage UX uniquement, API Core reste autorité.
- Tests : `permission.service.spec.ts`, `permission.directive.spec.ts`, `dashboard.component.spec.ts` ajusté ; **267/267 tests Angular ✅**.
- Rapport `WEB_ANGULAR10_PERMISSION_RBAC_REPORT.md` ajouté ; `WEB_ANGULAR_V1_READINESS_REVIEW.md` mis à jour : B2 fermé, score **14/15 SATISFAIT + 1/15 PARTIEL + 0/15 NON SATISFAIT**.
- `web-angular` : **`IMPLEMENTATION_AVANCEE` → `VALIDE_V1`**. Réserve R1 CDK a11y maintenue comme non bloquante ; R2 CI Angular gate reportée Quality/Governance.

### Web Core Angular 9 — RefreshInterceptor + login API seam

- `cores/web-angular/src/app/core/auth/auth.api.ts` : ajout de `AuthApi` injectable + `PlaceholderAuthApi` pour découpler le core Angular d'un backend réel.
- `AuthService` : `login()` devient Observable, access token reste en mémoire privée, purge token sur erreur login, `logout()` best-effort, `refreshSession()` coalescé et purge sur échec.
- `RefreshInterceptor` : 401 authentifié → refresh → retry unique ; endpoints `/auth/login`, `/auth/refresh`, `/auth/logout` exclus ; pas de boucle ; logout/purge si refresh échoue.
- Multipart : le retry `FormData` ne force jamais `Content-Type`, le navigateur conserve la génération du boundary.
- Tests : `auth.api.spec.ts`, `refresh.interceptor.spec.ts`, specs auth/login/navigation/dashboard ajustées ; **248/248 tests Angular ✅**.
- Rapport `WEB_ANGULAR9_REFRESH_INTERCEPTOR_REPORT.md` ajouté ; `WEB_ANGULAR_V1_READINESS_REVIEW.md` mis à jour : B1 fermé, score **13/15 SATISFAIT + 1/15 PARTIEL + 1/15 NON SATISFAIT**. `VALIDE_V1` reste différé par B2 PermissionService/PermissionDirective.

### Web Core Angular V1 Readiness Review

- Rapport `docs/project-status/WEB_ANGULAR_V1_READINESS_REVIEW.md` : 15 critères §29 vérifiés un par un — **14 / 15 SATISFAIT**, **1 / 15 PARTIEL**, **0 / 15 NON SATISFAIT** après Angular 10.
- Cohérence ADR-035 vérifiée : Angular Material CDK + M3, Reactive Forms, Foundation components Angular, CDK harnesses, Angular Signals, PrimeNG absent.
- Blockers V1 : aucun. B1 RefreshInterceptor/login API seam est fermé par Angular 9 ; B2 PermissionService/PermissionDirective est fermé par Angular 10. Réserves non-bloquantes : R1 (CDK a11y FocusTrap/LiveAnnouncer — ARIA HTML équivalent, FocusTrap nécessite modales), R2 (CI Angular gate — non requis §29, reporté §32).
- Décisions §32 tracées : 2 TRANSCHÉ (framework tests Jasmine/Karma, version Angular 22.0.6), 9 DIFFÉRÉ (refresh, OpenAPI, E2E, TanStack Query Angular, NgRx, SSR, UI Kit Angular, CI gate, préférences).
- `cores/web-angular/src/app/pages/home/home.component.html` : badge statut mis à jour `TEST_SMOKE_READY` → `VALIDE_V1`.
- Mise à jour docs : `FOUNDATION_CURRENT_STATE.md`, `IMPLEMENTATION_MATRIX.md`, `NEXT_ACTIONS.md`, `SESSION_HANDOFF.md`, `CHANGELOG.md`, `cores/web-angular/README.md`.
- `web-angular` : **`TEST_SMOKE_READY` → `VALIDE_V1`**. Build SUCCESS + **267/267 tests** ✅ — 0 vulnérabilité.

### Web Core Angular 8 — Tests + smoke

- `cores/web-angular/src/app/app.navigation.spec.ts` : 5 tests d'intégration router via `RouterTestingHarness` — navigation lazy-loaded (`loadComponent`) route `/` → `app-home`, `/login` → `app-login` (guestGuard permissif), `/dashboard` → redirect `/login?returnUrl=...` (authGuard), param `returnUrl` vérifié, wildcard `/page-inconnue` → `/`.
- `cores/web-angular/src/app/features/auth/login/login.harness.spec.ts` : 5 tests CDK — `MatFormFieldHarness` ×3 (2 fields, labels "Adresse e-mail" / "Mot de passe"), `MatInputHarness.getType()` ×2 (email / password). Complémentaires aux 14 tests DOM existants.
- `cores/web-angular/src/app/features/upload/upload-form/upload-form.harness.spec.ts` : 4 tests CDK — `MatSelectHarness` (9 options = `FILE_CATEGORIES.length`, labels "Document"/"Image"), `MatButtonHarness.with({ text: 'Envoyer' })`, `MatProgressSpinnerHarness` présent après `state.set(loadingState())`. Complémentaires aux 15 tests DOM existants.
- `cores/web-angular/src/app/shared/components/loading-state/enistere-loading-state.harness.spec.ts` : 2 tests CDK — `MatProgressSpinnerHarness` trouvé + `getMode() === 'indeterminate'`. Complémentaires aux 7 tests DOM existants.
- Zéro nouvelle dépendance (harnesses dans `@angular/cdk@22.0.4` / `@angular/material@22.0.4`). Zéro feature runtime.
- `cores/web-angular/src/app/pages/home/home.component.html` : badge statut mis à jour `UPLOAD_READY` → `TEST_SMOKE_READY`.
- Rapport `docs/project-status/WEB_ANGULAR8_TESTS_SMOKE_REPORT.md` : 27 suites de tests documentées, résultats smoke ChromeHeadless, couverture par domaine.
- `web-angular` : **`UPLOAD_READY` → `TEST_SMOKE_READY`**. Build SUCCESS + **224/224 tests** ✅ — 0 vulnérabilité.

### Web Core Angular 7 — Upload fichiers

- `cores/web-angular/src/app/core/upload/file-category.ts` : `FileCategory` union (9 valeurs : `IMAGE`/`DOCUMENT`/`AVATAR`/`VIDEO`/`AUDIO`/`IDENTITY_DOCUMENT`/`ATTACHMENT`/`MEDIA`/`OTHER`) + `FILE_CATEGORIES` pour le select Material (value/label).
- `cores/web-angular/src/app/core/upload/app-file.model.ts` : `AppFile` interface (`file: File`, `category: FileCategory`, `subjectId?: string`) + `MAX_FILE_SIZE_BYTES` (10 MB) + `isValidAppFile()` (taille ≥ 1 octet ≤ 10 MB) + `isAllowedFileType()` (whitelist 14 MIME, bypass si type vide — backend autoritaire) + `describeFileForLog()` (retourne `{extension, sizeBytes}` uniquement — jamais nom/path/contenu/token).
- `cores/web-angular/src/app/core/upload/uploaded-file-metadata.model.ts` : `UploadedFileMetadata` DTO public (`id`, `category`) — sans `storageKey`, `bucket`, `signedUrl`, `ownerId`.
- `cores/web-angular/src/app/core/upload/upload.service.ts` : `UploadService` injectable `providedIn: 'root'` — `upload(appFile): Observable<RequestState<UploadedFileMetadata>>` via `HttpClient.post()` + `FormData` (file, category, subjectId conditionnel) ; Content-Type intentionnellement absent (boundary multipart posé par le navigateur) ; erreurs 413/415/401 mappées via `AppApiError` existant (`errorInterceptor` + `createRequestState`).
- `cores/web-angular/src/app/features/upload/upload-form/upload-form.component.ts` : composant standalone Reactive Forms — `fb.nonNullable.group({category: required, subjectId: maxLength(128)})` ; `signal<File|null>()` pour le fichier natif ; `signal<RequestState<UploadedFileMetadata>>(idleState())` pour l'état ; `errorMessage` computed (`FileTooLarge`/`UnsupportedType`/`Unauthorized`/`RateLimited`/défaut) ; `submit()` + `reset()` + `ngOnDestroy` (`Subscription` gérée).
- `cores/web-angular/src/app/features/upload/upload-form/upload-form.component.html` : `@if` Angular 17+ sur `state().status` pour basculer entre formulaire, `<enistere-loading-state>`, `<enistere-success-state>` et `<enistere-error-state>` ; `mat-select` catégorie + `matInput` subjectId optionnel + `mat-flat-button` submit désactivé si formulaire invalide.
- `cores/web-angular/src/app/features/upload/upload-form/upload-form.component.scss` : tokens Enistere (`--enistere-spacing-*`, `--enistere-font-size-*`, `--enistere-font-weight-semibold`, `--enistere-color-foreground-*`, `--enistere-color-primary`).
- Tests : 35 nouveaux tests — `app-file.model.spec.ts` × 12 (`isValidAppFile`, `isAllowedFileType`, `describeFileForLog` + non-fuite du nom de fichier) ; `upload.service.spec.ts` × 9 (FormData, Content-Type absent, category/subjectId, 413→FileTooLarge, 415→UnsupportedType, 401→Unauthorized via `errorInterceptor`) ; `upload-form.component.spec.ts` × 13 (rendu idle, file input, catégorie select, submit désactivé, appel service, states loading/success/error, reset, non-fuite nom fichier dans le DOM).
- `cores/web-angular/src/app/pages/home/home.component.html` : badge statut mis à jour `FOUNDATION_STATES_READY` → `UPLOAD_READY`.
- `web-angular` : **`FOUNDATION_STATES_READY` → `UPLOAD_READY`**. Build SUCCESS + 205/205 tests ✅.

### Web Core Angular 6 — Composants Foundation Enistere

- `cores/web-angular/src/app/shared/components/loading-state/enistere-loading-state.component.ts` : `EnistereLoadingStateComponent` standalone — signal `message` (défaut `'Chargement en cours…'`), signal `size` (`small`/`medium`/`large`, défaut `medium`), `MatProgressSpinnerModule`, `diameterFor` map (`small:24`, `medium:40`, `large:64`).
- `cores/web-angular/src/app/shared/components/empty-state/enistere-empty-state.component.ts` : `EnistereEmptyStateComponent` standalone — `input.required<string>()` `title`, `input<string>()` `description` + `actionLabel`, `output<void>()` `actionClicked`, `MatButtonModule`.
- `cores/web-angular/src/app/shared/components/error-state/enistere-error-state.component.ts` : `EnistereErrorStateComponent` standalone — `input.required<string>()` `title`, `input<string>()` `description` + `retryLabel`, `output<void>()` `retried`, `MatButtonModule`.
- `cores/web-angular/src/app/shared/components/success-state/enistere-success-state.component.ts` : `EnistereSuccessStateComponent` standalone — `input.required<string>()` `title`, `input<string>()` `description` + `actionLabel`, `output<void>()` `actionClicked`, `MatButtonModule`.
- Templates : `role="status"` + `aria-live="polite"` (loading/empty/success) ; `role="alert"` + `aria-live="assertive"` (error) ; `@if` Angular 17+ pour description et action optionnelles ; `[attr.aria-label]="message()"` sur loading.
- SCSS : conteneurs `flex column`, `align-items: center`, `gap: var(--enistere-spacing-4)`, `padding: var(--enistere-spacing-8)`. Titres `.state-title` : `--enistere-color-foreground-default` (empty/success → `--enistere-color-status-success` ; error → `--enistere-color-status-danger`). Descriptions `.state-description`/`.loading-message` : `--enistere-color-foreground-muted`, `max-width: 480px`.
- Tests : 34 tests (7 loading + 9 empty + 9 error + 9 success) — `fixture.componentRef.setInput()` signal inputs, `provideNoopAnimations()`, vérification role a11y, titre, description optionnelle, bouton absent sans label, émission output.
- `cores/web-angular/src/app/pages/home/home.component.html` : badge statut mis à jour `FORMS_MATERIAL_READY` → `FOUNDATION_STATES_READY`.
- `web-angular` : **`FORMS_MATERIAL_READY` → `FOUNDATION_STATES_READY`**. Build SUCCESS + 170/170 tests ✅.

### Web Core Angular 5 — Reactive Forms + Angular Material

- `cores/web-angular/src/app/core/forms/form-error.utils.ts` : utilitaire pur `getFieldError(control, label): string | null` — mappage des erreurs Angular (`required`, `email`, `minlength`, `maxlength`, `pattern`) vers des messages lisibles ; aucune dépendance à un DTO backend ; priorité : `required` > `email` > longueur > format.
- `cores/web-angular/src/app/features/auth/login/login.component.ts` : ajout de `MatFormFieldModule`, `MatInputModule`, `MatButtonModule` aux imports standalone ; exposition de `getFieldError` comme propriété `protected readonly` utilisable dans le template.
- `cores/web-angular/src/app/features/auth/login/login.component.html` : migration complète vers Angular Material — `mat-form-field appearance="outline"`, `matInput` sur les champs `email` et `password`, `mat-label` (sans astérisque manuel), `mat-error` liés à `getFieldError()` via la syntaxe `@if (expr; as alias)`, `button mat-flat-button` pour le submit. Accessibilité assurée par Material.
- `cores/web-angular/src/app/features/auth/login/login.component.scss` : suppression des styles custom d'input (`.form-field`, `.field-label`, `.required-mark`, `.field-input`, `.field-error`, `.submit-btn`) ; conservation des styles de layout (`.login-shell`, `.login-header`, `.login-nav`, `.nav-link`, `.form-error-banner`) ; ajout de `.login-field { width: 100%; }` et `.login-submit { width: 100%; min-height: 44px; }` pour surcharger Material.
- `cores/web-angular/src/app/pages/home/home.component.html` : badge statut mis à jour `AUTH_ROUTING_READY` → `FORMS_MATERIAL_READY`.
- Tests : 14 nouveaux / mis à jour (`form-error.utils.spec.ts` × 9 couvrant tous les cas d'erreur + `login.component.spec.ts` 3 nouveaux : Material form fields présents, type password, pas de fuite de mot de passe dans le DOM + 3 mis à jour : email-error via `mat-error`, email invalide, password requis).
- `web-angular` : **`HTTP_SERVER_STATE_READY` → `FORMS_MATERIAL_READY`**. Build SUCCESS + 136/136 tests ✅.

### Web Core Angular 4 — Client HTTP + server-state RxJS

- `cores/web-angular/src/app/core/config/api-config.ts` : `APP_BASE_URL = new InjectionToken<string>('APP_BASE_URL')` + `ApiConfig` interface. Note : le timeout par requête n'est pas natif dans Angular HttpClient — utilisation du RxJS `timeout()` différée Angular 5+.
- `cores/web-angular/src/app/core/errors/app-api-error.ts` : `ApiErrorCode` union de 12 valeurs (`BadRequest` / `Unauthorized` / `Forbidden` / `NotFound` / `Conflict` / `FileTooLarge` / `UnsupportedType` / `ValidationError` / `RateLimited` / `ServerError` / `NetworkError` / `Unknown`) + interface `AppApiError` (`code`, `statusCode: number | null`, `requestId: string | null`) + `mapHttpError()` (status 0 → NetworkError, `x-request-id` extrait des en-têtes, corps jamais exposé) + `isAppApiError()` type-guard.
- `cores/web-angular/src/app/core/interceptors/error.interceptor.ts` : transforme `HttpErrorResponse` en `AppApiError` typée ; 401 surfacé comme `Unauthorized` sans refresh automatique ; aucune stack, body, token ou en-tête sensible loggué ou exposé.
- `cores/web-angular/src/app/core/interceptors/log.interceptor.ts` : `sanitizePath()` extrait le pathname seul (query params, fragment et URL signée jamais loggués) ; logs `[HTTP] method path status +duration ms` UNIQUEMENT — JAMAIS body, Authorization, query params sensibles, URL signée.
- `cores/web-angular/src/app/core/server-state/request-state.ts` : `RequestState<T>` (`idle` / `loading` / `success` / `error`) + factories `idleState` / `loadingState` / `successState` / `errorState` + `createRequestState<T>(source$)` : émission immédiate de `loadingState`, puis `successState(data)` ou `errorState(appError)` ; les erreurs non-`AppApiError` sont enveloppées dans `{ code: 'Unknown' }`.
- `cores/web-angular/src/app/app.config.ts` mis à jour : `withInterceptors([authInterceptor, logInterceptor, errorInterceptor])` (ordre : `auth` outermost → `log` → `error` innermost — error transforme en premier sur la réponse, log voit le statusCode typé) + `{ provide: APP_BASE_URL, useValue: '' }` (URLs relatives par défaut, surcharge via `fileReplacements` Angular 5+).
- Tests : 41 nouveaux tests (`api-config.spec.ts` × 2, `app-api-error.spec.ts` × 17, `error.interceptor.spec.ts` × 6, `log.interceptor.spec.ts` × 7 dont vérification stricte de l'absence d'Authorization/body/query params, `request-state.spec.ts` × 9).
- `web-angular` : **`AUTH_ROUTING_READY` → `HTTP_SERVER_STATE_READY`**. Prochaine action : Web Core Angular 5 — Reactive Forms + Angular Material.

### Web Core Angular 3 — Auth flow + routing protégé

- `cores/web-angular/src/app/core/auth/` : `AuthState` (`loading` / `authenticated` / `unauthenticated` / `refreshing` / `expired`), `AuthService` signal-based avec access token en mémoire privée uniquement, signal public en lecture seule, `login()` placeholder, `logout()` purge mémoire et `restoreSession()` sans persistance.
- Guards fonctionnels `authGuard` / `guestGuard` : routes protégées, redirection `/login?returnUrl=...`, `returnUrl` assaini anti open-redirect (`//`, URL externes, `/%2F`).
- `authInterceptor` : injection `Authorization: Bearer` depuis mémoire, exclusion des endpoints `/auth/login`, `/auth/refresh`, `/auth/logout`.
- Routes Angular : `/login` public, `/dashboard` protégé, lazy loading, wildcard sûr.
- Pages shells : login accessible (Reactive Forms minimal, ARIA) et dashboard protégé avec logout.
- Tests Angular : AuthService, guards, returnUrl, interceptor, routing, login/dashboard — **76/76** ✅ après la garde read-only.
- `web-angular` : **`STARTER_INITIALISE` → `AUTH_ROUTING_READY`**. Prochaine action : Web Core Angular 4 — Client HTTP + server state.

### Web Core Angular 2 — Starter minimal Angular

- `cores/web-angular/package.json` (créé) : `@angular/core` 22.0.6, `@angular/material` + `@angular/cdk` 22.0.4, `typescript` 6.0.3, `@angular/cli` 22.0.7 + `@angular/build` 22.0.7 ; override borné `vite` 7.3.6 (corrige l'audit `esbuild` transitif) ; `engines.node: >=24.15.0 || >=22.22.3` documente la cible production ; scripts test via `architect web-angular:test` pour un run CI déterministe. Aucun script `lint` n'est exposé tant qu'Angular ESLint n'est pas installé/configuré.
- `cores/web-angular/angular.json` (créé) : builder `@angular/build:application` (esbuild Angular 17+), entrée `src/main.ts`, styles `src/styles.scss`, karma test runner avec `karmaConfig: karma.conf.js`.
- `cores/web-angular/tsconfig.json` (créé) : TypeScript strict (`strict: true`, `noImplicitOverride`, `noPropertyAccessFromIndexSignature`), `moduleResolution: bundler`, `target: ES2022`, `useDefineForClassFields: false` (compatibilité décorateurs Angular), `angularCompilerOptions: { strictInjectionParameters, strictInputAccessModifiers, strictTemplates }`.
- `cores/web-angular/karma.conf.js` (créé) : launcher custom `ChromeHeadlessNoSandbox` (`--no-sandbox --disable-gpu --disable-dev-shm-usage`) pour CI sans espace sandbox.
- `cores/web-angular/src/main.ts` (créé) : `bootstrapApplication(AppComponent, appConfig)` — bootstrap standalone sans NgModule.
- `cores/web-angular/src/styles.scss` (créé) : thème Material 3 Enistere — `mat.define-theme()` avec `mat.$azure-palette` (primaire) + `mat.$cyan-palette` (tertiaire), `@include mat.all-component-themes()`, tokens Enistere `--enistere-color-*` / `--enistere-font-*` / `--enistere-spacing-*` / `--enistere-radius-*` / `--enistere-shadow-*`, mapping `--mat-sys-primary: var(--enistere-color-action-primary)` (et autres), dark mode via `[data-theme='dark']` qui surcharge les tokens Enistere → propage automatiquement aux `--mat-sys-*`.
- `cores/web-angular/src/app/app.config.ts` (créé) : `provideRouter(routes, withComponentInputBinding())`, `provideHttpClient(withFetch())`, `provideAnimationsAsync()`.
- `cores/web-angular/src/app/app.routes.ts` (créé) : route `/` lazy → `HomeComponent`, wildcard `redirectTo: ''`.
- `cores/web-angular/src/app/app.component.ts` (créé) : `AppComponent` standalone, `imports: [RouterOutlet]`.
- `cores/web-angular/src/app/app.component.spec.ts` (créé) : 3 tests (create, title, router-outlet présent).
- `cores/web-angular/src/app/pages/home/home.component.ts` (créé) : `HomeComponent` standalone, aucun import (page shell publique minimale).
- `cores/web-angular/src/app/pages/home/home.component.html` (créé) : `<main class="home-shell">`, `<h1>Enistère Angular</h1>`, section `aria-label="Statut du projet"` avec `.status-value = 'STARTER_INITIALISE'`.
- `cores/web-angular/src/app/pages/home/home.component.spec.ts` (créé) : 5 tests (create, main.home-shell, h1 contient 'Enistère', .status-value = 'STARTER_INITIALISE', aria-label section présent).
- **Tests : 8/8 ✅** — `architect web-angular:test` (ChromeHeadless 150.0.0.0, 3 AppComponent + 5 HomeComponent).
- **Build : SUCCESS** — `architect web-angular:build` → 340 KB initial, zéro erreur TypeScript strict.
- Contrainte Node : Angular 22.x requiert `^22.22.3 || ^24.15.0 || >=26.0.0` ; l'environnement local Node 24.14.0 était trop ancien pour `ng`, donc les preuves locales ont utilisé `./node_modules/.bin/architect` et la CI valide l'exécution complète sur un runtime compatible.
- Mises à jour documentaires : `docs/project-status/DECISIONS_REGISTER.md` (ADR-035 Angular 2 note), `docs/project-status/FOUNDATION_CURRENT_STATE.md`, `docs/project-status/IMPLEMENTATION_MATRIX.md`, `docs/project-status/NEXT_ACTIONS.md`, `docs/project-status/SESSION_HANDOFF.md`.
- `web-angular` : **`SPECIFICATION_DOCUMENTAIRE` → `STARTER_INITIALISE`**. Prochaine action : Web Core Angular 3 — Auth flow + routing protégé.
- `quality-gates docs` 2/2 ✅ · `git diff --check` ✅.

### Web Core Angular 1 — Core specification

- `cores/web-angular/CORE_SPECIFICATION.md` (créé, 32 §) : spécification complète du socle Angular de référence pour backoffices, dashboards administratifs et SI internes Enistere.
- `cores/web-angular/README.md` (créé) : statut `SPECIFICATION_DOCUMENTAIRE`, positionnement (Web Next.js vs Web Angular), décision ADR-035, missions ordonnées Angular 1→V1.
- **ADR fondateur** : ADR-035 — Angular Material (CDK + M3) contrôlé par tokens Enistere + composants maison (Reactive Forms obligatoire ; pas de PrimeNG, pas de shadcn/Radix côté Angular).
- **Architecture spécifiée** : Angular standalone (17+, `standalone: true` obligatoire, zéro NgModule métier), TypeScript strict, feature-first (4 couches : Présentation / Application / Domaine / Infrastructure).
- **Routing** : Angular Router + guards fonctionnels (`CanActivateFn`/`CanMatchFn`) + lazy loading + `provideRouter(routes, withComponentInputBinding(), withRouterConfig({...}))`.
- **State** : Angular Signals (`signal()`/`computed()`/`effect()`) pour l'état local ; RxJS services (BehaviorSubject, shareReplay) pour le server state ; TanStack Query Angular différé à §32.
- **HTTP** : HttpClient + `provideHttpClient(withInterceptors([...]))` + 4 intercepteurs fonctionnels (AuthInterceptor Bearer, RefreshInterceptor 401 coalescent + logout, ErrorInterceptor mapping `AppError`, LogInterceptor sans body/token/URL signée).
- **Reactive Forms** obligatoires (Template-driven tolérés uniquement pour cas triviaux auto-contenus) ; formulaires Angular Material form fields.
- **Thème Material 3 Enistere** : `mat.define-theme()` + `@include mat.theme(...)` — tokens Enistere (ADR-008) via `--mat-sys-*` CSS custom properties ; aucun thème Material prebuilt.
- **`@angular/cdk/a11y`** : FocusTrap, LiveAnnouncer, FocusMonitor, ListKeyManager — WCAG 2.1 AA cible.
- **Composants maison Enistere Angular** : LoadingState / EmptyState / ErrorState / SuccessState (standalone, CDK-based, WCAG 2.1 AA).
- **Auth/Session** : access token en mémoire (signal Angular, non persisté) ; RefreshInterceptor 401 coalescent (un seul refresh concurrent, queue des requêtes en attente, logout si refresh échoue) ; stratégie refresh token différée à §32 (Option A : HttpOnly cookie si API le supporte ; Option B : mémoire seulement).
- **RBAC** : `PermissionService` + `PermissionDirective` — API Core reste l'autorité.
- **ADR-016 §F** (adaptateur OpenAPI Angular : Orval Angular vs `typescript-angular`) : décidé par preuve dans Angular 2+, non tranché dans cette spec.
- **Tests attendus** : TestBed + `@angular/cdk/testing` harness + `HttpClientTestingModule` ; couverture, Jest vs Karma, E2E Playwright/Cypress différés à §32.
- **§29 V1 critères** : 15 critères (§29.1→§29.15) — standalone, routing, signals, RxJS, forms, thème, intercepteurs, auth, CDK a11y, tests, RBAC, upload, logger, config, build.
- **§32 décisions pendantes** : 13 entrées (ADR-016§F, Jest vs Karma, Playwright vs Cypress, TanStack Query Angular, refresh token strategy, NgRx, CI Angular, version Angular LTS, SSR, tokens SCSS export, UI Kit Angular surface, localStorage préférences, localStorage preferences).
- **§30 Missions ordonnées** : Angular 1 (spec ✅) → Angular 2 (starter) → Angular 3 (auth) → Angular 4 (HTTP) → Angular 5 (forms) → Angular 6 (composants) → Angular 7 (upload) → Angular 8 (tests) → Angular V1 (readiness review).
- **Aucun code généré** : aucun projet Angular, aucun `package.json`, aucun `angular.json`, aucun `src/`, aucune dépendance npm, aucun workflow CI, aucun changement Web Next / UI Kit / API.
- Mises à jour documentaires : `docs/project-status/DECISIONS_REGISTER.md` (ADR-035 → `PARTIELLEMENT_IMPLEMENTE`), `docs/project-status/FOUNDATION_CURRENT_STATE.md`, `docs/project-status/IMPLEMENTATION_MATRIX.md`, `docs/project-status/NEXT_ACTIONS.md`, `docs/project-status/SESSION_HANDOFF.md`.
- `web-angular` : **`DOSSIER_SEULEMENT` → `SPECIFICATION_DOCUMENTAIRE`**. Prochaine action : Web Core Angular 2 — Starter minimal Angular.
- `quality-gates docs` 2/2 ✅ · `git diff --check` ✅.

### V3 ADR-035 — Angular UI stack decision : Angular Material (CDK + M3) + tokens Enistere

- `docs/adr/ADR-035-angular-ui-material-vs-primeng.md` (créé) : ADR complet 12 sections, statut **Validé**, date 2026-07-15.
- **Décision (Option D)** : Angular Material (CDK + Material 3) contrôlé par tokens Enistere + composants maison ciblés comme stack UI officielle du futur Web Core Angular.
- **Angular CDK** : couche comportementale/a11y — FocusTrap, LiveAnnouncer, FocusMonitor, ListKeyManager, Overlay, VirtualScroll. Identique au rôle de Material 3 dans ADR-034 (Flutter).
- **Tokens Enistere** (ADR-008) : identité pilotée via `mat.define-theme()` + CSS custom properties `--mat-*` et `--enistere-*`. Aucune identité Material par défaut exposée.
- **Composants maison Enistere Angular** : LoadingState / EmptyState / ErrorState / SuccessState construits sur CDK primitives.
- **Reactive Forms** obligatoire (§08_STANDARDS §20, ADR §9.4). Tables/dialogs Angular Material. `@angular/cdk/testing` pour tests composants.
- **State management** : Angular Signals préféré ; NgRx différé pour projets dérivés complexes. Services RxJS + éventuel TanStack Query Angular si validé par preuve.
- **Règles d'application** : PrimeNG interdit comme bibliothèque principale ; shadcn/Radix interdit côté Angular.
- **ADR-016 §F** (adaptateur OpenAPI Angular) : décidé par preuve dans Web Core Angular 1, non résolu dans cet ADR.
- **Cohérence multi-framework** : React (shadcn ADR-009) / RN (maison ADR-010) / Flutter (Material 3 ADR-034) / Angular (CDK+M3 ADR-035) — tous pilotés par `ui-kit/tokens/`.
- Aucun fichier `cores/web-angular/**` modifié. Aucun starter Angular. Aucune dépendance npm. Aucun workflow CI. Aucun changement runtime.
- `web-angular` : reste **`DOSSIER_SEULEMENT`** — blocker UI levé. Prochaine action : Web Core Angular 1 — Core specification.
- Mises à jour documentaires : `docs/adr/ADR_BACKLOG.md` (ADR-035 Validé), `docs/project-status/DECISIONS_REGISTER.md` (21 ADR, ADR-035 row), `docs/project-status/FOUNDATION_CURRENT_STATE.md`, `docs/project-status/IMPLEMENTATION_MATRIX.md`, `docs/project-status/NEXT_ACTIONS.md`, `docs/project-status/SESSION_HANDOFF.md`.
- `quality-gates docs` 2/2 ✅ · `git diff --check` ✅.

### API Core Spring Boot 8 — Redis health + Rate limiting + MinIO Testcontainers

- `pom.xml` : ajout `spring-boot-starter-data-redis` (Lettuce — version gérée par Spring Boot parent 4.1.0) ; `RedisHealthIndicator` auto-configuré via Actuator.
- `application.yml` : `spring.data.redis.url: ${REDIS_URL:redis://localhost:6379}` + `connect-timeout: 2000` + `timeout: 2000` ; bloc `enistere.security.rate-limit.*` (enabled/auth-capacity/auth-refill-seconds/upload-capacity/upload-refill-seconds/download-url-capacity/download-url-refill-seconds) avec defaults via env vars.
- `application-test.yml` : `management.health.redis.enabled: false` (Redis désactivé par défaut en test) ; `management.endpoint.health.show-details: always` ; `enistere.security.rate-limit.enabled: false` ; `io.lettuce: ERROR` / `io.netty: ERROR` (suppression logs Lettuce en test).
- `RateLimitConfig.java` (créé) : `@ConfigurationProperties(prefix = "enistere.security.rate-limit")` + `@Validated` ; 7 champs (enabled, authCapacity, authRefillSeconds, uploadCapacity, uploadRefillSeconds, downloadUrlCapacity, downloadUrlRefillSeconds).
- `RateLimitInterceptor.java` (créé) : `@Component @ConditionalOnProperty(name = "enistere.security.rate-limit.enabled", havingValue = "true", matchIfMissing = true)` + `HandlerInterceptor.preHandle()` fixed-window en mémoire (`ConcurrentHashMap<String, RateWindow>` par IP) ; 4 endpoints : `/api/v1/auth/login`, `/api/v1/auth/refresh`, `/api/v1/files/upload`, `/api/v1/files/*/download-url` ; 429 via `ResponseStatusException(TOO_MANY_REQUESTS)` → `GlobalExceptionHandler.handleResponseStatus()` → `ApiError` ; aucun log de token/email/body ; `clearWindows()` pour isolation inter-tests.
- `WebMvcConfig.java` (créé) : `@Configuration WebMvcConfigurer` ; `@Autowired(required=false) RateLimitInterceptor` — no-op si bean absent (profil test avec `enabled: false`) ; `.addPathPatterns(...)` sur 4 patterns.
- `RateLimitIntegrationTest.java` (créé) : `@TestPropertySource(properties = {"enistere.security.rate-limit.enabled=true", "auth-capacity=2", "upload-capacity=1", "download-url-capacity=1", ...})` ; 4 tests : login 429, upload 429, download-url 429, actuator/health non limité ; `clearWindows()` en `@BeforeEach`.
- `RedisHealthIntegrationTest.java` (créé) : `@TestPropertySource(properties = "management.health.redis.enabled=true")` + `GenericContainer("redis:7-alpine")` static + `@DynamicPropertySource` → `spring.data.redis.url` ; 2 tests : `$.components.redis.status = UP` + `$.components.db.status = UP`.
- `MinioStorageIntegrationTest.java` (créé) : `@Import(MinioTestConfig.class)` + `GenericContainer("minio/minio:RELEASE.2024-01-16T16-07-38Z")` static (`.withCommand("server", "/data")`, `Wait.forHttp("/minio/health/live")`) + `@DynamicPropertySource` (override `enistere.files.*`) + `MinioTestConfig @TestConfiguration @Primary @Bean StorageService` (override `FakeStorageService`) ; `testMinioClient` static pour assertions ; 3 tests : upload → `listObjects().hasNext()`, URL `X-Amz-*` (pas fake-storage.test), `Cache-Control: no-store`.
- **Tests : 99/99 ✅ BUILD SUCCESS** (90 SB7 + 4 RateLimit + 2 RedisHealth + 3 MinioTC).
- **§30 C10 fermé** (Redis UP + db UP en TC) ; **R1 fermé** (MinIO TC réel) ; **R3 fermé** (rate limiting en mémoire) ; **R5 fermé** (Lettuce lazy, RedisHealthIndicator).
- `api-spring` : **`VALIDE_V1`** — score §30 **15/15** ✅.

### API Core Spring Boot 5 — CI Java + Quality Gate Spring Boot

- `.github/workflows/api-spring-ci.yml` (L5) : Java 21 Temurin (`actions/setup-java@v4`, cache maven), Maven Wrapper `chmod +x cores/api-spring/mvnw`, `./mvnw verify --no-transfer-progress` (71 tests : unit + Testcontainers PostgreSQL) ; Docker natif `ubuntu-latest` (aucun `services:` — TC autonome) ; `permissions: contents:read` ; `concurrency: cancel-in-progress`.
- `cores/quality-core/scripts/quality-gates.mjs` : `SPRING_CWD = resolve(REPO_ROOT, 'cores/api-spring')` ; scope `api-spring` (8ème scope : `step('api-spring: verify', './mvnw', ['verify', '--no-transfer-progress'], SPRING_CWD)`) ; `SCOPE_DESCRIPTIONS['api-spring']` (mentionne Docker + Testcontainers) ; `SCOPE_EXCLUDED['api-spring']` (MinIO TC déferré, Tika déferré, smoke staging) ; `all-safe` updated : exclusion api-spring documentée + description mise à jour ; commentaire module mis à jour.
- `cores/quality-core/scripts/quality-gates.test.mjs` : `const SPRING_CWD` ajouté ; `listScopes` : **7 → 8 scopes** (api-spring inclus) ; suite `buildPlan — api-spring` (4 tests : 1 étape mvnw, cwd SPRING_CWD, exclusions, description) ; `all-safe` : test `n'inclut pas api-spring` + test `documente l'exclusion api-spring` ; **36 → 42 tests node:test** (42/42 ✅).
- `cores/quality-core/QUALITY_GATES_MATRIX.md` : légende L5 ajoutée ; ligne api-spring dans matrice §1 (typecheck/test/build L5) ; §2.9 `cores/api-spring` (table gate, exclusions, note branch protection) ; check `api-spring-verify` recommandé §3 ; scope api-spring dans §5 ; preuves §4 api-spring CI L5 71/71.
- Aucun changement métier api-spring. Aucun changement NestJS/Web/Mobile/UI Kit/Cloud.
- `api-spring` : **`FILE_UPLOAD_READY` → `CI_JAVA_READY`**.
- Statuts mis à jour : `NEXT_ACTIONS.md`, `FOUNDATION_CURRENT_STATE.md`, `QUALITY_GATES_MATRIX.md`.

### API Core Spring Boot 7 — AuditModule + download URL signée + CORS env var

- `cores/api-spring/src/main/resources/db/migration/V3__add_audit_logs.sql` (créé) : table `audit_logs` (8 colonnes : `id UUID`, `event_type VARCHAR(64)`, `user_id UUID` nullable, `target_type VARCHAR(64)` nullable, `target_id VARCHAR(255)` nullable, `ip_address VARCHAR(45)` nullable, `user_agent VARCHAR(512)` nullable, `created_at TIMESTAMPTZ`) + 3 index (`user_id`, `event_type`, `created_at`).
- `AuditEventType` enum (7 valeurs) : `LOGIN_SUCCESS`, `LOGIN_FAILURE`, `LOGOUT`, `TOKEN_REFRESH`, `FILE_UPLOAD`, `FILE_DOWNLOAD_URL_CREATED`, `ADMIN_ACCESS`.
- `AuditLog` entité JPA (sans extension `BaseEntity` — table append-only sans `updated_at`) ; `AuditLogRepository extends JpaRepository<AuditLog, UUID>`.
- `AuditService` : `@Transactional(propagation = Propagation.REQUIRES_NEW)` + best-effort (catch-all, jamais de fuite vers le flux principal) ; troncature ip (45 chars) et ua (512 chars) ; aucun payload sensible (ni password, ni refresh token, ni storageKey, ni URL signée, ni body fichier).
- `AuthService` mis à jour : `login()` / `logout()` / `refresh()` acceptent `ipAddress`/`userAgent` ; trace LOGIN_SUCCESS/FAILURE (userId=null pour FAILURE — anti-énumération), LOGOUT, TOKEN_REFRESH.
- `FileService` mis à jour : `upload()` trace FILE_UPLOAD (targetId = UUID fichier, jamais storageKey) ; `getDownloadUrl()` nouveau — ownership via `findByIdAndOwnerId()`, génère presigned URL, trace FILE_DOWNLOAD_URL_CREATED (jamais l'URL).
- `AdminController` mis à jour : `ping()` trace ADMIN_ACCESS.
- `AuthController`, `FilesController`, `AdminController` mis à jour : extraction `HttpServletRequest` pour ip/ua ; userId extrait de `Authentication.details` (posé par `JwtAuthenticationFilter.setDetails(userId)`).
- `JwtAuthenticationFilter` mis à jour : `auth.setDetails(userId)` — userId du JWT claim disponible downstream.
- `StorageService` interface mise à jour : `generatePresignedDownloadUrl(String storageKey, int ttlSeconds)` ajouté.
- `MinioStorageService` mis à jour : implémente `generatePresignedDownloadUrl()` via `GetPresignedObjectUrlArgs` (Method.GET, TimeUnit.SECONDS).
- `FakeStorageService` (test) mis à jour : implémente `generatePresignedDownloadUrl()` → URL factice déterministe `https://fake-storage.test/presigned/{storageKey}?expires={ttlSeconds}`.
- `FilesController` mis à jour : `GET /api/v1/files/{id}/download-url` — ownership check + `ResponseEntity.ok().cacheControl(CacheControl.noStore())`.
- `DownloadUrlResponseDto` record : `fileId`, `url`, `expiresIn`.
- `StoredFileRepository` mis à jour : `findByIdAndOwnerId(UUID id, UUID ownerId)` ajouté.
- `FilesConfig` mis à jour : `presignedUrlTtlSeconds` (défaut 300, `@Positive`) via `${FILES_PRESIGNED_TTL_SECONDS:300}`.
- `CorsConfig` créé : `@ConfigurationProperties(prefix="enistere.security.cors")`, `allowedOrigins` String via `${CORS_ALLOWED_ORIGINS:http://localhost:3000,...}`, `getAllowedOriginsList()` parsing CSV robuste.
- `SecurityConfig` mis à jour : `corsConfigurationSource()` utilise `corsConfig.getAllowedOriginsList()` — jamais `*` avec credentials.
- `application.yml` mis à jour : `enistere.security.cors.allowed-origins` + `enistere.files.presigned-url-ttl-seconds`.
- `@ConfigurationPropertiesScan` sur `EnistereCoreApplication` : `CorsConfig` + `FilesConfig` pickés automatiquement.
- Tests nouveaux : `AuditIntegrationTest` (7 tests — loginSuccess sans email en target, loginFailure sans password/email, logout, refresh sans refresh token, fileUpload sans storageKey, downloadUrl sans URL, adminPing) ; `FilesDownloadUrlIntegrationTest` (6 tests — 401, 200 owner, no-store, 404 autre user anti-énumération, 404 inexistant, pas de fuite interne) ; `CorsIntegrationTest` (3 tests — origin autorisée, origin inconnue, wildcard ignoré avec credentials) ; `FlywayMigrationTest` +3 tests (table `audit_logs`, 8 colonnes, 3 index). Total : **90/90 ✅ BUILD SUCCESS**.
- Aucun changement NestJS/Web/Mobile/UI Kit/Cloud/packages/root. Aucun secret réel. Aucun déploiement.
- `api-spring` : **`IMPLEMENTATION_AVANCEE` → `VALIDE_V1`**. §30 : **14/15 ✅ / 1 ⚠️ (C10 Redis différé) / 0 ✗**.
- Statuts mis à jour : `API_SPRING_V1_READINESS_REVIEW.md` (B1/B2/C15 fermés, VALIDE_V1), `FOUNDATION_CURRENT_STATE.md`, `IMPLEMENTATION_MATRIX.md`, `NEXT_ACTIONS.md`, `SESSION_HANDOFF.md`, `cores/api-spring/README.md`.

### API Core Spring Boot 6 — V1 Readiness Review

- `docs/project-status/API_SPRING_V1_READINESS_REVIEW.md` (créé) : revue complète §30 CORE_SPECIFICATION.md — 15 critères audités sur code source Java, migrations SQL, `application.yml`, CI L5 71/71 ✅.
- Résultat §30 : **11/15 ✅ + 3/15 ⚠️ + 1/15 ✗** (C1–C8 ✅ C9 ⚠️ C10 ⚠️ C11–C13 ✅ C14 ✗ C15 ⚠️).
- Bloquants V1 : **B1** — `AuditModule` (§9 module obligatoire) complètement absent : aucune table `audit_logs` dans V1/V2, aucun `AuditService`, aucun `@Aspect`, aucun event `LOGIN_SUCCESS/FAILURE/LOGOUT/TOKEN_REFRESH/FILE_UPLOAD/ADMIN_ACCESS` tracé. **B2** — URL signée (`GET /files/:id/download-url`, presigned URL §20) absente dans `FilesController`.
- Réserves acceptées : R1 MinIO TC (FakeStorageService pattern intentionnel), R2 CORS hardcodé (dev local — variable `CORS_ALLOWED_ORIGINS` à externaliser SB7), R3 rate limiting différé, R4 Tika MIME différé, R5 Redis absent.
- Décision : `CI_JAVA_READY` → **`IMPLEMENTATION_AVANCEE`**. `VALIDE_V1` différé jusqu'à fermeture B1+B2.
- Aucun code runtime Spring Boot modifié. Aucun workflow CI. Aucune dépendance. Aucun changement NestJS/Web/Mobile/UI Kit/Cloud/packages/root.
- Statuts mis à jour : `FOUNDATION_CURRENT_STATE.md` (statut `IMPLEMENTATION_AVANCEE`), `IMPLEMENTATION_MATRIX.md` (SB6 entry), `NEXT_ACTIONS.md` (SB6 ✅ + SB7 next), `SESSION_HANDOFF.md`.
- Prochaine action : **API Core Spring Boot 7 — AuditModule + download URL signée + CORS env var**.

### API Core Spring Boot 4 — OpenAPI + Upload MinIO/S3

- `pom.xml` : ajout `springdoc-openapi-starter-webmvc-ui:2.8.6` (OpenAPI SB 4.x), `io.minio:minio:8.5.17` (S3-compatible storage).
- `OpenApiConfig` : bean `OpenAPI` (titre, version, description, `SecurityScheme` Bearer JWT).
- `FilesConfig` : `@ConfigurationProperties(prefix="enistere.files")` + `@Validated` — endpoint, bucket, region, accessKey, secretKey, maxSizeBytes ; valeurs via env vars uniquement.
- `StorageConfig` : `MinioClient` bean `@Profile("!test")`.
- `application.yml` : `spring.servlet.multipart.max-file-size: 10MB` / `max-request-size: 11MB` ; `springdoc.api-docs.path: /v3/api-docs` ; `enistere.files.*` via env vars (aucun secret réel).
- `V2__add_stored_files.sql` : table `stored_files` (13 colonnes, `owner_id` FK `users(id)`, `storage_key UNIQUE`) + 3 index (`owner_id`, `category`, `status`).
- `FileCategory` (9 valeurs : IMAGE, DOCUMENT, AVATAR, MEDIA, VIDEO, AUDIO, IDENTITY_DOCUMENT, ATTACHMENT, OTHER), `FileStatus` (5 valeurs).
- `StoredFile` : entité JPA extends `BaseEntity` ; champs internes : `storageKey`, `bucket`, `ownerId`, `mimeType`, `extension` ; champs metadata : `originalName`, `size`, `category`, `status`, `subjectId`.
- `StoredFileRepository` : Spring Data JPA.
- `FileUploadRequestDto` : `@NotNull FileCategory category`, `@Size(max=128) String subjectId` (multipart form params).
- `StoredFileResponseDto` (DTO public) : `id`, `originalName`, `contentType`, `size`, `category`, `createdAt` — **jamais** `storageKey`, `bucket`, `signedUrl`, `ownerId`.
- `StorageService` (interface) + `MinioStorageService` (`@Profile("!test")`, `PutObjectArgs`/`RemoveObjectArgs`) + `FakeStorageService` test (`@Profile("test")`, in-memory stub, `src/test/java`).
- `FileService` : validation MIME whitelist (14 types : images, PDF, office, vidéo, audio, texte) ; validation taille (`maxSizeBytes`) ; `storageKey` 100% serveur (`category/UUID.ext`) ; `originalName` sanitisé (basename, max 255 chars) ; log structuré sans chemin/contenu/URL signée ; `@Transactional`.
- `FilesController` : `POST /api/v1/files/upload` (`multipart/form-data`, `@Tag("Files")`, `@Operation`, `Authentication auth`) ; réponse 201 + DTO public uniquement.
- `SecurityConfig` mis à jour : `/v3/api-docs/**`, `/swagger-ui/**`, `/swagger-ui.html` en `permitAll`.
- `GlobalExceptionHandler` mis à jour : `BindException` → 400 (validation `@ModelAttribute`) ; `MaxUploadSizeExceededException` → 413 ; `HttpMediaTypeNotSupportedException` → 415.
- `application-test.yml` : `enistere.files.*` dummy + springdoc disabled ; profil "test" active `FakeStorageService`.
- Tests : `FileValidationTest` (16 tests unitaires — MIME whitelist, taille, `FileCategory` 9 valeurs) ; `FilesUploadIntegrationTest` (9 tests — 401 sans token, 201 DTO public, non-leak internalFields, 400 category manquant/invalide, 415 MIME bloqué, 400 empty, 201 subjectId) ; `FlywayMigrationTest` +3 tests (table `stored_files`, 13 colonnes, 3 index).
- `./mvnw verify` : **71/71 ✅ BUILD SUCCESS**.
- Adaptations Spring Boot 4.x : springdoc 2.8.6 compatible SB 4.1.0/SF 7.x sans changement artifact ; `Authentication auth` (pas `@AuthenticationPrincipal UserDetails`) car `JwtAuthenticationFilter` pose le principal comme `String` email.
- Non livré (Spring Boot 5) : liste/delete/download URL signée, MinIO Testcontainers, validation binaire Apache Tika, quarantaine, CI Java.
- `api-spring` : **`PERSISTENCE_RBAC_READY` → `FILE_UPLOAD_READY`**.
- Statuts mis à jour : `NEXT_ACTIONS.md`, `FOUNDATION_CURRENT_STATE.md`.

### API Core Spring Boot 3 — PostgreSQL + JPA + Flyway + RBAC

- `pom.xml` : ajout `spring-boot-starter-data-jpa`, `postgresql` (runtime), `spring-boot-starter-flyway`, `flyway-database-postgresql` (runtime), `bcprov-jdk18on:1.82` (Bouncy Castle — Argon2 dep explicite), `spring-boot-testcontainers`, `testcontainers-junit-jupiter`, `testcontainers-postgresql` (TC 2.0.5 artifact IDs).
- Migration Flyway `V1__init_schema.sql` : 6 tables (`users`, `roles`, `permissions`, `user_roles`, `role_permissions`, `refresh_tokens`) + 5 index ; `ddl-auto: none` (Flyway autorité du schéma).
- `BaseEntity` (`@MappedSuperclass`, UUID PK auto, `@CreatedDate`/`@LastModifiedDate`), `DatabaseConfig` (`@EnableJpaAuditing`), `Argon2Config` (`@ConfigurationProperties`).
- Entités JPA : `User` (email, passwordHash Argon2, active, lastLoginAt, Set<Role>), `Role` (name, Set<Permission>), `Permission` (name, description), `RefreshToken` (tokenHash SHA-256, expiresAt, revokedAt).
- Repositories : `UserRepository`, `RoleRepository`, `PermissionRepository` (JPQL `findPermissionNamesByUserId`), `RefreshTokenRepository`.
- `EnistereUserDetailsService` (`UserDetailsService` DB-backed via `PermissionRepository`).
- `JwtTokenProvider` mis à jour : `generateAccessToken(email, userId, permissions)` — claims `userId` + `permissions[]` (stateless RBAC) ; suppression `extractRole`, ajout `extractUserId` + `extractPermissions`.
- `JwtAuthenticationFilter` mis à jour : lit `permissions[]` du JWT → `List<SimpleGrantedAuthority>`.
- `AuthService` : login Argon2 verify, `buildTokenResponse` (access + refresh), refresh rotation (revoke + issue), logout (revoke), `me` (DTO sans entité).
- `AuthController` mis à jour : refresh réel (`POST /api/v1/auth/refresh`), logout avec `@RequestBody(required = false)` (backward compat.), DTOs `RefreshRequestDto`/`LogoutRequestDto`.
- `AdminController` : `GET /api/v1/admin/ping` avec `@PreAuthorize("hasAuthority('admin.access')")`.
- `SecurityConfig` mis à jour : `Argon2PasswordEncoder(argon2Config.*)` ; `DaoAuthenticationProvider(userDetailsService)` ; `AuthenticationManager` bean ; `/api/v1/auth/refresh` en `permitAll`.
- `GlobalExceptionHandler` mis à jour : `AccessDeniedException`/`AuthenticationException` re-throwées vers Spring Security (évite 500 sur 403).
- Tests : `AbstractIntegrationTest` (singleton TC container + `@DynamicPropertySource`), `TestDataFactory` (`@Component @Profile("test")`), `FlywayMigrationTest` (4 tests tables/index), `JwtTokenProviderTest` mis à jour (9 tests — permissions[], userId, sans extractRole), `AuthControllerTest` mis à jour (10 tests DB-backed), `AuthIntegrationTest` (14 tests), `RbacIntegrationTest` (5 tests RBAC).
- `./mvnw verify` : **43/43 ✅ BUILD SUCCESS**.
- Adaptations Spring Boot 4.x : `DaoAuthenticationProvider(userDetailsService)` (constructeur obligatoire SS7) ; `spring-boot-starter-flyway` requis (FlywayAutoConfiguration hors `spring-boot-autoconfigure` en SB 4.x) ; TC 2.0.5 artifact IDs `testcontainers-junit-jupiter`/`testcontainers-postgresql`.
- `api-spring` : **`STARTER_INITIALISE` → `IMPLEMENTATION_PARTIELLE`**, sous-statut `PERSISTENCE_RBAC_READY`.
- Statuts mis à jour : `README.md`, `NEXT_ACTIONS.md`, `FOUNDATION_CURRENT_STATE.md`, `IMPLEMENTATION_MATRIX.md`, `SESSION_HANDOFF.md`.

### API Core Spring Boot 2 — Starter minimal Maven

- `cores/api-spring/pom.xml` : Spring Boot 4.1.0 Parent POM + JJWT 0.12.6 + Java 21 (ADR-041 : Maven).
- `mvnw` / `mvnw.cmd` / `.mvn/wrapper/maven-wrapper.properties` : Maven Wrapper 3.9.12.
- Structure Java `com.enistere.core` : `EnistereCoreApplication`, `JwtConfig`, `SecurityConfig` (STATELESS, JWT filter, CORS dev, no CSRF, Spring Security 7.x), `ApiError`, `GlobalExceptionHandler`, `JwtTokenProvider` (JJWT 0.12.x), `JwtAuthenticationFilter`, `AuthController` + DTOs.
- Endpoints : `POST /api/v1/auth/login` (stub → JWT), `GET /api/v1/auth/me`, `POST /api/v1/auth/logout` (stateless 204), `POST /api/v1/auth/refresh` (501 — DB en Spring Boot 3), `GET /actuator/health`, `GET /actuator/info`.
- Auth stub sans DB (credentials config env vars `STUB_USERNAME`/`STUB_PASSWORD`, JWT réel JJWT 0.12.x, refresh token 501 déféré).
- Aucun secret hardcodé : `JWT_SECRET` requis en production (env var).
- Adaptations Spring Boot 4.x : `@AutoConfigureMockMvc` absent → `MockMvcBuilders.webAppContextSetup` + `SecurityMockMvcConfigurers.springSecurity()` ; `ObjectMapper` bean non injecté en test → instance locale ; `HttpMessageNotReadableException` géré (400 au lieu de 500).
- Tests : **18/18 ✅** (`JwtTokenProviderTest` 7 · `AuthControllerTest` 10 · `EnistereCoreApplicationTests` 1).
- `./mvnw verify` : **BUILD SUCCESS**.
- `api-spring` : **`SPECIFICATION_DOCUMENTAIRE` → `STARTER_INITIALISE`**.
- Statuts mis à jour : `README.md`, `NEXT_ACTIONS.md`, `FOUNDATION_CURRENT_STATE.md`, `IMPLEMENTATION_MATRIX.md`, `SESSION_HANDOFF.md`, `DECISIONS_REGISTER.md`.

### API Core Spring Boot 2A — ADR build system Maven vs Gradle

- Nouvel ADR : `docs/adr/ADR-041-build-system-api-spring-maven-vs-gradle.md`.
- Décision : **Maven** comme build system principal pour API Core Spring Boot V1.
- `pom.xml` avec Spring Boot Parent POM, `mvn verify` comme commande CI canonique, Maven Wrapper (`mvnw`) inclus.
- Gradle autorisé uniquement par exception documentée dans un projet dérivé.
- Déblocage : la mission Spring Boot 2 (starter minimal) peut créer `pom.xml` sans ambiguïté.
- Contexte : `strategy/06_DEPENDENCY_STRATEGY.md §5.2` — préférer les standards de l'écosystème ; Spring Initializr default = Maven.
- Aucun `pom.xml`, aucun code Java, aucune dépendance créés dans cette mission.
- Statuts mis à jour : `ADR_BACKLOG.md`, `DECISIONS_REGISTER.md`, `NEXT_ACTIONS.md`, `FOUNDATION_CURRENT_STATE.md`, `IMPLEMENTATION_MATRIX.md`, `SESSION_HANDOFF.md`.

### API Core Spring Boot 1 — Core specification

- `cores/api-spring/CORE_SPECIFICATION.md` — 42 sections : résumé exécutif, rôle, objectifs, périmètre fonctionnel, architecture cible (feature-package, DTO séparés entités, controllers légers), structure cible `src/` indicative, modules obligatoires V1 (SecurityConfig, JwtTokenProvider, AuthModule, UsersModule, RolesModule, PermissionsModule, HealthModule, GlobalExceptionHandler, ValidationConfig, AuditModule, OpenApiConfig, CacheConfig, StorageModule), modules optionnels (Mail/Notifications/Scheduler/Realtime/Search/Admin/Webhook/Report).
- Standards API (versioning `/api/v1/`, format `ApiError`, pagination `Page<T>`, codes HTTP) + standards sécurité (Spring Security, validation Jakarta Bean Validation, method security, audit logs, CORS strict, OWASP Dependency Check) + standards qualité Java (`strategy/08_STANDARDS.md §16`).
- Auth JWT : access token court, refresh token persisté invalidable, rotation recommandée, `JwtAuthenticationFilter`, `@Public`, `@CurrentUser`.
- §30 critères de validation V1 (15 critères). §40 décisions pendantes : Maven vs Gradle (ADR avant Spring Boot 2), queue broker, observabilité. §41 missions ordonnées Spring Boot 1→V1. §42 cohérence avec API Core NestJS.
- `cores/api-spring/README.md` — statut, modules cibles, stack, décisions pendantes, missions.
- Aucun starter, aucun `pom.xml`/`build.gradle`, aucun code Java, aucune dépendance.
- `api-spring` : **`DOSSIER_SEULEMENT` → `SPECIFICATION_DOCUMENTAIRE`**.
- Statuts mis à jour : `IMPLEMENTATION_MATRIX.md`, `NEXT_ACTIONS.md`, `SESSION_HANDOFF.md`, `FOUNDATION_CURRENT_STATE.md`.

### V3 Post Flutter Roadmap Decision

- Nouveau rapport : `docs/project-status/V3_POST_FLUTTER_ROADMAP_DECISION.md`.
- Correction de cohérence : `Mobile Core Flutter` est aligné en `VALIDE_V1` dans `IMPLEMENTATION_MATRIX.md`
  après `MOBILE_FLUTTER_V1_FINAL_READINESS_DECISION.md`.
- ADR-034 est aligné en `IMPLEMENTE` dans `DECISIONS_REGISTER.md` : Flutter V1 applique Material 3
  contrôlé par tokens Enistere.
- Prochaine action unique : **API Core Spring Boot 1 — Core specification** (`cores/api-spring/CORE_SPECIFICATION.md`
  + `README.md`, sans starter ni dépendance Java).

### Mobile Core Flutter V1 Final Readiness Decision

- Décision formelle : Mobile Core Flutter promu **`IMPLEMENTATION_AVANCEE` → `VALIDE_V1`**.
- R1 (iOS Linux) acceptée comme réserve environnementale non bloquante — identique à RN B2.
- Score §29 : 9/11 pleinement satisfaits (C2–C10) + 2/11 PARTIAL (C1, C11 — même contrainte iOS Linux R1).
- Zéro bloquant restant : B1 (Flutter 7), B2 (Flutter 8), B3 (Flutter 9), B4 (Flutter 10), B5 (Flutter 11) tous FERMÉS.
- Vérifications : 218/218 tests headless ✅ · smoke `emulator-5554` 7/7 ✅ · `quality-gates docs` 2/2 ✅ · `git diff --check` ✅.
- Aucun code Flutter modifié dans cette décision.
- Rapport : `docs/project-status/MOBILE_FLUTTER_V1_FINAL_READINESS_DECISION.md`.
- Statuts mis à jour : `MOBILE_FLUTTER_V1_READINESS_REVIEW.md`, `IMPLEMENTATION_MATRIX.md`,
  `NEXT_ACTIONS.md`, `SESSION_HANDOFF.md`, `FOUNDATION_CURRENT_STATE.md`,
  `cores/mobile-flutter/README.md`.

### Mobile Core Flutter 11 — Sign-in form validation (B5)

- `SignInScreen` : refactorisé de `ConsumerWidget` → `ConsumerStatefulWidget` ; formulaire complet avec `GlobalKey<FormState>`.
- Champ email : `TextFormField` `Key('emailField')`, validation `requis + format @`, `keyboardType: emailAddress`, `TextInputAction.next`.
- Champ mot de passe : `TextFormField` `Key('passwordField')`, `obscureText: true`, `TextInputAction.done`, `FocusNode` pour navigation clavier.
- Soumission : `_submit()` valide le formulaire avant appel `authController.signIn()` ; catch générique sans exposer les credentials ; `_loading` désactive le bouton durant l'appel.
- Erreur auth : message générique `Semantics(liveRegion: true)` pour l'accessibilité ; aucun credential ni token dans les logs (ADR-015).
- Layout : `SingleChildScrollView + ConstrainedBox(minHeight) + IntrinsicHeight` — centré, scrollable, sans overflow sur petits écrans.
- `test/widget/sign_in_screen_test.dart` : 10 tests widget (`_fillAndSubmit()` helper + `ThrowingAuthController` stub).
  - Tests : heading Enistere · champs présents · touch target 44px · email requis · format email @ · mot de passe requis · soumission valide navigue HomeScreen · échec signIn affiche erreur générique · obscureText true · couleur erreur colorDanger.
- `test/widget/router_guard_test.dart` : test `signing in navigates from SignInScreen to HomeScreen` adapté — `enterText` email + password avant tap.
- `integration_test/smoke_test.dart` : 2 tests adaptés — `sign-in tap navigates to HomeScreen` + `logout tap returns to SignInScreen` remplissent email + password avant tap.
- Smoke `emulator-5554` (Pixel 6a, Android API 33, x86_64) : **7/7 passés** ✅ (aucune régression).
- **B5 FERMÉ.** C9 : ❌ → ✅. Score §29 : 8/11 → 9/11.
- 218/218 tests headless. `flutter pub get` ✅ · `flutter analyze` 0 issues ✅ · `flutter test` 218/218 ✅ ·
  `dart format` 0 changements ✅ · `quality-gates docs` 2/2 ✅ · `git diff --check` ✅.
- Rapport : `docs/project-status/MOBILE_FLUTTER11_ANDROID_SMOKE_REPORT.md`.
- Statuts mis à jour : `MOBILE_FLUTTER_V1_READINESS_REVIEW.md`, `IMPLEMENTATION_MATRIX.md`,
  `NEXT_ACTIONS.md`, `SESSION_HANDOFF.md`, `FOUNDATION_CURRENT_STATE.md`,
  `cores/mobile-flutter/README.md`.

### Mobile Core Flutter 10 — UI states Foundation (B4)

- `LoadingState` : `CircularProgressIndicator` couleur primaire `ColorScheme` ; message optionnel ; `Semantics(label:)` accessible.
- `EmptyState` : `title` obligatoire, `description?`, action `OutlinedButton` (garde `actionLabel + onAction` requis).
- `ErrorState` : `title` obligatoire, `message?`, action `FilledButton` ; `Semantics(liveRegion: true)` ; couleur titre depuis `EnistereThemeExtension.colorDanger`.
- `SuccessState` : `title` obligatoire, `message?`, action `FilledButton` ; `Semantics(liveRegion: true)` ; couleur titre depuis `EnistereThemeExtension.colorSuccess`.
- Tous les widgets lisent les espacements depuis `EnistereThemeExtension` (spacing, padding) — tokens Enistere ADR-034.
- `test/widget/states_test.dart` : 39 tests widget (LoadingState 9 + EmptyState 10 + ErrorState 10 + SuccessState 10).
  - Groupes par widget : rendu title/message/action · callback · guard action sans actionLabel · semantics · couleur extension · light/dark sans throw · overflow texte long.
- Smoke `emulator-5554` (Pixel 6a, Android API 33, x86_64) : **7/7 passés en 10s** ✅ (aucune régression).
- **B4 FERMÉ.** C7 : ❌ → ✅. Score §29 : 7/11 → 8/11. B5 (login form) restant.
- 213/213 tests headless. `flutter pub get` ✅ · `flutter analyze` 0 issues ✅ · `flutter test` 213/213 ✅ ·
  `dart format` 0 changements ✅ · `quality-gates docs` 2/2 ✅ · `git diff --check` ✅.
- Rapport : `docs/project-status/MOBILE_FLUTTER10_ANDROID_SMOKE_REPORT.md`.
- Statuts mis à jour : `MOBILE_FLUTTER_V1_READINESS_REVIEW.md`, `IMPLEMENTATION_MATRIX.md`,
  `NEXT_ACTIONS.md`, `SESSION_HANDOFF.md`, `FOUNDATION_CURRENT_STATE.md`,
  `cores/mobile-flutter/README.md`.

### Mobile Core Flutter 9 — RefreshInterceptor + refreshSession coalescent

- `AuthApi` abstract interface + `PlaceholderAuthApi` — seam testable sans backend réel (Foundation V1).
- `authApiProvider` Riverpod — injectable, override en test.
- `AuthController.refreshSession()` — lit le `refreshToken` depuis `SecureSessionStore`, coalescence des appels concurrents (`_refreshFuture ??= _doRefresh().whenComplete(...)`) ; met à jour `_accessToken` en mémoire ; purge (`_purgeSession`) sur refreshToken null ou échec.
- `_AuthInterceptor` inchangé ; `restoreSession()` inchangé (lazy refresh — smoke tests existants sans refreshToken non impactés).
- `typedef TokenRefresher = Future<String?> Function()` ajouté à `dio_client.dart`.
- `createDioClient` : paramètre optionnel `refresher`; ordre intercepteurs : `[_AuthInterceptor, LoggingInterceptor, RefreshInterceptor, ErrorInterceptor]` — `RefreshInterceptor` AVANT `ErrorInterceptor` (Dio 5.x error chain FORWARD order).
- `RefreshInterceptor extends Interceptor` — intercepts 401 uniquement ; délègue à `refresher()` ; tag anti-boucle `extra['_refreshed']` ; retry exactement 1 fois via `dio.fetch()` ; ne boucle jamais ; 403 non intercepté.
- `try/catch` autour de `await refresher()` — garantit que `handler.next/resolve/reject` est toujours appelé (`async void` safety dans Dio 5.x).
- `dioClientProvider` : passe `controller.refreshSession` comme `refresher`.
- `test/unit/api/refresh_interceptor_test.dart` : 9 tests unitaires via `_CaptureAdapter` (adapter injectable).
  - Groupes : succès 401→refresh→retry 200 (1) · coalescence (1) · refreshToken null→purge+401 (1) · refresh throw→purge+401 (1) · retry 401→pas de boucle (1) · 403→pas de refresh (1) · passthrough non-401 (1) · aucun token dans les logs (1) · sans refresher (1).
- `test/unit/auth/auth_controller_test.dart` : 5 nouveaux tests `refreshSession()` (14 tests total).
  - Groupes : refreshSession OK (1) · coalescence (1) · null refreshToken→purge+unauthenticated (1) · AuthApi throw→purge+unauthenticated (1) · purge vide les champs (1).
- Smoke `emulator-5554` (Pixel 6a, Android API 33, x86_64) : **7/7 tests passés en 10s** ✅.
- **B3 FERMÉ.** C3 : `❌ PARTIAL` → `✅`. C4 : `✅ PARTIAL` → `✅`. B4–B5 restent ouverts.
- 174/174 tests headless. `flutter pub get` ✅ · `flutter analyze` 0 issues ✅ · `flutter test` 174/174 ✅ ·
  `dart format` 0 changements ✅ · `quality-gates docs` 2/2 ✅ · `git diff --check` ✅.
- Rapport : `docs/project-status/MOBILE_FLUTTER9_ANDROID_SMOKE_REPORT.md`.
- Statuts mis à jour : `MOBILE_FLUTTER_V1_READINESS_REVIEW.md`, `IMPLEMENTATION_MATRIX.md`,
  `NEXT_ACTIONS.md`, `SESSION_HANDOFF.md`, `FOUNDATION_CURRENT_STATE.md`,
  `cores/mobile-flutter/README.md`.

### Mobile Core Flutter 8 — SecureStorage seam + adapter

- `flutter_secure_storage: ^10.3.1` ajouté (Keychain iOS / EncryptedSharedPreferences+Keystore Android).
- `SecureStorageAdapter` (abstract interface) — seam permettant les tests unitaires sans platform channels.
- `FlutterSecureStorageAdapter` — adapter production wrappant `FlutterSecureStorage`.
- `SecureSessionStore` implements `SessionStore` — stocke `SessionEnvelope` JSON ; purge défensive sur données corrompues.
- `SessionEnvelope` enrichi : `factory fromJson` + `toJson` + `refreshToken?` ; `toString()` omet `refreshToken` (ADR-015).
- `AuthController.restoreSession()` renommé public (§9.11 spec) — lit l'enveloppe depuis `SecureSessionStore` au démarrage.
- Access token maintenu exclusivement en mémoire (`_accessToken`) — jamais dans `SessionEnvelope`, logs, état ou store persistant.
- `test/unit/auth/secure_session_store_test.dart` : 23 tests unitaires via `FakeSecureStorageAdapter` (in-memory).
  - Groupes : read/write/clear (6) · validation défensive (5) · garantie access token (4) · signOut (2) · sérialisation (6).
- `integration_test/smoke_test.dart` : 2 nouveaux tests SecureStorage B2 sur device — round-trip Keystore réel + session restore.
- Smoke `emulator-5554` (Pixel 6a, Android API 33, x86_64) : **7/7 tests passés en 10s** ✅.
- **B2 FERMÉ.** C3 : restore ✅ / refresh B3. C4 : ❌ → ✅ PARTIAL. B3→B5 restent ouverts.
- 160/160 tests headless. `flutter pub get` ✅ · `flutter analyze` 0 issues ✅ · `flutter test` 160/160 ✅ ·
  `dart format` 0 changements ✅ · `quality-gates docs` 2/2 ✅ · `git diff --check` ✅.
- Rapport : `docs/project-status/MOBILE_FLUTTER8_ANDROID_SMOKE_REPORT.md`.
- Statuts mis à jour : `MOBILE_FLUTTER_V1_READINESS_REVIEW.md`, `IMPLEMENTATION_MATRIX.md`,
  `NEXT_ACTIONS.md`, `SESSION_HANDOFF.md`, `FOUNDATION_CURRENT_STATE.md`,
  `cores/mobile-flutter/README.md`.

### Mobile Core Flutter 7 — Platform dirs + smoke Android

- Dossiers `android/` générés via `flutter create --platforms=android --org com.enistere .`.
- `MainActivity.kt` : `FlutterActivity()` uniquement, aucune logique métier.
- `AndroidManifest.xml` : déclarations standard Flutter, aucune permission sensible.
- `.gitignore` Flutter et `.metadata` tooling versionnés.
- `test/widget_test.dart` (template counter-app incompatible) supprimé.
- Smoke `emulator-5554` (Pixel 6a, Android API 33, x86_64) : `assembleDebug` 512.2s ✅ · APK 924ms ✅ ·
  **5/5 tests `integration_test/smoke_test.dart` passés en 9s** ✅.
- **B1 FERMÉ.** C1 et C11 §29 : ❌ → ✅ PARTIAL (Android réel, iOS R1 maintenu).
- 136 tests headless inchangés. B2→B5 restent ouverts.
- `flutter pub get` ✅ · `flutter analyze` 0 issues ✅ · `flutter test` 136/136 ✅ ·
  `dart format` 0 changements ✅ · `quality-gates docs` 2/2 ✅ · `git diff --check` ✅.
- Rapport : `docs/project-status/MOBILE_FLUTTER7_ANDROID_SMOKE_REPORT.md`.
- Statuts mis à jour : `MOBILE_FLUTTER_V1_READINESS_REVIEW.md`, `IMPLEMENTATION_MATRIX.md`,
  `NEXT_ACTIONS.md`, `SESSION_HANDOFF.md`, `FOUNDATION_CURRENT_STATE.md`,
  `cores/mobile-flutter/README.md`.

### Mobile Core Flutter V1 Readiness Review

- Rapport `docs/project-status/MOBILE_FLUTTER_V1_READINESS_REVIEW.md` produit.
- Verdict : **`TEST_WIDGET_PASSED` → `IMPLEMENTATION_AVANCEE`** — 5/11 critères §29 satisfaits.
- Critères satisfaits (§29) : navigation go_router (C2), upload multipart Dio (C6), thème Material 3
  Enistere (C8), tests unitaires et widget (C10), appels API Dio (C5).
- Bloquants V1 non satisfaits :
  - B1 : Android runtime — library sans dossiers `android/` (architectural) ; iOS Linux (environnemental).
  - B2 : `flutter_secure_storage` absent — `InMemorySessionStore` placeholder uniquement.
  - B3 : `RefreshInterceptor` absent — 401 surfacé sans refresh coalescent.
  - B4 : UI states absents — `LoadingState`/`EmptyState`/`ErrorState`/`SuccessState` non implémentés.
  - B5 : Login form absent — `SignInScreen` bouton mock uniquement, pas de champs email/password.
- Réserves acceptées : R1 iOS Linux (identique RN B2), R2 pas de backend réel, R3 Freezed/build_runner
  délibérément absent, R4 logger redaction, R5 PreferenceStore seam.
- Comparaison RN VALIDE_V1 : RN avait tous ses modules (SecureStore, RefreshInterceptor, UI states,
  login form) + smoke Android réel. Flutter a 5 modules manquants réels.
- Chemin vers VALIDE_V1 : Flutter 7 (platform dirs) → Flutter 8 (SecureStorage) →
  Flutter 9 (RefreshInterceptor) → Flutter 10 (UI states) → Flutter 11 (login form) → Flutter V1 final.
- `quality-gates docs` 2/2 ✅ · `git diff --check` ✅.
- Status mis à jour : `IMPLEMENTATION_MATRIX.md`, `NEXT_ACTIONS.md`, `SESSION_HANDOFF.md`,
  `FOUNDATION_CURRENT_STATE.md`, `cores/mobile-flutter/README.md`.

### Mobile Core Flutter 6 — Tests + smoke

- Dépendance dev : `integration_test: sdk: flutter` ajouté.
- Tests widget (`test/widget/`) — Flutter 6 :
  - `splash_screen_test.dart` (4 tests) : render sans erreur, `CircularProgressIndicator` présent,
    centré dans le Scaffold, `SplashScreen` affiché pendant le chargement auth via `_BlockingSessionStore`
    (`Completer` non résolu — maintient l'app en état loading, `pump()` sans `pumpAndSettle()`).
  - `sign_in_screen_test.dart` (5 tests) : heading "Enistere", bouton "Se connecter", hauteur ≥ 44 dp
    (`minTouchTarget` ADR-034), tap → navigation hors `SignInScreen`, couleur primaire
    = `EnistereTokens.lightPrimary` (0xFF2563EB).
  - `home_screen_test.dart` (7 tests) : heading "Mobile Core Flutter", AppBar titre "Enistere",
    icône logout, `userId` de session affiché, texte ADR-034, `EnistereThemeExtension` accessible
    (spacingMd/minTouchTarget), bouton logout → `SignInScreen`.
  - Pattern commun : `InMemorySessionStore` + `sessionStoreProvider.overrideWithValue` (Riverpod).
  - Import critique : `sessionStoreProvider` est dans `auth_controller.dart`, pas `session_store.dart`.
- Tests d'intégration (`integration_test/smoke_test.dart`) — 5 tests device :
  startup sans crash, unauthenticated → `SignInScreen`, sign-in → `HomeScreen`, logout → `SignInScreen`,
  session restaurée → `HomeScreen` avec userId.
  RÉSERVE ARCHITECTURALE : `mobile-flutter` est un package library sans dossiers `android/`/`ios/`/`linux/`.
  `flutter test integration_test/ -d <device>` requiert un projet Flutter complet avec platform dirs.
  L'Android emulator `emulator-5554` (API 33) est disponible sur cet hôte mais bloqué architecturalement.
  Procédure pour projets dérivés : `flutter test integration_test/smoke_test.dart -d emulator-5554`.
- `scripts/smoke.sh` : smoke runner exécutable.
  `bash scripts/smoke.sh` — tests headless uniquement (`flutter test`).
  `bash scripts/smoke.sh --android` — + intégration Android (device requis).
  `bash scripts/smoke.sh --ios` — + intégration iOS (macOS + Xcode requis).
  Auto-détection `emulator-5554` ou premier device Android attaché.
- `docs/project-status/MOBILE_FLUTTER6_SMOKE_REPORT.md` : rapport versionné —
  statut `TEST_WIDGET_PASSED`, 136/136 tests headless (14 suites), 18 chemins critiques,
  6 gates qualité verts, 3 réserves documentées (R1 intégration, R2 iOS, R3 upload UI).
- Tests `flutter test` 136/136 ✅ (+16 tests widget Flutter 6) ·
  `flutter analyze` 0 issues ✅ · `dart format` 0 changements ✅ · `quality-gates docs` 2/2 ✅.
- Mobile Core Flutter : **`UPLOAD_READY`** → **`TEST_WIDGET_PASSED`**.
- Mises à jour : `cores/mobile-flutter/README.md`, `FOUNDATION_CURRENT_STATE.md`,
  `IMPLEMENTATION_MATRIX.md`, `NEXT_ACTIONS.md`, `SESSION_HANDOFF.md`.
- Interdits respectés : aucun endpoint réel obligatoire ; aucun backend requis ; aucun nouveau module
  fonctionnel ; aucun picker natif ; aucun stockage natif réel ; aucun succès iOS artificiel ;
  aucun changement RN/Web/API/UI Kit/Cloud/root/workflows.

### Mobile Core Flutter 5 — Upload multipart primitives

- Dépendance : `http_parser: ^4.0.0` (déjà transitive via Dio 5.10.0 ; ajout en dépendance directe pour
  `MediaType.parse` dans `MultipartFile.fromFile`).
- `AppFile(path, name, mimeType, sizeBytes?)` — descripteur pur sans logique de validation métier.
  SÉCURITÉ (ADR-007/015) : `path` est un chemin device, `name` peut être PII — ne jamais loguer ni stocker
  bruts ; utiliser `describeFileForLog`.
- `SafeFileDescriptor(mimeType, extension?)` — représentation safe pour logs/télémétrie.
  `describeFileForLog(AppFile) → SafeFileDescriptor` : retourne mimeType + extension sanitisée
  (alphanumérique, max 12 car, lowercase) — JAMAIS path, JAMAIS nom de fichier brut.
- `isValidAppFile` — garde structurelle (path/name/mimeType non vides, mimeType contient `/`).
  UX uniquement ; le backend reste l'autorité (ADR-007).
- `isAllowedUploadContentType(file, allowedTypes)` — match exact (`image/jpeg`), groupe wildcard
  (`image/*`), ou `*/*` ; liste vide = tout autorisé (pas de filtre). UX uniquement.
- `FileCategory` enum (9 valeurs : image/document/avatar/media/video/audio/identityDocument/attachment/other)
  + `FileCategoryExtension.apiValue` → `'IMAGE'` … `'IDENTITY_DOCUMENT'`.
- `UploadedFileMetadata(id, category)` + `fromJson` — DTO minimal public server-assigned.
  JAMAIS : URL signée, bucket, device path, token, champ interne.
- `UploadService` (abstract interface) + `DioUploadService(dio, uploadPath='/files', multipartFileFactory?)`.
  `MultipartFileFactory` injectable pour l'isolation des tests (tests utilisent `MultipartFile.fromBytes`,
  pas de vrai filesystem). `FormData` construit frais à chaque appel (stream non rejouable). Content-Type
  posé par Dio avec boundary UNIQUE automatique — JAMAIS forcé manuellement. Aucun retry automatique.
- Mapping erreurs : `e.error is AppApiError` → rethrow ; sinon `mapDioError` (fallback sans ErrorInterceptor).
  413→`TooLargeError`, 415→`UnsupportedTypeError`, 401→`UnauthorizedError`, réseau→`NetworkError`.
- Tests `flutter test` 120/120 ✅ (+34 tests) : `app_file_test.dart` (21 : valid/invalid, sizeBytes optionnel,
  describeFileForLog sans path/nom, extensions sûres, wildcards), `upload_service_test.dart` (14 : uploadPath
  default, implements UploadService, POST /files, boundary auto Dio, category API string, subjectId
  présent/absent, UploadedFileMetadata, 413/415/401/réseau → AppApiError, token/path jamais dans les logs).
  · `flutter analyze` 0 issues ✅ · `dart format` 0 changements ✅ · quality-gates docs 2/2 ✅.
- Mobile Core Flutter : **`DIO_CLIENT_READY`** → **`UPLOAD_READY`**.
- Mises à jour : `cores/mobile-flutter/README.md`, `FOUNDATION_CURRENT_STATE.md`,
  `IMPLEMENTATION_MATRIX.md`, `NEXT_ACTIONS.md`, `SESSION_HANDOFF.md`.
- Interdits respectés : aucun file picker natif ; aucun endpoint métier couplé ; aucun backend réel requis ;
  aucun upload direct S3/MinIO ; aucun stockage fichier / chemin device / URL signée / token / body dans
  logs/providers persistés ; aucun changement RN/Web/API/UI Kit/Cloud/root/workflows ; aucun retry automatique.

### Mobile Core Flutter 4 — Client Dio + providers

- Dépendance : `dio: ^5.10.0` (Dart SDK >=2.18.0 <4.0.0, compatible Dart 3.12.2). Aucun Freezed /
  build_runner / code generation requis pour cette mission.
- `ApiConfig` : `baseUrl`, `connectTimeoutMs` (10 000 ms), `receiveTimeoutMs` (30 000 ms),
  `sendTimeoutMs` (30 000 ms), `commonHeaders` immuable. Aucun token, aucun secret.
- `AppApiError` — `sealed class implements Exception` (Dart 3 natif, exhaustivité switch compile-time) :
  `NetworkError`, `TimeoutError`, `UnauthorizedError`, `ForbiddenError`, `NotFoundError`,
  `ValidationError` (errors map), `TooLargeError`, `UnsupportedTypeError`, `RateLimitedError`,
  `ServerError`, `UnknownApiError`. Aucun Freezed.
- `createDioClient(config, tokenReader, correlationIdReader?, logger?)` — intercepteurs dans l'ordre :
  `_AuthInterceptor` (injecte `Authorization: Bearer $token` dynamiquement via `tokenReader()` à chaque
  requête — token jamais stocké dans la config ; injecte `X-Request-Id` si `correlationIdReader` fourni) →
  `LoggingInterceptor` (log method + path uniquement — JAMAIS body / Authorization / query params / token
  / URL signée) → `ErrorInterceptor` (`DioException` → `AppApiError` encapsulé dans `error`).
- `mapDioError(DioException) → AppApiError` — fonction top-level testable indépendamment.
- `apiConfigProvider` Riverpod + `dioClientProvider` Riverpod : `tokenReader` = fermeture sur
  `AuthController.accessToken` (lecture dynamique). 401 surfacé sans refresh automatique.
- Tests `flutter test` 86/86 ✅ : `app_api_error_test.dart` (12), `error_interceptor_test.dart` (19),
  `logging_interceptor_test.dart` (6), `dio_client_test.dart` (11), auth controller (9), session store
  (4), router guards (5), theme (16), app widget (4) · `flutter analyze` 0 issues ✅ ·
  `dart format` 0 changements ✅ · quality-gates docs 2/2 ✅.
- Mobile Core Flutter : **`AUTH_SHELL_READY`** → **`DIO_CLIENT_READY`**.
- Mises à jour : `cores/mobile-flutter/README.md`, `FOUNDATION_CURRENT_STATE.md`,
  `IMPLEMENTATION_MATRIX.md`, `NEXT_ACTIONS.md`, `SESSION_HANDOFF.md`.
- Interdits respectés : aucun backend réel ; aucun endpoint métier ; aucun OpenAPI generator /
  retrofit.dart ; aucun refresh 401 complet ; aucun token dans les logs / exceptions / state / providers
  persistés ; aucun changement Mobile RN / Web / API / UI Kit / Cloud / workflows CI.

### Mobile Core Flutter 3 — Auth shell + routing guards

- Auth primitives : `AuthStatus` (loading/authenticated/unauthenticated/expired), `AuthState` (status +
  userId opaque — access token intentionnellement absent de l'état), `SessionEnvelope`.
- `SessionStore` seam (interface abstraite) + `InMemorySessionStore` placeholder. Aucun stockage natif réel
  à ce stade — `flutter_secure_storage` délégué à Flutter 4/5 avec le refresh token réel.
- `AuthController` (`Notifier<AuthState>`) : `_accessToken` en mémoire privée uniquement, `signIn` /
  `signOut` placeholders sans backend réel, `_initialize()` fail-safe.
- `routerProvider` GoRouter : bridge `ValueNotifier<AuthState>` → `refreshListenable`, guards
  (loading → `/`, authenticated → `/home`, unauthenticated/expired → `/sign-in`).
  Le provider GoRouter n'est PAS recréé lors des changements d'état auth (ref.listen uniquement).
- Écrans : `SplashScreen` (CircularProgressIndicator), `SignInScreen` (bouton placeholder sans backend),
  `HomeScreen` mis à jour (`ConsumerWidget` + bouton sign-out).
- Tests : `flutter test` 38/38 ✅ — unit auth controller (9), session store (4), router guard widget (5),
  theme (16), app widget (4) · `flutter analyze` 0 issues ✅ · `dart format` 0 changements ✅ ·
  quality-gates docs 2/2 ✅.
- Mobile Core Flutter : **`STARTER_INITIALISE`** → **`AUTH_SHELL_READY`**.
- Mises à jour : `cores/mobile-flutter/README.md`, `FOUNDATION_CURRENT_STATE.md`,
  `IMPLEMENTATION_MATRIX.md`, `NEXT_ACTIONS.md`, `SESSION_HANDOFF.md`.
- Interdits respectés : aucun backend réel ; aucun appel réseau ; aucun token persistant ; aucun
  changement Mobile RN / Web / API / UI Kit / Cloud ; aucun workflow CI.

### Mobile Core Flutter 2 — Starter minimal Flutter gouverné

- Livrables : `cores/mobile-flutter/pubspec.yaml`, `analysis_options.yaml`, `lib/main.dart`,
  `lib/app.dart`, `lib/src/theme/` (`EnistereTokens`, `EnistereThemeExtension`, `EnistereTheme`),
  `lib/src/app/router.dart`, `lib/src/features/home/home_screen.dart`, `test/theme/enistere_theme_test.dart`,
  `test/widget/app_test.dart`.
- Versions stables vérifiées pub.dev (Flutter 3.44.6 / Dart 3.12.2) : `flutter_riverpod 3.3.2`,
  `go_router 17.3.0`, `flutter_lints 6.0.0`, `mocktail 1.0.5`.
- ThemeData Material 3 contrôlé par tokens Enistere verbatim (ADR-034, ADR-008) : `ColorScheme` light/dark,
  `TextTheme`, `ThemeExtension<EnistereThemeExtension>` (spacing xs–xxl, radius sm–pill, success, danger,
  textMuted, border, surfaceElevated, minTouchTarget 44 dp).
- Résultats qualité : `flutter test` 20/20 ✅ · `flutter analyze` 0 issues ✅ · `dart format` 0 changements ✅ ·
  `git diff --check` ✅ · quality-gates docs 2/2 ✅.
- Mobile Core Flutter : **`SPECIFICATION_DOCUMENTAIRE`** → **`STARTER_INITIALISE`**.
- Mises à jour : `cores/mobile-flutter/README.md`, `FOUNDATION_CURRENT_STATE.md`, `IMPLEMENTATION_MATRIX.md`,
  `NEXT_ACTIONS.md`.
- Interdits respectés : aucun changement Mobile RN / Web / API / UI Kit / Cloud ; aucun SDK analytics/crash
  réel ; aucun backend réel ; aucun endpoint métier.

### Mobile Core Flutter 1 — Core specification

- Nouveaux fichiers : `cores/mobile-flutter/CORE_SPECIFICATION.md` (32 sections) + `cores/mobile-flutter/README.md`.
- Mobile Core Flutter passe de **`DOSSIER_SEULEMENT`** à **`SPECIFICATION_DOCUMENTAIRE`**.
- Spec cible : go_router, Riverpod (`AsyncNotifierProvider`/`NotifierProvider`), Dio + intercepteurs
  (Auth/Refresh/Error/Logging), Freezed + Json Serializable, flutter_secure_storage, préférences seam
  (Hive/SharedPreferences), thème Material 3 Enistere (ADR-034 `ThemeData` + `ThemeExtension`), états UI
  (`LoadingState`/`EmptyState`/`ErrorState`/`SuccessState`), logger/redaction Dart, accessibilité Flutter
  (Semantics, tailles tactiles, WCAG AA), i18n (flutter_localizations + ARB), testing (flutter_test/mocktail).
- Cohérence avec Mobile Core React Native V1 : même intentions tokens/sécurité/états UI/a11y, implémentations distinctes.
- Missions ordonnées : Flutter 1 (spec ✅) → Flutter 2 (starter) → Flutter 3 (auth) → Flutter 4 (Dio) →
  Flutter 5 (upload) → Flutter 6 (tests) → Flutter V1 (readiness).
- Décisions pendantes documentées : client API Dart, Hive vs SharedPreferences, librairie formulaires.
- Aucun code Dart, `pubspec.yaml`, dépendance ou workflow CI ajouté.
- Mises à jour : `FOUNDATION_CURRENT_STATE.md`, `IMPLEMENTATION_MATRIX.md`, `NEXT_ACTIONS.md`,
  `DECISIONS_REGISTER.md`, `SESSION_HANDOFF.md`.

### V3 ADR-034 — Flutter UI stack decision

- Nouvel ADR : `docs/adr/ADR-034-flutter-ui-material3-vs-custom.md`.
- Décision : futur Mobile Core Flutter = **Material 3 contrôlé par tokens Enistere + composants maison ciblés**.
- Material 3 est retenu comme moteur Flutter, pas comme identité visuelle autonome.
- `ADR_BACKLOG.md`, `DECISIONS_REGISTER.md`, `NEXT_ACTIONS.md`, `IMPLEMENTATION_MATRIX.md`,
  `FOUNDATION_CURRENT_STATE.md` et `SESSION_HANDOFF.md` mis à jour.
- Aucun starter Flutter, aucune dépendance, aucun workflow, aucun runtime.
- Prochaine action unique : **Mobile Core Flutter 1 — Core specification**.

### V3 Entry Decision

- Nouveau rapport : `docs/project-status/V3_ENTRY_DECISION.md`.
- Décision : ouvrir la séquence V3 par **Mobile Core Flutter**, mais uniquement via
  **ADR-034 — Flutter UI : Material 3 vs composants maison**.
- Aucun starter Flutter, aucune dépendance, aucun runtime et aucun core V1 modifié.
- Prochaine action unique : rédiger et valider ADR-034 avant toute spécification ou implémentation Flutter.

### Mobile Core V1 final readiness decision

- Nouveau rapport : `docs/project-status/MOBILE_CORE_V1_FINAL_READINESS_DECISION.md`.
- Mobile Core React Native promu de **`IMPLEMENTATION_AVANCEE`** à **`VALIDE_V1`**.
- Décision : B2 iOS est acceptée comme réserve environnementale non bloquante.
  - `smoke:ios` reste `blocked` sur Linux.
  - Aucun smoke iOS réel n'est revendiqué.
  - Aucun succès iOS artificiel n'est créé.
  - RN31 reste à exécuter dès qu'un environnement macOS/Xcode ou device iOS réel est disponible.
- Justification : critères V1 applicables satisfaits, roadmap §9.4 **8/8**, B1 fermé RN36, B3 fermé RN37,
  preuves Android/Expo/gates documentées.
- Aucun code runtime, dépendance, workflow, secret, accès serveur ou test Cloud ajouté.

### Mobile Core RN37 — PreferenceStore native strategy decision (B3 fermé)

- Nouveau rapport : `docs/project-status/MOBILE_RN37_PREFERENCE_STORE_DECISION.md`.
- Analyse formelle des 4 options : seam+placeholder, AsyncStorage, MMKV, délégation aux projets dérivés.
- **Décision : Option D — store natif (MMKV/AsyncStorage) délégué aux projets dérivés.**
  - MMKV rejeté : module JSI natif → brise Expo Go + pipeline smoke.
  - AsyncStorage rejeté : choix arbitraire entre deux options valides selon ADR-015 §15/§16.
  - Seam `PreferenceStore` + `createPreferenceService` + gardes + placeholder + 367 tests agnostiques
    constituent le « storage service » de Foundation V1 (§9.3 roadmap). Pattern identique aux 10 autres
    seams Foundation (permissions, notifications, biometrics, i18n, analytics, crash, network, lifecycle,
    feature flags, clipboard). ADR-015 délègue explicitement aux projets dérivés.
- Gap B3 **fermé comme réserve formellement acceptée non-bloquante pour `VALIDE_V1`**.
- Après RN37 et avant la décision finale V1 : `VALIDE_V1` était différé uniquement par B2
  (iOS smoke, Linux/macOS). Cette réserve est ensuite acceptée par
  `MOBILE_CORE_V1_FINAL_READINESS_DECISION.md`.
- Mises à jour : `MOBILE_CORE_V1_READINESS_REVIEW.md` §B3, `NEXT_ACTIONS.md`, `FOUNDATION_CURRENT_STATE.md`,
  `IMPLEMENTATION_MATRIX.md`, `SESSION_HANDOFF.md`, `DECISIONS_REGISTER.md`, `cores/mobile-react-native/README.md`,
  `cores/mobile-react-native/ARCHITECTURE.md` §29.
- Aucune dépendance, aucun changement runtime, aucun workflow modifié.
- Vérifications : `quality-gates docs` ✅, `git diff --check` ✅.

### Mobile Core RN36 — Upload runtime starter proof

- Nouveau fichier : `cores/mobile-react-native/app/(app)/upload.tsx` — écran protégé générique
  `Upload diagnostics` : formulaire RHF + Zod (catégorie parmi les 7 catégories API supportées),
  fichier fixture smoke `enistere-smoke.txt` (descripteur `MobileFile` sans picker natif), appel
  `useUploadMutation` via le client officiel, états `LoadingState` / `MessageState` / `ErrorState`.
- Aucune URL signée, token, payload serveur ou URI device en log, cache ou store (ADR-007/015) ;
  seule la catégorie choisie par l'utilisateur est affichée en succès.
- Mise à jour `ROUTES.upload` + lien "Upload diagnostics" depuis `app/(app)/home.tsx`.
- Smoke Android étendu (`scripts/smoke-android.js`) : handler `POST /files` mock (201 + fake DTO,
  `uploadCount`), création de la fixture via `adb shell`, navigation Upload diagnostics →
  `Submit diagnostic upload` → `Upload complete` → retour Home, vérification `uploadCount >= 1`.
- Gap B1 fermé : `MOBILE_CORE_V1_READINESS_REVIEW.md` §B1 et critères §9.4 mis à jour (**8/8 satisfaits**).
- À la date RN36, `VALIDE_V1` restait différé par B2 et B3. B3 est ensuite fermé par RN37,
  puis B2 acceptée comme réserve environnementale par la décision finale V1.
- Vérifications : typecheck ✅, lint ✅, test 367/367 ✅, expo-doctor 19/19 ✅, export iOS ✅,
  `git diff --check` ✅, `quality-gates run docs` 2/2 ✅.
- Aucun endpoint métier, dépendance, SDK picker natif, workflow ou accès Cloud ajouté.

### Mobile Core V1 Readiness Review

- Nouveau rapport : `docs/project-status/MOBILE_CORE_V1_READINESS_REVIEW.md`.
- Mobile Core React Native promu de **`STARTER_UI_KIT_ALIGNED`** à **`IMPLEMENTATION_AVANCEE`**.
- Justification : socle Expo SDK 55 / Expo Router utilisable, auth/session durcie, API client officiel,
  Query/Zustand/RHF/Zod, upload primitives, logger/redaction, Settings shell, smoke Android, expo-doctor
  19/19 et alignement UI Kit RN35.
- `VALIDE_V1` non déclaré : upload runtime mobile non prouvé, smoke iOS bloqué par absence macOS/Xcode,
  persistance non sensible native encore en seam.
- Aucun code runtime, workflow, dépendance, accès serveur, secret, SDK natif ou test Cloud ajouté.
- Prochaine action : Mobile Core RN36 — upload runtime starter proof.

### Quality Core V1 Readiness Review

- Nouveau rapport : `docs/project-status/QUALITY_CORE_V1_READINESS_REVIEW.md`.
- Quality Core promu de **`IMPLEMENTATION_AVANCEE`** à **`VALIDE_V1`**.
- Justification : critères roadmap §13.4 **7/7**, gates locaux testés, release process appliqué,
  prompts IA versionnés, ruleset `protect-main` actif, reporting coverage local et décisions résiduelles tranchées.
- Réserves non bloquantes : coverage publiée, dashboards qualité, workflows avancés et ADR-019→022 restent V2/VF.
- Aucun workflow, ruleset, dépendance, runtime, secret, accès serveur, tag ou release modifié.
- Prochaine action : retour pilotage global.

### Quality Core coverage standardization decision

- Nouveau rapport : `docs/project-status/QUALITY_CORE_COVERAGE_STANDARDIZATION_DECISION.md`.
- Correction du baseline coverage : `@enistere/ui-kit` expose déjà `test:coverage` et est désormais reconnu.
- Synthèse `quality-report.mjs` : coverage locale disponible pour UI Kit, Web et API (**3/8** scopes).
- Décision : **STANDARDISATION_PARTIELLE_EXISTANTE, PAS_DE_NOUVELLE_COMMANDE**.
- Aucun workflow, dépendance, seuil coverage, artefact publié, dashboard ou runtime modifié.
- Prochaine action : Quality Core V1 Readiness Review.

### Quality Core CI-required checks alignment

- Nouveau rapport : `docs/project-status/QUALITY_CORE_REQUIRED_CHECKS_ALIGNMENT.md`.
- Vérification du ruleset GitHub `protect-main` : 8 checks requis actifs, `images (...)` non requis.
- Vérification Registry CI PR #106 : `api-smoke` + les deux jobs `images (...)` verts.
- Décision : **PROMOTION_RECOMMANDÉE, NON_APPLIQUÉE** — les deux jobs `images (...)` sont candidats mûrs
  pour devenir requis, mais le ruleset n'est pas modifié sans action humaine explicite.
- Aucun workflow, ruleset, dépendance, runtime, secret ou accès serveur modifié.
- Prochaine action : Quality Core coverage standardization decision.

### Quality Core coverage/reporting baseline

- Nouveaux scripts : `cores/quality-core/scripts/quality-report.mjs` et
  `cores/quality-core/scripts/quality-report.test.mjs`.
- Le helper produit une synthèse Markdown stdout-only des gates tests et de la disponibilité coverage locale.
- Baseline : 8 scopes suivis ; coverage locale disponible pour Web et API ; aucun pourcentage global calculé.
- Nouveau rapport : `docs/project-status/QUALITY_CORE_COVERAGE_REPORTING_BASELINE.md`.
- Aucun workflow, dépendance, artefact publié, seuil obligatoire, appel réseau ou test Cloud ajouté.
- Prochaine action : Quality Core CI-required checks alignment.

### Quality Core release helper

- Nouveaux scripts : `cores/quality-core/scripts/release-helper.mjs` et
  `cores/quality-core/scripts/release-helper.test.mjs`.
- Le helper liste les types de release gouvernés et génère un brouillon Markdown de notes de release depuis
  une plage de commits Git.
- Sécurité/gouvernance : sortie stdout uniquement, aucune écriture de fichier, aucun tag, aucune GitHub Release,
  aucun appel réseau, aucune dépendance, aucun workflow modifié.
- Nouveau rapport : `docs/project-status/QUALITY_CORE_RELEASE_HELPER_REPORT.md`.
- Prochaine action : Quality Core coverage/reporting baseline.

### Quality Core Advanced Readiness Review

- Nouveau rapport : `docs/project-status/QUALITY_CORE_ADVANCED_READINESS_REVIEW.md`.
- Quality Core promu de **`IMPLEMENTATION_PARTIELLE`** à **`IMPLEMENTATION_AVANCEE`**.
- Justification : critères roadmap §13.4 **7/7**, gates locaux, checklists, templates, prompts IA, ruleset actif,
  release `foundation-v1.0.0` appliquée et Docs Core connecté au scope `quality-gates docs`.
- `VALIDE_V1` non déclaré : changelog/release automation, couverture publiée, dashboards qualité et CI qualité
  avancée restent différés.
- Aucun workflow, runtime, dépendance, tag, secret, accès serveur ou déploiement modifié.

### Cloud Core 12 — Decision Redis / Compose V1

- Nouveau rapport : `docs/project-status/CLOUD_CORE_12_REDIS_COMPOSE_DECISION.md`.
- Cloud Core promu de **`IMPLEMENTATION_AVANCEE`** à **`VALIDE_V1`**.
- Decision : Redis est reporte post-V1/V2 en coherence avec API Core ; `docker-compose.cc10.yml` devient le
  compose serveur/staging V1 officiel.
- `cores/cloud/CORE_SPECIFICATION.md`, `README.md`, `staging/README.md` et
  `CLOUD_CORE_V1_EXECUTION_BASELINE.md` alignes.
- Aucun acces serveur reel, workflow, dependance, secret ou runtime applicatif ajoute.
- Prochaine action : retour pilotage global.

### Cloud Core V1 Readiness Review

- Nouveau rapport : `docs/project-status/CLOUD_CORE_V1_READINESS_REVIEW.md`.
- Cloud Core promu de **`IMPLEMENTATION_PARTIELLE`** à **`IMPLEMENTATION_AVANCEE`**.
- Justification : CC10 staging HTTPS reel + CC11 socle operationnel (backups/restores, rollback, rotation smoke)
  + CI runtime/E2E/registry deja en place.
- `VALIDE_V1` differe : decision Redis/Compose V1 restante.
- `cores/cloud/README.md` aligne l'etat courant post-CC10/CC11.
- Aucun acces serveur reel, workflow, dependance, secret ou runtime applicatif ajoute.
- Prochaine action : **Cloud Core 12 — decision Redis/Compose V1**.

### Docs Core V1 Readiness Review

- Nouveau rapport : `docs/project-status/DOCS_CORE_V1_READINESS_REVIEW.md`.
- Docs Core promu de **`IMPLEMENTATION_AVANCEE`** à **`VALIDE_V1`**.
- Critères validés : documentation centrale stable, chemins de lecture des cores actifs, distinction
  courant/historique, gates documentaires reproductibles via Quality Core.
- Aucun runtime applicatif, workflow, ruleset, dependance, site docs, generation automatique ou RAG ajoute.
- Prochaine action : retour pilotage global.

### Docs Core 6 — Decision CI/docs gate integration

- Nouveau rapport : `docs/project-status/DOCS_CORE_CI_GATE_DECISION.md`.
- Decision : le link check Docs Core ne devient pas un check CI obligatoire separe pour le moment.
- Le scope local `docs` de `cores/quality-core/scripts/quality-gates.mjs` execute maintenant
  `git diff --check` puis `node cores/docs-core/scripts/check-doc-links.mjs`.
- Tests `quality-gates.test.mjs` mis a jour.
- Aucun workflow GitHub, ruleset, runtime applicatif, dependance, site docs, generation automatique ou RAG ajoute.
- Prochaine action : **Docs Core V1 Readiness Review**.

### Docs Core 5 — Guides principaux et onboarding complet

- Nouveaux guides : `docs/guides/DOCUMENTATION_MAINTENANCE_GUIDE.md` et
  `docs/guides/CORE_STATUS_REVIEW_GUIDE.md`.
- `docs/onboarding/CONTRIBUTOR_ONBOARDING.md` enrichi avec parcours par role : pilote/architecte, agent
  executeur, reviewer technique, reviewer securite, mainteneur release/statut.
- Nouveau rapport : `docs/project-status/DOCS_CORE_GUIDES_ONBOARDING_REPORT.md`.
- Docs Core promu de **`IMPLEMENTATION_PARTIELLE`** à **`IMPLEMENTATION_AVANCEE`**.
- Aucun runtime applicatif, workflow, dependance, site docs, generation automatique ou RAG ajoute.
- Prochaine action : **Docs Core 6 — decision CI/docs gate integration**.

### Docs Core V2 Readiness Review

- Nouveau rapport : `docs/project-status/DOCS_CORE_V2_READINESS_REVIEW.md`.
- Decision : Docs Core reste **`IMPLEMENTATION_PARTIELLE`**.
- Lecture : les criteres V2 globaux sont couverts par l'ensemble Quality Core + Docs Core, mais les criteres
  internes `IMPLEMENTATION_AVANCEE` du Docs Core ne sont pas encore tous satisfaits.
- Gaps bloquants documentes : guides principaux absents, onboarding encore minimal.
- Aucun runtime applicatif, workflow, dependance, site docs, generation automatique ou RAG ajoute.
- Prochaine action : **Docs Core 5 — guides principaux et onboarding complet**.

### Docs Core 4 — Revue de liens documentaires ciblée

- Nouveau script : `cores/docs-core/scripts/check-doc-links.mjs` (Node pur, sans dépendance).
- Nouveaux tests : `cores/docs-core/scripts/check-doc-links.test.mjs`.
- Nouveau rapport : `docs/project-status/DOCS_CORE_LINK_CHECK_REPORT.md`.
- Résultat local : `Docs Core link check passed (53 files)`.
- Docs Core promu de **`SPECIFICATION_DOCUMENTAIRE`** à **`IMPLEMENTATION_PARTIELLE`**.
- Aucun runtime applicatif, workflow, dépendance, site docs, génération automatique ou RAG ajouté.
- Prochaine action : **Docs Core V2 Readiness Review**.

### Docs Core 3 — Onboarding contributeur minimal et glossaire initial

- Nouveaux fichiers : `docs/onboarding/CONTRIBUTOR_ONBOARDING.md` et `docs/glossary/GLOSSARY.md`.
- `docs/README.md` et `cores/docs-core/README.md` relient désormais l'onboarding et le glossaire.
- Le guide d'onboarding formalise la lecture obligatoire, le démarrage de mission, les gates et le rapport final.
- Le glossaire couvre les statuts de core, gates, concepts de livraison, sécurité, CI et documents de pilotage.
- Aucun runtime, workflow, dépendance, génération automatique, site docs ou RAG ajouté.
- Prochaine action : **Docs Core 4 — revue de liens documentaires ciblée** ou retour à une priorité runtime décidée par pilotage.

### Docs Core 2 — Audit documentaire et dette de navigation/liens

- Nouveau rapport : `docs/project-status/DOCS_CORE_NAVIGATION_AUDIT.md`.
- `README.md` racine simplifié pour éviter la duplication d'un état projet long et daté ; il renvoie
  maintenant clairement vers `docs/README.md` et `docs/project-status/`.
- `DECISIONS_REGISTER.md` : ADR-008 aligné sur UI Kit `VALIDE_V1` / RN35 (19 primitives, 181 tests,
  cohérence mobile/web).
- `FOUNDATION_CURRENT_STATE.md` : compteurs UI Kit/Web corrigés dans la section tests.
- Aucun runtime, workflow, dépendance, RAG, site docs ou génération automatique ajouté.
- Prochaine action : **Docs Core 3 — onboarding contributeur minimal et glossaire initial**.

### Docs Core 1 — Documentation centrale navigable

- Démarrage de `cores/docs-core` : statut **`SPECIFICATION_DOCUMENTAIRE`**.
- Nouveaux fichiers : `cores/docs-core/CORE_SPECIFICATION.md`, `cores/docs-core/README.md`,
  `docs/README.md`.
- `docs/README.md` devient l'index central : project-status, ADR, strategy, cores actifs,
  runbooks/checklists, prompts IA et Quality Core.
- Aucun runtime, workflow, dépendance, génération automatique, RAG ou site documentaire ajouté.
- Prochaine action : **Docs Core 2 — audit documentaire et dette de navigation/liens**.

### Quality Core V2 Readiness Review

- Nouveau rapport : `docs/project-status/QUALITY_CORE_V2_READINESS_REVIEW.md`.
- `Quality Core` promu de **`SPECIFICATION_DOCUMENTAIRE`** à **`IMPLEMENTATION_PARTIELLE`**.
- Justification : matrice des gates, script `quality-gates`, checklists, templates GitHub, ruleset actif,
  processus de release et usage réel lors de la publication `foundation-v1.0.0`.
- Critères roadmap §13.4 : **7/7 satisfaits** sur le périmètre V2 documentaire/opérationnel courant.
- Aucun workflow, runtime, dépendance, tag ou déploiement modifié.
- Quality Core 7 livré : `cores/quality-core/AI_PROMPT_GOVERNANCE.md`, `prompts/README.md`,
  `prompts/global/mission-brief-template.md`.
- Historique : la prochaine action recommandée était **Docs Core 1**, désormais réalisée ci-dessus.

### Foundation V1 Release Decision

- Notes de release préparatoires ajoutées : `docs/project-status/FOUNDATION_V1_RELEASE_NOTES.md`.
- Statut : **`FOUNDATION_V1_RELEASED`** pour `foundation-v1-baseline`.
- Tag publié : `foundation-v1.0.0` (`2981f2c`).
- GitHub Release publiée : <https://github.com/mike-zks/enistere-os-foundation/releases/tag/foundation-v1.0.0>.
- Aucun déploiement, aucun workflow et aucun changement runtime.
- Prochaine action : arbitrer la mission suivante.

### Foundation V1 Baseline Readiness Review

- Nouveau rapport : `docs/project-status/FOUNDATION_V1_BASELINE_READINESS_REVIEW.md`.
- Verdict : **`READY_FOR_RELEASE_DECISION`** pour le périmètre `foundation-v1-baseline`.
- Preuves assemblées : API Core `VALIDE_V1`, Web Core `VALIDE_V1`, UI Kit `VALIDE_V1`, packages API `IMPLEMENTATION_AVANCEE`, Quality Core documentaire, ruleset `protect-main` actif.
- Gates : `all-safe` local validé avec `NODE_ENV=test` jusqu'au gate audit, audit root relancé hors sandbox à 0 vulnérabilité ; CI `main` post-PR #87 verte (`CI`, `API Runtime CI`, `Web E2E CI`, `Registry CI`).
- Historique : cette revue n'avait déclenché aucun tag, aucune GitHub Release, aucun déploiement et
  aucun test Cloud réel ; elle a ensuite été suivie par la publication `foundation-v1.0.0`.

### API Core VALIDE_V1 review

- `API Core NestJS` promu de `IMPLEMENTATION_AVANCEE` à `VALIDE_V1` après revue de readiness V1.
- Nouveau rapport : `docs/project-status/API_CORE_V1_READINESS_REVIEW.md`.
- Critères couverts : roadmap §8.4 et `cores/api-nestjs/CORE_SPECIFICATION.md` §41.
- Vérifications locales : `npm run lint`, `npm run build`, `npm run test` (**386/386**), `openapi:check` à jour, `npm audit` 0 vulnérabilité.
- Réserves documentées comme non bloquantes : register public dérivé, Redis/queues/mail/notifications/antivirus/média/observabilité avancée V2/V3, e2e complets couverts par CI runtime.
- `CORE_SPECIFICATION.md`, `FOUNDATION_CURRENT_STATE.md`, `IMPLEMENTATION_MATRIX.md`, `NEXT_ACTIONS.md` et `SESSION_HANDOFF.md` alignés.

### Governance 3 — Protection `main` vérifiée active via GitHub Rulesets

- Protection `main` vérifiée côté GitHub via Rulesets : `protect-main` (`ruleset_id=17522775`), target `branch`, enforcement `active`, condition `~DEFAULT_BRANCH`.
- Règles actives documentées : suppression interdite, non-fast-forward interdit, Pull Request obligatoire, conversations résolues obligatoires, status checks stricts.
- Checks requis actifs : `api-contracts`, `api-client-fetch`, `ui-kit`, `web-nextjs`, `audit`, `api-runtime`, `web-e2e`, `api-smoke`.
- Les deux checks `images (...)` restent recommandés phase 2 et ne sont pas requis actuellement.
- Docs alignées : Quality Core, workflows README, project-status, ADR-013. Aucun workflow, runtime, dépendance, tag ou release GitHub modifié.

### Governance 2 — Alignement des statuts Quality Core après QC5

- `FOUNDATION_CURRENT_STATE.md` : correction des vues synthétiques qui listaient encore `quality-core` comme dossier vide ; le core est désormais cohérentement indiqué `SPECIFICATION_DOCUMENTAIRE` avec QC5.
- `SESSION_HANDOFF.md` : alignement des paragraphes de reprise sur Quality Core 5 (`RELEASE_PROCESS_RUNBOOK.md`, templates, checklists, `quality-gates.mjs`) et retrait d'une affirmation contradictoire de protection de branche active.
- Correction de la synthèse courante ADR-014 : registry GHCR = `PARTIELLEMENT_IMPLEMENTE`, sans déploiement automatique.
- Aucun workflow, runtime, dépendance, tag ou release GitHub modifié.

### Quality Core 5 — Release process runbook

- **`cores/quality-core/RELEASE_PROCESS_RUNBOOK.md`** (nouveau) : processus de release gouverné pour Enistere OS Foundation.
- **§1 — Clarification des 5 concepts** : merge sur `main` (acte technique), promotion de statut (gouvernance documentaire), release Foundation (gouvernance globale), staging validation (déploiement), production (hors périmètre V1). Tableau comparatif : nature / déclencheur / preuve requise / produit.
- **§2 — Règle fondamentale** : une release Foundation est un acte de gouvernance, pas un simple merge.
- **§3 — 5 types de release** avec critères et gates attendus :
  - `foundation-v1-baseline` — tous cores V1 + CI L1–L4 + protection de branche activée
  - `core-v1-validation` — validation individuelle d'un core, rapport de revue requis
  - `quality-v2-increment` — incrément documentaire Quality Core (docs-only gates)
  - `staging-candidate` — SHA GHCR immuable + rapport CC11 versionné
  - `hotfix` — correction urgente, CI complète obligatoire (pas de raccourci)
- **§4 — Prérequis généraux** (4 catégories) : état `main` (aligné `origin/main`, aucune PR bloquante), CI (L1–L4 selon scope), qualité locale (`npm audit` 0 vuln, `git diff --check`, `quality-gates run`), documentation (`CHANGELOG.md` / `FOUNDATION_CURRENT_STATE.md` / `IMPLEMENTATION_MATRIX.md`), sécurité (aucun secret/token/URL signée), Cloud (tests réels exclus sauf `staging-candidate`).
- **§5 — Procédure en 8 étapes** : type/scope → commits depuis dernière release → relire project-status → sélectionner gates → documenter exclusions → rédiger notes → PR release → tag + billet GitHub post-merge (action humaine).
- **§6 — Format recommandé des notes de release** : résumé / cores impactés / changements fonctionnels / sécurité-gouvernance / migrations-breaking changes / gates exécutés (tableau) / gates non exécutés (tableau) / limites connues / prochaine action.
- **§7 — Convention de tagging futur** (convention proposée, non appliquée) : `foundation-vX.Y.Z`, `core-web-vX.Y.Z`, `core-ui-kit-vX.Y.Z`, `core-api-vX.Y.Z`, `core-mobile-vX.Y.Z`, `quality-v2.N`, `staging-YYYYMMDD-sha`, `hotfix-vX.Y.Z-NNN`. Règles SemVer + règles de tagging (uniquement sur commits `main`, tags annotés, immuables).
- **§8 — Relation avec les gates Quality Core** : tableau type de release × scope quality-gates × CI requise × staging requis.
- **`docs/checklists/RELEASE_READINESS_CHECKLIST.md`** : **Partie 5 — Release Foundation** ajoutée (prérequis, gates, documentation, tag + billet post-merge). Référence au runbook ajoutée dans l'en-tête.
- `cores/quality-core/CORE_SPECIFICATION.md` et `README.md` mis à jour (statut QC5, addendum, table des matières).
- Aucun workflow GitHub modifié. Aucun tag créé. Aucune release GitHub créée. Aucune dépendance. Aucun changement runtime.
- Vérifications : `git diff --check` ✓, `npm audit` 0 vuln ✓, `node --test cores/quality-core/scripts/quality-gates.test.mjs` 36/36 ✓.

### Quality Core 4 — Alignement templates PR / Issues avec Quality Core

- **`.github/PULL_REQUEST_TEMPLATE.md`** (mis à jour) : section **Quality Gates** (scope applicable parmi `docs`/`packages`/`ui-kit`/`web`/`mobile-static`/`root-audit`/`all-safe`/runtime, commandes exécutées et résultats, gates non exécutés + raison). Section **Hors périmètre confirmé** (workflows intacts, secrets absents). Section **Sécurité** renforcée (PII, tokens, URL signées, CSRF). Section **Statut / gouvernance** (si `docs/project-status/` modifié ou promotion de statut). Référence vers `docs/checklists/PR_QUALITY_CHECKLIST.md` et le script `quality-gates.mjs`.
- **`.github/ISSUE_TEMPLATE/bug_report.md`** (mis à jour) : champs environnement (core, branche, OS, versions), étapes de reproduction, logs avec avertissement anti-secret, impact sécurité (3 options), gate qualité susceptible de détecter le bug (6 options + "aucun gate ne couvre ce cas").
- **`.github/ISSUE_TEMPLATE/feature_request.md`** (mis à jour) : core ciblé + statut actuel + statut attendu, lien roadmap/ADR/CORE_SPECIFICATION, section hors périmètre explicite, critères d'acceptation.
- **`.github/ISSUE_TEMPLATE/security_issue.md`** (mis à jour) : avertissement "aucun secret dans cette issue", redirection canal privé (Security Advisories) si sensible. Classification impact (Faible/Moyen/Élevé/Critique). Scopes sensibles documentés : auth/JWT/refresh tokens, CSRF/Origin, URL signées MinIO, PII, secrets/clés, accès staging/SSH, RBAC, dépendances npm, templates/CI.
- **`.github/ISSUE_TEMPLATE/config.yml`** (nouveau) : `blank_issues_enabled: true`, lien Security Advisories pour signalement confidentiel.
- **`cores/quality-core/CORE_SPECIFICATION.md`** mis à jour : statut QC4, addendum QC3+QC4, §3.2 "hors périmètre V2" mis à jour (templates livrés QC4).
- **`cores/quality-core/README.md`** mis à jour : statut QC4, templates ajoutés dans la table des matières, section "État attendu VF" mise à jour.
- Aucun workflow GitHub modifié. Aucun secret créé. Aucune nouvelle dépendance. Aucun changement runtime.
- Vérifications : `git diff --check` ✓, `npm audit` 0 vuln ✓, `node --test cores/quality-core/scripts/quality-gates.test.mjs` 36/36 ✓.

### Quality Core 3 — Runbook de protection de branche et checks requis

- **`cores/quality-core/BRANCH_PROTECTION_RUNBOOK.md`** (nouveau) : procédure complète d'activation manuelle de la protection de branche `main` — prérequis, noms exacts des 10 checks, classification, procédure GitHub UI pas-à-pas, vérification post-activation, pourquoi aucun secret n'est nécessaire.
- **10 checks documentés avec noms exacts** : L1 (`api-contracts`, `api-client-fetch`, `ui-kit`, `web-nextjs`, `audit`), L2 (`api-runtime`), L3 (`web-e2e`), L4 (`api-smoke`, `images (api-nestjs, ./cores/api-nestjs, ./cores/api-nestjs/Dockerfile)`, `images (web-nextjs, ., ./cores/web-nextjs/Dockerfile)`).
- **Classification** : 8 requis immédiatement (activer dès maintenant), 2 recommandés phase 2 (images matrix — noms générés par GitHub), 3 non requis en CI (staging CC11, smoke:android, smoke:ios — device/émulateur requis).
- **Statut** : **documenté, non appliqué** — l'activation est une action humaine dans GitHub Settings → Branches. Ne pas déclarer la protection active avant preuve.
- **`.github/workflows/README.md`** mis à jour : table complète des 10 checks avec nom exact, workflow, phase, référence au runbook.
- **`cores/quality-core/QUALITY_GATES_MATRIX.md`** §3 mis à jour : 10 checks avec noms exacts, classification, référence au runbook.
- **`docs/checklists/RELEASE_READINESS_CHECKLIST.md`** mis à jour : section "Protection de branche `main`" ajoutée en Partie 1.
- **`cores/quality-core/README.md`** mis à jour : statut Quality Core 3, `BRANCH_PROTECTION_RUNBOOK.md` dans la table des matières.
- **`docs/project-status/*`** mis à jour : FOUNDATION_CURRENT_STATE.md, IMPLEMENTATION_MATRIX.md, NEXT_ACTIONS.md, SESSION_HANDOFF.md.
- Aucun workflow GitHub modifié. Aucun secret créé. Aucune nouvelle dépendance. Aucun changement runtime.
- Vérifications : `git diff --check` ✓, `npm audit` 0 vuln ✓, `node --test cores/quality-core/scripts/quality-gates.test.mjs` 36/36 ✓.

### Quality Core 2 — Script local de sélection des gates qualité

- **`cores/quality-core/scripts/quality-gates.mjs`** (nouveau) : script Node 24, sans dépendance externe. Commandes : `list`, `plan <scope>`, `run <scope>`. 7 scopes : `docs` / `packages` / `ui-kit` / `web` / `root-audit` / `mobile-static` / `all-safe`.
- Mode `plan` : affiche les commandes dans l'ordre, working directory réel, gates exclus — sans exécuter.
- Mode `run` : exécute séquentiellement, arrêt au premier échec, code de sortie propagé, résumé court.
- Gates **systématiquement exclus** de tous les scopes : Cloud / staging (runbook CC11), smoke:android / smoke:ios (device/émulateur requis), E2E Playwright (stack réelle), api-nestjs e2e (PG+MinIO requis).
- Scope `all-safe` = packages + ui-kit + web + root-audit (17 étapes) — entrypoint recommandé pré-PR.
- **`cores/quality-core/scripts/quality-gates.test.mjs`** (nouveau) : **36/36 tests node:test** — vérifient la construction des plans (scopes inconnus, composition all-safe, exclusions, structure des steps) sans exécuter de commande réelle.
- Documentation mise à jour : `README.md` (section script), `QUALITY_GATES_MATRIX.md` (§5 + en-tête), `PR_QUALITY_CHECKLIST.md` (usage optionnel), `CORE_SPECIFICATION.md` (note Quality Core 2).
- Aucun workflow GitHub modifié. Aucune dépendance ajoutée. Aucun changement runtime.
- Vérifications : `node cores/quality-core/scripts/quality-gates.mjs list` ✓, `plan all-safe` ✓, `plan mobile-static` ✓, tests 36/36 ✓, `git diff --check` ✓, `npm audit` 0 vuln ✓.

### Quality Core 1 — Cadrage opérationnel des gates qualité V2

- **Démarrage** : `cores/quality-core` passe de `DOSSIER_SEULEMENT` à **`SPECIFICATION_DOCUMENTAIRE`** (2026-07-11).
- **`cores/quality-core/CORE_SPECIFICATION.md`** : objectif, périmètre V2, hors périmètre (différé VF), relation ADR-013/014 et roadmap §13/§22, 4 niveaux qualité (local / L1 / L2–L3 / L4), règle tests Cloud = gates finaux, gouvernance promotion statut (7 étapes).
- **`cores/quality-core/README.md`** : statut, commandes existantes par core (root / api-contracts / api-client-fetch / ui-kit / web-nextjs / mobile-react-native / api-nestjs / cloud), guide choix gates par type de PR (7 types), responsabilités (auteur PR / reviewer / mainteneur / CI).
- **`cores/quality-core/QUALITY_GATES_MATRIX.md`** : matrice synthétique 8 cores × 11 gates (typecheck / lint / test / build / audit / e2e / smoke / images / doctor / tokens / openapi) + détail par core (commande, environnement, CI existante, fréquence) + résumé 7+1 checks branch protection + matrice preuves actuelles.
- **`docs/checklists/PR_QUALITY_CHECKLIST.md`** : checklist par type de PR (docs-only / quality-core / UI Kit / api-contracts / api-client-fetch / web-nextjs / mobile-react-native / api-nestjs / cloud / multi-core).
- **`docs/checklists/RELEASE_READINESS_CHECKLIST.md`** : checklist avant release ou promotion de statut (documentation / git / audit / critères par core cible / release package / déploiement staging CC11).
- **`docs/checklists/CORE_STATUS_REVIEW_CHECKLIST.md`** : checklist revue de statut (8 étapes : contexte obligatoire → critères spéc → gates → gaps → décision → rapport → project-status → PR).
- **Périmètre** : docs et governance uniquement. Aucun workflow GitHub modifié. Aucune dépendance ajoutée. Aucun changement runtime (API / Web / Mobile / UI Kit / Cloud).
- Vérifications : `git diff --check` ✓, `npm audit` root 0 vuln ✓.

### UI Kit VALIDE_V1 — Promotion officielle du statut

- **Promotion** : UI Kit `IMPLEMENTATION_AVANCEE` → **`VALIDE_V1`** (2026-07-11).
- **Critères §12.4 (roadmap) 4/4** : tokens définis ✅ + 19 primitives Web utilisables ✅ + composants documentés ✅ + cohérence visuelle mobile/web prouvée par RN35 ✅.
- **Critères §59 (spec) 9/9** : tous couverts, incl. compatibilité Mobile Core (RN35) + compatibilité Web Core Next.js (VALIDE_V1) + aucune identité projet imposée.
- **Consommation prouvée** : Web Core VALIDE_V1 consomme Alert/Card/FormField/Dialog/Select/Toast/Badge/Divider/Skeleton/LoadingState/EmptyState/ErrorState/SuccessState. Mobile Core STARTER_UI_KIT_ALIGNED : tokens verbatim + ThemeProvider + Screen/Text/Button + LoadingView/EmptyView/ErrorView.
- **Réserves non bloquantes documentées** (`UI_KIT_V1_READINESS_REVIEW.md` §10) : Storybook différé (spec §43), composants avancés V2/VF (19/35 liste §22 complète), composants RN dans Mobile Core (ADR-010 intentionnel), Tailwind/Radix/shadcn hors package (ADR-009 intentionnel), icônes absentes (ADR futur), contrastes jsdom.
- Rapport : `docs/project-status/UI_KIT_V1_READINESS_REVIEW.md` §8.
- Aucun composant ajouté, aucun token modifié.
- Vérifications : `typecheck` ✓, `lint` ✓, `test 181/181` ✓, `build` ✓, `tokens:check` ✓, `audit` 0 vuln ✓, `git diff --check` ✓.

### Mobile RN35 — Alignement UI Kit / états UI mobile

- **`cores/mobile-react-native/src/theme/tokens.ts`** : couleurs hex, typographie et radius alignés **verbatim** sur `cores/ui-kit/generated/typescript/tokens.ts` (tokensVersion 0.1.0). Mapping : `background.default/muted/elevated`, `foreground.default/muted/inverse`, `border.default`, `action.primary`, `status.danger/success` pour light+dark. Typographie : `heading` 30/36/700 · `title` 20/30/600 · `body` 16/24/400 · `caption` 12/18/400 (lineHeight = ratio × fontSize). Radius : `sm:4` · `md:8` · `lg:12` · `pill:9999`. Spacing inchangé (déjà aligné).
- **`cores/mobile-react-native/src/states/index.ts`** : aliases `LoadingView`/`EmptyView`/`ErrorView` (identiques aux `*State` existants, même référence).
- **`cores/mobile-react-native/test/theme-token-alignment.test.ts`** (nouveau) : 13 tests `node --test` vérifiant l'alignement verbatim des tokens. Total mobile : **367/367 tests**.
- **`cores/mobile-react-native/tsconfig.test.json`** : inclut `src/theme/tokens.ts` (pur TypeScript, agnostique).
- **`cores/mobile-react-native/ARCHITECTURE.md`** §40 : documentation complète de l'alignement — tableau de mapping, conversion lineHeight, décision `primaryText` dark, impact UI Kit V1.
- **Impact UI Kit V1** : gap bloquant fermé. Scores finaux : `§12.4 4/4` + `§59 9/9`. Mobile Core statut : **`STARTER_UI_KIT_ALIGNED`**.
- Aucune dépendance ajoutée. Aucun changement API/Web/Cloud/UI Kit package. Aucun changement AuthEngine/withAuthRetry/QueryClient/mutations.
- Vérifications : `typecheck` ✓, `lint` ✓, `test 367/367` ✓, `expo-doctor 19/19` ✓, `expo export -p ios` ✓, `npm audit` 0 vuln ✓, `git diff --check` ✓.

### UI Kit V1 Readiness Review — Revue de stabilité V1

- **Revue officielle** (2026-07-11) du UI Kit après UI Kit 6 et Web Core UI 2. Aucun composant ajouté, aucun token modifié.
- **Score initial roadmap §12.4** : 3/4. **Score initial spec §59** : 8/9. **Scores finaux après RN35 : §12.4 4/4 + §59 9/9.**
- **Décision** : statut `IMPLEMENTATION_PARTIELLE` → **`IMPLEMENTATION_AVANCEE`** — justifié par 19 primitives Web, 181 tests, tokens ADR-008 complets, états UI standards (LoadingState/EmptyState/ErrorState/SuccessState), consommation prouvée par Web Core VALIDE_V1.
- **Gap bloquant VALIDE_V1** : composants React Native de base — **fermé par RN35** (2026-07-11).
- **Gaps non-bloquants** : Tailwind/Radix/shadcn absents (intentionnel ADR-009), Storybook absent (différé spec §43), contrastes calculés non vérifiés (jsdom), icônes absentes (ADR futur).
- **Prochaine mission** : UI Kit VALIDE_V1 review — périmètre web+mobile prouvé.
- Rapport : `docs/project-status/UI_KIT_V1_READINESS_REVIEW.md`.
- Vérifications : `typecheck` ✓, `lint` ✓, `test 181/181` ✓, `build` ✓, `tokens:check` ✓, `audit` 0 vuln ✓, `git diff --check` ✓.

### Web Core UI 2 — Intégration des state primitives UI Kit 6

- **Web Core UI 2** (`cores/web-nextjs/src/shared/components/`) : remplacement des états génériques Web par les primitives UI Kit 6. **0 régression** (450/450 tests). Aucune nouvelle dépendance, aucun changement BFF/Auth/Files/Cloud/Mobile.
  - **`loading-state.tsx`** — délègue à `LoadingState` UI Kit 6 (`message=label`, `className` pour inline). Prop `label?` et `inline?` conservées (rétrocompatible).
  - **`empty-state.tsx`** — délègue à `EmptyState` UI Kit 6 (`title`, `description?`, `action?`, `className` pour inline). Prop `inline?` conservée.
  - **`error-state.tsx`** — délègue à `ErrorState` UI Kit 6 (`title`, `message=description+requestId`, `action=<Button onClick=onReset>`). `role="alert"` assuré par la primitive. Props conservées : `title?`, `description?`, `requestId?`, `onReset?`, `inline?`.
  - **Conservés sans changement** : `UnauthorizedState` (401), `ForbiddenState` (403), `ServiceUnavailableState` (5xx), `NotFoundState` (404) — sémantique HTTP spécifique, Alert-based structure maintenue.
  - **`globals.css`** — commentaires mis à jour ; `.state .enistere-alert` reste valide pour états spécialisés.
  - **Vérifications** : `typecheck` ✓, `lint` ✓, `test` 450/450 ✓, `build` ✓, `audit` 0 vuln ✓, `git diff --check` ✓. Branch `web-core-ui-2-state-primitives`.

### UI Kit 6 — State primitives / états UI standards

- **UI Kit 6** (`cores/ui-kit/src/components/`) : ajout de 4 primitives d'état UI. **15 → 19 primitives**. **146 → 181 tests** (+35). Aucune nouvelle dépendance, aucun Radix/shadcn/Tailwind. Toutes les CSS consomment uniquement `var(--enistere-*)`, classes préfixées `enistere-`. Toutes respectent `forwardRef`, `className` natif, attributs HTML natifs, accessibilité jest-axe. Générateur `styles.css` mis à jour (`tokens:generate`).
  - **LoadingState** (`loading-state.types.ts` / `loading-state.tsx` / `loading-state.css`) : `<div role="status">` centré. Props : `message?` (ReactNode sous le Spinner), `size?` (SpinnerSize, défaut `md`). Spinner interne en mode décoratif (`aria-hidden`) pour éviter la double annonce. 7 tests : rôle status, présence spinner, message, absence message, className passthrough, forwardRef, a11y.
  - **EmptyState** (`empty-state.types.ts` / `empty-state.tsx` / `empty-state.css`) : `<div>` centré, pas de rôle ARIA imposé. Props : `title` (ReactNode, **obligatoire**), `description?`, `action?` (slot ReactNode). Omit `title` de HTMLAttributes. 8 tests : titre, description, absence description, slot action, absence action, className passthrough, forwardRef, a11y.
  - **ErrorState** (`error-state.types.ts` / `error-state.tsx` / `error-state.css`) : `<div role="alert">` (assertif par défaut, surchargeable). Props : `title` (ReactNode, **obligatoire**), `message?`, `action?` (slot retry), `role?` (`alert`|`status`). Glyphe ✕ décoratif via CSS `::before`. Messages génériques uniquement — jamais de détails sensibles. 10 tests : rôle alert, titre, message, absence message, slot action, absence action, rôle surchargé, className passthrough, forwardRef, a11y.
  - **SuccessState** (`success-state.types.ts` / `success-state.tsx` / `success-state.css`) : `<div role="status">` (poli, non intrusif). Props : `title` (ReactNode, **obligatoire**), `message?`, `action?`, `role?` (`status`|`alert`). Glyphe ✓ décoratif via CSS `::before`. 10 tests : rôle status, titre, message, absence message, slot action, absence action, rôle surchargé, className passthrough, forwardRef, a11y.
  - **Infrastructure test** : `test/components-css.test.ts` — loading-state/empty-state/error-state/success-state ajoutés à la liste de vérification. `test/consumers/react.consumer.tsx` — 4 composants + 4 types importés et utilisés.
  - **Vérifications** : `typecheck` ✓, `lint` ✓, `test` 181/181 ✓, `build` ✓, `tokens:check` ✓ (up-to-date), `audit` 0 vuln ✓, `git diff --check` ✓. Branch `ui-kit-6-state-primitives`.

### Cloud Core 11 — Durcissement opérationnel staging

- **CC11** (`cores/cloud/`) : socle opérationnel du staging CC10 vérifié et documenté. **Aucun secret dans le dépôt.**
  - **`backup-postgres.sh`** : script `pg_dump` via `docker exec`, gzip horodaté `staging-pg-YYYYMMDDTHHmmss.sql.gz`, `chmod 600`, credentials lus depuis `.env.staging`. Preuve : **4.7 Ko** compressé ; restore test `enistere_staging_restore` — comptages exacts (Permission 12, Role 2, User 1, RolePermission 12, UserRole 1) ; base temporaire supprimée.
  - **`backup-minio.sh`** : `minio/mc mirror` via conteneur éphémère sur `staging-internal`, credentials en variable d'environnement (jamais en argument CLI). Preuve : **1 fichier 67 B** ; restore test objet dans `restore-test/` **PASSED** ; nettoyé.
  - **`rotate-smoke-account.sh`** : `crypto.randomBytes(32).toString('base64url')` → argon2id via `.env.staging`, mise à jour Prisma via `docker compose run --rm`. Valeur en clair **non conservée** (pas de log, pas de variable shell persistante). Preuve : `Rotation OK — nouveau mot de passe généré et écarté.`
  - **Rollback image** : `sha-484f98d` déployé **`healthy`** (web 200 + status 200) via `docker compose pull + up -d` ; roll-forward `sha-5bf4c0f` **`healthy`** ; `.env.staging.backup` restauré.
  - **Health HTTPS** : `staging.enistere.com` + `s3-staging.enistere.com` + `s3/health/live` = **200 HTTPS** ; API interne `health/ready` = **200** (DB up) ; TLS Let's Encrypt `Verify return code: 0`.
  - **`CC11_OPERATIONAL_RUNBOOK.md`** : runbook complet — health (endpoints + API interne + TLS + conteneurs), backup PG/MinIO, restore PG (temporaire + maintenance), restore MinIO (objet + bucket), rollback image (principe + procédure + roll-forward + migrations non rétrocompatibles), rotation smoke, checklist post-déploiement.
  - **`CC11_STAGING_OPERATIONAL_REPORT.md`** : rapport d'exécution avec preuves pour chaque axe, limites documentées, livrables listés, prochaine action.
  - **`STAGING_DEPLOYMENT_RUNBOOK.md`** + **`STAGING_ROLLBACK_RUNBOOK.md`** : annexes CC10/CC11 ajoutées (architecture Traefik/HTTPS, seed RBAC JS, rollback validé `sha-484f98d`, scripts CC11).

### Cloud Core 10 — Staging réel HTTPS (Traefik + Let's Encrypt)

- **CC10** (`cores/cloud/staging/`) : premier déploiement réel du stack complet sur serveur staging Enistere avec HTTPS automatique. Supercède le schéma CC6 (ports hôte exposés).
  - **`docker-compose.cc10.yml`** : Compose reverse proxy compatible Traefik — 4 services (`postgres:16`, `minio/minio`, `api-nestjs`, `web-nextjs`). Aucun port hôte publié. Labels Traefik sur `minio` (`s3-staging.enistere.com` → port 9000) et `web` (`staging.enistere.com` → port 3000). `extra_hosts: s3-staging.enistere.com:host-gateway` sur `api` (API → MinIO via reverse proxy local, sans sortie CDN). Réseau interne `staging-internal` + réseau externe `web`. PostgreSQL et console MinIO (9001) non exposés.
  - **`.env.staging.example`** : mis à jour CC10 — `S3_ENDPOINT=https://s3-staging.enistere.com` (HTTPS via Traefik), `APP_ENV=production` (cookies `__Host-` + Secure), `CORS_ORIGINS`/`WEB_ALLOWED_ORIGINS` HTTPS, Argon2 params renforcés (`memoryCost=65536`, `timeCost=3`). Ports hôte supprimés.
  - **`CC10_STAGING_DEPLOYMENT_REPORT.md`** : rapport de déploiement (sans secrets) — architecture réseau, labels Traefik, étapes d'exécution, état des conteneurs, décisions techniques.
  - **Seed RBAC** : 12 permissions structurelles (`files.*`, `users.read`, `roles.*`, `permissions.*`, `audit.read`) + rôles `administrator` (toutes permissions) / `user`. Script JS pur (`seed.js`) monté en volume dans le conteneur (pas de `ts-node` en prod ; `@node-rs/argon2` disponible). Idempotent.
  - **Utilisateur test** : compte staging `administrator` créé pour validation, identifiant et mot de passe non documentés ; rotation/suppression requise après smoke.
  - **Validation bout-en-bout** : auth BFF CSRF → login **200**, `/me` **200**, `/authorization` **200** (12 permissions) ; upload PNG → MinIO **VALIDATED 200** ; URL pré-signée `https://s3-staging.enistere.com/...` → téléchargement **200** (DNS/CDN → reverse proxy → MinIO). **Validation complète.**
  - **Aucun secret dans le dépôt.** `.env.staging` sur le serveur : `chmod 600`, hors dépôt.

### UI Kit 5 — Primitives data/feedback légères (Badge / Divider / Skeleton)

- **UI Kit 5** (`cores/ui-kit/src/components/`) : ajout de 3 primitives data/feedback légères. **12 → 15 primitives**. **121 → 146 tests** (+25). Aucune nouvelle dépendance, aucun Radix/shadcn/Tailwind. Toutes les CSS consomment uniquement `var(--enistere-*)`. Toutes respectent `forwardRef`, `className` natif, attributs HTML natifs, accessibilité jest-axe. Générateur `styles.css` mis à jour (`tokens:generate`).
  - **Badge** (`badge.types.ts` / `badge.css` / `badge.tsx`) : `<span>` inline, `variant` (`neutral`|`info`|`success`|`warning`|`danger`), `size` (`sm`|`md`). Fond `background-muted` + couleur de statut sur texte et bordure pour les variantes non-neutres. `user-select:none`. 6 tests : défaut, variante+taille, boucle toutes variantes, className passthrough, forwardRef, a11y toutes variantes.
  - **Divider** (`divider.types.ts` / `divider.css` / `divider.tsx`) : `<div>`, `orientation` (`horizontal`|`vertical`). Décoratif par défaut (`aria-hidden="true"`, sans `role`, invariant non contournable par prop native). Avec `label` (ReactNode) → `role="separator"` + `aria-orientation` + deux lignes décoratives `aria-hidden` flanquant le label. 11 tests : défaut, vertical, label, label vertical, deux lignes, className+attributs, invariants ARIA, forwardRef, a11y décoratif, a11y séparateur.
  - **Skeleton** (`skeleton.types.ts` / `skeleton.css` / `skeleton.tsx`) : `<div>`, `variant` (`text`|`block`|`circle`). Toujours `aria-hidden="true"` (invariant non contournable par prop native). Animation `@keyframes enistere-skeleton-pulse` activée uniquement via `@media (prefers-reduced-motion: no-preference)`. 8 tests : défaut, aria-hidden invariant, block, circle, className+style, forwardRef, a11y toutes variantes.
  - **Infrastructure test** : `test/components-css.test.ts` — badge/divider/skeleton ajoutés à la liste de vérification. `test/consumers/react.consumer.tsx` — Badge, Divider, Skeleton importés et utilisés (types `BadgeVariant`, `DividerOrientation`, `SkeletonVariant` vérifiés).
  - **Vérifications** : `typecheck` ✓, `lint` ✓, `test` 146/146 ✓, `build` ✓, `tokens:check` ✓ (up-to-date), `audit` 0 vuln ✓, `git diff --check` ✓. Branch `ui-kit-5-badge-divider-skeleton`.

### Web Core V1 Gap 3 — RHF + Zod UploadForm

- **Web Core V1 Gap 3** (`cores/web-nextjs/src/features/files/`) : ferme le dernier critère d'acceptation V1 §56 n°9 ("les formulaires et validations fonctionnent"). **Readiness V1 : 13/14 → 14/14 — V1 pleinement stable.** Aucun changement Auth/BFF/Files/packages/workflows. **450 tests** (+4). **15 tests E2E** inchangés.
  - **`upload-form-schema.ts`** (nouveau) : schéma Zod v4 UX — `z.object({ file: z.instanceof(File, { message: "Fichier requis." }), category: z.enum(FILE_CATEGORY_VALUES, { error: "Catégorie requise." }), subjectId: z.string().max(128, ...).optional() })`. Exporte `FILE_CATEGORY_VALUES`, `SUBJECT_ID_MAX_LENGTH`, `uploadFormSchema`, `UploadFormValues`. L'API Core reste l'autorité MIME/taille/permissions (ADR-007).
  - **`upload-form.tsx`** (migré) : `useState` remplacé par `useForm<UploadFormValues>({ resolver: zodResolver(uploadFormSchema) })`. File input géré via `setValue("file", f)` (onChange custom) et `fileInputRef` (reset visuel). `<Select {...register("category")}>` + `<Input {...register("subjectId")}>`. `handleSubmit(onSubmit)` empêche la soumission si validation Zod échoue. Erreurs depuis `formState.errors` — `aria-describedby` sur chaque champ. `handleReset` : `reset()` useUploadFile + `rhfReset()` + `setValue("file", undefined)` + `fileInputRef.current.value = ""`. Aucun log de nom/chemin/contenu. Anti-double-soumission conservé dans `useUploadFile`. Section succès inchangée.
  - **`test/upload-form.test.tsx`** (nouveau) : 4 tests avec `node:test` + `@testing-library/react` + `userEvent` + `fireEvent` + `createBrowserFetch` — (1) fichier requis : submit sans fichier → "Fichier requis." visible ; (2) catégorie requise : upload fichier + submit sans catégorie → "Catégorie requise." visible, aucune erreur fichier ; (3) référence trop longue : 129 chars via `fireEvent.change` → "Maximum 128 caractères." visible ; (4) succès : fichier + catégorie valides → fetch `/api/files/upload` appelé, section "Fichier envoyé" affichée.
  - **`package.json`** : ajout `react-hook-form@^7.81.0`, `zod@^4.4.3`, `@hookform/resolvers@^5.4.0` en dépendances de production (modules §9 obligatoires).
  - **Vérifications** : `typecheck` ✓, `lint` ✓, `test` 450/450 ✓ (446+4), `build` ✓, `audit` 0 vuln ✓, `git diff --check` ✓. Branch `web-core-v1-gap-3-rhf-zod`.

### Web Core V1 Gap 2 — Dashboard layout minimal

- **Web Core V1 Gap 2** (`cores/web-nextjs/src/features/dashboard/`) : ferme le critère d'acceptation V1 §56 n°3 ("les layouts standards existent"). **Readiness V1 : 12/14 → 13/14.** Aucun changement Auth/BFF/Files/packages/workflows. **446 tests** unitaires inchangés. **15 tests E2E** (+1 nav dashboard).
  - **`dashboard-shell.tsx`** : Server Component `DashboardShell` — `<header class="dashboard-header">` + `<nav aria-label="Navigation du tableau de bord">` avec liens : "Enistère" → `/` (marque), "Accueil" → `/protected`, "Fichiers" → `/protected/files`, "Envoyer un fichier" → `/protected/files/upload`. Liens `<a>` natifs (compatibilité `tsconfig.test.json` : `next/link` indisponible hors runtime Next.js dans `src/features/`).
  - **`(protected)/layout.tsx`** : import et intégration de `DashboardShell` uniquement sur le chemin authentifié (`HydrationBoundary` wrappé). Chemin `ServiceUnavailableView` inchangé (bare view, sans shell).
  - **`globals.css`** : classes `.dashboard-layout`, `.dashboard-header`, `.dashboard-nav`, `.dashboard-nav__brand`, `.dashboard-nav__link` (tokens UI Kit existants, aucune palette dupliquée).
  - **`e2e/auth.spec.ts`** : test ajouté "utilisateur authentifié : navigation dashboard visible sur /protected" — vérifie `role="navigation" name="Navigation du tableau de bord"` + liens Accueil/Fichiers/Envoyer un fichier + `expectNoSensitiveLeak`. **15 tests E2E** (14 → 15, +1).
  - **Vérifications** : `typecheck` ✓, `lint` ✓, `test` 446/446 ✓, `build` ✓, `audit` 0 vuln ✓, `git diff --check` ✓. Branch `web-core-v1-gap-2-dashboard-layout`.

### Web Core V1 Gap 1 — Public layout + landing page minimale

- **Web Core V1 Gap 1** (`cores/web-nextjs/src/app/(public)/`) : ferme les critères d'acceptation V1 §56 n°11 (SEO baseline pages publiques) et avance n°3 (layouts standards — layout public présent, dashboard layout = Gap 2). **Readiness V1 : 11/14 → 12/14.** Aucun changement Auth/BFF/Files/packages/workflows. **446 tests** inchangés. **14 tests E2E** (1 adapté : URL `/` → `/status`).
  - **`(public)/layout.tsx`** : layout public Server Component pur — `<header>` avec `<nav>` (lien "Enistère" → `/` + lien "Se connecter" → `/login`), `<footer>` minimal. Aucune vérification de session.
  - **`(public)/page.tsx`** : landing page statique (statiquement rendue au build, `○` dans `next build`). Métadonnées : `title: "Enistère OS Foundation"`, `description`, `robots: { index: true, follow: true }`, `openGraph` minimal. Contenu : `PageHeader` h1 "Enistère OS Foundation", liste des 5 modules disponibles, CTA "Se connecter" → `/login` + "État du socle" → `/status`. Aucune donnée dynamique ni privée.
  - **`(public)/status/page.tsx`** : page technique de statut déplacée de `/` vers `/status`. Contenu identique (`FoundationStatus` + `HealthPanel` + `SessionPanel` + `StatesShowcase`, `force-dynamic`). Noindex par héritage du root layout (`appMetadata.robots`).
  - **`sitemap.ts`** : liste `/` (priority 1, monthly) et `/status` (priority 0.5, weekly). URL canonique via `NEXT_PUBLIC_APP_URL` (défaut `http://localhost:3100`).
  - **`robots.ts`** : `allow: ["/", "/status"]` ; `disallow: ["/protected/", "/api/", "/login"]` ; `sitemap` link.
  - **`globals.css`** : classes `.public-header`, `.public-nav`, `.public-nav__brand`, `.public-nav__action`, `.public-main`, `.public-footer`, `.landing`, `.landing__features`, `.landing__actions`, `.landing__cta`, `.landing__cta--primary`, `.landing__cta--secondary`.
  - **`.env.example`** : `NEXT_PUBLIC_APP_URL` documenté (commenté, facultatif).
  - **`e2e/health.spec.ts`** : URL mise à jour `/` → `/status`, libellé du test adapté. 14 tests E2E toujours verts.
  - **Build** : `/` = statique (`○`), `/status` = dynamique (`ƒ`), `/robots.txt` et `/sitemap.xml` = statiques (`○`).
  - **Vérifications** : `typecheck` ✓, `lint` ✓ (0 erreurs), `test` 446/446 ✓, `build` ✓, `audit` 0 vuln ✓, `git diff --check` ✓. Branch `web-core-v1-gap-1-public-layout`.

### Web Core Files 8 — E2E Playwright upload/suppression

- **Web Core Files 8** (`cores/web-nextjs/e2e/`) : étend la couverture E2E navigateur aux chemins d'écriture Files. **14 tests E2E** (12 → 14, +2 nouveaux, 0 régression). Aucun changement BFF, runtime, package ni workflow.
  - **`files.spec.ts` — upload (`Files (upload)`)** : login propriétaire → `/protected/files/upload` → formulaire `aria-label="Envoi de fichier"` → `page.setInputFiles` (PNG 1×1 `TEST_PNG_B64`, name `e2e-upload.png`, category `IMAGE`) → `<section aria-label="Fichier envoyé">` visible → nom fichier affiché → `expectNoSensitiveLeak` → liste `/protected/files` → fichier présent → navigation détail → heading `h1` correct → `expectNoSensitiveLeak`.
  - **`files.spec.ts` — suppression (`Files (suppression)`)** : `uploadFileViaApi("e2e-delete-fixture.png")` (fixture API isolée du flux UI) → login → détail `fileId` → heading `h1` + `expectNoSensitiveLeak` → clic "Supprimer" → `role="dialog"` visible → heading `h2` "Confirmer la suppression" → texte "Cette action est irréversible" → clic "Supprimer définitivement" → `waitForURL("**/protected")` → `expectNoSensitiveLeak` → `/protected/files/${fileId}` → "Fichier introuvable" → liste `/protected/files` → fichier absent (`toHaveCount(0)`).
  - **`helpers.ts`** : ajout `TEST_PNG_B64` (PNG 1×1 exporté), `API_URL` (interne), `uploadFileViaApi(name)` (login API Bearer → upload multipart → retourne `fileId` VALIDATED, aucun token journalisé).
  - **Sécurité** : `expectNoSensitiveLeak` à chaque étape sensible ; aucun champ interne ni token (Bearer, URL signée) en DOM/log.
  - **Isolement** : upload test crée `e2e-upload.png` (éphémère CI) ; delete test crée+supprime `e2e-delete-fixture.png` (net zero) ; fixture `global-setup.ts` inchangée. Tests sérialisés (`workers: 1`). Aucune dépendance inter-describe.
  - **Vérifications** : `typecheck` ✓, `lint` ✓ (0 erreurs), `test` 446/446 ✓, `build` ✓ (20 routes dynamiques inchangées), `audit` 0 vuln ✓, `git diff --check` ✓. Branch `web-core-files-8-e2e-upload-delete`.

### Web/Core Governance 1 — alignement CI requise et ADR-013

- **Web/Core Governance 1** (`.github/workflows/`, `docs/`) : revue de cohérence gouvernance/CI après Web Core Files 7. **Aucun workflow modifié.** Aucun blocage fonctionnel détecté. **5 corrections documentaires.**
  - **Vérifications CI (aucun écart)** : les 7 noms de jobs requis (`api-contracts`, `api-client-fetch`, `ui-kit`, `web-nextjs`, `audit`, `api-runtime`, `web-e2e`) + le 8ᵉ recommandé (`images`) correspondent **exactement** aux `name:` des jobs dans les 4 workflows. `api-smoke` précède `images` via `needs:` — rendre `images` requis suffit.
  - **"CI minimale"** = `ci.yml` (niveau 1) = 5 jobs, non-régression monorepo, sans runtime/E2E/Docker/secrets. **"CI niveaux 1–3 + niveau 4 partiel"** : `ci.yml` (1) + `api-runtime-ci.yml` (2) + `web-e2e-ci.yml` (3) + `registry-ci.yml` (4 partiel — build + push GHCR, sans déploiement). **"Registry partiel"** = ADR-014 `PARTIELLEMENT_IMPLEMENTE` (build/push, pas de scan/signature/déploiement). **"Branch protection documentée/non appliquée"** = action humaine en attente dans GitHub Settings.
  - **ADR-013** (`PARTIELLEMENT_IMPLEMENTE`) : niveaux 1–3 présents + niveau 4 partiel (`registry-ci.yml`) ; protection de branche non appliquée — action humaine. **ADR-014** (`PARTIELLEMENT_IMPLEMENTE`) : registry GHCR via `registry-ci.yml` (Cloud Core 5) — confirmé.
  - **Corrections documentaires** :
    - **`.github/workflows/README.md`** : dernier paragraphe corrigé — supprimé claim "ADR-014 NON_IMPLEMENTE" et "manque niveau 4" (obsolètes depuis Cloud Core 5) ; statuts ADR-013/014 mis à jour.
    - **`docs/project-status/SESSION_HANDOFF.md`** §5 : statut mobile corrigé `RETRY_READY` → `STARTER_EXPO_DOCTOR_GREEN` (346 → 355 tests, expo-doctor 19/19, smoke Android passé — état réel post-RN26-34).
    - **`docs/project-status/NEXT_ACTIONS.md`** : entrée Governance 1 ajoutée ; prochaine action unique documentée.
    - **`docs/project-status/FOUNDATION_CURRENT_STATE.md`** §15 : prochaine action mise à jour (RN31 macOS ou à défaut Files 8 E2E upload/suppression ; actions humaines : 7 checks + `images` requis).
    - **`docs/project-status/IMPLEMENTATION_MATRIX.md`** : ligne CI/CD mise à jour — "niveau 4 partiel (`registry-ci.yml`)" ajouté dans "Implémenté", "Prochaine condition" corrigée.
  - **Vérifications** : `git diff --check` ✓. Aucun workflow, aucun code métier, aucun test modifié. Branch `web-core-governance-1-ci-alignment`.

### Web Core Files 7 — Admin BFF quarantaine/restauration

- **Web Core Files 7** (`cores/web-nextjs/`) : ajoute les **BFF handlers et primitives UI minimales** pour consommer les capacités admin Files déjà présentes côté API : **quarantaine** (`POST /api/files/:id/quarantine`) et **restauration** (`POST /api/files/:id/restore`). Aucun nouveau comportement API. **446 tests** (393 → 446, +53, 0 régression). Le Web reste un client gouverné de l'API Core.
  - **Handlers BFF** (`src/core/files/handlers/`) : `handleQuarantineFile` + `handleRestoreFile` — pattern identique au handler delete : ordre `assertPost` (405) → UUID (400 sans appel API) → `checkOriginAndCsrf` (403 sans appel API) → client serveur **`writable`** → appel API → 409 catch explicite (`NOT_QUARANTINABLE` / `NOT_RESTORABLE` — jamais `NOT_DOWNLOADABLE`) → `filesErrorResponse`.
  - **Routes** (`src/app/api/files/[id]/quarantine/route.ts`, `src/app/api/files/[id]/restore/route.ts`) : `force-dynamic`, `POST` uniquement, délèguent aux handlers.
  - **Client BFF navigateur** (`files-bff-client.ts`) : `quarantineFile(fileId, csrfToken)` + `restoreFile(fileId, csrfToken)` — `POST`, same-origin, `credentials:"include"`, `X-CSRF-Token`, **jamais `Authorization`**, `encodeURIComponent(fileId)`.
  - **Hooks** (`src/features/files/`) : `useQuarantineFile` + `useRestoreFile` — `useMutation<void, unknown, string>` **sans `mutationKey`**, `onSuccess: void queryClient.invalidateQueries({ queryKey: fileKeys.all })`, **anti-double-soumission** (`useRef(inFlight)`), retourne `{ requestQuarantine/requestRestore, isPending, isSuccess, error?, reset }`.
  - **UI admin séparée** (`src/features/files/admin-file-actions.tsx`) : `AdminFileActions` — retourne `null` si l'utilisateur n'a ni `files.quarantine` ni `files.restore` ; boutons conditionnels + alertes succès/erreur ; **jamais de champ interne, token, URL signée** exposés. Page dédiée `/protected/files/[id]/admin/` séparée de la page utilisateur.
  - **Sécurité** : CSRF + Origin/Referer sur toutes les mutations ; `checkOriginAndCsrf` avant tout appel API ; l'API reste l'autorité finale (`files.quarantine`/`files.restore` — sans ownership) ; **jamais de Bearer navigateur** ; anti-énumération conservée (404 mappé distinctement) ; 401/403/404/409 mappés clairement ; logs et tests sans secret ni champ interne.
  - **Tests** (+53) : `test/admin-file-handlers.test.ts` (18 cas — méthode/UUID/CSRF/Origin/succès/409/401-403-404-503/requestId × 2 handlers) + `test/admin-bff-client.test.ts` (10 cas — same-origin/credentials/CSRF/sans Bearer/URL/erreurs × 2 fonctions) + `test/use-quarantine-file.test.tsx` + `test/use-restore-file.test.tsx` (8 cas chacun — CSRF→POST/fileKeys.all invalidé/anti-double/409/403/401/reset/isPending) + `test/admin-file-actions.test.tsx` (9 cas — null sans permission/boutons conditionnels/alerte succès-erreur × 2/sans Bearer).
  - **Vérifications** : `tsc --noEmit` ✓, `npm run lint` ✓ (0 erreurs), `npm test` (446/446) ✓, `npm run build` ✓ (routes `/api/files/[id]/quarantine` + `/api/files/[id]/restore` + page `/protected/files/[id]/admin` dynamiques), `npm audit` 0 vuln ✓, `git diff --check` ✓. Branch `web-core-files-7-admin-bff`.

### Web Core Files 6 — Revue globale Files V1 et durcissement de cohérence

- **Web Core Files 6** (`cores/web-nextjs/`) : revue globale de la verticale Files V1 bout-en-bout (API + packages + Web BFF + hooks + UI + E2E). **4 défauts corrigés, 3 tests ajoutés, 1 test mis à jour. 393 tests** (390 → 393, +3, 0 régression). Rapport versionné `docs/project-status/WEB_FILES_V1_REVIEW.md`. **Verdict : Stable avec réserves mineures** (aucun bloquant — V1 livrable).
  - **D1 (cache invalidation — delete)** : `useDeleteFile.onSuccess` ne rafraîchissait pas `fileKeys.list(...)`. Ajout de `void queryClient.invalidateQueries({ queryKey: fileKeys.all })`. Test ajouté : "succès : fileKeys.list invalidé après suppression".
  - **D2 (cache invalidation — upload)** : `useUploadFile` n'avait aucun `onSuccess`. Ajout de `useQueryClient` + invalidation `fileKeys.all` après succès. Test ajouté : "succès : fileKeys.list invalidé après upload".
  - **D3 (message 409 ambigu)** : `classifyFileError` renvoyait "Ce fichier n'est pas téléchargeable." pour tout 409 — affiché en contexte de suppression. Message remplacé par "Cette action n'est pas disponible pour ce fichier." (neutre). Test `use-create-download-url.test.tsx` mis à jour.
  - **D4 (upload 409 → errorCode incorrect)** : le handler upload laissait passer le 409 API (quota) dans `filesErrorResponse`, renvoyant `NOT_DOWNLOADABLE`. Catch explicite 409 dans `upload-file-handler.ts` → `QUOTA_EXCEEDED`. Test ajouté : "upload : 409 API (quota) → 409 QUOTA_EXCEEDED (jamais NOT_DOWNLOADABLE)".
  - **6 réserves documentées (non bloquantes)** : staleTime=0 sur list (R1), staleTime=30s détail/admin (R2), navigation post-delete vers /protected (R3), URL signée DOM transitoire (R4), cache admin quarantaine/restauration (R5), pagination sans staleTime (R6).
  - **Sécurité** : conformité ADR-005/ADR-007 vérifiée — aucun token client, aucun proxy générique, aucun champ interne exposé, same-origin + credentials:include, CSRF sur mutations, l'API reste l'autorité.
  - **Vérifications** : `tsc --noEmit` ✓, `npm run lint` ✓ (0 erreurs), `npm test` (393/393) ✓, `npm run build` ✓, `npm audit` 0 vuln ✓, `git diff --check` ✓. Branch `web-core-files-6-v1-review`.

### Web Core Files 5 — E2E Playwright parcours liste fichiers (/protected/files)

- **Web Core Files 5** (`cores/web-nextjs/e2e/`) : ajoute 5 tests Playwright pour la page `/protected/files`. **12 tests E2E** (7 → 12, +5 nouveaux, 0 régression). Aucun changement au code métier, ni au BFF, ni aux packages.
  - **Test 1** : propriétaire — fichier seedé visible, champs publics affichés, aucun champ interne (`storageKey`/`bucket`/`checksum`/`ownerId`/`X-Amz-Signature`).
  - **Test 2** : propriétaire — clic sur le fichier → navigation réelle vers `/protected/files/:id` (vérifie le `href` et le heading `<h1>` de la page de détail).
  - **Test 3** : propriétaire — 1 fichier seedé (< limit défaut 20) → pas de pagination (ni « Précédent » ni « Suivant »).
  - **Test 4** : anonyme — `/protected/files` redirige vers `/login` (aucun contenu privé avant authentification, liste absente).
  - **Test 5** : sans permission (`E2E_NOPERM_EMAIL`) — liste → état erreur générique (`role="alert"`) ; `test.skip` si variable absente.
  - **Contraintes** : aucun token/URL signée/champ interne dans les logs ou snapshots (`expectNoSensitiveLeak`) ; aucun contournement Auth/CSRF ; déterministe (1 fichier VALIDATED seedé par `global-setup.ts`) ; compatible CI (`web-e2e-ci.yml`).
  - **Vérifications** : `tsc --noEmit` ✓, `npm run lint` ✓ (0 erreurs), `npm test` (390/390) ✓, `npm run build` ✓, `npm audit` 0 vuln ✓, `git diff --check` ✓. Branch `web-core-files-5-e2e-list`.

### Web Core Files 4 — liste paginée BFF (read-only)

- **Web Core Files 4** (`cores/web-nextjs/`) : ajoute la liste paginée de fichiers côté Web BFF. **390 tests** (357 → 390, +33 nouveaux, 0 régression). BFF ciblé uniquement. API Core reste l'autorité (ownership + permission `files.read`).
  - **Handler BFF** (`src/core/files/handlers/list-files-handler.ts`) : `GET /api/files` — ordre : méthode (405) → validation query (`limit` 1–50, défaut 20 ; `offset` ≥ 0, défaut 0 — **400 sans appel API** si invalide) → client serveur **`read-only`** (`enableRefresh:false`) → `client.files.list()` → `jsonOk` ou `filesErrorResponse`. `no-store`. Aucun CSRF (GET non mutatif).
  - **Route** (`src/app/api/files/route.ts`) : `dynamic = "force-dynamic"`, `GET` uniquement — délègue à `handleListFiles`.
  - **Type `FileListResponse`** (`files-bff-client.ts`) : `SchemaOf<"FileListResponseDto">` — dérivé du contrat généré, aucun DTO recopié.
  - **BFF client navigateur** (`listFiles` dans `files-bff-client.ts`) : `GET /api/files?limit=&offset=` — `credentials:"include"`, aucun Bearer, aucun CSRF, same-origin.
  - **Query key** (`file-keys.ts`) : `fileKeys.list({ limit, offset })` → `["files", "list", { limit, offset }]` — stable, sérialisable, jamais de token/URL signée.
  - **Hook** (`src/features/files/use-file-list.ts`) : `fileListQueryOptions({ limit?, offset? })` + `useFileList(params?)` — `retry:false`, params normalisés (défauts), `"use client"`.
  - **Vue liste** (`src/features/files/file-list-view.tsx`) : `"use client"` — états loading (`role=status aria-live=polite`) / vide (`EmptyState` + lien upload) / erreur (`Alert role=alert` via `classifyFileError`) / liste (`<ul>` + `<li>` par fichier : originalName, mimeType, size formatée, category, status, visibility, createdAt formaté, lien `/protected/files/:id`) + pagination (`<nav aria-label="Pagination">` : Précédent si `offset > 0`, Suivant si `nextOffset !== null`). **Aucun champ interne** (bucket/storageKey/checksum/ownerId). Ancres `<a>` (compatibilité `tsconfig.test.json` `nodenext`).
  - **Page** (`src/app/(protected)/protected/files/page.tsx`) : Server Component, `dynamic = "force-dynamic"`, lit `searchParams.limit`/`offset`, délègue à `FileListView`.
  - **Erreurs mappées** : 400/401/403/429/503 + réseau/timeout via `filesErrorResponse` existant.
  - **Contraintes** : aucun token exposé côté client, aucun proxy générique, aucun champ interne affiché, same-origin + `credentials:"include"` + aucun `Authorization` navigateur, aucun CSRF sur GET, l'API reste l'autorité.
  - **Tests** (+33) : `test/list-files-handler.test.ts` (9 cas : succès no-store, défauts limit/offset, params transmis, limit invalide ×5, offset invalide ×3, erreurs API 4 statuts, read-only sans refresh, POST 405, no-store sur erreur, champs internes absents) + `test/list-bff-client.test.ts` (8 cas : same-origin GET, URL sans qs, qs correct, limit seul, 401/403/503→BffAuthError, réseau, JSON invalide, jamais API directe) + `test/use-file-list.test.tsx` (6 cas : clé stable, clé sans secret, clés distinctes, succès en cache, 503 retry:false, 401 immédiat) + `test/file-list-view.test.tsx` (8 cas : loading role=status, vide EmptyState, erreur Alert, champs publics affichés, champs internes absents, lien /protected/files/:id, Suivant si nextOffset, Précédent si offset>0).
  - **Vérifications** : `tsc --noEmit`, `npm run lint` (0 erreurs), `npm test` (**390/390**), `npm run build` (routes `/api/files` + `/protected/files` dynamiques), `npm audit` (0 vuln), `git diff --check`. Commit + PR.

### API Core Files 5 — liste propriétaire de fichiers paginée (read-only)

- **API Core Files 5** (`cores/api-nestjs/`, `packages/api-contracts/`, `packages/api-client-fetch/`) : ajoute `GET /files?limit=&offset=` — liste paginée ownership-scoped des fichiers du propriétaire courant. **386 tests unitaires API** (377 → 386, +9). Tests e2e d'intégration ajoutés. Contrat OpenAPI régénéré + types `api-contracts` + `FilesApi.list()`.
  - **`GET /files`** : protégé `files.read`, ownership utilisateur courant, exclusion `DELETED` (`deletedAt: null`), tri `createdAt desc`, pagination offset-based (`limit` 1–50, défaut 20 ; `offset ≥ 0`).
  - **Réponse publique** : `{ items: PublicStoredFile[], limit, offset, nextOffset: number | null }` — aucun champ interne (`bucket`, `storageKey`, `checksum`, `ownerId`).
  - **Trick limit+1** : `listByOwner(userId, offset, limit+1)` — si `len > limit` → `nextOffset = offset + limit` (page suivante), sinon `null`. Aucun `COUNT` séparé.
  - **`FileListQueryDto`** (`file-list-query.dto.ts`) : `@Type(() => Number)` + `@IsInt` + `@Min`/`@Max` + `@ApiPropertyOptional({ type: 'integer' })` ; coercition query string → entier.
  - **`FileListResponseDto`** (`file-list-response.dto.ts`) : `items: PublicStoredFile[]` (interface runtime), `@ApiProperty({ type: () => [PublicStoredFileDto] })` pour Swagger.
  - **`FilesService.listOwnedFiles(userId, limit, offset)`** : nouveau ; délègue à `repository.listByOwner`, mappe via `toPublicStoredFile`.
  - **`FilesController`** : `FilesService` ajouté (premier paramètre constructeur) ; `@Get()` (aucun paramètre → liste) précède `@Get(':id')` (NestJS distingue correctement).
  - **`FilesApi.list({ limit?, offset? })`** (`packages/api-client-fetch`) : nouveau ; `GET /files`, retourne `SchemaOf<'FileListResponseDto'>`.
  - **OpenAPI** régénéré (`openapi:generate`) : `files_list` opération, `FileListResponseDto` schéma, `limit`/`offset`/`nextOffset` typés `integer` (`nextOffset` nullable). **`api-contracts` régénéré** (`generate`) : types `files_list`, `FileListResponseDto` dans `schema.ts`.
  - **Tests unitaires** (+9) : `files.service.spec.ts` — `listOwnedFiles` (appel limit+1, nextOffset null/présent, items vides) ; `files.controller.spec.ts` — 200 défauts, pagination custom, absence champs internes, 400 pour limit 0/51 et offset -1.
  - **Tests e2e** (`test/files-list.e2e-spec.ts`) : liste vide, isolation ownership (A ≠ B), exclusion DELETED, ordre `createdAt desc`, pagination + nextOffset, champs internes absents, offset dépassant le total.
  - **Contraintes** : aucun endpoint admin, aucune UI quarantaine, aucun BFF Web dans cette mission. Périmètre strict : `cores/api-nestjs/**`, `packages/api-contracts/**`, `packages/api-client-fetch/**`.
  - **Vérifications** : `tsc` (via `ts-node` OpenAPI generate), `npm test` API (**386/386**), `api-contracts` (**12/12**), `api-client-fetch` (**30/30**), `npm run build` (api-contracts + api-client-fetch), `openapi:generate` vert, `generate` contracts vert. Commit `feat(api): add paginated owned file list endpoint (Files 5)`.

### Web Core Files 3 — suppression sécurisée BFF

- **Web Core Files 3** (`cores/web-nextjs/`) : ajoute la suppression fichier sécurisée côté `@enistere/web-nextjs`. **357 tests** (333 + 24 nouveaux, 0 régression). BFF ciblé uniquement, jamais un proxy générique. API Core reste l'autorité ownership/permissions.
  - **`assertDelete`** (`src/core/auth/handlers/security.ts`) : garde-méthode DELETE (405), symétrique à `assertPost`.
  - **Handler BFF** (`src/core/files/handlers/delete-file-handler.ts`) : `DELETE /api/files/:id` — ordre sécurisé : méthode (405) → UUID (400, **aucun appel API**) → Origin/Referer + CSRF (403, **aucun appel API**) → client `writable` (un seul refresh coordonné) → `void` 204 API → `jsonOk(null)` 200 enveloppe. 409 → `NOT_DELETABLE` (jamais `NOT_DOWNLOADABLE`). 404 anti-énumération.
  - **Route** (`src/app/api/files/[id]/route.ts`) : `DELETE` ajouté à côté de `GET` existant.
  - **BFF client navigateur** (`deleteFile` dans `files-bff-client.ts`) : `DELETE /api/files/:id` — `credentials:"include"`, `X-CSRF-Token`, aucun Bearer, UUID encodé.
  - **Mutation hook** (`src/features/files/use-delete-file.ts`) : `useDeleteFile()` — `useMutation` **sans `mutationKey`**, `getCsrfToken()` → `deleteFile()`, **anti-double-soumission** (`useRef`), `onSuccess` : `queryClient.removeQueries(fileKeys.detail(id))`, `isSuccess`/`error`/`reset` exposés.
  - **UI détail fichier** (`src/features/files/file-details.tsx`) : bouton « Supprimer » conditionnel (`files.delete`), confirmation via `Dialog` UI Kit 4, erreur `Alert danger`, navigation post-succès via `onDeleteSuccess` prop (connexion Next.js dans `file-details-with-nav.tsx`).
  - **Wrapper navigation** (`src/app/(protected)/protected/files/[id]/file-details-with-nav.tsx`) : `"use client"`, branche `useRouter().replace("/protected")` → `FileDetails.onDeleteSuccess` (hors périmètre test, exclut `next/navigation` du tsconfig.test.json).
  - **Contraintes** : aucun bulk delete, aucune liste, aucune quarantaine/restauration, aucun Bearer navigateur, aucun proxy générique, anti-énumération 404 strict.
  - **Tests** : `test/files-handlers.test.ts` (+9 cas delete : méthode 405, UUID 400, Origin 403, CSRF invalide/absent 403, succès 200 no-store, requestId, 409→NOT_DELETABLE, 401/403/404/429/503) + `test/delete-bff-client.test.ts` (5 cas : DELETE same-origin, UUID encodé, URL /api/files/:id, 403/404/409→BffAuthError, réseau) + `test/use-delete-file.test.tsx` (8 cas : succès, cache supprimé, double-clic, 409/404/401, reset, isPending).
  - **Fix test helper** (`test/helpers/api-test-kit.tsx`) : `createMockFetch` utilise `null` body pour status 204/304 (undici interdit les corps sur ces codes).
  - **Vérifications** : `tsc --noEmit`, `npm run lint`, `npm test` (**357/357**), `npm run build`, `npm audit` (0 vuln), `git diff --check`. Commit `feat(web): add secure file deletion`.

### Web Core Files 2 — upload sécurisé BFF multipart

- **Web Core Files 2** (`cores/web-nextjs/`) : ajoute l'upload Web sécurisé côté `@enistere/web-nextjs`. **333 tests** (307 + 26 nouveaux, 0 régression). BFF ciblé uniquement, jamais un proxy générique. API Core reste l'autorité MIME/taille/permissions (ADR-007). Session via cookies HttpOnly, CSRF obligatoire (ADR-005).
  - **Handler BFF** (`src/core/files/handlers/upload-file-handler.ts`) : `POST /api/files/upload` — ordre sécurisé : méthode (405) → Origin/Referer + CSRF (403, **aucun appel API** avant validation) → validation fichier+catégorie (400) → client `writable` (un seul refresh coordonné) → réponse `PublicStoredFileDto`, `no-store`. 9 catégories validées enum-closed.
  - **Route** (`src/app/api/files/upload/route.ts`) : `dynamic = "force-dynamic"`, `POST` only.
  - **BFF client navigateur** (`uploadFile` dans `files-bff-client.ts`) : `POST /api/files/upload` avec `FormData` — **jamais de `Content-Type` forcé** (boundary posé par le runtime), `credentials:"include"`, `X-CSRF-Token`, aucun Bearer.
  - **Mapping erreurs étendu** (`files-response.ts`) : 413 → `FILE_TOO_LARGE`, 415 → `UNSUPPORTED_MEDIA_TYPE` (en plus des 400/401/403/404/409/429/502/503/504 existants).
  - **`FileErrorKind`** étendu (`file-error.ts`) : `too_large` (413) et `unsupported_type` (415) en plus des kinds existants.
  - **Mutation hook** (`src/features/files/use-upload-file.ts`) : `useUploadFile()` — `useMutation` **sans `mutationKey`** (résultat jamais en cache), `getCsrfToken()` → `FormData` → `uploadFile()`, **anti-double-soumission** (`useRef`), `uploadedFile` retourné dans l'état React (jamais en QueryCache), `reset()` exposé.
  - **UI** (`src/features/files/upload-form.tsx`) : Client Component `"use client"` — `FormField`/`FormFieldLabel`/`FormFieldError` + `Input` (file) + `Select` (9 catégories) + `Input` (subjectId optionnel, max 128) + `Button` (anti-double via `useUploadFile`) + `Alert` danger/success. Validation UX uniquement.
  - **Page protégée** (`src/app/(protected)/protected/files/upload/page.tsx`) : `dynamic = "force-dynamic"`, route privée héritée du layout.
  - **Contraintes** : aucun upload direct MinIO/S3, aucune URL signée côté client, aucun log de nom/chemin/contenu, aucun `Authorization` Bearer navigateur, aucun delete/list/admin/preview/multi-upload.
  - **Tests** : `test/upload-handler.test.ts` (15 cas : CSRF/Origin, fichier absent, catégorie invalide/absente, toutes catégories valides, 401/403/413/415/429/503, requestId, champs publics) + `test/upload-bff-client.test.ts` (5 cas : same-origin, no Content-Type, 413/415, réseau) + `test/use-upload-file.test.tsx` (8 cas : succès/no-cache, double-clic, 413/415/401, reset, subjectId, isPending).
  - **Vérifications** : `tsc --noEmit`, `npm run lint`, `npm test` (**333/333**), `npm run build`, `npm audit` (0 vuln), `git diff --check`. Commit `feat(web): add secure multipart file upload (Files 2)`.

### UI Kit 4 — primitives interactives Dialog / Select / Toast

- **UI Kit 4** (`cores/ui-kit/`) : ajoute trois primitives interactives accessibles. `@enistere/ui-kit` passe de **9** à **12 primitives Web React**, de **78** à **121 tests** (0 régression).
  - **Dialog** (`dialog/dialog.tsx`, `dialog.types.ts`, `dialog.css`) : modale `<dialog>` native — `showModal()`/`close()` pour focus trap, ESC, backdrop nativement. Props : `open`, `onDismiss`. Sous-composants : `DialogHeader`, `DialogTitle` (prop `as`, défaut `h2`), `DialogDescription`, `DialogContent`, `DialogFooter`. `aria-modal="true"` ; polyfill `showModal/close` dans le dom-setup tests (jsdom).
  - **Select** (`select/select.tsx`, `select.types.ts`, `select.css`) : `<select>` natif dans un `<span>` wrapper + chevron CSS-only (`::after` + `rotate(45deg)`). Props : `size` (sm/md/lg), `invalid` (→ `aria-invalid`). `forwardRef` cible `<select>` ; `className`/`style` vont sur le `<span>` wrapper.
  - **Toast** (`toast/toast.tsx`, `toast.types.ts`, `toast.css`) : notification non-modale. `variant` (`info`/`success`/`warning`/`danger`) → ARIA (`role="alert"` + `aria-live="assertive"` pour `danger` ; `role="status"` + `aria-live="polite"` sinon) + `aria-atomic="true"`. `ToastRegion` : conteneur de positionnement (6 positions) + `aria-label="Notifications"`. Aucun timer — le consommateur gère le cycle de vie.
  - **CSS** : `generated/css/styles.css` régénéré (inclut Dialog/Select/Toast). Tokens CSS uniquement (`var(--enistere-*)`), aucun hex, classes préfixées `enistere-`, `:focus-visible`, `:disabled`, `prefers-reduced-motion`.
  - **Exports** : `src/components/index.ts` étendu + `test/consumers/react.consumer.tsx` mis à jour.
  - **Contraintes** : aucune logique métier, aucun Radix/shadcn/Tailwind/Portal (ADR-009), compatibles React 19, sans régression des 78 tests existants.
  - **Vérifications** : `tsc --noEmit`, `npm run lint`, `npm test` (**121/121**), `npm run tokens:generate`, `npm run tokens:check`, `git diff --check`. Commit `feat(ui-kit): add Dialog, Select, Toast interactive primitives`.

### Mobile Core React Native 34 — alignement patch Expo SDK / doctor green

- **Mobile Core React Native 34** (`cores/mobile-react-native/`) : aligne les patchs Expo SDK 55 nécessaires pour ramener `expo-doctor` de 18/19 à **19/19**. `mobile-react-native` passe de `STARTER_THEME_PREFERENCE_READY` à **`STARTER_EXPO_DOCTOR_GREEN`**.
  - **`package.json`** : `expo` `~55.0.0`→`~55.0.27`, `expo-linking` `~55.0.15`→`~55.0.16`, `expo-secure-store` `~55.0.14`→`~55.0.15` (3 pins de patch uniquement).
  - **`package-lock.json`** : mises à jour transitives dans l'arbre `expo` 55.0.27 — tous des packages `@expo/*` CLI internes (non-runtime) et `postcss` patch.
  - **Aucun changement de code** : aucun fichier `app/`, `src/`, `scripts/` ou `test/` modifié.
  - **Contraintes** : aucune nouvelle dépendance, aucun changement SDK majeur/mineur, aucun changement AuthEngine/QueryClient/mutations.
  - **Vérifications** (locales) : `tsc --noEmit`, `expo lint`, `npm test` (**355/355 `node --test`**), expo-doctor **19/19**, `expo export -p ios`, `npm run smoke:android` (**passed** — `emulator-5554` / Pixel_6a, loginCount=1, refreshCount=1, 2026-07-08), `npm run smoke:ios` (`blocked` — Linux), `npm audit` root (0 vuln), `git diff --check`. Commit `chore(mobile): align expo sdk patch versions`.

### Mobile Core React Native 33 — câblage préférence de thème

- **Mobile Core React Native 33** (`cores/mobile-react-native/`) : câble la préférence de thème locale au `ThemeProvider`. `mobile-react-native` passe de `STARTER_SIGN_IN_FORM_READY` à **`STARTER_THEME_PREFERENCE_READY`**.
  - **`ThemePreferenceProvider`** (`src/theme/ThemePreferenceProvider.tsx`) : binding React qui lit `useUiStore(state => state.themePreference)` et passe `scheme={undefined}` quand `'system'` (→ suit l'OS via `useColorScheme`), ou `scheme='light'`/`'dark'` pour les surcharges explicites.
  - **`_layout.tsx`** : remplace `<ThemeProvider>` par `<ThemePreferenceProvider>` — seul changement dans le layout racine.
  - **Settings** : section "Preferences / UI" étend `ThemeSelector` (3 boutons System/Light/Dark, bouton actif en `variant="primary"`). Lecture `themePreference` + `setThemePreference` + `reset()` depuis `useUiStore`.
  - **Reset** : `reset()` remet `themePreference` à `'system'` (logique inchangée dans `ui-state.ts` — `resetUiState()` déjà confirmée par `ui-state.test.ts`).
  - **Non-persistance** : la préférence est in-memory uniquement (ADR-015 §16) ; elle disparaît au redémarrage et au reset UI.
  - **Contraintes** : aucune dépendance nouvelle, aucun endpoint métier, aucun changement AuthEngine/`withAuthRetry`/`authedRequest`/QueryClient/mutations, aucun stockage sensible.
  - **Vérifications** (locales) : `tsc --noEmit`, `expo lint`, `npm test` (**355/355 `node --test`**), expo-doctor **18/19** (drift patch pré-existant non causé par RN33), `expo export -p ios`, `npm run smoke:android` (`blocked` — aucun device), `npm run smoke:ios` (`blocked` — Linux, pas de macOS/xcrun), `npm audit` (0 vuln), `git diff --check`. Commit `feat(mobile): wire theme preference`.

### Mobile Core React Native 32 — formulaire sign-in générique RHF/Zod

- **Mobile Core React Native 32** (`cores/mobile-react-native/`) : remplace le bouton sign-in placeholder avec credentials hardcodés par un formulaire générique email/password utilisant React Hook Form + Zod via les primitives existantes RN3. `mobile-react-native` passe de `STARTER_IOS_SMOKE_BLOCKED_BY_ENVIRONMENT` à **`STARTER_SIGN_IN_FORM_READY`**.
  - **Formulaire sign-in** : `app/(public)/sign-in.tsx` — `useForm` + `createZodResolver` + schéma local (`emailField()` + `requiredText()`), champs `TextInputField` email (email-address, returnKeyType="next") et password (secureTextEntry, returnKeyType="send", `onSubmitEditing` → submit), erreurs de champ accessibles via `FormField`/`FormError` (live region polite, ADR-010 §16), erreur auth affichée comme message générique sans fuite sensible, état loading via `isSubmitting`, credentials hardcodés supprimés.
  - **Smoke Android** : `scripts/smoke-android.js` adapté — ajout de `SMOKE_EMAIL`/`SMOKE_PASSWORD` (env `RN_SMOKE_EMAIL`/`RN_SMOKE_PASSWORD`, défauts `smoke@example.com`/`smoke`), `findInputByLabel` (recherche par `content-desc` uniquement pour cibler les `EditText` RN vs les `TextView` des `FormLabel`), `waitForInputByLabel`, `tapInputAndType`, flux sign-in mis à jour (`tapInputAndType('Email', ...)` + `tapInputAndType('Password', ...)` + `keyevent 66`).
  - **Smoke iOS** : `scripts/smoke-ios.js` procédure mise à jour pour décrire le formulaire RN32 et les credentials de smoke.
  - **RN31** : précondition macOS/Xcode toujours non satisfaite (Linux, `xcrun` absent) — statut en attente environnement externe, non répété.
  - **Contraintes** : aucune dépendance nouvelle, aucun endpoint métier, aucun register/forgot password/OAuth, aucun changement AuthEngine/`withAuthRetry`/`authedRequest`/QueryClient/mutations, aucun stockage ni log de password/email brut.
  - **Vérifications** (locales) : `tsc --noEmit`, `expo lint`, `npm test` (**355/355 `node --test`**), expo-doctor **18/19** (drift patch pré-existant), `expo export -p ios`, `npm run smoke:android` (`blocked` — Linux, aucun device), `npm run smoke:ios` (`blocked` — Linux, pas de macOS/xcrun), `npm audit` (0 vuln), `git diff --check`. Commit `feat(mobile): add generic sign-in form`.

### Mobile Core React Native 30 — smoke runtime iOS / parity device

- **Mobile Core React Native 30** (`cores/mobile-react-native/`) : documente la parité runtime iOS du starter Expo public/protégé/settings et ajoute un préflight local `npm run smoke:ios` sans dépendance. `mobile-react-native` passe de `STARTER_SMOKE_AUTOMATION_READY` à **`STARTER_IOS_SMOKE_BLOCKED_BY_ENVIRONMENT`**.
  - **Résultat iOS** : exécution runtime iOS réelle bloquée par l'environnement local — hôte `Linux greenovate 7.0.10-201.fc44.x86_64`, `xcrun` absent (`command not found`). Aucune preuve iOS artificielle n'est créée.
  - **Script** : `scripts/smoke-ios.js` vérifie macOS/`xcrun`/`simctl`/`npx`, produit des événements JSON et un rapport `/tmp/enistere-mobile-rn30-ios-smoke-report.json` (`status: blocked` ici), et fournit une procédure prête à exécuter sur macOS/iOS device.
  - **Parité conservée** : Android reste couvert par RN28 (smoke visuel réel Android Emulator) et RN29 (`npm run smoke:android` semi-automatisé).
  - **Contraintes** : aucune dépendance, aucun backend réel, aucun endpoint métier, aucun SDK/adaptateur natif réel, aucun retry branché, aucune persistance nouvelle, aucun changement AuthEngine/`withAuthRetry`/`authedRequest`/QueryClient/mutations.
  - **Vérifications** (locales) : `tsc --noEmit`, `expo lint`, `npm test` (**54 fichiers `node --test`**), `expo-doctor 19/19`, `expo export -p ios`, `npm run smoke:ios` (`blocked` documenté), `npm audit`, `git diff --check`. **Prochaine mission recommandée (unique) : Mobile Core React Native 31 — exécution iOS smoke sur macOS/device réel.** Commit `docs(mobile): document ios smoke runtime blocker`.

### Mobile Core React Native 29 — automatisation locale du smoke runtime starter

- **Mobile Core React Native 29** (`cores/mobile-react-native/`) : ajoute un smoke runtime Android local reproductible pour le starter Expo public/protégé/settings. `mobile-react-native` passe de `STARTER_VISUAL_SMOKE_READY` à **`STARTER_SMOKE_AUTOMATION_READY`**.
  - **Script** : `npm run smoke:android` (`scripts/smoke-android.js`) utilise uniquement Node stdlib + `adb` + Expo CLI existant. Il vérifie les prérequis, démarre un mock auth local temporaire, configure `adb reverse`, lance Expo Android, pilote les labels UI via `uiautomator` et produit des logs JSON + un rapport `/tmp/enistere-mobile-rn29-smoke-report.json`.
  - **Parcours** : sign-in public → Home protégé → Settings protégé → scroll diagnostics → retour Home → refresh session → sign out → public.
  - **Positionnement** : RN28 = smoke manuel visuel ; RN29 = smoke local reproductible semi-automatisé ; E2E mobile complet futur sous décision de dépendance/ADR. RN29 ne prétend pas remplacer Detox/Maestro/Appium/Playwright mobile.
  - **Contraintes** : aucune dépendance, aucun backend réel, aucun endpoint métier, aucun SDK/adaptateur natif réel, aucun retry branché, aucune persistance nouvelle, aucun secret réel, aucun changement AuthEngine/`withAuthRetry`/`authedRequest`/QueryClient/mutations.
  - **Vérifications** (locales) : `tsc --noEmit`, `expo lint`, `npm test` (**54 fichiers `node --test`**), `expo-doctor 19/19`, `expo export -p ios`, `npm run smoke:android` sur Android Emulator `emulator-5554` (`passed`), `git diff --check`.
  - **Docs** : `README.md` + `ARCHITECTURE.md` §38 + `docs/project-status/MOBILE_RN29_RUNTIME_SMOKE_AUTOMATION.md` ; checkpoint `docs/project-status/` synchronisé. **Prochaine mission recommandée (unique) : Mobile Core React Native 30 — smoke runtime iOS/simulateur ou device parity.** Commit `chore(mobile): add runtime smoke automation`.

### Foundation CI Audit 1 — déblocage npm audit root/API

- **CI audit root/API** : corrige les vulnérabilités transverses `form-data` et `js-yaml` qui bloquaient les checks `audit` et `api-runtime`, sans affaiblir les gates et sans `npm audit fix --force`.
  - **Racine** : `form-data` passe à `4.0.6` ; `@redocly/openapi-core` est verrouillé en `1.34.7` dans le lockfile racine, version 1.x compatible avec `openapi-typescript`, afin de dédupliquer `js-yaml` vers `4.2.0` sans saut majeur Redocly.
  - **API Core** : overrides npm bornés pour forcer `form-data@4.0.6` et `js-yaml@4.2.0` sur les chemins `@nestjs/swagger`, Jest/Istanbul et Supertest/Superagent.
  - **RN29** : non responsable ; la PR RN29 ne modifie pas les dépendances root/API et reste limitée au smoke runtime mobile + documentation de statut.

### Mobile Core React Native 28 — smoke visuel device/simulateur du starter

- **Mobile Core React Native 28** (`cores/mobile-react-native/`) : vérifie le starter Expo public/protégé/settings sur Android Emulator réel sans nouvelle primitive ni logique métier. `mobile-react-native` passe de `STARTER_RUNTIME_HARDENED` à **`STARTER_VISUAL_SMOKE_READY`**.
  - **Runtime** : Android Emulator `Pixel_6a` via Expo Go et Metro ; iOS Simulator non disponible sur l'hôte Linux (`xcrun` absent). Login/refresh testés avec un mock auth local temporaire exposé par `adb reverse`, sans backend réel ni code applicatif modifié.
  - **Parcours** : sign-in public → Home protégé → Settings protégé → scroll Settings → retour Home → refresh session → sign out → public.
  - **Résultat** : aucune correction UI/runtime requise ; pas d'overflow bloquant, bouton coupé, scroll absent, route inaccessible ou header incohérent constaté.
  - **Contraintes** : aucune dépendance, aucun endpoint métier, aucun SDK/adaptateur natif réel, aucun retry branché, aucun changement AuthEngine/`withAuthRetry`/`authedRequest`/QueryClient/mutations.
  - **Vérifications** (locales) : smoke Android réel, captures temporaires dans `/tmp`, `tsc --noEmit`, `expo lint`, `npm test` (**54 fichiers `node --test`**), `expo-doctor 19/19`, `expo export -p ios`, `git diff --check`.
  - **Docs** : `README.md` + `ARCHITECTURE.md` §37 + `docs/project-status/MOBILE_RN28_VISUAL_SMOKE_REPORT.md` ; checkpoint `docs/project-status/` synchronisé. **Prochaine mission recommandée (unique) : Mobile Core React Native 29 — automatisation du smoke runtime starter.** Commit `fix(mobile): verify starter visual smoke`.

### Mobile Core React Native 27 — durcissement runtime du starter Expo

- **Mobile Core React Native 27** (`cores/mobile-react-native/`) : durcit le shell runtime Expo public/protégé/settings sans nouvelle primitive ni logique métier. `mobile-react-native` passe de `STARTER_SETTINGS_READY` à **`STARTER_RUNTIME_HARDENED`**.
  - **Runtime** : `expo export -p ios` réussit ; `npm start -- --localhost --non-interactive` démarre le projet mais Expo indique que `--non-interactive` n'est plus supporté. Export web tenté, bloqué par l'absence volontaire de `react-native-web` ; aucune dépendance ajoutée.
  - **Ergonomie** : boutons bornés/full-width avec label réductible, conteneur Sign-in centré et contraint, conteneur Home contraint, lignes Settings wrap-safe pour éviter les débordements sur petit écran.
  - **Contraintes** : aucun endpoint métier, aucun réseau ajouté, aucune dépendance, aucun SDK/adaptateur natif réel, aucun retry branché, aucun changement AuthEngine/`withAuthRetry`/`authedRequest`/QueryClient/mutations.
  - **Vérifications** (locales) : `tsc --noEmit`, `expo lint`, `npm test` (**54 fichiers `node --test`**), `expo-doctor 19/19`, `expo export -p ios`, tentative `npm start`, `git diff --check`.
  - **Docs** : `README.md` + `ARCHITECTURE.md` §36 ; checkpoint `docs/project-status/` synchronisé. **Prochaine mission recommandée (unique) : Mobile Core React Native 28 — smoke visuel device/simulateur du starter.** Commit `fix(mobile): harden starter runtime shell`.

### Mobile Core React Native 26 — V1 usable starter shell / settings générique

- **Mobile Core React Native 26** (`cores/mobile-react-native/`) : ajoute un écran Settings générique protégé pour rendre le starter V1 plus exploitable, conformément à `strategy/04_ROADMAP_GLOBAL.md` §9 Mobile Core React Native V1. `mobile-react-native` passe de `TELEMETRY_COORDINATOR_READY` à **`STARTER_SETTINGS_READY`**.
  - **Navigation** : nouvelle route `ROUTES.settings = '/settings'`, fichier `app/(app)/settings.tsx` dans la stack protégée, lien depuis `home.tsx`.
  - **Settings** : sections Session (statut, refresh session, sign out), Preferences/UI (`themePreference` Zustand RN 6 + reset UI), Privacy/Telemetry (consentement RN 21 via placeholder local), Environment (contexte safe RN 22 via placeholder/service), Foundation diagnostics (auth/query/upload/logger/consent/telemetry coordinator/retry).
  - **Contraintes** : aucun endpoint métier, aucun appel réseau, aucune dépendance, aucun adaptateur natif réel, aucun SDK analytics/crash réel, aucune persistance nouvelle, aucun retry branché, aucun changement AuthEngine/`withAuthRetry`/`authedRequest`/QueryClient/mutations.
  - **Tests** : aucun helper pur ajouté ; validation par typecheck/lint pour les écrans Expo/React + non-régression `npm test` existante (**355 cas `test(...)`**).
  - **Vérifications** (locales) : `tsc --noEmit`, `expo lint`, `npm test`, `expo-doctor 19/19`, `git diff --check`.
  - **Docs** : `README.md` + `ARCHITECTURE.md` §35 ; checkpoint `docs/project-status/` synchronisé. **Prochaine mission recommandée (unique) : Mobile Core React Native 27 — durcissement runtime du starter Expo.** Commit `feat(mobile): add generic settings starter shell`.

### Mobile Core React Native 25 — telemetry context composition opt-in

- **Mobile Core React Native 25** (`cores/mobile-react-native/`) : ajoute `src/telemetry` — des primitives de composition télémétrie **opt-in** qui combinent explicitement le consentement RN 21, le contexte environnement sûr RN 22 et les services analytics RN 13 / crash RN 19. `mobile-react-native` passe de `RETRY_READY` à **`TELEMETRY_COORDINATOR_READY`**. **Aucun SDK réel, aucun réseau, aucune persistance, aucun identify/user-id, aucune émission automatique et aucun usage du retry RN 24**.
  - **Contexte** : `TelemetryContext` borné construit via l'allow-list RN 22 (`buildTelemetryContext` / `createTelemetryContext`) ; identifiants device, PII, token et valeurs hors modèle sont droppés ; `describeTelemetryContextForLog` expose seulement `{fieldCount}` + enums grossiers.
  - **Gate** : `getTelemetryConsentDecision` / `isTelemetryCategoryAllowed` délèguent au `ConsentService` RN 21 ; règle **default-deny** conservée (`unknown`/`denied`/échec store bloquent, seul `granted` autorise).
  - **Coordinateur** : `createTelemetryCoordinator({ consent, environment, analytics?, crash?, logger? })` expose `track`, `captureError`, `captureMessage`. Chaque méthode vérifie le consentement de catégorie, enrichit avec le contexte safe puis appelle explicitement le service RN 13/RN 19 si fourni ; consentement absent/refusé ou service absent = no-op contrôlé ; erreurs adapter capturées, jamais de throw brut.
  - **Logs** : uniquement `{operation,category,allowed}` ; jamais event name, payload, body, URL, token, error message, stack ni contexte détaillé.
  - **Tests** : **+9** cas `node --test` — `telemetry-context-gate` et `telemetry-service` → **355 cas `test(...)`**.
  - **Vérifications** (locales) : `tsc --noEmit`, `expo lint`, `npm test` (355 cas `test(...)`), `expo-doctor 19/19`, `git diff --check`.
  - **Docs** : `README.md` + `ARCHITECTURE.md` §34 ; checkpoint `docs/project-status/` synchronisé. **Historique : RN26 a finalement livré le Settings starter shell V1.** Commit `feat(mobile): add telemetry coordinator primitives`.

### Mobile Core React Native 24 — retry / backoff primitives génériques

- **Mobile Core React Native 24** (`cores/mobile-react-native/`) : ajoute `src/retry` — des **primitives génériques de retry/backoff**, **pures et déterministes**, sans réseau réel, sans dépendance, sans `Date.now()` dans le chemin testé. `mobile-react-native` passe de `CLIPBOARD_READY` à **`RETRY_READY`**. **Aucun chemin existant modifié** : AuthEngine, `withAuthRetry`/`authedRequest`, QueryClient et mutations existantes restent inchangés.
  - **Policy/backoff** : `RetryPolicy` borné (`maxAttempts` **inclut l'appel initial**) + `normalizeRetryPolicy` ; `computeBackoffDelay(attempt, policy, rng?)` exponentiel borné, jitter déterministe via `rng` injecté, aucune horloge globale ni `Math.random()`.
  - **Décision retryable** : `isRetryableError` / `getRetryDecision` structurels — retryable network/timeout/408/429/5xx ; non retryable 4xx/401/403/session-expired/inconnu ; raison enum sûre, jamais le contenu de l'erreur.
  - **Runner** : `withRetry(fn, policy, { sleep, rng, shouldRetry?, logger? })` avec `sleep` injecté ; blocage dur 401/403/session-expired même si `shouldRetry` tente de forcer ; propage l'erreur originale finale ; logs sûrs `{attempt,delayMs}` uniquement.
  - **Tests** : **+16** `node --test` — `retry-policy-backoff` (normalisation/bornes, exponentiel borné, jitter déterministe), `retry-retryable-error` (network/timeout/408/429/5xx retryable, 4xx/auth/session non retryable, raison sûre), `retry-with-retry` (succès, delays, `maxAttempts`, erreur finale originale, hard-block auth, logs sûrs) → **346 tests**.
  - **Vérifications** (locales) : `tsc --noEmit`, `expo lint`, `npm test 346/346`, `expo-doctor 19/19`, `git diff --check`.

### Mobile Core React Native 23 — presse-papiers (clipboard) sécurisé primitives génériques

- **Mobile Core React Native 23** (`cores/mobile-react-native/`) : ajoute `src/clipboard` — des **primitives de presse-papiers sécurisé génériques**, **pures et testables**, avec un **seam futur `expo-clipboard`** mais **sans `expo-clipboard` réel, sans réseau, sans persistance, sans UI, sans lecture automatique au démarrage**. `mobile-react-native` passe de `APP_ENVIRONMENT_READY` à **`CLIPBOARD_READY`**. **Aucune dépendance ajoutée** ; **aucun fichier `cores/api-nestjs`/`web-nextjs`/`ui-kit`/`cloud`/`packages`/root modifié** ; périmètre `src/clipboard` + `test/**` + docs. Le presse-papiers est un **canal transitoire, partagé et non fiable** : son **contenu n'est JAMAIS loggé** (métadonnées seules) et **n'est jamais persisté** (pas de preferences/Zustand/Query/SecureStore).
  - **Modèle (`model.ts`, agnostique)** : `ClipboardSensitivity` (`normal`/`sensitive`) + `ClipboardOperationResult` (`success`/`unavailable`/`rejected`/`error`) ; `normalizeClipboardText` (coercition + borne `MAX_CLIPBOARD_TEXT_LENGTH`) ; **`isSensitiveClipboardText`** (réutilise la **redaction RN 8** `redactString` : Bearer/JWT/email/URL signée/URI `file://`/`content://` → sensible) + `classifyClipboardSensitivity` ; **`describeClipboardTextForLog`** → **`{length,sensitivity}` seulement** (jamais le contenu) + `describeClipboardResultForLog` → `{result}`.
  - **Adaptateur (`adapter.ts`)** : `ClipboardAdapter` (seam `expo-clipboard` : `setString` requis ; `getString?`/`hasString?`/`clear?` optionnels, async) + **`ClipboardAdapterError`** contrôlé (`operation` seul, jamais le texte).
  - **Placeholder (`placeholder-adapter.ts`)** : slot **mémoire transitoire** + `peek()` (test-only) ; aucune persistance durable.
  - **Service (`service.ts`, agnostique)** : `createClipboardService({adapter, logger?})` — `copy(text, options?)`/`getString()`/`hasString()`/`clear()`. **Politique** : `copy` **refuse** un texte sensible (détecté **ou** `markSensitive`) sauf `allowSensitive:true` → **`rejected`, adaptateur NON appelé** ; **`getString` opt-in explicite** (jamais auto ; valeur sensible renvoyée à l'appelant mais **jamais loggée**) ; **`clear` no-op sûr** si non supporté ; **best-effort non-intrusif** (adapter qui throw → `error` + `warn`, **ne throw jamais**) ; **logs RN 8 sûrs** `{operation,result,sensitivity,length}` — **jamais le contenu**.
  - **Tests** : **+10** `node --test` — `clipboard-model` (normalisation/borne, **détection sensible** Bearer/JWT/email/URL signée/`file`/`content` URI, `describe*ForLog` sans contenu) + `clipboard-service` (`copy` normal → `success`, **`copy` sensible sans opt-in → `rejected` (adapter non appelé)**, **opt-in/markSensitive**, **`getString` ne logge jamais le contenu**, **`clear` / no-op si absent**, **adapter qui throw → `error` sans throw brut**, placeholder, **logs sans token/PII/contenu**) → **330 tests**. Module **entièrement agnostique** (rien en typecheck-only).
  - **Vérifications** (locales) : **`tsc --noEmit`** ✅ ; **`expo lint`** ✅ (0) ; **`npm test` 330/330** ✅ ; **`expo-doctor` 19/19** ✅ ; **`git diff --check`** ✅ (RN 23 n'ajoute aucune dépendance).
  - **Docs** : `README.md` + `ARCHITECTURE.md` §32 ; checkpoint `docs/project-status/` synchronisé + note `ADR_BACKLOG.md`. **Prochaine mission recommandée (unique) : Mobile Core React Native 24 — retry / backoff primitives génériques (purs, horloge injectée).** Commit `feat(mobile): add secure clipboard primitives`.

### Mobile Core React Native 22 — environnement / métadonnées app primitives génériques non identifiantes

- **Mobile Core React Native 22** (`cores/mobile-react-native/`) : ajoute `src/app-environment` — des **primitives d'environnement / métadonnées app génériques, NON IDENTIFIANTES**, **pures et testables**, avec un **seam futur `expo-application`/`expo-device`** mais **sans `expo-device`/`expo-application` réel, sans réseau, sans collecte automatique**. `mobile-react-native` passe de `CONSENT_GATE_READY` à **`APP_ENVIRONMENT_READY`**. **Aucune dépendance ajoutée** ; **aucun fichier `cores/api-nestjs`/`web-nextjs`/`ui-kit`/`cloud`/`packages`/root modifié** ; périmètre `src/app-environment` + `test/**` + docs. Fournit un **contexte technique sûr** pour analytics (RN 13) / crash (RN 19), **gaté par le consentement RN 21** — RN 22 **ne câble pas** analytics/crash et **ne décide ni ADR-038/ADR-019/ADR-018**.
  - **Modèle (`model.ts`, agnostique)** : `AppEnvironmentSnapshot` **borné, allow-list stricte** — `os` (`ios`/`android`/`web`/`unknown`) + `osVersionMajor?` (**version majeure seulement**) + `appVersion?`/`buildNumber?`/`buildChannel?`/`locale?`/`environment?` (`local`/`development`/`staging`/`production`/`test`) ; normalizers **tolérants** (`normalizeOs`, **`normalizeMajorVersion`** `17.5.1`→`17`, `normalizeAppVersion`/`normalizeBuildNumber` allow-listés bornés, `normalizeBuildChannel` slug, `normalizeRuntimeEnvironment`, `normalizeLocaleField` via **`normalizeLocale` i18n** sans cycle) ; **`sanitizeAppEnvironmentSnapshot`** ne lit **QUE** les clés autorisées → tout `deviceId`/IDFA/AndroidID/`installationId`/`pushToken`/`serial`/`model`/`ip` **droppé** ; objet **gelé** ; `describeAppEnvironmentForLog` → champs grossiers (`os`/`osVersionMajor`/`buildChannel`/`environment`).
  - **Adaptateur (`adapter.ts`)** : `AppEnvironmentAdapter` (seam **synchrone** `expo-application`/`expo-device`) + **`AppEnvironmentAdapterError`** contrôlé (`operation` seul) ; un adaptateur réel ne doit lire **aucun identifiant**.
  - **Placeholder (`placeholder-adapter.ts`)** : mémoire ; `getSnapshot`/`setSnapshot` **assainissent** (un seed avec identifiant est strippé) ; **copies défensives** ; aucune persistance.
  - **Service (`service.ts`, agnostique)** : `createAppEnvironmentService({adapter, logger?})` — `getSnapshot` (assaini, gelé) + `describeForContext` (record gelé des champs définis) ; **best-effort non-intrusif** (adapter qui throw → `{os:'unknown'}` + `warn`, **ne throw jamais**) ; **ne persiste rien**, **ne collecte rien automatiquement** ; **logs RN 8 sûrs** `{operation}`+champs grossiers — **jamais d'identifiant/PII/version exacte**.
  - **Tests** : **+11** `node --test` — `app-environment-model` (normalisation OS/versions, **`17.5.1`→`17`**, strings bornées, **champs identifiants droppés**, snapshot **gelé**, `describe*ForLog` grossier) + `app-environment-service` (snapshot assaini gelé, **placeholder strippe les identifiants seedés**, `describeForContext` champs autorisés, **adapter défaillant → `{os:unknown}` sans throw**, **logs sans identifiant/PII/version exacte**) → **320 tests**. Module **entièrement agnostique** (rien en typecheck-only).
  - **Vérifications** (locales) : **`tsc --noEmit`** ✅ ; **`expo lint`** ✅ (0) ; **`npm test` 320/320** ✅ ; **`expo-doctor` 19/19** ✅ ; **`git diff --check`** ✅ (RN 22 n'ajoute aucune dépendance).
  - **Docs** : `README.md` + `ARCHITECTURE.md` §31 ; checkpoint `docs/project-status/` synchronisé + note `ADR_BACKLOG.md`. **Prochaine mission recommandée (unique) : Mobile Core React Native 23 — presse-papiers (clipboard) sécurisé primitives génériques (seam, sans `expo-clipboard` réel).** Commit `feat(mobile): add safe app environment primitives`.

### Mobile Core React Native 21 — consentement télémétrie / privacy gate primitives génériques

- **Mobile Core React Native 21** (`cores/mobile-react-native/`) : ajoute `src/consent` — des **primitives de consentement télémétrie / privacy gate génériques**, **pures et testables**, **sans SDK analytics/crash réel, sans réseau, sans UI de consentement, sans identifiant utilisateur réel, sans PII**. `mobile-react-native` passe de `PREFERENCES_READY` à **`CONSENT_GATE_READY`**. **Aucune dépendance ajoutée** ; **aucun fichier `cores/api-nestjs`/`web-nextjs`/`ui-kit`/`cloud`/`packages`/root modifié** ; périmètre `src/consent` + `test/**` + docs. **Primitive préparatoire : ne décide PAS ADR-038**, **ne câble pas** les services analytics (RN 13) / crash (RN 19) et **n'émet rien**.
  - **Modèle (`model.ts`, agnostique)** : `ConsentCategory` (`analytics`/`crash`/`performance`/`diagnostics`) + `ConsentStatus` (`granted`/`denied`/`unknown`) + `ConsentSet` ; `normalizeConsentCategory` (catégorie inconnue → `undefined`, ignorée) + `normalizeConsentStatus` (junk → `unknown`, **jamais `granted`**) + **`sanitizeConsentSet`** (tolérant) + `isConsentGranted` + **`isTelemetryAllowed`** = **default-deny** (true **seulement** si catégorie connue ET `granted`) ; `describeConsentEntryForLog` → `{category,status}` / `describeConsentForLog` → `{count}` — **jamais de valeur utilisateur**.
  - **Store (`store.ts`)** : `ConsentStore` seam (async) + **`ConsentStoreError`** contrôlé ; **`createPreferenceConsentStore(preferenceService)`** délègue la persistance aux **préférences non sensibles RN 20** sous clés `privacy.consent.<category>` (non sensibles) ; **`clear()` ne supprime que les clés `privacy.consent.*`** (jamais tout le store).
  - **Placeholder (`placeholder-store.ts`)** : mémoire, copies défensives, notifie au changement ; aucune persistance.
  - **Service (`service.ts`, agnostique)** : `createConsentService({store, logger?})` — `get`/`set`/`isAllowed`/`getAll`/`clear`/`subscribe` ; **`isAllowed` default-deny** ; **best-effort non-intrusif** (store qui throw → `unknown` = non autorisé, **ne throw jamais** ; catégorie inconnue sur `set` ignorée ; **listener isolé**) ; **logs RN 8 sûrs** `{operation,category,status}` / `{operation,count}` — **jamais de valeur utilisateur**.
  - **Tests** : **+15** `node --test` — `consent-model` (catégories/statuts, **junk → non autorisé**, **granted seul autorise**, `denied`/`unknown` bloquent, `sanitizeConsentSet`, `describe*ForLog`) + `consent-service` (get/set/isAllowed/getAll/clear, **catégorie inconnue ignorée**, **store défaillant → non autorisé sans throw**, **listener isolé**, **logs enums/count**) + `consent-preference-store` (mapping `privacy.consent.*` non sensible, round-trip, **`clear()` ne touche que le consentement**) → **309 tests**. Module **entièrement agnostique** (rien en typecheck-only).
  - **Vérifications** (locales) : **`tsc --noEmit`** ✅ ; **`expo lint`** ✅ (0) ; **`npm test` 309/309** ✅ ; **`expo-doctor` 19/19** ✅ ; **`git diff --check`** ✅ (RN 21 n'ajoute aucune dépendance).
  - **Docs** : `README.md` + `ARCHITECTURE.md` §30 ; checkpoint `docs/project-status/` synchronisé (ADR-038 reste **À RÉDIGER**) + note `ADR_BACKLOG.md`. **Prochaine mission recommandée (unique) : Mobile Core React Native 22 — environnement / métadonnées app primitives génériques (seam, non identifiant).** Commit `feat(mobile): add telemetry consent primitives`.

### Mobile Core React Native 20 — préférences non sensibles persistantes primitives génériques

- **Mobile Core React Native 20** (`cores/mobile-react-native/`) : ajoute `src/preferences` — des **primitives de préférences persistantes NON SENSIBLES génériques**, **pures et testables**, avec un **seam futur MMKV/AsyncStorage** mais **sans MMKV réel, sans AsyncStorage réel, sans SecureStore (secrets), sans Zustand persistant, sans réseau, sans logique métier**. `mobile-react-native` passe de `CRASH_REPORTING_READY` à **`PREFERENCES_READY`**. **Aucune dépendance ajoutée** ; **aucun fichier `cores/api-nestjs`/`web-nextjs`/`ui-kit`/`cloud`/`packages`/root modifié** ; périmètre `src/preferences` + `test/**` + docs.
  - **Séparation des couches (ADR-015 / ADR-012)** : **SecureStore** = secrets ; **Préférences (RN 20)** = données **non sensibles persistables** (thème/langue/onboarding/filtres non sensibles) ; **Zustand RN 6** = état UI **in-memory** non persisté ; **TanStack Query RN 5** = server-state, **jamais** persisté ici.
  - **Modèle (`model.ts`, agnostique)** : `PreferenceValue` (`boolean`/`string`/`number`) + `PreferenceSet` ; bornes `MAX_PREFERENCE_KEY_LENGTH`/`MAX_PREFERENCE_VALUE_LENGTH`/`MAX_PREFERENCES` ; **`isValidPreferenceKey`** (identifiant borné **ET non sensible**, réutilise **`isSensitiveKey`** RN 8) ; `normalizePreferenceValue` ; **`isSensitivePreferenceValue`** (string que la redaction RN 8 modifierait → sensible) ; **`sanitizePreferenceSet`** (drop clés/valeurs invalides ou sensibles, cap ; tolérant) ; **getters typés à défaut sûr** (`getBooleanPreference`/`getStringPreference`/`getNumberPreference`/`getPreferenceValue<T>`) ; `describePreferencesForLog` → **`{count}` seulement**.
  - **Adaptateur (`adapter.ts`)** : `PreferenceStore` (seam **async** MMKV/AsyncStorage : `get`/`set`/`remove`/`clear`/`getAll?`/`subscribe?`) — store « bête », le service est le garde ; **`PreferenceStoreError`** contrôlé (`operation` seul).
  - **Placeholder (`placeholder-store.ts`)** : mémoire ; **copies défensives** ; stocke les valeurs telles quelles (pour prouver que le service assainit en lecture) ; **aucune persistance réelle**.
  - **Service (`service.ts`, agnostique)** : `createPreferenceService({store, logger?})` — `get`/`getBoolean`/`getString`/`getNumber`/`set`/`remove`/`clear`/`getAll`/`subscribe` (**async** sauf `subscribe`) ; **garde les écritures** (clé invalide/sensible **ou** valeur sensible → **drop**, jamais persister un secret masqué) et **assainit les lectures** ; **best-effort non-intrusif** (store qui throw → défaut sûr/no-op + `warn`, **ne throw jamais** ; **listener isolé**) ; **logs RN 8 sûrs** `{operation,count}` — **jamais clé ni valeur**.
  - **Tests** : **+15** `node --test` — `preferences-model` (validation clés incl. **rejet clés sensibles**, normalisation/bornage, `isSensitivePreferenceValue`, `sanitizePreferenceSet`, getters à défaut sûr, `describePreferencesForLog` sans clé/valeur) + `preferences-service` (round-trip, **refus clés sensibles** token/accessToken/refresh_token/password/email/phone/signedUrl/apiKey, **refus valeurs sensibles** Bearer/JWT/email/URL signée/URI device, **lecture assainie** défense-en-profondeur, **store défaillant best-effort sans throw**, **listener isolé**, **logs `{operation,count}`**, tolérance input invalide) → **294 tests**. Module **entièrement agnostique** (rien en typecheck-only).
  - **Vérifications** (locales) : **`tsc --noEmit`** ✅ ; **`expo lint`** ✅ (0) ; **`npm test` 294/294** ✅ ; **`expo-doctor` 19/19** ✅ ; **`git diff --check`** ✅ (RN 20 n'ajoute aucune dépendance).
  - **Docs** : `README.md` + `ARCHITECTURE.md` §29 ; checkpoint `docs/project-status/` synchronisé (ADR-015 annoté ; **aucun MMKV/AsyncStorage réel implémenté**) + note `ADR_BACKLOG.md`. **Prochaine mission recommandée (unique) : Mobile Core React Native 21 — consentement télémétrie / privacy gate primitives génériques (ADR-038).** Commit `feat(mobile): add non-sensitive preferences primitives`.

### Mobile Core React Native 19 — crash / error-reporting primitives génériques

- **Mobile Core React Native 19** (`cores/mobile-react-native/`) : ajoute `src/crash-reporting` — des **primitives de crash / error-reporting génériques**, **pures et testables**, **sans SDK réel** (Sentry/Crashlytics/Bugsnag/Firebase/OTel), **sans réseau, sans persistance, sans batching, sans crash handler global obligatoire, sans logique métier**. `mobile-react-native` passe de `BIOMETRIC_GATE_READY` à **`CRASH_REPORTING_READY`**. **Aucune dépendance ajoutée** ; **aucun fichier `cores/api-nestjs`/`web-nextjs`/`ui-kit`/`cloud`/`packages`/root modifié** ; périmètre `src/crash-reporting` + `test/**` + docs. **Primitive préparatoire : ne décide PAS ADR-019** (qui reste à rédiger).
  - **Sécurité (ADR-040 §17/§18/§19, ADR-015 §12/§21/§24)** : toute donnée passe par la **redaction centrale RN 8** (`redactValue`/`redactString`) puis est **bornée** ; **jamais** token/cookie/Authorization/URL signée/URI device/PII/body, **jamais de stack brute** (rédigée + cap frames), **aucun user-id réel** (`identify` absent), **aucun crash handler global** imposé.
  - **Modèle (`event.ts`, agnostique)** : `CrashReportEvent` borné (`severity`/`source`/`name`/`message`/`stack?`/`context`) ; `CrashSeverity` (`fatal`/`error`/`warning`/`info`) + `CrashSource` (`unhandled`/`unhandledRejection`/`caught`/`manual`/`unknown`) + `CrashContext` (primitives) ; `sanitizeCrashMessage`/**`sanitizeCrashStack`** (redaction + bornes/cap frames)/`sanitizeCrashContext` (clés sensibles → `[Redacted]`, primitives bornées, cap keys) ; `normalizeCrashSeverity`/`normalizeCrashSource` tolérants (junk → `error`/`unknown`) ; `createCrashReportEvent` (objet **gelé**, ne throw jamais) + `cloneCrashReportEvent` (copie défensive) ; `describeCrashEventForLog` → **`{severity,source}` seulement**.
  - **Adaptateur (`adapter.ts`)** : `CrashReporterAdapter` (seam Sentry/Crashlytics : `captureError`/`captureMessage`/`setContext?`/`flush?`) — ne reçoit **QUE** des événements **déjà assainis** ; **`CrashReporterAdapterError`** contrôlé (`operation` seul).
  - **Placeholder (`placeholder-adapter.ts`)** : mémoire ; `getErrors`/`getMessages`/`getContext` renvoient des **copies défensives** (re-clone gelé) ; `flushCount` ; **aucune dépendance/réseau/persistance**.
  - **Service (`engine.ts`, agnostique)** : `createCrashReporterService({adapter, logger?, context?})` — `captureError`/`captureMessage`/`setContext`/`flush` ; **best-effort non-intrusif** — un adapter qui **throw** (sync) **ou rejette** (async) est **capturé** → `warn` sûr, **jamais re-throw, jamais de faux succès, jamais de rejection non gérée** ; **logs RN 8 sûrs** `{operation,severity,source}` / `{operation}` — **jamais le message/stack/context**.
  - **Tests** : **+17** `node --test` — `crash-reporting-event` (normalisation, **sanitization message/stack/context** : tokens/JWT/Bearer/emails/URL signées/URI device rédigés, bornes, cap frames/keys, tolérance input invalide, objets gelés, `describe*ForLog` enums) + `crash-reporting-engine` (captures assainies → adapter, **setContext mergé/assaini**, **capture ne throw jamais** (sync throw), **async reject swallowed sans faux succès**, **flush best-effort**, **logs sans contenu sensible**, **placeholder copies défensives**) → **279 tests**. Module **entièrement agnostique** (rien en typecheck-only).
  - **Vérifications** (locales) : **`tsc --noEmit`** ✅ ; **`expo lint`** ✅ (0) ; **`npm test` 279/279** ✅ ; **`expo-doctor` 19/19** ✅ ; **`git diff --check`** ✅ (RN 19 n'ajoute aucune dépendance).
  - **Docs** : `README.md` + `ARCHITECTURE.md` §28 ; checkpoint `docs/project-status/` synchronisé (ADR-019 reste **À RÉDIGER**) + note `ADR_BACKLOG.md`. **Prochaine mission recommandée (unique) : Mobile Core React Native 20 — préférences non sensibles persistantes primitives génériques (seam, sans MMKV/AsyncStorage réel — ADR-015 §15/§16).** Commit `feat(mobile): add crash reporting primitives`.

### Mobile Core React Native 18 — gate biométrique local primitives génériques

- **Mobile Core React Native 18** (`cores/mobile-react-native/`) : ajoute `src/biometrics` — des **primitives de gate biométrique local génériques**, **pures et testables**, **sans Expo `LocalAuthentication` réel, sans Keychain, sans module natif, sans écran/provider/hook obligatoire, sans logique métier**. `mobile-react-native` passe de `FEATURE_FLAGS_READY` à **`BIOMETRIC_GATE_READY`**. **Aucune dépendance ajoutée** ; **aucun fichier `cores/api-nestjs`/`web-nextjs`/`ui-kit`/`cloud`/`packages`/root modifié** ; périmètre `src/biometrics` + `test/**` + docs.
  - **Gouvernance (ADR-015 §20/§21)** : la biométrie est un **gate d'UX local UNIQUEMENT** — elle **ne remplace JAMAIS** login/refresh/session serveur (**l'API Core reste l'autorité**), **ne compense jamais** une stratégie de token faible, **reste optionnelle** et **laisse place à un fallback** projet ; **aucun secret/token/biométrie/résultat/profil stocké** ; **aucun prompt/message utilisateur ni cause native brute loggé**.
  - **Modèle (`src/biometrics/model.ts`, agnostique)** : `BiometricAvailability` (`available`/`notEnrolled`/`unsupported`/`unknown`) + `BiometricType` borné (`fingerprint`/`facial`/`iris`/`unknown`) + `BiometricAuthOutcome` (`success`/`refused`/`cancelled`/`lockout`/`unavailable`/`error`) ; helpers **tolérants** (`normalizeBiometric*`, alias/booléens → enum ; **junk → `unknown`/`error`, jamais `success`**) ; `normalizeAvailabilityState`/`normalizeAuthResult` → objets **gelés** ; `isAvailabilityUsable` (true **seulement** si `available`), `isAuthSuccess` (true **seulement** si `success`) ; `describeAvailabilityForLog` → `{availability,type}`, `describeAuthResultForLog` → `{outcome}` — **enums uniquement**.
  - **Adaptateur (`adapter.ts`)** : `BiometricAdapter` (seam Expo `LocalAuthentication`/Keychain : `getAvailability`/`authenticate`, **async**) ; `BiometricAuthRequest { reason? }` (prompt forwardé tel quel, **jamais loggé**) ; **`BiometricAdapterError`** contrôlé (`operation` seul, sans cause sensible).
  - **Placeholder (`placeholder-adapter.ts`)** : `createPlaceholderBiometricAdapter` — **mémoire** ; `setAvailability`/`setNextOutcome` ; compteur `authenticateCalls` ; **aucune dépendance/natif/persistance**.
  - **Service (`engine.ts`, agnostique)** : `createBiometricService({adapter, logger?})` — `getAvailability` (gelé)/`isAvailable`/`authenticate`. **Stateless.** **Aucun faux succès** : `authenticate` **vérifie d'abord la disponibilité** et renvoie `unavailable` **sans prompter** si le device est inutilisable ; adapter qui throw → `error` ; outcome inconnu → `error` ; **ne throw jamais**. **Logs RN 8 sûrs** `{availability,type}`/`{outcome}`/`{operation}` — **jamais le prompt ni la cause native**.
  - **Tests** : **+18** `node --test` — `biometrics-model` (normalisation/junk, type guards, objets gelés, `isAvailabilityUsable`/`isAuthSuccess`, `describe*ForLog`) + `biometrics-engine` (disponibilité, `authenticate` success/refused/cancelled/lockout/error, **device inutilisable → `unavailable` sans prompt** (`authenticateCalls === 0`), **erreurs adapter contrôlées sans throw**, **junk → `error`**, **logs sans prompt ni cause**, placeholder) → **262 tests**. Module **entièrement agnostique** (aucun hook/provider → rien en typecheck-only).
  - **Vérifications** (locales) : **`tsc --noEmit`** ✅ ; **`expo lint`** ✅ (0) ; **`npm test` 262/262** ✅ ; **`expo-doctor` 19/19** ✅ ; **`git diff --check`** ✅ (RN 18 n'ajoute aucune dépendance).
  - **Docs** : `README.md` + `ARCHITECTURE.md` §27 ; checkpoint `docs/project-status/` synchronisé + note ADR-019 dans `ADR_BACKLOG.md`. **Prochaine mission recommandée (unique) : Mobile Core React Native 19 — crash / error-reporting primitives génériques (seam, sans SDK réel — ADR-019).** Commit `feat(mobile): add biometric gate primitives`.

### Mobile Core React Native 17 — feature flags / config primitives génériques

- **Mobile Core React Native 17** (`cores/mobile-react-native/`) : **étend** `src/config` (env) avec des **primitives de feature flags / config génériques**, **pures et testables**, **sans SDK remote-config réel, sans réseau, sans persistance, sans user targeting réel, sans écran/hook obligatoire/provider global**. `mobile-react-native` passe de `NETWORK_STATUS_READY` à **`FEATURE_FLAGS_READY`**. **Aucune dépendance ajoutée** ; **aucun fichier `cores/api-nestjs`/`web-nextjs`/`ui-kit`/`cloud`/`packages`/root modifié** ; périmètre `src/config` + `test/**` + docs. **Distinct des `flags` UI Zustand RN 6** (config ≠ état UI local).
  - **Modèle (`src/config/flag-model.ts`, agnostique)** : `FlagValue` (boolean/string/number) + `FlagSet` ; bornes `MAX_FLAG_KEY_LENGTH`/`MAX_FLAG_VALUE_LENGTH`/`MAX_FLAGS` ; `isValidFlagKey` ; `normalizeFlagValue` (primitives ; **strings bornées** ; non-finis droppés) ; **`sanitizeFlagSet`** (tolérant) ; **getters typés à défaut sûr** (`getBooleanFlag`/`getStringFlag`/`getNumberFlag`/`getFlagValue<T>` — flag renvoyé **uniquement si le type correspond**) ; `describeFlagsForLog` → **`{count}` seulement** (jamais clés ni valeurs).
  - **Adaptateur (`flag-adapter.ts`)** : `FlagAdapter` (seam local/remote-config : `getFlags`/`subscribe?`/`refresh?`), **`FlagAdapterError`** contrôlé.
  - **Placeholder (`placeholder-flag-adapter.ts`)** : `createPlaceholderFlagAdapter` — **mémoire** ; `setFlags` (assaini + notifie) ; **aucune dépendance/réseau/persistance**.
  - **Service (`flag-service.ts`, agnostique)** : `createFlagService({adapter, defaults?, logger?})` — résout `{...defaults, ...adapterFlags}` (assainis, **adapter > defaults**) → `getFlag(key, default)` (typé, **défaut sûr**), `getAll`, `subscribe`, `refresh` (best-effort, **ne throw jamais**), `dispose` ; **non-intrusif** (erreurs adapter **capturées** + `warn` sûr, défauts conservés ; **listener qui throw isolé**) ; **logs RN 8 sûrs** `{count}` / `{operation}` — **jamais clé ni valeur**.
  - **Sécurité (07_SECURITY / ADR-015 §19/§21)** : un flag = **config** (jamais secret/token/URL signée/payload serveur/PII) ; valeurs **bornées** et **jamais loggées** ; **aucun réseau/persistance/user targeting réel** ; séparé de l'état UI Zustand RN 6.
  - **Tests** : **+17** `node --test` — `config-flags` (validation clés, normalisation/bornage, `sanitizeFlagSet`, **getters à défaut sûr** sur type mismatch, `describeFlagsForLog` **sans clé/valeur**, tolérance input invalide) + `config-flag-service` (résolution defaults⊕adapter, `getFlag`/`getAll`, **subscribe/unsubscribe déterministe**, changements adapter, **refresh best-effort + erreur contrôlée**, **listener isolé**, **erreurs adapter contrôlées**, **logs sans clé/valeur**, `dispose`, tolérance input invalide) → **244 tests**. Module **entièrement agnostique** (aucun hook/provider → rien en typecheck-only).
  - **Vérifications** (locales) : **`tsc --noEmit`** ✅ ; **`expo lint`** ✅ (0) ; **`npm test` 244/244** ✅ ; **`expo-doctor` 19/19** ✅ ; **`git diff --check`** ✅ (RN 17 n'ajoute aucune dépendance).
  - **Docs** : `README.md` + `ARCHITECTURE.md` §26 (étend §8) ; checkpoint `docs/project-status/` synchronisé. **Prochaine mission recommandée (unique) : Mobile Core React Native 18 — gate biométrique local primitives génériques (ADR-015 §20).** Commit `feat(mobile): add generic feature flag primitives`.

### Mobile Core React Native 16 — connectivité réseau (network status) primitives génériques

- **Mobile Core React Native 16** (`cores/mobile-react-native/`) : **étend** les primitives offline de RN 3 (`src/offline`) avec une **couche de connectivité générique**, **pure et testable**, **sans dépendance native** (NetInfo réel), **sans offline sync, sans rejeu automatique, sans persistance, sans écran/hook obligatoire/provider global**. `mobile-react-native` passe de `APP_LIFECYCLE_READY` à **`NETWORK_STATUS_READY`**. **Aucune dépendance ajoutée** ; **aucun fichier `cores/api-nestjs`/`web-nextjs`/`ui-kit`/`cloud`/`packages`/root modifié** ; **aucun module `src/network` concurrent** (la vérité réseau reste dans `src/offline`) ; périmètre `src/offline` + `test/**` + docs.
  - **Modèle étendu (`src/offline/network-state.ts`, agnostique — additif)** : RN 3 **inchangé** (`NetworkStatus`/`NetworkState`/`networkState`/`isOnline`/`isOffline`/**`shouldQueueMutations`** = **API canonique**, queue sauf positivement `online`). Ajouts : `NetworkConnectionType` **borné** (`wifi`/`cellular`/`ethernet`/`other`/`none`/`unknown` — **jamais** SSID/carrier/IP) ; `type?` **optionnel** sur `NetworkState` ; `NetworkSnapshot` ; **`normalizeNetworkStatus`** (booléen/strings → status ; garbage → `unknown`) et **`normalizeConnectionType`** (tolérants, sans throw).
  - **Adaptateur (`network-adapter.ts`)** : `NetworkAdapter` (seam RN NetInfo : `getStatus(): NetworkSnapshot`/`subscribe`), **`NetworkAdapterError`** contrôlé.
  - **Placeholder (`placeholder-network-adapter.ts`)** : `createPlaceholderNetworkAdapter` — **mémoire** ; `setStatus` (status nu ou `{status,type}`) simule un changement OS ; **aucune dépendance native/persistance**.
  - **Service (`network-service.ts`, agnostique)** : `createNetworkService({adapter, logger?, clock?})` → **`getStatus(): NetworkState`** (compose avec `shouldQueueMutations`), `shouldQueue()`, `subscribe`, `transition(input)`, `dispose` ; **`changedAt` stampé sur changement de STATUS** via **horloge injectée** (défaut déterministe `0`) — un changement de type seul conserve `changedAt` (contrat RN 3) ; **best-effort non-intrusif** (erreurs adapter **capturées** + `warn` sûr, défaut `unknown` ; **listener qui throw isolé**) ; **logs RN 8 sûrs** : que des **enums** (`{from,to,type}`/`{operation}`) — aucune donnée device/PII.
  - **Intégration RN 3 / sécurité (ADR-015 §19)** : **`shouldQueueMutations` reste canonique** ; aucun token/URL signée/payload serveur/donnée sensible ; `type` enum non identifiant.
  - **Tests** : **+15** `node --test` — `network-state` (RN 3, **inchangé**, compat prouvée) + `network-status` (normalisation status/type, `NetworkSnapshot`, `shouldQueueMutations` inchangé) + `network-service` (lecture initiale, **changements adapter → service + subscribers**, `changedAt` sur status, type-only conserve `changedAt`, **subscribe/unsubscribe déterministe**, **listener isolé**, **erreurs adapter contrôlées sans throw**, `dispose`, **logs enums seulement**) → **227 tests**. Module **entièrement agnostique** (aucun hook/provider → rien en typecheck-only).
  - **Vérifications** (locales) : **`tsc --noEmit`** ✅ ; **`expo lint`** ✅ (0) ; **`npm test` 227/227** ✅ ; **`expo-doctor` 19/19** ✅ ; **`git diff --check`** ✅ (RN 16 n'ajoute aucune dépendance).
  - **Docs** : `README.md` + `ARCHITECTURE.md` §25 (étend §11) ; checkpoint `docs/project-status/` synchronisé. **Prochaine mission recommandée (unique) : Mobile Core React Native 17 — feature flags / config primitives génériques.** Commit `feat(mobile): add generic network status primitives`.

### Mobile Core React Native 15 — app lifecycle primitives génériques

- **Mobile Core React Native 15** (`cores/mobile-react-native/`) : **couche générique de cycle de vie applicatif**, **pure et testable**, **sans dépendance native** (RN `AppState` réel), **sans écran, sans hook obligatoire, sans provider global, sans stockage, sans logique métier**. `mobile-react-native` passe de `A11Y_READY` à **`APP_LIFECYCLE_READY`**. **Aucune dépendance ajoutée** ; **aucun fichier `cores/api-nestjs`/`web-nextjs`/`ui-kit`/`cloud`/`packages`/root modifié** ; périmètre `src/app-lifecycle` + `test/**` + docs. Prépare le **flush analytics (RN 13)**, le **refresh session au premier plan** et la **planif notifications (RN 10)** — sans les implémenter.
  - **État (`src/app-lifecycle/state.ts`, agnostique)** : **`AppLifecycleState`** (`active`/`background`/`inactive`/`unknown`) ; `normalizeAppLifecycleState` (RN `AppStateStatus` incl. `extension`→`background` ; **tolère tout input invalide** → `unknown`, jamais de throw) ; helpers `isForeground`/`isBackground`, **`isValidTransition`** (matrice : même état no-op ; `unknown`→n'importe ; **un état déterminé ne revient jamais à `unknown`** ; états réels interchangeables), **`nextAppLifecycleState`** (applique si valide, sinon conserve).
  - **Adaptateur (`adapter.ts`)** : `AppLifecycleAdapter` (seam RN `AppState` : `getState`/`subscribe`), **`AppLifecycleAdapterError`** contrôlé (seulement `operation`).
  - **Placeholder (`placeholder-adapter.ts`)** : `createPlaceholderAppLifecycleAdapter` — **mémoire** ; `setState` simule un changement OS ; **aucune dépendance native/persistance**.
  - **Service (`engine.ts`, agnostique)** : `createAppLifecycleService({adapter, logger?})` → `getState`/`subscribe`/`transition`/`dispose` ; transitions **validées** ; **best-effort non-intrusif** (erreurs adapter `getState`/`subscribe` **capturées** + `warn` sûr, défaut `unknown` ; **listener qui throw isolé**) ; **logs RN 8 sûrs** : que des **enums** (`{from,to}` au changement, `{operation}` en erreur) — **aucune donnée utilisateur**. **Aucun `Date.now()`**.
  - **Sécurité (02/06 / ADR-040)** : aucune donnée utilisateur/sensible ; aucun stockage ; aucune dépendance ; aucun provider global obligatoire.
  - **Tests** : **+16** `node --test` — `app-lifecycle-state` (normalisation incl. `extension`/garbage, `isValidTransition` matrice, `nextAppLifecycleState` valide/ignoré/toléré) + `app-lifecycle-engine` (état initial, **changements adapter → service + subscribers**, transition validée, **subscribe/unsubscribe déterministe**, no-op même état, **listener isolé**, **erreurs adapter contrôlées sans throw**, `dispose`, **logs enums seulement**) → **212 tests**. Module **entièrement agnostique** (aucun hook/provider → rien en typecheck-only).
  - **Vérifications** (locales) : **`tsc --noEmit`** ✅ ; **`expo lint`** ✅ (0) ; **`npm test` 212/212** ✅ ; **`expo-doctor` 19/19** ✅ ; **`git diff --check`** ✅ (RN 15 n'ajoute aucune dépendance).
  - **Docs** : `README.md` + `ARCHITECTURE.md` §24 ; checkpoint `docs/project-status/` synchronisé. **Prochaine mission recommandée (unique) : Mobile Core React Native 16 — connectivité réseau (network status) primitives génériques.** Commit `feat(mobile): add generic app lifecycle primitives`.

### Mobile Core React Native 14 — accessibilité (a11y) primitives génériques

- **Mobile Core React Native 14** (`cores/mobile-react-native/`) : **couche d'accessibilité générique** (ADR-010 §16, spec §45), **pure et testable**, **sans dépendance native** (`AccessibilityInfo` réel), **sans écran/composant UI, sans provider global obligatoire, sans stockage**. `mobile-react-native` passe de `ANALYTICS_READY` à **`A11Y_READY`**. **Aucune dépendance ajoutée** ; **aucun fichier `cores/api-nestjs`/`web-nextjs`/`ui-kit`/`cloud`/`packages`/root modifié** ; périmètre `src/a11y` + `test/**` + docs. Les **projets dérivés** appliquent les props à leurs composants et branchent un adaptateur réel.
  - **État (`src/a11y/state.ts`, agnostique)** : `A11yRole` (sous-ensemble RN curé) ; **`A11yState`** = **quartet ADR-010 §16** (`disabled`/`focused`/`pressed`/`invalid`) + RN `accessibilityState` (`selected`/`checked`/`busy`/`expanded`) ; `isInteractiveRole`, `mergeA11yState`, `describeA11yStateForLog` (booléens/enum seulement).
  - **Props (`src/a11y/props.ts`, agnostique)** : `normalizeA11yText` (trim/collapse/**borne**), **`buildAccessibilityState`** (sous-ensemble RN natif, drop `focused`/`pressed`/`invalid`), **`buildA11yProps`** (props RN-compatibles `accessible`/`accessibilityRole`/`accessibilityLabel`/`accessibilityHint`/`accessibilityState`). **Ne rend rien, n'importe pas React/RN, ne logge pas** (labels = contenu utilisateur).
  - **Annonce (`src/a11y/announcement.ts`)** : `A11yAnnouncement` `{message, assertive}` **borné** ; `sanitizeAnnouncement` (sans throw) ; le message est **prononcé** (non redacté) mais **jamais loggé** → **`describeAnnouncementForLog`** = `{length, assertive}` (sans texte).
  - **Adaptateur + placeholder + service** : `A11yAdapter` (`announce`/`focus?`/`isScreenReaderEnabled?`, `A11yFocusTarget {id}`) + **`A11yAdapterError`** contrôlé (seulement `operation`) ; `createPlaceholderA11yAdapter` (mémoire, no native dep) ; **`createA11yService`** (best-effort **non-intrusif** — ne casse jamais le flux app, `isScreenReaderEnabled` **défaut `false`** en erreur, **logs RN 8 sûrs** `{length,assertive}`/`{operation}` — jamais le texte brut).
  - **Sécurité (07_SECURITY / ADR-010 §16)** : **aucun contenu/label/message utilisateur en log** ; **aucun stockage** ; **aucune dépendance** ; **aucun provider global obligatoire**. Aligné forms accessibles (RN 3) + UI Kit (ADR-008/010).
  - **Tests** : **+21** `node --test` — `a11y-props-state` (normalisation, rôle interactif, **merge d'états**, `buildAccessibilityState`, `buildA11yProps`, `describeA11yStateForLog` sans contenu) + `a11y-announcement` (sanitize borné, **`describeAnnouncementForLog` sans texte**) + `a11y-engine` (announce/focus/isScreenReaderEnabled, **erreurs adapter contrôlées — pas de throw**, **logger ne reçoit jamais le texte brut**, `A11yAdapterError`) → **196 tests**. Module **entièrement agnostique** (aucun hook/provider → rien en typecheck-only).
  - **Vérifications** (locales) : **`tsc --noEmit`** ✅ ; **`expo lint`** ✅ (0) ; **`npm test` 196/196** ✅ ; **`expo-doctor` 19/19** ✅ ; **`git diff --check`** ✅ (RN 14 n'ajoute aucune dépendance).
  - **Docs** : `README.md` + `ARCHITECTURE.md` §23 ; checkpoint `docs/project-status/` synchronisé ; **`DECISIONS_REGISTER` : ADR-010 reste `PARTIELLEMENT_IMPLEMENTE`** (note de couverture a11y ajoutée, **aucun changement de statut**). **Prochaine mission recommandée (unique) : Mobile Core React Native 15 — app lifecycle / état d'application primitives génériques.** Commit `feat(mobile): add generic accessibility primitives`.

### Mobile Core React Native 13 — analytics / télémétrie primitives génériques (avec redaction, sans SDK réel)

- **Mobile Core React Native 13** (`cores/mobile-react-native/`) : **couche générique d'analytics/télémétrie** au-dessus du logger/redaction RN 8, **sans SDK réel** (Sentry/Amplitude/GA/Segment/Firebase/OTel), **sans réseau, sans persistance, sans identité utilisateur réelle, sans logique métier, sans UI**. `mobile-react-native` passe de `LINKING_READY` à **`ANALYTICS_READY`**. **Aucune dépendance ajoutée** ; **aucun fichier `cores/api-nestjs`/`web-nextjs`/`ui-kit`/`cloud`/`packages`/root modifié** ; périmètre `src/analytics` + `test/**` + docs. Le branchement d'un SDK réel relève d'un **ADR/validation** côté projet dérivé.
  - **Modèle + redaction (`src/analytics/event.ts`, agnostique)** : `AnalyticsEvent` `{name, properties?, timestamp?}` ; properties **bornées aux primitives**. **Redaction dédiée mais BASÉE sur RN 8** (pas de contournement) : `isSensitiveProperty` **réutilise `isSensitiveKey` (RN 8)** + couche normalisée exact/substring (même durcissement que le filtre de liens RN 12) ; **`sanitizeAnalyticsEvent`** (jamais de throw) **supprime les clés sensibles** (token/secret/signature/credential/password/authorization/apiKey/auth/jwt/otp/key/code/sig/email/phone/…), **scrube les valeurs string via `redactString` (RN 8)** et **borne** count/longueur. `describeAnalyticsEventForLog` → **`{eventName, propertyCount}`** (jamais de valeur).
  - **Adaptateur (`src/analytics/adapter.ts`)** : `AnalyticsAdapter` — `track(event)` (déjà assaini), `flush?()`. **PAS de `identify`** *par design* (pas d'identifiant utilisateur réel dans la fondation).
  - **Service (`src/analytics/engine.ts`, agnostique)** : `createAnalyticsService({adapter, logger?})` → `track(name, properties?)` assaini avant l'adapter ; **best-effort / non-intrusif** (un adapter qui échoue **ne casse jamais** le flux app : erreur capturée + `warn` **sûr** sans cause sensible) ; **logs RN 8 sûrs** `{eventName, propertyCount}` (jamais les valeurs) ; `flush()` best-effort. **Aucun `Date.now()`**.
  - **Placeholder (`src/analytics/placeholder-adapter.ts`)** : `createPlaceholderAnalyticsAdapter` — **buffer mémoire pour tests** (`getEvents`/`clear`), **aucun SDK/réseau/persistance**.
  - **Sécurité (ADR-015/040)** : aucun SDK/réseau/persistance ; **aucun identifiant utilisateur réel** ; **aucun token/device token/cookie/`Authorization`/URL signée/URI device** ne survit ; **aucun contournement** de la redaction RN 8.
  - **Tests** : **+16** `node --test` — `analytics-event` (`isSensitiveProperty`, bornage, **clés sensibles supprimées**, **valeurs scrubbées (RN 8)**, **valeur longue tronquée**, **sans throw**, `describeAnalyticsEventForLog` sans valeur) + `analytics-engine` (événement assaini dans l'adapter, **l'adapter ne reçoit jamais de valeur sensible**, **erreur adapter contrôlée — track ne throw pas**, **logger ne reçoit que `{eventName,propertyCount}`**, `flush` délégué/no-op/échec contrôlé, **sans throw**) → **175 tests**. Module **entièrement agnostique** (aucun hook → rien en typecheck-only).
  - **Vérifications** (locales) : **`tsc --noEmit`** ✅ ; **`expo lint`** ✅ (0) ; **`npm test` 175/175** ✅ ; **`expo-doctor` 19/19** ✅ (RN 13 n'ajoute aucune dépendance).
  - **Docs** : `README.md` + `ARCHITECTURE.md` §22 ; checkpoint `docs/project-status/` synchronisé. **Prochaine mission recommandée (unique) : Mobile Core React Native 14 — accessibilité (a11y) primitives génériques.** Commit `feat(mobile): add generic analytics telemetry primitives`.

### Mobile Core React Native 12 — deep-linking / routing primitives génériques

- **Mobile Core React Native 12** (`cores/mobile-react-native/`) : **couche pure de résolution de liens/deep-links vers routes internes validées**, **sans dépendance native, sans logique métier, sans UI, sans schéma métier**. `mobile-react-native` passe de `I18N_READY` à **`LINKING_READY`**. **Aucune dépendance ajoutée** ; **aucun fichier `cores/api-nestjs`/`web-nextjs`/`ui-kit`/`cloud`/`packages`/root modifié** ; périmètre `src/linking` + `test/**` + docs. Prépare le **tap de notification (RN 10)** ; **les projets dérivés définissent leurs routes concrètes**.
  - **Parseur pur (`src/linking/url.ts`, agnostique)** : `parseDeepLink` → `{scheme,host,path,query,fragment}` — gère **custom schemes** (`myapp://home/details?id=1`) **et** `https` universal links, **sans** le `URL` global (déterministe) ; `decodeSafe` (`decodeURIComponent` **sans throw**), `normalizeUrl` (trim + scheme/host minuscule). **Ne parse que** — ne suit/logge/stocke jamais.
  - **Résolution (`src/linking/resolve.ts`, agnostique)** : `LinkResolution` = **`internal`** (route sûre) / **`externalBlocked`** (`external_scheme`/`external_host`/`insecure_scheme`/`open_redirect`) / **`invalid`** (`empty`/`unparseable`/`unsafe_path`). `LinkingConfig` : **allowlist** `schemes` (custom + `https`) + `hosts`, `sensitiveParams`, bornes. **Sécurité (07_SECURITY §7/§8)** : allowlist stricte (**`http` → `insecure_scheme`**) ; **anti-open-redirect** (route encodant `//authority` ou `scheme://` → bloquée ; traversal `..`/`.` → `unsafe_path`) ; **params sensibles supprimés** (token/secret/code/signature/key/jwt/otp/… + config) — jamais conservés, aucune URL complète gardée ; **bornes** count/longueur ; `isInternalRoute`.
  - **Intégration notification** : `resolveNotificationLink(data, config, options?)` lit une **clé configurable** (défaut `link`) du `data` (RN 10), **sans supposition métier** ; absente/non-string → `invalid`.
  - **Gouvernance** : **aucun log** (donc aucune query sensible loggée), **aucun stockage** de lien/token/URL, **aucune dépendance** (parseur maison) ; la navigation réelle appartient au projet dérivé.
  - **Tests** : **+15** `node --test` — `linking-url` (decodeSafe **sans throw**, parseDeepLink custom/https/relatif/invalide, normalizeUrl) + `linking-resolve` (custom valide, universal valide, **host externe bloqué**, **http bloqué**, **open-redirect** `//`/`scheme://`/`..` bloqué/rejeté, **params sensibles retirés**, **bornes**, **input invalide sans throw**, `resolveNotificationLink`) → **159 tests**. Module **entièrement agnostique** (aucun hook → rien en typecheck-only).
  - **Vérifications** (locales) : **`tsc --noEmit`** ✅ ; **`expo lint`** ✅ (0) ; **`npm test` 159/159** ✅ ; **`expo-doctor` 19/19** ✅ (RN 12 n'ajoute aucune dépendance).
  - **Docs** : `README.md` + `ARCHITECTURE.md` §21 ; checkpoint `docs/project-status/` synchronisé. **Prochaine mission recommandée (unique) : Mobile Core React Native 13 — analytics / télémétrie primitives génériques (avec redaction, sans SDK réel).** Commit `feat(mobile): add generic deep-linking routing primitives`.

### Mobile Core React Native 11 — i18n / localisation primitives génériques

- **Mobile Core React Native 11** (`cores/mobile-react-native/`) : **primitives i18n/localisation génériques**, testables, **sans contenu métier, sans dépendance native, sans appel réseau, sans persistance de locale, sans UI**. `mobile-react-native` passe de `NOTIFICATIONS_READY` à **`I18N_READY`**. **Aucune dépendance ajoutée** (tout via `Intl` built-in) ; **aucun fichier `cores/api-nestjs`/`web-nextjs`/`ui-kit`/`cloud`/`packages`/root modifié** ; périmètre `src/i18n` + `test/**` + docs. Les **projets dérivés apportent leurs catalogues métier**.
  - **Modèle de locale (`src/i18n/locale.ts`, agnostique)** : `LocaleCode`/`LocaleDirection`/`DEFAULT_LOCALE` ; `normalizeLocale` canonicalise casse/séparateurs (`_`→`-`) via **`Intl.getCanonicalLocales`** (`EN_us`→`en-US`, `zh_hant_tw`→`zh-Hant-TW`) → invalide → **fallback** (jamais de throw) ; `getLanguageSubtag`, `getLocaleDirection` (RTL ar/he/fa/ur…), `resolveLocale` (exact → langue seule → fallback → premier dispo).
  - **Catalogue typé (`src/i18n/catalog.ts`)** : `MessageCatalog` (map plate) ; `interpolate` (`{name}`, placeholder inconnu **laissé tel quel**) ; `createTranslator` → `t`/`has`/`plural` : clé absente → fallback catalogue → `onMissing` → la clé (**jamais de throw**) ; `plural` via **`Intl.PluralRules`** (CLDR, `{count}`, repli `.other`).
  - **Formatters `Intl` (`src/i18n/format.ts`)** : `formatNumber`/`formatDate`/`formatCurrency` — **ne lèvent jamais** (repli sûr) ; **pas de devise métier par défaut** (`formatCurrency` exige le code ISO-4217) ; valeurs passées en argument (pas de `Date.now()`).
  - **Adaptateur + placeholder + service** : `LocaleAdapter` (seam Expo : `getLocale`/`subscribe?`) ; `createPlaceholderLocaleAdapter` (**mémoire, no native dep, no persistence** ; `setLocale` normalise + notifie) ; `createLocalization({adapter, catalogs, fallbackLocale?})` résout la locale active (clés normalisées), borne un `Translator` et **pré-lie** les formatters ; expose `locale`/`direction`/`t`/`plural`/`formatDate`/`formatNumber`/`formatCurrency`.
  - **Sécurité / gouvernance (08_STANDARDS / 06_DEPENDENCY)** : **aucune dépendance** (Intl built-in, pas de framework i18n lourd) ; aucun réseau ; aucune persistance ; aucune donnée sensible ; catalogues métier = projets dérivés.
  - **Tests** : **+22** `node --test` — `i18n-locale` (normalisation/fallback/direction/résolution) + `i18n-catalog` (interpolation, clé inconnue **sans throw**, fallback, pluralisation en/fr) + `i18n-format` (number/currency/date déterministes UTC, **no-throw**) + `i18n-engine` (résolution, fallback, match langue, formatters liés, `subscribe`) → **144 tests**. Module **entièrement agnostique** (aucun hook → rien en typecheck-only).
  - **Vérifications** (locales) : **`tsc --noEmit`** ✅ ; **`expo lint`** ✅ (0) ; **`npm test` 144/144** ✅ ; **`expo-doctor` 19/19** ✅ (RN 11 n'ajoute aucune dépendance).
  - **Docs** : `README.md` + `ARCHITECTURE.md` §20 ; checkpoint `docs/project-status/` synchronisé. **Prochaine mission recommandée (unique) : Mobile Core React Native 12 — deep-linking / routing primitives génériques.** Commit `feat(mobile): add generic i18n localization primitives`.

### Mobile Core React Native 10 — notifications client (primitives locales génériques, sans push réel)

- **Mobile Core React Native 10** (`cores/mobile-react-native/`) : **couche générique de primitives de notifications locales** au-dessus du modèle permissions RN 9, **sans push réel, sans Expo Notifications réel, sans backend, sans token device, sans logique métier, sans UI**. `mobile-react-native` passe de `PERMISSIONS_READY` à **`NOTIFICATIONS_READY`**. **Aucune dépendance ajoutée** ; **aucun fichier `cores/api-nestjs`/`web-nextjs`/`ui-kit`/`cloud`/`packages`/root modifié** ; périmètre `src/notifications` + `test/**` + docs.
  - **Message sûr (`src/notifications/message.ts`, agnostique)** : `NotificationMessage` `{title,body,data?}` **borné** (`MAX_TITLE_LENGTH`/`MAX_BODY_LENGTH`/`MAX_DATA_KEYS`/`MAX_DATA_VALUE_LENGTH`) ; `sanitizeNotificationMessage` trim+cap title/body et ne garde dans `data` que des **primitives** (objets/arrays/fonctions droppés). **Sécurité (07_SECURITY §13 / ADR-040)** : title/body/data = **contenu** (PII possible) → **jamais loggés** ; `describeNotificationForLog` → **métadonnées seules** (`{titleLength,bodyLength,dataKeyCount}`). **Aucun push/device token** dans un message.
  - **Modèle (`src/notifications/types.ts`)** : `NotificationDeliveryState` (`scheduled`/`delivered`/`cancelled`/`failed`/`unknown`) + gardes ; **trigger borné** `NotificationTrigger` (`immediate`/`delay{seconds≥0}`/`date{timestamp}`) + `normalizeTrigger` ; `NotificationAdapter` (seam Expo : `getPermissionStatus`/`requestPermission`/`scheduleLocal`/`cancel`/`cancelAll`/`getDelivered?`).
  - **Service (`src/notifications/engine.ts`, agnostique)** : `createNotificationService({adapter, permissionService?, logger?})` — **réutilise RN 9** (pilote un `PermissionService` pour le kind `notifications`, injecté ou construit depuis l'adapter). **`schedule`** : `ensure('notifications')` → **si `!isPermissionUsable` → `{state:'blocked'}` SANS toucher l'adapter** (jamais de schedule sans permission usable) ; sinon message assaini + trigger normalisé → `scheduleLocal` → `{state:'scheduled', id}`. `cancel`/`cancelAll`/`getDelivered` (no-op `[]` si non supporté). **Logs RN 8 sûrs** (`{id}`/`{status}`/`{state}`/`{count}` — **jamais le contenu**) ; échec adapter → **`NotificationError`** contrôlé (sans cause sensible).
  - **Placeholder (`src/notifications/placeholder-adapter.ts`)** : `createPlaceholderNotificationAdapter` — **simulation mémoire, AUCUNE dépendance native** ; ids = **compteur déterministe** (`local-1`/`local-2`…) ; jamais persisté.
  - **Sécurité (ADR-015/040)** : **aucun stockage** (ni SecureStore/Zustand/Query) ; **aucun token device/push/FCM/APNs** ; **aucun contenu** de notification dans les logs ; permission notifications **gouvernée par RN 9**.
  - **Tests** : **+16** `node --test` — `notification-message` (bornage title/body/data, garde, `describeNotificationForLog` **sans contenu**, `normalizeTrigger`) + `notification-engine` (**permission refusée → pas de schedule**, granted/limited/unknown→request → schedule, `cancel`/`cancelAll`, **erreur adapter → `NotificationError` sans cause brute**, `getDelivered` no-op, **aucune donnée sensible loggée**) → **122 tests**. Module **entièrement agnostique** (aucun hook → rien en typecheck-only).
  - **Vérifications** (locales) : **`tsc --noEmit`** ✅ ; **`expo lint`** ✅ (0) ; **`npm test` 122/122** ✅ ; **`expo-doctor` 19/19** ✅ (RN 10 n'ajoute aucune dépendance).
  - **Docs** : `README.md` + `ARCHITECTURE.md` §19 ; checkpoint `docs/project-status/` synchronisé. **Prochaine mission recommandée (unique) : Mobile Core React Native 11 — i18n / localisation primitives génériques.** Commit `feat(mobile): add generic local notification primitives`.

### Mobile Core React Native 9 — permissions natives génériques gouvernées

- **Mobile Core React Native 9** (`cores/mobile-react-native/`) : **abstraction générique, testable et gouvernée** des permissions runtime mobiles, **sans logique métier, sans écran/picker, sans notification push réelle, sans upload réel**. `mobile-react-native` passe de `OBSERVABILITY_READY` à **`PERMISSIONS_READY`**. **Aucune dépendance ajoutée** ; **aucun fichier `cores/api-nestjs`/`web-nextjs`/`ui-kit`/`cloud`/`packages`/root modifié** ; périmètre `src/permissions` + `test/**` + docs.
  - **Modèle pur (`src/permissions/status.ts`, agnostique)** : `PermissionKind` (`camera`/`mediaLibrary`/`notifications`/`locationForeground`) + **`PermissionStatus`** (`unknown`/`granted`/`denied`/`blocked`/`limited`/`unavailable`). `normalizePermissionStatus(value)` replie chaînes (`granted`/`undetermined`/`never_ask_again`/`restricted`…), booléens et objets Expo `{status,granted,canAskAgain}` (`canAskAgain:false`⇒`blocked`) en **un seul** enum ; **conservateur** (inconnu → `unknown`, jamais `granted`). Helpers purs : `canRequestPermission`, `isPermissionGranted` (strict), `isPermissionUsable` (granted/limited), `shouldOpenSettings`, `isPermissionStatus`.
  - **Adaptateur (`src/permissions/adapter.ts`)** : `PermissionAdapter` (seam Expo : `getStatus`/`request`/`openSettings?`). La fondation livre **le contrat** + un placeholder ; le projet dérivé branche l'adaptateur réel.
  - **Service (`src/permissions/engine.ts`, agnostique)** : `createPermissionService({adapter, logger?})` → `getStatus` (**live, jamais caché**), `request`, **`ensure`** (prompt **uniquement** si grantable et pas déjà accordé), `openSettings`. **Statut jamais persisté** (ni SecureStore/Zustand/Query — ADR-015). **Logs via le logger RN 8** avec **champs sûrs uniquement** (`{kind,status}` enums) — redaction RN 8 **non contournée**. Échec adaptateur → **warn `{kind}` + `PermissionAdapterError`** contrôlé (porte seulement `kind`/`operation`, **aucune cause sensible**) ; jamais de faux `granted`.
  - **Placeholder (`src/permissions/placeholder-adapter.ts`)** : `createPlaceholderPermissionAdapter` — **simulation mémoire, AUCUNE dépendance native** ; `request` via `onRequest` (défaut : accorde sauf `blocked`/`unavailable`) ; `openSettings` no-op documenté.
  - **Hook React (`src/permissions/use-permission.ts`, typecheck-only)** : `usePermission(kind, adapter, options?)` → `{status, loading, error}` + `request`/`refresh`/`openSettings`. **Aucune UI** ; statut live en state composant (jamais persisté) ; garde de démontage.
  - **Sécurité (07_SECURITY §6 / ADR-015)** : une permission device est une **capacité locale**, **pas** une barrière de sécurité → **API Core = autorité** ; aucun stockage de permission ; aucun log de donnée sensible.
  - **Tests** : **+17** `node --test` — `permission-status` (normalisation chaînes/objets/booléens, idempotence, conservatisme, helpers) + `permission-engine` (lecture, request **accordé/refusé**, `ensure`, `blocked`/`unavailable` sans prompt, **erreur adaptateur → `PermissionAdapterError` sans cause brute**, `openSettings` supporté/non, **aucune donnée sensible loggée**) → **106 tests**. Le hook (React) est **typecheck** seulement.
  - **Vérifications** (locales) : **`tsc --noEmit`** ✅ ; **`expo lint`** ✅ (0) ; **`npm test` 106/106** ✅ ; **`expo-doctor` 19/19** ✅ (RN 9 n'ajoute aucune dépendance).
  - **Docs** : `README.md` + `ARCHITECTURE.md` §18 ; checkpoint `docs/project-status/` synchronisé. **Prochaine mission recommandée (unique) : Mobile Core React Native 10 — notifications client (cadrage + primitives génériques, sans push réel).** Commit `feat(mobile): add generic governed runtime permissions`.

### Mobile Core React Native 8 — logger / observabilité client (avec redaction)

- **Mobile Core React Native 8** (`cores/mobile-react-native/`) : **couche de logging/observabilité générique** avec **redaction stricte**, **sans endpoint métier, sans backend d'observabilité, sans transport réseau ni persistance**. `mobile-react-native` passe de `UPLOAD_READY` à **`OBSERVABILITY_READY`**. **Aucune dépendance ajoutée** ; **aucun fichier `cores/api-nestjs`/`web-nextjs`/`ui-kit`/`cloud`/`packages`/root modifié** ; périmètre `src/logger` + `src/upload/file.ts` (correctif `describeFileForLog`) + `test/**` + docs.
  - **Redaction centrale (`src/logger/redaction.ts`, agnostique)** : l'**unique** endroit qui décide de la sensibilité (ADR-040 §17). `redactValue` masque récursivement (gardes **profondeur** + **cycle**, sans mutation) les **clés sensibles** (`isSensitiveKey`, normalisées → `access_token`/`Access-Token`/`accessToken` matchent, `author`/`monkey` non) : `authorization`, `cookie`, `password`, `otp`, `token`/`accessToken`/`refreshToken`/`jwt`, `secret`/`apiKey`/`accessKey`/`secretKey`, `signedUrl`/`signature`/`credential`, `email`/`phone`, données bancaires. `redactString` masque dans le **texte libre** : **chemins device** (`file://`/`content://`/`ph://` — schéma conservé), **`Bearer`/`Basic`**, **JWT**, **params d'URL signée** (`X-Amz-Signature`/`Credential`, `token`, `sig`…), **emails**. `Error` → `{ name, message }` redacté **sans `stack`**. Marqueur `[Redacted]`.
  - **Logger (`src/logger/logger.ts`, agnostique)** : `createLogger` → `debug`/`info`/`warn`/`error`. **Toute** sortie (message **et** champs) est redactée **avant** le sink → un token ne fuit pas, **même via un sink custom**. **Niveaux** (`isLevelEnabled`, défaut `info`), **sink pluggable** (défaut `consoleSink` — `console` = sink plateforme, **pas** un transport réseau), **horloge injectée** (jamais `Date.now()` dans le chemin testé), **corrélation** `child(context, fields?)` / `withRequestId(id)` (ADR-040 §14). **Aucun log automatique de body** (ADR-040 §18).
  - **Pont erreurs (`src/logger/error-fields.ts`)** : `safeErrorFields(queryError)` → `{ kind, status, errorCode, requestId }` (corrélation conservée, **message/payload droppés** ; import **type-only** de `QueryError` → `src/query` **non modifié**).
  - **Correctif `describeFileForLog` (RN 7 → RN 8, `src/upload/file.ts`)** : ne renvoie **plus le nom brut** (PII potentielle, ADR-040 §18/§22). `SafeFileDescriptor` = `{ type, extension }` — MIME + extension assainie (`[a-z0-9]{1,12}`, sinon `null`) ; **jamais** l'`uri` ni le `name`. *(Seule modification autorisée de `file.ts` ; test `upload-file` adapté.)*
  - **Non fourni (mission / ADR-040 §24)** : aucune persistance, aucun transport réseau, aucun service externe (Sentry/Datadog/Loki), aucun log de body ; le `console.warn` de `src/storage` n'est **pas** recâblé (hors périmètre) → **aucun changement de comportement**.
  - **Tests** : **+18** `node --test` — `logger-redaction` (clés/casse, cycles, `Error` sans stack, Bearer/Basic/JWT/device-uri/URL signée/email, profondeur) + `logger` (niveaux, horloge injectée, redaction au logger, `child`/`withRequestId`, `safeErrorFields`) → **89 tests**. Module **entièrement** agnostique (rien en typecheck-only).
  - **Vérifications** (locales) : **`tsc --noEmit`** ✅ ; **`expo lint`** ✅ (0) ; **`npm test` 89/89** ✅ ; **`expo-doctor` 19/19** ✅ (RN 8 n'ajoute aucune dépendance).
  - **Docs** : `README.md` + `ARCHITECTURE.md` §17 ; checkpoint `docs/project-status/` synchronisé. **Prochaine mission recommandée (unique) : Mobile Core React Native 9 — permissions natives génériques (gouvernées).** Commit `feat(mobile): add client logger with central redaction`.

### Mobile Core React Native 7 — primitives d'upload sécurisé multipart

- **Mobile Core React Native 7** (`cores/mobile-react-native/`) : **primitives d'upload sécurisé** au-dessus du client officiel et des couches auth/server-state, **sans endpoint métier, sans écran, sans logique applicative**. `mobile-react-native` passe de `LOCAL_STATE_READY` à **`UPLOAD_READY`**. **Aucune dépendance ajoutée** ; **aucun fichier `cores/api-nestjs`/`web-nextjs`/`ui-kit`/`cloud`/`packages`/root modifié** ; périmètre `src/query` + `src/upload` + `test/**` + docs.
  - **Descripteur RN (`src/upload/file.ts`, agnostique)** : `MobileFile` `{uri,name,type}` (défini localement, **structurellement assignable** au `ReactNativeFileDescriptor` du package → passable tel quel à `apiClient.files.upload`). Helpers **purs** : `isMobileFile`, **`describeFileForLog`** (descripteur sûr `{name,type}` — **jamais l'`uri`**, chemin device potentiel), `isAllowedFileType` (**pré-check UX** exact/`image/*`/`*/*` ; **backend autoritaire**, ADR-007).
  - **Mutation (`src/upload/use-upload.ts`)** : `useUploadMutation` via **`useAuthedMutation`** → `apiClient.files.upload(file, category, { subjectId, retryOnAuthRefresh: false })` → POST `multipart/form-data` vers **`POST /files`** (endpoint **fondation**, pas métier ; boundary posé par la runtime, ADR-016 §26). **Refresh 401 possédé par l'AuthEngine** (`authedRequest`) ; le client ne refresh pas (`enableRefresh:false`) ; le **`FormData` est reconstruit depuis `file`** au retry (jamais de flux consommé). Mutations sans retry TanStack.
  - **Sécurité (ADR-007/015)** : c'est une **mutation** → **aucune clé de cache**, résultat **transient** ; **aucun fichier/URL signée/token/header `Authorization`** en query key, cache durable, log ou store local ; l'upload renvoie **uniquement les métadonnées publiques** (`PublicStoredFileDto`, sans URL signée ni champ interne) ; validation **taille/MIME/permissions = backend**. `toQueryError` **étendu** : **413** « trop volumineux » / **415** « type non supporté ».
  - **Réserve RN 6 clarifiée** : le store UI **n'est PAS** réinitialisé au logout (aucune donnée sensible → pas de fuite) ; `useUiStore.reset()` reste **exposé** ; câbler `signOut → reset()` vivrait dans `AuthProvider` (`src/auth`, hors périmètre RN 7) → **non câblé, aucun changement de comportement**.
  - **Tests** : **+4** `node --test` — `upload-file` (`isMobileFile`, `describeFileForLog` **sans fuite d'`uri`**, `isAllowedFileType`) + `query-errors` 413/415 → **71 tests**. Le hook (React/TanStack/ESM) est **typecheck** seulement.
  - **Vérifications** (locales) : **`tsc --noEmit`** ✅ ; **`expo lint`** ✅ (0) ; **`npm test` 71/71** ✅ ; **`expo-doctor`** : checks locaux verts (checks réseau Expo/RN-Directory flappent dans l'env ; **RN 7 n'ajoute aucune dépendance**).
  - **Docs** : `README.md` + `ARCHITECTURE.md` §16 (+ §15 réserve RN 6) ; checkpoint `docs/project-status/` synchronisé. **Prochaine mission recommandée (unique) : Mobile Core React Native 8 — logger/observabilité client (avec redaction).** Commit `feat(mobile): add secure multipart upload primitives`.

### Mobile Core React Native 6 — état local UI (Zustand) + purge logout déterministe

- **Mobile Core React Native 6** (`cores/mobile-react-native/`) : ajoute un **état local UI générique** (séparé du server-state) et **câble le logout** pour purger le cache TanStack Query de façon **déterministe**. `mobile-react-native` passe de `SERVER_STATE_READY` à **`LOCAL_STATE_READY`**. **Aucun fichier `cores/api-nestjs`/`web-nextjs`/`ui-kit`/`cloud`/`packages`/root modifié** ; périmètre `src/auth` + `src/query` + `src/store` + `test/**` + docs.
  - **Zustand (approuvé)** : `Zustand | Mobile RN | Local state | Approved` (strategy 06 ; spec §23/§30). Ajouté à `cores/mobile-react-native` (`^5`, **0 dépendance**), **séparé** du server-state TanStack Query (anti-pattern spec §57 : jamais d'état serveur dans Zustand).
  - **Store (`src/store/`)** : `ui-state.ts` (**pur/agnostique** : modèle + transitions immutables) + `ui-store.ts` (`useUiStore` Zustand). État = **uniquement primitives UI non sensibles** — `themePreference` (`'system'|'light'|'dark'`) + `flags` (`Record<string,boolean>`) + `reset()`. **Sécurité structurelle** : le type n'autorise qu'un enum + des booléens → **aucun token/profil/URL signée/payload serveur** ne PEUT y être stocké (ADR-015). **In-memory, sans persistance** (mission ; ADR-015 §16).
  - **Purge déterministe** : `purgeServerState(queryClient)` devient **`async`** → **`await cancelQueries()` PUIS `clear()`** (les fetchs en vol sont réglés/annulés avant le vidage, ne repeuplent pas le cache).
  - **Câblage `signOut → purge`** : `AuthProvider` purge **dès que la session se termine** (`unauthenticated` via `signOut`, **ou** `expired`/`clearSession` interne) — un seul mécanisme couvre **tous** les chemins de fin de session ; aucune donnée du précédent utilisateur ne survit (ADR-015 §18). **AuthEngine reste INCHANGÉ** (la purge vit dans la couche React).
  - **Tests** : **+8** `node --test` — `ui-state` (transitions immutables, `getFlag` défaut, `reset`) ; `invalidation` (**ordre déterministe** `cancel`→`clear` de `purgeServerState` via un `QueryClient` stub ; `invalidateScope`/`removeScope`) → **67 tests** au total. Le binding Zustand + l'effet `AuthProvider` (React) sont **typecheckés**, hors build Node.
  - **Vérifications** (locales) : **`tsc --noEmit`** ✅ ; **`expo lint`** ✅ (0) ; **`npm test` 67/67** ✅ ; **`expo-doctor`** : checks locaux verts (le check réseau **RN Directory / Expo API** flappe transitoirement dans cet environnement — 19/19 obtenu plus tôt dans la session ; zustand = paquet pur-JS 0-dépendance, non en cause).
  - **Docs** : `README.md` + `ARCHITECTURE.md` §15 ; checkpoint `docs/project-status/` synchronisé. **Prochaine mission recommandée (unique) : Mobile Core React Native 7 — upload sécurisé (multipart)** (câbler les helpers multipart du package). Commit `feat(mobile): add local ui state and deterministic logout purge`.

### Mobile Core React Native 5 — server-state data layer

- **Mobile Core React Native 5 — couche server-state** (`cores/mobile-react-native/`) : couche **générique** au-dessus de **TanStack Query** (ADR-012) et du client officiel, **sans endpoint ni schéma métier**. `mobile-react-native` passe de `API_CLIENT_INTEGRATED` à **`SERVER_STATE_READY`**. **Aucun fichier `cores/api-nestjs`/`web-nextjs`/`ui-kit`/`cloud`/`packages`/root modifié** ; périmètre limité à `src/query/**` + `test/**` + docs.
  - **Query keys** (`src/query/query-keys.ts`, **agnostique**) : `createQueryKeys(scope)` → fabrique **namespacée, typée, stable** (`all`/`lists`/`list(params?)`/`details`/`detail(id)`/`of(...)`). `normalizeParams` (clés triées, `undefined` retiré) garantit la **stabilité** (mêmes params = même clé = cache hit). **Aucun secret dans une clé** (ADR-015).
  - **Appels authentifiés obligatoires via `authedRequest`** : `useAuthedQuery`/`useAuthedMutation` enveloppent le `queryFn`/`mutationFn` dans **`authedRequest`** (pont 401 RN 4B) → `401 → AuthEngine.refreshSession() coalescé → 1 retry → purge`. Les lectures **publiques** utilisent `useQuery` simple.
  - **Retry** : le `QueryClient` **ne retente jamais un `401`** (surface l'`ApiClientError` brut) ; **mutations sans retry** par défaut ; le refresh sur 401 reste **exclusivement l'AuthEngine** (aucune 2ᵉ stratégie).
  - **Normalisation d'erreurs UI** (`src/query/query-errors.ts`, **agnostique**) : `toQueryError(error)` → `{ kind, status, errorCode, requestId, isUnauthorized/Forbidden/NotFound, message }` ; `ApiClientError` lu **structurellement** (sans import ESM) ; **`message` générique et figé** par kind/status — **n'écho jamais** le message brut/`details`/token/header/URL signée (ADR-016 §28 : brancher sur `status`/`errorCode`).
  - **Invalidation / purge** (`src/query/invalidation.ts`) : `invalidateScope`/`removeScope` (par clé de scope) ; **`purgeServerState(queryClient)`** (`cancelQueries` + `clear`) à appeler **au logout** (ADR-015 §18). Le **déclencheur** appartient à `src/auth` (hors périmètre) : intégration `signOut → purgeServerState` documentée comme point d'extension.
  - **Pas de persistance de cache** ; **aucun token/URL signée/donnée sensible** en cache/log.
  - **Tests** : **+12** `node --test` (query-keys : namespacing/stabilité/non-collision ; query-errors : 401/403/404/session-expired/network/timeout/5xx, **non-fuite du message brut**, valeurs non-`ApiClientError`) → **59 tests** au total. Hooks/invalidation (React/TanStack) **typecheckés**, hors build Node.
  - **Vérifications** (locales) : **`tsc --noEmit`** ✅ ; **`expo lint`** ✅ (0) ; **`npm test` 59/59** ✅ ; **`expo-doctor` 19/19** ✅.
  - **Docs** : `README.md` + `ARCHITECTURE.md` §14 (règles 401/retry/cache/invalidation/données sensibles) ; checkpoint `docs/project-status/` synchronisé. **Prochaine mission recommandée (unique) : Mobile Core React Native 6 — état local (Zustand) + câblage `signOut → purgeServerState`.** Commit `feat(mobile): add server-state data layer`.

### API Core — déflaker le test e2e de refresh concurrent (sans changement de comportement)

- **Fix(api) : `auth-refresh.e2e-spec.ts › handles two concurrent refreshes`** rendu **déterministe** (`cores/api-nestjs/`), **sans aucune modification de la logique d'auth/sécurité** (changement **test-only**, 1 fichier). Aucun autre fichier modifié.
  - **Cause** : deux `/auth/refresh` simultanés avec le **même token** sont, au moment du 2ᵉ refresh, **indistinguables** d'une réutilisation côté serveur (état identique : ancien token tourné `ROTATED`, nouveau token actif). Selon l'entrelacement, le perdant lit l'ancien token **encore actif** → **conflit de rotation** (la session gagnante subsiste, **1 active**) ; ou **déjà tourné** → la réutilisation quasi-simultanée déclenche la **révocation fail-closed de la famille** (**0 active**). Les deux issues sont **sûres** ; le test exigeait `1` → **flaky**.
  - **Décision (validée avec l'utilisateur)** : **ne pas affaiblir la détection de réutilisation**. Une fenêtre de grâce temporelle (« reuse leeway ») a été **étudiée puis écartée** : les deux scénarios (double-submit concurrent vs réutilisation séquentielle immédiate) étant **serveur-indistinguables**, elle aurait **affaibli** la détection de réutilisation et **cassé** le test (correct) `… and detects reuse`.
  - **Correctif** : le test concurrent assouplit son assertion `active === 1` → **`0 ≤ active ≤ 1`** (jamais deux), sans dépendre du timing. `statuses === [200, 401]` reste exigé (déterministe). La **détection de réutilisation séquentielle reste stricte** (révocation de famille + audit `AUTH_REFRESH_REUSE_DETECTED`) — test `… and detects reuse` **inchangé et vert**. Cas concurrent rare en pratique : les bons clients **coalescent** les refresh (cf. `AuthEngine` mobile RN 2).
  - **Vérifications** (locales, PostgreSQL + MinIO jetables) : **`npm run lint`** ✅ ; **`npm test` (unit) 377** ✅ (inchangé) ; **`npm run test:e2e` 12 suites / 101 tests** ✅ ; suite `auth-refresh` rejouée **6×** **déterministe** (concurrent assoupli + reuse strict). Commit `fix(api): make concurrent refresh e2e deterministic`.

### Mobile Core React Native 4B — restore 401 refresh retry with the official client

- **Mobile Core React Native 4B — restauration du `401 → refresh → retry`** (`cores/mobile-react-native/`) : corrige une régression de comportement introduite en RN 4 (le client officiel créé avec `enableRefresh:false` + adaptateur no-op → **plus aucun** `401`→refresh→retry sur les requêtes authentifiées). Statut **inchangé** : **`API_CLIENT_INTEGRATED`**. **Aucun fichier API/Web/UI Kit/Cloud/packages modifié** ; root `package.json` non touché ; aucun endpoint métier.
  - **Pont 401 explicite** (`src/api/with-auth-retry.ts`, **pur/agnostique**) : `withAuthRetry(refresh, request)` — sur `401` (détecté par `isUnauthorizedError` = `error.isUnauthorized`, structurel, **sans import ESM**) → **`AuthEngine.refreshSession()` coalescé** → **1 seul retry** (la requête relit le Bearer rafraîchi) → si le refresh renvoie `null` (session **purgée** → `expired`) le `401` est **surfacé** (pas de boucle, pas de 2ᵉ refresh). `authedRequest(fn)` = version liée à l'AuthEngine (via l'adaptateur).
  - **Une seule stratégie de refresh** : le client reste en **`enableRefresh:false`** (pas de refresh concurrent côté client) ; **l'AuthEngine reste le seul propriétaire** du refresh coalescé. `MobileAuthSessionAdapter` étendu : `bind({ getAccessToken, refreshSession })` expose le refresh coalescé de l'AuthEngine au pont 401 (en plus de l'injection Bearer). Access token **toujours en mémoire** uniquement.
  - **Test restauré** (`test/with-auth-retry.test.ts`, **6 cas** `node --test`) équivalent à l'ancien `401 → refresh → retry` : succès sans 401, 401→refresh→retry, refresh `null`→surface+purge, retry encore 401→pas de boucle, non-401→pas de refresh, détection 401. **47 tests** au total (41 + 6).
  - **Vérifications** (locales) : **`tsc --noEmit`** ✅ ; **`expo lint`** ✅ (0) ; **`npm test` 47/47** ✅ ; **`expo-doctor` 19/19** ✅ *(2 checks réseau Expo API / RN Directory ont flappé transitoirement avant de repasser au vert — non liés à ce correctif)*.
  - **Docs** : `ARCHITECTURE.md` §12 (pont 401) + `README.md` mis à jour. Commit `fix(mobile): restore 401 refresh retry with official client`.

### Mobile Core React Native 4 — official API client integration

- **Mobile Core React Native 4 — intégration réelle de `@enistere/api-client-fetch`** (`cores/mobile-react-native/`) : remplace le transport « seam » local par le **client typé officiel** (`@enistere/api-client-fetch` + `@enistere/api-contracts`, ADR-016), **sans logique métier**. `mobile-react-native` passe de `FORMS_OFFLINE_PRIMITIVES_READY` à **`API_CLIENT_INTEGRATED`**. **Aucun fichier `cores/cloud`/`api-nestjs`/`web-nextjs`/`ui-kit`/`packages` modifié** ; **root `package.json` NON modifié** ; **aucun autre core démarré**.
  - **Consommation = core autonome + packages liés `file:`** (écart **validé avec l'utilisateur**) : le core garde **son lockfile** et **n'entre pas** dans les workspaces racine (ajouter l'arbre Expo SDK 55 au lockfile partagé qui pilote le `npm ci` de toute la CI risquait web/ui-kit/CI, pour zéro bénéfice). `@enistere/api-contracts` + `@enistere/api-client-fetch` liés via `file:../../packages/*` ; **`metro.config.js`** (watchFolders + `unstable_enablePackageExports` + conditions `import`) ; `openapi-fetch` déclaré **directement** (résolution 100 % depuis le core, pas de React dupliqué).
  - **Client (`src/api/index.ts`)** : `createEnistereApiClient({ baseUrl, timeoutMs, session, enableRefresh:false })`. Erreurs typées `ApiClientError` ré-exportées ; `QueryClient` ne retente jamais un `401`.
  - **AuthEngine PRÉSERVÉ** (inchangé) : restore/signIn/signOut/**refresh coalescé**/**expiration proactive**/**401→refresh→retry**. Le refresh reste **possédé par l'AuthEngine** (`enableRefresh:false`).
  - **Seam auth réel** : `MobileAuthSessionAdapter` (pont **lecture seule** → injection Bearer de l'access token **en mémoire**, ADR-015/016 §27 ; le client ne stocke aucun token) + `EnistereAuthApi` (POST `/auth/login` + `/auth/refresh` via `client.raw` typé → mapping pur `toAuthSessionData`, `accessTokenExpiresIn` **secondes** → ms). `PlaceholderAuthApi` conservé en repli. `SignInInput` : `username` → **`email`** (contrat `LoginDto`).
  - **Tests** : **41** `node --test` (retrait des 6 tests de l'ancien transport ; ajout de **token-mapping**). La logique réseau du client (401/refresh/timeout/multipart) est testée **dans son package** (`api-client-fetch` 29). Script `test` : nettoie `build-test` avant `tsc` (évite des tests compilés périmés).
  - **Dépendances** (core) : `@enistere/api-client-fetch` + `@enistere/api-contracts` (`file:`), `openapi-fetch@^0.13.0`, **`babel-preset-expo@~55.0.8`** (référencé par `babel.config.js` mais jamais déclaré — lacune RN 1–3 ; ajouté pour rendre le core **bundle-able**).
  - **Vérifications** (locales) : `npm install` ✅ ; **`tsc --noEmit`** ✅ (types réels) ; **`expo lint`** ✅ (0) ; **`npm test` 41/41** ✅ ; **`expo-doctor` 19/19** ✅ ; **`expo export -p ios`** ✅ (bundle Hermes 2,7 Mo embarquant le client) ; packages liés `api-contracts` **11/11** + `api-client-fetch` **29/29** (inchangés).
  - **Docs** : `README.md` + `ARCHITECTURE.md` (§12 intégration, §13 écarts) ; checkpoint `docs/project-status/` synchronisé. **Prochaine mission recommandée (unique) : Mobile Core React Native 5 — server-state data layer (hooks TanStack Query au-dessus du client).** Commit `feat(mobile): integrate official api-client-fetch`.

### Mobile Core React Native 3 — forms, validation & offline-ready primitives

- **Mobile Core React Native 3 — forms, validation & offline-ready primitives** (`cores/mobile-react-native/`) : ajoute des formulaires génériques, la validation UX et des briques offline préparatoires, **sans logique métier**. `mobile-react-native` passe de `AUTH_SESSION_HARDENED` à **`FORMS_OFFLINE_PRIMITIVES_READY`**. **Aucun fichier `cores/cloud/**`/`api-nestjs/**`/`web-nextjs/**`/`ui-kit/**`/`packages/**` modifié** ; Cloud reste `PAUSE_CONTROLEE`, staging `EXECUTION_LOCALE_CONTROLEE` ; **aucun autre core démarré**.
  - **Formulaires (`src/forms/`)** : primitives **token-driven** `FormField`/`FormLabel`/`FormError`/`TextInputField` (RHF `Controller`, bordure focus/validité, **erreurs accessibles** via live region — spec §45) pilotées par le `ThemeProvider` (ADR-008/010). **Aucun formulaire métier.**
  - **Validation (ADR-003 §18)** : `validateWith` + fabriques génériques (`requiredText`/`emailField`/`minLengthText`/`maxLengthText`/`requiredCheckbox`) au-dessus de **Zod** ; mapping agnostique `zodErrorToFieldErrors`/`getFieldError`/`firstFieldError`/`fieldErrorMessage` → `FieldErrorMap`. **Validation client = UX uniquement ; la validation backend (API Core) reste obligatoire** ; **aucun DTO API recopié**, **aucun schéma métier** (Kivvoo/RFashion/Bailo/…). Resolver RHF↔Zod (`createZodResolver`).
  - **Offline-ready préparatoire (`src/offline/`, ADR-015 §19 / spec §37)** : état réseau **abstrait** (`NetworkStatus`/helpers), enveloppe **`OfflineMutation`** neutre (horloge injectée), **queue mémoire FIFO** (`enqueue`/`dequeue`/`peek`/`clear`/`remove`, `maxSize`). **Sans persistance** (pas de MMKV/AsyncStorage/SQLite), **sans rejeu automatique**, **sans détection de connectivité** (pas de NetInfo), **sans donnée sensible**. Sync réelle = **ADR-029 futur**.
  - **Tests** : **44 tests** `node --test` (21 RN 2 + **23 nouveaux** : validation, form-errors, offline-queue FIFO/vide/clear/payload invalide/maxSize, network-state). Modules agnostiques compilés via `tsconfig.test.json` (les composants RN restent exclus, comme RN 2).
  - **Dépendances** : `react-hook-form@^7`, `zod@^3` (déjà présent transitivement via `@expo/cli`, désormais direct), `@hookform/resolvers@^3`. **Zod 3.x** délibérément (le build de test utilise la résolution node classique, qui n'honore pas la carte `exports`-only de Zod 4). Lockfile : **seuls** `react-hook-form` + `@hookform/resolvers` ajoutés (aucun `@expo/*` touché).
  - **Vérifications** (locales) : `npm install` ✅ ; **`tsc --noEmit`** ✅ ; **`expo lint`** ✅ (0) ; **`npm test` 44/44** ✅ ; **`expo-doctor` 19/19** ✅. *(Note : 9 advisories modérées **préexistantes** dans l'outillage CLI Expo SDK 55 — `@expo/config*`/`metro-config`/`prebuild-config` —, **non introduites** par RN 3 ; hors chemin gated.)*
  - **Dette documentaire corrigée** : **ADR-015** passe `DECIDE_NON_IMPLEMENTE` → **`PARTIELLEMENT_IMPLEMENTE`** (secure storage mobile réel depuis RN 1/2) ; **ADR-010** reflète le ThemeProvider + composants maison + primitives form **réellement** livrés ; **ADR-011/012** notent l'avancement **mobile** (transport `fetch` + 401/refresh seam ; QueryClient/QueryProvider) ; **ADR-003** note la validation client mobile (UX, backend autoritatif). `ROADMAP_ALIGNMENT_REVIEW.md` = **historique post-Cloud** (≠ état courant).
  - **Docs** : `README.md` + `ARCHITECTURE.md` (§10 formulaires, §11 offline, §12 écarts) mis à jour ; checkpoint `docs/project-status/` synchronisé. **Prochaine mission recommandée (unique) : Mobile Core React Native 4 — intégration réelle de `@enistere/api-client-fetch`** (workspace racine + Metro). Commit `feat(mobile): add forms validation and offline-ready primitives`.

### Mobile Core React Native 2 — auth / session hardening

- **Mobile Core React Native 2 — auth/session hardening** (`cores/mobile-react-native/`) : durcit le shell auth de RN 1 sans logique métier. `mobile-react-native` passe de `STARTER_FOUNDATION_INITIEE` à **`AUTH_SESSION_HARDENED`**. **Aucun fichier `cores/cloud/**` modifié** ; Cloud reste `PAUSE_CONTROLEE`, staging `EXECUTION_LOCALE_CONTROLEE` ; **aucun autre core démarré**.
  - **AuthEngine framework-agnostique** (`src/auth/auth-engine.ts`, aucun import React/RN) : machine d'état possédant `restoreSession`/`signIn`/`signOut`/`refreshSession`/`clearSession`. React s'y abonne via `useSyncExternalStore` dans `AuthProvider`. La logique auth devient **unit-testable en isolation**.
  - **Modèle de session** (spec §4.1) : états `loading`/`authenticated`/`unauthenticated`/`refreshing`/`expired` ; snapshot React **sans tokens** (tokens hors arbre de composants/logs). Aucun champ métier.
  - **Secure storage durci** (ADR-015) : `SessionStore` persiste l'enveloppe `{ refreshToken, expiresAt, user }` en SecureStore avec **validation** du format restauré (fail-soft → `null`) ; **access token en mémoire** uniquement ; purge complète au logout ; `InMemorySecureStorage` (fallback + fixture de test).
  - **Refresh flow** (ADR-004) : restauration au démarrage → refresh pour re-minter l'access token ; **refresh coalescé** (une seule promesse in-flight, anti double-refresh) ; échec de refresh → `expired` + purge.
  - **Expiration** : proactive (`getAccessToken()` renvoie `null` si expiré, horloge injectable) **et** réactive (401).
  - **API client durci** (ADR-011) : sur `401` → `refreshSession` → **un seul retry** avec le nouveau token ; si le refresh échoue → `401` surfacé + session purgée. Pas de boucle.
  - **Gardes de navigation** : `loading`/`refreshing` → loading state ; `authenticated` → app ; `unauthenticated`/`expired` → public (avis « session expirée »). Aucune route métier.
  - **Seam `@enistere/api-client-fetch`** (ADR-016) : interface `AuthApi` prête pour l'adaptateur réel ; RN 2 livre `PlaceholderAuthApi` (sans backend). **Intégration du package différée** (workspace racine + Metro monorepo hors périmètre — cf. ARCHITECTURE §4).
  - **Tests** : **21 tests** `node --test` (compilés via `tsconfig.test.json`, cœur agnostique uniquement) — auth-engine, session-store, api-client. Couvre restore valide/absente/expirée, signIn ok/ko, signOut purge, refresh ok/ko, coalescing, 401→refresh→retry/purge, timeout, network.
  - **Dépendances** : devDeps `@types/node` (compil tests Node) ; `react-dom@19.2.0` épinglé (résout un conflit de peer SDK 55 : `react-dom@19.2.7` transitif exigeait `react ^19.2.7`).
  - **Vérifications** (locales) : `npm install` ✅ ; **`tsc --noEmit`** ✅ ; **`expo lint`** ✅ (0) ; **`npm test` 21/21** ✅ ; **`expo-doctor` 19/19** ✅.
  - **Docs** : `README.md` + `ARCHITECTURE.md` (§9 hardening) mis à jour ; checkpoint `docs/project-status/` synchronisé. **Prochaine mission recommandée (unique) : Mobile Core React Native 3 — forms, validation and offline-ready primitives.** Commit `feat(mobile): harden auth and session` (via PR).

### Mobile Core React Native 1 — starter foundation (socle générique)

- **Mobile Core React Native 1 — starter foundation** (`cores/mobile-react-native/`) : initialise le **socle mobile générique** Expo / React Native. `mobile-react-native` passe de `SPECIFICATION_DOCUMENTAIRE` à **`STARTER_FOUNDATION_INITIEE`**. **Aucune logique métier**, **un seul core** ; Cloud Core **reste** `PAUSE_CONTROLEE`, staging `EXECUTION_LOCALE_CONTROLEE` ; **aucun autre core démarré**, **aucun fichier Cloud Core relancé**.
  - **Stack** : **Expo SDK 55** (New Architecture par défaut), **Expo Router** (file-based), **React 19.2 / React Native 0.83**, **TypeScript strict**, **TanStack Query 5**, **Expo SecureStore**. Layout **plat** (cohérent `web-nextjs`/`api-nestjs`) ; core **autonome** (hors workspaces racine, comme `api-nestjs`).
  - **Navigation** (spec §16) : stacks `(public)` + `(app)` (protégée), `app/index.tsx` **gate** de redirection selon l'état auth, **garde** de route `(app)/_layout.tsx`, écran `+not-found`, écrans placeholder public/authentifié — **génériques** (pas de seller/buyer/admin/delivery, pas de Kivvoo/RFashion/Bailo).
  - **Shell auth** (ADR-004) : états `loading`/`authenticated`/`unauthenticated` ; `signIn`/`signOut`/`restoreSession` **placeholder, aucun appel backend métier**.
  - **Secure storage** (ADR-015) : interface `SecureStorage` + impl `ExpoSecureStorage` (SecureStore) ; **access token en mémoire**, **refresh token persistant** ; nettoyage au logout (tokens **+ cache TanStack Query**) ; clés génériques (`accessToken`/`refreshToken`/`session`).
  - **API client** (ADR-011) : transport `fetch` générique (base URL configurable, injection `Authorization`, erreurs typées `ApiError`/`NetworkError`/`TimeoutError`, timeout `AbortController`), **aucun endpoint métier** — présenté comme **seam** vers le client officiel `@enistere/api-client-fetch` (ADR-016 ; intégration workspace+Metro **reportée en RN 2**, hors périmètre racine de cette mission). **Pas d'Axios.**
  - **Server state** (ADR-012) : `QueryClient` + `QueryProvider`, défauts mobiles, **aucune query métier**.
  - **Thème / UI** (ADR-008/010) : `ThemeProvider` (light/dark) + **bridge tokens placeholder** mirant la forme `@enistere/ui-kit` (source de vérité) ; primitives maison `Screen`/`Text`/`Button` (pilotées par tokens, états pressed/disabled/loading, cible tactile a11y). **Pas de NativeWind, pas de librairie UI complète.**
  - **États standards** (spec §26) : `LoadingState`/`ErrorState`/`EmptyState`/`OfflineState`/`UnauthorizedState`.
  - **Sécurité** : **aucun secret** (`EXPO_PUBLIC_*` public uniquement, `.env.example` documenté) ; tokens hors logs.
  - **Vérifications** (locales) : `npm install` ✅ (SDK 55) ; **`tsc --noEmit`** ✅ ; **`expo lint`** (eslint-config-expo 55) ✅ ; **`expo-doctor` 19/19** ✅.
  - **Écarts assumés** (cf. `cores/mobile-react-native/ARCHITECTURE.md`) : layout **plat** au lieu du `starter/` du `CORE_SPECIFICATION.md` §8 (aligné convention repo + mission §5) ; **transport seam** local au lieu de `@enistere/api-client-fetch` (périmètre mission + ADR-016 §7) ; **bridge tokens placeholder** au lieu d'import UI Kit (core autonome ; autorisé par la mission). **Différés** (V1 partielle) : Zustand, React Hook Form/Zod, upload, notifications, logger, permissions natives.
  - **Docs** : `README.md` + `ARCHITECTURE.md` (décisions/écarts) ajoutés au core ; checkpoint `docs/project-status/` synchronisé (état, matrice, next actions, handoff). **Prochaine mission recommandée (unique) : Mobile Core React Native 2 — auth/session hardening.** Commit `feat(mobile): scaffold react native starter foundation` (via PR).

### Revue stratégique d'alignement roadmap (post Cloud Core 9)

- **Revue stratégique** (`docs/project-status/ROADMAP_ALIGNMENT_REVIEW.md`) — **aucune fonctionnalité, aucun code modifié.** Bilan d'alignement après la séquence **Cloud Core 1→9**.
  - **Constat** : Cloud Core a livré une **vraie valeur** (CI non-régression, **images GHCR bootables** après le fix CC8, `api-smoke` gate du push, runbooks, **staging local exécuté**) **mais a dépassé l'ordre roadmap** (`strategy/04_ROADMAP_GLOBAL.md` : CI/CD = **V2**, registry/staging = **V3/VF**) **alors que Mobile Core React Native — priorité #2 V1 — n'a jamais été démarré** (zéro code), ses dépendances (API + packages + tokens UI Kit RN-safe) étant **satisfaites**. Le pas suivant Cloud (**CC10 serveur réel**) dépend d'une **ressource externe** (serveur + HTTPS/DNS/pare-feu) → **point d'arrêt raisonnable**.
  - **Décision (une seule)** : **Cloud Core en PAUSE contrôlée** (CC10 reporté) ; **retour aux priorités V1** → **prochaine action unique : Mobile Core React Native 1 — starter foundation** (starter Expo/RN, navigation auth/privé, secure storage ADR-015, `api-client-fetch`, TanStack Query, ThemeProvider ADR-010 ; sans logique métier).
  - **Livrables** : `ROADMAP_ALIGNMENT_REVIEW.md` (objectif originel, matrice par core, bilan Cloud, dérives, décision, handoff) + checkpoint synchronisé (handoff, next actions, état, matrice, décisions). Statuts **inchangés** (aucun gonflé). Commit `docs(project): review roadmap alignment after cloud core` (via PR).

### Exécution staging contrôlée — locale Type D (Cloud Core 9)

- **Cloud Core 9 — exécution staging contrôlée** (`cores/cloud/docs/STAGING_EXECUTION_REPORT.md`) : **exécution réelle des conteneurs** (API + Web + PostgreSQL + MinIO) à partir des **images GHCR corrigées** (`sha-d1e6242`), en environnement **Type D : local, sans exposition publique**. **Aucun serveur distant/SSH/DNS/HTTPS identifié** → mission **requalifiée honnêtement** en exécution **locale** (consigne §6). `.env.staging` **réel hors dépôt** (secrets `openssl` jetables, `chmod 600`, **shred** après). **Aucune production, aucun workflow deploy, aucun secret committé, aucun `latest`, aucune modif code/Dockerfile/workflow.** Cloud Core **reste** `IMPLEMENTATION_PARTIELLE` ; **déploiement staging → `EXECUTION_LOCALE_CONTROLEE`** ; ADR-013/014 **partiels**. **Aucun statut augmenté.**
  - **Validé** : `compose config` valide (**0 `latest`**) ; images corrigées tirées ; **postgres `healthy`** + **minio `Up`** + bucket privé ; **migrations DEPUIS l'image** (Option A, **offline**, 5 appliquées) ; **API & Web `Up (healthy)`** ; `/health/live`+`/health/ready`+`/`+`/login` = **200** ; **endpoint MinIO Option A** (`S3_ENDPOINT` = adresse hôte) **joignable** par le conteneur ET l'hôte (navigateur).
  - ⚠️ **Non validé (limites honnêtes)** : **URL signée bout-en-bout** (l'URL pré-signée par `mc` → **403** côté hôte ; **presign de l'API non exercé**) et **Auth/Files** applicatifs (**aucun utilisateur staging** — seed RBAC nécessite `ts-node`/devDeps + egress npm, indisponibles). `/protected` anonyme = **200 sans `Location`** (redirection App-Router **streaming** documentée, aucune donnée privée).
  - **Sécurité** : staging **technique interne local, NON sécurisé production** (pas d'HTTPS/DNS/pare-feu ; console MinIO locale ; PostgreSQL non publié). **Décision §20** : **arrêt** après validation (`down -v`, volumes + secrets jetables supprimés). **Rollback** documenté (vers tags **post-CC8** uniquement). **Prochaine action : Cloud Core 10 — préparation serveur staging sécurisé** (serveur réel + HTTPS/DNS/pare-feu, puis validation URL signée Option A + Auth/Files **en réel**). Commit `docs(cloud): record controlled staging execution` (via PR).

### Correction image runtime API NestJS + smoke-run CI (Cloud Core 8)

- **Cloud Core 8 — corriger l'image runtime API NestJS** : **corrige** le défaut bloquant découvert en CC7 (image API en crash-loop) et **ferme l'angle mort CI** (l'image était buildée mais **jamais exécutée**). Cloud Core **reste** `IMPLEMENTATION_PARTIELLE` ; ADR-013/014 **partiels** ; **déploiement staging → `DRY_RUN_API_IMAGE_FIXED`**. **Aucun déploiement réel, aucun secret, aucun `latest`, aucune modif de logique métier.**
  - **Cause** : le **query engine** Prisma de `node_modules/.prisma/client` était compilé pour **OpenSSL 1.1.x** (détection `native` ambiguë au stage build, sans `openssl`) alors que la base runtime est **Debian 12 bookworm / OpenSSL 3.0.x** → moteur introuvable → crash-loop, `/health/ready` jamais vert.
  - **Correctif** : `cores/api-nestjs/prisma/schema.prisma` generator `binaryTargets = ["native", "debian-openssl-3.0.x"]` (force l'émission du moteur **3.0.x**, copié depuis `@prisma/engines` **sans réseau**) **+** `cores/api-nestjs/Dockerfile` installe `openssl`/`ca-certificates` **aussi au stage build**. Aucun téléchargement dynamique de Prisma au démarrage ; image toujours **non-root**, **sans `.env`**.
  - **Smoke-run CI** : `.github/workflows/registry-ci.yml` nouveau job **`api-smoke`** — build l'image API, la **lance**, vérifie **sans base** que le **moteur de requête Prisma se charge** (erreur de connexion = OK ; « engine could not be located » = **FAIL**) + non-root + openssl + moteur présent ; le job `images` (**push GHCR**) est désormais **`needs: api-smoke`** ⇒ **publication conditionnée au smoke vert**.
  - **Re-validation réelle** (`cores/cloud/docs/STAGING_DRY_RUN_REPORT.md` §8 ; image publiée + moteur 3.0.x monté = sortie du fix) : **migrations depuis l'image** (`prisma migrate deploy`, **offline**, 5 appliquées) → **stratégie migrations = Option A (depuis l'image)** ; API **`Up (healthy)`** `/health/live` & `/health/ready` **200** ; Web **200** ; **stack staging complète healthy** ; logs sans erreur moteur.
  - **Validation locale réduite justifiée** : `docker build`/`npm ci` **bloqués** par l'egress sandbox (registre npm) → le fix est prouvé par `prisma validate` (OK), le **dry-run réel** ci-dessus et le job **`api-smoke`** (validation automatisée en CI). `cores/web-nextjs/src`/`ui-kit/src`/`packages`/`docs/adr`/`strategy` **non modifiés**. Docs/runbooks/checkpoint synchronisés. **Prochaine action : Cloud Core 9 — exécution staging réelle contrôlée sur serveur.** Commit `fix(api): make docker runtime prisma engine compatible` **mergé via PR #7** (`d1e6242`).
  - **CC8B (post-merge, observation réelle)** : registry CI sur `main` → **`api-smoke` = success** + jobs **`images` (api-nestjs/web-nextjs) « Build and push » = success** ⇒ **images corrigées publiées sur GHCR** (`sha-d1e6242`/`main-d1e6242` pour API **et** Web, **aucun `latest`**). Image API `sha-d1e6242` **vérifiée** : `.prisma/client` contient `libquery_engine-debian-openssl-3.0.x.so.node`, Node v24.16.0, **OpenSSL 3.0.20**, non-root ; **dry-run post-merge** (images GHCR corrigées, **sans overlay**) : migrations depuis l'image (offline), API/Web **`healthy`**, `/health/live`+`/health/ready`+`/` = **200**. Les tags ≤ `sha-7b07e5e` restent cassés (ne pas utiliser). Statuts inchangés ; **déploiement staging `DRY_RUN_API_IMAGE_FIXED`**.

### Préparation serveur staging & dry-run contrôlé (Cloud Core 7)

- **Cloud Core 7 — préparation serveur staging & dry-run contrôlé** (`cores/cloud/docs/STAGING_DRY_RUN_REPORT.md`) : **dry-run local réel** exécuté à partir des **images GHCR immuables** (`sha-7b07e5e`) avec un `.env.staging` **réel généré hors dépôt** (`/tmp`, `chmod 600`, secrets jetables `openssl rand -base64`, **shred** après) — **aucun déploiement réel, aucune production, aucun secret committé, aucun `latest`, aucun workflow deploy automatique**. Type = **D (dry-run local)** (aucun serveur réel identifié). Cloud Core **reste** `IMPLEMENTATION_PARTIELLE` ; ADR-013/014 **partiels** (inchangés) ; **déploiement staging → `DRY_RUN_EXECUTE`** (dry-run exécuté, **défaut bloquant** → exécution réelle BLOQUÉE ; **ni** opérationnel **ni** automatisé). **Aucun statut augmenté.**
  - **Résultats** : ✅ `docker compose config` valide (images résolues au **tag immuable** `sha-7b07e5e`, **aucun `latest`**) ; ✅ images GHCR **tirées en anonyme** (registry public) ; ✅ `postgres healthy` (`pg_isready`) + `minio Up` + **bucket** `enistere-staging-files` créé ; ✅ **image Web boote** (hors compose : **HTTP 200**, Next 16.2.7).
  - ❌ **Défaut BLOQUANT — l'image API ne démarre pas** (crash-loop) : le **query engine** Prisma de `node_modules/.prisma/client` est compilé pour **OpenSSL 1.1.x** (`libquery_engine-debian-openssl-1.1.x.so.node`) alors que la **base runtime de l'image est Debian 12 bookworm / OpenSSL 3.0.x** → moteur introuvable → `/health/ready` jamais vert. **Défaut invisible à la CI** (`api-runtime-ci` exécute l'API **depuis les sources** ; `registry-ci` **construit** l'image mais ne l'**exécute** jamais). Atténuation future : **smoke-run de l'image en CI**.
  - **Corrections documentaires** : `STAGING_DEPLOYMENT_RUNBOOK.md` (l'image **embarque** le CLI Prisma 6.19.3 + `schema-engine-debian-openssl-3.0.x` → « CLI absent » **faux** → **stratégie migrations rouverte** : depuis l'image vs sources ; ajout du pré-requis bloquant) ; **décision MinIO/URL signée tranchée (Option A)** : `S3_ENDPOINT` = adresse **publique** du serveur (jamais `minio:9000`), console 9001 non exposée, `S3_PUBLIC_ENDPOINT` = évolution future hors V1. **Migrate-from-source non exercé** (egress du dry-run bloque `binaries.prisma.sh` — limite d'environnement, pas un défaut du dépôt).
  - **Nettoyage / contrôle secrets** : `compose down -v` + `.env.staging` **shred** ; `git ls-files` → **uniquement `*.example`** (aucun `.env` réel versionné) ; working tree propre. **Aucune modification** de `cores/*/src`/`packages`/`docs/adr`/`strategy` **ni des Dockerfiles/workflows** (l'image n'est **pas** corrigée ici, par périmètre). Docs Cloud + checkpoint mis à jour. **Prochaine action : Cloud Core 8 — corriger l'image runtime API (moteur de requête Prisma)** puis re-dry-run + stratégie migrations. Commit `docs(cloud): prepare staging dry run` (via PR ; push direct `main` refusé par la protection).

### Staging manuel (Cloud Core 6)

- **Cloud Core 6 — déploiement staging manuel** (`cores/cloud/staging/` + runbooks) : **cadrage** d'un déploiement staging **manuel** à partir des images GHCR immuables — **aucune exécution réelle, aucun secret, aucune production, aucun `latest`, aucune automatisation / workflow deploy**. Statut déploiement staging : **`CADRE_MANUEL_DOCUMENTE`** (pas `IMPLEMENTE_AUTOMATISE`). Cloud Core **reste** `IMPLEMENTATION_PARTIELLE` ; ADR-013/014 **partiels** (inchangés).
  - **Compose exemple** `cores/cloud/staging/docker-compose.staging.example.yml` : **api + web + postgres + minio** (réseau interne, healthchecks node/`pg_isready`, **PostgreSQL non exposé**, **MinIO API exposé** pour les URL signées, **migrations hors démarrage**). **Secrets API injectés uniquement dans le conteneur API** (jamais dans le Web) — vérifié. Images par **tag immuable** `${GHCR_*_IMAGE}` (sha-*), **jamais `latest`**.
  - **`.env.staging.example`** : **placeholders `CHANGE_ME`** uniquement (aucune valeur réelle) ; génération `openssl rand -base64 48` ; `.env.staging` **jamais versionné**. **`cores/cloud/staging/README.md`**.
  - **Runbooks** : **`docs/STAGING_DEPLOYMENT_RUNBOOK.md`** (tag immuable, secrets hors dépôt, bucket MinIO privé, **migrations Prisma découplées de l'image** — runtime sans CLI → `npx prisma migrate deploy` depuis les sources au commit déployé —, health checks, données de test éphémères, contrainte **URL signée = hôte `S3_ENDPOINT` joignable navigateur**, **`NEXT_PUBLIC_*` figé au build**, cookies `APP_ENV` HTTP/HTTPS) ; **`docs/STAGING_ROLLBACK_RUNBOOK.md`** (**rollback d'image** simple par tag immuable ; **rollback DB NON garanti** → migrations **additives** ; backup/restore `pg_dump`/`psql`).
  - **Validation** : `docker compose config` **OK** (4 services parsés) ; **aucun secret API fuité dans le conteneur Web** ; `git diff --check` clean. **`cores/*/src`/`packages`/`docs/adr`/`strategy` + Dockerfiles + workflows existants NON modifiés.** Docs Cloud mises à jour (README, baseline §11, `SECRETS_POLICY.md`). Rappel **CC5B validé** : Registry CI verte sur `main`, **images GHCR publiques** `api-nestjs`/`web-nextjs` (tags `main-`/`sha-`, aucun `latest`). **Prochaine action : Cloud Core 7 — exécution réelle staging** (ou dry-run / durcissement registry). Commit `docs(cloud): add manual staging deployment baseline` — **mergé via PR #4** (`b001ce8` sur `main`). **CC6B validé** : checks requis **verts** (CI/api-runtime/web-e2e/registry sur la PR **et** sur `main`), artefacts staging **intégrés à `main`**, `docker compose config` OK, **aucun `.env` réel/secret**, **images GHCR `main-b001ce8`/`sha-b001ce8` publiées** (registry rejoué au merge, **aucun `latest`**).

### Registry GHCR (Cloud Core 5)

- **Cloud Core 5 — Registry GHCR sans déploiement** (`.github/workflows/registry-ci.yml` + Dockerfiles API/Web) : début d'**ADR-014** (registry **uniquement**) — build des images Docker et **push GHCR sur `main`**, **sans déploiement, staging, production, rollback, secret applicatif ni PAT**. Cloud Core **reste** `IMPLEMENTATION_PARTIELLE` ; ADR-014 → **`PARTIELLEMENT_IMPLEMENTE`** ; ADR-013 partiel (niveaux 1–4 partiel).
  - **Dockerfiles** : `cores/api-nestjs/Dockerfile` (contexte `cores/api-nestjs/` — multi-stage : `npm ci` + `prisma generate` + `nest build`, runtime deps-prod + client Prisma copié + openssl, **`USER node`**) ; `cores/web-nextjs/Dockerfile` (contexte **racine** — build des paquets + Web, runtime **Next.js standalone** `node cores/web-nextjs/server.js`, **`USER node`**). `.dockerignore` (API + racine) : **aucun `.env`/secret copié**, node_modules/.next/e2e exclus. `next.config.ts` : ajout **`output: 'standalone'`** + `outputFileTracingRoot` (racine) — **testé**, niveau 1 inchangé (307 tests, typecheck/lint/build verts).
  - **Workflow** (job `images`, matrice api/web) : `permissions: contents: read` + `packages: write` ; **PR → build SANS push** ; **push `main` → login GHCR (`secrets.GITHUB_TOKEN`, pas de PAT) + build + push** ; actions `docker/setup-buildx`/`login`/`metadata`/`build-push` (épinglées majeure). **Images** `ghcr.io/<owner>/<repo>/{api-nestjs,web-nextjs}` (owner/repo = `github.repository`, minuscules). **Tags immuables** (`flavor: latest=false`) : `sha-<short>`, `main-<short>`, `pr-<n>` (build seul) — **`latest` JAMAIS généré** ; **labels OCI** (source/revision/created/title/description).
  - **Sécurité** : exécution **non-root** ; **aucune URL d'API de production figée** ; build args non sensibles ; migrations Prisma **non** exécutées au build (runtime/déploiement futur). **Validation locale** : `docker build` **API OK + Web OK** + smoke (`node --version`, **non-root**, **aucun `.env`** dans l'image) ; non-régression niveau 1 verte + `npm audit` **0 vuln**. **Workflows existants (niveaux 1–3) inchangés.** `cores/*/src`/`packages`/`docs/adr`/`strategy` **non modifiés** (hors `next.config.ts`, config build testée). Docs : `REGISTRY_POLICY.md` (→ partiel), **`GHCR_REGISTRY_GUIDE.md`** (nouveau), `.github/workflows/README.md`, baseline, `cores/cloud/README.md`. **Prochaine action : Cloud Core 6 — déploiement staging manuel** (ou durcissement registry). Commit `ci(cloud): add ghcr registry workflow` — **mergé via PR #1** (`b41a953`), vérification **Cloud Core 5B** mergée via **PR #2** (`bfd33dc`) sous **protection de branche** (flux PR). **Cloud Core 5B VALIDÉ par observation réelle** (repo public → API Actions + `docker manifest inspect` anonyme) : **Registry CI verte sur `main`** (push `b41a953` + `bfd33dc` → build API + build Web + **push GHCR** réussis), **images GHCR publiques** `api-nestjs`/`web-nextjs` présentes (tags `main-b41a953`/`main-bfd33dc`/`sha-bfd33dc`, **aucun `latest`**), checks requis verts sur PR #1/#2 ; **aucun déploiement/secret/PAT ajouté**.

### Gouvernance CI (Cloud Core 4)

- **Cloud Core 4 — durcissement CI & gouvernance de branche** (`cores/cloud/docs/` + `.github/workflows/README.md`) : mission **documentaire** préparant la CI à être **exigée** comme protection de `main`, **sans** déploiement, registry (GHCR), secret, **sans modifier les workflows existants** ni **renommer aucun job**. Cloud Core **reste** `IMPLEMENTATION_PARTIELLE` ; ADR-013 **`PARTIELLEMENT_IMPLEMENTE`** (niveaux 1–3 + protection de branche **documentée non appliquée**) ; ADR-014 **`NON_IMPLEMENTE`**.
  - **7 checks** à rendre **bloquants** sur `main` figés (= `name:` des jobs) : `api-contracts`, `api-client-fetch`, `ui-kit`, `web-nextjs`, `audit` (`ci.yml`) + `api-runtime` (`api-runtime-ci.yml`) + `web-e2e` (`web-e2e-ci.yml`). `GITHUB_BRANCH_PROTECTION_CHECKLIST.md` enrichi : **matrice** des checks (obligatoires-maintenant vs futurs), avertissement « **renommer un job casse l'exigence** », vérifications post-application. **Application = action humaine** (GitHub Settings), **non réalisée**.
  - **Politiques tranchées** (`CLOUD_CORE_V1_EXECUTION_BASELINE.md` §8 bis) : **artefacts** = **aucun upload** (Option A ; traces Playwright `retain-on-failure` locales ; Option B upload-`if:failure()` sans logs/`.state.json`/cookies/URL signée = future) ; **couverture** = **exécutée, non publiée** (UI Kit 100 %, Web ≈ 87,8 % ; aucun Codecov/gate) ; **pinning** = `@v4` conservé (SHA = durcissement futur avec politique de MAJ) ; **`actionlint`** = futur (non installé ; validation = parse YAML + simulations CC2/CC3).
  - **Workflows existants intacts** (`ci.yml`/`api-runtime-ci.yml`/`web-e2e-ci.yml` **non modifiés**). **Validation réduite justifiée** (doc-only) : web `check` (**307** tests) + `npm audit` **0 vuln** + parse YAML des 3 workflows + `git diff --check`. `cores/*/src`/`packages`/`docs/adr`/`strategy` **non modifiés**. **Prochaine action (humaine)** : appliquer la protection de branche `main` ; **prochaine mission : Cloud Core 5 — Registry GHCR sans déploiement**. Commit `docs(cloud): harden ci governance`.

### Outillage / CI E2E navigateur (Cloud Core 3)

- **Cloud Core 3 — CI E2E navigateur (niveau 3)** (`.github/workflows/web-e2e-ci.yml` + `cores/web-nextjs/e2e/`) : implémente le **niveau 3** de la politique CI — workflow démarrant une **stack réelle et éphémère** (PostgreSQL + MinIO + **API NestJS** + **Web Next.js**) et rejouant les **parcours navigateur** critiques avec **Playwright/Chromium** headless, **sans déploiement, registry (GHCR), Dockerfile applicatif, secret GitHub ni environnement protégé**. Cloud Core **reste** `IMPLEMENTATION_PARTIELLE` (trois workflows CI niveaux 1–3) ; ADR-013 **`PARTIELLEMENT_IMPLEMENTE`** (niveaux 1–3) ; ADR-014 **`NON_IMPLEMENTE`**.
  - **Outil** : `@playwright/test` (devDep du **workspace Web**) + Chromium (`playwright install --with-deps chromium`). Pas de Cypress, pas de Storybook. **Isolation niveau 1** : `e2e/` + `playwright.config.ts` **exclus** de `typecheck`/`lint`/`build` (`tsconfig.json`/`eslint.config.mjs`) → niveau 1 **inchangé** (307 tests Web + typecheck/lint/build verts avec e2e présent).
  - **Orchestration** : `npm ci` + build paquets → `e2e:install` → API (autonome : `npm ci`, prisma generate/**migrate:deploy**/seed, build, démarrage + attente `/health/ready`) → **seed utilisateurs éphémères** (`proof-seed-user.ts` → propriétaire + sans-permission via `$GITHUB_ENV`) → build + démarrage Web (`next start`, **`APP_ENV=development`** pour cookies HTTP local) → **`playwright test`**. PostgreSQL en `services:` ; MinIO via `docker run` (contrainte GitHub) + bucket de test. **Fixture** : `e2e/global-setup.ts` téléverse un **fichier VALIDATED** éphémère → `e2e/.state.json` (gitignoré) ; **aucun token/URL signée journalisé**.
  - **Parcours** (`e2e/{health,auth,files}.spec.ts`) : **Health** (accueil + aucune fuite de config/token) ; **Auth** (anonyme `/protected`→`/login` ; identifiants invalides → **erreur générique** sans énumération, reste `/login` ; login valide → `/protected` ; **déconnexion** → re-navigation → `/login`) ; **Files** (métadonnées publiques, titre = nom d'origine, **aucun champ interne** storageKey/bucket/checksum/ownerId, **téléchargement** : `download-url` **200** + requête au stockage ; id inexistant → « Fichier introuvable » ; sans permission → « Accès refusé »).
  - **Sécurité/artefacts** : valeurs de **test jetables** (jamais `secrets.*`, jamais en `.env` versionné), **logs sans secret**, **URL signée jamais journalisée**, données **éphémères** ; traces/captures Playwright **`retain-on-failure`**, **aucun artefact uploadé**. **`ci.yml`/`api-runtime-ci.yml` inchangés.**
  - **Validation** : non-régression niveau 1 **12/12** (e2e présent) + **simulation locale du workflow** (stack réelle + Chromium) → **7 tests Playwright verts**. `npm audit` **0 vuln** (avec `@playwright/test`). `cores/web-nextjs/src`/`ui-kit/src`/`packages`/`docs/adr`/`strategy` **non modifiés**. Docs : `.github/workflows/README.md`, `cores/cloud/docs/WEB_E2E_CI_PLAN.md` (→ implémenté), `CLOUD_CORE_V1_EXECUTION_BASELINE.md`, `cores/cloud/README.md`. **Prochaine action : Cloud Core 4 — durcissement CI & protection de branche** (action humaine). Commit `ci(web): add browser e2e validation workflow`.

### Outillage / CI runtime API (Cloud Core 2)

- **Cloud Core 2 — CI runtime API NestJS (niveau 2)** (`.github/workflows/api-runtime-ci.yml`) : implémente le **niveau 2** de la politique CI cadrée — workflow rejouant l'**API Core NestJS** contre ses dépendances runtime **jetables**, **sans déploiement, registry (GHCR), Dockerfile applicatif, secret GitHub ni environnement protégé**. Cloud Core → **`IMPLEMENTATION_PARTIELLE`** ; ADR-013 **`PARTIELLEMENT_IMPLEMENTE`** (niveaux 1–2) ; ADR-014 **`NON_IMPLEMENTE`**.
  - **Runtime** : `cores/api-nestjs/` est un projet npm **autonome** (lockfile propre, **hors workspaces racine**) → `working-directory: cores/api-nestjs` + **`npm ci`** ; Node 24 ; `permissions: contents: read` ; `concurrency` ; **pas de `pull_request_target`**.
  - **Services jetables** : **PostgreSQL** (`postgres:16`, conteneur `services:`, healthcheck `pg_isready`) ; **MinIO** (`minio/minio` via **`docker run`** — un conteneur `services:` **ne peut pas** porter la commande `server /data` requise — + attente de `…/minio/health/live` + **bucket `enistere-test-files`** créé via `@aws-sdk/client-s3`, l'API ne le créant pas).
  - **Variables = valeurs de test jetables** définies dans le workflow (jamais `secrets.*`, jamais en `.env` versionné ; noms alignés sur `cores/api-nestjs/.env.example` : `DATABASE_URL`, `JWT_*`, `REFRESH_TOKEN_HASH_SECRET`, `ARGON2_*`, `S3_*`, rate limits élargis, `LOG_LEVEL=warn`).
  - **Étapes** (scripts **réels** de `cores/api-nestjs/package.json`, aucun script inventé) : `prisma:generate` → `prisma:validate` → **`prisma:migrate:deploy`** (migrations sur base jetable) → `lint` → **`npm test`** (unitaires) → **`test:e2e`** (PostgreSQL + MinIO réels) → **`openapi:check`** (snapshot canonique non divergent) → `build` (nest build) → `npm audit`. *(Pas de script `typecheck` côté API ; `nest build` couvre la compilation. `prisma:migrate:deploy` existe déjà — aucun `prisma:migrate:ci` ajouté.)* **Aucun artefact uploadé**, **logs sans secret**, données **éphémères**.
  - **`ci.yml` (niveau 1) inchangé.** **Validation** : baseline no-service locale (prisma:generate/validate avec `DATABASE_URL`, lint, build, `npm audit` 0 vuln) + **simulation locale du workflow** (mêmes images `postgres:16`/`minio/minio`, même env, mêmes étapes : bucket → migrate deploy → unit → **e2e** → openapi:check → build → audit) ; **`npm ci` API validé séparément** (exit 0, 802 paquets, 0 vuln). **Non-régression monorepo** (niveau 1) verte. **Aucune** modification de la logique applicative API ; `cores/web-nextjs/src/`/`ui-kit/src/`/`packages/`/`docs/adr/`/`strategy/` **non modifiés**. Docs : `.github/workflows/README.md`, `cores/cloud/docs/API_RUNTIME_CI_PLAN.md` (→ implémenté), `CLOUD_CORE_V1_EXECUTION_BASELINE.md`, `cores/cloud/README.md`. **Prochaine action : Cloud Core 3 — E2E navigateur (niveau 3)** + appliquer la protection de branche `main` (action humaine). Commit `ci(api): add runtime validation workflow`.

### Cadrage / Cloud Core

- **Cloud Core 1 — cadrage minimal d'exécution CI/CD & environnements** (`cores/cloud/`) : transforme la CI minimale en **socle gouverné**, **sans déploiement, Docker, registry (GHCR), secret ni infrastructure réelle**. Cloud Core → **`CADRAGE_OPERATIONNEL`** (cadrage gouverné, **pas** `IMPLEMENTATION_PARTIELLE`). ADR-013 reste **`PARTIELLEMENT_IMPLEMENTE`** ; ADR-014 **`NON_IMPLEMENTE`**.
  - **Documents créés** (`cores/cloud/docs/`) : **`CLOUD_CORE_V1_EXECUTION_BASELINE.md`** (17 sections : objectif, état, environnements, politiques CI/secrets/registry/runtime/E2E/observabilité/rollback, limites V1, étapes) ; **`GITHUB_BRANCH_PROTECTION_CHECKLIST.md`** (application **manuelle** GitHub Settings : PR obligatoire, **5 checks CI bloquants**, force-push/suppression interdits, linear history à décider, CODEOWNERS plus tard) ; **`SECRETS_POLICY.md`** (aucun secret en Git/CI ; **noms futurs sans valeurs** ; jamais en `NEXT_PUBLIC_*` ; GitHub Environments futurs ; procédure d'exposition) ; **`REGISTRY_POLICY.md`** (GHCR cible, tags **immuables** sha court, pas de `latest` prod — ADR-014 non implémenté) ; **`API_RUNTIME_CI_PLAN.md`** (niveau 2 futur : PostgreSQL/MinIO en services, prisma migrate, unit+e2e, `openapi:check`, logs sans secret) ; **`WEB_E2E_CI_PLAN.md`** (niveau 3 futur : outil à décider, parcours Health/Auth/Files, données éphémères). **`cores/cloud/README.md`** créé ; `.github/workflows/README.md` enrichi (**politique CI à 4 niveaux**).
  - **Environnements logiques** cadrés : `local`/`ci` (réels) + `preview`/`staging`/`production` (théoriques, non implémentés). **Politique CI à 4 niveaux** : 1 = présent (CI minimale) ; 2 = runtime API ; 3 = E2E Web ; 4 = registry/déploiement.
  - **Non-régression** : baseline locale **14/14** verte (api-contracts 11, api-client-fetch 29, ui-kit 78 +tokens/pack, web-nextjs 307 + build, **`npm audit` 0 vuln**). **Aucun code applicatif, aucun `ci.yml`, aucun script modifié.** `cores/api-nestjs/src/`/`web-nextjs/src/`/`ui-kit/src/`/`packages/`/`docs/adr/`/`strategy/` **non modifiés**. **Prochaine action : Cloud Core 2 — CI runtime API (niveau 2)** + appliquer la protection de branche `main` (action humaine). Commit `docs(cloud): define v1 execution baseline`.

### Outillage / CI

- **CI minimale (ADR-013)** (`.github/workflows/ci.yml`) : première implémentation réelle d'ADR-013 — CI **GitHub Actions** de **non-régression du monorepo**, **sans déploiement, registry (GHCR), Docker, secret ni publication**. ADR-013 passe **`PARTIELLEMENT_IMPLEMENTE`** ; **ADR-014 (registry) reste non implémenté**.
  - **Déclencheurs** : `pull_request` + `push` sur `main`. **`permissions: contents: read`** (lecture seule, aucun token registry). **`concurrency`** (annule les exécutions obsolètes). **Pas de `pull_request_target`.**
  - **Runtime** : **Node.js 24** + **`npm ci`** (lockfile, reproductible ; jamais `npm install`) + cache npm (`actions/setup-node`).
  - **5 jobs ordonnés par `needs`** (échec lisible) imposant l'**ordre de build** : **`api-contracts`** (`generate:check` snapshot OpenAPI ↔ types + typecheck/build/test) → **`api-client-fetch`** (build de la dépendance api-contracts puis typecheck/build/test) → **`ui-kit`** (`tokens:check`/typecheck/build/lint/test/`pack:check`) → **`web-nextjs`** (build des 3 dépendances puis typecheck/lint/test/**build sans API ni base/stockage**) → **`audit`** (`npm audit` 0 vuln + **gardes Axios/Zustand absents** ADR-011/012 + versions clés react/react-dom/react-query/next). Chaque job aval **rebuild ses dépendances** (`packages/*/dist` non versionnés) — l'ordre de build monorepo (dette C8) est **désormais imposé par la CI** (validé par **simulation runner neuf** : dist effacés → chaîne reconstruite → verte).
  - **Sécurité CI** : aucun secret requis, aucun Docker/PostgreSQL/MinIO, aucun upload d'artefact, aucun token registry, aucune étape de déploiement, pas de `curl | bash`. **Ne garantit pas encore** : protection de branche, couverture publiée, **E2E navigateur**, CI runtime API (e2e PostgreSQL/MinIO), release/versioning, déploiement, environnements protégés, build/push d'images (ADR-014).
  - **Non-régression locale** (Node 24.14, `npm ci`) **verte** : api-contracts **11**, api-client-fetch **29**, ui-kit **78** (+tokens/pack), web-nextjs **307** + build, **`npm audit` 0 vulnérabilité**, Axios/Zustand **absents**. **Aucun code applicatif ni script modifié.** `cores/api-nestjs/src/`/`mobile`/`cloud`/`docs/adr`/`strategy` **non modifiés**. Docs : `.github/workflows/README.md` + checkpoint. **Prochaine action : Cloud Core 1 — cadrage CI/CD & environnements.** Commit `ci: add minimal monorepo validation`.

### Revue

- **Web Core Next.js — Revue globale de l'incrément V1** (`@enistere/web-nextjs`) : revue **transverse de stabilisation** de l'incrément complet (Health public + Auth 1→5 + UI 1 + Files 1) traité comme **un système unique** — **sans nouvelle fonctionnalité** (aucun Files 2, middleware, composant UI, CI, Docker). Statut Web Core **inchangé** `IMPLEMENTATION_PARTIELLE`. **Vérifié** (repository réel + commandes + runtime) : architecture (couches `app→features→core/shared`, **aucun import inversé**, 16 client components justifiés, aucun barrel dangereux), 14 routes (privées/BFF `ƒ` → **build indépendant de l'API**), 6 clients API à responsabilités disjointes (**aucun Bearer/token navigateur**), **BFF ciblé** (jamais proxy ; UUID 400 sans appel API ; CSRF/Origin fail-closed avant API ; `no-store`), configuration (URL validée, `server-config` serveur-only, origines **exactes**), **frontières client/serveur** (test statique : `next/headers`/server-config/handlers/http Files **interdits côté client**), **TanStack Query** (client navigateur stable / serveur par rendu ; clés **disjointes** ; **retry borné Health vs `retry:false` Auth/Files** — divergence **intentionnelle** documentée ; **URL signée = mutation jamais en cache/log**), contrats `SchemaOf<>` (`generate:check` ok, **aucun DTO recopié**, décisions sur status/errorCode jamais message), erreurs Files **distinctes** (400/401/403/404/409/429/503/502/504, **404 anti-énumération préservé**), a11y (un `h1`/page, jest-axe sur les vues clés). **Scans** : aucun token/URL signée/donnée privée en source, logs API, `.next/static`, RSC.
  - **Non-régression** : Web **307 tests ×2** (10,1 s / 9,9 s, **sans hang**) + couverture ≈ **87,8 %** (modules `files/` 96–100 %) + build ; UI Kit **78** (100 %) + tokens:check + pack:check ; api-contracts **11** ; api-client-fetch **29** ; **`npm audit` 0 vulnérabilité** ; Axios/Zustand **absents** ; React 19.2.7 / TanStack Query 5.101.0 / Next 16.2.7 (patch 16.2.9 disponible, non appliqué).
  - **Preuve runtime réelle** (PostgreSQL + **MinIO** jetables, données éphémères, environnement démonté) — **49/49**, **parcours critique Auth+Files rejoué ×2** : public (home **200** API up **et** down ; Health live+ready) ; Auth (anonyme `/protected`→`/login`, login, `/protected` 200, `/me` **sans token**, **refresh** rotation, logout→**401**+`/login`) ; Files (métadonnées **200** sans champ interne, `download-url` **200** `{url,expiresAt}`, **téléchargement réel MinIO** octets==upload image/png, **signature altérée→403**, **URL signée réellement expirée (TTL 30 s)→403**) ; droits (sans `files.read`→**403**, non-propriétaire+permission→**404**, **révocation de rôle sans nouveau JWT**→`/authorization` reflète→**403**, quarantaine→**409**, objet absent→**503**) ; **pannes** (MinIO arrêté→**503** ; API arrêtée→home **200** + `/protected` rend « Service indisponible » **sans contenu privé ni donnée utilisateur** + `/api/files/:id`→**502**) ; concurrence (double login ; double `download-url` 200/200 ; **isolation deux cookie jars**).
  - **Verdict : `WEB_CORE_V1_INCREMENT_STABLE_WITH_RESERVATIONS`** — **aucun défaut bloquant**. **Réserves importantes** : **CI + ordre de build monorepo** (`packages/*/dist` non versionnés), E2E navigateur permanent. **Mineures** : CSP/HSTS/COOP/CORP (V2), 429 sans `Retry-After`, contrastes non mesurés instrumentalement, cache Files non purgé au logout (espaces disjoints, sans impact sécurité). **Corrections documentaires seules** (zéro comportement) : `.env.example` (+`WEB_ALLOWED_ORIGINS`, avertissement fail-closed), `SECURITY.md` (routes protégées **implémentées** + posture **Files** ajoutée). **Rapport permanent** : `docs/WEB_CORE_V1_INCREMENT_REVIEW.md`. `packages/`/`api-nestjs/`/`ui-kit` **non modifiés**. **Prochaine action : CI minimale (ADR-013)** — outiller la non-régression avant d'augmenter la surface (Files 2 / UI Kit 4 / Mobile **après**). Commit `docs(web-nextjs): review web core v1 increment`.

### Ajouté

- **Web Core Files 1 — métadonnées & téléchargement sécurisé (lecture seule)** (`@enistere/web-nextjs`) : première intégration **Files** du Web Core, consommant l'API Core (Files déjà implémenté) via le BFF Auth. Web Core reste `IMPLEMENTATION_PARTIELLE`. **Hors périmètre (volontaire)** : upload, suppression, quarantaine/restauration côté Web, liste/pagination, prévisualisation, proxy/streaming par Next.js, mise en cache de l'URL signée, admin Files, nouveau composant UI Kit, modification API.
  - **Route Handlers BFF ciblés** (jamais un proxy générique) : `GET /api/files/:id` (métadonnées **publiques**, client serveur **read-only**, no-store) et `POST /api/files/:id/download-url` (URL signée courte, client serveur **writable**, no-store). Ordre : méthode (405) → **validation UUID** (`core/files/uuid.ts`, 400 **sans appel API**) → [POST : **Origin/Referer + CSRF** (403 sans appel API)] → API. Seul paramètre métier accepté : l'UUID du chemin. operationId `files_getMetadata`/`files_createDownloadUrl` (façade `@enistere/api-client-fetch`, types `PublicStoredFileDto`/`SignedDownloadResponseDto` via `SchemaOf<>` — **aucun DTO recopié**). Mapping d'erreurs distinct (`core/files/http/files-response.ts`) : 400/401/403/**404**/**409**/429/**503**/502/504 — préserve le 404 anti-énumération.
  - **Client BFF navigateur** (`core/files/client/files-bff-client.ts`) : same-origin `/api/files/*`, `credentials:"include"`, **aucun Bearer**, ne lit aucun cookie/token, valide l'enveloppe, `BffAuthError`. **L'URL signée n'est jamais journalisée** (n'apparaît que dans la valeur de retour, jamais dans une erreur).
  - **TanStack Query** : `fileKeys.all/detail(id)` **disjoints** de auth/health (UUID admis, **jamais** d'URL/token) ; `useFileMetadata` (`fileMetadataQueryOptions` : `enabled` si UUID valide, `retry:false`, données publiques) ; **`useCreateDownloadUrl`** = **mutation** (sans `mutationKey`) dont la `mutationFn` retourne `void` → l'URL est **consommée immédiatement** (`triggerDownload`) puis **abandonnée** : **jamais** dans le cache de query/mutation, ni log, ni persistance. Anti-double-clic (`useRef`).
  - **Téléchargement** (`core/files/download.ts`) : URL **validée** (`isSafeDownloadUrl` : https ; http seulement en dev/test MinIO ; `javascript:`/`data:` refusés ; signature jamais reconstruite) → **ancre temporaire** `rel="noopener noreferrer"`, clic, retrait. Formatage **pur** : `formatFileSize` (BigInt, base 1024 ; `size` est une chaîne décimale), `formatDateTime` (UTC + locale fixe → déterministe).
  - **Page privée** `/protected/files/[id]` (héritée du layout protégé) → conteneur client `FileDetails` : métadonnées via TanStack Query, états standardisés **`LoadingState`/`EmptyState` (404 introuvable, non révélateur)/`ForbiddenState` (403, permission non révélée)/`ServiceUnavailableState` (503)/`ErrorState`**, succès via `PageHeader` + `Card`. **L'API reste l'autorité** (ownership + permission) ; `useAuthorization` ne sert qu'à l'**affichage conditionnel** du bouton. Champs affichés **publics uniquement** (jamais storageKey/bucket/checksum/ownerId), `originalName` rendu en **texte** (aucun `dangerouslySetInnerHTML`).
  - **Tests** : **307** (+37) `node:test` — handlers BFF (UUID 400 sans appel API, 401/403/404/409/503 distincts, CSRF/Origin pour download-url, no-store, requestId, **aucun champ interne**, read-only sans refresh), client BFF (same-origin, credentials include, **aucun Authorization**, requestId, **URL absente des erreurs**), `useFileMetadata` (clé, désactivée si UUID invalide, 404/503, retry false), `useCreateDownloadUrl` (CSRF→POST, **URL jamais en cache**, anti-double-clic, 409), `formatFileSize`/`formatDateTime`/`isUuid`/`triggerDownload` (schémas dangereux refusés, ancre nettoyée), `classifyFileError`, vue métadonnées (+`jest-axe`). Frontières d'import étendues (`files/handlers`/`files/http` interdits côté client).
  - **Preuve API + MinIO réelle** (PostgreSQL + **MinIO** jetables, utilisateurs + fichier VALIDATED **éphémères**, environnement démonté) — **21 assertions, 0 échec** : upload (auto-VALIDATED + objet MinIO) → propriétaire `GET /api/files/:id` **200** (champs publics, no-store, **aucun champ interne**) → `download-url` **200** `{url,expiresAt}` → **téléchargement réel depuis MinIO** (octets == upload, `Content-Type` image/png) → sans permission **403** → **non-propriétaire (avec permission) → 404** (anti-énumération, droits sans nouveau JWT) → quarantaine → **409** → objet supprimé → **503** (≠ 404) → logout → **401** + page privée → redirection `/login` ; **aucun** `storageKey`/`bucket`/`X-Amz-Signature`/credentials dans les métadonnées, logs ou bundle.
  - **Documentation** : `docs/files-read-download.md` (nouveau) ; `docs/api-integration.md` + `docs/tanstack-query.md` (Files) + README. **Non-régression** : Web (307) + couverture + build ; UI Kit (78) ; api-contracts (11) ; api-client-fetch (29) ; **`npm audit` 0 vulnérabilité** ; Axios/Zustand absents. API NestJS / packages **non modifiés**. Checkpoint mis à jour (ADR-007 **partiellement** consommé côté Web : lecture/téléchargement uniquement). **Prochaine action : Revue globale Web Core (incrément V1).** Commit `feat(web-nextjs): add secure file read access`.
- **Web Core UI 1 — états UI & composants structurels génériques** (`@enistere/ui-kit` + `@enistere/web-nextjs`) : standardise les **états d'interface** et introduit 3 primitives structurelles. Statuts **inchangés** (`IMPLEMENTATION_PARTIELLE` pour les deux). **Hors périmètre (volontaire)** : Dialog/Modal/Drawer/Select/Combobox/Toast/DataTable, Tailwind/Radix/shadcn, Storybook, Files Web, fonctionnalité Auth, middleware.
  - **UI Kit — 3 primitives génériques** (sans connaissance HTTP/Auth) : **`Alert`** (`variant` info/success/warning/danger, `title?`, `role?` ; rôle par défaut `status` sauf `danger`→`alert` ; variante conveyée par **glyphe + bordure + titre**, jamais la couleur seule ; glyphe `aria-hidden`), **`Card`** (`Card`/`CardHeader`/`CardTitle`/`CardDescription`/`CardContent`/`CardFooter` ; `CardTitle` **n'impose aucun niveau** — `as` défaut `p` ; aucun rôle imposé), **`FormField`** (`FormField`/`FormFieldLabel`/`FormFieldDescription`/`FormFieldError` ; association **explicite**, **aucune injection magique** — le consommateur câble `htmlFor`/`id`/`aria-describedby`/`aria-invalid`). CSS **pilotée par tokens** (aucun hex, light/dark via variables), `styles.css` régénéré (`tokens:check` up-to-date). **78 tests** (64 + 14, dont `jest-axe`).
  - **Web Core — compositions d'états** (`src/shared/components/`) : `LoadingState`, `EmptyState`, **`ErrorState`** (enrichi : `requestId`, bâti sur `Alert`), **`UnauthorizedState` (401)** ≠ **`ForbiddenState` (403, permission non révélée)**, **`ServiceUnavailableState`** (≠ session anonyme ; `requestId`/retry lien|bouton), **`PageHeader`** (`h1` par défaut configurable, actions responsives). Chaque état : `inline?` (compact vs pleine page), **aucune donnée sensible** (jamais stack/cause/token ; `requestId` de référence). 401 vs 403 vs indisponible strictement distincts.
  - **Intégrations réelles** : `PageHeader` (en-tête unique de l'accueil) + galerie `StatesShowcase` (Alert × variantes, Card, états `inline`) ; `EmptyState` pour « API Health non configurée » ; `ErrorState`/`NotFoundState`/`LoadingState` aux frontières (`error.tsx`/`not-found.tsx`/`loading.tsx`) ; `features/auth/service-unavailable-view` **délègue** à `ServiceUnavailableState` (**dé-duplication** ; flux Auth **inchangés**, preuve Web Auth conservée).
  - **Tests** : Web **270** (+40) `node:test` — états (rôles, 401≠403≠indisponible, requestId/retry, **aucune donnée sensible**), `PageHeader` (h1/h2, actions), `StatesShowcase` (sans `h1`, axe) ; UI Kit **78** (Alert/Card/FormField + `jest-axe` + CSS tokens-only/no-hex/préfixe enistere). `pack:check` UI Kit OK (tests/src exclus). **Non-régression** : UI Kit (tokens:check/typecheck/build/lint/test/coverage/pack) ; Web `check`+couverture+build ; api-contracts 11 ; api-client-fetch 29 ; **`npm audit` 0 vulnérabilité** ; Axios/Zustand absents ; React 19.2.7. **Aucun framework UI lourd ajouté, aucun hex de palette, light/dark via tokens.**
  - **Documentation** : `cores/ui-kit/docs/components.md` + README (Alert/Card/FormField) ; `cores/web-nextjs/docs/ui-states.md` (nouveau : séparation UI Kit/Web, matrice des états, 401/403/indisponible, requestId, réutilisation) + README. **Détail test** : `createTestQueryClient` impose déjà `gcTime: Infinity` aux mutations (anti-hang). Checkpoint mis à jour. **Prochaine action : Web Core Files 1** (consultation métadonnées + téléchargement sécurisé). Commit `feat(web-ui): add standard interface states`.
- **Web Core Next.js — Revue globale Auth Web (1 → 5)** (`@enistere/web-nextjs`) : revue **transverse de stabilisation** du socle Auth traité comme **un système unique** — **sans nouvelle fonctionnalité** (aucun middleware, aucune route Auth, aucun register/reset/OAuth/MFA). Statut Web Core **inchangé** `IMPLEMENTATION_PARTIELLE`. **Vérifié** (repository réel + commandes) : architecture BFF + résolution serveur + login, 6 routes BFF + `/protected` + `/login` (`ƒ`), cookies `HttpOnly`/`__Host-`, CSRF double-submit + Origin/Referer fail-closed, **aucune fuite de token** (greps src + bundle `.next/static` : `API_INTERNAL_URL`/`DATABASE_URL`/`JWT_ACCESS_SECRET`/`REFRESH_TOKEN_HASH_SECRET`/`S3_SECRET_ACCESS_KEY`/cookies Auth **tous absents**), session cohérente (401→anonymous / 403·5xx·réseau distincts ; pas de faux `authenticated`), caches `authKeys`/`healthKeys` disjoints + purge login/logout, résolution serveur read-only (**aucun contenu privé avant validation**), `returnTo` **anti-open-redirect**, RBAC OR/AND **sans wildcard**, contrats via `SchemaOf<>` (`generate:check` up-to-date), mappeurs d'erreurs **cohérents** (4 couches), frontières d'import (test statique). **Non-régression** : web `check` (typecheck+lint+**263 tests ×2 sans hang**+build) + couverture ≈ **86,1 %** ; UI Kit 64 ; api-contracts 11 ; api-client-fetch 29 ; **`npm audit` 0 vulnérabilité** ; Axios/Zustand absents ; React 19.2.7 / TanStack Query 5.101.0 uniques. **Preuve runtime rejouée (un système unique) — 33 assertions / 0 échec** (NestJS + PostgreSQL jetable, utilisateur éphémère, environnement démonté) : nominal (anonyme `/protected`→redirection `/login`→login BFF→`/protected` hydraté→`/authorization`) + **refresh** (rotation cookies, `/me` read-only **sans** `/auth/refresh`) + **droits sans nouveau JWT** (retrait de rôle → `/authorization` vidé sur la même session, `/me` 200) + erreurs (401 **sans énumération**, 403 CSRF, 403 Origin) + **API arrêtée** (« Service indisponible » ≠ anonyme) + bundle sans secret + **aucun open redirect** (`returnTo=https://evil…` → cible réelle `/protected`). **Verdict : `AUTH_WEB_V1_STABLE_WITH_RESERVATIONS`** — aucun défaut de sécurité bloquant ; réserves **opérationnelles** : CI (non-régression + ordre de build paquets), E2E navigateur (Playwright), sémantique streaming-redirect (HTTP 200 + `NEXT_REDIRECT`/meta-refresh), multi-onglets + fenêtre `staleTime`, durcissement CSP/HSTS/observabilité. **Aucune correction de code applicatif** (seul correctif test-only `gcTime` mutation, déjà dans `447e3b5`). **Rapport permanent** : `docs/WEB_AUTH_V1_REVIEW.md` (30 sections). `packages/`/`api-nestjs/`/autres cores **non modifiés**. **Prochaine action : Web Core — états UI & composants structurels** (`CORE_SPEC` §3/§4 ; CI + E2E recommandés en parallèle). Commit `docs(web-nextjs): review web auth v1`.
- **Web Core Next.js — Page de connexion & navigation Auth contrôlée (Web Auth 5)** (`@enistere/web-nextjs`) : page **publique `/login`**, formulaire accessible, **login via le BFF**, navigation interne **sûre**. Web Core reste `IMPLEMENTATION_PARTIELLE`. **Hors périmètre (volontaire)** : middleware/proxy, Server Action Auth, inscription, forgot/reset password, OAuth/MFA, remember-me, navigation Auth globale, **token en JS**, **credential en cache**.
  - **`returnTo` sûr** (`core/auth/return-to.ts`, pur) : `sanitizeReturnTo()` n'accepte qu'un **chemin interne** (sinon `/protected`) — refuse hôte externe / schéma (`javascript:`/`data:`/`https:`) / `//` / `\` / `..` / contrôle-espaces (anti-CRLF) / encodages trompeurs / routes Auth-API (anti-boucle), via parsing sur **origine sentinelle** + décodage de contrôle. `buildLoginRedirect()` → `/login?returnTo=<assaini+encodé>`. La redirection anonyme du layout protégé pointe désormais vers **`/login?returnTo=/protected`** (remplace `/?auth=required`).
  - **Page `/login`** (`app/login/page.tsx`, Server Component, `force-dynamic`) : assainit `returnTo`, **résout la session côté serveur** (lecture seule) → **authentifié** ⇒ **redirige** vers `returnTo` (jamais de formulaire ni login inutile) ; **anonyme** ⇒ formulaire ; **unavailable** ⇒ formulaire + état dégradé (BFF = autorité). Build **indépendant de l'API**.
  - **Formulaire** (`features/auth/login-form.tsx`, présentationnel testable) : `<form>` sémantique, `Label`/`Input`/`Button` du UI Kit, `autoComplete` email/current-password, **validation UX** (`login-validation.ts` : e-mail trim+forme, mot de passe **non modifié**, bornés) — **n'est pas** une sécurité (API = autorité). A11y : `aria-invalid`, `aria-describedby`, `role="alert"`, `aria-busy`, bouton désactivé. **Mot de passe jamais journalisé/mis en cache/sérialisé**.
  - **Client login** (`core/auth/client/login-client.ts`) : `performBffLogin` = `GET /api/auth/csrf` → `POST /api/auth/login` **same-origin**, `credentials:"include"`, `X-CSRF-Token`, corps `{email,password}`. **Aucun token Auth lu** (cookies `HttpOnly` posés par le BFF). Erreurs génériques (`toLoginError` : **401 sans énumération** d'e-mail).
  - **Mutation & navigation** (`features/auth/use-login.ts` ; `app/login/login-panel.tsx`) : `useLogin` (`useMutation`, **sans `mutationKey`** → aucun credential en clé) purge `authKeys.all` au succès (**Health conservé**) ; **anti-double-soumission** (verrou `useRef` + bouton désactivé). `LoginPanel` (wiring router, exclu node:test) : **`router.replace(returnTo)` + `router.refresh()`** (pas `push`). La réponse login (sans profil) **ne crée jamais** d'état authentifié seule — la session est résolue **côté serveur** à la navigation.
  - **Tests** : **263** (+33) `node:test` — `sanitizeReturnTo` (interne/externe/`//`/`\`/schéma/`..`/encodages/routes Auth → défaut), validation login, client BFF login (CSRF/header/body/statuts/réseau/JSON invalide/**aucune fuite de mot de passe**), `useLogin` (succès/erreur/**purge authKeys**/**double-soumission empêchée**/aucun credential en cache), `LoginForm` (labels/autoComplete/validation/loading/erreurs + **`jest-axe` ×4**). Frontières d'import étendues (surface login navigateur).
  - **Preuve API réelle** (NestJS + **PostgreSQL jetable**, utilisateur éphémère, environnement démonté) — **22 assertions, 0 échec** : anonyme `GET /protected` → **redirection vers `/login?returnTo=/protected`** ; `GET /login` → **200 + formulaire** (aucun token) ; CSRF + `login` BFF → `authenticated:true` (**aucun token**, cookie `HttpOnly`) ; authentifié `GET /protected` → **200 + profil hydraté** (`X-Request-Id` propagé) ; **authentifié `GET /login` → redirection hors login** ; **`returnTo` externe (`https://evil…`) → cible réelle `/protected`** (`NEXT_REDIRECT;replace;/protected` + meta-refresh ; evil **seulement reflété** dans l'état du routeur, **jamais suivi** — aucun open redirect) ; logout → `/protected` redirige vers `/login` ; identifiants invalides → **401 générique** ; CSRF invalide → **403** ; HTML/bundle **sans** `API_INTERNAL_URL`, sans cookie Auth, **sans mot de passe**.
  - **Documentation** : `docs/login-flow.md` (nouveau) ; `docs/protected-routes.md` (§4 → `/login`, §4b `returnTo`), `docs/auth-architecture.md` (§10c login, §13 → revue globale), `docs/session-state.md` (parcours connexion), README Web + `src/core/auth/README.md`. **Non-régression** : Web (263) + couverture + build ; UI Kit (64) ; api-contracts (11) ; api-client-fetch (29) verts ; **`npm audit` 0 vulnérabilité** ; Axios/Zustand absents ; React unique 19.2.7. API NestJS / packages **non modifiés**. Checkpoint mis à jour. **Prochaine action : Revue globale Auth Web (1 → 5).** Commit `feat(web-nextjs): add secure login experience`.
- **Web Core Next.js — Résolution Auth serveur + premier layout protégé (Web Auth 4)** (`@enistere/web-nextjs`) : premier **espace privé** dont la session est **résolue côté serveur** (lecture seule) puis **hydratée**. Web Core reste `IMPLEMENTATION_PARTIELLE`. **Hors périmètre (volontaire)** : middleware/proxy, page/formulaire `/login`, Server Action login, redirection post-login sophistiquée, **refresh pendant le rendu serveur**, **self-fetch** serveur → BFF.
  - **Résolveur serveur** (`core/auth/resolve-server-session.ts`, testable) : `resolveServerSession()` crée un **client API serveur authentifié `read-only`** (`enableRefresh:false` → **aucun refresh**), appelle **directement** l'API NestJS `GET /auth/me` (**jamais** le BFF local), et retourne un contrat **sans token** `ServerSessionResolution = authenticated | anonymous | unavailable`. Classification : `200`→authenticated, `401`/`session_expired`→anonymous, `403`/réseau/timeout/`5xx`/réponse 2xx inexploitable→**unavailable** (jamais assimilé à anonyme). `decideProtectedRender()` : politique pure (redirect/render/unavailable).
  - **Cookie store lecture seule** (`core/auth/read-only-cookie-store.ts`) : `ReadOnlyServerCookieStore` n'expose que `get` (**défense par le type**) ; `guardReadOnly()` **lève** sur toute écriture (`set`/`delete`) — aucun `Set-Cookie` pendant le rendu.
  - **Request id** (`core/auth/request-id.ts`) : `resolveRequestId()` pur, partagé (Route Handlers **et** Server Component via `headers()`), réutilise un `X-Request-Id` entrant valide sinon UUID.
  - **Layout protégé** (`app/(protected)/layout.tsx`, Server Component, `force-dynamic`) : `resolveNextServerSession()` (`next/headers` + cookies lecture seule, **exclu de `node:test`**) → `anonymous` ⇒ **redirection serveur** `redirect('/?auth=required')` (interne, sans `returnUrl` libre, aucune open redirect) ; `unavailable` ⇒ **`ServiceUnavailableView`** (erreur de service contrôlée, **pas** une redirection) ; `authenticated` ⇒ `createQueryClient()` (par rendu, **aucun singleton**) + **`prefillSessionQuery`** (pose `authKeys.session()` **sans** rappeler `/me`) + `HydrationBoundary`. Page technique **`/protected`** + `(protected)/error.tsx` (filet d'erreur local).
  - **Hydratation** (`features/auth/auth-queries.ts` → `prefillSessionQuery`) : `useSession` est **authentifié dès le premier rendu** (sans flash), **sans** second appel `/api/auth/me` (donnée fraîche). Aucun token sérialisé dans le payload. Autorisations **non** préchargées (chargées côté client — API = autorité finale).
  - **Tests** : **230** (+24) `node:test` — résolveur (200/401/403/5xx/réseau/réponse invalide, isolation A/B, **aucun refresh**, requestId propagé, **aucun token** dans résultat/erreur), `decideProtectedRender` (redirect/render/unavailable, cible interne sans token), `guardReadOnly` (écritures **interdites**), `request-id`, **hydratation** (authentifié au 1ᵉʳ rendu, **0 appel `/me`**, aucun token dans le payload, refetch possible), vues `ServiceUnavailableView`/`ProtectedNotice` (a11y). Frontières d'import renforcées (`resolve-server-session`/`protected-session` interdits côté client ; surface Auth navigateur ajoutée à la liste gardée).
  - **Preuve API réelle** (NestJS + **PostgreSQL jetable**, utilisateur de preuve éphémère, environnement démonté) — **26 assertions, 0 échec** : anonyme `GET /protected` → **redirection serveur** (`NEXT_REDIRECT` + meta-refresh → `?auth=required`, **aucune** donnée privée) ; authentifié → **200**, **profil hydraté** (e-mail en SSR), **aucun nom ni valeur de token** dans le HTML/RSC, **`X-Request-Id` propagé** serveur → API ; cookie access retiré → redirection **sans** `/auth/refresh` (read-only) ; logout → redirection ; **API arrêtée → « Service indisponible »** (≠ anonyme) ; bundle client **sans** `API_INTERNAL_URL` ni nom de cookie Auth. (Note : sous le **streaming** App Router, `redirect()` est délivré en HTTP 200 via RSC `NEXT_REDIRECT` + `<meta http-equiv="refresh">` — honoré par le navigateur ; vérifié : aucune donnée privée n'est exposée.)
  - **Documentation** : `docs/protected-routes.md` (nouveau) ; `docs/auth-architecture.md` (§10b résolution serveur + §13 → Web Auth 5), `docs/session-state.md` (état initial hydraté privé vs client-only public), README Web. **Non-régression** : Web (230) + couverture + build ; UI Kit (64) ; api-contracts (11) ; api-client-fetch (29) verts ; **`npm audit` 0 vulnérabilité** ; Axios/Zustand absents ; React unique 19.2.7. API NestJS / packages **non modifiés**. Checkpoint mis à jour. **Prochaine action : Web Auth 5** (page de connexion & navigation Auth). Commit `feat(web-nextjs): add server-resolved protected layout`.
- **Web Core Next.js — Checkpoint de gouvernance (revue de socle)** (`@enistere/web-nextjs`) : mission de **revue/vérification/consolidation/arbitrage** (aucune implémentation fonctionnelle ; aucun middleware/page login/route protégée créés). Statut **inchangé** (`IMPLEMENTATION_PARTIELLE` — non relevé du seul fait d'une revue). **Vérifié** (repository réel + commandes) : architecture/frontières client-serveur, 6 routes BFF `ƒ`, 3 clients API séparés, cookies `HttpOnly`/`__Host-`, CSRF double-submit + Origin/Referer, **aucune fuite de token** (greps + bundle `.next/static` : `API_INTERNAL_URL`/secrets absents), caches `authKeys`/`healthKeys` disjoints, helpers RBAC OR/AND **sans wildcard** (ADR-006), types via `SchemaOf<>` (`generate:check` up-to-date), **read-only ⇒ aucun refresh silencieux** (gating `enableRefresh`). **Non-régression verte** : web `check` (typecheck+lint+**206 tests** ×2 sans hang+build) + couverture ≈ 84,7 % lignes ; UI Kit 64 ; api-contracts 11 ; api-client-fetch 29 ; **`npm audit` 0 vulnérabilité** ; Axios/Zustand absents. **Décisions** : SSR Auth = **hybride** (Option C résolution serveur read-only pour le privé, Option A client-only pour le public) — **pas de nouvel ADR** (couvert par ADR-004/005/012) ; **pas de middleware comme autorité** Auth (UX léger seulement). **Dette IMPORTANTE** identifiée (non bloquante) : ordre de build monorepo (`packages/*/dist` non versionnés → builder les paquets avant le Web Core ; aucune CI — ADR-013). **Corrections appliquées** (documentaires/factuelles + 1 export mort, zéro changement de comportement) : `package.json`, `cookie-config.ts` (commentaire CSRF + `CSRF_HEADER_NAME` mort supprimé), `query-client.ts`, `README.md`, `docs/SECURITY.md`, `docs/ARCHITECTURE.md`. **Rapport permanent** : `docs/WEB_CORE_GOVERNANCE_REVIEW.md` (26 sections). `packages/` et autres cores **non modifiés**. **Prochaine action unique : Web Auth 4** (résolution Auth serveur + premier layout protégé). Commit `docs(web-nextjs): review web core governance`.
- **Web Core Next.js — profil, autorisations et état de session avec TanStack Query (Web Auth 3)** (`@enistere/web-nextjs`) : expose l'**état de session** côté navigateur **sans aucun token**. Web Core reste `IMPLEMENTATION_PARTIELLE`. **Hors périmètre (volontaire)** : page/formulaire de connexion, middleware, route/layout protégé, redirection automatique, Server Action Auth, RBAC d'administration, SSR Auth complet.
- **Route Handlers de lecture** : `GET /api/auth/me` (profil public) et `GET /api/auth/authorization` (rôles/permissions) — routes **minces** (`force-dynamic`) ; logique dans des **handlers testables** (`core/auth/handlers/get-profile`, `get-authorization`, `(Request, deps) → Response`) appelant le client serveur en mode **`read-only`** (`enableRefresh:false` → **aucun refresh silencieux** sur une lecture : un access expiré donne **401**), `Cache-Control: no-store`, erreurs **génériques**, **GET only** (405 sinon).
- **Client BFF navigateur** (`core/auth/client/auth-bff-client.ts`) : appels **same-origin** vers `/api/auth/*`, `credentials: "include"` (cookies `HttpOnly` envoyés par le navigateur, **jamais lus par le JS**). N'appelle **jamais** l'API NestJS directement, n'utilise **pas** `NEXT_PUBLIC_API_URL`, ne lit **aucun** token. Valide l'enveloppe `{ success, data }` ; lève `BffAuthError` (`http`/`network`/`invalid_response`, avec `requestId`). Timeout via `AbortSignal.timeout` (timer **unref**) combiné à l'annulation TanStack Query (`AbortSignal.any`). Types **dérivés des contrats** via `SchemaOf<"UserProfileResponseDto">` / `SchemaOf<"AuthorizationSummaryResponseDto">` — **aucun DTO recopié**.
- **Server state Auth (TanStack Query)** : `authKeys` (`session()`/`authorization()`) **disjoint** de `healthKeys` ; `sessionQueryOptions`/`authorizationQueryOptions` (`retry:false`, `staleTime` court, **aucune persistance** — pas de localStorage/sessionStorage). **`useSession`** : `loading` → `authenticated` (profil, **aucun token**) → **`anonymous` (401, traité comme succès, pas une erreur)** → **`error` (403/5xx/réseau/réponse invalide — 403 reste distinct d'anonyme)** ; `toPublicAuthError` (message générique, **sans cause/stack/cookie/token**). **`useAuthorization`** : partage la query de session, **activé uniquement** si authentifié (**aucun appel** `/authorization` en anonyme/chargement) ; helpers `hasRole`/`hasAnyRole`/`hasPermission`/`hasAllPermissions` (**OR/AND, sans wildcard**, ADR-006 ; paramètre `trim()` seul, codes API canoniques) pour l'**affichage conditionnel** — **l'API reste l'autorité finale**.
- **Logout & purge** (`features/auth/use-logout.ts`) : CSRF → `POST /api/auth/logout` → en cas de succès, `queryClient.removeQueries({ queryKey: authKeys.all })` (**session + authorization purgées, Health conservé**). **Échec réseau navigateur↔BFF → pas de purge** (on ne prétend pas la session terminée), erreur exposée pour un retry. **Aucune redirection** (hors périmètre).
- **UI présentationnelle** : `session-status-view` / `authorization-status-view` (UI Kit, états + a11y) + `session-panel` intégré à la page technique. **Aucune logique d'accès** : démonstration d'état, pas une protection.
- **Tests** : **206** (+37) `node:test` — handlers `me`/`authorization` (GET-only, read-only, erreurs génériques, no-store), client BFF navigateur (enveloppe, **chemin same-origin relatif**, 401/403/réseau/réponse invalide, **aucun token**), `authKeys` (disjoints, sans secret), `useSession` (loading/authenticated/**401→anonymous**/**403→error**/refetch), `useAuthorization` (désactivé en anonyme = **aucun appel** `/authorization` ; helpers OR/AND **sans wildcard**), `useLogout` (CSRF posé, **purge Auth / Health conservé** ; échec réseau → **pas de purge**), UI session/authorization + a11y. **Preuve API réelle** (NestJS + **PostgreSQL jetable**, utilisateur de test via procédure contrôlée — aucun seed permanent) : `login` → `/me` (profil, **aucun token**, `X-Request-Id`, `no-store`) → `/authorization` (rôles/permissions, aucun token) → `logout` → `/me` **401** ; **read-only prouvé** (401 **sans** appel `/auth/refresh`) ; **changement de droits sans nouveau JWT** (ADR-006) : après retrait du rôle (`DELETE FROM user_roles`), la **même** session renvoie `roles:[]`/`permissions:[]` immédiatement et `/me` reste **200** (auth ≠ rôle). Scan du bundle client : `API_INTERNAL_URL`/secrets **absents**.
- **Documentation** : `docs/session-state.md` (machine d'états, read-only, helpers RBAC, cache, purge, changement de droits, Option A SSR) ; `docs/auth-architecture.md` + `docs/tanstack-query.md` + README Web + `src/core/auth/README.md` mis à jour. **Non-régression** : Web Core (**206**), UI Kit (64), `api-contracts` (11), `api-client-fetch` (29) verts ; **`npm audit` 0 vulnérabilité** ; **Axios/Zustand absents** ; React unique 19.2.7. API NestJS / packages **non modifiés**. Checkpoint mis à jour (ADR-004/005/006/011/012/016 — état de session opérationnel ; prochaine action : **Checkpoint de gouvernance Web Core** puis SSR Auth / routes protégées). Commit `feat(web-nextjs): add session and authorization state`.
- **Web Core Next.js — flux Auth BFF sécurisés : login, refresh, logout + CSRF (Web Auth 2)** (`@enistere/web-nextjs`) : expose les premiers **flux d'authentification réels** via un **BFF** Next. Web Core reste `IMPLEMENTATION_PARTIELLE`. **Aucun token Auth renvoyé au navigateur, aucun token en JS.** Pas de `me`/`authorization`, pas de page de connexion, pas de middleware, pas de hook Auth.
- **Route Handlers** : `POST /api/auth/login`, `POST /api/auth/refresh`, `POST /api/auth/logout`, `GET /api/auth/csrf` — fichiers de route **minces** ; logique dans des **handlers testables** (`core/auth/handlers/*`, `(Request, deps) → Response`).
- **Login** : validation locale (corps **borné** + Content-Type + forme email/mot de passe, champs inconnus refusés) → Origin/Referer → CSRF → API NestJS → pose des cookies **`HttpOnly`** access/refresh (durées de l'API, via `WebAuthSessionAdapter`), **renouvellement CSRF**, **compensation `clearSession`** si une écriture de cookie échoue. Identifiants invalides → **401 générique** (pas de fuite). Réponse : `{ authenticated: true }` (aucun token).
- **Refresh** : refresh token lu **uniquement** du cookie `HttpOnly`, **un seul** appel `/auth/refresh` (aucune boucle), **rotation des deux cookies** + CSRF ; échec → cookies supprimés + **401**. **Logout** : appel API best-effort + **suppression locale systématique** des cookies (Auth + CSRF), **idempotent** (réussit même API indisponible).
- **CSRF opérationnel** (double-submit) : cookie CSRF **non HttpOnly** (256 bits base64url, sans secret Auth, sans persistance serveur) + en-tête **`X-CSRF-Token`**, comparaison **à temps constant** ; **rotation** après login/refresh, **suppression** au logout ; **login protégé contre le login-CSRF**. **Origin/Referer** : liste `WEB_ALLOWED_ORIGINS` validée, comparaison **exacte** `scheme+host+port`, **fail-closed**. En-têtes `Cache-Control: no-store` (+ `Referrer-Policy: no-referrer` sur `/csrf`). **X-Request-Id** propagé navigateur → BFF → API → réponse.
- **Erreurs BFF normalisées** (jamais la réponse brute/cause/stack/cookie) : 400/401/403/413/415/429/500/502/504. Client serveur authentifié **par requête** (aucune session globale) ; **buffer du corps de requête** (`fetch(url, init)`) pour contourner `expected non-null body source` du `fetch` patché de Next sur réponses non-2xx (sinon 401 login remontait en « réseau »). Validation login **interne** (pas de Zod — déps minimales).
- **Tests** : **169** (+57) `node:test` — CSRF (génération/format/temps constant/rotation), Origin/Referer (sous-domaine/suffixe/port/schéma/fail-closed/wildcard rejeté), validation login + corps borné, mapping d'erreurs (aucune cause/token), 4 handlers (login/refresh/logout/csrf : cookies posés/rotés/supprimés, **aucun token dans le corps**, 403 sans appel API, compensation, idempotence, requestId), isolation, **sentinelles** non fuitées, cookie attributes. **Preuve API réelle** (NestJS + **PostgreSQL jetable**, utilisateur de test via procédure contrôlée — aucun seed permanent) : `csrf` → `login` (cookies `HttpOnly`, aucun token au navigateur) → `refresh` (rotation) → `logout` (suppression) → refresh-après-logout **401**, login sans CSRF **403**, mauvaise Origin **403**, identifiants invalides **401**, X-Request-Id propagé ; **seul le cookie CSRF est lisible par le JS**. Scan du bundle client : `API_INTERNAL_URL`/cookies/secrets **absents**.
- **Documentation** : `docs/auth-architecture.md` (flux réels, cookies, CSRF, Origin/Referer, rotation, erreurs, requestId, limites) + `docs/csrf.md` ; README Web + `src/core/auth/README.md`. **Non-régression** : Web Core (169), UI Kit (64), `api-contracts` (11), `api-client-fetch` (29) verts ; **`npm audit` 0 vulnérabilité** ; **Axios absent** ; React unique 19.2.7. API NestJS **non modifiée**. Checkpoint mis à jour (ADR-004/005/011/016 — flux Auth BFF opérationnels ; prochaine action : **Web Auth 3** `me`/`authorization` + session TanStack Query). Commit `feat(web-nextjs): implement secure auth BFF flows`.
- **Web Core Next.js — fondations BFF, session serveur et cookies (Web Auth 1)** (`@enistere/web-nextjs`) : établit les **fondations serveur de l'authentification** Web **sans exposer aucun flux**. **Aucune route Auth, aucun CSRF actif, aucun login/refresh/logout réel, aucun token au navigateur.** Web Core reste `IMPLEMENTATION_PARTIELLE`.
- **Architecture BFF** documentée (`docs/auth-architecture.md`) : Navigateur → Route Handlers Next `/api/*` (V2) → **client API serveur authentifiable par requête** → API Core NestJS. Le navigateur ne parle jamais directement aux endpoints Auth NestJS.
- **Client serveur authentifiable** (`core/api/server/create-authenticated-server-api-client.ts`) **distinct du client public** : par requête (aucun singleton de session, aucun état module), `API_INTERNAL_URL`, `fetch` `no-store`, `X-Request-Id`, Bearer lu depuis le cookie d'access. Modes **`read-only`** (Server Component → `enableRefresh:false`) / **`writable`** (Route Handler/Server Action → refresh activable). Le client public Health reste inchangé.
- **Cookies** (`core/auth/cookie-config.ts`) : `enistere_access` / `enistere_refresh` **distincts**, `HttpOnly`, `SameSite=Lax`, `Path=/`, **sans Domain**, `Secure` en **production** ; préfixe **`__Host-`** en production (omis en dev/test HTTP). **Durées issues de l'API** (`accessTokenExpiresIn`/`refreshTokenExpiresIn`). Validations : nom de cookie, durée finie/positive, `SameSite=None` sans `Secure` rejeté, contraintes `__Host-`. Décision **Option A** : access **et** refresh en cookies `HttpOnly`.
- **Abstraction `ServerCookieStore`** (`core/auth/server-cookie-store.ts`) + `InMemoryCookieStore` (tests) ; **adaptateur `next/headers`** (`core/auth/server/next-cookie-store.ts`, `cookies()` **async** Next 16) + point d'entrée serveur (`core/auth/server/index.ts`). Distinction contextes (Server Component lecture seule ; Route Handler/Server Action lecture+écriture).
- **`WebAuthSessionAdapter`** (`core/auth/web-session-adapter.ts`, implémente `AuthSessionAdapter`) : `getAccessToken`/`getRefreshToken` (lecture cookie), `updateTokens` (pose les **deux** cookies avec les durées de l'API, rejette tokens vides/à caractères de contrôle, **limite non-transactionnelle documentée**), `clearSession` (supprime les deux, **idempotent**). **Aucun log de token, aucune valeur renvoyée au navigateur.** Contrat interne `WebAuthSession` + diagnostic `sessionPresence` (présence uniquement).
- **Séparation client/serveur** : points d'entrée distincts (`core/api/public`, `core/api/server`, `core/auth/server`). `server-only` (npm) **non utilisé** (il lève à l'import sous `node:test`) ; frontière garantie par `next/headers` + **tests d'import statiques** + exclusion de `core/auth/server` de `tsconfig.test.json` (validé par typecheck/build).
- **Tests** : **112** (+33) `node:test` — config cookies (Secure/env, préfixes, durées, rejets), cookie store mémoire (idempotence/isolation), `WebAuthSessionAdapter` (lecture/écriture/clear, tokens vides/contrôle, durées, **aucune valeur en erreur**), factory authentifiée (instance/appel, **isolation SSR A/B**, Bearer issu du cookie, **read-only refresh off vs writable refresh tenté** via mocks), **frontières d'import statiques**, **sentinelles** (`SENTINEL_ACCESS/REFRESH_TOKEN`) absentes des erreurs/logs. **Cadrage CSRF uniquement** (noms réservés, aucun mécanisme).
- **Documentation** : `docs/auth-architecture.md` (BFF, clients, cookies, session, access/refresh, contextes Next, read-only/writable, refresh & CSRF futurs, SSR, sécurité, limites) ; `src/core/auth/README.md` (fondations présentes / routes & CSRF absents) ; README Web. **Non-régression** : Web Core (112), UI Kit (64), `api-contracts` (11), `api-client-fetch` (29) verts ; **`npm audit` 0 vulnérabilité** ; **Axios absent** ; React unique 19.2.7. API NestJS **non modifiée**. Checkpoint mis à jour (ADR-004/005/011 — état d'application avancé ; prochaine action : **Web Auth 2**). Commit `feat(web-nextjs): establish server auth foundations`.
- **Web Core Next.js — intégration de l'API publique + TanStack Query** (`@enistere/web-nextjs`) : le Web Core passe de `STARTER_INITIALISE` à **`IMPLEMENTATION_PARTIELLE`**. Ajout de **`@tanstack/react-query` v5** (server state, ADR-012) ; **aucun store global** (Zustand/Redux), **aucun Axios**. Périmètre strict : **endpoints publics Health uniquement** (`/health`, `/health/live`, `/health/ready`), **aucune authentification**.
- **Transport API** : factory **serveur par requête** (`createServerApiClient` — `API_INTERNAL_URL`, `fetch` `no-store`, nouvelle instance par appel, aucun état module, aucun Bearer, `enableRefresh:false`) ; client **public navigateur** (`createPublicApiClient` + singleton sans session, `NEXT_PUBLIC_API_URL`, `enableRefresh:false`, X-Request-Id) ; transport Health (`run-public-request`) au-dessus de `client.raw` (timeout + normalisation `ApiClientError` + extraction d'enveloppe). Types dérivés via `SchemaOf<>` des contrats — **aucun DTO recopié**. Validation des URLs (`http(s)`, absolue, sans credentials, slash final normalisé, wildcard rejeté).
- **TanStack Query** : `createQueryClient` (staleTime/gcTime explicites, **retry borné** — jamais sur 4xx/429, borné sur réseau/5xx, `refetchOnWindowFocus` off) ; `QueryProvider` (Client Component, un `QueryClient` par navigateur) + `AppProviders` (le **Root Layout reste Server Component**) ; query keys standardisées (`healthKeys`) ; hooks `useHealth/useLiveness/useReadiness` (désactivés si l'API publique n'est pas configurée) ; `queryOptions` réutilisables.
- **SSR / préchargement / hydratation** : la page précharge `health_get` côté serveur (`prefetchQuery`) puis `dehydrate` + `HydrationBoundary` ; `staleTime` évite un refetch immédiat. Page **`force-dynamic` + `no-store`** : le **build ne dépend d'aucune API**. Une API indisponible n'est **pas déshydratée** (rendu contrôlé, la page ne tombe jamais). Page technique enrichie d'une **matrice d'intégrations** + panneau **Health** (états non configuré/chargement/succès/erreur, bouton Relancer) bâti sur le UI Kit.
- **Erreurs & corrélation** : `mapApiErrorToPublicMessage` (message **public** générique selon `kind`/`status`, jamais de cause/stack/secret) ; `requestId` conservé comme référence technique et **propagé** (X-Request-Id).
- **Décision bundler** : `build`/`dev` via **webpack** (`next build --webpack`) + `experimental.extensionAlias` (`.js → .ts/.tsx`), afin d'utiliser une **convention d'import unique `.js`** cohérente avec `node:test` (Turbopack ne résout pas encore ces imports `.js`). Documenté dans le README du core.
- **Tests** : **79 tests** `node:test` (validation URL/config, factory serveur — instance par appel/no-Bearer/isolation, client public — no-Authorization/`enableRefresh:false`/requestId/**aucun import serveur** vérifié statiquement, `QueryClient` retry + isolation cache, query keys, transport Health succès/erreur/timeout/requestId, hooks succès/erreur/refetch/désactivé, **hydratation** sans refetch quand frais, UI Health + a11y, mapping d'erreurs, **garde anti-réseau**). **Preuve API réelle** : API NestJS + **PostgreSQL jetable** (Health/live/ready, hydratation SSR, **API down → rendu contrôlé sans fuite**, API up → succès) — **aucune authentification, aucun utilisateur créé**.
- **Documentation** : README du core mis à jour ; `docs/api-integration.md` + `docs/tanstack-query.md` ; cadrage `core/api`/`core/auth`/`core/query` mis à jour — **le client public ne deviendra pas le client authentifié** (Auth via BFF + cookies `HttpOnly`). **Non-régression** : Web Core (79), UI Kit (64), `api-contracts` (11), `api-client-fetch` (29) verts ; **`npm audit` 0 vulnérabilité** ; **Axios absent** ; React unique 19.2.7 ; TanStack Query 5.101.0. Checkpoint `docs/project-status/` mis à jour (Web Core → `IMPLEMENTATION_PARTIELLE` ; ADR-011/012/016 avancés côté Web). API NestJS **non modifiée**. Commit `feat(web-nextjs): integrate public API and query layer`.
- Initialisation du **Web Core Next.js — starter minimal** (`@enistere/web-nextjs`, **0.1.0**, privé) sous `cores/web-nextjs/`, ajouté aux **npm workspaces** racine (`packages/*` + `cores/ui-kit` + `cores/web-nextjs`). **Next.js 16 (App Router, Turbopack) + React 19**, **TypeScript strict** (`strict`, `noUncheckedIndexedAccess`, `noImplicitOverride`). Arborescence `app`/`core`/`shared`/`features` ; **Server Components par défaut** (seul `app/error.tsx` est `"use client"`). Layout racine, page technique d'accueil, `loading`/`error`/`not-found`, `manifest`. **Statut : Web Core → `STARTER_INITIALISE`.**
- **Consommation réelle du UI Kit** : primitives `@enistere/ui-kit` (Text/Button/Spinner) rendues (classes `enistere-*` vérifiées en test et en sonde HTTP) + CSS agrégé `@enistere/ui-kit/styles.css` chargé dans le layout ; `globals.css` **référence** les variables `--enistere-color-*` (**aucune palette dupliquée**). **Thème clair par défaut** via `data-theme="light"` sur `<html>` (résolu par le UI Kit ; pas de bascule runtime, pas de flash, pas de gestionnaire de thème en V1).
- **Sécurité de base** (`next.config.ts`) : en-têtes `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `X-Frame-Options: DENY`, `X-DNS-Prefetch-Control: off`, `Permissions-Policy` sur toutes les routes ; **`poweredByHeader: false`** → `X-Powered-By` **absent**. **CSP volontairement différée** (V2, documentée `cores/web-nextjs/docs/SECURITY.md`). Configuration d'environnement séparée **public** (`APP_ENV`, `NEXT_PUBLIC_*`) vs **serveur** (`API_INTERNAL_URL`, jamais préfixé `NEXT_PUBLIC_`) ; `.env.example` à placeholders, **aucun secret**, **aucun token stocké**.
- **Tests Web Core** : `node:test` + `@testing-library/react` + `jest-axe` + `global-jsdom` (**pas de Vitest** → 0 vuln) — config (thème/env/métadonnées), `FoundationStatus`, états partagés, **accessibilité (jest-axe)**, **non-régression de contraintes** (dépendances interdites absentes), **résolution des paquets API** (compilation via fixture de types + `import.meta.resolve`, **sans appel réseau**). **25 tests, 0 échec.** Double compilation : tests en `tsc` **nodenext** (imports `.js`) → `node --test build-test/` ; `src/app` **exclu**, validé par `next build` (routes `/`, `/_not-found`, `/manifest.webmanifest`) + **sonde HTTP locale** (statut, en-têtes, `X-Powered-By` absent, `data-theme`, classes `enistere-*`, CSS, 404).
- **Décision de version** : **Next.js 16 + React 19** retenus plutôt que Next 14/React 18 — Next 14.2.x portait 4 advisories *high* sans correctif en 14.x (le correctif npm était `next@16`). Next 16 + React 19 + **override npm `postcss ^8.5.15`** (neutralise l'advisory transitif `postcss < 8.5.10` embarqué par Next) ⇒ **`npm audit` : 0 vulnérabilité**. **Version unique de React (19.2.7)** dans tout le monorepo ; **Axios absent**.
- **UI Kit aligné sur React 19** (`@enistere/ui-kit` `0.1.0` → **`0.1.1`**) : devDependencies React/`@types/react`/`@testing-library/react` mises à jour, **peerDependency `react >=18` inchangée** (couvre 18 et 19). Les **64 tests** du UI Kit passent sous React 19 (**0 régression**). (Bump effectué à la demande, documenté ici, dans le README web et le checkpoint.)
- **Hors périmètre V1 (volontairement absent)** : Auth/BFF, cookies `HttpOnly`, CSRF, login/refresh/logout, middleware d'auth, TanStack Query, Zustand, **Axios**, Orval, routes Files/upload, Storybook, composants UI complexes, logique métier, OAuth/MFA, i18n complet, monitoring, **workflow CI**, **Dockerfile**, publication npm. **Aucun type d'API recopié manuellement, aucun appel réseau réel, aucune fausse authentification.**
- **Documentation Web Core** : `cores/web-nextjs/README.md` (périmètre, stack, structure, scripts, conventions d'import, env, thème, sécurité, tests), `docs/SECURITY.md`, `docs/ARCHITECTURE.md`. **Non-régression** vérifiée : API Core, UI Kit (64) et packages (`api-contracts` 11, `api-client-fetch` 29) verts. Checkpoint `docs/project-status/` mis à jour (Web Core → `STARTER_INITIALISE` ; UI Kit React 19 ; intégration partielle des paquets). Commit `feat(web-nextjs): initialize minimal starter`.
- Ajout des **premières primitives Web** au UI Kit `@enistere/ui-kit` (UI Kit 2, ADR-008/009/010) : **Button, Input, Label, Text, Spinner, VisuallyHidden** — React (peerDependency `>=18`), accessibles, **pilotées par les tokens** (variables `--enistere-*`, aucune valeur magique, aucun hex en CSS de composant), `forwardRef`, attributs natifs transmis, thème light/dark via `data-theme`, `prefers-reduced-motion`. **Aucun composant métier, pas de bibliothèque complète, pas de Tailwind/Radix/shadcn/NativeWind dans le package** (ADR-009/010 : ces stacks vivront dans les cores clients ; les tokens restent la source de vérité).
- CSS distribué agrégé `@enistere/ui-kit/styles.css` (tokens + styles des primitives, déterministe, sans reset/police globale) ; classes préfixées `enistere-*`, aucun style global destructif. Décision technique : **React + CSS natif/variables Enistere** (Option A), Tailwind/Radix reportés.
- Tests UI Kit : `node:test` + `global-jsdom` + Testing Library + jest-axe (DOM, interactions, accessibilité), tests CSS (no-hex/no-global/dark/reduced-motion/focus) et fixtures de compilation (React, futur Next.js sans Next, React Native). **64 tests, 100 % de couverture.** Preuve d'**installation locale** du tarball (rendu SSR, import CSS, types, **aucun React dupliqué**). `npm pack` propre (dist + generated + README, sans tests/fixtures). **`npm audit` 0 vulnérabilité** (runner node:test conservé pour éviter la chaîne Vite/esbuild). Packages API non régressés. Checkpoint mis à jour (UI Kit → **IMPLEMENTATION_PARTIELLE**).
- Initialisation du **starter UI Kit** `@enistere/ui-kit` (ADR-008) sous `cores/ui-kit/`, ajouté aux **npm workspaces** racine (Option A : `packages/*` + `cores/ui-kit`). Package **privé** (`0.1.0`), ESM, TypeScript strict. **Aucun composant, aucun framework UI** (ni React, ni React Native, ni Tailwind/Radix/shadcn/NativeWind, ni dépendance runtime). V1 = **design tokens uniquement**.
- Modèle de tokens **agnostique** : primitives (color, spacing, radius, typography, shadow structurée, motion, breakpoint, zIndex) → couleurs **sémantiques** (background/foreground/border/action/status/focus/overlay) résolues par **thèmes light/dark** (mêmes clés, références vers primitives). Unités canoniques documentées (nombres px, hex, shadow structurée, easing cubic-bézier).
- **Validation** des tokens (clés vides/invalides, `undefined`, hex invalide, nombres non finis, parité light/dark, références non résolues, **cycles**, nommage) et **génération déterministe** d'artefacts `generated/` : `tokens.json`, `typescript/tokens.ts`, `css/tokens.css` (variables `--enistere-*` kebab-case, light `:root` + dark `[data-theme="dark"]`, aucune date/secret). Commandes `tokens:validate`/`tokens:generate`/`tokens:check` ; deux générations = zéro diff.
- Exports `@enistere/ui-kit` (tokens/thèmes/types/validation), `@enistere/ui-kit/tokens`, `@enistere/ui-kit/tokens.css`, `@enistere/ui-kit/tokens.json`. Tests `node:test` (validation positive/négative, parité thèmes, déterminisme, preuve CSS, consommateur TS, fixture React Native) : **25 tests, 100 % de couverture** ; `npm pack --dry-run` propre (dist + generated + README, sans tests/build/src). Packages API existants non régressés ; `npm audit` 0 vulnérabilité. Checkpoint mis à jour (UI Kit → **STARTER_INITIALISE**).
- Établissement de la **baseline Git de référence** d'Enistere OS Foundation (ADR-001) : premier commit `chore: establish Enistere OS Foundation baseline` (`7dcb543`) sur `main`, **322 fichiers** versionnés, working tree propre. Complété `.gitignore` (`.next/`, `*.tsbuildinfo`, `*.tgz`, `*.pid`, `*.tmp`, **`.claude/`** = état runtime de l'agent). Versionnés intentionnellement : snapshot OpenAPI canonique, types générés `api-contracts`, migrations Prisma, `package-lock.json`, `.env.example` (placeholders). Aucun secret réel ni artefact lourd indexé ; validations packages + API (no-DB) **vertes** (e2e non rejouée). **Remote `origin` configuré, NON poussé** (décision humaine). Preuve : `docs/project-status/GIT_BASELINE_REPORT.md`. Checkpoint mis à jour (risque « aucun commit » → baseline locale créée).
- Création du **checkpoint documentaire officiel** d'Enistere OS Foundation (`docs/project-status/`) : `FOUNDATION_CURRENT_STATE.md` (photographie générale), `IMPLEMENTATION_MATRIX.md` (matrice par core/package/module + matrice détaillée API Core + contradictions + dette), `DECISIONS_REGISTER.md` (lecture rapide des ADR : statut ADR vs statut d'implémentation), `NEXT_ACTIONS.md` (prochaine action unique + ordre + critères + interdits), `SESSION_HANDOFF.md` (transfert de session compact) et `README.md` (rôles + protocoles début/fin de mission). Le README racine référence ce checkpoint (section « État du projet »).
- Analyse **basée sur le repository réel** (vérification fichier par fichier ; le code et les tests priment sur les rapports). Constats : API Core NestJS implémenté/testé/revu (IMPLEMENTATION_AVANCEE) ; packages `@enistere/api-contracts` + `@enistere/api-client-fetch` validés localement mais **non publiés et non intégrés** ; `cloud`/`web-nextjs`/`mobile-react-native`/`ui-kit` documentaires (spécification seule) ; `ai-core`/`api-spring`/`docs-core`/`mobile-flutter`/`quality-core`/`web-angular` vides ; CI/CD et conteneurisation absentes ; 18 ADR validés (017→038 non rédigés) ; **aucun commit Git** (signalé comme risque critique). Prochaine action recommandée : starter UI Kit minimal.
- **Aucune implémentation modifiée, aucun core créé, aucune dépendance ajoutée, aucun ADR ni spécification modifié** (mission strictement documentaire ; les incohérences sont documentées, pas corrigées).

- Création des **packages clients officiels** (ADR-016) sous `packages/` via **npm workspaces** racine (`"workspaces": ["packages/*"]` ; les cores restent autonomes) : **`@enistere/api-contracts`** et **`@enistere/api-client-fetch`**. Tous deux **privés / non publiés**, **non intégrés** aux cores. **Aucun hook TanStack Query, aucun adaptateur Next.js/SecureStore concret, aucun Axios, aucun Orval, aucun workflow CI.**
- `@enistere/api-contracts` : types OpenAPI **générés** depuis `cores/api-nestjs/openapi/openapi.json` (déterministe, `generate`/`generate:check`), **runtime-indépendant** (`sideEffects:false`, build types-only), exports `paths`/`components`/`operations` + aliases (`ApiSchemas`, `SchemaOf`, `ApiErrorResponse`, `OperationJsonRequestBody`, `OperationJsonResponse`). Aucune dépendance React/Fetch/Node au runtime.
- `@enistere/api-client-fetch` : client Fetch typé au-dessus d'`openapi-fetch` + `@enistere/api-contracts`. Façades `auth`/`files`, factory `createEnistereApiClient` (baseUrl obligatoire, `fetch` injectable, credentials web optionnels, `timeoutMs`, `createRequestId`, `AuthSessionAdapter` **asynchrone**), `ApiClientError` (whitelist + helpers `isUnauthorized/Forbidden/NotFound/Conflict/RateLimited`), **refresh single-flight + rejeu unique** (jamais sur 403/login/refresh, aucune boucle, nettoyage de session unique), **timeout** combinable à une annulation utilisateur, **X-Request-Id**, helpers multipart **Web et React Native** (jamais de `Content-Type` forcé). Indépendant de TanStack Query/React/React Native/Angular.
- Migration de la preuve en packages : **code exécutable du proof retiré** (`cores/api-nestjs/proofs/openapi-client/` réduit à un pointeur), **rapport conservé** (`docs/OPENAPI_CLIENT_PROOF.md`). Exclusion de `proofs/` du build de l'API (`tsconfig.build.json`).
- Tests des packages (`node:test`) : génération/formes du contrat ; wrapper (Bearer, credentials, X-Request-Id, ApiClientError, réseau, timeout, refresh single-flight, rejeu unique, 403, 204, fuite de token), multipart Web/RN, SingleFlight, `withTimeout`, **isolation SSR de deux clients**, sentinelles `PACKAGE_*_SECRET` jamais fuitées ; fixtures de compilation Node/navigateur/React Native (strict). **Preuve LIVE 16/16** ré-exécutée **avec le package officiel** contre une API réelle PostgreSQL + MinIO. `npm pack --dry-run` sans test/secret ; `npm audit` 0 vulnérabilité ; contrat canonique inchangé.
- Preuve technique **`openapi-typescript` + `openapi-fetch`** comme socle des clients TypeScript Enistere (ADR-016), isolée et **non publiable** (`cores/api-nestjs/proofs/openapi-client/`, `@enistere/openapi-client-proof`) : **aucun package publié, aucun client définitif, aucun hook TanStack Query, aucun Axios, aucun Orval**. Rapport permanent `cores/api-nestjs/docs/OPENAPI_CLIENT_PROOF.md` — **verdict : concluant**.
- Génération **déterministe** des types depuis le contrat canonique `openapi/openapi.json` (`npm run generate`, sortie `src/generated/schema.ts` jamais éditée à la main) + `npm run generate:check` (RC=1 sur divergence) ; deux générations = zéro diff ; les 14 `operationId`, enveloppes, erreurs, enums, `size` BigInt en chaîne et multipart circulent jusqu'au client typé.
- Wrapper Enistere expérimental au-dessus d'`openapi-fetch` : base URL, **Bearer** via adaptateur de session, `credentials` web optionnel, **timeout** (AbortController), corrélation **X-Request-Id**, normalisation d'erreur **`ApiClientError`** (http/réseau/timeout/réponse invalide/session expirée, **jamais de token**), **refresh coordonné single-flight + rejeu unique** (jamais sur 403, aucune boucle, nettoyage de session unique sur échec).
- Multipart **Web et React Native** sans modifier le code généré ni forcer le `Content-Type` (helper `createReactNativeUploadFormData`, assertion unique centralisée) ; exemples de compatibilité **Next.js** (factory par requête, aucun client SSR global partagé) et **React Native** (compilation stricte **sans lib DOM**, types Fetch/FormData via `@types/node`, sans Axios).
- Tests de la preuve (`node:test`, fetch mocké) : génération, compilation stricte, wrapper (Bearer/credentials/X-Request-Id/erreurs/réseau/timeout/refresh/single-flight/rejeu unique/403/204/fuite de token), multipart, sécurité ; et **preuve LIVE 16/16** du client (du build) contre une API réelle PostgreSQL + MinIO (login, profil, autorisations, upload, metadata, URL signée + GET HTTP réel, quarantaine/restauration, suppression 204, refresh, logout, 401/403/404/413, X-Request-Id). Script de provisionnement `scripts/proof-seed-user.ts` (préparation de comptes, sans import du code de preuve).
- Stabilisation du **contrat OpenAPI canonique** du API Core NestJS V1 (ADR-016), **avant** toute génération de client : le document devient la **source de vérité des API publiques**. Aucun client généré ; aucun outil OpenAPI externe (`openapi-typescript`/`openapi-fetch`/Orval/oasdiff/Spectral/Redoc) ajouté. Documentation `cores/api-nestjs/openapi/README.md`.
- Ajout des **DTO de sortie publics** (`*ResponseDto`, `PublicStoredFileDto`, `UserProfileResponseDto`…) et des décorateurs réutilisables d'enveloppe (`@ApiSuccessResponse`/`@ApiSuccessNoDataResponse`/`@ApiNoBodyResponse`) : enveloppe de succès `{ success, data, timestamp }` avec `data` **typé** (jamais un objet vide).
- Schématisation du **schéma d'erreur commun** `ApiErrorResponseDto` (`success`, `statusCode`, `message`, `errorCode`, `details?`, `path`, `timestamp`, `requestId?`) **aligné sur le runtime** ; ajout de `requestId` au corps d'erreur de l'`AllExceptionsFilter` (corrélation `X-Request-Id` documentée et présente dans la réponse d'erreur). Seules les erreurs réellement possibles sont documentées par endpoint.
- Stabilisation des **`operationId`** (`<domaine>_<actionCamelCase>` : `health_get`, `auth_login`, `files_upload`…), indépendants des noms de classes/méthodes (tout renommage = breaking), et des **tags** canoniques `Health`/`Auth`/`Files` sur l'ensemble des 14 opérations.
- Documentation explicite des **formats** : `uuid`, `date-time`, **`BigInt` public en chaîne décimale** (`type: string`, `pattern: ^[0-9]+$`), champ `binary` du **multipart** `POST /files` (avec `category` en enum), enums **fermées** ; sécurité Bearer requise sur les routes privées, absente sur les routes publiques.
- Ajout du **snapshot canonique versionné** `cores/api-nestjs/openapi/openapi.json`, régénéré depuis le code (`npm run openapi:generate`), **déterministe** (deux générations = zéro diff), et de `npm run openapi:check` (diff strict détectant toute divergence, RC=1, **sans outil externe**) ; un seul artefact temporaire racine reste ignoré.
- Ajout d'un **test de contrat e2e** (`test/openapi-contract.e2e-spec.ts`) : `operationId` exacts/uniques/non dérivés du contrôleur, tags canoniques, enveloppes/erreurs typées, formats, multipart, fraîcheur du snapshot, alignement runtime du corps d'erreur, et **absence de fuite** (aucun modèle Prisma, secret, `passwordHash`/`tokenHash`, clé de stockage, bucket, empreinte ni URL signée réelle).
- Création de l'ADR-016 : adoption d'un contrat OpenAPI canonique et versionné produit par le API Core, avec génération des contrats TypeScript (`openapi-typescript`) et d'un client Fetch (`openapi-fetch`), wrappers Enistere (auth/erreurs/timeout/refresh) et hooks TanStack Query maintenus séparément dans les cores. Orval en repli TypeScript ; adaptateur Angular et générateur Dart (Flutter) décidés par preuve ; `operationId` stables, DTO de sortie explicites, enveloppes/erreurs schématisées, breaking-change detection avant merge. Backlog ADR mis à jour (ADR-016 → Validé). Aucun code ni dépendance ajoutés ; aucun client généré.
- Implémentation du logging structuré (ADR-040) : preuve de compatibilité `nestjs-pino` réalisée (`cores/api-nestjs/docs/STRUCTURED_LOGGING_COMPATIBILITY_PROOF.md`) puis adoption de la solution de repli officielle **Pino direct** (`nestjs-pino` compatible NestJS 11 mais inadapté : auto-log d'URL brute, request id propre, destination globale).
- Logs JSON structurés sur stdout (HTTP) / stderr (CLI) via `AppLogger` (moteur Pino), avec schéma commun (timestamp ISO, level, context, service, environment, requestId, route normalisée, statusCode, durationMs, userId/sessionId).
- Contexte de corrélation par requête (`AsyncLocalStorage`) réutilisant `X-Request-Id` (un seul identifiant), enrichi de `userId`/`sessionId` après authentification ; log HTTP unique de fin de requête (route normalisée, jamais de body/query/URL signée).
- Redaction centralisée (clés sensibles à toute profondeur, URLs signées, nettoyage des chaînes de connexion/bearer) et sérialiseur d'erreur par liste blanche (jamais l'objet AWS/Prisma complet) ; `AuditLog` reste séparé des logs techniques.
- Convention CLI stdout (résultat machine JSON) / stderr (logs techniques) ; configuration `LOG_LEVEL`/`LOG_PRETTY`/`LOG_HTTP_ENABLED`/`LOG_HEALTH_SUCCESS_ENABLED`/`SERVICE_NAME` (validée). Tests unitaires + e2e (incl. redaction) ; collecte/Loki/Grafana déléguées au Cloud Core.
- Création de l'ADR-040 : adoption de Pino comme moteur de logging structuré du API Core NestJS V1, avec intégration `nestjs-pino` conditionnée à une preuve de compatibilité NestJS 11 (repli officiel : intégration Pino directe). Logs JSON sur stdout/stderr, collecte/Loki/Grafana côté Cloud Core, `AuditLog` séparé des logs techniques ; backlog ADR mis à jour. Aucun code ni dépendance ajoutés.
- Revue d'étape globale et durcissement transverse du starter API Core NestJS V1 (rapports permanents `cores/api-nestjs/docs/API_CORE_V1_REVIEW.md`, `API_CORE_V1_IMPLEMENTATION_STATUS.md`, `API_CORE_V1_NEXT_ROADMAP.md`).
- Durcissement HTTP : Helmet (en-têtes de sécurité), `X-Powered-By` désactivé, limites explicites des body parsers (`JSON_BODY_LIMIT`/`URL_ENCODED_BODY_LIMIT`), `trust proxy` configurable (`TRUST_PROXY_HOPS`), CORS strict (rejet de `*` avec credentials, méthodes/headers minimisés).
- Ajout d'un identifiant de corrélation de requête `X-Request-Id` (validé-ou-généré, anti-injection de logs) exposé en réponse.
- Ajout des sondes `GET /health/live` (liveness) et `GET /health/ready` (readiness PostgreSQL, 503 générique si indisponible).
- Ajout des commandes `npm run test:cov` (couverture) et `npm run openapi:generate` (artefact OpenAPI contrôlé, gitignoré, sans secret ni modèle interne) en préparation d'ADR-016.
- Revue et durcissement du bloc Files API Core NestJS V1 (rapport permanent `cores/api-nestjs/docs/FILES_REVIEW.md`) : architecture, sécurité, transitions, réconciliation, données sensibles validées (aucune fuite), architectures futures antivirus/média/streaming documentées.
- Ajout des quotas par propriétaire (`FILES_OWNER_MAX_ACTIVE_FILES`/`FILES_OWNER_MAX_TOTAL_BYTES`, `0` = illimité) vérifiés **atomiquement** à la création via un verrou advisory transactionnel par propriétaire (aucun dépassement sous concurrence) ; erreurs `409 FILE_COUNT_QUOTA_EXCEEDED`/`FILE_STORAGE_QUOTA_EXCEEDED`, audit `FILE_QUOTA_EXCEEDED`.
- Ajout d'un verrou de maintenance PostgreSQL (`MaintenanceLockService`, advisory lock) rendant réconciliation/cleanup/purge **mutuellement exclusifs** (seconde exécution refusée, sans Redis ni impact API).
- Ajout de la purge physique contrôlée des métadonnées `files:purge-metadata` (lignes `DELETED`/`REJECTED` au-delà de la rétention et **sans objet présent** ; `AuditLog` jamais supprimés ; dry-run par défaut, sous verrou).
- Ajout des tests de durcissement (quota concurrent, verrou advisory deux sessions, purge, détection ≠ antivirus) ; documentation explicite « détection de signatures ≠ antivirus ».
- Ajout de la suppression applicative `DELETE /files/:id` (permission `files.delete` + ownership) : suppression de l'objet S3 **puis** marquage `DELETED`, **idempotente**, anti-énumération.
- Gestion des incohérences de suppression : objet déjà absent traité comme objectif atteint (audité) ; échec DB après suppression S3 → audit critique (`FILE_DATABASE_FINALIZATION_FAILED`).
- Ajout de la quarantaine **administrative** `POST /files/:id/quarantine` et `POST /files/:id/restore` (permissions `files.quarantine`/`files.restore`, sans ownership ; raison bornée) bloquant tout accès/URL signée.
- Ajout du service de réconciliation **PostgreSQL ↔ S3** par comparaison directe (jamais les seuls audits) : ligne incohérente, `PENDING` abandonnés, objets orphelins, listing scopé par préfixe et borné.
- Traitement des `PENDING` expirés (marqués `REJECTED`) et détection/suppression prudente des objets orphelins (âge minimal requis).
- Ajout des commandes CLI contrôlées `files:reconcile` et `files:cleanup-pending` (**dry-run par défaut**, mode `--apply`, sans scheduler embarqué — déclenchement délégué au Cloud Core).
- Ajout de la table centralisée des transitions de cycle de vie et d'updates conditionnels (anti-concurrence : suppression idempotente, la suppression l'emporte sur la quarantaine).
- Politiques de rétention configurables (`FILES_PENDING_EXPIRATION_SECONDS`, `FILES_REJECTED_RETENTION_SECONDS`, `FILES_DELETED_METADATA_RETENTION_SECONDS`, `FILES_ORPHAN_MIN_AGE_SECONDS`, `FILES_RECONCILIATION_BATCH_SIZE`) ; pas de suppression physique des lignes en V1.
- Ajout des permissions structurelles `files.quarantine`/`files.restore` au seed et fondations de quota (usage actif par propriétaire, sans application stricte).
- Migration `files_lifecycle` (`quarantinedAt`, `quarantineReason`, `deletionRequestedAt`, `storageDeletedAt`) et extension `ObjectStorage.listObjects` (pagination, préfixe).
- Ajout des tests Upload 4 (unitaires, et e2e PostgreSQL+MinIO réels : suppression/idempotence, quarantaine/restauration, réconciliation dry-run/apply, orphelins, `PENDING` expirés, concurrence).
- Ajout de la consultation sécurisée des métadonnées fichier `GET /files/:id` (permission `files.read`, ownership, 404 anti-énumération, aucun détail interne).
- Ajout des URLs signées de lecture courtes `POST /files/:id/download-url` (`@aws-sdk/s3-request-presigner`) : permission `files.download` **+ ownership**, durée bornée serveur (30..900 s), `Cache-Control: no-store`, URL jamais journalisée ni persistée.
- Ajout de la permission structurelle `files.download` au seed (idempotent ; `administrator` la reçoit, `user` non sans décision explicite).
- Vérification d'existence de l'objet avant signature et restriction aux fichiers `VALIDATED` lisibles (statuts/visibilités non téléchargeables refusés) ; objet manquant → 503 générique + audit `FILE_STORAGE_OBJECT_MISSING`.
- `Content-Disposition: attachment` nettoyé (anti-injection CR/LF/guillemets, repli ASCII + RFC 5987) et `Content-Type` imposé depuis le MIME réel enregistré.
- Audit de la génération d'accès (`FILE_DOWNLOAD_URL_ISSUED`/`FILE_DOWNLOAD_URL_DENIED`) sans jamais journaliser l'URL signée ni de donnée de stockage.
- Throttling dédié de la génération d'URLs de téléchargement (`download`, distinct de l'upload).
- Ajout des tests Upload 3 (unitaires, et e2e PostgreSQL+MinIO réels : téléchargement HTTP réel via l'URL signée, expiration, objet manquant, bucket privé, anti-énumération).
- Intégration du stockage objet S3-compatible (`@aws-sdk/client-s3`, MinIO/AWS S3) via l'abstraction `ObjectStorage`.
- Ajout de l'upload multipart sécurisé `POST /files` (permission `files.upload`, throttling dédié, compatible `fetch + FormData`).
- Inspection du contenu réel par signatures binaires (JPEG/PNG/GIF/WebP/PDF) ; le MIME déclaré n'est jamais une preuve.
- Calcul du checksum SHA-256, écriture dans un bucket privé et orchestration compensatoire DB/S3 (objet supprimé si la finalisation échoue, détection d'orphelin sinon).
- Ajout des tests Upload 2 (unitaires, intégration MinIO et e2e PostgreSQL+MinIO jetables).
- Ajout des fondations `FilesModule` (Upload 1) : domaine fichier générique, privé par défaut, indépendant du fournisseur de stockage.
- Ajout du modèle Prisma `StoredFile` (taille BigInt, propriétaire `onDelete: SetNull`, `storageKey` unique) et de la migration `files_foundation`.
- Ajout des enums `FileStatus`/`FileVisibility`/`FileCategory`, des contrats internes/publics et des DTO fichiers.
- Ajout de l'abstraction de stockage `ObjectStorage` (sans implémentation S3 réelle), du `StorageKeyGenerator` et de la `FileValidationPolicy` déclarative.
- Ajout des permissions structurelles `files.read`/`files.upload`/`files.delete` au seed (idempotent).
- Ajout des tests Upload 1 (unitaires et intégration Prisma).
- Revue et durcissement du bloc Auth/RBAC API Core NestJS V1 (rapport `cores/api-nestjs/docs/AUTH_RBAC_REVIEW.md` ; login à temps de réponse uniforme pour les comptes inactifs/suspendus ; couverture de tests renforcée).
- Ajout des modèles RBAC Prisma `Role` et `Permission` (convention `resource.action`) et de la migration `auth5_rbac`.
- Ajout des associations RBAC explicites `UserRole` et `RolePermission` (clés composites, index, cascades).
- Ajout du `RolesModule` et du `PermissionsModule` (services internes : création, affectation, calcul des permissions effectives).
- Ajout des décorateurs `@Roles()` (logique OR) et `@Permissions()` (logique AND).
- Ajout des guards d'autorisation `RolesGuard` et `PermissionsGuard` (globaux conditionnels, deny by default, 403 générique).
- Ajout du contrat d'autorisation utilisateur chargé côté serveur (jamais dans le JWT) et de l'endpoint `GET /auth/me/authorization`.
- Ajout d'un seed RBAC structurel idempotent et optionnel.
- Tests Auth 5 (unitaires, intégration, e2e) : rôles, permissions, guards, ordre, refus 403, prise en compte immédiate des changements de droits.
- Ajout de la stratégie Passport JWT (access token) et du `JwtAuthGuard` (validation signature, expiration, claims et session `sid`).
- Protection privée par défaut via guard global et décorateur `@Public()` (health, login, refresh, logout publics).
- Ajout du décorateur `@CurrentUser()`, du contrat `AuthenticatedPrincipal` et de l'endpoint protégé `GET /auth/me`.
- Vérification serveur de la session à chaque requête protégée : révocation/rotation/logout invalident immédiatement les access tokens liés.
- Tests Auth 4 (unitaires et e2e) : protection par défaut, `/auth/me`, refus après logout/rotation/réutilisation/suspension.
- Ajout du refresh `POST /auth/refresh` avec rotation atomique (transaction Prisma) des refresh tokens.
- Détection de réutilisation d'un refresh token et révocation de toute la famille de sessions associée.
- Ajout du logout `POST /auth/logout` idempotent et non révélateur (révocation de la famille courante).
- Ajout d'un `AuditModule` persistant et des audit logs de sécurité d'authentification (refresh, réutilisation, logout, login).
- Ajout du rate limiting dédié au refresh, distinct de celui du login.
- Migration `auth3_rotation_and_audit` (enum `SessionRevocationReason`, champs de rotation, table `audit_logs`).
- Tests Auth 3 (unitaires, intégration, e2e) incluant rotation, réutilisation, logout idempotent et concurrence.
- Intégration d'Argon2id (`@node-rs/argon2`) et d'un service `PasswordHasher` centralisé pour le API Core NestJS.
- Ajout du login `POST /auth/login` : émission d'un access token JWT court et d'un refresh token opaque révocable.
- Création d'une `RefreshSession` sécurisée stockant uniquement l'empreinte HMAC-SHA-256 du refresh token (jamais le token brut).
- Ajout du rate limiting du login (`@nestjs/throttler`) et d'un script de benchmark Argon2id (`npm run benchmark:argon2`).
- Tests Auth 2 (unitaires, intégration et e2e) du login, des tokens, du hachage et des sessions.
- Création de l'ADR-039 adoptant Argon2id comme standard de hachage des mots de passe du API Core NestJS V1 (bcrypt en exception de compatibilité/migration).
- Centralisation du bootstrap applicatif NestJS dans un helper `configureApp` réutilisé par `main.ts` et les tests.
- Ajout des fondations de persistance d'authentification : modèles Prisma `User` et `RefreshSession` (révocable, support de rotation) et première migration `init_auth_foundations`.
- Création du `UsersModule` interne minimal (service, repository, contrats internes, validation ADR-003).
- Préparation structurelle de l'`AuthModule` (import `UsersModule`, cadrage des étapes Auth 2 à Auth 5, emplacement du futur hashing).
- Revue et ajustement du starter API Core NestJS V1 minimal.
- Initialisation du starter API Core NestJS V1 minimal.
- Création de la revue finale des ADR bloquants V1.
- Création de l'ADR-014 sur la stratégie registry images.
- Création de l'ADR-013 sur la stratégie CI/CD V1.
- Création de l'ADR-015 sur la stratégie de stockage mobile sécurisé.
- Création de l'ADR-007 sur la stratégie upload MinIO/S3 et contrats fichiers.
- Création de l'ADR-006 sur RBAC et permissions fines.
- Création de l'ADR-005 sur la sécurité cookies web et CSRF.
- Création de l'ADR-004 sur la stratégie auth/session multi-client.
- Création de l'ADR-003 sur la stratégie de validation API NestJS.
- Création de l'ADR-002 sur le choix ORM API NestJS Prisma vs TypeORM.
- Création de l'ADR-012 sur la stratégie server state web/mobile.
- Création de l'ADR-011 sur la stratégie Client HTTP fetch vs Axios.
- Création de l'ADR-010 sur la stack UI React Native.
- Création de l'ADR-009 sur la stack UI Web.
- Création de l'ADR-008 sur la stratégie des design tokens UI Kit.
- Création de l'ADR-001 sur l'organisation Git monorepo hybride.
- Création du backlog ADR après revue globale des 5 cores prioritaires.
- Revue et ajustement de la spécification UI Kit.
- Création de la spécification initiale du UI Kit.
- Revue et ajustement de la spécification Web Core Next.js.
- Création de la spécification initiale du Web Core Next.js.
- Revue et ajustement de la spécification Mobile Core React Native.
- Création de la spécification initiale du Mobile Core React Native.
- Revue et ajustement de la spécification Cloud Core.
- Création de la spécification initiale du Cloud Core.
- Revue et ajustement de la spécification API Core NestJS.
- Création de la spécification initiale du API Core NestJS.
- Création des prompts IA minimaux de Phase 0.
- Préparation de la génération contrôlée des `CORE_SPECIFICATION.md`.
- Initialisation de la structure globale du repository.
- Ajout des emplacements pour la stratégie, la documentation, les cores, les prompts, les outils, les templates et les exemples.
