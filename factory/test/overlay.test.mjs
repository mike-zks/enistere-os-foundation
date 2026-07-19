import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  applyCapabilityOverlays,
  computeOverlayDigest,
  loadOverlay,
  validateOverlayManifest,
} from '../engine/overlay.mjs';
import { validateCapabilityDependencies } from '../engine/capabilities.mjs';
import { buildGenerationPlan } from '../engine/plan.mjs';
import { createDefaultBlueprint } from '../engine/blueprint.mjs';
import { generateProject } from '../engine/generator.mjs';
import { renderSpringComposition } from '../engine/overlay-renderers.mjs';

function validManifest(extra = {}) {
  return {
    schemaVersion: '1',
    capability: 'auth',
    target: 'nestjs',
    version: '0.1.0',
    files: [{ source: 'files/src/auth', destination: 'src/auth' }],
    dependencies: { dependencies: { '@nestjs/jwt': '^11.0.2' } },
    environment: [{ name: 'JWT_ACCESS_SECRET', example: 'change-me', comment: 'Access token secret' }],
    integrations: [{ kind: 'nestjs.module', importPath: '../auth/auth.module', symbol: 'AuthModule' }],
    verification: [['npm', 'test']],
    ...extra,
  };
}

const CAPABILITY_MANIFESTS = [
  {
    schemaVersion: '2', id: 'base', version: '0.1.0', requires: [], responsibilities: ['health'],
    targets: { nestjs: { status: 'ready', mode: 'built-in' } },
  },
  {
    schemaVersion: '2', id: 'auth', version: '0.1.0', requires: ['base'], responsibilities: ['login'],
    targets: { nestjs: { status: 'ready', mode: 'overlay' } },
  },
];

async function fixtureRepo(manifest, { payload = 'export const AUTH = true;\n' } = {}) {
  const repoRoot = await mkdtemp(join(tmpdir(), 'enistere-overlay-repo-'));
  const overlayDir = join(repoRoot, 'capabilities/auth/targets/nestjs');
  await mkdir(join(overlayDir, 'files/src/auth'), { recursive: true });
  await writeFile(join(overlayDir, 'overlay.json'), JSON.stringify(manifest, null, 2));
  await writeFile(join(overlayDir, 'files/src/auth/auth.module.ts'), payload);
  return repoRoot;
}

async function fixtureOutput() {
  const output = await mkdtemp(join(tmpdir(), 'enistere-overlay-out-'));
  await mkdir(join(output, 'apps/api/src'), { recursive: true });
  await writeFile(join(output, 'apps/api/package.json'), JSON.stringify({
    name: 'api', version: '0.1.0', dependencies: { '@nestjs/common': '^11.0.0' },
  }, null, 2));
  await writeFile(join(output, 'apps/api/package-lock.json'), '{}\n');
  await writeFile(join(output, 'apps/api/.env.example'), 'PORT=3000\n');
  return output;
}

function applyArguments(repoRoot, output) {
  return {
    repoRoot,
    blueprint: { capabilities: ['base', 'auth'] },
    plan: { starterSources: { api: 'starters/nestjs' } },
    output,
    capabilityManifests: CAPABILITY_MANIFESTS,
  };
}

describe('overlay manifest validation', () => {
  it('accepts a nominal overlay', () => {
    assert.deepEqual(validateOverlayManifest(validManifest(), { capability: 'auth', target: 'nestjs' }), []);
  });

  it('validates declared operations against the target adapter', () => {
    assert.deepEqual(validateOverlayManifest(validManifest({
      operations: ['files', 'dependencies', 'environment', 'integrations', 'verification'],
    }), { capability: 'auth', target: 'nestjs' }), []);
    const issues = validateOverlayManifest(validManifest({ operations: ['spring.security'] }), { capability: 'auth', target: 'nestjs' });
    assert.ok(issues.some((issue) => /unsupported operations/.test(issue)));
  });

  it('accepts the Spring module integration contract', () => {
    const manifest = validManifest({
      target: 'spring',
      files: [],
      dependencies: { maven: [] },
      integrations: [{ kind: 'spring.module', importPath: 'com.example.AuthConfiguration', symbol: 'AuthConfiguration' }],
    });
    assert.deepEqual(validateOverlayManifest(manifest, { capability: 'auth', target: 'spring' }), []);
  });

  it('accepts Maven dependency declarations for Spring without accepting npm sections', () => {
    const spring = validManifest({
      target: 'spring', files: [],
      dependencies: { maven: [{ groupId: 'org.springframework.boot', artifactId: 'spring-boot-starter-security' }] },
      integrations: [],
    });
    assert.deepEqual(validateOverlayManifest(spring, { capability: 'auth', target: 'spring' }), []);
    const npm = validateOverlayManifest(validManifest({ target: 'spring', dependencies: { dependencies: { evil: '1.0.0' } } }), { capability: 'auth', target: 'spring' });
    assert.ok(npm.some((issue) => /not supported for maven/.test(issue)));
  });

  it('renders Spring modules without patching the application entrypoint', () => {
    const output = renderSpringComposition([
      { kind: 'spring.module', importPath: 'com.example.AuthConfiguration', symbol: 'AuthConfiguration' },
      { kind: 'spring.module', importPath: 'com.example.SecurityConfiguration', symbol: 'SecurityConfiguration' },
    ]);
    assert.match(output, /@Import\(\{/);
    assert.match(output, /AuthConfiguration\.class/);
    assert.match(output, /SecurityConfiguration\.class/);
    assert.match(output, /CapabilityConfiguration/);
  });
  it('rejects a malformed overlay', () => {
    const issues = validateOverlayManifest({ schemaVersion: '2', capability: 'nope', files: 'x' });
    assert.ok(issues.some((issue) => /schemaVersion/.test(issue)));
    assert.ok(issues.some((issue) => /capability is not registered/.test(issue)));
    assert.ok(issues.some((issue) => /files must be an array/.test(issue)));
  });
  it('rejects unknown top-level operations', () => {
    const issues = validateOverlayManifest(validManifest({ hooks: [['sh', '-c', 'evil']] }));
    assert.ok(issues.some((issue) => /unknown property: hooks/.test(issue)));
  });
  it('rejects unknown integration kinds', () => {
    const issues = validateOverlayManifest(validManifest({
      integrations: [{ kind: 'nestjs.exec-script', importPath: 'x', symbol: 'X' }],
    }));
    assert.ok(issues.some((issue) => /kind is unknown/.test(issue)));
  });
  it('rejects integrations of another target', () => {
    const issues = validateOverlayManifest(validManifest({
      integrations: [{ kind: 'nextjs.provider', importPath: 'x', symbol: 'X' }],
    }));
    assert.ok(issues.some((issue) => /kind is unknown for nestjs/.test(issue)));
  });
  it('rejects unsafe file paths and local dependency specs', () => {
    const issues = validateOverlayManifest(validManifest({
      files: [{ source: 'files/../secret', destination: '../outside' }],
      dependencies: { dependencies: { evil: 'file:../..' } },
    }));
    assert.ok(issues.some((issue) => /source must be a relative path under files\//.test(issue)));
    assert.ok(issues.some((issue) => /destination must be a safe relative path/.test(issue)));
    assert.ok(issues.some((issue) => /must not use local paths/.test(issue)));
  });
});

describe('capability dependencies', () => {
  it('resolves base before auth and requires base', () => {
    assert.deepEqual(validateCapabilityDependencies(['base', 'auth']), []);
    assert.match(validateCapabilityDependencies(['auth']).join(' '), /base is mandatory/);
  });
});

describe('overlay application', () => {
  it('copies files, merges dependencies and appends environment', async () => {
    const repoRoot = await fixtureRepo(validManifest());
    const output = await fixtureOutput();
    const result = await applyCapabilityOverlays(applyArguments(repoRoot, output));

    assert.equal(await readFile(join(output, 'apps/api/src/auth/auth.module.ts'), 'utf8'), 'export const AUTH = true;\n');
    const packageJson = JSON.parse(await readFile(join(output, 'apps/api/package.json'), 'utf8'));
    assert.equal(packageJson.dependencies['@nestjs/jwt'], '^11.0.2');
    // mergeDependencies must not delete a lockfile: the generator handles the
    // unified-workspace lock centrally. The fixture's per-app lock is untouched here.
    assert.equal(await readFile(join(output, 'apps/api/package-lock.json'), 'utf8'), '{}\n');
    const env = await readFile(join(output, 'apps/api/.env.example'), 'utf8');
    assert.match(env, /auth capability \(generated by Enistere Factory\)/);
    assert.match(env, /JWT_ACCESS_SECRET=change-me/);
    const composition = await readFile(join(output, 'apps/api/src/composition/capabilities.ts'), 'utf8');
    assert.match(composition, /GENERATED BY ENISTERE FACTORY/);
    assert.match(composition, /AuthModule,/);
    assert.deepEqual(result.verification, { api: [['npm', 'test']] });
    assert.equal(result.applied.length, 1);
    assert.match(result.applied[0].digest, /^[0-9a-f]{64}$/);
  });

  it('fails on an undeclared file conflict', async () => {
    const repoRoot = await fixtureRepo(validManifest());
    const output = await fixtureOutput();
    await mkdir(join(output, 'apps/api/src/auth'), { recursive: true });
    await writeFile(join(output, 'apps/api/src/auth/auth.module.ts'), 'baseline\n');
    await assert.rejects(
      applyCapabilityOverlays(applyArguments(repoRoot, output)),
      /undeclared file conflict at src\/auth\/auth.module.ts/,
    );
  });

  it('fails on a dependency version conflict', async () => {
    const repoRoot = await fixtureRepo(validManifest({
      dependencies: { dependencies: { '@nestjs/common': '^12.0.0' } },
    }));
    const output = await fixtureOutput();
    await assert.rejects(
      applyCapabilityOverlays(applyArguments(repoRoot, output)),
      /dependency conflict on @nestjs\/common/,
    );
  });

  it('produces a deterministic digest that tracks the payload', async () => {
    const repoRoot = await fixtureRepo(validManifest());
    const overlay = await loadOverlay(repoRoot, 'auth', 'nestjs');
    const first = await computeOverlayDigest(overlay);
    const second = await computeOverlayDigest(overlay);
    assert.equal(first, second);

    const changedRoot = await fixtureRepo(validManifest(), { payload: 'export const AUTH = false;\n' });
    const changed = await computeOverlayDigest(await loadOverlay(changedRoot, 'auth', 'nestjs'));
    assert.notEqual(first, changed);
  });
});

describe('modular generation plan', () => {
  it('keeps baseline-copy for bundled starters', () => {
    const plan = buildGenerationPlan(createDefaultBlueprint(), { modularStarters: ['nestjs', 'nextjs', 'react-native'] });
    assert.equal(plan.generationMode, 'baseline-copy');
    assert.equal(plan.bundledFeaturesMayExceedSelection, true);
  });
  it('switches to modular-overlay when every selected starter is modular', () => {
    const blueprint = createDefaultBlueprint('modular-app');
    blueprint.stack = { api: 'nestjs', web: 'nextjs', mobile: 'react-native' };
    const plan = buildGenerationPlan(blueprint, { modularStarters: ['nestjs', 'nextjs', 'react-native'] });
    assert.equal(plan.generationMode, 'modular-overlay');
    assert.equal(plan.bundledFeaturesMayExceedSelection, false);
  });
});

describe('capability refusals', () => {
  it('requires RBAC before composing the full Files capability', async () => {
    const root = await mkdtemp(join(tmpdir(), 'enistere-refusal-'));
    const blueprint = createDefaultBlueprint('refused-app');
    blueprint.stack = { api: 'nestjs', web: 'nextjs', mobile: 'react-native' };
    blueprint.capabilities = ['base', 'auth', 'files'];
    await assert.rejects(
      generateProject(blueprint, join(root, 'project'), { materialize: false }),
      /files requires rbac/,
    );
  });
  it('composes Files on the TypeScript vertical when RBAC is selected', async () => {
    const root = await mkdtemp(join(tmpdir(), 'enistere-files-ready-'));
    const blueprint = createDefaultBlueprint('files-ready-app');
    blueprint.stack = { api: 'nestjs', web: 'nextjs', mobile: 'react-native' };
    blueprint.capabilities = ['base', 'auth', 'rbac', 'files'];
    await generateProject(blueprint, join(root, 'project'), { materialize: false });
  });
  it('refuses rbac on a target where it is only planned', async () => {
    const root = await mkdtemp(join(tmpdir(), 'enistere-refusal-'));
    const blueprint = createDefaultBlueprint('rbac-planned-app');
    blueprint.stack = { api: 'spring', web: null, mobile: null };
    blueprint.capabilities = ['base', 'auth', 'rbac'];
    await assert.rejects(
      generateProject(blueprint, join(root, 'project'), { materialize: false }),
      /(auth|rbac) on spring is planned/,
    );
  });
  it('refuses auth on Angular while that target is planned', async () => {
    const root = await mkdtemp(join(tmpdir(), 'enistere-refusal-'));
    const blueprint = createDefaultBlueprint('blocked-app');
    blueprint.stack = { api: 'nestjs', web: 'angular', mobile: null };
    blueprint.capabilities = ['base', 'auth'];
    await assert.rejects(
      generateProject(blueprint, join(root, 'project'), { materialize: false }),
      /auth on angular is planned/,
    );
  });
});
