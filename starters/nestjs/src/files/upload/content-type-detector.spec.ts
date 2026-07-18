import { ContentTypeDetector } from './content-type-detector';

const JPEG = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);
const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const GIF = Buffer.from('GIF89a', 'latin1');
const WEBP = Buffer.concat([Buffer.from('RIFF', 'latin1'), Buffer.from([0, 0, 0, 0]), Buffer.from('WEBP', 'latin1')]);
const PDF = Buffer.from('%PDF-1.7', 'latin1');

describe('ContentTypeDetector', () => {
  const detector = new ContentTypeDetector();

  it.each([
    ['JPEG', JPEG, 'image/jpeg', 'jpg'],
    ['PNG', PNG, 'image/png', 'png'],
    ['GIF', GIF, 'image/gif', 'gif'],
    ['WebP', WEBP, 'image/webp', 'webp'],
    ['PDF', PDF, 'application/pdf', 'pdf'],
  ])('detects %s by signature', (_label, buffer, mimeType, extension) => {
    expect(detector.detect(buffer as Buffer)).toEqual({ mimeType, extension });
  });

  it('returns null for random content (not a recognized type)', () => {
    expect(detector.detect(Buffer.from('this is just some plain text, not a file'))).toBeNull();
  });

  it('returns null for an empty buffer', () => {
    expect(detector.detect(Buffer.alloc(0))).toBeNull();
  });

  it('returns null for a fake JPEG (wrong magic bytes)', () => {
    expect(detector.detect(Buffer.from('JPEGISH but text'))).toBeNull();
  });

  it('returns null for truncated magic bytes (signature incomplete)', () => {
    // Préfixe PNG tronqué (2 octets sur 8) : non identifiable.
    expect(detector.detect(Buffer.from([0x89, 0x50]))).toBeNull();
  });

  it('returns null for HTML preceded by a few misleading bytes (no valid signature)', () => {
    expect(detector.detect(Buffer.from('\n\n<!DOCTYPE html><script>alert(1)</script>'))).toBeNull();
  });

  // IMPORTANT : la détection de type n'est PAS un antivirus ni une validation complète du format.
  // Un PDF embarquant du JavaScript reste un PDF valide au sens de la signature : il est accepté
  // comme `application/pdf` mais N'EST PAS analysé (cf. FILES_REVIEW.md, antivirus futur).
  it('identifies a PDF that embeds JavaScript as a PDF (detection is not malware scanning)', () => {
    const pdfWithJs = Buffer.from('%PDF-1.7\n1 0 obj<</OpenAction<</JS(app.alert(1))/S/JavaScript>>>>', 'latin1');
    expect(detector.detect(pdfWithJs)).toEqual({ mimeType: 'application/pdf', extension: 'pdf' });
  });
});
