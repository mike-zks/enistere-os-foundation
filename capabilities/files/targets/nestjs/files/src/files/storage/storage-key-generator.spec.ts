import { BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FileCategory } from '@prisma/client';

import { FilesConfig } from '../../config/files.configuration';
import { StorageKeyGenerator } from './storage-key-generator';

function buildGenerator(environment = 'test'): StorageKeyGenerator {
  const configService = {
    get: () => environment,
  } as unknown as ConfigService<FilesConfig, true>;
  return new StorageKeyGenerator(configService);
}

describe('StorageKeyGenerator', () => {
  const generator = buildGenerator('test');

  it('produces a key with environment, lowercased category, year, month, uuid and extension', () => {
    const key = generator.generate(FileCategory.IMAGE, 'JPG');
    expect(key).toMatch(/^test\/image\/\d{4}\/\d{2}\/[0-9a-f-]{36}\.jpg$/);
  });

  it('never embeds the original name and produces unique keys', () => {
    const a = generator.generate(FileCategory.DOCUMENT, 'pdf');
    const b = generator.generate(FileCategory.DOCUMENT, 'pdf');
    expect(a).not.toBe(b);
    expect(a).not.toContain('original');
  });

  it('normalizes a leading dot in the extension', () => {
    expect(generator.generate(FileCategory.IMAGE, '.png')).toMatch(/\.png$/);
  });

  it.each(['../evil', 'pn/g', 'p..g', 'p g', 'toolongextension', ''])(
    'rejects the dangerous/invalid extension %p',
    (extension) => {
      expect(() => generator.generate(FileCategory.IMAGE, extension)).toThrow(BadRequestException);
    },
  );
});
