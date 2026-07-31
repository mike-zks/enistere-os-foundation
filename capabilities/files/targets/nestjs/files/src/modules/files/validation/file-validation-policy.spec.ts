import { BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FileCategory } from '@prisma/client';

import { FilesConfig } from '../files.configuration';
import { FileValidationPolicy } from './file-validation-policy';

function buildPolicy(maxSize = 10_485_760, nameMax = 255): FileValidationPolicy {
  const configService = {
    get: (key: string) => (key === 'fileMaxSizeBytes' ? maxSize : nameMax),
  } as unknown as ConfigService<FilesConfig, true>;
  return new FileValidationPolicy(configService);
}

describe('FileValidationPolicy', () => {
  const policy = buildPolicy();

  describe('normalizeOriginalName', () => {
    it('strips control characters and trims', () => {
      const withControl = `photo${String.fromCharCode(7)}name.png`;
      expect(policy.normalizeOriginalName(withControl)).toBe('photoname.png');
    });

    it('rejects an empty name (after stripping)', () => {
      expect(() => policy.normalizeOriginalName('')).toThrow(BadRequestException);
    });

    it('rejects a name exceeding the maximum length', () => {
      expect(() => policy.normalizeOriginalName('a'.repeat(256))).toThrow(BadRequestException);
    });
  });

  describe('assertSizeWithinLimit', () => {
    it('accepts a size within the limit', () => {
      expect(() => policy.assertSizeWithinLimit(1024n)).not.toThrow();
    });

    it('rejects a size of zero', () => {
      expect(() => policy.assertSizeWithinLimit(0n)).toThrow(BadRequestException);
    });

    it('rejects a size above the limit', () => {
      expect(() => policy.assertSizeWithinLimit(10_485_761n)).toThrow(BadRequestException);
    });
  });

  describe('assertMimeAndExtension', () => {
    it('accepts an allowed MIME with a coherent extension', () => {
      expect(() => policy.assertMimeAndExtension(FileCategory.IMAGE, 'image/png', 'png')).not.toThrow();
    });

    it('rejects a MIME not allowed for the category', () => {
      expect(() => policy.assertMimeAndExtension(FileCategory.IMAGE, 'application/pdf', 'pdf')).toThrow(
        BadRequestException,
      );
    });

    it('rejects an extension incoherent with the MIME', () => {
      expect(() => policy.assertMimeAndExtension(FileCategory.IMAGE, 'image/png', 'jpg')).toThrow(
        BadRequestException,
      );
    });

    it('rejects an extension with invalid characters', () => {
      expect(() => policy.assertMimeAndExtension(FileCategory.DOCUMENT, 'application/pdf', 'p/df')).toThrow(
        BadRequestException,
      );
    });
  });
});
