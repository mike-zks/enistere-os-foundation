# WEB_ANGULAR8_TESTS_SMOKE_REPORT.md — Angular 8 : Tests + Smoke

**Date** : 2026-07-16  
**Branch** : `feat/web-angular-8-tests-smoke`  
**Statut avant** : `UPLOAD_READY`  
**Statut après** : `TEST_SMOKE_READY`

---

## Résumé exécutif

Angular 8 consolide la couverture de test du Web Core Angular avant la revue V1.  
Seize tests nouveaux ont été ajoutés en deux axes :

1. **Tests d'intégration router** (`RouterTestingHarness`) — navigation réelle lazy-loaded, guards fonctionnels, redirections.
2. **Tests CDK harness** (`MatFormFieldHarness`, `MatInputHarness`, `MatSelectHarness`, `MatButtonHarness`, `MatProgressSpinnerHarness`) — assertions sur la couche Material côté API CDK (sans couplage au DOM brut).

Résultat : **224/224 tests ✅ — BUILD SUCCESS — 0 vulnérabilité**.

---

## Fichiers ajoutés

| Fichier | Type | Tests |
|---|---|---|
| `src/app/app.navigation.spec.ts` | Router integration | 5 |
| `src/app/features/auth/login/login.harness.spec.ts` | CDK harness | 5 |
| `src/app/features/upload/upload-form/upload-form.harness.spec.ts` | CDK harness | 4 |
| `src/app/shared/components/loading-state/enistere-loading-state.harness.spec.ts` | CDK harness | 2 |
| **Total ajouté** | | **16** |

---

## Détail par fichier

### `app.navigation.spec.ts` — Router integration (5 tests)

Utilise `RouterTestingHarness` (`@angular/router/testing`) pour tester la navigation réelle
avec les routes lazy-loaded (`loadComponent`) et les guards fonctionnels.

| # | Test | Vérification |
|---|---|---|
| 1 | renders HomeComponent at "/" | `harness.routeNativeElement.tagName === 'app-home'` |
| 2 | renders LoginComponent at "/login" for a guest | `harness.routeNativeElement.tagName === 'app-login'` (guestGuard → true) |
| 3 | redirects "/dashboard" to "/login" when unauthenticated | `router.url` contient `/login` après authGuard redirect |
| 4 | includes returnUrl query param when redirected from "/dashboard" | `router.url` contient `returnUrl` |
| 5 | redirects unknown wildcard path to "/" | wildcard → `redirectTo: ''` → `router.url === '/'` |

**Différentiel par rapport aux tests existants** : `app.routes.spec.ts` analyse uniquement la
configuration statique des routes (7 tests). Ces 5 tests font tourner le routeur réel avec les
guards et vérifient les sorties après navigation.

### `login.harness.spec.ts` — CDK harnesses LoginComponent (5 tests)

Utilise `MatFormFieldHarness` et `MatInputHarness` pour des assertions via l'API CDK Material,
complémentaires aux 14 tests DOM existants dans `login.component.spec.ts`.

| # | Test | Harness |
|---|---|---|
| 1 | has exactly two MatFormField harnesses | `getAllHarnesses(MatFormFieldHarness)` |
| 2 | first form field label is "Adresse e-mail" | `MatFormFieldHarness.getLabel()` |
| 3 | second form field label is "Mot de passe" | `MatFormFieldHarness.getLabel()` |
| 4 | email MatInput has type "email" | `MatInputHarness.getType()` |
| 5 | password MatInput has type "password" | `MatInputHarness.getType()` |

### `upload-form.harness.spec.ts` — CDK harnesses UploadFormComponent (4 tests)

Utilise `MatSelectHarness`, `MatButtonHarness`, `MatProgressSpinnerHarness` pour des assertions
CDK complémentaires aux 15 tests DOM existants dans `upload-form.component.spec.ts`.

| # | Test | Harness |
|---|---|---|
| 1 | MatSelect has an option for each file category | `MatSelectHarness.open()` + `getOptions()` (longueur = `FILE_CATEGORIES.length = 9`) |
| 2 | MatSelect options include "Document" and "Image" labels | `MatOptionHarness.getText()` |
| 3 | submit MatButton has text "Envoyer" | `MatButtonHarness.with({ text: 'Envoyer' })` |
| 4 | MatProgressSpinnerHarness is present during loading state | `state.set(loadingState())` → `getHarness(MatProgressSpinnerHarness)` |

### `enistere-loading-state.harness.spec.ts` — CDK harness spinner (2 tests)

Complète les 7 tests DOM existants dans `enistere-loading-state.component.spec.ts` avec des
assertions via l'API CDK.

| # | Test | Harness |
|---|---|---|
| 1 | MatProgressSpinnerHarness finds the spinner | `getHarness(MatProgressSpinnerHarness)` |
| 2 | spinner mode is indeterminate | `MatProgressSpinnerHarness.getMode() === 'indeterminate'` |

---

## Couverture consolidée par domaine

| Domaine | Spec files | Tests |
|---|---|---|
| App component | `app.component.spec.ts` | 2 |
| Routes (statique) | `app.routes.spec.ts` | 7 |
| **Routes (integration)** | **`app.navigation.spec.ts`** | **5** |
| Auth — service | `auth.service.spec.ts` | 8 |
| Auth — guards | `guards.spec.ts` | 8 |
| Auth — return URL | `return-url.utils.spec.ts` | 8 |
| Auth — login (DOM) | `login.component.spec.ts` | 14 |
| **Auth — login (CDK)** | **`login.harness.spec.ts`** | **5** |
| Dashboard | `dashboard.component.spec.ts` | 7 |
| Home | `home.component.spec.ts` | 6 |
| Config | `api-config.spec.ts` | 2 |
| Errors | `app-api-error.spec.ts` | 10 |
| Interceptor auth | `auth.interceptor.spec.ts` | 6 |
| Interceptor error | `error.interceptor.spec.ts` | 6 |
| Interceptor log | `log.interceptor.spec.ts` | 6 |
| Server state | `request-state.spec.ts` | 10 |
| Forms | `form-error.utils.spec.ts` | 9 |
| AppFile model | `app-file.model.spec.ts` | 13 |
| UploadService | `upload.service.spec.ts` | 9 |
| UploadForm (DOM) | `upload-form.component.spec.ts` | 15 |
| **UploadForm (CDK)** | **`upload-form.harness.spec.ts`** | **4** |
| Foundation LoadingState (DOM) | `enistere-loading-state.component.spec.ts` | 7 |
| **Foundation LoadingState (CDK)** | **`enistere-loading-state.harness.spec.ts`** | **2** |
| Foundation EmptyState | `enistere-empty-state.component.spec.ts` | 9 |
| Foundation ErrorState | `enistere-error-state.component.spec.ts` | 9 |
| Foundation SuccessState | `enistere-success-state.component.spec.ts` | 9 |
| **TOTAL** | **27 fichiers spec** | **224** |

---

## Smoke navigateur (ChromeHeadless)

```
Chrome Headless 150.0.0.0 (Linux)
Executed 224 of 224 SUCCESS (1.384 secs / 1.149 secs)
TOTAL: 224 SUCCESS
```

Commande : `npm run test:ci` — Karma + ChromeHeadlessNoSandbox.

---

## Build de production

```
Application bundle generation complete. [4.743 seconds]

dist/web-angular/
  main-*.js       | 232.13 kB | 72.87 kB (gzip)
  styles-*.css    |  90.37 kB |  7.28 kB (gzip)
  polyfills-*.js  |  35.78 kB | 11.63 kB (gzip)

Lazy:
  login-component     | 170.62 kB | 30.65 kB (gzip)
  home-component      |   3.83 kB |  1.05 kB (gzip)
  dashboard-component |   2.96 kB |   932 B  (gzip)
```

---

## npm audit

```
found 0 vulnerabilities
```

---

## Vérifications qualité

| Check | Résultat |
|---|---|
| `npm run build` | ✅ SUCCESS |
| `npm run test:ci` | ✅ 224/224 |
| `npm audit` | ✅ 0 vulnérabilités |
| `git diff --check` | ✅ Aucun espace de fin |
| Nouvelles dépendances runtime | ✅ Aucune |
| Nouvelles dépendances dev | ✅ Aucune (harnesses inclus dans `@angular/material` + `@angular/cdk`) |

---

## Périmètre Angular 8 — Ce qui N'a PAS été ajouté

Conformément au cahier des charges :

- **Aucune feature runtime** — seuls des fichiers `*.spec.ts` et ce rapport ont été créés.
- **Aucune nouvelle dépendance** — `@angular/cdk/testing`, `@angular/cdk/testing/testbed` et les
  harnesses Material sont déjà inclus dans `@angular/cdk@22.0.4` et `@angular/material@22.0.4`.
- **Aucun E2E lourd** — `RouterTestingHarness` est une intégration Karma/TestBed, pas Playwright/Cypress.

---

## Conclusion

Angular 8 est livré. Le Web Core Angular passe de `UPLOAD_READY` à `TEST_SMOKE_READY`.

Prochaine étape : **Web Core Angular V1 Readiness Review**.
