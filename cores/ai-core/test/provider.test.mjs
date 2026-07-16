/**
 * Tests for AI Core provider seam + fake provider.
 *
 * Run:
 *   node --test cores/ai-core/test/provider.test.mjs
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  AiProviderError,
  createFakeProvider,
  createProviderCapabilities,
  createSafeProviderAdapter,
  describeProviderForLog,
  validateCompletionRequest,
} from '../src/provider/index.mjs';
import { REDACTED } from '../src/redaction/index.mjs';

function validRequest(overrides = {}) {
  return {
    promptId: 'security-review',
    promptVersion: '1.0.0',
    role: 'security_reviewer',
    input: 'Review this change.',
    context: 'No sensitive context.',
    allowedFiles: ['cores/ai-core/src/provider/index.mjs'],
    forbiddenFiles: ['.env'],
    ...overrides,
  };
}

describe('validateCompletionRequest', () => {
  it('accepts a valid request', () => {
    assert.deepEqual(validateCompletionRequest(validRequest()), []);
  });

  it('rejects missing required fields and oversized input', () => {
    const issues = validateCompletionRequest({
      promptId: '',
      promptVersion: '',
      role: '',
      input: 'x'.repeat(13000),
      allowedFiles: 'not-array',
    });

    assert.ok(issues.some((issue) => issue.path === 'promptId'));
    assert.ok(issues.some((issue) => issue.path === 'promptVersion'));
    assert.ok(issues.some((issue) => issue.path === 'role'));
    assert.ok(issues.some((issue) => issue.path === 'input'));
    assert.ok(issues.some((issue) => issue.path === 'allowedFiles'));
  });

  it('uses capability bounds', () => {
    const capabilities = createProviderCapabilities({ maxInputChars: 5 });
    const issues = validateCompletionRequest(validRequest({ input: '123456' }), capabilities);

    assert.ok(issues.some((issue) => issue.path === 'input'));
  });
});

describe('createFakeProvider', () => {
  it('describes deterministic fake capabilities without real provider support', () => {
    const provider = createFakeProvider();
    const capabilities = provider.describeCapabilities();

    assert.equal(capabilities.providerId, 'fake');
    assert.equal(capabilities.supportsComplete, true);
    assert.equal(capabilities.supportsStream, false);
    assert.equal(capabilities.supportsEmbed, false);
    assert.deepEqual(capabilities.models, ['fake-deterministic-v1']);
  });

  it('returns deterministic completions', async () => {
    const provider = createFakeProvider();
    const request = validRequest();

    const first = await provider.complete(request);
    const second = await provider.complete(request);

    assert.deepEqual(first, second);
    assert.equal(first.providerId, 'fake');
    assert.equal(first.model, 'fake-deterministic-v1');
    assert.match(first.output, /fingerprint=/);
    assert.equal(first.metadata.deterministic, true);
  });

  it('throws controlled errors for invalid requests', async () => {
    const provider = createFakeProvider();

    await assert.rejects(
      () => provider.complete({ input: '' }),
      (error) => error instanceof AiProviderError &&
        error.code === 'invalid_request' &&
        error.operation === 'complete',
    );
  });
});

describe('createSafeProviderAdapter', () => {
  it('requires provider methods', () => {
    assert.throws(() => createSafeProviderAdapter({}), /complete\(\) and describeCapabilities\(\)/);
  });

  it('redacts request input before passing it to the provider', async () => {
    const seen = [];
    const provider = {
      describeCapabilities() {
        return createProviderCapabilities({ providerId: 'capture' });
      },
      async complete(request) {
        seen.push(request);
        return {
          providerId: 'capture',
          model: 'capture-model',
          output: request.input,
          usage: { inputChars: request.input.length, outputChars: request.input.length },
          metadata: {},
        };
      },
    };

    const adapter = createSafeProviderAdapter(provider);
    const response = await adapter.complete(validRequest({
      input: 'Authorization: Bearer secret-token and user jane@example.com',
      context: 'JWT_SECRET=super-secret',
    }));

    assert.equal(seen.length, 1);
    assert.ok(!seen[0].input.includes('secret-token'));
    assert.ok(!seen[0].input.includes('jane@example.com'));
    assert.equal(seen[0].context, `JWT_SECRET=${REDACTED}`);
    assert.ok(response.safety.redactedKinds.includes('authorization'));
    assert.ok(response.safety.redactedKinds.includes('email'));
    assert.ok(response.safety.redactedKinds.includes('env_secret'));
  });

  it('does not expose sensitive keys to the provider', async () => {
    let seenRequest;
    const provider = {
      describeCapabilities() {
        return createProviderCapabilities({ providerId: 'capture' });
      },
      async complete(request) {
        seenRequest = request;
        return {
          providerId: 'capture',
          model: 'capture-model',
          output: 'ok',
          usage: { inputChars: 2, outputChars: 2 },
          metadata: {},
        };
      },
    };

    const adapter = createSafeProviderAdapter(provider);
    await adapter.complete(validRequest({
      apiKey: 'should-not-pass',
      accessToken: 'should-not-pass',
    }));

    assert.equal(seenRequest.apiKey, REDACTED);
    assert.equal(seenRequest.accessToken, REDACTED);
  });

  it('wraps fake provider completions with safety metadata', async () => {
    const adapter = createSafeProviderAdapter(createFakeProvider());
    const response = await adapter.complete(validRequest({
      input: 'token=eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.signature9',
    }));

    assert.equal(response.providerId, 'fake');
    assert.ok(response.safety.redactedKinds.includes('jwt'));
    assert.equal(response.safety.truncated, false);
  });
});

describe('describeProviderForLog', () => {
  it('returns non-sensitive provider metadata only', () => {
    const description = describeProviderForLog(createProviderCapabilities({
      providerId: 'fake',
      models: ['m1'],
      apiKey: 'not-part-of-log',
    }));

    assert.deepEqual(description, {
      providerId: 'fake',
      models: ['m1'],
      supportsComplete: true,
      supportsStream: false,
      supportsEmbed: false,
    });
  });
});
