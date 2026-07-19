import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  getTargetAdapter,
  integrationKindsFor,
  adapterVersionsFor,
  listTargetAdapters,
  registerTargetAdapter,
  resetTargetAdaptersForTests,
} from '../engine/target-adapters.mjs';

describe('target adapter registry', () => {
  it('registers all Foundation targets without coupling the engine to a framework', () => {
    assert.deepEqual(listTargetAdapters().map((adapter) => adapter.id), [
      'nestjs', 'nextjs', 'react-native', 'spring', 'angular', 'flutter',
    ]);
    assert.ok(integrationKindsFor('spring'));
    assert.deepEqual(integrationKindsFor('spring'), { 'spring.module': { importPath: 'string', symbol: 'string' } });
    assert.deepEqual(getTargetAdapter('spring').operations, [
      'files', 'dependencies', 'environment', 'integrations', 'contract', 'verification',
    ]);
  });

  it('accepts a future declarative adapter without changing the registry module', () => {
    const adapter = registerTargetAdapter({
      id: 'future-target', version: '1.0.0',
      integrationKinds: { 'future.provider': { symbol: 'string' } },
    });
    assert.equal(getTargetAdapter('future-target'), adapter);
    assert.deepEqual(integrationKindsFor('future-target'), { 'future.provider': { symbol: 'string' } });
    resetTargetAdaptersForTests();
    assert.equal(getTargetAdapter('future-target'), null);
  });

  it('returns adapter versions as lockable generation metadata', () => {
    assert.deepEqual(adapterVersionsFor(['spring', 'angular']), {
      spring: '1.0.0', angular: '1.0.0',
    });
    assert.equal(adapterVersionsFor(['unknown']).unknown, null);
  });

  it('rejects duplicate, malformed and unversioned adapters', () => {
    assert.throws(() => registerTargetAdapter({ id: 'nestjs', version: '1.0.0', integrationKinds: {} }), /already registered/);
    assert.throws(() => registerTargetAdapter({ id: 'bad id', version: '1.0.0', integrationKinds: {} }), /id is invalid/);
    assert.throws(() => registerTargetAdapter({ id: 'future', version: 'next', integrationKinds: {} }), /SemVer/);
  });
});
