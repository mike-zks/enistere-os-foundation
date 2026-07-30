import { ChecksumService } from './checksum.service';

describe('ChecksumService', () => {
  const service = new ChecksumService();

  it('computes the SHA-256 hex of a known input', () => {
    // sha256("abc")
    expect(service.sha256Hex(Buffer.from('abc'))).toBe(
      'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
    );
  });

  it('is deterministic and produces 64 hex chars', () => {
    const a = service.sha256Hex(Buffer.from('content'));
    const b = service.sha256Hex(Buffer.from('content'));
    expect(a).toBe(b);
    expect(a).toMatch(/^[0-9a-f]{64}$/);
  });
});
