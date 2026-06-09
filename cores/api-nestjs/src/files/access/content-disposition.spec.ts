import { buildContentDisposition, sanitizeDownloadName } from './content-disposition';

/** Extrait la valeur du paramètre `filename="..."` (repli ASCII). */
function asciiPart(header: string): string {
  const match = /filename="([^"]*)"/.exec(header);
  return match ? match[1] : '';
}

describe('content-disposition', () => {
  it('always produces an attachment disposition with both filename and filename*', () => {
    const header = buildContentDisposition('photo.jpg');
    expect(header.startsWith('attachment;')).toBe(true);
    expect(header).toContain('filename="photo.jpg"');
    expect(header).toContain("filename*=UTF-8''photo.jpg");
  });

  it('keeps spaces in the quoted ascii name and percent-encodes them in filename*', () => {
    const header = buildContentDisposition('my report.pdf');
    expect(asciiPart(header)).toBe('my report.pdf');
    expect(header).toContain("filename*=UTF-8''my%20report.pdf");
  });

  it('downgrades accented characters in the ascii fallback but preserves them (encoded) in filename*', () => {
    const header = buildContentDisposition('café.jpg');
    expect(asciiPart(header)).toBe('caf_.jpg');
    expect(header).toContain("filename*=UTF-8''caf%C3%A9.jpg");
  });

  it('replaces non-ascii unicode with underscores in the fallback', () => {
    const header = buildContentDisposition('日本語.png');
    expect(asciiPart(header)).toBe('___.png');
  });

  it('strips dangerous quotes so the quoted-string cannot be closed early', () => {
    const header = buildContentDisposition('a"b.jpg');
    expect(asciiPart(header)).toBe('ab.jpg');
    expect(header).not.toContain('a"b');
  });

  it('never allows CR/LF header injection', () => {
    const header = buildContentDisposition('evil";\r\nSet-Cookie: x=y.jpg');
    expect(header).not.toContain('\r');
    expect(header).not.toContain('\n');
    // Le guillemet est retiré : aucune nouvelle directive de header ne peut être injectée.
    const ascii = asciiPart(header);
    expect(ascii).not.toContain('"');
  });

  it('takes the basename only (path separators removed, anti-traversal)', () => {
    expect(sanitizeDownloadName('../../etc/passwd')).toBe('passwd');
    expect(sanitizeDownloadName('C:\\Users\\me\\secret.pdf')).toBe('secret.pdf');
  });

  it('falls back to a safe name when empty, blank or null', () => {
    expect(sanitizeDownloadName('')).toBe('download');
    expect(sanitizeDownloadName('   ')).toBe('download');
    expect(sanitizeDownloadName(null)).toBe('download');
    expect(sanitizeDownloadName(undefined)).toBe('download');
    expect(asciiPart(buildContentDisposition(''))).toBe('download');
  });

  it('bounds very long names', () => {
    const header = buildContentDisposition(`${'a'.repeat(300)}.jpg`);
    expect(asciiPart(header).length).toBeLessThanOrEqual(100);
    expect(header).not.toContain('\r');
    expect(header).not.toContain('\n');
  });

  it('preserves a coherent extension', () => {
    expect(sanitizeDownloadName('report.final.pdf')).toBe('report.final.pdf');
  });
});
