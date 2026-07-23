# starter NestJS V1 minimal

Ce dossier contient le starter minimal du **starter NestJS** pour Enistere OS Foundation.

Depuis la mission Capability Packs 1A, ce starter est la **baseline `base`** du
modèle de composition modulaire : il compile, démarre et se teste sans aucune
capability composée. L'authentification vit dans
`capabilities/auth/targets/nestjs/` (overlay déclaratif appliqué par la
Factory) ; RBAC et Files sont des payloads parqués non câblés
(`capabilities/{rbac,files}/targets/nestjs/`). Les points d'intégration
générables par la Factory sont `src/composition/capabilities.ts` (modules,
guards globaux, throttlers nommés), le fragment Prisma ajouté à
`prisma/schema.prisma` et la section générée de `.env.example`.

Il initialise une base technique saine, générique et limitée volontairement au socle V1 :

- NestJS ;
- TypeScript ;
- configuration centralisée ;
- validation d'environnement ;
- `ValidationPipe` global ;
- Prisma configuré pour PostgreSQL ;
- health endpoint minimal ;
- exception filter global ;
- response interceptor ;
- Swagger/OpenAPI minimal ;
- tests de base.

Il ne contient aucune logique métier propre à un projet dérivé.

## Prérequis

- Node.js compatible avec NestJS 11.
- npm.
- PostgreSQL pour les futures fonctionnalités utilisant Prisma.

Cette mission ne crée pas de Dockerfile, Docker Compose, workflow CI/CD ou base de données réelle.

## Installation

Depuis `starters/nestjs/` :

```bash
npm install
```

Puis générer le client Prisma si nécessaire :

```bash
npm run prisma:generate
```

## Variables d'environnement

Créer localement un fichier `.env` à partir de `.env.example`.

Variables (voir `.env.example` pour les valeurs de développement) :

```txt
NODE_ENV=
PORT=
DATABASE_URL=
JWT_ACCESS_SECRET=
JWT_REFRESH_SECRET=
JWT_ACCESS_TTL=               # durée access token, en secondes
REFRESH_TOKEN_TTL=            # durée refresh token, en secondes
REFRESH_TOKEN_HASH_SECRET=    # secret HMAC de l'empreinte refresh (≠ secrets JWT)
ARGON2_MEMORY_COST=           # KiB, indicatif, à valider par benchmark (ADR-039)
ARGON2_TIME_COST=
ARGON2_PARALLELISM=
AUTH_LOGIN_RATE_LIMIT=        # tentatives de login autorisées par fenêtre
AUTH_LOGIN_RATE_TTL=          # fenêtre de rate limit login, en secondes
AUTH_REFRESH_RATE_LIMIT=      # tentatives de refresh autorisées par fenêtre
AUTH_REFRESH_RATE_TTL=        # fenêtre de rate limit refresh, en secondes
FILE_MAX_SIZE_BYTES=          # taille max d'un fichier, en octets (ADR-007)
FILE_ORIGINAL_NAME_MAX_LENGTH=
S3_ENDPOINT=                  # MinIO/S3 ; le scheme http/https détermine TLS
S3_REGION=
S3_ACCESS_KEY_ID=            # SECRET — jamais committé
S3_SECRET_ACCESS_KEY=        # SECRET — jamais committé
S3_BUCKET=                   # bucket privé
S3_FORCE_PATH_STYLE=         # true pour MinIO, false pour AWS S3
FILES_UPLOAD_RATE_LIMIT=     # uploads autorisés par fenêtre
FILES_UPLOAD_RATE_TTL=       # fenêtre de rate limit upload, en secondes
FILES_SIGNED_READ_URL_TTL_SECONDS=  # durée des URLs signées de lecture (bornée 30..900 s)
FILES_DOWNLOAD_URL_RATE_LIMIT=      # demandes d'URL de téléchargement par fenêtre
FILES_DOWNLOAD_URL_RATE_TTL=        # fenêtre de rate limit download, en secondes
FILES_PENDING_EXPIRATION_SECONDS=   # PENDING au-delà = abandonné (réconciliation)
FILES_REJECTED_RETENTION_SECONDS=   # conservation métadonnée des REJECTED
FILES_DELETED_METADATA_RETENTION_SECONDS=  # conservation métadonnée des DELETED (audit)
FILES_ORPHAN_MIN_AGE_SECONDS=       # âge min avant suppression d'un objet orphelin
FILES_RECONCILIATION_BATCH_SIZE=    # limite d'éléments par exécution de réconciliation
FILES_OWNER_MAX_ACTIVE_FILES=       # quota : nb max de fichiers actifs/propriétaire (0 = illimité)
FILES_OWNER_MAX_TOTAL_BYTES=        # quota : octets actifs cumulés max/propriétaire (0 = illimité)
SERVICE_NAME=                       # nom de service dans les logs (défaut api-nestjs-core)
LOG_LEVEL=                          # fatal|error|warn|info|debug|trace|silent (défaut info)
LOG_PRETTY=                         # pretty-print DEV uniquement ; forcé false en production
LOG_HTTP_ENABLED=                   # log unique de fin de requête (défaut true)
LOG_HEALTH_SUCCESS_ENABLED=         # logs de succès des sondes /health/* (défaut false)
CORS_ORIGINS=
```

Règles :

- ne jamais commiter `.env` ;
- ne jamais commiter de secret réel ;
- utiliser uniquement `.env.example` pour les placeholders ;
- adapter `CORS_ORIGINS` par environnement ;
- les durées (`*_TTL`) sont exprimées en **secondes**.

## Commandes

```bash
npm run start:dev
npm run build
npm run lint
npm run test
npm run test:e2e
npm run prisma:generate
npm run prisma:validate
npm run prisma:migrate         # crée/applique une migration en dev (nécessite PostgreSQL)
npm run prisma:migrate:deploy  # applique les migrations existantes (staging/prod)
npm run prisma:seed            # seed RBAC structurel idempotent (optionnel, nécessite PostgreSQL)
npm run test:cov               # couverture unitaire (les controllers/guards sont couverts par l'e2e)
npm run openapi:generate       # (ré)écrit openapi/openapi.json (snapshot canonique versionné, déterministe, sans secret)
npm run openapi:check          # échoue (RC=1) si le snapshot diverge du code (diff strict, sans outil externe)
npm run benchmark:argon2       # mesure hash/verify Argon2id (à exécuter sur la cible)

# Cycle de vie fichiers (Upload 4) — commandes CONTRÔLÉES, dry-run par DÉFAUT, jamais au boot de l'API.
# Nécessitent PostgreSQL + S3/MinIO. Le Deployment décidera du déclenchement périodique (cron/CI).
npm run files:reconcile -- --dry-run            # rapport DB↔S3 sans mutation (défaut)
npm run files:reconcile -- --apply [--max=N]    # applique les actions (rejet/suppression objet/orphelins)
npm run files:cleanup-pending -- --dry-run      # PENDING expirés (rapport)
npm run files:cleanup-pending -- --apply [--max=N]
npm run files:purge-metadata -- --dry-run       # purge physique des lignes DELETED/REJECTED (rétention)
npm run files:purge-metadata -- --apply [--max=N]
# Les 3 commandes sont MUTUELLEMENT EXCLUSIVES (verrou advisory `files:maintenance`) :
# une exécution concurrente est refusée (exit code 2), sans traitement partiel.
```

> Les commandes `prisma:migrate*` nécessitent une base PostgreSQL accessible via
> `DATABASE_URL`. `build`, `lint`, `test` et `prisma:validate`/`prisma:generate`
> n'en ont pas besoin.

## Structure

```txt
starters/nestjs/
  openapi/
    openapi.json     # snapshot canonique versionné (généré, jamais édité à la main)
    README.md        # contrat OpenAPI canonique (ADR-016)
  prisma/
    schema.prisma
    migrations/
  src/
    main.ts
    app.module.ts
    bootstrap/        # configuration applicative commune (configureApp)
    common/
    config/
    database/
    health/
    audit/            # journal d'audit générique (AuditModule)
    auth/             # login, refresh/logout, JWT guard, /auth/me, RBAC authz (Auth 2-5)
    users/            # module interne minimal implémenté
    roles/            # RolesModule + @Roles + RolesGuard (Auth 5)
    permissions/      # PermissionsModule + @Permissions + PermissionsGuard (Auth 5)
    files/            # FilesModule : upload multipart + stockage S3/MinIO (Upload 1/2)
    upload/           # cadrage (README)
  test/
```

## ADR appliquées

- ADR-002 : Prisma comme ORM principal V1.
- ADR-003 : `class-validator` + `class-transformer` et `ValidationPipe` global.
- ADR-004 : auth/session à access token court et refresh token révocable, non implémentée dans cette mission.
- ADR-006 : RBAC + permissions fines, cadré mais non implémenté.
- ADR-007 : upload MinIO/S3, cadré mais non implémenté.
- ADR-011 : clients HTTP basés sur `fetch`, côté consommateurs.

## Modules implémentés

### AppModule

Module racine important uniquement :

- `ConfigModule` ;
- `DatabaseModule` ;
- `HealthModule`.

### Config

La configuration est centralisée dans `src/config/`.

La validation d'environnement utilise `class-validator` et `class-transformer`.

### Bootstrap

`src/bootstrap/configure-app.ts` centralise la configuration applicative commune
(`ValidationPipe` global, filtre d'exception, interceptor de réponse). Elle est
réutilisée par `main.ts` et par les tests, pour éviter la duplication et garantir
un comportement identique. CORS et Swagger restent dans `main.ts` car spécifiques
au runtime.

### Database et modèles

`DatabaseModule` expose un `PrismaService` minimal.

Le schéma Prisma contient les **fondations d'authentification V1** :

- `User` : utilisateur générique minimal (`id` UUID, `email` unique normalisé,
  `passwordHash`, `status`, `createdAt`, `updatedAt`, `deactivatedAt`) ;
- `RefreshSession` : session de refresh révocable, support de la rotation
  (empreinte du token, `familyId`, `expiresAt`, `revokedAt`, `revocationReason`,
  `replacedBySessionId`, `lastUsedAt`, métadonnées techniques facultatives) ;
- `AuditLog` : journal d'audit générique des actions sensibles ;
- **RBAC (ADR-006)** : `Role`, `Permission` (convention `resource.action`), et les
  associations explicites `UserRole` et `RolePermission` (clés composites, index, cascades) ;
- **Fichiers (ADR-007)** : `StoredFile` (privé par défaut, `size` BigInt, `ownerId`
  `onDelete: SetNull`, `storageKey` unique) + enums `FileStatus`/`FileVisibility`/`FileCategory` ;
- enums `UserStatus` (`ACTIVE`, `INACTIVE`, `SUSPENDED`) et
  `SessionRevocationReason` (`ROTATED`, `LOGOUT`, `REUSE_DETECTED`, `SECURITY_ACTION`,
  `USER_DISABLED`).

Quatre migrations sont versionnées dans `prisma/migrations/`
(`init_auth_foundations`, `auth3_rotation_and_audit`, `auth5_rbac`, `files_foundation`).
Un seed structurel idempotent et optionnel (rôles, permissions RBAC + `files.*`) est
disponible (`npm run prisma:seed`).

> L'email est stocké normalisé (trim + minuscule) par `UsersService.normalizeEmail`,
> l'unicité étant garantie au niveau base.

### Users

`UsersModule` fournit des opérations internes minimales (recherche par email/id,
création à partir d'un `passwordHash` déjà produit, vérification d'existence
d'email). Aucun endpoint public. Voir `src/users/README.md`.

### Auth (login + refresh + `/auth/me` + RBAC — étapes Auth 2/3/4/5)

`AuthModule` expose :

```txt
POST /auth/login              (public, rate-limité)
POST /auth/refresh            (public, rate-limité)
POST /auth/logout             (public, idempotent)
GET  /auth/me                 (protégé)
GET  /auth/me/authorization   (protégé) — rôles + permissions pour l'UI
```

- hachage **Argon2id** centralisé via `PasswordHasher` (ADR-039, `@node-rs/argon2`) ;
- access token JWT court + **refresh token opaque** `<sessionId>.<secret>` ;
- `RefreshSession` ne stockant que l'**empreinte HMAC-SHA-256** (jamais le token brut) ;
- **rotation atomique**, **détection de réutilisation** (révocation de famille), **logout**
  idempotent (Auth 3) ;
- **stratégie Passport JWT** + **`JwtAuthGuard` global** : **routes privées par défaut**,
  contournées seulement par **`@Public()`** ;
- **`@CurrentUser()`** + contrat `AuthenticatedPrincipal` (`userId`, `sessionId`) ;
- **contrôle serveur de la session** via le claim `sid` à chaque requête protégée : un
  logout/rotation/révocation invalide immédiatement les access tokens liés ;
- **`GET /auth/me`** (profil public) ;
- **RBAC + permissions fines** (Auth 5, ADR-006) : `@Roles()` (OR), `@Permissions()` (AND),
  `RolesGuard`/`PermissionsGuard` globaux conditionnels (ordre garanti
  `JwtAuthGuard → RolesGuard → PermissionsGuard`), chargement **côté serveur** (jamais dans
  le JWT), pris en compte **immédiat** des changements de droits, `GET /auth/me/authorization`
  pour l'UI conditionnelle ;
- distinction stricte **401** (non authentifié) / **403 `AUTH_FORBIDDEN`** (non autorisé) ;
- **audit** persistant (`AuditModule`), y compris refus d'autorisation ; **rate limiting**
  séparé login / refresh.

Cycle : `login → refresh (rotation) → … → logout`. La concurrence (deux refresh
simultanés) est gérée par une révocation conditionnelle : un seul refresh réussit,
l'autre échoue sans révoquer la famille (voir `src/auth/README.md`).

Non encore implémenté : administration RBAC (CRUD public rôles/permissions), register public,
cookies web. Voir `src/auth/README.md`, `src/roles/README.md`, `src/permissions/README.md`.

> Les tests e2e (login, refresh, rotation, réutilisation, logout, concurrence, `/auth/me`,
> protection par défaut, **RBAC**) nécessitent une base **PostgreSQL** accessible (un conteneur
> jetable suffit) ; ils créent puis suppriment leurs données de test.

### Audit

`AuditModule` (global) journalise les actions sensibles dans `audit_logs` via
`AuditService.record(...)`. **Aucun token, hash, mot de passe ni payload complet** ;
un échec d'audit n'interrompt jamais le flux appelant.

### Files (Upload 1 → 4 : upload, stockage, consultation/URLs signées, cycle de vie)

`FilesModule` (ADR-007) — **privé par défaut**, API autorité, indépendant du fournisseur :

```txt
POST   /files                  (protégé files.upload, rate-limité, multipart/form-data)
GET    /files/:id              (protégé files.read, ownership) — métadonnées publiques
POST   /files/:id/download-url (protégé files.download, ownership, rate-limité, no-store) — URL signée
DELETE /files/:id              (protégé files.delete, ownership) — suppression objet+DB, idempotente
POST   /files/:id/quarantine   (protégé files.quarantine, administratif — sans ownership)
POST   /files/:id/restore      (protégé files.restore, administratif — sans ownership)
```

- modèle `StoredFile` ; `storageKey`/`bucket` internes jamais exposés ; `size` BigInt → chaîne ;
- **upload multipart** : Multer mémoire bornée (1 fichier), **détection du type réel par
  signatures** (JPEG/PNG/GIF/WebP/PDF — le MIME client n'est pas une preuve), validation
  extension↔contenu, **checksum SHA-256**, écriture **S3/MinIO** privée, finalisation `VALIDATED` ;
- **stockage objet** `@aws-sdk/client-s3` (MinIO **et** AWS S3) lié via `OBJECT_STORAGE` ;
- **compensation DB/S3** (non atomique) : objet supprimé si la finalisation échoue ; audit
  `FILE_ORPHANED_OBJECT_DETECTED` si la compensation échoue ;
- **consultation + téléchargement (Upload 3)** : `GET /files/:id` (métadonnées, statut inclus,
  jamais d'interne) et `POST /files/:id/download-url` qui génère une **URL signée courte**
  (`@aws-sdk/s3-request-presigner`) **uniquement** pour un fichier `VALIDATED` possédé et présent.
  Modèle d'accès = **permission `files.download` + ownership** ; durée bornée serveur (jamais
  client) ; `Content-Disposition: attachment` nettoyé (anti-injection) ; `Cache-Control: no-store` ;
  URL **jamais journalisée ni persistée** ; non révocable avant expiration (mitigée par un TTL court) ;
- **cycle de vie (Upload 4)** : `DELETE /files/:id` supprime l'**objet S3 puis** la ligne
  (`DELETED`), **idempotent**, ownership requis ; quarantaine/restauration **administratives**
  (permission dédiée, sans ownership) bloquant tout accès/URL ; transitions centralisées et
  conditionnelles (anti-concurrence) ; réconciliation **DB↔S3** (comparaison directe, jamais les
  seuls audits) via les commandes CLI **dry-run par défaut** `npm run files:reconcile` /
  `npm run files:cleanup-pending` (aucun scheduler embarqué) ;
- **durcissement (Upload 5)** : quotas par propriétaire (nombre + octets, `0` = illimité) **vérifiés
  atomiquement** à la création via un verrou advisory par propriétaire ; **verrou de maintenance**
  (`files:maintenance`) rendant réconciliation/cleanup/purge mutuellement exclusifs ; **purge
  physique** contrôlée (`npm run files:purge-metadata`, rétention + objet absent, `AuditLog`
  jamais purgés). Revue permanente : [`docs/FILES_REVIEW.md`](docs/FILES_REVIEW.md) ;
- ownership (404 anti-énumération), permissions `files.*`, throttling dédié (upload/download), audit `FILE_*` ;
- réponse `PublicStoredFile` / `SignedDownloadResult` : jamais `bucket`/`storageKey`/`checksum`/ownerId.

Pas encore de suppression physique, de quarantaine opérationnelle, d'upload présigné ni de
partage entre utilisateurs (Upload 4+). Voir `src/files/README.md`.

> Les tests e2e fichiers nécessitent **PostgreSQL** et **MinIO** jetables ; `npm run test:e2e`
> active `--experimental-vm-modules` (compat AWS SDK sous Jest, sans effet runtime).

### Health

Endpoints disponibles :

```txt
GET /health        # info générale
GET /health/live   # liveness (aucune dépendance externe)
GET /health/ready  # readiness (PostgreSQL ; 503 générique si indisponible)
```

> **Durcissement HTTP transverse** (`bootstrap/configure-app.ts`) : Helmet (en-têtes de sécurité,
> CSP désactivée car API JSON / Swagger dev), `X-Powered-By` désactivé, limites de body parsers
> (`JSON_BODY_LIMIT`/`URL_ENCODED_BODY_LIMIT`), `trust proxy` explicite (`TRUST_PROXY_HOPS`, 0 par
> défaut), CORS strict (rejet de `*`+credentials), identifiant de corrélation `X-Request-Id`
> (validé-ou-généré). HSTS/CSP des pages servies relèvent du reverse proxy (Traefik/Deployment).
> Revue d'étape : [`docs/API_CORE_V1_REVIEW.md`](docs/API_CORE_V1_REVIEW.md),
> [`docs/API_CORE_V1_IMPLEMENTATION_STATUS.md`](docs/API_CORE_V1_IMPLEMENTATION_STATUS.md),
> [`docs/API_CORE_V1_NEXT_ROADMAP.md`](docs/API_CORE_V1_NEXT_ROADMAP.md).

> **Logging structuré** (ADR-040, [`src/common/logging/README.md`](src/common/logging/README.md)) :
> moteur **Pino** (intégration directe ; preuve `nestjs-pino` dans
> [`docs/STRUCTURED_LOGGING_COMPATIBILITY_PROOF.md`](docs/STRUCTURED_LOGGING_COMPATIBILITY_PROOF.md)).
> JSON sur **stdout** (HTTP) / **stderr** (CLI) ; un log HTTP unique (route normalisée, `requestId`,
> statut, durée) ; redaction centralisée (jamais token/mot de passe/URL signée/buffer) ; `AuditLog`
> séparé ; collecte/Loki/Grafana = Deployment.

### Documentation OpenAPI — contrat canonique stabilisé (ADR-016)

Swagger/OpenAPI est exposé sur :

```txt
GET /docs
```

Il est désactivé automatiquement lorsque `NODE_ENV=production`, conformément au cadrage du `STARTER_SPECIFICATION.md` (Swagger non public en production).

Le **contrat OpenAPI est désormais stabilisé** comme **source de vérité des API publiques** (ADR-016),
**avant** toute génération de client. Voir [`openapi/README.md`](openapi/README.md). En résumé :

- **snapshot canonique versionné** [`openapi/openapi.json`](openapi/openapi.json), régénéré depuis le
  code (`npm run openapi:generate`) — **jamais édité à la main** ; **déterministe** (deux générations =
  zéro diff) ; fraîcheur garantie par `npm run openapi:check` (diff strict, **sans outil externe**) ;
- **`operationId` stables** `<domaine>_<actionCamelCase>` (ex. `auth_login`, `files_upload`),
  indépendants des noms de classes/méthodes (tout renommage = **breaking**) ; **tags** canoniques
  `Health`/`Auth`/`Files` ;
- **DTO de sortie publics** (`*ResponseDto`, `PublicStoredFileDto`…) ; enveloppe de succès
  `{ success, data, timestamp }` (`data` typé) et **schéma d'erreur commun** `ApiErrorResponseDto`
  (`statusCode`, `message`, `errorCode`, `details?`, `path`, `timestamp`, `requestId?`) **alignés sur
  le runtime** ; seules les erreurs réellement possibles sont documentées par endpoint ;
- **formats** explicites : `uuid`, `date-time`, **`BigInt` public en chaîne décimale**
  (`type: string`, `pattern: ^[0-9]+$`), `binary` (multipart), enums **fermées** ; en-tête de
  corrélation **`X-Request-Id`** documenté (et présent dans le corps d'erreur) ;
- **aucune fuite** : aucun modèle Prisma, secret, `passwordHash`/`tokenHash`, clé de stockage, bucket,
  empreinte ni URL signée réelle (vérifié par un test de contrat `test/openapi-contract.e2e-spec.ts`).

> Le contrat alimente les **packages clients officiels** du monorepo (générés **depuis ce snapshot**,
> ADR-016, après preuve `docs/OPENAPI_CLIENT_PROOF.md`) — maintenus **hors de ce core** :
> [`packages/api-contracts`](../../packages/api-contracts) (`@enistere/api-contracts`, types) et
> [`packages/api-client-fetch`](../../packages/api-client-fetch) (`@enistere/api-client-fetch`, client
> Fetch typé). Validés localement, **non publiés**, **non intégrés** aux cores. Le core API ne dépend
> jamais des clients (dépendance à sens unique : snapshot → contracts → client).

## Modules cadrés mais non implémentés

Le dossier suivant contient uniquement un README de cadrage :

- `upload/` (le domaine fichier est désormais porté par `src/files/` — Upload 1).

`auth/`, `users/`, `roles/`, `permissions/` et `files/` sont implémentés
(authentification, RBAC, fondations fichiers).

## Sécurité

Le starter applique déjà :

- `ValidationPipe` global ;
- `whitelist: true` ;
- `forbidNonWhitelisted: true` ;
- transformation contrôlée ;
- CORS configurable ;
- erreurs standardisées sans stack trace volontaire, enveloppe canonique `ApiErrorResponse` (ADR-048) ;
- Swagger désactivé en production ;
- absence de secret réel ;
- hachage **Argon2id** des mots de passe, paramètres centralisés (ADR-039) ;
- mot de passe et hash jamais journalisés ; `passwordHash` jamais renvoyé ;
- refresh token jamais stocké en clair (empreinte HMAC-SHA-256 uniquement) ;
- secret d'empreinte refresh distinct des secrets JWT ;
- erreurs de login génériques (anti-énumération) ;
- rate limiting du login et du refresh ;
- rotation des refresh tokens, détection de réutilisation, révocation de famille ;
- audit persistant des actions d'authentification ;
- **routes privées par défaut** (guard JWT global + `@Public()`) ;
- contrôle serveur de la session (`sid`) à chaque requête protégée ;
- **RBAC deny by default** : autorisation évaluée côté serveur, jamais dans le JWT,
  rôles (OR) et permissions (AND), 403 génériques sans révéler la règle manquante ;
- audit des refus d'autorisation ;
- **fichiers privés par défaut** : `storageKey`/`bucket` internes jamais exposés, clé générée
  serveur (jamais le nom original), validation déclarative MIME/extension/taille, ownership 404.

Le starter n'implémente pas encore la suppression physique/quarantaine (Upload 4) ni l'administration RBAC.

## Limites de cette version

- Modèles Prisma : fondations Auth (`User`, `RefreshSession`, `AuditLog`), RBAC
  (`Role`, `Permission`, `UserRole`, `RolePermission`) et fichiers (`StoredFile`) ; pas de modèle métier.
- Seed structurel **optionnel** et idempotent (RBAC + `files.*`, non exécuté par `migrate deploy`).
- Login + refresh + logout + `/auth/me` + RBAC + upload multipart (stockage S3/MinIO réel)
  + consultation/**URL signée courte** (Upload 3) + **suppression confidentielle, quarantaine
  administrative et réconciliation DB/S3** (Upload 4), mais **pas** d'antivirus, de traitement
  média, d'administration RBAC ni de register public.
- Upload : réception en mémoire bornée (gros médias = stratégie streaming/URL signée ultérieure) ;
  cohérence DB/S3 **compensatoire**, non atomique ; pas d'antivirus ni de traitement média.
- Téléchargement : URL signée S3 **non révocable** avant expiration (mitigée par un TTL court,
  borné serveur 30..900 s) ; l'API ne proxyfie jamais le contenu ; aucun objet public/anonyme.
- Cycle de vie : suppression **objet→DB** (priorité confidentialité), idempotente ; quarantaine
  **administrative** (sans ownership) ; purge physique **contrôlée** (rétention + objet absent +
  verrou ; `AuditLog` jamais purgés) ; réconciliation/cleanup/purge **bornées/dry-run par défaut**,
  **mutuellement exclusives** (verrou advisory), déclenchées par CLI (**aucun scheduler embarqué** :
  risque multi-instance laissé au Deployment).
- Quotas par propriétaire (nombre + octets, `0` = illimité) vérifiés **atomiquement** ; pas de
  facturation. Détection de signatures **≠ antivirus** : la V1 ne garantit pas l'absence de malware
  (architecture antivirus/média/streaming documentée dans `docs/FILES_REVIEW.md`).
- Pas de Docker ni de CI/CD ; pas de logique métier.
- Vérification de session en base à chaque requête protégée (révocation immédiate) ;
  cache Redis des sessions envisageable plus tard, non ajouté ici.
- Rate limiting en mémoire (mono-instance) : une stratégie Redis/distribuée sera requise
  en multi-instances.
- Sessions révoquées conservées (détection de réutilisation/audit) ; purge déléguée à un
  futur job (pas de scheduler).
- Ancien access token valide jusqu'à sa courte expiration après un refresh (pas de denylist V1).
- Les migrations et les tests e2e nécessitent une base PostgreSQL (un conteneur jetable
  suffit) ; aucun Dockerfile/Compose n'est ajouté au dépôt.
- Paramètres Argon2id indicatifs : à valider par benchmark sur l'environnement cible.

## Prochaines missions recommandées

> Le bloc **Files est validé V1** (revue Upload 5 : quotas, verrou de maintenance, purge ;
> voir `docs/FILES_REVIEW.md`). Les éléments ci-dessous sont **post-V1** et relèvent de workers
> externes / du Deployment — pas du core API seul.

1. **Worker antivirus externe** (ClamAV / service managé) alimentant la quarantaine : scan
   hors requête HTTP, fail-closed pour les catégories sensibles. Voir `docs/FILES_REVIEW.md §21`.
2. **Worker média externe** (thumbnails/transcodage) sur objets sources immuables, dérivés privés.
   Voir `docs/FILES_REVIEW.md §22`.
3. **Gros fichiers** : streaming / multipart S3 / **URL signée d'upload** (intention + clé API,
   finalisation API, aucune credential côté client). Voir `docs/FILES_REVIEW.md §23`.
4. Planification (cron/CI/orchestrateur Deployment) des commandes `files:reconcile` /
   `files:cleanup-pending` / `files:purge-metadata` (sérialisées par verrou, sans scheduler embarqué).
5. Administration RBAC (gestion rôles/permissions) et cache Redis optionnel (sessions + autorisation).
