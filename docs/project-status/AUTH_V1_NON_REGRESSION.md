# Non-régression Auth V1 — avant / après extraction (Capability Packs 1A/1A-R)

Comparaison de la capability **Auth** entre la baseline V1 intégrée (commit `53f2b7a`) et sa
composition en overlay déclaratif (`base + auth`). Objectif : aucune garantie, sécurité ou
comportement historique d'Auth n'est réduit. Ce qui « disparaît » d'Auth relève de **RBAC** ou
**Files** — des capabilities distinctes, correctement découplées et laissées `planned`.

Preuve runtime : `factory/quality/scripts/golden-runtime.mjs` (workflow `Factory Golden Runtime`)
génère `base+auth`, installe de façon reproductible (`npm install` → `npm ci`) et rejoue les gates
réels. NestJS `base+auth` : 144 tests unitaires + 37 e2e contre PostgreSQL.

## NestJS (API)

| Aspect | V1 (intégré) | 1A (base + overlay auth) | Verdict |
|---|---|---|---|
| Endpoints Auth | `POST /auth/login`, `/auth/refresh`, `/auth/logout`, `GET /auth/me` | identiques | ✅ préservé |
| Endpoint `GET /auth/me/authorization` | présent (rôles/permissions) | **RBAC** → payload parqué (hors Auth) | ➖ RBAC, pas Auth |
| DTO/contrats | `LoginDto`, `LoginResponseDto`, `RefreshTokenDto`, `RefreshResponseDto`, `LogoutResponseDto`, `UserProfileResponseDto` | identiques | ✅ préservé |
| `AuthorizationSummaryResponseDto` | présent | **RBAC** → parqué | ➖ RBAC |
| Modèle Prisma | `User`, `RefreshSession`, enums `UserStatus`/`SessionRevocationReason` | identiques (fragment `auth.prisma`) ; relations `roles`/`files` retirées de `User` | ✅ Auth préservé (relations = RBAC/Files) |
| Migrations | 5 migrations enchevêtrées (auth + rbac + files) | `base_init` (audit_logs) + `auth_init` (users, refresh_sessions avec colonnes rotation/révocation) | ✅ schéma Auth équivalent, désenchevêtré |
| Argon2id (ADR-039) | `PASSWORD_HASHER` + params configurables | identique | ✅ préservé |
| Rotation refresh + détection de réutilisation + révocation de famille | présent | identique (`refresh-session.service`, `auth.service` inchangés) | ✅ préservé |
| Logout idempotent non révélateur | présent | identique | ✅ préservé |
| Access token en mémoire, refresh opaque haché (HMAC) jamais stocké en clair | présent | identique | ✅ préservé |
| Guard global `JwtAuthGuard` + `@Public()` | intégré dans `AppModule` | composé via `src/composition/capabilities.ts` (intégration `nestjs.global-guard`) | ✅ préservé |
| Throttlers nommés `login`/`refresh` | intégrés | composés via l'overlay (`nestjs.throttler`) | ✅ préservé |
| Audit des événements Auth | registre partagé `AUDIT_EVENT_TYPES` | registre propre `AUTH_AUDIT_EVENTS` ; infra audit générique en base | ✅ préservé (namespacé) |
| Variables d'env | `JWT_ACCESS_SECRET`, `JWT_ACCESS_TTL`, `REFRESH_TOKEN_TTL`, `REFRESH_TOKEN_HASH_SECRET`, `ARGON2_*`, `AUTH_*_RATE_*` | identiques (déclarées par l'overlay, validées par `auth.config`) | ✅ préservé |
| `JWT_REFRESH_SECRET` | déclaré et **requis** au démarrage mais **jamais consommé** (refresh = HMAC) | non requis | ✅ simplification sûre (config morte retirée) |
| Dépendance Auth → RBAC | `AuthModule` importait `AuthorizationModule`/`RolesModule`/`PermissionsModule` | **supprimée** : Auth ne nécessite plus RBAC | ✅ amélioration (découplage) |

## Next.js (Web)

| Aspect | V1 (intégré) | 1A (base + overlay auth) | Verdict |
|---|---|---|---|
| BFF Auth | `POST /api/auth/{login,refresh,logout}`, `GET /api/auth/me`, `/api/auth/csrf` | identiques | ✅ préservé |
| `GET /api/auth/authorization` | présent | **RBAC** → parqué | ➖ RBAC |
| Cookies HttpOnly | présent (`cookie-config`, `server-cookie-store`) | identique | ✅ préservé |
| CSRF double-submit + validation Origin/Referer (fail-closed) | présent (`csrf/*`, `allowed-origins`) | identique | ✅ préservé |
| Session BFF (`/api/auth/me`, `useSession`) | présent | identique | ✅ préservé |
| Page `/login` + route protégée `(protected)` + retour login sûr (`return-to`) | présent | identique | ✅ préservé |
| Résumé d'autorisation dans `SessionPanel` | affiché | retiré du panneau (rôles/permissions = **RBAC**) | ➖ RBAC |
| Surface Files (`/api/files/*`, écrans) | présente | **Files** → parqué | ➖ Files |
| Aucun token en state React/logs/query keys/erreurs ; API autoritaire | garanti | identique (`auth-boundaries.test`, `auth-security.test`) | ✅ préservé |

## React Native (Mobile)

| Aspect | V1 (intégré) | 1A (base + overlay auth) | Verdict |
|---|---|---|---|
| AuthEngine + session | présent | identique (`src/auth/*`) | ✅ préservé |
| SecureStore seam (ADR-015) | présent (`src/storage/*`) | identique | ✅ préservé |
| Access token en mémoire ; refresh dans le stockage sécurisé | garanti | identique (`session-store`, `token-mapping`) | ✅ préservé |
| Restauration de session + refresh coalescent | présent | identique (`auth-engine`) | ✅ préservé |
| Pont 401 → refresh → un seul retry (possédé par AuthEngine) | présent (`src/api/with-auth-retry`) | identique | ✅ préservé |
| Purge sur logout / expiration | présent | identique | ✅ préservé |
| Routes publique/protégée strictement nécessaires | `(public)/sign-in`, `(app)/home`, `(app)/settings` | identiques | ✅ préservé |
| Écran `(app)/upload` | présent | **Files** → parqué | ➖ Files |
| Télémétrie / permissions métier dans Auth | absentes par conception | absentes | ✅ préservé |

## Invariants de sécurité (transverses)

| Invariant | Verdict |
|---|---|
| Access token en mémoire uniquement | ✅ |
| Refresh token dans le stockage sécurisé prévu, jamais en clair côté serveur (HMAC) | ✅ |
| Aucun token dans state React, logs, query keys ou erreurs | ✅ |
| API autoritaire (l'UI n'est jamais la preuve) | ✅ |
| CSRF/Origin côté BFF (fail-closed) | ✅ |
| Refresh coalescent, aucun second mécanisme de refresh concurrent | ✅ |

## Conclusion

Aucune garantie Auth V1 n'est perdue. Les seuls retraits de la surface « Auth » historique sont
**RBAC** (résumé et endpoint d'autorisation) et **Files** (upload), qui sont des capabilities
distinctes désormais honnêtement `planned` (payloads parqués, sans `overlay.json`, refusées par
`generate`). Deux améliorations : suppression de la dépendance Auth → RBAC et retrait d'une variable
d'environnement requise mais morte (`JWT_REFRESH_SECRET`).
