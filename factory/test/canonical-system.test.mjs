import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  canonicalApplication,
  canonicalCapability,
  canonicalEnvironment,
  canonicalSystem,
  serializeCanonicalSystem,
  SYSTEM_API_VERSION,
} from '../model/canonical-system.mjs';
import { CSM_DIAGNOSTIC_CODES, hasErrors } from '../model/diagnostics.mjs';
import { normalizeBlueprint } from '../blueprint/normalize.mjs';
import { validateCanonicalSystem } from '../blueprint/validate.mjs';
import { resolveApplications } from '../engine/applications.mjs';

/** A minimal valid blueprint; overrides replace the stack/capabilities/etc. */
function blueprint({ stack, applications, capabilities = ['base'], environments = ['local'], architecture, profile } = {}) {
  const bp = {
    version: '1',
    project: { name: 'Sample App', slug: 'sample-app' },
    topology: 'monorepo',
    designSystem: true,
    domain: { entities: [] },
    capabilities,
    deployment: { environments },
  };
  if (applications) bp.applications = applications;
  else bp.stack = stack ?? { api: 'nestjs', web: null, mobile: null };
  if (architecture) bp.architecture = architecture;
  if (profile) bp.profile = profile;
  return bp;
}

/** Hand-builds a CSM to exercise the validator directly. */
function system({ applications, capabilities = [], environments = [{ id: 'local', kind: 'local' }], architecture = { style: 'standard' }, metadata = { name: 'sample-app', version: '1.0.0' } }) {
  return canonicalSystem({
    metadata, architecture, applications, capabilities, environments, policies: {}, source: { blueprintVersion: '1' },
  });
}

const codes = (diagnostics) => diagnostics.map((d) => d.code);

describe('canonical system — normalizer', () => {
  it('normalizes a NestJS-only blueprint', () => {
    const csm = normalizeBlueprint(blueprint({ stack: { api: 'nestjs' } }));
    assert.equal(csm.apiVersion, SYSTEM_API_VERSION);
    assert.equal(csm.metadata.name, 'sample-app');
    assert.equal(csm.metadata.version, '1.0.0');
    assert.equal(csm.architecture.style, 'standard');
    assert.deepEqual(csm.applications.map((a) => [a.id, a.kind, a.runtime]), [['api', 'api', 'nestjs']]);
    assert.deepEqual(csm.applications[0].consumes, []);
    assert.deepEqual(csm.applications[0].capabilities, ['base']);
    assert.equal(csm.source.blueprintVersion, '1');
    assert.match(csm.source.digest, /^[0-9a-f]{64}$/);
    assert.deepEqual(validateCanonicalSystem(csm), []);
  });

  it('normalizes a Spring-only blueprint', () => {
    const csm = normalizeBlueprint(blueprint({ stack: { api: 'spring' } }));
    assert.deepEqual(csm.applications.map((a) => a.runtime), ['spring']);
    assert.deepEqual(validateCanonicalSystem(csm), []);
  });

  for (const [web, mobile] of [['nextjs', null], ['angular', null], [null, 'react-native'], [null, 'flutter']]) {
    it(`normalizes API + ${web ?? mobile} and wires consumption to the API`, () => {
      const csm = normalizeBlueprint(blueprint({ stack: { api: 'nestjs', web, mobile } }));
      const client = csm.applications.find((a) => a.kind !== 'api');
      assert.ok(client, 'a client application is present');
      assert.deepEqual(client.consumes, ['api']);
      assert.deepEqual(validateCanonicalSystem(csm), []);
    });
  }

  it('normalizes an API + Web + Mobile system', () => {
    const csm = normalizeBlueprint(blueprint({ stack: { api: 'nestjs', web: 'nextjs', mobile: 'react-native' } }));
    assert.deepEqual(csm.applications.map((a) => a.kind), ['api', 'web', 'mobile']);
    assert.deepEqual(csm.applications.filter((a) => a.kind !== 'api').flatMap((a) => a.consumes), ['api', 'api']);
    assert.deepEqual(validateCanonicalSystem(csm), []);
  });

  it('converts global capabilities into targeted capabilities (base/auth/rbac/files)', () => {
    const csm = normalizeBlueprint(blueprint({ stack: { api: 'nestjs', web: 'nextjs' }, capabilities: ['base', 'auth', 'rbac', 'files'] }));
    assert.deepEqual(csm.capabilities.map((c) => c.id), ['base', 'auth', 'rbac', 'files']);
    const appIds = csm.applications.map((a) => a.id);
    for (const capability of csm.capabilities) assert.deepEqual(capability.targets, appIds);
    assert.deepEqual(validateCanonicalSystem(csm), []);
  });

  it('records the source profile and environments', () => {
    const csm = normalizeBlueprint(blueprint({ stack: { api: 'nestjs' }, environments: ['local', 'staging'], profile: 'nestjs-base' }));
    assert.equal(csm.source.profile, 'nestjs-base');
    assert.deepEqual(csm.environments, [{ id: 'local', kind: 'local' }, { id: 'staging', kind: 'staging' }]);
  });

  it('maps architecture styles: default and modular-monolith', () => {
    assert.equal(normalizeBlueprint(blueprint({ stack: { api: 'nestjs' } })).architecture.style, 'standard');
    assert.equal(normalizeBlueprint(blueprint({ stack: { api: 'nestjs' }, architecture: { style: 'monolith' } })).architecture.style, 'standard');
    assert.equal(normalizeBlueprint(blueprint({ stack: { api: 'nestjs' }, architecture: { style: 'modular-monolith' } })).architecture.style, 'modular-monolith');
  });

  it('normalizes the stack sugar and the applications form to the same model', () => {
    const fromStack = normalizeBlueprint(blueprint({ stack: { api: 'nestjs', web: 'nextjs' } }));
    const fromApps = normalizeBlueprint(blueprint({
      applications: [{ id: 'api', kind: 'api', runtime: 'nestjs' }, { id: 'web', kind: 'web', runtime: 'nextjs', consumes: ['api'] }],
    }));
    assert.equal(serializeCanonicalSystem(fromStack), serializeCanonicalSystem(fromApps));
  });
});

describe('canonical system — invariants', () => {
  it('rejects an unknown runtime', () => {
    const csm = system({ applications: [canonicalApplication({ id: 'api', kind: 'api', runtime: 'deno' })] });
    assert.ok(codes(validateCanonicalSystem(csm)).includes(CSM_DIAGNOSTIC_CODES.UNSUPPORTED_RUNTIME));
  });

  it('rejects an incompatible kind/runtime', () => {
    const csm = system({ applications: [canonicalApplication({ id: 'api', kind: 'api', runtime: 'nextjs' })] });
    assert.ok(codes(validateCanonicalSystem(csm)).includes(CSM_DIAGNOSTIC_CODES.INCOMPATIBLE_KIND_RUNTIME));
  });

  it('rejects a duplicate application id', () => {
    const csm = system({ applications: [
      canonicalApplication({ id: 'api', kind: 'api', runtime: 'nestjs' }),
      canonicalApplication({ id: 'api', kind: 'web', runtime: 'nextjs' }),
    ] });
    assert.ok(codes(validateCanonicalSystem(csm)).includes(CSM_DIAGNOSTIC_CODES.DUPLICATE_APPLICATION_ID));
  });

  it('rejects a capability targeting an unknown application', () => {
    const csm = system({
      applications: [canonicalApplication({ id: 'api', kind: 'api', runtime: 'nestjs' })],
      capabilities: [canonicalCapability({ id: 'auth', targets: ['ghost'] })],
    });
    assert.ok(codes(validateCanonicalSystem(csm)).includes(CSM_DIAGNOSTIC_CODES.INVALID_CAPABILITY_TARGET));
  });

  it('rejects a reserved (unsupported) architecture style', () => {
    const csm = system({ applications: [canonicalApplication({ id: 'api', kind: 'api', runtime: 'nestjs' })], architecture: { style: 'microservices' } });
    assert.ok(codes(validateCanonicalSystem(csm)).includes(CSM_DIAGNOSTIC_CODES.UNSUPPORTED_ARCHITECTURE_STYLE));
  });

  it('rejects a system with no API', () => {
    const csm = system({ applications: [canonicalApplication({ id: 'web', kind: 'web', runtime: 'nextjs' })] });
    assert.ok(codes(validateCanonicalSystem(csm)).includes(CSM_DIAGNOSTIC_CODES.MISSING_API));
  });

  it('rejects an empty system name', () => {
    const csm = system({ applications: [canonicalApplication({ id: 'api', kind: 'api', runtime: 'nestjs' })], metadata: { name: '  ', version: '1.0.0' } });
    assert.ok(codes(validateCanonicalSystem(csm)).includes(CSM_DIAGNOSTIC_CODES.EMPTY_SYSTEM_NAME));
  });

  it('rejects consuming an unknown application', () => {
    const csm = system({ applications: [
      canonicalApplication({ id: 'api', kind: 'api', runtime: 'nestjs' }),
      canonicalApplication({ id: 'web', kind: 'web', runtime: 'nextjs', consumes: ['ghost'] }),
    ] });
    assert.ok(codes(validateCanonicalSystem(csm)).includes(CSM_DIAGNOSTIC_CODES.INCOHERENT_STRUCTURE));
  });

  it('refuses a blueprint whose architecture is unsupported once normalized', () => {
    // The blueprint schema accepts `microservices` as a style; the CSM does not.
    const csm = normalizeBlueprint(blueprint({ stack: { api: 'nestjs' }, architecture: { style: 'microservices' } }));
    assert.ok(hasErrors(validateCanonicalSystem(csm)));
  });

  it('every emitted diagnostic uses a registered code', () => {
    const known = new Set(Object.values(CSM_DIAGNOSTIC_CODES));
    const emitted = [
      system({ applications: [canonicalApplication({ id: 'api', kind: 'api', runtime: 'deno' })] }),
      system({ applications: [canonicalApplication({ id: 'web', kind: 'web', runtime: 'nextjs' })] }),
    ].flatMap((csm) => validateCanonicalSystem(csm));
    assert.ok(emitted.length > 0);
    for (const d of emitted) assert.ok(known.has(d.code), `unknown code ${d.code}`);
  });
});

describe('canonical system — determinism', () => {
  it('produces an identical serialization for the same blueprint', () => {
    const bp = blueprint({ stack: { api: 'nestjs', web: 'nextjs', mobile: 'react-native' }, capabilities: ['base', 'auth'] });
    assert.equal(serializeCanonicalSystem(normalizeBlueprint(bp)), serializeCanonicalSystem(normalizeBlueprint(bp)));
  });

  it('serialization has no absolute paths, timestamps or randomness', () => {
    const serialized = serializeCanonicalSystem(normalizeBlueprint(blueprint({ stack: { api: 'nestjs' } })));
    assert.doesNotMatch(serialized, /\/(home|Users|tmp|data)\//);
    assert.doesNotMatch(serialized, /\d{4}-\d{2}-\d{2}T/);
  });

  it('the digest changes when the model changes', () => {
    const a = normalizeBlueprint(blueprint({ stack: { api: 'nestjs' } }));
    const b = normalizeBlueprint(blueprint({ stack: { api: 'spring' } }));
    assert.notEqual(a.source.digest, b.source.digest);
  });
});

describe('canonical system — non-regression with the engine', () => {
  it('normalized applications match the engine resolution (id/kind/runtime)', () => {
    for (const stack of [{ api: 'nestjs' }, { api: 'spring', web: 'angular' }, { api: 'nestjs', web: 'nextjs', mobile: 'flutter' }]) {
      const bp = blueprint({ stack });
      const normalized = normalizeBlueprint(bp).applications.map((a) => [a.id, a.kind, a.runtime]);
      const resolved = resolveApplications(bp).map((a) => [a.id, a.kind, a.runtime]);
      assert.deepEqual(normalized, resolved);
    }
  });
});
