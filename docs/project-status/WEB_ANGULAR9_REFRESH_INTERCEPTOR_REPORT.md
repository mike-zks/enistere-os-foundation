# WEB_ANGULAR9_REFRESH_INTERCEPTOR_REPORT.md — Web Core Angular 9

**Date** : 2026-07-16  
**Branche** : `feat/web-angular-9-refresh-interceptor`  
**Statut avant** : `IMPLEMENTATION_AVANCEE`  
**Statut après** : `IMPLEMENTATION_AVANCEE`  
**Décision** : B1 fermé ; `VALIDE_V1` reste différé par B2 `PermissionService` / `PermissionDirective`.

---

## 1. Objectif

Fermer le blocker V1 B1 identifié dans `WEB_ANGULAR_V1_READINESS_REVIEW.md` :

- ajouter un seam `AuthApi` testable pour le login/refresh/logout ;
- rendre `AuthService.login()` asynchrone via Observable ;
- ajouter `RefreshInterceptor` : `401 → refresh coalescé → retry unique → logout/purge si échec` ;
- préserver les invariants sécurité : access token en mémoire uniquement, aucun token dans les logs, aucun `localStorage`, aucun `Content-Type` forcé sur `FormData`.

---

## 2. Livrables

| Fichier | Changement |
|---|---|
| `src/app/core/auth/auth.api.ts` | `AuthApi` abstract + `PlaceholderAuthApi` injectable |
| `src/app/core/auth/auth.service.ts` | `login()` Observable, access token mémoire, `refreshSession()` coalescé, purge déterministe |
| `src/app/core/interceptors/refresh.interceptor.ts` | 401 authentifié → refresh → retry unique ; endpoints auth exclus ; logout sur refresh KO |
| `src/app/core/interceptors/auth.interceptor.ts` | `isAuthEndpoint()` exporté et endpoints auth exclus |
| `src/app/app.config.ts` | Chaîne `auth → refresh → log → error` + provider `AuthApi` placeholder |
| `features/auth/login/login.component.ts` | Soumission adaptée au contrat Observable |
| Specs Angular | Providers de test explicites + cas refresh/login/retry/FormData |

---

## 3. Sécurité

- Access token stocké uniquement dans un signal privé de `AuthService`.
- Le signal public `authState` ne contient jamais de token.
- `login()` purge l'ancien token si une tentative ultérieure échoue.
- `logout()` purge la mémoire même si l'appel API logout échoue.
- `refreshSession()` purge le token et passe à `expired` sur échec.
- `RefreshInterceptor` ne tente jamais de refresh sur `/auth/login`, `/auth/refresh`, `/auth/logout`.
- Le retry multipart ne force jamais `Content-Type`, laissant le navigateur générer le boundary.

---

## 4. Tests

Couverture ajoutée ou ajustée :

- `AuthApi` placeholder : login, refresh error, logout complete.
- `AuthService` : login success/error, purge token, state read-only, refresh coalescé, retry après échec, absence de token dans state.
- `RefreshInterceptor` : non-401 passthrough, 401→refresh→retry, refresh KO→logout+erreur originale, no-token no-refresh, endpoints auth exclus, no infinite loop, FormData sans `Content-Type`.
- Specs composants/navigation : providers `AuthApi` explicites.

Vérification locale :

| Check | Résultat |
|---|---|
| `npm run test:ci` (`cores/web-angular`) | ✅ 248 / 248 |
| `git diff --check` | ✅ |

---

## 5. Impact readiness

`WEB_ANGULAR_V1_READINESS_REVIEW.md` mis à jour :

- B1 fermé.
- §29.3 : PARTIEL → SATISFAIT.
- §29.5 : PARTIEL → SATISFAIT.
- Score : 11/15 → 13/15 satisfaits.
- Blockers : 2 → 1.

`VALIDE_V1` n'est pas déclaré : B2 `PermissionService` / `PermissionDirective` reste ouvert.

---

## 6. Prochaine action

**Web Core Angular 10 — PermissionService + PermissionDirective**

Objectif : fermer B2 via un service RBAC in-memory/injectable et une directive structurelle `*enisterePermission`, testés, en rappelant que l'affichage conditionnel est uniquement une aide UX et que l'API Core reste l'autorité.
