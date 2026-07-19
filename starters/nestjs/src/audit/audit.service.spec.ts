import { AppLogger } from '../common/logging/logging.service';
import { AuditRepository } from './audit.repository';
import { AuditService } from './audit.service';

describe('AuditService', () => {
  let repository: { create: jest.Mock };
  let logger: { warn: jest.Mock };
  let service: AuditService;

  beforeEach(() => {
    repository = { create: jest.fn().mockResolvedValue(undefined) };
    logger = { warn: jest.fn() };
    service = new AuditService(repository as unknown as AuditRepository, logger as unknown as AppLogger);
  });

  it('persists an event with mapped, non-sensitive fields', async () => {
    await service.record({
      eventType: 'AUDIT_EVENT_RECORDED',
      actorId: 'user-1',
      metadata: { familyId: 'family-1', reason: 'LOGOUT' },
      ipAddress: '203.0.113.7',
    });

    const data = repository.create.mock.calls[0][0];
    expect(data.eventType).toBe('AUDIT_EVENT_RECORDED');
    expect(data.actorId).toBe('user-1');
    expect(data.metadata).toEqual({ familyId: 'family-1', reason: 'LOGOUT' });
    expect(data.ipAddress).toBe('203.0.113.7');
    // Aucune trace de secret.
    const raw = JSON.stringify(data);
    expect(raw).not.toContain('tokenHash');
    expect(raw).not.toContain('password');
  });

  it('omits metadata when not provided', async () => {
    await service.record({ eventType: 'AUDIT_EVENT_WITHOUT_METADATA', actorId: 'user-1' });

    const data = repository.create.mock.calls[0][0];
    expect(data.metadata).toBeUndefined();
  });

  it('never throws when persistence fails', async () => {
    repository.create.mockRejectedValue(new Error('db down'));

    await expect(
      service.record({ eventType: 'AUDIT_EVENT_PERSISTENCE_FAILURE' }),
    ).resolves.toBeUndefined();
  });
});
