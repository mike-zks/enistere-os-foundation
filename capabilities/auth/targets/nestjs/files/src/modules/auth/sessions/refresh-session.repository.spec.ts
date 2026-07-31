import { Prisma, RefreshSession, SessionRevocationReason } from '@prisma/client';

import { PrismaService } from '../../../database/prisma.service';
import { RefreshSessionRepository } from './refresh-session.repository';

describe('RefreshSessionRepository', () => {
  const session: RefreshSession = {
    id: '33333333-3333-3333-3333-333333333333',
    userId: '11111111-1111-1111-1111-111111111111',
    tokenHash: 'fingerprint-hex',
    familyId: '44444444-4444-4444-4444-444444444444',
    expiresAt: new Date('2026-02-01T00:00:00.000Z'),
    revokedAt: null,
    revocationReason: null,
    replacedBySessionId: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    lastUsedAt: null,
    userAgent: null,
    ipAddress: null,
  };

  let delegate: { create: jest.Mock; findUnique: jest.Mock; updateMany: jest.Mock };
  let repository: RefreshSessionRepository;

  beforeEach(() => {
    delegate = {
      create: jest.fn(),
      findUnique: jest.fn(),
      updateMany: jest.fn().mockResolvedValue({ count: 1 }),
    };
    repository = new RefreshSessionRepository({
      refreshSession: delegate,
    } as unknown as PrismaService);
  });

  it('create delegates to prisma.refreshSession.create', async () => {
    delegate.create.mockResolvedValue(session);
    const data: Prisma.RefreshSessionCreateInput = {
      user: { connect: { id: session.userId } },
      tokenHash: 'fingerprint-hex',
      familyId: session.familyId,
      expiresAt: session.expiresAt,
    };

    const result = await repository.create(data);

    expect(delegate.create).toHaveBeenCalledWith({ data });
    expect(result).toBe(session);
  });

  it('findById queries by id', async () => {
    delegate.findUnique.mockResolvedValue(session);

    await repository.findById(session.id);

    expect(delegate.findUnique).toHaveBeenCalledWith({ where: { id: session.id } });
  });

  it('findByIdWithUser includes the user relation', async () => {
    delegate.findUnique.mockResolvedValue(session);

    await repository.findByIdWithUser(session.id);

    expect(delegate.findUnique).toHaveBeenCalledWith({
      where: { id: session.id },
      include: { user: true },
    });
  });

  it('revokeIfActive only updates an active session and returns the count', async () => {
    delegate.updateMany.mockResolvedValue({ count: 1 });

    const count = await repository.revokeIfActive(session.id, SessionRevocationReason.ROTATED, {
      replacedBySessionId: 'new-session',
    });

    expect(count).toBe(1);
    const arg = delegate.updateMany.mock.calls[0][0];
    expect(arg.where).toEqual({ id: session.id, revokedAt: null });
    expect(arg.data.revocationReason).toBe(SessionRevocationReason.ROTATED);
    expect(arg.data.replacedBySessionId).toBe('new-session');
    expect(arg.data.revokedAt).toBeInstanceOf(Date);
  });

  it('revokeIfActive returns 0 when the session is no longer active', async () => {
    delegate.updateMany.mockResolvedValue({ count: 0 });

    await expect(
      repository.revokeIfActive(session.id, SessionRevocationReason.ROTATED),
    ).resolves.toBe(0);
  });

  it('revokeFamily revokes all active sessions of a family', async () => {
    delegate.updateMany.mockResolvedValue({ count: 3 });

    const count = await repository.revokeFamily(session.familyId, SessionRevocationReason.REUSE_DETECTED);

    expect(count).toBe(3);
    const arg = delegate.updateMany.mock.calls[0][0];
    expect(arg.where).toEqual({ familyId: session.familyId, revokedAt: null });
    expect(arg.data.revocationReason).toBe(SessionRevocationReason.REUSE_DETECTED);
  });

  it('revokeActiveByUser revokes all active sessions of a user', async () => {
    delegate.updateMany.mockResolvedValue({ count: 2 });

    await repository.revokeActiveByUser(session.userId, SessionRevocationReason.USER_DISABLED);

    const arg = delegate.updateMany.mock.calls[0][0];
    expect(arg.where).toEqual({ userId: session.userId, revokedAt: null });
    expect(arg.data.revocationReason).toBe(SessionRevocationReason.USER_DISABLED);
  });
});
