import { ServiceUnavailableException } from '@nestjs/common';

import { PrismaService } from '../database/prisma.service';
import { HealthController } from './health.controller';

describe('HealthController', () => {
  function build(queryRaw: jest.Mock): HealthController {
    return new HealthController({ $queryRaw: queryRaw } as unknown as PrismaService);
  }

  it('returns an ok health payload', () => {
    const controller = build(jest.fn());
    expect(controller.getHealth()).toEqual(
      expect.objectContaining({ status: 'ok', service: 'api-nestjs-core' }),
    );
  });

  it('liveness does not touch the database', () => {
    const queryRaw = jest.fn();
    expect(build(queryRaw).getLiveness()).toEqual({ status: 'live' });
    expect(queryRaw).not.toHaveBeenCalled();
  });

  it('readiness reports the database as up when the query succeeds', async () => {
    const controller = build(jest.fn().mockResolvedValue([{ '?column?': 1 }]));
    await expect(controller.getReadiness()).resolves.toEqual({ status: 'ready', checks: { database: 'up' } });
  });

  it('readiness returns 503 (generic) when the database is unreachable', async () => {
    const controller = build(jest.fn().mockRejectedValue(new Error('connection refused')));
    await expect(controller.getReadiness()).rejects.toBeInstanceOf(ServiceUnavailableException);
  });
});
