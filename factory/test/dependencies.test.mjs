import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createDefaultBlueprint } from '../engine/blueprint.mjs';
import { generateProject } from '../engine/generator.mjs';
import { computeLockDigest, verifyProjectDependencies } from '../engine/dependencies.mjs';
import { parseArguments, wantsInstall } from '../cli/enistere.mjs';
import { evaluateAudit, loadExceptions } from '../quality/scripts/audit-check.mjs';
import { COMPOSITIONS, auditGate } from '../quality/scripts/golden-runtime.mjs';

/**
 * Offline guarantees of the dependency finalization contract. The network-bound
 * half (`--install` really producing a lock, `npm ci` succeeding, digest
 * reproducibility) is executed for real on all four goldens by the
 * Factory Golden Runtime CI and by `factory/test/dependencies-install.test.mjs`.
 */

function nestjsAuth(slug = 'dep-app') {
  const b = createDefaultBlueprint(slug);
  b.stack = { api: 'nestjs', web: null, mobile: null };
  b.capabilities = ['base', 'auth'];
  b.designSystem = true;
  b.deployment = { environments: ['local'] };
  return b;
}

function fastapiBase(slug = 'fastapi-dep-app') {
  const blueprint = createDefaultBlueprint(slug);
  blueprint.stack = { api: 'fastapi', web: null, mobile: null };
  blueprint.capabilities = [];
  blueprint.deployment = { environments: ['local'] };
  return blueprint;
}

/** Minimal generated-project fixture: an enistere.lock plus a matching lockfile. */
async function lockedFixture({ lockContent = '{"lockfileVersion":3}\n', record = true } = {}) {
  const dir = await mkdtemp(join(tmpdir(), 'enistere-dep-fix-'));
  await writeFile(join(dir, 'package-lock.json'), lockContent);
  const digest = createHash('sha256').update(lockContent).digest('hex');
  await writeFile(join(dir, 'enistere.lock'), `${JSON.stringify({
    schemaVersion: '1',
    dependenciesLocked: true,
    lockfile: 'package-lock.json',
    lockDigest: record ? digest : null,
    lockfileVersion: 3,
  }, null, 2)}\n`);
  return { dir, digest };
}

describe('dependency finalization contract', () => {
  it('marks a generation without --install as explicitly unlocked', async () => {
    const root = await mkdtemp(join(tmpdir(), 'enistere-dep-'));
    const out = join(root, 'p');
    await generateProject(nestjsAuth(), out);
    const manifest = JSON.parse(await readFile(join(out, 'enistere.lock'), 'utf8'));
    assert.equal(manifest.dependenciesLocked, false);
    assert.equal(manifest.lockDigest, null);
    assert.equal(manifest.lockfile, 'package-lock.json');
    assert.equal(manifest.lockfileVersion, null);
    assert.equal(await computeLockDigest(out), null, 'no lockfile is produced offline');

    const verified = await verifyProjectDependencies(out);
    assert.equal(verified.valid, true, 'an honestly unlocked project is valid');
    assert.equal(verified.dependenciesLocked, false);
    assert.match(verified.note, /enistere install/);
  });

  it('records and verifies the FastAPI transitive dependency lock at generation time', async () => {
    const root = await mkdtemp(join(tmpdir(), 'enistere-fastapi-dep-'));
    const out = join(root, 'p');
    await generateProject(fastapiBase(), out);
    const manifest = JSON.parse(await readFile(join(out, 'enistere.lock'), 'utf8'));
    assert.equal(manifest.runtimeLocks.length, 2);
    assert.equal(manifest.runtimeLocks[0].lockfile, 'apps/api/requirements.lock');
    assert.equal(manifest.runtimeLocks[1].lockfile, 'apps/api/requirements.runtime.lock');
    assert.equal((await verifyProjectDependencies(out)).valid, true);

    await writeFile(join(out, 'apps/api/requirements.lock'), 'tampered==1.0.0\n');
    const tampered = await verifyProjectDependencies(out);
    assert.equal(tampered.valid, false);
    assert.match(tampered.issues.join(' '), /requirements\.lock digest mismatch/);
    await rm(root, { recursive: true, force: true });
  });

  it('verify accepts a project whose lock matches the recorded digest', async () => {
    const { dir, digest } = await lockedFixture();
    const verified = await verifyProjectDependencies(dir);
    assert.equal(verified.valid, true);
    assert.equal(verified.recordedDigest, digest);
    assert.equal(verified.actualDigest, digest);
    await rm(dir, { recursive: true, force: true });
  });

  it('verify detects a modified lockfile', async () => {
    const { dir } = await lockedFixture();
    await writeFile(join(dir, 'package-lock.json'), '{"lockfileVersion":3,"tampered":true}\n');
    const verified = await verifyProjectDependencies(dir);
    assert.equal(verified.valid, false);
    assert.match(verified.issues.join(' '), /digest mismatch/);
    await rm(dir, { recursive: true, force: true });
  });

  it('verify detects a locked project whose lockfile disappeared', async () => {
    const { dir } = await lockedFixture();
    await rm(join(dir, 'package-lock.json'));
    const verified = await verifyProjectDependencies(dir);
    assert.equal(verified.valid, false);
    assert.match(verified.issues.join(' '), /is missing/);
    await rm(dir, { recursive: true, force: true });
  });

  it('verify detects a locked project with no recorded digest', async () => {
    const { dir } = await lockedFixture({ record: false });
    const verified = await verifyProjectDependencies(dir);
    assert.equal(verified.valid, false);
    assert.match(verified.issues.join(' '), /no lockDigest is recorded/);
    await rm(dir, { recursive: true, force: true });
  });

  it('verify rejects an unlocked project that still records a digest', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'enistere-dep-inc-'));
    await writeFile(join(dir, 'enistere.lock'), `${JSON.stringify({
      schemaVersion: '1', dependenciesLocked: false, lockDigest: 'deadbeef',
    }, null, 2)}\n`);
    const verified = await verifyProjectDependencies(dir);
    assert.equal(verified.valid, false);
    assert.match(verified.issues.join(' '), /lockDigest is recorded/);
    await rm(dir, { recursive: true, force: true });
  });

  it('rejects a directory that is not an Enistere project', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'enistere-dep-none-'));
    await assert.rejects(verifyProjectDependencies(dir), /Not an Enistere project/);
    await rm(dir, { recursive: true, force: true });
  });
});

describe('CLI install flags', () => {
  it('defaults to no dependency finalization', () => {
    const { positional, flags } = parseArguments(['generate', 'bp.json', 'out']);
    assert.deepEqual(positional, ['generate', 'bp.json', 'out']);
    assert.equal(wantsInstall(flags), false);
  });

  it('opts in with --install', () => {
    const { flags } = parseArguments(['generate', 'bp.json', 'out', '--install']);
    assert.equal(wantsInstall(flags), true);
  });

  it('accepts an explicit --no-install', () => {
    const { positional, flags } = parseArguments(['generate', 'bp.json', 'out', '--no-install']);
    assert.deepEqual(positional, ['generate', 'bp.json', 'out']);
    assert.equal(wantsInstall(flags), false);
  });

  it('refuses contradictory flags', () => {
    const { flags } = parseArguments(['generate', 'bp.json', 'out', '--install', '--no-install']);
    assert.throws(() => wantsInstall(flags), /not both/);
  });
});

describe('npm audit by documented exception', () => {
  const rnTargets = ['nestjs', 'nextjs', 'react-native'];
  const exceptions = loadExceptions();

  it('accepts a clean audit', () => {
    const report = evaluateAudit({ vulnerabilities: {} }, exceptions, { targets: ['nestjs'] });
    assert.equal(report.ok, true);
    assert.equal(report.total, 0);
  });

  it('fails on a vulnerability with no documented exception', () => {
    const report = evaluateAudit(
      { vulnerabilities: { lodash: { severity: 'high' } } }, exceptions, { targets: rnTargets },
    );
    assert.equal(report.ok, false);
    assert.match(report.violations[0].reason, /no documented exception/);
  });

  it('accepts a transitive npm propagation only when its documented root authorizes it', () => {
    const propagationExceptions = [{
      package: 'brace-expansion',
      maxSeverity: 'high',
      appliesTo: ['nestjs'],
      deadline: '2026-08-31',
      allowPropagation: true,
    }];
    const vulnerabilities = {
      'brace-expansion': {
        severity: 'high',
        via: [{ source: 1, name: 'brace-expansion', severity: 'high' }],
      },
      minimatch: { severity: 'high', via: ['brace-expansion'] },
      eslint: { severity: 'high', via: ['minimatch'] },
    };
    const report = evaluateAudit(
      { vulnerabilities }, propagationExceptions,
      { targets: ['nestjs'], now: new Date('2026-07-25') },
    );
    assert.equal(report.ok, true);
    assert.deepEqual(report.accepted.find((item) => item.package === 'eslint').propagatedVia, ['minimatch']);
  });

  it('does not hide a direct advisory behind an accepted propagated cause', () => {
    const propagationExceptions = [{
      package: 'brace-expansion',
      maxSeverity: 'high',
      appliesTo: ['nestjs'],
      deadline: '2026-08-31',
      allowPropagation: true,
    }];
    const vulnerabilities = {
      'brace-expansion': {
        severity: 'high',
        via: [{ source: 1, name: 'brace-expansion', severity: 'high' }],
      },
      minimatch: {
        severity: 'high',
        via: ['brace-expansion', { source: 2, name: 'minimatch', severity: 'high' }],
      },
    };
    const report = evaluateAudit(
      { vulnerabilities }, propagationExceptions,
      { targets: ['nestjs'], now: new Date('2026-07-25') },
    );
    assert.equal(report.ok, false);
    assert.equal(report.violations[0].package, 'minimatch');
  });

  it('does not propagate an exception unless it explicitly authorizes propagation', () => {
    const nonPropagatingExceptions = [{
      package: 'brace-expansion',
      maxSeverity: 'high',
      appliesTo: ['nestjs'],
      deadline: '2026-08-31',
    }];
    const vulnerabilities = {
      'brace-expansion': {
        severity: 'high',
        via: [{ source: 1, name: 'brace-expansion', severity: 'high' }],
      },
      minimatch: { severity: 'high', via: ['brace-expansion'] },
    };
    const report = evaluateAudit(
      { vulnerabilities }, nonPropagatingExceptions,
      { targets: ['nestjs'], now: new Date('2026-07-25') },
    );
    assert.equal(report.ok, false);
    assert.equal(report.violations[0].package, 'minimatch');
  });

  it('accepts the pre-existing Expo advisories only for a react-native composition', () => {
    const vulnerabilities = { uuid: { severity: 'moderate' }, xcode: { severity: 'moderate' } };
    const inScope = evaluateAudit({ vulnerabilities }, exceptions, { targets: rnTargets, now: new Date('2026-07-19') });
    assert.equal(inScope.ok, true, 'documented and in scope');
    assert.equal(inScope.accepted.length, 2);

    const outOfScope = evaluateAudit({ vulnerabilities }, exceptions, { targets: ['nestjs', 'nextjs'], now: new Date('2026-07-19') });
    assert.equal(outOfScope.ok, false, 'the same advisories are not tolerated without react-native');
    assert.match(outOfScope.violations[0].reason, /scoped to react-native/);
  });

  it('scopes shared contract tooling independently from the selected runtime', () => {
    const vulnerabilities = {
      'brace-expansion': {
        severity: 'high',
        via: [{ source: 1, name: 'brace-expansion', severity: 'high' }],
      },
    };
    const inScope = evaluateAudit(
      { vulnerabilities },
      exceptions,
      { targets: ['fastapi', 'shared-packages'], now: new Date('2026-07-25') },
    );
    assert.equal(inScope.ok, true);

    const withoutSharedScope = evaluateAudit(
      { vulnerabilities },
      exceptions,
      { targets: ['fastapi'], now: new Date('2026-07-25') },
    );
    assert.equal(withoutSharedScope.ok, false);
  });

  it('fails when an advisory exceeds the documented severity', () => {
    const report = evaluateAudit(
      { vulnerabilities: { uuid: { severity: 'critical' } } }, exceptions,
      { targets: rnTargets, now: new Date('2026-07-19') },
    );
    assert.equal(report.ok, false);
    assert.match(report.violations[0].reason, /severity exceeds documented moderate/);
  });

  it('fails once an exception deadline has passed (forced review)', () => {
    const report = evaluateAudit(
      { vulnerabilities: { uuid: { severity: 'moderate' } } }, exceptions,
      { targets: rnTargets, now: new Date('2027-01-01') },
    );
    assert.equal(report.ok, false);
    assert.match(report.violations[0].reason, /expired on 2026-10-31/);
  });

  it('documents every exception with a package, scope, justification and deadline', () => {
    assert.ok(exceptions.length > 0);
    for (const item of exceptions) {
      assert.ok(item.package, 'package');
      assert.ok(item.maxSeverity, 'maxSeverity');
      assert.ok(Array.isArray(item.appliesTo) && item.appliesTo.length > 0, `${item.package}: appliesTo`);
      assert.ok(item.scope && item.scope.length > 10, `${item.package}: scope`);
      assert.ok(item.justification && item.justification.length > 20, `${item.package}: justification`);
      assert.match(item.deadline, /^\d{4}-\d{2}-\d{2}$/, `${item.package}: deadline`);
    }
  });
});

describe('golden runtime audit wiring', () => {
  it('applies the audit gate to every golden composition', () => {
    // The capability-pack compositions and the R8A `base`-only ones must all be
    // wired. The list is asserted by containment, not by equality: freezing it
    // would break on every legitimate extension without catching a real defect.
    for (const composition of [
      'nestjs-base', 'nestjs-auth', 'nest-next-auth', 'triple-auth',
      'nestjs-auth-rbac', 'nest-next-auth-rbac', 'triple-auth-rbac',
      'nestjs-files', 'nest-next-files', 'triple-files',
      'spring-base', 'spring-next-base', 'spring-react-native-base',
      'fastapi-base',
      'spring-auth',
      'spring-angular-base', 'spring-flutter-base',
      'nestjs-next-base', 'nestjs-react-native-base',
      'nestjs-angular-base', 'nestjs-flutter-base',
    ]) {
      assert.ok(COMPOSITIONS[composition], `${composition} must be a golden composition`);
    }
    for (const composition of Object.keys(COMPOSITIONS)) {
      const spec = COMPOSITIONS[composition];
      const kinds = spec.stack
        ? Object.values(spec.stack).filter(Boolean)
        : [...new Set(spec.applications.map((application) => application.runtime))];
      const [cmd, args] = auditGate('/tmp/project', kinds);
      assert.equal(cmd, 'node');
      assert.match(args[0], /audit-check\.mjs$/);
      assert.equal(args[1], '/tmp/project');
      assert.equal(args[2], '--targets');
      assert.equal(args[3], [...kinds, 'shared-packages'].join(','));
    }
  });
});
