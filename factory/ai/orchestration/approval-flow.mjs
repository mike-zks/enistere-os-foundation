import { randomUUID } from 'node:crypto';

export const APPROVAL_STAGES = Object.freeze({
  PLAN: 'plan',
  APPLY: 'apply',
});

export function createAgentSession({ agent, mission, baseBranch = 'main' }) {
  return Object.freeze({
    id: randomUUID(),
    agent,
    mission,
    baseBranch,
    planApproved: false,
    applyApproved: false,
    status: 'awaiting_plan_approval',
  });
}

export function approveAgentSession(session, stage) {
  if (stage === APPROVAL_STAGES.PLAN && session.status === 'awaiting_plan_approval') {
    return Object.freeze({ ...session, planApproved: true, status: 'ready_to_execute' });
  }
  if (stage === APPROVAL_STAGES.APPLY && session.status === 'awaiting_apply_approval') {
    return Object.freeze({ ...session, applyApproved: true, status: 'ready_to_apply' });
  }
  throw new Error(`Approval ${stage} is not valid while session is ${session.status}`);
}

export function markAgentExecuted(session, { worktree, diffSummary }) {
  if (!session.planApproved || session.status !== 'ready_to_execute') {
    throw new Error('Human plan approval is required before agent execution');
  }
  return Object.freeze({ ...session, worktree, diffSummary, status: 'awaiting_apply_approval' });
}

export function markAgentApplied(session) {
  if (!session.applyApproved || session.status !== 'ready_to_apply') {
    throw new Error('Human diff approval is required before applying changes');
  }
  return Object.freeze({ ...session, status: 'applied' });
}
