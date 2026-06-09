import { S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

import { S3ObjectStorage } from './s3-object-storage';

// Le presigner est mocké : la génération d'URL est déterministe et hors-réseau en test unitaire.
jest.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: jest.fn(),
}));

const getSignedUrlMock = getSignedUrl as unknown as jest.Mock;

function lastCommand(send: jest.Mock): { name: string; input: Record<string, unknown> } {
  const command = send.mock.calls[send.mock.calls.length - 1][0];
  return { name: command.constructor.name, input: command.input };
}

describe('S3ObjectStorage', () => {
  let send: jest.Mock;
  let storage: S3ObjectStorage;

  beforeEach(() => {
    send = jest.fn().mockResolvedValue({});
    storage = new S3ObjectStorage({ send } as unknown as S3Client);
    getSignedUrlMock.mockReset();
  });

  it('putObject sends a private PutObjectCommand with content metadata (no public ACL)', async () => {
    await storage.putObject({
      bucket: 'b',
      storageKey: 'k',
      body: Buffer.from('data'),
      contentType: 'image/png',
    });

    const command = lastCommand(send);
    expect(command.name).toBe('PutObjectCommand');
    expect(command.input.Bucket).toBe('b');
    expect(command.input.Key).toBe('k');
    expect(command.input.ContentType).toBe('image/png');
    expect(command.input.ContentLength).toBe(4);
    expect(command.input.ACL).toBeUndefined();
  });

  it('objectExists returns true when HeadObject succeeds', async () => {
    await expect(storage.objectExists('b', 'k')).resolves.toBe(true);
    expect(lastCommand(send).name).toBe('HeadObjectCommand');
  });

  it('objectExists returns false on NotFound', async () => {
    send.mockRejectedValueOnce({ name: 'NotFound', $metadata: { httpStatusCode: 404 } });
    await expect(storage.objectExists('b', 'k')).resolves.toBe(false);
  });

  it('deleteObject sends a DeleteObjectCommand', async () => {
    await storage.deleteObject('b', 'k');
    expect(lastCommand(send).name).toBe('DeleteObjectCommand');
  });

  it('maps SDK errors to a generic error (no sensitive detail)', async () => {
    send.mockRejectedValueOnce(new Error('AccessDenied: secret-bucket at https://minio:9000'));
    await expect(
      storage.putObject({ bucket: 'b', storageKey: 'k', body: Buffer.from('x'), contentType: 'image/png' }),
    ).rejects.toThrow('Object storage put failed.');
  });

  it('checkHealth returns false when HeadBucket fails', async () => {
    send.mockRejectedValueOnce(new Error('unreachable'));
    await expect(storage.checkHealth('b')).resolves.toBe(false);
  });

  describe('listObjects', () => {
    it('lists by prefix with pagination and maps entries (no empty keys)', async () => {
      send.mockResolvedValueOnce({
        Contents: [
          { Key: 'test/image/a.jpg', Size: 10, LastModified: new Date('2026-01-01T00:00:00.000Z') },
          { Key: 'test/image/b.jpg', Size: 20 },
          { Key: '', Size: 0 },
        ],
        IsTruncated: true,
        NextContinuationToken: 'tok-2',
      });

      const res = await storage.listObjects({ bucket: 'b', prefix: 'test/', maxKeys: 2, continuationToken: 'tok-1' });

      const cmd = lastCommand(send);
      expect(cmd.name).toBe('ListObjectsV2Command');
      expect(cmd.input.Bucket).toBe('b');
      expect(cmd.input.Prefix).toBe('test/');
      expect(cmd.input.MaxKeys).toBe(2);
      expect(cmd.input.ContinuationToken).toBe('tok-1');
      expect(res.objects).toEqual([
        { key: 'test/image/a.jpg', size: 10, lastModified: new Date('2026-01-01T00:00:00.000Z') },
        { key: 'test/image/b.jpg', size: 20, lastModified: undefined },
      ]);
      expect(res.nextContinuationToken).toBe('tok-2');
    });

    it('returns no continuation token when the listing is not truncated', async () => {
      send.mockResolvedValueOnce({ Contents: [], IsTruncated: false, NextContinuationToken: 'x' });
      const res = await storage.listObjects({ bucket: 'b', prefix: 'p', maxKeys: 10 });
      expect(res.objects).toEqual([]);
      expect(res.nextContinuationToken).toBeUndefined();
    });

    it('maps list errors to a generic error (no bucket/endpoint leaked)', async () => {
      send.mockRejectedValueOnce(new Error('AccessDenied at https://minio:9000 bucket secret'));
      await expect(storage.listObjects({ bucket: 'b', prefix: 'p', maxKeys: 10 })).rejects.toThrow(
        'Object storage list failed.',
      );
    });
  });

  describe('createSignedReadUrl', () => {
    it('signs a GetObject command with the internal bucket/key, TTL, content-type and disposition', async () => {
      getSignedUrlMock.mockResolvedValue('https://minio.example/bucket/key?X-Amz-Signature=abc');

      const result = await storage.createSignedReadUrl({
        bucket: 'private-bucket',
        storageKey: 'env/IMAGE/2026/06/uuid.jpg',
        expiresInSeconds: 300,
        responseContentType: 'image/jpeg',
        responseContentDisposition: 'attachment; filename="photo.jpg"',
      });

      expect(getSignedUrlMock).toHaveBeenCalledTimes(1);
      const [client, command, options] = getSignedUrlMock.mock.calls[0];
      expect(client).toBe((storage as unknown as { client: unknown }).client);
      expect(command.constructor.name).toBe('GetObjectCommand');
      expect(command.input.Bucket).toBe('private-bucket');
      expect(command.input.Key).toBe('env/IMAGE/2026/06/uuid.jpg');
      expect(command.input.ResponseContentType).toBe('image/jpeg');
      expect(command.input.ResponseContentDisposition).toBe('attachment; filename="photo.jpg"');
      expect(command.input.ACL).toBeUndefined();
      expect(options.expiresIn).toBe(300);

      expect(result.url).toBe('https://minio.example/bucket/key?X-Amz-Signature=abc');
      expect(result.expiresAt).toBeInstanceOf(Date);
      const deltaMs = result.expiresAt.getTime() - Date.now();
      // ~300 s dans le futur (tolérance large pour la latence du test).
      expect(deltaMs).toBeGreaterThan(290_000);
      expect(deltaMs).toBeLessThanOrEqual(300_000);
    });

    it('maps a presigner failure to a generic error (no bucket/key/url leaked)', async () => {
      getSignedUrlMock.mockRejectedValue(new Error('signer blew up on private-bucket/secret-key'));

      await expect(
        storage.createSignedReadUrl({ bucket: 'private-bucket', storageKey: 'secret-key', expiresInSeconds: 60 }),
      ).rejects.toThrow('Object storage signing failed.');

      await expect(
        storage.createSignedReadUrl({ bucket: 'private-bucket', storageKey: 'secret-key', expiresInSeconds: 60 }),
      ).rejects.not.toThrow(/private-bucket|secret-key|http/);
    });
  });
});
