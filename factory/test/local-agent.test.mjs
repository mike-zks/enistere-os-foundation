import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { LOCAL_AGENTS, renderMissionPrompt, sanitizeAgentEnvironment, validateMissionEnvelope } from '../ai/adapters/index.mjs';

const mission = {
  id: 'starter-contract-review', operation: 'review', objective: 'Review starter conformance.',
  allowedFiles: ['starters/**'], forbiddenFiles: ['.env', '.git/**'], gates: ['factory:test'],
};

describe('local agent adapters', () => {
  it('registers Codex, Claude Code and Gemini without provider SDKs', () => assert.deepEqual(Object.keys(LOCAL_AGENTS), ['codex', 'claude', 'gemini']));
  it('validates and renders a structured mission envelope', () => {
    assert.deepEqual(validateMissionEnvelope(mission), []);
    assert.equal(JSON.parse(renderMissionPrompt(mission)).schema, 'enistere-mission/v1');
  });
  it('rejects incomplete missions', () => assert.ok(validateMissionEnvelope({}).length >= 5));
  it('does not forward provider API keys', () => {
    const env = sanitizeAgentEnvironment({ PATH: '/bin', HOME: '/tmp/user', ANTHROPIC_API_KEY: 'secret', OPENAI_API_KEY: 'secret' });
    assert.deepEqual(env, { PATH: '/bin', HOME: '/tmp/user' });
  });
  it('uses non-shell argument arrays and workspace-scoped modes', () => {
    assert.deepEqual(LOCAL_AGENTS.codex.buildArgs('/tmp/work').slice(0, 3), ['exec', '--ephemeral', '--sandbox']);
    assert.ok(LOCAL_AGENTS.claude.buildArgs('/tmp/work').includes('acceptEdits'));
  });
});
