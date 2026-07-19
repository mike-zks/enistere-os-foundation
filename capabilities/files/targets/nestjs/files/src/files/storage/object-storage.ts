/**
 * Abstraction de stockage objet (ADR-007), indépendante du fournisseur (MinIO/S3).
 * L'API Core reste l'autorité ; les buckets sont privés par défaut. Aucune ACL publique.
 */
export interface PutObjectParams {
  bucket: string;
  storageKey: string;
  body: Buffer;
  contentType: string;
}

/**
 * Entrée d'une signature de LECTURE temporaire (Upload 3). Tout est déterminé par le
 * serveur : le client ne fournit jamais la clé, le bucket, la durée ni le content-type.
 * La durée est bornée par la configuration serveur (jamais une valeur arbitraire client).
 */
export interface SignedReadUrlInput {
  bucket: string;
  storageKey: string;
  expiresInSeconds: number;
  responseContentType?: string;
  responseContentDisposition?: string;
}

/**
 * Résultat PUBLIC d'une URL signée : strictement `url` + `expiresAt`. N'expose jamais le
 * bucket, la clé interne ni les credentials.
 */
export interface SignedReadUrlResult {
  url: string;
  expiresAt: Date;
}

/**
 * Listing borné, **toujours scopé par préfixe** (réconciliation Upload 4). Jamais un bucket
 * entier sans préfixe. Pagination par `continuationToken`. Réservé à l'usage interne.
 */
export interface ListObjectsInput {
  bucket: string;
  prefix: string;
  continuationToken?: string;
  maxKeys: number;
}

/** Métadonnée d'objet stockée — INTERNE (jamais exposée via un controller). */
export interface StoredObjectInfo {
  key: string;
  size: number;
  lastModified?: Date;
}

export interface ListObjectsResult {
  objects: StoredObjectInfo[];
  nextContinuationToken?: string;
}

export interface ObjectStorage {
  /** Dépose un objet (Upload 2). */
  putObject(params: PutObjectParams): Promise<void>;

  /**
   * Supprime un objet (compensation Upload 2, suppression réelle Upload 4). **Idempotent** :
   * S3/MinIO ne renvoie pas d'erreur si la clé est déjà absente (DeleteObject ne lève pas
   * `NoSuchKey`). La présence/absence préalable est, si besoin, déterminée via `objectExists`.
   */
  deleteObject(bucket: string, storageKey: string): Promise<void>;

  /** Indique si un objet existe (vérifications). */
  objectExists(bucket: string, storageKey: string): Promise<boolean>;

  /** Liste bornée et scopée par préfixe (réconciliation interne, Upload 4). */
  listObjects(input: ListObjectsInput): Promise<ListObjectsResult>;

  /** URL de lecture temporaire signée, durée courte et bornée serveur (Upload 3). */
  createSignedReadUrl(input: SignedReadUrlInput): Promise<SignedReadUrlResult>;

  /** Vérifie l'accessibilité du stockage (health check), sans exposer de détail sensible. */
  checkHealth(bucket: string): Promise<boolean>;
}
