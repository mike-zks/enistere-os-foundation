import { ConflictException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { AuditService } from '../../audit/audit.service';
import { FilesConfig } from '../../config/files.configuration';
import { FilesRepository } from '../files.repository';
import { FileQuotaService } from './file-quota.service';

function build(limits: { maxActiveFiles: number; maxTotalBytes: number }) {
  const repository = {
    countActiveByOwner: jest.fn().mockResolvedValue(3),
    sumActiveSizeByOwner: jest.fn().mockResolvedValue(123456789012345n),
  };
  const auditService = { record: jest.fn().mockResolvedValue(undefined) };
  const configService = {
    get: jest.fn((key: keyof FilesConfig) =>
      key === 'filesOwnerMaxActiveFiles' ? limits.maxActiveFiles : limits.maxTotalBytes,
    ),
  };
  const service = new FileQuotaService(
    repository as unknown as FilesRepository,
    auditService as unknown as AuditService,
    configService as unknown as ConfigService<FilesConfig, true>,
  );
  return { service, repository, auditService };
}

describe('FileQuotaService', () => {
  it('reads limits from config (bytes as BigInt; 0 = unlimited)', () => {
    const { service } = build({ maxActiveFiles: 10, maxTotalBytes: 1048576 });
    expect(service.getLimits()).toEqual({ maxActiveFiles: 10, maxTotalBytes: 1048576n });
  });

  it('aggregates active usage (BigInt → decimal string)', async () => {
    const { service, repository } = build({ maxActiveFiles: 0, maxTotalBytes: 0 });
    await expect(service.getOwnerUsage('user-1')).resolves.toEqual({
      activeCount: 3,
      totalSize: '123456789012345',
    });
    expect(repository.countActiveByOwner).toHaveBeenCalledWith('user-1');
    expect(repository.sumActiveSizeByOwner).toHaveBeenCalledWith('user-1');
  });

  it('audits then throws 409 FILE_COUNT_QUOTA_EXCEEDED on count overflow', async () => {
    const { service, auditService } = build({ maxActiveFiles: 1, maxTotalBytes: 0 });
    await expect(service.rejectQuotaOutcome('count_exceeded', 'user-1', 10n)).rejects.toMatchObject({
      response: { code: 'FILE_COUNT_QUOTA_EXCEEDED' },
    });
    const audited = auditService.record.mock.calls[0][0] as { eventType: string; metadata: Record<string, unknown> };
    expect(audited.eventType).toBe('FILE_QUOTA_EXCEEDED');
    expect(audited.metadata.quotaType).toBe('count');
    expect(audited.metadata.requestedSize).toBe('10');
  });

  it('audits then throws 409 FILE_STORAGE_QUOTA_EXCEEDED on size overflow', async () => {
    const { service, auditService } = build({ maxActiveFiles: 0, maxTotalBytes: 100 });
    await expect(service.rejectQuotaOutcome('size_exceeded', 'user-1', 500n)).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect((auditService.record.mock.calls[0][0] as { metadata: { quotaType: string } }).metadata.quotaType).toBe(
      'storage',
    );
  });
});
