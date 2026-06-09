import { AppLogger } from '../../common/logging/logging.service';
import { PrismaService } from '../../database/prisma.service';
import { MaintenanceLockBusyError, MaintenanceLockService } from './maintenance-lock.service';

describe('MaintenanceLockService', () => {
  let queryRaw: jest.Mock;
  let service: MaintenanceLockService;

  beforeEach(() => {
    queryRaw = jest.fn();
    const logger = { warn: jest.fn() } as unknown as AppLogger;
    service = new MaintenanceLockService({ $queryRaw: queryRaw } as unknown as PrismaService, logger);
  });

  it('tryAcquire returns true when the lock is granted', async () => {
    queryRaw.mockResolvedValueOnce([{ locked: true }]);
    await expect(service.tryAcquire('files:maintenance')).resolves.toBe(true);
  });

  it('tryAcquire returns false when the lock is held elsewhere', async () => {
    queryRaw.mockResolvedValueOnce([{ locked: false }]);
    await expect(service.tryAcquire('files:maintenance')).resolves.toBe(false);
  });

  it('withLock runs the body then releases the lock', async () => {
    queryRaw.mockResolvedValueOnce([{ locked: true }]).mockResolvedValueOnce([{}]);
    const body = jest.fn().mockResolvedValue('done');

    await expect(service.withLock('files:maintenance', body)).resolves.toBe('done');

    expect(body).toHaveBeenCalledTimes(1);
    // 1 acquire + 1 release.
    expect(queryRaw).toHaveBeenCalledTimes(2);
  });

  it('withLock releases the lock even when the body throws', async () => {
    queryRaw.mockResolvedValueOnce([{ locked: true }]).mockResolvedValueOnce([{}]);
    const body = jest.fn().mockRejectedValue(new Error('boom'));

    await expect(service.withLock('files:maintenance', body)).rejects.toThrow('boom');
    // release attempted (2nd query).
    expect(queryRaw).toHaveBeenCalledTimes(2);
  });

  it('withLock refuses (MaintenanceLockBusyError) without running the body when busy', async () => {
    queryRaw.mockResolvedValueOnce([{ locked: false }]);
    const body = jest.fn();

    await expect(service.withLock('files:maintenance', body)).rejects.toBeInstanceOf(MaintenanceLockBusyError);
    expect(body).not.toHaveBeenCalled();
    // No release attempted when the lock was never acquired.
    expect(queryRaw).toHaveBeenCalledTimes(1);
  });

  it('withLock swallows release failures (lock freed at session close)', async () => {
    queryRaw.mockResolvedValueOnce([{ locked: true }]).mockRejectedValueOnce(new Error('release failed'));
    await expect(service.withLock('files:maintenance', jest.fn().mockResolvedValue('ok'))).resolves.toBe('ok');
  });
});
