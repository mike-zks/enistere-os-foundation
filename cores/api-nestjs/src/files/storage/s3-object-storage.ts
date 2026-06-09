import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadBucketCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Inject, Injectable } from '@nestjs/common';

import {
  ListObjectsInput,
  ListObjectsResult,
  ObjectStorage,
  PutObjectParams,
  SignedReadUrlInput,
  SignedReadUrlResult,
} from './object-storage';
import { S3_CLIENT } from './s3-client.factory';

/** Détecte une absence d'objet/bucket (404 / NotFound) sans dépendre du message du SDK. */
function isNotFound(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) {
    return false;
  }
  const candidate = error as { name?: unknown; $metadata?: { httpStatusCode?: unknown } };
  return candidate.name === 'NotFound' || candidate.$metadata?.httpStatusCode === 404;
}

/**
 * Implémentation S3-compatible (MinIO/AWS S3) de `ObjectStorage` (ADR-007).
 *
 * Buckets privés (aucune ACL publique). Les erreurs du SDK sont mappées vers des erreurs
 * applicatives génériques : ni endpoint, ni credentials, ni clé/bucket ne fuient.
 */
@Injectable()
export class S3ObjectStorage implements ObjectStorage {
  constructor(@Inject(S3_CLIENT) private readonly client: S3Client) {}

  async putObject(params: PutObjectParams): Promise<void> {
    try {
      await this.client.send(
        new PutObjectCommand({
          Bucket: params.bucket,
          Key: params.storageKey,
          Body: params.body,
          ContentType: params.contentType,
          ContentLength: params.body.length,
          // Aucune ACL publique : le bucket reste privé.
        }),
      );
    } catch {
      throw new Error('Object storage put failed.');
    }
  }

  async deleteObject(bucket: string, storageKey: string): Promise<void> {
    // Idempotent : S3/MinIO ne lève pas `NoSuchKey` sur DeleteObject (succès même si absent).
    try {
      await this.client.send(new DeleteObjectCommand({ Bucket: bucket, Key: storageKey }));
    } catch {
      throw new Error('Object storage delete failed.');
    }
  }

  async listObjects(input: ListObjectsInput): Promise<ListObjectsResult> {
    // Toujours scopé par préfixe et borné par MaxKeys ; jamais un bucket entier sans préfixe.
    try {
      const output = await this.client.send(
        new ListObjectsV2Command({
          Bucket: input.bucket,
          Prefix: input.prefix,
          ContinuationToken: input.continuationToken,
          MaxKeys: input.maxKeys,
        }),
      );
      const objects = (output.Contents ?? [])
        .filter((entry) => typeof entry.Key === 'string' && entry.Key.length > 0)
        .map((entry) => ({
          key: entry.Key as string,
          size: entry.Size ?? 0,
          lastModified: entry.LastModified,
        }));
      return {
        objects,
        nextContinuationToken: output.IsTruncated ? output.NextContinuationToken : undefined,
      };
    } catch {
      throw new Error('Object storage list failed.');
    }
  }

  async objectExists(bucket: string, storageKey: string): Promise<boolean> {
    try {
      await this.client.send(new HeadObjectCommand({ Bucket: bucket, Key: storageKey }));
      return true;
    } catch (error) {
      if (isNotFound(error)) {
        return false;
      }
      throw new Error('Object storage head failed.');
    }
  }

  async createSignedReadUrl(input: SignedReadUrlInput): Promise<SignedReadUrlResult> {
    // Signature de LECTURE uniquement (GetObject). Bucket et clé restent internes ; le
    // content-type/disposition de réponse sont imposés par le serveur. L'URL n'est jamais
    // journalisée et le résultat public n'expose ni bucket ni clé.
    try {
      const command = new GetObjectCommand({
        Bucket: input.bucket,
        Key: input.storageKey,
        ResponseContentType: input.responseContentType,
        ResponseContentDisposition: input.responseContentDisposition,
      });
      const url = await getSignedUrl(this.client, command, {
        expiresIn: input.expiresInSeconds,
      });
      // `expiresAt` reflète l'expiration appliquée par S3/MinIO (instant de signature + TTL).
      return { url, expiresAt: new Date(Date.now() + input.expiresInSeconds * 1000) };
    } catch {
      throw new Error('Object storage signing failed.');
    }
  }

  async checkHealth(bucket: string): Promise<boolean> {
    try {
      await this.client.send(new HeadBucketCommand({ Bucket: bucket }));
      return true;
    } catch {
      return false;
    }
  }
}
