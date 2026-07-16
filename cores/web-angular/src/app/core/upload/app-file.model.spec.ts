import {
  MAX_FILE_SIZE_BYTES,
  describeFileForLog,
  isAllowedFileType,
  isValidAppFile,
} from './app-file.model';

describe('AppFile utilities', () => {
  describe('isValidAppFile', () => {
    it('should return false for an empty file', () => {
      const file = new File([], 'empty.pdf', { type: 'application/pdf' });
      expect(isValidAppFile(file)).toBeFalse();
    });

    it('should return true for a valid-sized file', () => {
      const file = new File(['content'], 'doc.pdf', { type: 'application/pdf' });
      expect(isValidAppFile(file)).toBeTrue();
    });

    it('should return false for a file exceeding the size limit', () => {
      const big = new Uint8Array(MAX_FILE_SIZE_BYTES + 1);
      const file = new File([big], 'huge.pdf', { type: 'application/pdf' });
      expect(isValidAppFile(file)).toBeFalse();
    });

    it('should return true for a file exactly at the size limit', () => {
      const exact = new Uint8Array(MAX_FILE_SIZE_BYTES);
      const file = new File([exact], 'exact.pdf', { type: 'application/pdf' });
      expect(isValidAppFile(file)).toBeTrue();
    });
  });

  describe('isAllowedFileType', () => {
    it('should return true for application/pdf', () => {
      const file = new File(['x'], 'doc.pdf', { type: 'application/pdf' });
      expect(isAllowedFileType(file)).toBeTrue();
    });

    it('should return true for image/jpeg', () => {
      const file = new File(['x'], 'photo.jpg', { type: 'image/jpeg' });
      expect(isAllowedFileType(file)).toBeTrue();
    });

    it('should return false for application/x-executable', () => {
      const file = new File(['x'], 'run.exe', { type: 'application/x-executable' });
      expect(isAllowedFileType(file)).toBeFalse();
    });

    it('should return true when MIME type is empty (let backend decide)', () => {
      const file = new File(['x'], 'unknown');
      expect(isAllowedFileType(file)).toBeTrue();
    });
  });

  describe('describeFileForLog', () => {
    it('should return the lowercase file extension', () => {
      const file = new File(['x'], 'Report.PDF', { type: 'application/pdf' });
      expect(describeFileForLog(file).extension).toBe('pdf');
    });

    it('should return the file size in bytes', () => {
      const file = new File(['hello'], 'doc.txt', { type: 'text/plain' });
      expect(describeFileForLog(file).sizeBytes).toBe(5);
    });

    it('should return empty string extension for files with no extension', () => {
      const file = new File(['x'], 'noext', { type: 'text/plain' });
      expect(describeFileForLog(file).extension).toBe('');
    });

    it('should never include the filename in the descriptor', () => {
      const file = new File(['x'], 'secret-contract.pdf', { type: 'application/pdf' });
      const desc = describeFileForLog(file);
      expect(JSON.stringify(desc)).not.toContain('secret-contract');
      expect(Object.keys(desc)).not.toContain('name');
    });
  });
});
