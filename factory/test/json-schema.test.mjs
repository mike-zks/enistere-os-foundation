import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { readFile, readdir } from 'node:fs/promises';
import { join, relative, resolve } from 'node:path';
import Ajv2020 from 'ajv/dist/2020.js';

import { compileSchema, unsupportedKeywords } from '../engine/json-schema.mjs';
import { capabilitySchema } from '../engine/capability-schema.mjs';

const FOUNDATION_ROOT = resolve(import.meta.dirname, '../..');

/**
 * The Factory engine must run on a bare checkout, so it evaluates its schemas
 * itself rather than depending on a validator at runtime (ADR-072). That is only
 * safe while the two agree — so Ajv, which the test environment does install,
 * is used here as an oracle: every verdict is compared, on the real manifests
 * and on deliberately invalid ones.
 */
const ajv = new Ajv2020({ allErrors: true });
const reference = ajv.compile(capabilitySchema);
const ours = compileSchema(capabilitySchema);

function realManifest(id) {
  return JSON.parse(
    readFileSync(resolve(FOUNDATION_ROOT, 'capabilities', id, 'capability.json'), 'utf8'),
  );
}

/**
 * Comparable signature: which rule failed, and where.
 *
 * `if`/`allOf`/`anyOf` are dropped — they are branch bookkeeping, not a broken
 * rule, and the production formatter discards them for the same reason. Ajv
 * emits them, this evaluator does not; the substantive violations must match
 * exactly, and the boolean verdict is compared separately and unconditionally.
 */
const BOOKKEEPING = new Set(['if', 'allOf', 'anyOf']);

function signature(errors) {
  return [...new Set(
    (errors ?? [])
      .filter((error) => !BOOKKEEPING.has(error.keyword))
      .map((error) => `${error.instancePath}:${error.keyword}`),
  )].sort();
}

function assertAgreement(value, label) {
  const expected = reference(value);
  const actual = ours(value);
  assert.equal(actual, expected, `${label}: verdict differs (Ajv ${expected}, ours ${actual})`);
  assert.deepEqual(
    signature(ours.errors),
    signature(reference.errors),
    `${label}: reported violations differ`,
  );
}

describe('Factory JSON Schema evaluator', () => {
  it('enforces every keyword the capability schema actually uses', () => {
    // A keyword the evaluator would ignore is a rule silently switched off, so
    // compilation refuses the document rather than under-validating it.
    assert.deepEqual(unsupportedKeywords(capabilitySchema), []);
    // Detection is deliberately conservative — it may over-report inside an
    // unknown keyword's payload — because refusing is the safe direction.
    assert.throws(
      () => compileSchema({ type: 'object', dependentRequired: { a: ['b'] } }),
      /unsupported keywords:.*dependentRequired/,
    );
  });

  it('agrees with Ajv on the three real manifests', () => {
    for (const id of ['auth', 'rbac', 'files']) {
      assertAgreement(realManifest(id), `${id} manifest`);
    }
  });

  it('agrees with Ajv on every deliberately invalid manifest', () => {
    const cases = [
      ['unknown top-level property', (m) => { m.provider = 'minio'; }],
      ['missing required section', (m) => { delete m.primitives; }],
      ['wrong schemaVersion', (m) => { m.schemaVersion = '1'; }],
      ['invalid id pattern', (m) => { m.id = 'Bad_ID'; }],
      ['non-semver version', (m) => { m.version = 'v1'; }],
      ['empty responsibilities', (m) => { m.responsibilities = []; }],
      ['duplicate responsibilities', (m) => { m.responsibilities = ['a', 'a']; }],
      ['duplicate requires', (m) => { m.requires = ['auth', 'auth']; }],
      ['conflict without reason', (m) => { m.conflicts = [{ id: 'other' }]; }],
      ['invalid contract kind', (m) => { m.contracts = [{ id: 'c', version: '1.0.0', kind: 'grpc' }]; }],
      ['invalid primitive kind', (m) => {
        m.primitives = [{ id: 'p', kind: 'blockchain', requirement: 'required', purposes: ['x'] }];
      }],
      ['invalid primitive requirement', (m) => {
        m.primitives = [{ id: 'p', kind: 'cache', requirement: 'mandatory', purposes: ['x'] }];
      }],
      ['negative migration order', (m) => {
        m.migrations = [{
          id: 'mig', target: 'nestjs', kind: 'database',
          strategy: 'additive', path: 'targets/nestjs/x.sql', order: -1,
        }];
      }],
      ['invalid migration strategy', (m) => {
        m.migrations = [{
          id: 'mig', target: 'nestjs', kind: 'database',
          strategy: 'destructive', path: 'targets/nestjs/x.sql', order: 1,
        }];
      }],
      ['invalid conformance level', (m) => {
        m.conformance = [{ id: 's', target: 'nestjs', level: 'vibes', evidence: 'golden-runtime' }];
      }],
      ['invalid configuration key name', (m) => { m.configuration = { 'Bad Name': { type: 'string' } }; }],
      ['invalid configuration type', (m) => { m.configuration = { ok: { type: 'float' } }; }],
      ['unsupported configuration field', (m) => { m.configuration = { ok: { type: 'string', foo: 1 } }; }],
      ['unknown target field', (m) => { m.targets.nestjs.extra = 1; }],
      ['invalid target status', (m) => { m.targets.fastapi.status = 'maybe'; }],
      ['ready target without responsibilities', (m) => { delete m.targets.nestjs.responsibilities; }],
      ['ready target without adapter', (m) => { delete m.targets.nestjs.adapter; }],
      ['non-ready target carrying ready fields', (m) => { m.targets.angular = { status: 'planned', mode: 'overlay' }; }],
      ['invalid deployment mode', (m) => { m.targets.nestjs.deploymentModes = ['serverless']; }],
      ['non-semver adapter version', (m) => { m.targets.nestjs.adapter.version = 'latest'; }],
      ['missing runtime key', (m) => { delete m.targets.flutter; }],
      ['manifest is an array', () => [], true],
      ['manifest is null', () => null, true],
    ];

    for (const [label, mutate, replaces] of cases) {
      const manifest = realManifest('auth');
      const value = replaces ? mutate() : (mutate(manifest), manifest);
      assert.equal(reference(value), false, `${label}: fixture must be invalid`);
      assertAgreement(value, label);
    }
  });
});

describe('Factory engine dependency isolation', () => {
  it('imports nothing outside Node builtins, so it runs on a bare checkout', async () => {
    // The golden and dependency jobs execute `node factory/...` with nothing
    // installed. A single bare import breaks 25 CI jobs at once — which is
    // exactly how this rule was learned (ADR-072).
    const roots = ['engine', 'conformance', 'quality', 'cli', 'ai'];
    const offenders = [];

    async function scan(directory) {
      let entries;
      try {
        entries = await readdir(directory, { withFileTypes: true });
      } catch {
        return;
      }
      for (const entry of entries) {
        const full = join(directory, entry.name);
        if (entry.isDirectory()) {
          if (entry.name !== 'test' && entry.name !== 'node_modules') await scan(full);
          continue;
        }
        if (!entry.name.endsWith('.mjs') || entry.name.endsWith('.test.mjs')) continue;
        const source = await readFile(full, 'utf8');
        for (const match of source.matchAll(/^\s*import\s[^'"]*from\s+['"]([^'"]+)['"]/gm)) {
          const specifier = match[1];
          const isLocal = specifier.startsWith('.') || specifier.startsWith('/');
          if (!isLocal && !specifier.startsWith('node:')) {
            offenders.push(`${relative(FOUNDATION_ROOT, full)} imports ${specifier}`);
          }
        }
      }
    }

    for (const root of roots) await scan(resolve(FOUNDATION_ROOT, 'factory', root));
    assert.deepEqual(offenders, [], 'the Factory engine must depend on Node builtins only');
  });
});
