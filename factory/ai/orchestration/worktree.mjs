import { spawnSync } from 'node:child_process';
import { join } from 'node:path';

function runGit(args, cwd) {
  const result = spawnSync('git', args, { cwd, encoding: 'utf8', shell: false });
  if (result.status !== 0) throw new Error((result.stderr || result.stdout).trim() || `git ${args[0]} failed`);
  return result.stdout.trim();
}

export function createMissionWorktree({ repository, sessionId, baseBranch = 'main', temporaryRoot }) {
  const branch = `agent/${sessionId}`;
  const path = join(temporaryRoot, sessionId);
  runGit(['worktree', 'add', '-b', branch, path, baseBranch], repository);
  return Object.freeze({ path, branch });
}

export function summarizeMissionDiff({ repository, worktree }) {
  return runGit(['-C', worktree, 'diff', '--stat'], repository);
}

export function removeMissionWorktree({ repository, worktree }) {
  runGit(['worktree', 'remove', worktree], repository);
}
