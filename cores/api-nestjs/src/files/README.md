# FilesModule — V1 (Upload 1 → 5)

Domaine fichier générique (ADR-007). **Privé par défaut**, **API autorité finale**,
**indépendant du fournisseur de stockage**. Upload 1 pose les fondations ; **Upload 2** ajoute
l'upload multipart sécurisé et le stockage objet S3/MinIO réel ; **Upload 3** ajoute la
consultation sécurisée des métadonnées et les URLs signées de lecture courtes ; **Upload 4**
ajoute la suppression confidentielle, la quarantaine administrative et la réconciliation DB/S3 ;
**Upload 5** durcit le bloc (quotas par propriétaire, verrou de maintenance, purge contrôlée) et
documente les architectures futures. Voir la **revue permanente** : [`docs/FILES_REVIEW.md`](../../docs/FILES_REVIEW.md).

## Upload 5 — durcissement : quotas, verrou de maintenance, purge

- **Quotas par propriétaire** (`FileQuotaService`) : `FILES_OWNER_MAX_ACTIVE_FILES` et
  `FILES_OWNER_MAX_TOTAL_BYTES` (`0`/`0n` = illimité). Comptent les fichiers **actifs**
  (`PENDING`/`UPLOADED`/`VALIDATED`/`QUARANTINED`) ; les `REJECTED`/`DELETED` **ne consomment
  plus** le quota. Vérification **atomique avec la création** du `PENDING` via un **verrou advisory
  transactionnel par propriétaire** (`pg_advisory_xact_lock`, auto-relâché en fin de transaction) :
  aucun dépassement par concurrence (testé sous uploads simultanés). Taille **réelle reçue** (jamais
  une taille client). Erreurs : `409 FILE_COUNT_QUOTA_EXCEEDED` / `409 FILE_STORAGE_QUOTA_EXCEEDED`
  (la taille individuelle reste `413 FILE_SIZE_EXCEEDED`). Audit `FILE_QUOTA_EXCEEDED` **uniquement
  sur dépassement**.
- **Verrou de maintenance** (`MaintenanceLockService`) : `pg_try_advisory_lock` (niveau session,
  **sans attente**) sur une clé unique `files:maintenance`. Les commandes réconciliation / cleanup /
  purge sont **mutuellement exclusives** : une seconde exécution concurrente est **refusée**
  (`MaintenanceLockBusyError`, exit code `2`), aucun traitement partiel. **N'impacte jamais l'API**
  (aucune route n'acquiert ce verrou). **Pas de Redis** (PostgreSQL, déjà présent). Libéré en
  `finally` (best-effort) et, en backstop, à la fermeture de la session (processus courts).
- **Purge physique contrôlée** (`FilePurgeService`, `npm run files:purge-metadata`) : supprime les
  lignes `DELETED`/`REJECTED` dont la **rétention est dépassée** ET dont **aucun objet n'est
  présent**. Si l'objet existe encore → **non purgée** (incohérence signalée : réconcilier d'abord).
  Les `AuditLog` ne sont **jamais** supprimés. Dry-run par défaut, batch borné, sous verrou.

### Architectures futures (documentation — NON implémentées)

- **Antivirus** : `Upload → stockage privé → statut d'attente de scan → job → worker antivirus
  externe (ClamAV / service managé) → CLEAN|INFECTED|ERROR → VALIDATED|QUARANTINED`. Jamais dans la
  requête HTTP ; worker isolé, timeout, taille max, **fail-closed** pour les catégories sensibles
  (aucun téléchargement avant `CLEAN`). **La V1 ne garantit PAS l'absence de malware** : la détection
  de signatures **n'est pas un antivirus ni une validation complète de format** (un PDF avec
  JavaScript reste un PDF accepté, non analysé). Détail dans `docs/FILES_REVIEW.md`.
- **Traitements médias** : `API → objet source privé immuable → job → worker média isolé → dérivés
  privés → metadata de dérivés`. Jamais dans la requête principale ; limites CPU/mémoire, retry
  borné, idempotence, audit. Pas de thumbnail/transcodage/vidéo/OCR en V1.
- **Gros fichiers / streaming** : `memoryStorage` borné convient aux **petits fichiers** V1 ;
  au-delà, migrer vers streaming / fichier temporaire / multipart S3 / **URL signée d'upload**
  (intention + clé créées par l'API, durée courte, taille/type bornés, finalisation API, scan,
  ownership, **aucune credential S3 côté client**).

## Upload 4 — suppression, quarantaine, réconciliation, cycle de vie

Endpoints :

- `DELETE /files/:id` — suppression applicative complète (protégé `files.delete`, ownership).
- `POST /files/:id/quarantine` — mise en quarantaine **administrative** (protégé `files.quarantine`).
- `POST /files/:id/restore` — levée de quarantaine **administrative** (protégé `files.restore`).

- **Suppression (objet → DB)** : on supprime l'objet S3 **d'abord**, puis on marque la ligne
  `DELETED` (Option B — priorité à la confidentialité : un objet supprimé ne reste pas accessible
  via une ancienne URL ; une référence DB active vers un objet absent est détectable). Aucune
  transaction distribuée. **Idempotente** : re-supprimer renvoie `204` ; un objet déjà absent est
  traité comme objectif atteint (marquage `DELETED` + audit de l'incohérence). Échec stockage →
  `503` sans marquage ; échec DB après suppression S3 → `500` + audit critique
  (`FILE_DATABASE_FINALIZATION_FAILED` + `FILE_STORAGE_OBJECT_MISSING`). Ownership obligatoire
  (404 anti-énumération) ; aucun bypass administrateur. Le client ne fournit ni bucket ni clé.
  `deletionRequestedAt` marque l'intention avant la suppression de l'objet (aide la réconciliation).
- **Quarantaine** : `QUARANTINED` = l'objet existe peut-être, mais **aucun accès/URL signée**
  (protection déjà assurée par `FileAccessService`). Opérations **administratives** : permission
  dédiée **sans condition d'ownership** (à la différence des endpoints utilisateur). Raison bornée
  (`QuarantineFileDto` : `SECURITY_REVIEW`/`CONTENT_MISMATCH`/`POLICY_VIOLATION`/`MANUAL_ACTION`,
  jamais de texte libre). Pendant la quarantaine, le propriétaire **voit** les métadonnées et le
  statut mais ne lit pas le contenu. **Restauration prudente** : retour à `VALIDATED` seulement si
  l'objet existe et que le checksum est connu ; aucune ré-analyse antivirus (décision manuelle V1).
  > **Limite** : une URL signée émise **avant** la quarantaine peut rester valide jusqu'à son
  > expiration (S3 ne révoque pas). Mitigations : TTL court ; suppression physique possible pour un
  > incident grave (hors politique automatique V1) ; changement de clé/copie si révocation forte requise.
- **Transitions** : centralisées dans `lifecycle/file-state-transitions.ts` (source unique,
  testable). `PENDING/UPLOADED → VALIDATED|REJECTED|DELETED` ; `VALIDATED → QUARANTINED|DELETED` ;
  `QUARANTINED → VALIDATED|DELETED` ; `REJECTED → DELETED` ; `DELETED` terminal. Les transitions
  sensibles utilisent des **updates conditionnels** (anti-concurrence) : deux suppressions
  concurrentes restent idempotentes ; une suppression l'emporte sur une quarantaine (un `DELETED`
  ne redevient jamais `QUARANTINED`/`VALIDATED`).
- **Réconciliation DB ↔ S3** (`reconciliation/file-reconciliation.service.ts`) : **source de
  vérité = comparaison directe** lignes `StoredFile` ↔ objets réels (`objectExists`/`listObjects`),
  **jamais** les seuls audit logs. Cas traités : (A) `VALIDATED` + objet absent →
  `REJECTED` (ou `DELETED` si une suppression avait été initiée) ; (B) `PENDING` ancien → `REJECTED`
  si objet absent, **signalé** (jamais validé automatiquement) si objet présent ; (C) `REJECTED`
  avec objet → suppression de l'objet ; (D) `DELETED` avec objet → suppression de l'objet ;
  (E) objet **orphelin** (sans ligne) plus vieux que le seuil → supprimé. Toujours **scopée par
  préfixe** (`<environment>/`), **bornée** (`maxItems`/batch), **dry-run par défaut**. Une erreur
  de stockage (existence incertaine) ne déclenche **aucune** action destructive. Aucune suppression
  hors namespace applicatif ; aucun listing de bucket entier sans préfixe.
- **Commandes** (CLI contrôlées, **dry-run par défaut**, jamais au démarrage de l'API) :
  - `npm run files:reconcile -- --dry-run | --apply [--max=N]`
  - `npm run files:cleanup-pending -- --dry-run | --apply [--max=N]`
  Le Cloud Core décidera du déclenchement périodique (cron système/CI/orchestrateur). **Aucun
  scheduler n'est embarqué** (`@nestjs/schedule` non ajouté : risque d'exécution multi-instance).
- **Rétention** (conceptuelle, configurable) : `FILES_PENDING_EXPIRATION_SECONDS`,
  `FILES_REJECTED_RETENTION_SECONDS`, `FILES_DELETED_METADATA_RETENTION_SECONDS`,
  `FILES_ORPHAN_MIN_AGE_SECONDS`, `FILES_RECONCILIATION_BATCH_SIZE`. Jamais de suppression d'objet
  orphelin trop récent ; les métadonnées supprimées sont conservées (audit/historique) ; **pas de
  suppression physique des lignes PostgreSQL** en V1. Les valeurs finales relèvent des projets
  dérivés et des contraintes légales.
- **Quotas (fondations)** : `FilesService.getOwnerUsage` calcule le nombre et la taille des
  fichiers **actifs** d'un propriétaire (lecture seule). Aucun quota contraignant en V1 (Upload 5).
- **Audit** : `FILE_DELETION_REQUESTED`, `FILE_OBJECT_DELETED`, `FILE_DELETED`,
  `FILE_DELETION_FAILED`, `FILE_DATABASE_FINALIZATION_FAILED`, `FILE_QUARANTINED`,
  `FILE_QUARANTINE_RELEASED`, `FILE_RECONCILIATION_STARTED/COMPLETED/ACTION`, `FILE_PENDING_EXPIRED`,
  `FILE_ORPHAN_DELETED`, `FILE_QUOTA_EXCEEDED` (Upload 5, sur dépassement uniquement). Les batchs
  auditent des **résumés/compteurs** (pas un événement par objet sain). Jamais de contenu, URL,
  storageKey, bucket, checksum ni credential.

## Upload 3 — consultation sécurisée + URLs signées de lecture

Endpoints :

- `GET /files/:id` — métadonnées publiques d'un fichier **possédé** (protégé `files.read`).
- `POST /files/:id/download-url` — génère une **URL signée de lecture courte** (protégé
  `files.download`, rate-limité, `Cache-Control: no-store`).

- **Présignature** : `@aws-sdk/s3-request-presigner` (`getSignedUrl` + `GetObjectCommand`),
  compatible avec le `@aws-sdk/client-s3` déjà installé. Aucun second SDK, aucune URL concurrente.
- **Modèle d'accès V1** = **permission `files.download` + ownership**. La permission seule ne
  permet pas de télécharger le fichier d'un autre (404 anti-énumération) ; le propriétaire sans
  permission est refusé (403). `GET /files/:id` exige `files.read` + ownership.
- **États** : seuls les fichiers `status = VALIDATED`, `deletedAt = null` et de **visibilité
  signable** (`PRIVATE`/`SIGNED`) produisent une URL. `PENDING`/`REJECTED`/`QUARANTINED` → 409
  `FILE_NOT_DOWNLOADABLE` ; `DELETED`/soft-deleted → 404. Les **métadonnées** (statut inclus)
  restent consultables par le propriétaire pour un fichier non supprimé.
- **Visibilités** : seules `PRIVATE` et `SIGNED` donnent un accès signé après contrôle.
  `INTERNAL` → pas d'accès utilisateur standard ; `PUBLIC` **non pris en charge** en V1 (aucun
  objet rendu public, aucune ACL publique), même si l'enum la contient.
- **Existence objet** : `objectExists` (HeadObject) est vérifié **avant** la signature
  (cohérence DB/S3). Objet absent → **503 générique** (`FILE_SIGNED_URL_GENERATION_FAILED`) +
  audit technique `FILE_STORAGE_OBJECT_MISSING` ; le fichier n'est pas marqué supprimé
  automatiquement (réconciliation Upload 4). L'incohérence n'est jamais exposée.
- **Durée** : `FILES_SIGNED_READ_URL_TTL_SECONDS`, **bornée serveur** (min 30 s, max 900 s),
  jamais fournie par le client. `expiresAt = now + TTL`. Les horloges serveur et MinIO/S3
  doivent être synchronisées. **Non-révocabilité** : une URL signée ne peut généralement pas
  être révoquée individuellement avant son expiration — mitigée par un TTL court, l'ownership/la
  permission vérifiés avant émission, le bucket privé, et l'absence de journalisation/persistance.
- **Content-Type / Content-Disposition** : l'URL impose `ResponseContentType = StoredFile.mimeType`
  (MIME réel enregistré à l'upload, jamais le client) et un `Content-Disposition: attachment`
  **nettoyé** : basename uniquement (anti-traversal), suppression CR/LF/contrôles/guillemets,
  longueur bornée, repli ASCII sûr + `filename*=UTF-8''…` (RFC 5987). Aucune injection de header.
- **Réponse** : `SignedDownloadResult` **minimal** = `{ url, expiresAt }`. Jamais `bucket`,
  `storageKey`, `checksum`, credentials, signature séparée ni paramètre interne. (L'URL présignée
  embarque nécessairement bucket+clé dans son **chemin** — c'est par conception S3 ; ce qui est
  garanti est l'absence de **champ interne** dans le contrat et l'absence d'URL dans les logs/audit.)
- **POST (et non GET)** : générer un accès temporaire sensible est une **commande auditée**, pas
  une consultation cacheable. Réponse `Cache-Control: no-store`, `Pragma: no-cache`,
  `Referrer-Policy: no-referrer`. L'URL signée n'apparaît jamais dans un chemin/query d'API interne.
- **Audit** : `FILE_DOWNLOAD_URL_ISSUED` (succès, avec `expiresInSeconds`), `FILE_DOWNLOAD_URL_DENIED`
  (statut/visibilité non téléchargeable, échec de signature), `FILE_STORAGE_OBJECT_MISSING`.
  `FILE_METADATA_ACCESSED` est **défini mais non émis** (lecture banale, volume élevé). **Jamais**
  d'URL signée, de query de signature, de `storageKey`, de `bucket` ni de `checksum` en audit.
- **SSRF** : le client ne fournit aucune URL/endpoint/clé ; l'API construit tout depuis l'endpoint
  et le bucket configurés + la clé interne. Aucune redirection arbitraire, aucun proxy du contenu.
- **Configuration** : `FILES_SIGNED_READ_URL_TTL_SECONDS`, `FILES_DOWNLOAD_URL_RATE_LIMIT`,
  `FILES_DOWNLOAD_URL_RATE_TTL` (throttler nommé `download`, distinct de `upload`).

> **Tests** : unitaires (`S3ObjectStorage.createSignedReadUrl` avec `getSignedUrl` mocké,
> `content-disposition`, `FileAccessService`, `FilesController`) + e2e MinIO+PostgreSQL réels :
> émission d'URL, **téléchargement HTTP réel** via l'URL signée, content-type/disposition,
> expiration réelle refusée par MinIO, objet manquant → 503, bucket privé non lisible sans
> signature, anti-énumération, refus 403/409, absence d'URL dans les audits.

## Upload 2 — multipart sécurisé + stockage S3/MinIO

Endpoint : `POST /files` (protégé `files.upload`, rate-limité, `multipart/form-data`).

- **Client S3** : `@aws-sdk/client-s3` (compatible MinIO **et** AWS S3, portable, ADR-007) ;
  `S3ObjectStorage` lié au token `OBJECT_STORAGE` (client partagé via `S3_CLIENT`).
- **Réception** : Multer en **mémoire bornée** (un seul fichier, `fileSize = FILE_MAX_SIZE_BYTES`,
  champs/parts limités) ; aucune confiance dans `originalname`/`mimetype`/taille déclarés.
- **Détection du type réel** : `ContentTypeDetector` par **signatures binaires** (JPEG, PNG, GIF,
  WebP, PDF). Détecteur ciblé maison (plutôt que `file-type`, ESM-only en friction avec le starter
  CommonJS). Contenu non identifié → refusé. Ce n'est pas un antivirus.
- **Validation** : MIME réel autorisé pour la catégorie ; extension déclarée cohérente avec le
  type réel (sinon refus, y compris extensions dangereuses) ; taille **réelle** ≤ limite.
- **Checksum** : SHA-256 du contenu exact écrit, stocké dans `StoredFile.checksum`.
- **Flux** : validations → `PENDING` → `putObject` (bucket privé) → finalisation `VALIDATED`.
  L'extension/MIME stockés proviennent du **type réel détecté**, jamais du nom fourni ; la
  `storageKey` reste générée serveur.
- **Compensation DB/S3** (pas d'atomicité distribuée) : échec d'écriture → `REJECTED` + 503 ;
  échec de finalisation → suppression de l'objet (compensation) + 500 ; si la suppression échoue
  aussi → audit `FILE_ORPHANED_OBJECT_DETECTED` pour réconciliation future (Upload 4).
- **Réponse** : `PublicStoredFile` (201) — jamais `bucket`, `storageKey`, `checksum`, `ownerId`,
  ETag, versionId ni URL.

> **Tests e2e** : `npm run test:e2e` utilise `NODE_OPTIONS=--experimental-vm-modules` (contournement
> de l'import dynamique de l'AWS SDK sous la VM Jest ; sans effet sur le runtime réel).

> **Compatibilité `fetch + FormData`** (ADR-011) : l'endpoint accepte un multipart standard ; le
> client ne doit pas forcer `Content-Type: multipart/form-data` (laisser construire le boundary).

### Configuration S3/MinIO

`S3_ENDPOINT` (le scheme http/https détermine TLS), `S3_REGION`, `S3_ACCESS_KEY_ID`,
`S3_SECRET_ACCESS_KEY` (**secrets**, jamais committés), `S3_BUCKET` (privé), `S3_FORCE_PATH_STYLE`
(true pour MinIO). `FILES_UPLOAD_RATE_LIMIT`/`FILES_UPLOAD_RATE_TTL` pour le throttling dédié.
Le bucket n'est **pas** créé automatiquement en production (création autorisée uniquement en e2e).

---

## Upload 1 — fondations

Modèle, contrats, validation déclarative, génération de clé, abstraction de stockage.

## Nom du module

`FilesModule` (et non `UploadModule`) : l'upload n'est qu'une étape du cycle de vie du
fichier (création → validation → stockage → accès → suppression). L'ADR-007 (qui parle
d'« UploadModule ») n'est pas modifié ; le couche/contrôleur d'upload viendra dans Files.

## Modèle Prisma `StoredFile`

`id`, `ownerId?` (relation `User`, **`onDelete: SetNull`** pour préserver l'audit),
`subjectId?` (rattachement métier générique, sans relation polymorphique), `originalName`
(métadonnée non fiable), `storageKey` (unique, générée serveur, **interne**), `bucket`
(**interne**), `mimeType`, `extension`, `size` (**BigInt**), `checksum?` (SHA-256, futur),
`visibility`, `status`, `category`, `metadata?` (JSON contrôlé), `uploadedAt?`,
`validatedAt?`, `rejectedAt?`, `createdAt`, `updatedAt`, `deletedAt?`. Index : `ownerId`,
`status`, `category`, `createdAt`, `deletedAt` ; `storageKey` unique.

## Enums

- `FileStatus` : `PENDING` (intention créée, contenu non stocké), `UPLOADED`, `VALIDATED`,
  `REJECTED`, `QUARANTINED`, `DELETED`.
- `FileVisibility` : `PRIVATE` (défaut), `PUBLIC` (ne rend pas le bucket public), `SIGNED`
  (URL temporaire), `INTERNAL`.
- `FileCategory` : `IMAGE`, `DOCUMENT`, `AVATAR`, `MEDIA`, `VIDEO`, `AUDIO`,
  `IDENTITY_DOCUMENT`, `ATTACHMENT`, `OTHER`. Aucune catégorie métier.

## Ownership

Modèle simple : `ownerId === currentUser.userId`. `findOwnedFile`/`getOwnedFile`
retournent **404** si le fichier est absent **ou** non possédé (anti-énumération). L'accès
administrateur futur passera par une permission dédiée, pas par l'ownership.

## Contrats

- `StoredFileView` (interne) : inclut `storageKey`/`bucket` ; pour l'orchestration (Upload 2).
- `PublicStoredFile` (public) : **sans** `bucket`, `storageKey`, `ownerId`, `checksum`,
  `metadata`. Aucune URL en Upload 1.
- DTO internes : `CreatePendingFileInput`, `FinalizeStoredFileInput`, `RejectStoredFileInput`.

## Sérialisation BigInt

`size` est un `BigInt` Prisma. Il n'est **jamais** passé tel quel à `JSON.stringify` :
les contrats exposent `size` en **chaîne décimale** (`bigint.toString()`).

## Clé de stockage

`StorageKeyGenerator` produit `<environment>/<category>/<yyyy>/<mm>/<uuid>.<extension>`.
Générée serveur, n'utilise **jamais** `originalName`, normalise l'extension et interdit
`..`, slashs et caractères dangereux.

## Politique MIME / extension / taille

`FileValidationPolicy` (déclarative, Upload 1) : MIME autorisé par catégorie, cohérence
extension ↔ MIME, taille max (octets), longueur max et nettoyage du nom original. **Le MIME
déclaré par le client n'est pas une preuve** : l'inspection du contenu/signatures magiques
relèvera d'Upload 2.

## Abstraction de stockage

Interface `ObjectStorage` (token `OBJECT_STORAGE`) indépendante du fournisseur :
`putObject`, `deleteObject` (**idempotent** : S3/MinIO ne lève pas `NoSuchKey`), `objectExists`,
`createSignedReadUrl`, `listObjects` (Upload 4 : listing **borné et scopé par préfixe**, pagination
par `continuationToken`, usage interne — jamais exposé par un controller), `checkHealth`. Depuis
**Upload 2**, `OBJECT_STORAGE` est lié à `S3ObjectStorage` (MinIO/AWS S3). Depuis **Upload 3**,
`createSignedReadUrl({ bucket, storageKey, expiresInSeconds, responseContentType?,
responseContentDisposition? }) → { url, expiresAt }` est implémenté (presigner, lecture seule) ;
le résultat n'expose ni bucket, ni clé, ni credentials, et les erreurs SDK sont mappées en
erreur générique. `InMemoryObjectStorage` existe **uniquement pour les tests** (jamais en
production, jamais équivalent à MinIO/S3).

## Permissions

Structurelles (seed) : `files.read`, `files.upload`, `files.download`, `files.delete`,
`files.quarantine`, `files.restore`. Le rôle `administrator` les reçoit ; le rôle `user` ne reçoit
**pas** automatiquement `files.download`/`files.delete`/`files.quarantine`/`files.restore` sans
décision explicite. Pas de `files.manage` en V1 (évite la redondance). Aucun utilisateur
créé/affecté automatiquement.

Modèles d'accès : **téléchargement et suppression** exigent la permission **ET l'ownership** (la
permission seule ne donne pas accès au fichier d'autrui — 404 anti-énumération). **Quarantaine et
restauration** sont **administratives** : permission dédiée **sans** ownership (un opérateur agit
sur n'importe quel fichier). Cette différence est volontaire et documentée.

## Audit

`FILE_PENDING_CREATED`, `FILE_REJECTED`, `FILE_MARKED_DELETED` (et `FILE_METADATA_VALIDATED`
réservé) ; Upload 2 : `FILE_UPLOADED`, `FILE_UPLOAD_FAILED`, `FILE_STORAGE_COMPENSATION_FAILED`,
`FILE_ORPHANED_OBJECT_DETECTED` ; Upload 3 : `FILE_DOWNLOAD_URL_ISSUED`, `FILE_DOWNLOAD_URL_DENIED`,
`FILE_STORAGE_OBJECT_MISSING` (`FILE_METADATA_ACCESSED` défini mais non émis). Métadonnées :
`fileId`, `category`, `status`, `reasonCode`, `expiresInSeconds`. **Jamais** de contenu,
`storageKey`, `bucket`, `originalName` sensible, checksum, credential, query de signature ou URL.

## Erreurs

`FILE_NOT_FOUND` (404, anti-énumération), `FILE_ACCESS_DENIED`, `FILE_INVALID_NAME`,
`FILE_INVALID_EXTENSION`, `FILE_INVALID_MIME_TYPE`, `FILE_SIZE_EXCEEDED`,
`FILE_INVALID_STATUS`, `FILE_STORAGE_KEY_CONFLICT` (409), `FILE_CREATION_FAILED` (500).
Upload 3 : `FILE_NOT_DOWNLOADABLE` (409, statut/visibilité non téléchargeable),
`FILE_SIGNED_URL_GENERATION_FAILED` (503, objet manquant ou échec de signature — générique),
`FILE_STORAGE_OBJECT_MISSING`/`FILE_DOWNLOAD_ACCESS_DENIED` (diagnostic interne/audit).
Upload 4 : `FILE_DELETE_FAILED` (503), `FILE_DATABASE_FINALIZATION_FAILED` (500),
`FILE_QUARANTINE_INVALID_STATUS`/`FILE_RESTORE_INVALID_STATUS` (409, transition invalide),
`FILE_STORAGE_LIST_FAILED` (listing), `FILE_RECONCILIATION_FAILED`, `FILE_ALREADY_DELETED`
(diagnostic). Upload 5 : `FILE_COUNT_QUOTA_EXCEEDED`/`FILE_STORAGE_QUOTA_EXCEEDED` (409, quota
propriétaire). Aucun détail de stockage (endpoint/bucket/clé) n'est jamais exposé.

## Limites (Upload 5)

Pas d'antivirus/scan malware réel (la quarantaine est manuelle ; détection de signatures ≠
antivirus), pas de traitement média (thumbnail/transcodage/vidéo/OCR), pas d'upload présigné ni
d'upload direct client→S3, pas de fichier public/anonyme, pas de partage entre utilisateurs, pas de
**proxy/streaming du contenu par l'API**, pas de queue (BullMQ)/Redis, **pas de scheduler embarqué**
(commandes CLI déclenchées par le Cloud Core, sérialisées par verrou advisory), pas de CDN. URL
signée **non révocable** avant expiration. Cohérence DB/S3 **compensatoire** (pas de transaction
distribuée). Purge physique **possible mais prudente** (rétention + objet absent + verrou) ; les
`AuditLog` ne sont jamais purgés. Réception en `memoryStorage` bornée → gros fichiers = streaming/URL
signée d'upload futurs. Quotas par propriétaire **simples** (nombre + octets), pas de facturation.

## Étapes suivantes

- **Upload 5** : quotas par utilisateur contraignants, scan antivirus (alimente la quarantaine
  automatiquement), traitements médias (thumbnails/transcodage), éventuelle purge physique des
  métadonnées selon une politique de rétention validée.
