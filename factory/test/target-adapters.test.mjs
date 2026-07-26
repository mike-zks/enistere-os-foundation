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
      'nestjs', 'nextjs', 'react-native', 'spring', 'fastapi', 'angular', 'flutter',
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

  // Socle Contrat 2: the adapter owns how its integration kinds render into
  // composition files. Each group binds declared kinds to a destination path and
  // a pure renderer, and every bound kind belongs to the adapter's declared
  // integrationKinds (except `nestjs.prisma-schema`, composed by the engine).
  it('lets each adapter own its composition renderers', () => {
    for (const adapter of listTargetAdapters()) {
      assert.ok(Array.isArray(adapter.composition), `${adapter.id} exposes a composition array`);
      for (const group of adapter.composition) {
        assert.ok(Array.isArray(group.kinds) && group.kinds.length > 0, `${adapter.id} group declares kinds`);
        assert.equal(typeof group.destination, 'string', `${adapter.id} group has a destination path`);
        assert.equal(typeof group.render, 'function', `${adapter.id} group has a renderer`);
        for (const kind of group.kinds) {
          if (kind === 'nestjs.prisma-schema') continue;
          assert.ok(kind in adapter.integrationKinds, `${adapter.id} binds a declared kind: ${kind}`);
        }
      }
    }
    assert.throws(() => { listTargetAdapters()[0].composition.push({}); }, TypeError, 'composition is frozen');
  });

  // Critère de non-régression du socle n°1: a new runtime plugs in as a new
  // adapter carrying its own composition renderer — the engine renders it
  // without any edit to overlay.mjs.
  it('carries composition through a dynamically registered adapter', () => {
    const render = (items) => `// ${items.length}`;
    const adapter = registerTargetAdapter({
      id: 'future-target', version: '1.0.0',
      integrationKinds: { 'future.provider': { symbol: 'string' } },
      composition: [{ kinds: ['future.provider'], destination: 'src/composition/future.ts', render }],
    });
    assert.equal(adapter.composition[0].destination, 'src/composition/future.ts');
    assert.equal(adapter.composition[0].render, render);
    assert.throws(() => { adapter.composition.push({}); }, TypeError, 'registered composition is frozen');
    resetTargetAdaptersForTests();
    assert.equal(getTargetAdapter('future-target'), null);
  });
});
