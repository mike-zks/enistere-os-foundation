import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, readFile, writeFile, mkdir, cp, readdir, symlink } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { generateProject } from '../engine/generator.mjs';
import { regenerateProject } from '../engine/regenerate.mjs';
import { createDefaultBlueprint } from '../engine/blueprint.mjs';
import { REPO_ROOT } from '../quality/scripts/fitness-functions.mjs';

/**
 * A regeneration is only worth proving on a project its owner has changed. On a
 * pristine copy, an implementation that overwrote everything would pass.
 */
function blueprintFor(slug, capabilities = []) {
  const blueprint = createDefaultBlueprint(slug);
  blueprint.stack = { api: 'nestjs', web: null, mobile: null };
  blueprint.capabilities = capabilities;
  blueprint.designSystem = true;
  blueprint.deployment = { environments: ['local'] };
  return blueprint;
}

describe('regeneration of an existing project', () => {
  let scratch;
  let pristine;

  before(async () => {
    scratch = await mkdtemp(join(tmpdir(), 'regen-test-'));
    // Generated once and copied per test: materialization is the slow part.
    pristine = join(scratch, 'pristine');
    await generateProject(blueprintFor('regen-base'), pristine);
  });

  after(async () => { await rm(scratch, { recursive: true, force: true }); });

  let counter = 0;
  const freshCopy = async () => {
    const project = join(scratch, `case-${(counter += 1)}`);
    await cp(pristine, project, { recursive: true });
    return project;
  };

  it('leaves an untouched project byte-identical, and says so', async () => {
    const project = await freshCopy();
    const report = await regenerateProject(project);

    assert.equal(report.applied, true);
    assert.deepEqual(report.conflicts, []);
    // Same Foundation, same blueprint: nothing to replace, nothing to remove.
    assert.deepEqual(report.replace, []);
    assert.deepEqual(report.create, []);
    assert.deepEqual(report.remove, []);
    assert.ok(report.counts.untouched > 100, `only ${report.counts.untouched} files compared`);
  });

  it('refuses to touch anything when the owner modified a Factory file', async () => {
    const project = await freshCopy();
    const target = join(project, 'apps/api/src/main.ts');
    const mine = `${await readFile(target, 'utf8')}\n// mine\n`;
    await writeFile(target, mine);

    const report = await regenerateProject(project);

    assert.equal(report.applied, false, 'abort mode must write nothing');
    assert.ok(
      report.conflicts.some((c) => c.path === 'apps/api/src/main.ts' && c.reason === 'owner-modified'),
      `conflict not reported: ${JSON.stringify(report.conflicts)}`,
    );
    // And the point of aborting: the file is still theirs.
    assert.equal(await readFile(target, 'utf8'), mine);
  });

  it('never overwrites a conflict, even when told to carry on', async () => {
    const project = await freshCopy();
    const target = join(project, 'apps/api/src/main.ts');
    const mine = `${await readFile(target, 'utf8')}\n// mine\n`;
    await writeFile(target, mine);

    const report = await regenerateProject(project, { onConflict: 'keep' });

    assert.equal(report.applied, true);
    assert.ok(report.counts.conflicts > 0);
    assert.equal(
      await readFile(target, 'utf8'), mine,
      'keep mode must apply the safe changes and still leave the conflict alone',
    );
  });

  it('never touches a file the owner created', async () => {
    const project = await freshCopy();
    await mkdir(join(project, 'apps/api/src/modules/billing'), { recursive: true });
    const mine = join(project, 'apps/api/src/modules/billing/billing.service.ts');
    await writeFile(mine, 'export class BillingService {}\n');

    const report = await regenerateProject(project);

    assert.equal(report.applied, true);
    assert.deepEqual(report.conflicts, []);
    assert.ok(
      report.preserved.includes('apps/api/src/modules/billing/billing.service.ts'),
      'an owner file must be reported as preserved, not as unchanged',
    );
    assert.equal(await readFile(mine, 'utf8'), 'export class BillingService {}\n');
  });

  it('never follows an owner symlink outside the project, even in keep mode', async () => {
    const project = await freshCopy();
    const outside = join(scratch, 'owner-outside');
    await mkdir(outside);
    await writeFile(join(outside, 'OWNER.txt'), 'mine\n');
    await mkdir(join(project, 'apps/api/src/modules'), { recursive: true });
    await symlink(outside, join(project, 'apps/api/src/modules/auth'), 'dir');

    const blueprintPath = join(project, 'enistere.yaml');
    const blueprint = JSON.parse(await readFile(blueprintPath, 'utf8'));
    blueprint.capabilities = ['auth'];
    await writeFile(blueprintPath, `${JSON.stringify(blueprint, null, 2)}\n`);

    const refused = await regenerateProject(project);
    assert.equal(refused.applied, false);
    assert.ok(refused.conflicts.some(
      (conflict) => conflict.path === 'apps/api/src/modules/auth'
        && conflict.reason === 'owner-created',
    ));
    assert.deepEqual(await readdir(outside), ['OWNER.txt']);

    const kept = await regenerateProject(project, { onConflict: 'keep' });
    assert.equal(kept.applied, true);
    assert.ok(kept.conflicts.some(
      (conflict) => conflict.path === 'apps/api/src/modules/auth'
        && conflict.reason === 'owner-created',
    ));
    assert.ok(!kept.create.some((path) => path.startsWith('apps/api/src/modules/auth/')));
    assert.deepEqual(await readdir(outside), ['OWNER.txt']);
  });

  it('never follows a symlink when rewriting Factory control files', async () => {
    const project = await freshCopy();
    assert.match(
      await readFile(join(project, 'README.md'), 'utf8'),
      /enistere\.lock.*enistere\.inventory\.json.*fichiers de contrôle/s,
    );
    const outsideLock = join(scratch, 'OWNER-LOCK.json');
    const mine = '{"owner":"mine"}\n';
    await writeFile(outsideLock, mine);
    await rm(join(project, 'enistere.lock'));
    await symlink(outsideLock, join(project, 'enistere.lock'));

    const report = await regenerateProject(project, { onConflict: 'keep' });

    assert.equal(report.applied, true);
    assert.ok(report.conflicts.some(
      (conflict) => conflict.path === 'enistere.lock' && conflict.reason === 'owner-created',
    ));
    assert.equal(await readFile(outsideLock, 'utf8'), mine);
  });

  it('reports a Factory file the owner deleted instead of resurrecting it', async () => {
    const project = await freshCopy();
    await rm(join(project, 'apps/api/src/health/health.controller.ts'));

    const report = await regenerateProject(project);

    assert.equal(report.applied, false);
    assert.ok(report.conflicts.some(
      (c) => c.path === 'apps/api/src/health/health.controller.ts' && c.reason === 'owner-deleted',
    ));
    assert.equal(existsSync(join(project, 'apps/api/src/health/health.controller.ts')), false);
  });

  it('adds a capability to a project that already carries owner code', async () => {
    const project = await freshCopy();
    // The owner has been working in the business zone. This is the case the
    // whole zone effort was for.
    await mkdir(join(project, 'apps/api/src/modules/billing'), { recursive: true });
    const mine = join(project, 'apps/api/src/modules/billing/billing.service.ts');
    await writeFile(mine, 'export class BillingService {}\n');

    const blueprintPath = join(project, 'enistere.yaml');
    const blueprint = JSON.parse(await readFile(blueprintPath, 'utf8'));
    blueprint.capabilities = ['auth'];
    await writeFile(blueprintPath, `${JSON.stringify(blueprint, null, 2)}\n`);

    const report = await regenerateProject(project);

    assert.equal(report.applied, true, JSON.stringify(report.conflicts.slice(0, 5)));
    assert.deepEqual(report.conflicts, []);
    assert.ok(report.capabilities.includes('auth'));
    // Authentication landed, in the business zone.
    assert.ok(
      report.create.some((path) => path.startsWith('apps/api/src/modules/auth/')),
      'Authentication was not materialized',
    );
    assert.equal(existsSync(join(project, 'apps/api/src/modules/auth')), true);
    // The composition seam was rewritten to know about it.
    assert.ok(report.replace.includes('apps/api/src/composition/capabilities.ts'));
    // And the owner's module is exactly as they left it.
    assert.equal(await readFile(mine, 'utf8'), 'export class BillingService {}\n');
    // The inventory now describes the new state, so a second run is a no-op.
    const second = await regenerateProject(project);
    assert.deepEqual(second.replace, []);
    assert.deepEqual(second.create, []);
    assert.deepEqual(second.conflicts, []);
  });

  it('removes what a capability shipped when the capability is dropped', async () => {
    const project = join(scratch, 'with-auth');
    await generateProject(blueprintFor('regen-auth', ['auth']), project);
    assert.equal(existsSync(join(project, 'apps/api/src/modules/auth')), true);

    const blueprintPath = join(project, 'enistere.yaml');
    const blueprint = JSON.parse(await readFile(blueprintPath, 'utf8'));
    blueprint.capabilities = [];
    await writeFile(blueprintPath, `${JSON.stringify(blueprint, null, 2)}\n`);

    const report = await regenerateProject(project);

    assert.equal(report.applied, true, JSON.stringify(report.conflicts.slice(0, 5)));
    assert.ok(report.remove.some((path) => path.startsWith('apps/api/src/modules/auth/')));
    assert.equal(existsSync(join(project, 'apps/api/src/modules/auth')), false);
  });

  it('keeps a modified capability file when its capability is dropped', async () => {
    const project = join(scratch, 'with-auth-edited');
    await generateProject(blueprintFor('regen-auth-edited', ['auth']), project);
    const target = join(project, 'apps/api/src/modules/auth/auth.service.ts');
    const mine = `${await readFile(target, 'utf8')}\n// mine\n`;
    await writeFile(target, mine);

    const blueprintPath = join(project, 'enistere.yaml');
    const blueprint = JSON.parse(await readFile(blueprintPath, 'utf8'));
    blueprint.capabilities = [];
    await writeFile(blueprintPath, `${JSON.stringify(blueprint, null, 2)}\n`);

    const report = await regenerateProject(project, { onConflict: 'keep' });

    // Removing a capability must not delete work done inside what it shipped.
    assert.ok(report.conflicts.some((c) => c.path.endsWith('auth/auth.service.ts')));
    assert.equal(await readFile(target, 'utf8'), mine);
  });

  it('never removes a migration when a capability is dropped', async () => {
    const project = join(scratch, 'migrations');
    await generateProject(blueprintFor('regen-migrations', ['auth']), project);
    const migration = 'apps/api/prisma/migrations/20260718000100_auth_init/migration.sql';
    assert.equal(existsSync(join(project, migration)), true);

    const blueprintPath = join(project, 'enistere.yaml');
    const blueprint = JSON.parse(await readFile(blueprintPath, 'utf8'));
    blueprint.capabilities = [];
    await writeFile(blueprintPath, `${JSON.stringify(blueprint, null, 2)}\n`);

    const report = await regenerateProject(project);

    // A migration says what has already been done to databases that are not in
    // this repository. Deleting the file does not un-happen it — on FastAPI it
    // left `alembic current` unable to locate the revision the schema is at.
    assert.equal(report.applied, true, JSON.stringify(report.conflicts.slice(0, 5)));
    assert.ok(report.retained.includes(migration), `not retained: ${JSON.stringify(report.retained)}`);
    assert.ok(!report.remove.includes(migration));
    assert.equal(existsSync(join(project, migration)), true);
    // The capability's code is gone all the same.
    assert.equal(existsSync(join(project, 'apps/api/src/modules/auth')), false);
  });

  it('writes nothing at all in dry run', async () => {
    const project = await freshCopy();
    const blueprintPath = join(project, 'enistere.yaml');
    const blueprint = JSON.parse(await readFile(blueprintPath, 'utf8'));
    blueprint.capabilities = ['auth'];
    await writeFile(blueprintPath, `${JSON.stringify(blueprint, null, 2)}\n`);

    const report = await regenerateProject(project, { dryRun: true });

    assert.equal(report.applied, false);
    assert.ok(report.create.length > 0, 'a dry run still has to say what it would do');
    assert.equal(existsSync(join(project, 'apps/api/src/modules/auth')), false);
  });

  it('refuses to rename immutable project identity during regeneration', async () => {
    const project = await freshCopy();
    const blueprintPath = join(project, 'enistere.yaml');
    const blueprint = JSON.parse(await readFile(blueprintPath, 'utf8'));
    blueprint.project.slug = 'renamed-project';
    await writeFile(blueprintPath, `${JSON.stringify(blueprint, null, 2)}\n`);

    await assert.rejects(
      regenerateProject(project, { onConflict: 'keep' }),
      /Project and application ids are immutable after delivery/u,
    );
    assert.equal(existsSync(join(project, 'apps/api/package.json')), true);
    const identity = JSON.parse(await readFile(join(project, 'enistere.identity.json'), 'utf8'));
    assert.equal(identity.project, 'regen-base');
  });

  it('refuses to remove a delivered application identity but permits adding one', async () => {
    const project = await freshCopy();
    const blueprintPath = join(project, 'enistere.yaml');
    const blueprint = JSON.parse(await readFile(blueprintPath, 'utf8'));
    delete blueprint.stack;
    blueprint.applications = [
      { id: 'api', kind: 'api', runtime: 'nestjs' },
      { id: 'web', kind: 'web', runtime: 'angular', consumes: ['api'] },
    ];
    await writeFile(blueprintPath, `${JSON.stringify(blueprint, null, 2)}\n`);

    const addition = await regenerateProject(project);
    assert.equal(addition.applied, true, JSON.stringify(addition.conflicts.slice(0, 5)));

    const withWeb = JSON.parse(await readFile(blueprintPath, 'utf8'));
    withWeb.applications = withWeb.applications.filter((application) => application.id !== 'web');
    await writeFile(blueprintPath, `${JSON.stringify(withWeb, null, 2)}\n`);

    await assert.rejects(
      regenerateProject(project, { onConflict: 'keep' }),
      /Project and application ids are immutable after delivery/u,
    );
  });

  it('drives the real CLI surface, dry run then for real', async () => {
    const project = await freshCopy();
    const blueprintPath = join(project, 'enistere.yaml');
    const blueprint = JSON.parse(await readFile(blueprintPath, 'utf8'));
    blueprint.capabilities = ['auth'];
    await writeFile(blueprintPath, `${JSON.stringify(blueprint, null, 2)}\n`);
    const cli = (...args) => spawnSync(
      'node', [join(REPO_ROOT, 'factory/cli/enistere.mjs'), 'regenerate', project, ...args],
      { encoding: 'utf8', shell: false, cwd: REPO_ROOT },
    );

    const dry = cli('--dry-run');
    assert.equal(dry.status, 0, dry.stderr);
    assert.equal(JSON.parse(dry.stdout).applied, false);
    assert.equal(existsSync(join(project, 'apps/api/src/modules/auth')), false);

    const real = cli();
    assert.equal(real.status, 0, real.stderr);
    const report = JSON.parse(real.stdout);
    assert.equal(report.applied, true);
    assert.ok(report.counts.create > 0);
    assert.equal(existsSync(join(project, 'apps/api/src/modules/auth')), true);
  });

  it('exits non-zero from the CLI when a conflict stops the run', async () => {
    const project = await freshCopy();
    const target = join(project, 'apps/api/src/main.ts');
    await writeFile(target, `${await readFile(target, 'utf8')}\n// mine\n`);

    const cli = spawnSync(
      'node', [join(REPO_ROOT, 'factory/cli/enistere.mjs'), 'regenerate', project],
      { encoding: 'utf8', shell: false, cwd: REPO_ROOT },
    );
    // A caller scripting this must be able to tell refusal from success.
    assert.equal(cli.status, 1, cli.stderr);
    assert.ok(JSON.parse(cli.stdout).conflicts.some((c) => c.reason === 'owner-modified'));
  });

  it('refuses a project generated before the inventory existed', async () => {
    const project = await freshCopy();
    await rm(join(project, 'enistere.inventory.json'));
    await assert.rejects(
      () => regenerateProject(project),
      /cannot be regenerated safely/,
    );
  });
});
