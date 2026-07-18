# FILES_REVIEW.md — Revue permanente du bloc Files (starter NestJS V1)

> Rapport de validation du domaine fichier (ADR-007), Upload 1 → 5. Document **permanent** :
> mis à jour à chaque évolution structurante du bloc. Dernière revue : durcissement Upload 5
> (quotas par propriétaire, verrou de maintenance, purge contrôlée, architectures futures).

## 1. Périmètre

Domaine fichier générique, **privé par défaut**, **API autorité finale**, **indépendant du
fournisseur de stockage**. Couvre : upload multipart inspecté, stockage S3/MinIO privé,
consultation et URLs signées de lecture, suppression confidentielle, quarantaine administrative,
réconciliation DB↔S3, quotas, purge. **Hors périmètre V1** : antivirus réel, traitement média,
upload présigné, fichier public, partage métier, queue/Redis, scheduler embarqué, CDN.

## 2. Architecture

Séparation des responsabilités (un service par préoccupation ; aucune logique métier projet) :

| Composant | Rôle |
|---|---|
| `FilesService` | Domaine/metadata, mapping public/interne, ownership de base, création `PENDING` (atomique sous quota) |
| `FileUploadService` | Inspection, checksum, orchestration upload, stockage, compensation |
| `FileAccessService` | Consultation, URL signée, statut/visibilité, ownership |
| `FileDeletionService` | Suppression confidentielle, idempotence, compensation/incohérence |
| `FileQuarantineService` | Quarantaine/restauration (transitions administratives) |
| `FileReconciliationService` | Comparaison DB↔S3, dry-run/apply, batch, rétention |
| `FilePurgeService` | Purge physique contrôlée des métadonnées |
| `FileQuotaService` | Limites par propriétaire, usage, rejet audité |
| `MaintenanceLockService` | Verrou advisory pour les commandes de maintenance |
| `FilesRepository` | **Seul** accès Prisma au modèle `StoredFile` |
| `S3ObjectStorage` | **Seul** point d'appel du SDK AWS (adapter `ObjectStorage`) |

**Invariants vérifiés** (revue runtime) : tout accès DB passe par `FilesRepository` ; tout appel
AWS SDK passe par `S3ObjectStorage` ; aucune règle de transition dispersée (table unique
`lifecycle/file-state-transitions.ts`) ; mappings publics centralisés (`files.mapper.ts`) ; aucun
`console.*` ; aucune dépendance circulaire.

## 3. Modèle de données

`StoredFile` (table `stored_files`) : `id` UUID ; `ownerId?` UUID (`owner` relation
`onDelete: SetNull` → préserve l'historique) ; `subjectId?` ; `originalName` (non fiable, UX) ;
`storageKey` **unique** (interne) ; `bucket` (interne) ; `mimeType` ; `extension` ; `size`
**BigInt** (sérialisé en chaîne) ; `checksum?` (SHA-256) ; `visibility`/`status`/`category` (enums,
défauts `PRIVATE`/`PENDING`/`OTHER`) ; `metadata?` JSON contrôlé ; horodatages `uploadedAt`,
`validatedAt`, `rejectedAt`, **`quarantinedAt`**, **`quarantineReason`**, **`deletionRequestedAt`**,
**`storageDeletedAt`**, `createdAt`, `updatedAt`, `deletedAt?`. Index : `ownerId`, `status`,
`category`, `createdAt`, `deletedAt`. **5 migrations** cohérentes (`init_auth_foundations`,
`auth3_rotation_and_audit`, `auth5_rbac`, `files_foundation`, `files_lifecycle`) ; aucune nouvelle
migration en Upload 5 (les quotas n'ajoutent pas de colonne). Aucune donnée interne exposée par les
mappers publics (`PublicStoredFile` / `SignedDownloadResult`).

## 4. Endpoints

```txt
POST   /files                  files.upload     (ownership = currentUser, quota, throttle upload)
GET    /files/:id              files.read       (ownership, 404 anti-énumération)
POST   /files/:id/download-url files.download   (ownership, statut/visibilité, no-store, throttle download)
DELETE /files/:id              files.delete     (ownership, idempotent, 204)
POST   /files/:id/quarantine   files.quarantine (administratif — SANS ownership)
POST   /files/:id/restore      files.restore    (administratif — SANS ownership)
```

Maintenance hors HTTP (CLI) : `files:reconcile`, `files:cleanup-pending`, `files:purge-metadata`.

## 5. Matrice permission / ownership

| Opération | Permission | Ownership | 401 | 403 | 404 anti-énum | Notes |
|---|---|---|---|---|---|---|
| Upload | `files.upload` | owner = `@CurrentUser` (jamais client) | ✓ | ✓ | — | quota + throttle |
| Metadata | `files.read` | requis | ✓ | ✓ | ✓ | statut visible au propriétaire |
| Download URL | `files.download` | requis | ✓ | ✓ | ✓ | `VALIDATED` + visibilité signable + objet présent |
| Delete | `files.delete` | requis | ✓ | ✓ | ✓ | idempotent ; permission seule ≠ accès au fichier d'autrui |
| Quarantine | `files.quarantine` | **non requis (admin)** | ✓ | ✓ | — | acteur ≠ propriétaire autorisé |
| Restore | `files.restore` | **non requis (admin)** | ✓ | ✓ | — | objet + checksum requis |

Le seed structurel ne crée **aucun utilisateur** ni rôle/permission métier ; `administrator` reçoit
toutes les `files.*`, `user` n'en reçoit aucune automatiquement (politique prudente).

## 6. Cycle d'upload

Multer mémoire **bornée** (1 fichier, `fileSize`, `fields/parts/headerPairs`) → normalisation du nom
→ **détection du type réel par signatures** (JPEG/PNG/GIF/WebP/PDF ; le MIME client n'est pas une
preuve) → MIME réel autorisé pour la catégorie → extension déclarée cohérente → **taille réelle**
≤ limite (`413 FILE_SIZE_EXCEEDED`) → SHA-256 → **création `PENDING` atomique sous quota** →
`putObject` privé → finalisation `VALIDATED`. Compensation : échec d'écriture → `REJECTED` + 503 ;
échec de finalisation → suppression de l'objet + 500 ; orphelin audité si la compensation échoue.

## 7. Cycle d'accès

`GET /files/:id` : ownership (404), `PublicStoredFile` sans interne. `POST /files/:id/download-url` :
ownership → statut `VALIDATED` + visibilité `PRIVATE`/`SIGNED` (sinon 409) → existence objet (sinon
503 générique + audit `FILE_STORAGE_OBJECT_MISSING`) → `getSignedUrl` (TTL borné 30..900 s,
`ResponseContentType` = MIME réel, `Content-Disposition: attachment` nettoyé RFC 5987) → audit
`FILE_DOWNLOAD_URL_ISSUED` **sans URL** ; réponse `no-store`/`no-referrer` ; URL jamais journalisée.

## 8. Cycle de suppression

**Objet d'abord, puis DB** (Option B, confidentialité) : `deletionRequestedAt` → `deleteObject`
(idempotent) → `markDeletedConditional` (`storageDeletedAt`). Idempotente (re-suppression → 204) ;
objet déjà absent → succès + audit d'incohérence ; échec stockage → 503 sans marquage ; échec DB
après suppression S3 → 500 + audit critique. Une ancienne URL signée ne sert plus le contenu après
suppression de l'objet (vérifié e2e).

## 9. Quarantaine

`QUARANTINED` = l'objet existe peut-être mais **aucun accès/URL** (assuré par `FileAccessService`).
Opérations **administratives** (permission dédiée, sans ownership). Raison **bornée**
(`SECURITY_REVIEW`/`CONTENT_MISMATCH`/`POLICY_VIOLATION`/`MANUAL_ACTION`). Restauration prudente :
`VALIDATED` seulement si objet présent + checksum connu ; aucune ré-analyse. **Quarantaine
logique** : l'objet n'est pas déplacé vers un autre bucket (documenté). **Limite** : une URL émise
avant la quarantaine reste valide jusqu'à expiration (mitigée par TTL court).

## 10. Réconciliation

**Source de vérité = comparaison directe** `StoredFile` ↔ objets réels (`objectExists`/
`listObjects`), jamais les seuls audits. Cas : (A) `VALIDATED`+objet absent → `REJECTED` (ou
`DELETED` si suppression initiée) ; (B) `PENDING` ancien → `REJECTED` si objet absent, **signalé**
si présent (jamais auto-validé) ; (C) `REJECTED`+objet → suppression objet ; (D) `DELETED`+objet →
suppression objet ; (E) orphelin assez vieux → supprimé. **Scopée par préfixe** (`<env>/`),
**bornée** (`maxItems`/batch), **dry-run par défaut**. Existence incertaine (erreur) → **aucune**
action destructive.

## 11. Quotas

`FILES_OWNER_MAX_ACTIVE_FILES` + `FILES_OWNER_MAX_TOTAL_BYTES` (`0`/`0n` = illimité). Comptent les
fichiers **actifs** (`PENDING`/`UPLOADED`/`VALIDATED`/`QUARANTINED`) ; `REJECTED`/`DELETED` ne
consomment plus le quota (décision documentée). **Concurrence** : vérification + création `PENDING`
**dans une seule transaction** protégée par `pg_advisory_xact_lock(hashtext('files-quota:'+ownerId))`
→ aucun dépassement (testé e2e : 5 uploads concurrents, limite 3 → exactement 3 créés, 2 × 409,
DB = 3). Taille **réelle reçue** (jamais une taille client). Erreurs : `409 FILE_COUNT_QUOTA_EXCEEDED`,
`409 FILE_STORAGE_QUOTA_EXCEEDED` (la taille individuelle reste `413 FILE_SIZE_EXCEEDED`). Audit
`FILE_QUOTA_EXCEEDED` sur dépassement uniquement.

## 12. Purge

`files:purge-metadata` supprime **physiquement** les lignes `DELETED`/`REJECTED` dont la rétention
est dépassée (`FILES_DELETED_METADATA_RETENTION_SECONDS` / `FILES_REJECTED_RETENTION_SECONDS`) ET
dont **aucun objet n'est présent**. Objet présent (ou existence incertaine) → **non purgée**,
incohérence signalée (réconcilier d'abord). Les **`AuditLog` ne sont jamais supprimés**. Dry-run par
défaut, batch borné, sous verrou de maintenance. Update conditionnel `deleteMany({id, status})`
(anti-course). Testé e2e (objet présent → conservée ; absent → purgée).

## 13. Advisory locks

Deux usages **distincts**, tous deux PostgreSQL (pas de Redis) :
- **Quota** : `pg_advisory_xact_lock` (transactionnel, **bloquant**, par propriétaire) — sérialise
  check+create, auto-relâché en fin de transaction (fiable, pas de fuite).
- **Maintenance** : `pg_try_advisory_lock` (session, **sans attente**) sur clé unique
  `files:maintenance` — réconciliation/cleanup/purge **mutuellement exclusives** ; seconde exécution
  **refusée** (`MaintenanceLockBusyError`, exit code `2`, aucun traitement partiel). Libéré en
  `finally` (best-effort) + backstop à la fermeture de session (processus courts). **N'impacte jamais
  l'API** (aucune route n'acquiert ce verrou).
> Note technique : `pg_advisory_*_lock` (retour `void`) s'exécute via `$executeRaw` (le `void` n'est
> pas désérialisable par `$queryRaw`) ; `pg_try_advisory_lock`/`pg_advisory_unlock` (retour
> `boolean`) via `$queryRaw`.

## 14. Stockage S3

Client centralisé (`S3_CLIENT`), endpoint/credentials validés au démarrage (secrets hors Git),
bucket **privé**, **aucune ACL**, `forcePathStyle` (MinIO), `requestChecksumCalculation: WHEN_REQUIRED`.
Opérations : `PutObject`, `HeadObject`, `HeadBucket`, `DeleteObject` (idempotent — S3 ne lève pas
`NoSuchKey`), `ListObjectsV2` (préfixe + pagination), presigning (`getSignedUrl`). **Toutes** les
erreurs SDK sont mappées vers des erreurs applicatives génériques : ni endpoint, ni bucket, ni clé,
ni credential ne fuient. Aucun appel SDK hors de l'adapter (vérifié).

## 15. Données sensibles

Recherche ciblée (`storageKey`, `bucket`, `checksum`, `signed`, `url`, `Authorization`, `accessKey`,
`secretKey`, `buffer`, `originalName`) dans logs/audit/erreurs/réponses/CLI : **aucune fuite**. Les
contrats publics excluent `bucket`/`storageKey`/`checksum`/`ownerId`/`metadata`. L'audit ne contient
jamais d'URL signée, de query de signature, de storageKey/bucket/checksum/credential ni de contenu
(batchs → résumés/compteurs). L'URL présignée embarque nécessairement bucket+clé dans son **chemin**
(par conception S3) mais n'est ni journalisée ni persistée.

## 16. Résultats sécurité

Couverts (unitaires + e2e) : taille réelle vs déclarée ; extension dangereuse/incohérente ;
signatures tronquées / faux JPEG / HTML précédé d'octets / **PDF avec JavaScript identifié PDF mais
non scanné** ; nom Unicode complexe et anti-injection `Content-Disposition` (CR/LF, guillemets,
traversal) ; bucket privé non lisible sans signature ; expiration réelle d'URL ; anti-énumération
(404) ; refus 401/403/409 ; aucune donnée interne exposée. Limites Multer (`files/fields/parts/
headerPairs`) en place.

## 17. Résultats concurrence

- Suppressions concurrentes → état final `DELETED`, objet absent, réponses idempotentes (e2e).
- Quarantaine + suppression concurrentes → **`DELETED`** déterministe (un `DELETED` ne redevient
  jamais `QUARANTINED`/`VALIDATED`) (e2e).
- **Quota sous uploads concurrents** → jamais de dépassement (verrou transactionnel) (e2e).
- **Verrou de maintenance** → seconde session refusée (`MaintenanceLockBusyError`) (e2e, deux
  sessions PostgreSQL) ; **deux `files:reconcile --apply` concurrents** → exit codes `0` et `2`
  (refus au niveau processus, observé).

## 18. Résultats runtime

| Commande | Résultat |
|---|---|
| prisma generate / validate / migrate status | ✅ 5 migrations à jour |
| build / lint | ✅ RC=0 |
| test (unitaires) | ✅ **334 / 42 suites** |
| test:e2e (×2, série) | ✅ **79 / 10 suites** (stable) |
| seed ×2 | ✅ idempotent |
| files:reconcile / cleanup-pending / purge-metadata (dry-run) | ✅ rapport JSON, RC=0 |
| reconcile concurrents | ✅ RC 0 / 2 (refus) |
| npm audit | ✅ 0 vulnérabilité |

## 19. Limites des signatures binaires

La détection identifie un type par **magic bytes** (JPEG/PNG/GIF/WebP/PDF) sur les premiers octets.
Elle **ne valide pas** la structure complète du format et **n'est pas un antivirus** : un fichier
peut être un format valide ET malveillant (ex. PDF avec JavaScript embarqué — accepté comme PDF,
non analysé). Un polyglotte ou un contenu trompeur après un préfixe valide n'est pas détecté. La
détection sert à **refuser les types non autorisés**, pas à garantir l'innocuité.

## 20. Absence actuelle d'antivirus

**La V1 n'exécute aucun antivirus.** Un fichier `VALIDATED` n'est **pas garanti exempt de malware**.
Les catégories sensibles doivent en tenir compte côté projet dérivé. La quarantaine existe mais est
**manuelle/administrative** (aucune détection automatique).

## 21. Architecture antivirus future

```txt
Upload multipart → stockage privé → statut d'attente de scan (ex. QUARANTINED ou un futur
PENDING_SCAN) → événement/job → worker antivirus EXTERNE (ClamAV / service managé) →
résultat CLEAN | INFECTED | ERROR → VALIDATED | QUARANTINED
```

Règles : jamais dans la requête HTTP ; worker **isolé** ; **timeout** + **taille max** ;
quarantaine physique éventuelle (copie/changement de clé) ; politique **fail-closed** pour les
catégories sensibles (**aucun téléchargement avant `CLEAN`**), fail-open envisageable seulement pour
des catégories non sensibles et documenté. L'enum actuel ne contient pas `PENDING_SCAN` : il ne sera
ajouté que lors de l'implémentation réelle (ne pas modifier le modèle pour une feature absente).
État actuel jugé **non dangereux** (les fichiers restent privés et accessibles uniquement à leur
propriétaire authentifié).

## 22. Architecture média future

```txt
API → objet source privé IMMUABLE → job → worker média ISOLÉ → objets dérivés privés →
metadata de dérivés (liés à la source)
```

Cas : thumbnails, compression, extraction metadata, vidéo, panorama, PDF preview, OCR. Règles :
jamais dans la requête principale ; workers isolés avec **limites CPU/mémoire** ; sources
**immuables** ; dérivés **identifiables** ; **audit**, **retry borné**, **idempotence**. Aucun
traitement média en V1.

## 23. Limites memoryStorage

`memoryStorage` borné (`FILE_MAX_SIZE_BYTES × uploads concurrents` doit rester soutenable pour la
cible) convient aux **petits fichiers** V1. Seuils de migration vers : **streaming**, **fichier
temporaire**, **multipart S3**, **URL signée d'upload**, **upload résumable**. Un upload direct futur
devra conserver : intention créée par l'API, **clé générée par l'API**, URL courte, taille/type
bornés, **finalisation API**, scan, contrôle d'ownership, **aucune credential S3 côté client**.

## 24. Risques acceptés

- URL signée S3 **non révocable** avant expiration (mitigée par TTL court 30..900 s).
- **Fichiers validés non garantis sans malware** (pas d'antivirus V1).
- Cohérence DB/S3 **compensatoire** (pas de transaction distribuée) ; fenêtre résiduelle réconciliée.
- Réception **en mémoire** (gros fichiers hors V1).
- Réconciliation/purge **manuelles** (déclenchement par le Deployment ; verrou empêche le
  chevauchement intra-base, pas un verrou inter-cluster distribué — acceptable car advisory PG est
  cluster-wide sur la même base).
- Quotas **simples** (nombre + octets), pas de facturation ni de quota par catégorie.

## 25. Dette technique

- `PENDING_SCAN` / hook antivirus à ajouter lors de l'implémentation réelle du scan.
- `test:e2e` requiert `--experimental-vm-modules` (AWS SDK sous Jest) et `--runInBand` (isolation
  déterministe des suites partageant DB/MinIO).
- `npm outdated` : patches disponibles (`@aws-sdk/* 3.1063→3.1064`, `@nestjs/common 11.1.25→11.1.26`)
  couverts par les plages `^` au prochain `npm install` ; **Prisma 7 (majeur)** volontairement non
  appliqué (0 vulnérabilité, migration majeure à planifier hors revue).
- Purge physique limitée à l'objet-absent ; une stratégie de purge des dérivés/quarantaine viendra
  avec les workers.

## 26. Verdict

**Bloc Files VALIDÉ comme composant V1 stable, exploitable et documenté.** Architecture en couches
nette (DB via repository, S3 via adapter), sécurité vérifiée (privé par défaut, anti-énumération,
aucune fuite, erreurs génériques), cycle de vie complet et concurrence maîtrisée (transitions
conditionnelles, verrous advisory), exploitation outillée (CLI dry-run/apply sérialisées). Aucun
problème **bloquant**. Les limites (antivirus, média, gros fichiers) sont **documentées** et
relèvent de workers externes post-V1, pas du core API.
