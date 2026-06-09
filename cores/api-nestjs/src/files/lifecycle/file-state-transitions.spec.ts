import { FileStatus } from '@prisma/client';

import { allowedTargets, canTransition } from './file-state-transitions';

describe('file-state-transitions', () => {
  it.each([
    [FileStatus.PENDING, FileStatus.VALIDATED],
    [FileStatus.PENDING, FileStatus.REJECTED],
    [FileStatus.PENDING, FileStatus.DELETED],
    [FileStatus.UPLOADED, FileStatus.VALIDATED],
    [FileStatus.VALIDATED, FileStatus.QUARANTINED],
    [FileStatus.VALIDATED, FileStatus.DELETED],
    [FileStatus.QUARANTINED, FileStatus.VALIDATED],
    [FileStatus.QUARANTINED, FileStatus.DELETED],
    [FileStatus.REJECTED, FileStatus.DELETED],
  ])('allows %s → %s', (from, to) => {
    expect(canTransition(from, to)).toBe(true);
  });

  it.each([
    [FileStatus.DELETED, FileStatus.VALIDATED],
    [FileStatus.DELETED, FileStatus.QUARANTINED],
    [FileStatus.REJECTED, FileStatus.VALIDATED],
    [FileStatus.PENDING, FileStatus.QUARANTINED],
    [FileStatus.VALIDATED, FileStatus.REJECTED],
  ])('forbids %s → %s', (from, to) => {
    expect(canTransition(from, to)).toBe(false);
  });

  it('treats identity as a non-transition', () => {
    expect(canTransition(FileStatus.VALIDATED, FileStatus.VALIDATED)).toBe(false);
  });

  it('exposes DELETED as a terminal state', () => {
    expect(allowedTargets(FileStatus.DELETED)).toEqual([]);
  });
});
