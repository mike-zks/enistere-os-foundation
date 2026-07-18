/**
 * Tests for AI Core Redaction Layer.
 *
 * Run:
 *   node --test factory/ai/core/test/redaction.test.mjs
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  CIRCULAR,
  REDACTED,
  TRUNCATED,
  isSensitiveKey,
  redactText,
  redactValue,
} from '../src/redaction/index.mjs';

describe('isSensitiveKey', () => {
  it('matches sensitive key variants', () => {
    for (const key of [
      'Authorization',
      'access_token',
      'refreshToken',
      'API_KEY',
      'set-cookie',
      'password',
      'signedUrl',
      'PRIVATE_KEY',
      'email',
      'dotenv',
    ]) {
      assert.equal(isSensitiveKey(key), true, key);
    }
  });

  it('does not match look-alike keys', () => {
    for (const key of ['author', 'tokenCount', 'description', 'status', 'promptId', 'model']) {
      assert.equal(isSensitiveKey(key), false, key);
    }
  });
});

describe('redactText', () => {
  it('redacts Bearer and Basic credentials while preserving schemes', () => {
    const result = redactText('Authorization: Bearer abcDEF.123-_x and Basic dXNlcjpwYXNz');

    assert.equal(result.safeText, `Authorization: Bearer ${REDACTED} and Basic ${REDACTED}`);
    assert.deepEqual(result.redactedKinds, ['authorization']);
    assert.equal(result.truncated, false);
  });

  it('redacts bare JWTs', () => {
    const jwt = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.SflKxwRJSMeKKF2QT4fwpMeJ';
    const result = redactText(`jwt=${jwt}`);

    assert.ok(!result.safeText.includes(jwt));
    assert.ok(result.redactedKinds.includes('jwt'));
  });

  it('redacts signed URL query parameters but preserves non-sensitive parameters', () => {
    const url = 'https://s3.example.test/file?X-Amz-Signature=deadbeef&X-Amz-Credential=AKIA/x&response=ok';
    const result = redactText(url);

    assert.ok(!result.safeText.includes('deadbeef'));
    assert.ok(!result.safeText.includes('AKIA/x'));
    assert.match(result.safeText, /X-Amz-Signature=\[Redacted\]/);
    assert.match(result.safeText, /X-Amz-Credential=\[Redacted\]/);
    assert.match(result.safeText, /response=ok/);
    assert.ok(result.redactedKinds.includes('signed_url_param'));
  });

  it('redacts env-like secrets', () => {
    const result = redactText('JWT_SECRET=super-secret\nPUBLIC_NAME=enistere\nAPI_KEY=abc123');

    assert.equal(result.safeText, `JWT_SECRET=${REDACTED}\nPUBLIC_NAME=enistere\nAPI_KEY=${REDACTED}`);
    assert.ok(result.redactedKinds.includes('env_secret'));
  });

  it('redacts private key blocks', () => {
    const key = '-----BEGIN PRIVATE KEY-----\nabc\n-----END PRIVATE KEY-----';
    const result = redactText(`key=${key}`);

    assert.equal(result.safeText, `key=${REDACTED}`);
    assert.ok(result.redactedKinds.includes('private_key'));
  });

  it('redacts emails and local file paths', () => {
    const result = redactText('user jane.doe@example.com uploaded file:///home/user/id-card.png');

    assert.equal(result.safeText, `user ${REDACTED} uploaded file://${REDACTED}`);
    assert.ok(result.redactedKinds.includes('email'));
    assert.ok(result.redactedKinds.includes('local_path'));
  });

  it('truncates long text deterministically', () => {
    const result = redactText('x'.repeat(13000));

    assert.equal(result.safeText.length, 12000);
    assert.equal(result.truncated, true);
    assert.deepEqual(result.warnings, ['text_truncated']);
  });

  it('leaves ordinary text intact', () => {
    const text = 'AI Core prompt registry validation passed for 8 prompts.';
    const result = redactText(text);

    assert.equal(result.safeText, text);
    assert.deepEqual(result.redactedKinds, []);
    assert.deepEqual(result.warnings, []);
  });
});

describe('redactValue', () => {
  it('redacts sensitive object keys and does not mutate input', () => {
    const input = {
      promptId: 'security-review',
      accessToken: 'token-value',
      nested: {
        keep: 42,
        cookie: 'sid=secret',
        message: 'contact jane@example.com',
      },
    };

    const result = redactValue(input);

    assert.equal(result.safeValue.promptId, 'security-review');
    assert.equal(result.safeValue.accessToken, REDACTED);
    assert.equal(result.safeValue.nested.cookie, REDACTED);
    assert.equal(result.safeValue.nested.keep, 42);
    assert.equal(result.safeValue.nested.message, `contact ${REDACTED}`);
    assert.equal(input.accessToken, 'token-value');
    assert.ok(result.redactedKinds.includes('sensitive_key'));
    assert.ok(result.redactedKinds.includes('email'));
  });

  it('redacts arrays, errors, functions, symbols, and bigints safely', () => {
    const result = redactValue([
      new Error('failed with Bearer abc.def.ghi'),
      () => null,
      Symbol('x'),
      12n,
    ]);

    assert.equal(result.safeValue[0].name, 'Error');
    assert.equal('stack' in result.safeValue[0], false);
    assert.ok(!result.safeValue[0].message.includes('abc.def.ghi'));
    assert.equal(result.safeValue[1], '[Function]');
    assert.equal(result.safeValue[2], '[Symbol]');
    assert.equal(result.safeValue[3], '12');
    assert.ok(result.warnings.includes('function_redacted'));
    assert.ok(result.warnings.includes('symbol_redacted'));
  });

  it('handles circular references', () => {
    const cyclic = { id: 'x', password: 'secret' };
    cyclic.self = cyclic;

    const result = redactValue(cyclic);

    assert.equal(result.safeValue.password, REDACTED);
    assert.equal(result.safeValue.self, CIRCULAR);
    assert.ok(result.warnings.includes('circular_reference'));
  });

  it('caps recursion depth', () => {
    let value = 'leaf';
    for (let i = 0; i < 40; i += 1) {
      value = { next: value };
    }

    const result = redactValue(value);
    assert.equal(result.truncated, true);
    assert.ok(result.warnings.includes('max_depth_reached'));

    let current = result.safeValue;
    for (let i = 0; i < 8; i += 1) {
      current = current.next;
    }
    assert.equal(current, TRUNCATED);
  });
});
