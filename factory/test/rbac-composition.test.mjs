import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { access, mkdtemp, readFile } from 'node:fs/promises';
import { constants } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  assessCapabilitySupport,
  validateCapabilityDependencies,
  validateCapabilityManifest,
  CAPABILITY_STATUSES,
  NON_BLOCKING_STATUSES,
} from '../engine/capabilities.mjs';
import { addPrismaModelField, orderGlobalGuards, renderNestjsComposition } from '../engine/overlay-renderers.mjs';
import { validateOverlayManifest } from '../engine/overlay.mjs';
import { createDefaultBlueprint } from '../engine/blueprint.mjs';
import { generateProject } from '../engine/generator.mjs';

async function exists(p) { try { await access(p, constants.F_OK); return true; } catch { return false; } }

function blueprint(slug, stack, capabilities) {
  const b = createDefaultBlueprint(slug);
  b.stack = stack;
  b.capabilities = capabilities;
  b.designSystem = true;
  b.deployment = { environments: ['local'] };
  return b;
}

const manifest = (id, targets) => ({ id, targets });

describe('capability status semantics', () => {
  it('registers the four statuses and their blocking behaviour', () => {
    assert.deepEqual([...CAPABILITY_STATUSES], ['ready', 'planned', 'unsupported', 'not-applicable']);
    assert.deepEqual([...NON_BLOCKING_STATUSES], ['ready', 'not-applicable']);
  });

  it('does not block on a not-applicable target and reports it', () => {
    const support = assessCapabilitySupport(['nestjs', 'react-native'], [
      manifest('rbac', { nestjs: { status: 'ready', mode: 'overlay' }, 'react-native': { status: 'not-applicable' } }),
    ]);
    assert.equal(support.ready, true);
    assert.deepEqual(support.blockers, []);
    assert.deepEqual(support.notApplicable, [{ capability: 'rbac', starter: 'react-native' }]);
  });

  it('blocks on planned and unsupported targets', () => {
    for (const status of ['planned', 'unsupported']) {
      const support = assessCapabilitySupport(['spring'], [manifest('rbac', { spring: { status } })]);
      assert.equal(support.ready, false, status);
      assert.deepEqual(support.blockers, [{ capability: 'rbac', starter: 'spring', status }]);
    }
  });

  it('accepts not-applicable in a capability manifest', () => {
    const value = {
      schemaVersion: '2', id: 'rbac', version: '0.2.0', requires: ['base', 'auth'], responsibilities: ['roles'],
      targets: {
        nestjs: { status: 'ready', mode: 'overlay' }, spring: { status: 'planned' },
        nextjs: { status: 'ready', mode: 'overlay' }, angular: { status: 'planned' },
        'react-native': { status: 'not-applicable' }, flutter: { status: 'planned' },
      },
    };
    assert.deepEqual(validateCapabilityManifest(value), []);
  });
});

describe('rbac dependency contract', () => {
  it('requires auth (and base) before rbac', () => {
    assert.match(validateCapabilityDependencies(['base', 'rbac']).join(' '), /rbac requires auth/);
    assert.deepEqual(validateCapabilityDependencies(['base', 'auth', 'rbac']), []);
  });

  it('refuses rbac without base', () => {
    const issues = validateCapabilityDependencies(['auth', 'rbac']).join(' ');
    assert.match(issues, /base is mandatory/);
  });

  it('declares requires: [base, auth] in the shipped manifest', async () => {
    const value = JSON.parse(await readFile(new URL('../../capabilities/rbac/capability.json', import.meta.url), 'utf8'));
    assert.deepEqual(value.requires, ['base', 'auth']);
    assert.equal(value.targets.nestjs.status, 'ready');
    assert.equal(value.targets.nextjs.status, 'ready');
    assert.equal(value.targets['react-native'].status, 'not-applicable');
    for (const planned of ['spring', 'angular', 'flutter']) assert.equal(value.targets[planned].status, 'planned');
  });

  it('rejects generating base + rbac without auth', async () => {
    const root = await mkdtemp(join(tmpdir(), 'enistere-rbac-dep-'));
    await assert.rejects(
      generateProject(blueprint('no-auth', { api: 'nestjs', web: null, mobile: null }, ['base', 'rbac']), join(root, 'p'), { materialize: false }),
      /rbac requires auth|Invalid blueprint/,
    );
  });
});

describe('deterministic global guard order', () => {
  const guard = (symbol, order) => ({ kind: 'nestjs.global-guard', importPath: `../${symbol}`, symbol, order });

  it('sorts guards by declared order regardless of composition order', () => {
    const ordered = orderGlobalGuards([guard('PermissionsGuard', 30), guard('JwtAuthGuard', 10), guard('RolesGuard', 20)]);
    assert.deepEqual(ordered.map((g) => g.symbol), ['JwtAuthGuard', 'RolesGuard', 'PermissionsGuard']);
  });

  it('renders the authentication → roles → permissions chain', () => {
    const rendered = renderNestjsComposition([
      { kind: 'nestjs.module', importPath: '../a/a.module', symbol: 'AModule' },
      guard('RolesGuard', 20), guard('PermissionsGuard', 30), guard('JwtAuthGuard', 10),
    ]);
    const chain = rendered.slice(rendered.indexOf('CAPABILITY_GLOBAL_GUARDS'));
    assert.ok(chain.indexOf('JwtAuthGuard') < chain.indexOf('RolesGuard'), 'auth before roles');
    assert.ok(chain.indexOf('RolesGuard') < chain.indexOf('PermissionsGuard'), 'roles before permissions');
  });

  it('rejects a duplicated guard symbol', () => {
    assert.throws(() => orderGlobalGuards([guard('RolesGuard', 20), guard('RolesGuard', 25)]), /Duplicate global guard/);
  });

  it('rejects two guards claiming the same slot', () => {
    assert.throws(() => orderGlobalGuards([guard('RolesGuard', 20), guard('PermissionsGuard', 20)]), /Ambiguous global guard order/);
  });

  it('requires an explicit order on a global guard', () => {
    const issues = validateOverlayManifest({
      schemaVersion: '1', capability: 'rbac', target: 'nestjs', version: '0.2.0',
      files: [], dependencies: {}, environment: [], verification: [],
      integrations: [{ kind: 'nestjs.global-guard', importPath: '../x', symbol: 'X' }],
    });
    assert.ok(issues.some((i) => /order is required/.test(i)), issues.join(' '));
  });
});

describe('structured prisma model extension', () => {
  const schema = [
    'model User {',
    '  id String @id',
    '  refreshSessions RefreshSession[]',
    '',
    '  @@map("users")',
    '}',
    '',
    'model Other {',
    '  id String @id',
    '}',
    '',
  ].join('\n');

  it('inserts the field with the other fields, before block attributes', () => {
    const out = addPrismaModelField(schema, { model: 'User', field: 'roles', type: 'UserRole[]' }, 'rbac');
    const body = out.slice(out.indexOf('model User {'), out.indexOf('model Other {'));
    assert.match(body, /roles UserRole\[\]/);
    assert.ok(body.indexOf('roles UserRole[]') < body.indexOf('@@map("users")'), 'field precedes block attributes');
    assert.match(body, /rbac capability relation/);
    // The model is extended, never duplicated.
    assert.equal(out.match(/^model User \{/gm).length, 1);
  });

  it('appends before the closing brace when the model has no block attribute', () => {
    const out = addPrismaModelField(schema, { model: 'Other', field: 'tags', type: 'String[]' }, 'rbac');
    assert.match(out.slice(out.indexOf('model Other {')), /tags String\[\]/);
  });

  it('refuses an unknown model', () => {
    assert.throws(() => addPrismaModelField(schema, { model: 'Ghost', field: 'x', type: 'String' }, 'rbac'), /model not found: Ghost/);
  });

  it('refuses to declare an existing field twice', () => {
    assert.throws(
      () => addPrismaModelField(schema, { model: 'User', field: 'refreshSessions', type: 'RefreshSession[]' }, 'rbac'),
      /already declared/,
    );
  });

  it('validates the integration declaration', () => {
    const base = {
      schemaVersion: '1', capability: 'rbac', target: 'nestjs', version: '0.2.0',
      files: [], dependencies: {}, environment: [], verification: [],
    };
    assert.deepEqual(validateOverlayManifest({
      ...base, integrations: [{ kind: 'nestjs.prisma-model-field', model: 'User', field: 'roles', type: 'UserRole[]' }],
    }), []);
    const bad = validateOverlayManifest({
      ...base, integrations: [{ kind: 'nestjs.prisma-model-field', model: 'user', field: 'Roles', type: 'UserRole[]' }],
    });
    assert.ok(bad.some((i) => /model must be a Prisma model name/.test(i)));
    assert.ok(bad.some((i) => /field must be a Prisma field name/.test(i)));
  });
});

describe('rbac golden compositions (structural)', () => {
  it('composes RBAC on NestJS with ordered guards and a single User model', async () => {
    const root = await mkdtemp(join(tmpdir(), 'enistere-rbac-nest-'));
    const out = join(root, 'p');
    await generateProject(blueprint('rbac-nest', { api: 'nestjs', web: null, mobile: null }, ['base', 'auth', 'rbac']), out);

    const composition = await readFile(join(out, 'apps/api/src/composition/capabilities.ts'), 'utf8');
    const chain = composition.slice(composition.indexOf('CAPABILITY_GLOBAL_GUARDS'));
    assert.ok(chain.indexOf('JwtAuthGuard') < chain.indexOf('RolesGuard'));
    assert.ok(chain.indexOf('RolesGuard') < chain.indexOf('PermissionsGuard'));
    assert.match(composition, /AuthorizationModule/);

    const schema = await readFile(join(out, 'apps/api/prisma/schema.prisma'), 'utf8');
    assert.equal(schema.match(/^model User \{/gm).length, 1, 'User must not be duplicated');
    assert.match(schema, /roles UserRole\[\]/);
    for (const model of ['Role', 'Permission', 'UserRole', 'RolePermission']) {
      assert.ok(new RegExp(`^model ${model} \\{`, 'm').test(schema), `${model} present`);
    }
    assert.ok(await exists(join(out, 'apps/api/prisma/migrations/20260719000200_rbac_init/migration.sql')));
    assert.ok(await exists(join(out, 'apps/api/src/authorization/authorization.controller.ts')));
    // No Files surface is injected.
    assert.equal(await exists(join(out, 'apps/api/src/files')), false);
  });

  it('composes RBAC on the web and never on mobile (not-applicable)', async () => {
    const root = await mkdtemp(join(tmpdir(), 'enistere-rbac-triple-'));
    const out = join(root, 'p');
    await generateProject(
      blueprint('rbac-triple', { api: 'nestjs', web: 'nextjs', mobile: 'react-native' }, ['base', 'auth', 'rbac']),
      out,
    );

    assert.ok(await exists(join(out, 'apps/web/src/app/api/auth/authorization/route.ts')));
    assert.ok(await exists(join(out, 'apps/web/src/core/authorization/authorization-client.ts')));
    assert.ok(await exists(join(out, 'apps/web/src/features/authorization/use-authorization.ts')));

    // Mobile stays on base + auth: no RBAC surface at all.
    for (const path of ['src/roles', 'src/authorization', 'src/rbac', 'src/permissions/permissions.constants.ts']) {
      assert.equal(await exists(join(out, 'apps/mobile', path)), false, `mobile must not receive ${path}`);
    }
    assert.ok(await exists(join(out, 'apps/mobile/src/auth/auth-engine.ts')), 'mobile keeps Auth');

    const lock = JSON.parse(await readFile(join(out, 'enistere.lock'), 'utf8'));
    const applied = lock.overlays.map((o) => `${o.capability}/${o.target}`).sort();
    assert.deepEqual(applied, ['auth/nestjs', 'auth/nextjs', 'auth/react-native', 'rbac/nestjs', 'rbac/nextjs']);
  });

  it('keeps base and base+auth free of RBAC', async () => {
    const root = await mkdtemp(join(tmpdir(), 'enistere-rbac-absence-'));
    const baseOnly = join(root, 'base');
    await generateProject(blueprint('rbac-absent', { api: 'nestjs', web: null, mobile: null }, ['base']), baseOnly);
    assert.equal(await exists(join(baseOnly, 'apps/api/src/auth')), false);
    assert.equal(await exists(join(baseOnly, 'apps/api/src/roles')), false);

    const withAuth = join(root, 'auth');
    await generateProject(blueprint('rbac-absent2', { api: 'nestjs', web: null, mobile: null }, ['base', 'auth']), withAuth);
    assert.ok(await exists(join(withAuth, 'apps/api/src/auth/auth.module.ts')));
    for (const path of ['src/roles', 'src/permissions', 'src/authorization']) {
      assert.equal(await exists(join(withAuth, 'apps/api', path)), false, `base+auth must not contain ${path}`);
    }
    const schema = await readFile(join(withAuth, 'apps/api/prisma/schema.prisma'), 'utf8');
    assert.ok(!/model Role \{/.test(schema), 'base+auth prisma has no Role');
    assert.ok(!/roles UserRole\[\]/.test(schema), 'base+auth User has no RBAC relation');
  });
});
