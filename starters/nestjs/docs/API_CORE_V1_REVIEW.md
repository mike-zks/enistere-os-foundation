# API_CORE_V1_REVIEW.md — Revue d'étape globale du starter starter NestJS V1

> Photographie transverse du starter à l'issue des blocs socle, Auth/RBAC et Files (Upload 1→5),
> avec les durcissements transverses appliqués. Compléments permanents :
> [`AUTH_RBAC_REVIEW.md`](./AUTH_RBAC_REVIEW.md), [`FILES_REVIEW.md`](./FILES_REVIEW.md),
> [`API_CORE_V1_IMPLEMENTATION_STATUS.md`](./API_CORE_V1_IMPLEMENTATION_STATUS.md),
> [`API_CORE_V1_NEXT_ROADMAP.md`](./API_CORE_V1_NEXT_ROADMAP.md).

## 1. Résumé exécutif

Le starter est **cohérent, sécurisé et testé**. Architecture en couches nette (DB via repositories,
S3 via adapter, guards globaux ordonnés), enveloppes de réponse/erreur uniformes, Auth/RBAC et Files
validés par des rapports permanents. Cette revue a ajouté les **durcissements transverses V1** :
Helmet + `X-Powered-By` off, limites de body parsers, `trust proxy` explicite, CORS strict,
identifiant de corrélation `X-Request-Id`, sondes **liveness/readiness**, commande `openapi:generate`
et `test:cov`. État : **354 tests unitaires / 44 suites**, **83 tests e2e / 10 suites**, **0
vulnérabilité**, build/lint verts, couverture unitaire **83 % lignes**. **Aucun problème bloquant.**
Point d'attention non technique : **le dépôt n'a aucun commit** (tout le starter est non suivi).

## 2. Périmètre

Lecture de tout le dépôt ; modifications limitées à `starters/nestjs/` et `CHANGELOG.md`. Aucune
implémentation de nouveau bloc fonctionnel (ni Redis, ni queue, ni mail, ni worker, ni client
OpenAPI). Corrections transverses réelles uniquement.

## 3. Architecture

Feature-first par module NestJS, avec un `common/` transverse. Flux d'une requête protégée :
`Helmet → trust proxy → body parsers bornés → requestId → JwtAuthGuard → RolesGuard →
PermissionsGuard → ValidationPipe → controller → ResponseInterceptor` ; erreurs via
`AllExceptionsFilter` (enveloppe plate `08_STANDARDS §30`). `configureApp()` centralise le
durcissement + pipes/filtre/interceptor et est partagé par `main.ts` et les tests (parité
exécution/tests). DB **uniquement** via repositories ; S3 **uniquement** via `S3ObjectStorage`.

## 4. Modules

| Module | Rôle | Endpoints | Statut |
|---|---|---|---|
| `ConfigModule` (global) | Chargement + **validation** d'environnement (`validateEnv`) | — | ✅ |
| `DatabaseModule` (global) | `PrismaService` (cycle de vie, raw paramétré) | — | ✅ |
| `ThrottlingModule` (global) | Throttlers nommés `login`/`refresh`/`upload`/`download` | — | ✅ |
| `AuditModule` (global) | `AuditService` persistant non bloquant | — | ✅ |
| `HealthModule` | `GET /health`, `/health/live`, `/health/ready` | 3 | ✅ |
| `UsersModule` | Domaine utilisateur interne (pas de CRUD public) | — | ✅ |
| `AuthModule` | login/refresh/logout/me, JWT, sessions | 5 | ✅ |
| `AuthorizationModule` | Contexte d'autorisation chargé serveur | (`/auth/me/authorization`) | ✅ |
| `RolesModule` | Rôles, `@Roles`, `RolesGuard` | — | ✅ |
| `PermissionsModule` | Permissions fines, `@Permissions`, `PermissionsGuard` | — | ✅ |
| `FilesModule` | Upload/lecture/lifecycle/quotas/maintenance | 6 (+CLI) | ✅ |
| `common/` | filtre, interceptor, **middleware requestId**, erreurs, throttling | — | ✅ |

Aucun cycle de dépendance, aucun service monolithique (plus gros : `FileReconciliationService`
≈ 290 lignes), aucune abstraction inutile détectée.

## 5. Sécurité

- **En-têtes** : Helmet (CSP désactivée pour ne pas casser le Swagger de dev ; l'API sert du JSON),
  `X-Powered-By` désactivé. Vérifiés en e2e (`x-content-type-options: nosniff`, pas de `x-powered-by`).
- **CORS** : liste blanche explicite par environnement (`CORS_ORIGINS`), `credentials: true`,
  **rejet de `*`** (échec rapide au boot), méthodes/headers minimisés. Origine `false` si vide
  (clients mobiles natifs sans Origin non concernés).
- **trust proxy** : explicite via `TRUST_PROXY_HOPS` (0 par défaut = aucun proxy de confiance,
  `X-Forwarded-For` ignoré). Jamais `true` aveugle.
- **Body parsers** bornés (`JSON_BODY_LIMIT`/`URL_ENCODED_BODY_LIMIT`) ; multipart borné séparément.
- **Auth/RBAC** : deny-by-default, guards ordonnés, sessions vérifiées en base, refus 401/403
  génériques (voir `AUTH_RBAC_REVIEW.md`).
- **Files** : privé par défaut, anti-énumération, URLs signées courtes, aucune fuite (voir
  `FILES_REVIEW.md`).
- **Secrets** : aucun secret réel committé ; `.env.example` = placeholders ; `.env*` gitignoré.

## 6. Configuration

`configuration.ts` + `env.validation.ts` (class-validator, `forbidNonWhitelisted`). Toutes les
variables critiques sont **validées au démarrage** (secrets non vides, TTL bornés, booléens/numériques
transformés, quotas, rétentions, limites HTTP, trust proxy). Couvert par `env.validation.spec.ts`
(secrets manquants, NODE_ENV invalide, TTL hors bornes, trust proxy négatif, limite vide). La
configuration reste lisible (un fichier) ; une découpe par domaine n'est pas justifiée en V1
(surarchitecture évitée), documentée comme évolution possible.

## 7. Contrats

Succès `{ success, data, timestamp }` (interceptor) ; erreur `{ success:false, statusCode, message,
errorCode, details, path, timestamp }` (filtre). `BigInt` → chaîne décimale ; dates ISO ;
`204 No Content` pour `DELETE`. Codes d'erreur centralisés (`error-codes.ts`, par domaine) ;
réponses publiques génériques. Validation DTO globale (`whitelist`+`forbidNonWhitelisted`+transform),
UUID via `ParseUUIDPipe`, enums/longueurs/raisons bornées.

## 8. Auth/RBAC

Invariants confirmés (cf. `AUTH_RBAC_REVIEW.md`) : Argon2id, access JWT court + refresh opaque
rotatif, détection de réutilisation, logout, `@Public`, `@CurrentUser`, ordre des guards, contexte
d'autorisation chargé serveur (jamais dans le JWT), rate limiting login/refresh, audit. Couverture
unitaire élevée du cœur (`auth/tokens` 100 %, `auth/guards` 96 %, `auth/sessions` 95 %,
`auth/strategies` 96 %). Aucune régression introduite par les blocs Files.

## 9. Files

Invariants confirmés (cf. `FILES_REVIEW.md`) : upload inspecté, stockage privé, URLs signées,
ownership + permissions, suppression confidentielle, quarantaine, réconciliation DB↔S3, quotas
atomiques, purge contrôlée, verrou de maintenance, CLI dry-run/apply. Couverture des services de
domaine élevée (deletion/quota/lifecycle/maintenance/reconciliation ≈ 95–100 %).

## 10. Logging

Logger NestJS standard + `AuditModule` (sécurité/métier, persistant, non bloquant). **L'audit n'est
pas un substitut au logging technique** (constat respecté : il ne journalise pas les erreurs
techniques). **Aucun logger structuré (Pino/Winston) n'est ajouté** : ce choix mérite un ADR (volume,
redaction, format JSON, intégration Deployment). Contrat de logging V1 défini (timestamp, level,
context, requestId, méthode, route normalisée, statusCode, durée ; jamais de body sensible ni de
token ; redaction des headers). `X-Request-Id` est désormais disponible (`req.requestId`) pour un
futur intercepteur de logging.

## 11. Health

`GET /health` (info générale, rétrocompatible), `GET /health/live` (liveness, **aucune dépendance
externe**), `GET /health/ready` (**PostgreSQL** via `SELECT 1`, 503 générique si indisponible). Le
stockage S3 **n'entre pas** dans la readiness (une panne S3 ne doit pas retirer toute l'API ; lectures
de metadata et auth restent disponibles) — décision documentée. Aucune donnée sensible exposée.

## 12. OpenAPI

Swagger couvre les **13 endpoints** (health ×3, auth ×5, files ×5 + delete). Commande
`npm run openapi:generate` (artefact `openapi.json` gitignoré) : document **valide** (`openapi 3.0.0`,
13 paths, 3 schemas), **sans secret, sans modèle Prisma interne, sans `storageKey`/`bucket`/checksum**,
sécurité Bearer présente, Swagger désactivé en production. Le starter est **prêt pour ADR-016**
(génération de clients typés) une fois les schémas de réponse publics enrichis (DTO de sortie
explicites recommandés avant la génération de clients). ADR-016 **non créé/modifié** ici.

## 13. Base de données

Prisma 6, `PrismaService` global. **5 migrations** cohérentes, appliquées sur base vierge
(`migrate deploy` + `migrate status` « up to date »). Tous les `$queryRaw`/`$executeRaw` sont
**paramétrés** (advisory locks via `Prisma.sql` avec binding ; `pg_advisory_*_lock` `void` exécuté
en `$executeRaw`). Index présents (`ownerId`/`status`/`category`/`createdAt`/`deletedAt`,
`storageKey` unique). Seed **idempotent** (permissions structurelles seules, aucun utilisateur).

## 14. Performances

Ordres de grandeur (requêtes DB) : login ≈ 2–3 (lookup user + create session + audit) ; refresh ≈
rotation transactionnelle ; `/auth/me` 1 ; route RBAC = contexte d'autorisation **chargé une fois
par requête** (1 requête, pas de N+1) ; upload = quota+create atomiques (1 transaction) + S3 ;
metadata 1 ; URL signée 1 + HeadObject ; suppression 1–2 ; réconciliation/purge **bornées** (batch).
Aucune requête manifestement dupliquée. Mémoire : `memoryStorage` borné (`FILE_MAX_SIZE_BYTES ×
concurrence` à dimensionner) ; Argon2 paramétrable (à benchmarker sur cible). Pas d'optimisation
prématurée. Timeouts : PostgreSQL/S3/presigner s'appuient sur les défauts des SDK ; recommandation
d'expliciter des timeouts S3 et un timeout HTTP au niveau du reverse proxy (documenté, non bloquant).

## 15. Tests

**354 unitaires / 44 suites** + **83 e2e / 10 suites**. e2e en série (`--runInBand`) pour une
isolation déterministe (DB/MinIO partagés, nettoyés par suite) ; AWS SDK sous Jest via
`--experimental-vm-modules`. Stabilité confirmée (e2e relancés plusieurs fois ; concurrence
quotas/verrous/suppression déterministe). Couverture unitaire **83 % lignes / 73 % branches** ;
domaines critiques élevés (auth/tokens 100 %, guards 96–100 %, files/* services 95–100 %). Plus bas
en **unitaire** : controllers, `authorization`, `throttling`, `PrismaService`, DTO — **couverts par
les e2e** (non comptés par `test:cov` qui ne mesure que l'unitaire). Recommandation : couverture
combinée unit+e2e ultérieure ; seuils ≥ 80 % global, plus élevés sur auth/sessions/guards/lifecycle.

## 16. Dépendances

**0 vulnérabilité** (`npm audit`). `npm outdated` : `@aws-sdk/*` et `@nestjs/common` en **patch**
(couverts par les plages `^`), **Prisma 7 majeur volontairement non appliqué** (migration à planifier
hors revue). Dépendance ajoutée cette revue : **`helmet`** (runtime, 0 vuln). Aucune dépendance
runtime manifestement inutilisée détectée (helmet/aws-sdk/argon2/passport-jwt/class-validator/
class-transformer/rxjs/reflect-metadata tous utilisés). Aucune montée majeure effectuée.

## 17. Défauts détectés

1. Sécurité HTTP transverse absente (Helmet, `X-Powered-By`, limites de body, `trust proxy`).
2. Pas d'identifiant de corrélation de requête.
3. Health minimal (pas de liveness/readiness séparés ; pas de check PostgreSQL).
4. Pas de `test:cov` ni de commande de génération OpenAPI.
5. CORS correct mais sans garde explicite contre `*`+credentials.
6. Doc : README permissions liste les permissions structurelles sans les `files.*` (mineur) ;
   dossier `src/upload/` résiduel (README déprécié, sans code).
7. Non technique : **dépôt sans commit** (tout non suivi).

## 18. Corrections appliquées

- Helmet + `X-Powered-By` désactivé + limites body parsers + `trust proxy` configurable, dans
  `configureApp` (partagé exécution/tests).
- CORS durci (rejet `*`, méthodes/headers minimisés).
- Middleware `X-Request-Id` (validé-ou-généré, anti-injection de logs) + tests.
- Sondes `GET /health/live` et `GET /health/ready` (PostgreSQL) + tests.
- Config : `JSON_BODY_LIMIT`, `URL_ENCODED_BODY_LIMIT`, `TRUST_PROXY_HOPS` (validées) + tests
  `env.validation.spec.ts`.
- Scripts `test:cov` et `openapi:generate` (artefact gitignoré).
- `ERROR_CODES.SERVICE_UNAVAILABLE` ajouté (readiness).
- Documentation (README, .env.example, CHANGELOG) + 3 documents de revue.

## 19. Risques

- Pas de logger structuré ni d'observabilité (métriques/traces) → diagnostic limité en production
  (mitigé : audit sécurité + requestId + contrat de logging). **Décision ADR recommandée.**
- Body limit `413` non testé en e2e (artefact client superagent/keep-alive sur gros corps) —
  comportement garanti par contrat `body-parser`, limite validée par config + couverte par doc.
- Single-instance : throttling/sessions en mémoire, verrou de maintenance advisory (intra-base).
- Dépôt non commité : risque de perte/auditabilité tant qu'aucun historique Git n'existe.

## 20. Verdict

**Starter API Core V1 SAIN et durci.** Aucun problème bloquant. Les blocs socle, Auth/RBAC et Files
sont implémentés, sécurisés et testés ; les durcissements transverses HTTP, la corrélation de
requêtes et les sondes de santé sont en place. Les manques restants pour une **release V1** sont
ciblés et planifiés (voir roadmap) : décision logger structuré (ADR), stabilisation OpenAPI pour
ADR-016, CI/CD. Le **prochain module recommandé** est le **logging structuré + observabilité de base
(via ADR)**, puis la **stabilisation OpenAPI (ADR-016)**.
