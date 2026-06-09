import {
  ListObjectsInput,
  ListObjectsResult,
  ObjectStorage,
  PutObjectParams,
  SignedReadUrlInput,
  SignedReadUrlResult,
} from './object-storage';

/**
 * Implémentation EN MÉMOIRE de `ObjectStorage`, réservée aux TESTS.
 *
 * Ne JAMAIS l'utiliser en production ni l'enregistrer dans `FilesModule` : ce n'est pas
 * un équivalent de MinIO/S3. Sert uniquement à valider les contrats et services.
 */
export class InMemoryObjectStorage implements ObjectStorage {
  private readonly objects = new Map<string, Buffer>();

  private key(bucket: string, storageKey: string): string {
    return `${bucket}/${storageKey}`;
  }

  putObject(params: PutObjectParams): Promise<void> {
    this.objects.set(this.key(params.bucket, params.storageKey), params.body);
    return Promise.resolve();
  }

  deleteObject(bucket: string, storageKey: string): Promise<void> {
    this.objects.delete(this.key(bucket, storageKey));
    return Promise.resolve();
  }

  objectExists(bucket: string, storageKey: string): Promise<boolean> {
    return Promise.resolve(this.objects.has(this.key(bucket, storageKey)));
  }

  createSignedReadUrl(input: SignedReadUrlInput): Promise<SignedReadUrlResult> {
    // URL factice, non fonctionnelle : aucun accès réel n'est exposé.
    return Promise.resolve({
      url: `memory://${input.bucket}/${input.storageKey}?expires=${input.expiresInSeconds}`,
      expiresAt: new Date(Date.now() + input.expiresInSeconds * 1000),
    });
  }

  listObjects(input: ListObjectsInput): Promise<ListObjectsResult> {
    const bucketPrefix = `${input.bucket}/`;
    const all = [...this.objects.entries()]
      .filter(([key]) => key.startsWith(bucketPrefix))
      .map(([key, body]) => ({ key: key.slice(bucketPrefix.length), size: body.length }))
      .filter((object) => object.key.startsWith(input.prefix))
      .sort((a, b) => a.key.localeCompare(b.key));

    const start = input.continuationToken ? Number(input.continuationToken) : 0;
    const objects = all.slice(start, start + input.maxKeys);
    const consumed = start + input.maxKeys;
    return Promise.resolve({
      objects,
      nextContinuationToken: consumed < all.length ? String(consumed) : undefined,
    });
  }

  checkHealth(): Promise<boolean> {
    return Promise.resolve(true);
  }
}
