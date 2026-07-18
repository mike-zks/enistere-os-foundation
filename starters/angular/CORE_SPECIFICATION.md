# Web Core Angular — Spécification du Core

## 1. Résumé exécutif

Le **Web Core Angular** définit le socle web Angular de référence pour les futures interfaces Enistere de type backoffice, dashboard administratif, SI interne, portail opérateur et outil métier complexe.

Il doit fournir une base modulaire, sécurisée, accessible, maintenable et réutilisable, sans imposer de logique métier propre à un projet dérivé.

Cette spécification est documentaire. Elle ne crée aucun projet Angular, `package.json`, `angular.json`, dossier `src/`, composant réel, route réelle, dépendance npm ou code applicatif.

**Décision UI fondatrice** : ADR-035 — Angular Material (CDK + Material 3) contrôlé par tokens Enistere + composants maison ciblés.

---

## 2. Rôle du core

Le rôle du Web Core Angular est de cadrer la base commune des applications web Angular Enistere.

Il doit :

- standardiser l'architecture Angular standalone (modules, routing, guards, intercepteurs) ;
- sécuriser l'authentification, les sessions, les permissions et les appels API ;
- appliquer les tokens Enistere (ADR-008) via Angular Material 3 (ADR-035) ;
- fournir des composants maison Foundation alignés sur les tokens et l'accessibilité ;
- standardiser Reactive Forms (§20 `08_STANDARDS.md`) pour tous les formulaires ;
- préparer l'intégration avec API Core NestJS, API Core Spring Boot, Cloud Core, UI Kit, Quality Core et Docs Core ;
- rester cohérent avec les autres cores V3 (Web Next.js, Mobile RN, Mobile Flutter) sans dupliquer leur implémentation ;
- permettre une montée progressive vers un starter production-ready.

---

## 3. Objectifs du Web Core Angular

- Fournir un starter Angular standalone minimal puis production-ready à terme.
- Utiliser Angular (version stable LTS), TypeScript strict et la compilation standalone comme base cible.
- Standardiser Angular Router pour la navigation et les routes protégées par guards fonctionnels.
- Standardiser Reactive Forms + Angular Material form fields pour tous les formulaires.
- Sécuriser l'auth flow, la gestion des tokens, les permissions et la session expirée.
- Standardiser HttpClient + intercepteurs pour les appels API Core.
- Appliquer les tokens Enistere via `mat.define-theme()` + CSS custom properties `--mat-*` (ADR-035).
- Exposer des états UI standardisés : loading, empty, error, success (analogues aux autres cores).
- Préparer l'accessibilité via `@angular/cdk/a11y` (FocusTrap, LiveAnnouncer, FocusMonitor, ListKeyManager).
- Rester générique, sans logique métier spécifique à Kivvoo, Bailo, RFashion, Vox Pulse, CIVIS ID ou tout autre projet dérivé.

---

## 4. Problèmes à résoudre

Le core doit éviter :

- une nouvelle structure Angular à chaque projet backoffice ;
- des auth flows divergents ou des tokens stockés en `localStorage` ;
- une identité Material 3 par défaut contournant les tokens Enistere (ADR-035) ;
- des formulaires incohérents ou non standardisés (Template-driven au lieu de Reactive Forms) ;
- des composants avec logique métier ;
- une accessibilité insuffisante (focus piégé dans les modales, annonces manquantes, navigation clavier absente) ;
- un couplage à PrimeNG ou à shadcn/Radix (bibliothèques inadaptées côté Angular) ;
- une divergence avec les tokens ADR-008 partagés entre plateformes.

---

## 5. Périmètre fonctionnel

Le Web Core Angular couvre :

- structure Angular standalone (feature-first) ;
- layouts standards (public, auth, dashboard, admin optionnel) ;
- routing Angular protégé (routes publiques, routes auth, routes privées) ;
- guards fonctionnels Angular 17+ (`CanActivateFn`, `CanMatchFn`) ;
- auth flow (login, logout, refresh, session restore, session expirée) ;
- gestion tokens (access en mémoire, refresh via stratégie à définir) ;
- HttpClient centralisé + intercepteurs (auth, refresh, erreurs, logging) ;
- Reactive Forms + Angular Material form fields ;
- state management Angular Signals (état local) + RxJS services (server state) ;
- thème Material 3 Enistere (ADR-035 — tokens Enistere, `mat.define-theme()` contrôlé) ;
- composants maison Enistere Angular (LoadingState, EmptyState, ErrorState, SuccessState) ;
- autorisation et permissions (RBAC aligné API Core, affichage conditionnel) ;
- accessibilité via `@angular/cdk/a11y` ;
- testing setup Angular (TestBed + `@angular/cdk/testing`) ;
- configuration par environnement ;
- observabilité minimale (logger sans secrets).

---

## 6. Hors périmètre (de cette mission)

Le core ne doit pas contenir dans cette mission :

- projet Angular généré, `package.json`, `angular.json`, code TypeScript Angular, composant réel ou test ;
- dépendance npm installée ;
- workflow CI Angular ;
- décision définitive Orval Angular vs OpenAPI Generator `typescript-angular` — voir §32 (ADR-016 §F) ;
- décision définitive Jest vs Jasmine/Karma — voir §32 ;
- décision définitive Playwright vs Cypress pour E2E — voir §32 ;
- décision définitive TanStack Query Angular — voir §32 ;
- décision NgRx (état global complexe, réservé aux projets dérivés) ;
- décision store de préférences non sensibles persistantes ;
- décision session cookies vs token en mémoire seule (voir §32 et §17) ;
- export de tokens UI Kit en format Angular/SCSS ;
- surface Angular de `@enistere/ui-kit` — mission UI Kit V3 ;
- logique métier spécifique à un produit.

---

## 7. Architecture cible

L'architecture cible adopte une structure **feature-first** avec séparation stricte des couches, cohérente avec les standards Angular 17+ standalone.

### 7.1 Couches

```txt
Couche Présentation  — Composants Angular (standalone), pages, layouts
Couche Application   — Services applicatifs, stores Signals, guards, intercepteurs
Couche Domaine       — Types, interfaces, contracts (pas de logique framework)
Couche Infrastructure — HttpClient, adapters API, logger, config
```

### 7.2 Principes

- Standalone components par défaut (`standalone: true` sur chaque composant).
- TypeScript strict (`strict: true` dans `tsconfig.json`).
- Types explicites sur toutes les interfaces publiques.
- Reactive Forms obligatoires — pas de Template-driven forms sauf cas trivial auto-contenu.
- Services injectables via `providedIn: 'root'` ou provider au niveau feature.
- Gestion d'erreurs explicite : types d'erreur définis, pas de swallow silencieux.
- Aucun secret dans le code, les assets ou les variables d'environnement publiques.
- Aucun appel API dans les composants (via service uniquement).

### 7.3 Conventions Angular/TypeScript

- Fichiers en `kebab-case` (conventions Angular CLI).
- Classes et interfaces en `PascalCase`.
- Variables et méthodes en `camelCase`.
- Constantes en `UPPER_SNAKE_CASE`.
- Préférer `const` et `readonly` sur les propriétés immuables.
- `async`/`await` pour les opérations asynchrones ponctuelles ; RxJS Observables pour les flux.
- `signal()` / `computed()` / `effect()` pour les états locaux réactifs (Angular Signals).
- Imports organisés : `@angular/core`, `@angular/material`, `@angular/cdk`, bibliothèques tierces, code interne.

---

## 8. Structure cible du futur starter

Structure indicative du futur starter (non créée dans cette mission) :

```txt
starters/angular/
├── CORE_SPECIFICATION.md
├── README.md
├── package.json            # Angular + CDK + Material — mission Angular 2+
├── angular.json
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.spec.json
├── src/
│   ├── main.ts             # bootstrapApplication() + providers globaux
│   ├── app.config.ts       # ApplicationConfig : router, HttpClient, CDK, Material
│   ├── app.routes.ts       # routes Angular top-level avec lazy loading
│   ├── styles.scss         # import @angular/material, tokens Enistere, global
│   ├── core/
│   │   ├── api/            # HttpClient factory, base URL, error mapping
│   │   ├── auth/           # AuthService, AuthGuard, TokenStore
│   │   ├── config/         # AppConfig, environment
│   │   ├── errors/         # AppError, ErrorMapper, error interceptor
│   │   ├── interceptors/   # AuthInterceptor, RefreshInterceptor, LogInterceptor
│   │   ├── logger/         # AppLogger interface, redaction, sink
│   │   ├── permissions/    # PermissionService, PermissionDirective
│   │   └── theme/          # thème Material 3 Enistere, tokens SCSS
│   ├── features/           # modules fonctionnels feature-first
│   │   ├── auth/           # login, logout, forgot-password
│   │   ├── dashboard/      # shell, layout, navigation
│   │   └── files/          # exemple — adapté par projet dérivé
│   └── shared/
│       ├── components/     # composants Foundation Enistere Angular
│       │   ├── loading-state/
│       │   ├── empty-state/
│       │   ├── error-state/
│       │   └── success-state/
│       ├── directives/     # PermissionDirective, AutoFocusDirective
│       ├── pipes/          # pipes utilitaires génériques
│       └── utils/          # helpers purs sans dépendance Angular
├── test/
│   ├── unit/
│   └── integration/
└── e2e/                    # Cypress ou Playwright — décision §32
```

Cette structure est cible. Elle ne doit pas être créée pendant cette mission.

---

## 9. Modules obligatoires V1

### 9.1 Routing — Angular Router (standalone)

- Routes publiques (`/login`, `/`, `not-found`) et protégées (`/dashboard/**`, `/admin/**`).
- Guards fonctionnels (`CanActivateFn`, `CanMatchFn`) basés sur l'état `AuthService`.
- Lazy loading des features : `loadChildren(() => import('./features/dashboard/...'))`.
- Redirection post-login vers `returnUrl` (interne uniquement — anti open-redirect).
- Gestion session expirée : redirection vers `/login?returnUrl=...` + conservation de l'URL.
- `RouterStateSnapshot` pour la récupération du `returnUrl` dans les guards.
- Routes nommées via constantes (`AppRoutes` object avec `static readonly`).
- Aucune logique métier dans les définitions de routes.

**Justification** : Angular Router est la solution officielle. Les guards fonctionnels Angular 17+ remplacent les guards basés sur classes et s'intègrent naturellement avec Angular Signals et l'inject DI fonctionnel.

### 9.2 State management — Angular Signals

- `signal()` / `computed()` / `effect()` pour les états locaux réactifs.
- `AuthService` basé sur Signals : état `loading` / `authenticated` / `unauthenticated` / `refreshing` / `expired`.
- Signals comme source de vérité locale pour les états UI non-serveur.
- RxJS Observables pour les flux asynchrones complexes et les appels HttpClient.
- NgRx réservé aux projets dérivés à état global complexe (non imposé dans le core — voir §32).
- Purge des états sensibles au logout.

**Justification** : Angular Signals (Angular 17+) sont le mécanisme de réactivité officiel et natif. Ils remplacent progressivement les patterns ChangeDetection complexes et s'intègrent avec ZoneLess future. NgRx reste disponible mais ajoute de la complexité pour des patterns Foundation simples.

### 9.3 Server state — RxJS services

- Services Angular (`@Injectable`) avec Observables RxJS pour les appels API.
- `catchError` / `retry` contrôlé / `finalize` pour la gestion d'erreurs et de loading.
- Cache RxJS simple (`shareReplay(1)`) pour les données stables (profil, permissions).
- Invalidation au logout : `Subject.complete()` + recréation du service ou `BehaviorSubject.next(null)`.
- `AsyncPipe` dans les templates pour la souscription contrôlée (unsubscription automatique).
- TanStack Query Angular évalué par preuve dans les missions Angular 2+ (voir §32).

**Justification** : RxJS est le système de réactivité historique d'Angular, intégré dans HttpClient, le Router et les guards. Il fournit les primitives nécessaires sans dépendance additionnelle.

### 9.4 Client HTTP — HttpClient + intercepteurs

- `provideHttpClient(withInterceptors([...]))` dans `app.config.ts`.
- `AuthInterceptor` (fonctionnel) : injection du Bearer token depuis `AuthService`.
- `RefreshInterceptor` (fonctionnel) : détection 401 → refresh coalescé → retry → logout.
- `ErrorInterceptor` (fonctionnel) : mapping `HttpErrorResponse` vers `AppError` typé.
- `LogInterceptor` (fonctionnel) : logs avec redaction (pas de body, pas de token).
- Timeout via `HttpContextToken` ou `RxJS timeout` opérateur.
- Base URL injectée via `APP_BASE_URL` token (environment-driven).
- Aucun appel `HttpClient` direct dans les composants (via service uniquement).

**Justification** : `HttpClient` est le client HTTP officiel Angular avec DI, intercepteurs fonctionnels et support natif des Observables. Il est requis pour l'intégration des intercepteurs auth/refresh sans surcoût.

### 9.5 Formulaires — Reactive Forms (obligatoire)

- `ReactiveFormsModule` ou `FormBuilder` injecté dans les composants standalone.
- `FormGroup` / `FormControl` / `FormArray` avec types stricts (`FormGroup<{...}>`).
- Validation synchrone via `Validators` Angular (`required`, `minLength`, `email`, etc.).
- Validation asynchrone via `AsyncValidatorFn` pour les vérifications serveur.
- Angular Material form fields (`mat-form-field`, `mat-label`, `mat-error`, `mat-hint`).
- Affichage des erreurs via `mat-error` lié à `hasError()` / `getError()`.
- Submit disabled pendant le chargement (Signals ou `formGroup.disabled`).
- Confirmation pour les actions destructives (dialog de confirmation).
- Template-driven forms tolérés uniquement pour des formulaires triviaux auto-contenus de faible complexité (cas documenté et justifié).

**Justification** : standard `08_STANDARDS.md §20`, `06_DEPENDENCY_STRATEGY.md §9.5`. Reactive Forms offrent un contrôle typé, testable et cohérent avec Angular Material form fields.

### 9.6 Thème — Material 3 contrôlé par tokens Enistere (ADR-035)

- `@include mat.theme(...)` ou `mat.define-theme()` avec des palettes dérivées des couleurs hex Enistere.
- CSS custom properties `--mat-sys-primary`, `--mat-sys-secondary`, `--mat-sys-error`, `--mat-sys-surface` etc. pilotées depuis les tokens `ui-kit/tokens/`.
- Variables `--enistere-*` alignées sur les valeurs tokenisées du UI Kit (couleurs, typographie, radius, spacing).
- Dark/light mode pilotés par le même jeu de tokens que le UI Kit Web React.
- `@angular/material/prebuilt-themes` **non utilisé** — thème généré entièrement depuis les tokens Enistere.
- Aucun style Material 3 par défaut non gouverné.

Règle : **tokens Enistere d'abord, Material 3 comme moteur, composants maison seulement si écart réel.**

### 9.7 Composants maison Enistere Angular

Composants Foundation obligatoires construits sur les primitives CDK :

- `EnistereLoadingStateComponent` — spinner/squelette générique.
- `EnistereEmptyStateComponent(title, description?, action?)` — état vide.
- `EnistereErrorStateComponent(title, description?, onRetry?)` — état erreur + retry optionnel.
- `EnistereSuccessStateComponent(title, description?, action?)` — état succès.

Ces composants :

- utilisent `@angular/cdk` pour les comportements (a11y, focus) ;
- consomment les tokens Enistere via CSS custom properties ;
- exposent des APIs Angular idiomatiques (inputs typés, outputs, standalone) ;
- sont testés via `@angular/cdk/testing` et `TestBed` ;
- ne contiennent aucune logique métier.

### 9.8 Auth flow

- `AuthService` (signal-based) : états `loading` / `authenticated` / `unauthenticated` / `refreshing` / `expired`.
- `login(credentials)` → accès token en mémoire (`signal<string | null>`) + stratégie refresh (§17).
- `logout()` → purge mémoire + invalidation côté API + navigation vers `/login`.
- `refreshSession()` → coalescé (une seule requête simultanée) + retry une fois + logout si échec.
- `restoreSession()` au démarrage — tente le refresh si token disponible.
- `AuthGuard` fonctionnel abonné au signal `AuthService.state`.
- Compatibilité API Core NestJS `/api/v1/auth/login` / `/api/v1/auth/refresh` / `/api/v1/auth/logout`.
- Aucun token dans les logs.

### 9.9 Autorisation et permissions (RBAC)

- `PermissionService` : `hasRole(role)`, `hasAnyRole(roles[])`, `hasPermission(permission)`, `hasAllPermissions(permissions[])`.
- Aligné avec API Core NestJS (ADR-006) — helpers OR/AND sans wildcard.
- `PermissionDirective` (`*enisterePermission`) : affichage conditionnel basé sur les permissions.
- Guard fonctionnel `CanActivateFn` pour les routes protégées par role/permission.
- L'API Core reste l'autorité finale sur toute décision d'autorisation.
- Permissions chargées depuis `GET /api/v1/auth/authorization` au login et sur refresh.
- Affichage conditionnel côté Angular = aide UX uniquement — ne remplace pas la vérification backend.

### 9.10 Upload fichiers

- `POST /api/v1/files/upload` via `HttpClient` avec `FormData`.
- `Content-Type` laissé libre (Angular ne force pas le boundary multipart).
- Aucun fichier/URL signée/token en cache de service ou en log.
- Validation taille/MIME côté client = pré-check UX — backend reste l'autorité.
- Retry sur 401 via `RefreshInterceptor` : `FormData` reconstruit au retry (pas de rejeu de stream consommé).
- Erreurs typées : 413 (trop volumineux), 415 (type non supporté), 429 (rate limit).
- Retourne uniquement les métadonnées publiques (`PublicStoredFileDto`).

### 9.11 Logger / observabilité

- `AppLogger` service injecté (interface) : `debug`/`info`/`warn`/`error`.
- **Redaction centrale** (pattern identique Mobile RN 8 / Flutter 25) : Bearer/JWT/tokens/URL signées/emails/PII redactés avant tout sink.
- Aucun transport réseau ou persistance de logs en V1 Foundation (sink console).
- `safeErrorFields(AppError)` : corrélation + code d'erreur — jamais message brut sensible.
- Logs structurés : `{level, message, timestamp, requestId?}`.
- Aucun body de requête/réponse, token, URL signée ou PII dans les logs.

### 9.12 Configuration par environnement

- `environment.ts` et `environment.prod.ts` avec `apiBaseUrl`, `logLevel`, `production` flag.
- `APP_BASE_URL` injection token (`InjectionToken<string>`) pour l'injecter dans les services sans dépendance directe à `environment`.
- `AppConfig` interface typée.
- Aucune clé secrète dans les fichiers environment (côté client Angular = accessible au navigateur).
- Séparation `dev` / `staging` / `prod` via `--configuration` Angular CLI.

### 9.13 Testing setup

- `TestBed` Angular comme base pour les tests unitaires et d'intégration composants.
- `@angular/cdk/testing` harness pour tester les composants Angular Material sans navigateur réel.
- `@angular/core/testing` : `fakeAsync`, `tick`, `flush` pour les tests asynchrones.
- `HttpClientTestingModule` (ou `provideHttpClientTesting()`) pour les tests de services HTTP.
- Tests unitaires : AuthService, PermissionService, intercepteurs, guards, utils.
- Tests composants : états loading/empty/error/success, formulaires Reactive Forms, permissions.
- Tests E2E : décision Cypress vs Playwright réservée au starter (voir §32).
- Couverture obligatoire : auth, tokens, upload, routing protégé, formulaires critiques.

---

## 10. Modules optionnels

Activables selon projet :

- Notifications (MatSnackBar ou wrapper CDK Overlay — module in-app).
- Data table avancée (MatTable + CDK VirtualScroll pour grands volumes).
- Dashboard layout avancé (sidebar, breadcrumbs, zone admin).
- Charts (bibliothèque à choisir par ADR selon projet — non imposée dans le core).
- Maps web (bibliothèque à choisir par ADR selon projet).
- Internationalisation Angular i18n (`@angular/localize`) ou ngx-translate (décision projet).
- Offline / PWA Angular Service Worker (décision projet + ADR).
- Push web (décision projet + ADR).
- Analytics / observabilité avancée (décision ADR-019/038).
- Role management UI (si projet nécessite la gestion des rôles).
- Audit logs UI (table + filtres + pagination — endpoint API Core).
- Export CSV/PDF (bibliothèque à choisir par ADR).

---

## 11. Modules futurs V3/VF

- Client Angular généré depuis `@enistere/api-contracts` OpenAPI (ADR-016 §F, décision par preuve).
- Surface Angular de `@enistere/ui-kit` (`@enistere/ui-kit/angular`) — UI Kit V3 mission.
- Export de tokens UI Kit en variables SCSS/CSS pour Angular.
- Realtime / WebSocket Angular (ADR futur).
- Multi-tenant Angular.
- SSR Angular Universal / Hydration si pertinent (ADR futur).
- Micro-frontends Angular (Module Federation — ADR futur).

Ces modules nécessiteront validation roadmap et ADR si structurants.

---

## 12. Stack technique et décisions validées

### 12.1 Décisions validées

| Décision | ADR | Statut |
|---|---|---|
| Stack UI Angular — CDK + Material 3 + tokens Enistere | ADR-035 | Validé |
| Design tokens source de vérité | ADR-008 | Validé |
| Réactivité locale — Angular Signals (NgRx différé) | ADR-035 §9.8 | Validé |
| Formulaires — Reactive Forms obligatoire | ADR-035 §9.4, §20 | Validé |
| A11y — `@angular/cdk/a11y` couche de référence | ADR-035 §9.6 | Validé |
| Tests composants — `@angular/cdk/testing` | ADR-035 §9.7 | Validé |
| Composants maison — sur CDK, pas PrimeNG | ADR-035 §9.3 | Validé |
| Auth multi-client | ADR-004 | Validé |
| Upload files contrats | ADR-007 | Validé |
| Logging structuré (principes) | ADR-040 | Validé (API + Mobile — principes applicables Angular) |
| Client OpenAPI Angular | ADR-016 §F | **Décidé par preuve — mission Angular 2+** |

### 12.2 Décisions pendantes (§32)

Voir §32 — à trancher dans les missions Angular 2+ ou par ADR dédié.

---

## 13. Standards Angular / TypeScript

- Angular version stable LTS (version choisie dans la mission Angular 2 — starter).
- Standalone components par défaut — pas de `NgModule` sauf cas dûment justifié.
- TypeScript `strict: true` (`strictNullChecks`, `noImplicitAny`, `strictFunctionTypes`).
- Pas de `any` sans justification documentée.
- Imports organisés : Angular core / Angular Material / Angular CDK / bibliothèques tierces / code interne.
- `changeDetection: ChangeDetectionStrategy.OnPush` recommandé pour les composants composites.
- `effect()` avec `allowSignalWrites: true` si besoin — documenté et justifié.
- Pas d'appel réseau ou d'effet secondaire dans les constructeurs de composants.
- Lifecycle hooks explicites : `OnInit`, `OnDestroy` (avec `DestroyRef` ou `takeUntilDestroyed()`).
- `AsyncPipe` dans les templates — pas de souscription manuelle dans les composants.
- Pas de souscription RxJS non désabonnée (risque de memory leak).

---

## 14. Standards sécurité web Angular

- Access token **en mémoire** (`signal<string | null>` non persisté).
- Stratégie refresh token : voir §17 — à trancher dans le starter Angular 2.
- Aucun token dans `localStorage`, `sessionStorage` ou les cookies accessibles au JS.
- HTTPS obligatoire en production.
- CORS géré côté API Core (via `CorsConfig @ConfigurationProperties`).
- Angular DomSanitizer pour tout contenu HTML dynamique inséré.
- `[innerHTML]` interdit sans sanitization explicite et justification.
- Pas de `eval()`, pas de Dynamic Code Evaluation.
- Headers de sécurité configurés côté Cloud Core (CSP, X-Frame-Options, HSTS).
- Erreurs affichées sans fuite de données sensibles (jamais d'URL signée, storageKey, token, PII).
- Logs sans secrets : redaction centrale avant tout sink (§9.11).
- Variables d'environnement publiques uniquement — aucun secret dans le bundle Angular.
- Validation client = pré-check UX ; le backend reste l'autorité finale.
- `nonce` ou `hash` CSP si scripts dynamiques nécessaires.

---

## 15. Routing Angular

La navigation cible repose sur **Angular Router** en mode standalone.

Exigences :

- Route publique : `/login`, `/` (landing), `/not-found`.
- Route protégée (dashboard shell) : `/dashboard/**`.
- Route admin optionnelle : `/admin/**` (guard role supplémentaire).
- Lazy loading via `loadComponent` (composant standalone) ou `loadChildren` (routes feature).
- Guards fonctionnels : `authGuard` (unauthenticated → `/login`), `roleGuard` (insuffisant → 403).
- `returnUrl` encodé dans les query params de redirection — assaini (interne uniquement, anti open-redirect).
- `Router.navigate()` depuis les guards — pas de redirection HTML meta ou `window.location`.
- Routes nommées via constantes (`AppRoutes` objet avec readonly strings).
- Breadcrumbs via `ActivatedRoute.data` si nécessaire.
- Aucune logique métier dans les fichiers de route.

---

## 16. Layouts et templates

Le core doit prévoir :

- layout public (`PublicLayoutComponent`) : header minimal + contenu + footer ;
- layout auth (`AuthLayoutComponent`) : centré, branding Enistere ;
- layout dashboard (`DashboardLayoutComponent`) : sidenav Material + header + zone contenu + footer optionnel ;
- layout admin optionnel (`AdminLayoutComponent`) : héritage dashboard + breadcrumbs + barre latérale admin.

Les layouts sont des composants standalone qui encapsulent `mat-sidenav-container` / `mat-toolbar` (Angular Material) pilotés par les tokens Enistere.

---

## 17. Authentification Angular

L'auth Angular doit fournir :

- Login (email + mot de passe) via API Core `POST /api/v1/auth/login`.
- Logout via API Core `POST /api/v1/auth/logout` + purge locale.
- Refresh token via API Core `POST /api/v1/auth/refresh`.
- Restauration de session au démarrage (`APP_INITIALIZER` ou guard initial).
- `AuthService` signal-based : `authState signal<AuthState>`.
- Gestion d'erreurs auth typées (`InvalidCredentials`, `SessionExpired`, `NetworkError`, `Forbidden`).
- Aucun workflow métier d'inscription dans le core.
- Compatibilité API Core NestJS et API Core Spring Boot (même contrat `/auth`).

---

## 18. Gestion des tokens et de la session

- **Access token** : en mémoire uniquement (signal Angular non persisté, non exposé).
- **Refresh token** : stratégie à trancher dans la mission Angular 2 (voir §32) :
  - Option A — Cookie HttpOnly posé par l'API Core si celui-ci le supporte (plus sécurisé, cohérent avec ADR-005 Web Next.js) ;
  - Option B — Token en mémoire uniquement avec durée de vie courte et `APP_INITIALIZER` qui relance le login si pas de cookie (acceptable pour les SPA internes non persistées).
- Refresh automatique sur 401 (`RefreshInterceptor`) : coalescé, 1 retry, puis logout.
- Suppression complète au logout (mémoire + cookie si applicable).
- Aucun token dans les logs, les services Angular persistés, les préférences ou le cache non sécurisé.
- `TokenStore` service abstrait : testable par mock.

---

## 19. Intercepteurs HttpClient

Les intercepteurs fonctionnels (`HttpInterceptorFn`) sont enregistrés dans `provideHttpClient(withInterceptors([...]))`.

### 19.1 AuthInterceptor

- Clone la requête avec `Authorization: Bearer <accessToken>` si token disponible.
- Ne modifie pas les requêtes vers des hôtes tiers.
- Aucun log du token.

### 19.2 RefreshInterceptor

- Détecte HTTP 401 sur les endpoints protégés.
- Lance le refresh coalescé (une seule requête simultanée si plusieurs 401 parallèles).
- Retry la requête originale une fois après refresh réussi.
- Logout + navigation `/login` si refresh échoue.
- Aucune boucle infinie (endpoint `/auth/refresh` exclu du retry).

### 19.3 ErrorInterceptor

- Normalise `HttpErrorResponse` en `AppError` typé : `{code, message, statusCode, requestId?}`.
- Mapping : 400 (`BadRequest`), 401 (`Unauthorized`), 403 (`Forbidden`), 404 (`NotFound`), 409 (`Conflict`), 413 (`FileTooLarge`), 415 (`UnsupportedType`), 422 (`ValidationError`), 429 (`RateLimited`), 5xx (`ServerError`).
- Aucune information sensible dans l'objet `AppError` exposé au template.

### 19.4 LogInterceptor

- Log `{method, url, statusCode, durationMs, requestId}` — jamais de body ni de headers sensibles.
- Redaction : Bearer token, cookies, URLs signées, emails masqués avant sink.

---

## 20. Server state — RxJS services

Architecture recommandée :

- Services Angular (`@Injectable({ providedIn: 'root' })`) retournant des Observables.
- `BehaviorSubject<T>` pour les données partagées (profil utilisateur, permissions).
- `shareReplay(1)` pour éviter les requêtes multiples sur les données stables.
- `switchMap` pour annuler la requête précédente lors d'un changement de paramètre.
- `catchError` pour normaliser les erreurs sans swallow.
- Purge au logout : `BehaviorSubject.next(null)` ou `Subject.complete()` + recréation.
- Séparation server-state (async, sync avec API) et état local UI (Signals synchrones).
- TanStack Query Angular (bibliothèque optionnelle) évalué par preuve dans Angular 2+ (voir §32).

---

## 21. Formulaires et validation

Exigences (Reactive Forms obligatoires) :

- `FormBuilder` injecté via `inject(FormBuilder)` (standalone pattern).
- Types stricts : `FormGroup<{ email: FormControl<string>; ... }>`.
- Validation synchrone : `Validators.required`, `Validators.email`, `Validators.minLength`, etc.
- Validation asynchrone : `AsyncValidatorFn` pour les vérifications serveur (debounced, avec `distinctUntilChanged`).
- Messages d'erreur via `mat-error` Angular Material — accessibles nativement.
- Désactivation submit pendant le chargement (signal `isLoading` ou `form.disable()`).
- Confirmation pour les actions destructives via `MatDialog` ou `CdkDialog`.
- Aucun appel réseau direct dans les composants de formulaire (via service).

---

## 22. Thème et UI — Material 3 contrôlé (ADR-035)

Exigences (ADR-035) :

- `@use '@angular/material' as mat` + `@include mat.core()` dans `styles.scss`.
- `mat.define-theme()` ou `@include mat.theme(...)` avec palettes dérivées des tokens hex Enistere.
- CSS custom properties `--mat-sys-*` redirigées vers les variables `--enistere-color-*` du UI Kit.
- Variables SCSS Enistere : `$enistere-color-primary`, `$enistere-color-secondary`, `$enistere-radius-*`, etc.
- Support dark/light : deux configurations (classe CSS `dark-theme` ou `prefers-color-scheme` media query).
- `mat-typography-config` mappé depuis les tokens typographiques Enistere.
- Aucun thème Material prédéfini importé (pas de `azure-blue.css`, pas de `deeppurple-amber.css`).
- Inspection automatique en revue : couleurs/typos viennent des tokens, pas hardcodées.

Les tokens Enistere (`ui-kit/tokens/`) restent la source de vérité. Le thème Angular Material est l'adaptateur.

---

## 23. Composants maison Enistere Angular

Composants Foundation obligatoires (pattern identique UI Kit 6 / Flutter 10 / Mobile RN) :

- `EnistereLoadingStateComponent` — `<mat-spinner>` ou équivalent CDK ; inputs : `message?`, `size?`.
- `EnistereEmptyStateComponent` — inputs : `title`, `description?`, `actionLabel?`, output : `actionClicked`.
- `EnistereErrorStateComponent` — inputs : `title`, `description?`, `retryLabel?`, output : `retried`.
- `EnistereSuccessStateComponent` — inputs : `title`, `description?`, `actionLabel?`, output : `actionClicked`.

Ces composants sont standalone, testés via `@angular/cdk/testing`, respectent WCAG 2.1 AA et consomment les tokens Enistere.

---

## 24. Accessibilité (a11y) — `@angular/cdk/a11y`

`@angular/cdk/a11y` est la couche de référence :

- `FocusTrap` : focus piégé dans les modales (`CdkTrapFocus`, `CdkFocusTrap`) — WCAG 2.4.3.
- `LiveAnnouncer` : annonces aux lecteurs d'écran pour les changements d'état dynamiques — WCAG 4.1.3.
- `FocusMonitor` : focus visible sur les éléments interactifs — WCAG 2.4.7.
- `ListKeyManager` : navigation clavier dans les listes et menus — WCAG 2.1.1.
- Labels, roles ARIA et `aria-*` via les composants Angular Material ou les templates Angular.
- Tailles minimales : cibles tactiles ≥ 44 × 44 px (recommandation WCAG 2.5.5).
- Contrastes : WCAG AA minimum (tokens Enistere ADR-008 validés).
- Les composants maison Enistere Angular **doivent respecter WCAG 2.1 AA** sans exception.

---

## 25. Intégration API Core

Le Web Core Angular doit s'intégrer avec API Core NestJS et API Core Spring Boot :

- auth (login / refresh / logout / profil / autorisation) ;
- rôles et permissions (RBAC) ;
- upload fichiers (`POST /api/v1/files/upload`) ;
- lecture fichiers (métadonnées, URL signée) ;
- gestion erreurs standardisées (contrats `ApiError` communs) ;
- pagination ;
- contrats OpenAPI via `@enistere/api-contracts` ;
- client Angular adapté (ADR-016 §F — décision par preuve).

---

## 26. Intégration Cloud Core

Le Web Core Angular doit s'intégrer avec Cloud Core pour :

- hébergement SPA (Nginx, Docker, Traefik) ;
- domaines et SSL/TLS ;
- variables d'environnement de build ;
- absence de secrets dans le bundle Angular ;
- CI/CD future (build Angular + push image Docker) ;
- health checks.

---

## 27. Intégration UI Kit

Le Web Core Angular consomme les tokens Enistere depuis `packages/ui-kit/tokens/` :

- valeurs hex/rem/ms pour les couleurs, typographie, radius et spacing ;
- import des variables CSS/SCSS Enistere dans `styles.scss` ;
- aucun composant React de l'UI Kit n'est utilisé côté Angular (bibliothèques différentes) ;
- surface Angular de l'UI Kit (`@enistere/ui-kit/angular`) : mission future UI Kit V3.

---

## 28. Cohérence multi-framework

Le Web Core Angular partage les **intentions** des autres cores, pas l'implémentation :

| Intention | Web Next.js | Mobile RN | Mobile Flutter | Web Angular |
|---|---|---|---|---|
| Tokens design | `@enistere/ui-kit` CSS | tokens verbatim RN | `ThemeData` Enistere | `mat.define-theme()` Enistere |
| Auth tokens | Access en mémoire BFF + CSRF | Access mémoire RN | Access mémoire Riverpod | Access mémoire signal |
| Routing | App Router Next.js | Expo Router | go_router | Angular Router |
| Server-state | TanStack Query | TanStack Query | Riverpod AsyncNotifier | RxJS services |
| État local | Zustand | Zustand | Riverpod StateProvider | Angular Signals |
| Formulaires | RHF + Zod | RHF + Zod | flutter_form_builder (TBD) | Reactive Forms (obligatoire) |
| HTTP | `@enistere/api-client-fetch` | `@enistere/api-client-fetch` | Dio + intercepteurs | HttpClient + intercepteurs |
| Upload | fetch + FormData | fetch + FormData | Dio + MultipartFile | HttpClient + FormData |
| A11y | radix-ui primitives | AccessibilityInfo/RN | Semantics + TalkBack | CDK a11y (FocusTrap, LiveAnnouncer) |
| Tests composants | jest-axe + React Testing Library | node --test + typecheck | flutter_test widget | TestBed + CDK testing harness |
| Logger/redaction | Pino (API) + logger RN | logger RN 8 | AppLogger Dart | AppLogger Angular |
| UI states | LoadingState/EmptyState/ErrorState/SuccessState (UI Kit) | aliases RN35 | Flutter 10 widgets | Enistere Angular Components |

Les cores Web partagent les **mêmes contrats API** (`@enistere/api-contracts`) et les **mêmes valeurs de tokens** (`ui-kit/tokens/`). Leurs implémentations diffèrent selon l'écosystème.

---

## 29. Critères de validation V1 Angular (§29)

```txt
§29.1  L'app Angular démarre localement (ng serve)
§29.2  La navigation Angular Router fonctionne (public + protégé + guards)
§29.3  Le flow auth est opérationnel (login / logout / refresh / session restore)
§29.4  Les tokens sont correctement gérés (access en mémoire, pas de localStorage)
§29.5  Les intercepteurs HttpClient fonctionnent (auth, refresh, erreurs)
§29.6  Reactive Forms valident et soumettent correctement un formulaire de login
§29.7  Le thème Material 3 Enistere est appliqué (mat.define-theme depuis tokens)
§29.8  Les composants Enistere Angular existent (Loading/Empty/Error/Success)
§29.9  L'accessibilité CDK est en place (FocusTrap modales, LiveAnnouncer états)
§29.10 Les tests unitaires couvrent AuthService, intercepteurs et guards
§29.11 Les tests composants couvrent les états UI et les formulaires
§29.12 Le client HTTP Angular est configuré et typé (TypeScript strict)
§29.13 Les permissions RBAC s'affichent conditionnellement (PermissionDirective)
§29.14 L'app tourne localement dans un navigateur moderne (Chrome, Firefox, Safari)
§29.15 `ng build --configuration=production` produit un bundle valide
```

---

## 30. Missions ordonnées

| # | Mission | Livrable | Prérequis |
|---|---|---|---|
| Angular 1 | Core specification (CETTE MISSION) | `CORE_SPECIFICATION.md` + `README.md` | ADR-035 validé |
| Angular 2 | Starter minimal Angular | `package.json` + `src/main.ts` + `app.config.ts` + structure `src/` + thème Material 3 Enistere | Angular 1 |
| Angular 3 | Auth flow + routing protégé | `AuthService` (Signals) + guards + `AuthInterceptor` + `RefreshInterceptor` + page login | Angular 2 |
| Angular 4 | Client HTTP + server state | `HttpClient` configuré + `ErrorInterceptor` + services RxJS + modèles typés | Angular 3 |
| Angular 5 | Reactive Forms + Angular Material | formulaires login + validation + `mat-form-field` + `mat-error` | Angular 4 |
| Angular 6 | Composants Foundation Enistere | `Loading/Empty/Error/SuccessState` Angular + `PermissionDirective` + a11y CDK | Angular 5 |
| Angular 7 | Upload fichiers | `UploadService` HttpClient + FormData + états upload | Angular 6 |
| Angular 8 | Tests + smoke | TestBed + CDK testing harness + rapport | Angular 7 |
| Angular V1 | Readiness review | Rapport V1 Readiness | Angular 8 |

---

## 31. Standards sécurité spécifiques Angular

- `DomSanitizer.sanitize()` pour tout HTML dynamique avant `[innerHTML]`.
- `BypassSecurityTrustHtml` interdit sans validation humaine et justification documentée.
- `HttpClient` n'expose jamais les tokens via les attributs `data-*` ou les URL templates.
- CSP strict configurable côté Cloud Core (Angular compile en bundle statique — pas d'`eval`).
- Pas de `console.log()` en production (remplacé par `AppLogger` avec redaction).
- `ng build --optimization` minifie et élimine les dead-code paths sensibles.
- `router.navigate()` avec URLs internes uniquement — validation `returnUrl` obligatoire.
- Aucune souscription RxJS non désabonnée dans les composants (risque de fuite mémoire + side effects post-logout).

---

## 32. Décisions pendantes

Ces décisions seront tranchées dans les missions Angular 2+ ou par ADR dédié :

| Décision | Options | Impact |
|---|---|---|
| Client OpenAPI Angular | (a) Orval Angular ; (b) OpenAPI Generator `typescript-angular` | ADR-016 §F — décidé par preuve Angular 2+ |
| Framework de tests unitaires | (a) Jasmine/Karma (Angular CLI défaut) ; (b) Jest + jest-preset-angular | Mission Angular 2 |
| Framework E2E | (a) Cypress ; (b) Playwright | Mission Angular 2 ou ADR si structurant |
| TanStack Query Angular | Optionnel — évaluation par preuve en Angular 2+ | Mission Angular 4+ |
| Stratégie refresh token | (a) Cookie HttpOnly posé par l'API ; (b) Token mémoire session courte | Mission Angular 3 |
| Préférences non sensibles | localStorage (non sensible) vs service Angular | Mission Angular 2 |
| NgRx | Différé aux projets dérivés à état global complexe | Projet dérivé |
| CI Angular | GitHub Actions `ng build` + `ng test` | Mission Angular 8+ |
| Version Angular LTS | Angular 17+ (standalone) — version exacte choisie au starter | Mission Angular 2 |
| SSR / Angular Universal | Non requis V1 — optionnel V3 si pertinent | ADR futur |
| Export tokens → SCSS Angular | UI Kit V3 mission | UI Kit V3 |
| Surface UI Kit Angular | `@enistere/ui-kit/angular` — mission UI Kit V3 | UI Kit V3 |
