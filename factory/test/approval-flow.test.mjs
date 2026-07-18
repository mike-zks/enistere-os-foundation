import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  APPROVAL_STAGES, approveAgentSession, createAgentSession, markAgentApplied, markAgentExecuted,
} from '../ai/orchestration/approval-flow.mjs';

const mission = { id: 'generate-project', operation: 'implement' };

describe('human-gated agent flow', () => {
  it('requires approval before execution and before applying a diff', () => {
    let session = createAgentSession({ agent: 'codex', mission });
    assert.throws(() => markAgentExecuted(session, {}), /plan approval/);
    session = approveAgentSession(session, APPROVAL_STAGES.PLAN);
    session = markAgentExecuted(session, { worktree: '/tmp/work', diffSummary: '2 files' });
    assert.throws(() => markAgentApplied(session), /diff approval/);
    session = approveAgentSession(session, APPROVAL_STAGES.APPLY);
    session = markAgentApplied(session);
    assert.equal(session.status, 'applied');
  });
  it('rejects approvals out of order', () => {
    const session = createAgentSession({ agent: 'claude', mission });
    assert.throws(() => approveAgentSession(session, APPROVAL_STAGES.APPLY), /not valid/);
  });
});
