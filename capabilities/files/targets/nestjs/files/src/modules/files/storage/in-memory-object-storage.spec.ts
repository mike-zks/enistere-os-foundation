import { InMemoryObjectStorage } from './in-memory-object-storage';

describe('InMemoryObjectStorage', () => {
  it('stores, detects and deletes an object (test double of ObjectStorage)', async () => {
    const storage = new InMemoryObjectStorage();
    const params = {
      bucket: 'b',
      storageKey: 'k',
      body: Buffer.from('content'),
      contentType: 'text/plain',
    };

    await expect(storage.objectExists('b', 'k')).resolves.toBe(false);
    await storage.putObject(params);
    await expect(storage.objectExists('b', 'k')).resolves.toBe(true);

    await storage.deleteObject('b', 'k');
    await expect(storage.objectExists('b', 'k')).resolves.toBe(false);
  });

  it('returns a non-functional signed read url placeholder with a bounded expiry', async () => {
    const storage = new InMemoryObjectStorage();
    const result = await storage.createSignedReadUrl({ bucket: 'b', storageKey: 'k', expiresInSeconds: 60 });
    expect(result.url).toBe('memory://b/k?expires=60');
    expect(result.expiresAt).toBeInstanceOf(Date);
    expect(result.expiresAt.getTime()).toBeGreaterThan(Date.now());
  });

  it('lists objects by prefix with pagination (test double)', async () => {
    const storage = new InMemoryObjectStorage();
    for (const key of ['test/a', 'test/b', 'test/c', 'other/d']) {
      await storage.putObject({ bucket: 'b', storageKey: key, body: Buffer.from('x'), contentType: 'text/plain' });
    }

    const page1 = await storage.listObjects({ bucket: 'b', prefix: 'test/', maxKeys: 2 });
    expect(page1.objects.map((o) => o.key)).toEqual(['test/a', 'test/b']);
    expect(page1.nextContinuationToken).toBe('2');

    const page2 = await storage.listObjects({
      bucket: 'b',
      prefix: 'test/',
      maxKeys: 2,
      continuationToken: page1.nextContinuationToken,
    });
    expect(page2.objects.map((o) => o.key)).toEqual(['test/c']);
    expect(page2.nextContinuationToken).toBeUndefined();
  });
});
