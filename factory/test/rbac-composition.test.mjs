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
import { orderGlobalGuards, renderNestjsComposition } from '../engine/overlay-renderers.mjs';
import {
  addPrismaModelField,
  addPrismaModel,
  applyPrismaFragment,
  createPrismaComposition,
  renderPrismaComposition,
  validatePrismaFragment,
} from '../engine/prisma-schema.mjs';
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

describe('typed Prisma composition', () => {
  // A fragment whose comments/docs contain braces and irregular spacing: the typed
  // model never parses text, so these are carried through verbatim and harmlessly.
  const authFragment = {
    enums: [{ name: 'UserStatus', values: ['ACTIVE', 'INACTIVE'] }],
    models: [{
      name: 'User',
      doc: 'Utilisateur { avec accolades } dans le commentaire',
      fields: [
        { name: 'id', type: 'String', attributes: ['@id', '@default(uuid())', '@db.Uuid'] },
        { name: 'email', type: 'String', attributes: ['@unique'] },
        { name: 'refreshSessions', type: 'RefreshSession[]' },
      ],
      blockAttributes: ['@@map("users")'],
    }],
  };
  const rbacFragment = {
    models: [{
      name: 'UserRole',
      fields: [
        { name: 'userId', type: 'String', attributes: ['@db.Uuid'] },
        { name: 'user', type: 'User', attributes: ['@relation(fields: [userId], references: [id])'] },
      ],
      blockAttributes: ['@@id([userId])'],
    }],
    fields: [{ model: 'User', field: 'roles', type: 'UserRole[]' }],
  };

  function composed() {
    const composition = createPrismaComposition();
    applyPrismaFragment(composition, authFragment, 'auth');
    applyPrismaFragment(composition, rbacFragment, 'rbac');
    return composition;
  }

  it('extends a model owned by an earlier capability without duplicating it', () => {
    const out = renderPrismaComposition(composed());
    assert.equal(out.match(/^model User \{/gm).length, 1, 'User declared once');
    assert.match(out, /roles\s+UserRole\[\]/);
    // Braces inside a doc comment never confuse the composition (no parsing at all).
    assert.match(out, /Utilisateur \{ avec accolades \}/);
  });

  it('renders byte-identically for the same composition', () => {
    assert.equal(renderPrismaComposition(composed()), renderPrismaComposition(composed()));
  });

  it('rejects unknown fragment properties instead of silently dropping typos', () => {
    assert.throws(
      () => validatePrismaFragment({ modelz: [] }),
      /unknown property: modelz/,
    );
    assert.throws(
      () => validatePrismaFragment({ models: [{ name: 'User', fields: [{ name: 'id', type: 'String', typo: true }] }] }),
      /unknown property: typo/,
    );
  });

  it('rejects malformed collections and duplicate enum values', () => {
    assert.throws(() => validatePrismaFragment({ models: {} }), /models must be an array/);
    assert.throws(
      () => validatePrismaFragment({ enums: [{ name: 'State', values: ['READY', 'READY'] }] }),
      /duplicate values/,
    );
    assert.throws(
      () => validatePrismaFragment({ models: [{ name: 'User', fields: [{ name: 'id', type: 'String', attributes: '@id' }] }] }),
      /attributes must be an array/,
    );
  });

  it('keeps block attributes after the fields', () => {
    const out = renderPrismaComposition(composed());
    const model = out.slice(out.indexOf('model User {'), out.indexOf('model UserRole {'));
    assert.ok(model.indexOf('roles') < model.indexOf('@@map("users")'));
  });

  it('supports several extensions of the same model', () => {
    const composition = composed();
    addPrismaModelField(composition, { model: 'User', field: 'files', type: 'StoredFile[]' }, 'files');
    const out = renderPrismaComposition(composition);
    assert.match(out, /roles\s+UserRole\[\]/);
    assert.match(out, /files\s+StoredFile\[\]/);
    assert.equal(out.match(/^model User \{/gm).length, 1);
  });

  it('refuses an unknown model', () => {
    assert.throws(
      () => addPrismaModelField(composed(), { model: 'Ghost', field: 'x', type: 'String' }, 'rbac'),
      /model not found: Ghost/,
    );
  });

  it('refuses a duplicated model', () => {
    const composition = composed();
    assert.throws(
      () => addPrismaModel(composition, { name: 'User', fields: [{ name: 'id', type: 'String' }] }, 'files'),
      /model already declared by auth: User/,
    );
  });

  it('refuses a duplicated field', () => {
    assert.throws(
      () => addPrismaModelField(composed(), { model: 'User', field: 'email', type: 'String' }, 'files'),
      /field already declared on User by auth: email/,
    );
  });

  it('validates the declarative fragment integration', () => {
    const base = {
      schemaVersion: '1', capability: 'rbac', target: 'nestjs', version: '0.2.0',
      files: [], dependencies: {}, environment: [], verification: [],
    };
    assert.deepEqual(validateOverlayManifest({
      ...base, integrations: [{ kind: 'nestjs.prisma-schema', source: 'fragments/rbac.prisma.json' }],
    }), []);
    const bad = validateOverlayManifest({
      ...base, integrations: [{ kind: 'nestjs.prisma-schema', source: '../escape.json' }],
    });
    assert.ok(bad.some((i) => /safe relative path/.test(i)));
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
    assert.match(schema, /roles\s+UserRole\[\]/);
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
    assert.ok(!/roles\s+UserRole\[\]/.test(schema), 'base+auth User has no RBAC relation');
  });
});
