import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, readFile, access } from 'node:fs/promises';
import { constants } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { generateProject } from '../engine/generator.mjs';
import { createDefaultBlueprint } from '../engine/blueprint.mjs';

/**
 * In-repo golden compositions (materialized to a temp dir): proves the Auth
 * overlay composes onto the three modular baselines and leaves each `base`
 * baseline free of any Auth surface. Structural assertions only (absence /
 * presence / lock shape); full install + build of goldens runs out of repo (CI).
 */

async function exists(p) { try { await access(p, constants.F_OK); return true; } catch { return false; } }

function blueprint(slug, stack, caps) {
  const b = createDefaultBlueprint(slug);
  b.stack = stack;
  b.capabilities = caps;
  b.designSystem = true;
  b.deployment = { environments: ['local'] };
  return b;
}

describe('auth golden compositions', () => {
  let root;
  before(async () => { root = await mkdtemp(join(tmpdir(), 'enistere-goldens-')); });
  after(async () => { if (root) await rm(root, { recursive: true, force: true }); });

  async function gen(slug, stack, caps) {
    const out = resolve(root, slug);
    await generateProject(blueprint(slug, stack, caps), out, {});
    return out;
  }

  it('NestJS base carries no Auth surface', async () => {
    const out = await gen('nestjs-base', { api: 'nestjs', web: null, mobile: null }, ['base']);
    assert.equal(await exists(join(out, 'apps/api/src/auth')), false, 'src/auth must be absent');
    assert.equal(await exists(join(out, 'apps/api/src/users')), false, 'src/users must be absent');
    const appModule = await readFile(join(out, 'apps/api/src/app.module.ts'), 'utf8');
    assert.ok(!/AuthModule/.test(appModule), 'app.module must not reference AuthModule');
    const comp = await readFile(join(out, 'apps/api/src/composition/capabilities.ts'), 'utf8');
    assert.match(comp, /CAPABILITY_MODULES[^=]*=\s*\[\]/);
    const pkg = JSON.parse(await readFile(join(out, 'apps/api/package.json'), 'utf8'));
    for (const dep of ['@nestjs/jwt', '@nestjs/passport', '@node-rs/argon2', 'passport', 'passport-jwt']) {
      assert.ok(!pkg.dependencies[dep], `${dep} must not be a base dependency`);
    }
    const schema = await readFile(join(out, 'apps/api/prisma/schema.prisma'), 'utf8');
    assert.ok(!/model User \{/.test(schema), 'prisma must not define User in base');
    const lock = JSON.parse(await readFile(join(out, 'enistere.lock'), 'utf8'));
    assert.equal(lock.plan.generationMode, 'modular-overlay');
    assert.equal(lock.plan.bundledFeaturesMayExceedSelection, false);
    assert.deepEqual(lock.overlays, []);
  });

  it('Spring base carries only the minimal base API surface', async () => {
    const out = await gen('spring-base', { api: 'spring', web: null, mobile: null }, ['base']);
    const pom = await readFile(join(out, 'apps/api/pom.xml'), 'utf8');
    for (const dependency of ['spring-boot-starter-security', 'spring-boot-starter-data-jpa', 'flyway-core', 'minio', 'jjwt']) {
      assert.ok(!pom.includes(dependency), `${dependency} must not be a base dependency`);
    }
    assert.equal(await exists(join(out, 'apps/api/src/main/modules')), false, 'feature modules must be absent');
    assert.equal(await exists(join(out, 'apps/api/src/main/resources/db')), false, 'database migrations must be absent');
    const lock = JSON.parse(await readFile(join(out, 'enistere.lock'), 'utf8'));
    assert.equal(lock.plan.generationMode, 'modular-overlay');
    assert.equal(lock.plan.bundledFeaturesMayExceedSelection, false);
    assert.deepEqual(lock.overlays, []);
  });

  it('NestJS base+auth composes Auth without RBAC or Files', async () => {
    const out = await gen('nestjs-auth', { api: 'nestjs', web: null, mobile: null }, ['base', 'auth']);
    assert.ok(await exists(join(out, 'apps/api/src/auth/auth.module.ts')));
    assert.ok(await exists(join(out, 'apps/api/src/users/users.service.ts')));
    const authModule = await readFile(join(out, 'apps/api/src/auth/auth.module.ts'), 'utf8');
    assert.ok(!/AuthorizationModule|RolesModule|PermissionsModule/.test(authModule), 'Auth must not depend on RBAC');
    const comp = await readFile(join(out, 'apps/api/src/composition/capabilities.ts'), 'utf8');
    assert.match(comp, /AuthModule/);
    assert.match(comp, /JwtAuthGuard/);
    assert.match(comp, /'login'/);
    assert.match(comp, /'refresh'/);
    const pkg = JSON.parse(await readFile(join(out, 'apps/api/package.json'), 'utf8'));
    for (const dep of ['@nestjs/jwt', '@nestjs/passport', '@node-rs/argon2']) assert.ok(pkg.dependencies[dep]);
    const schema = await readFile(join(out, 'apps/api/prisma/schema.prisma'), 'utf8');
    assert.match(schema, /model User \{/);
    assert.match(schema, /model RefreshSession \{/);
    assert.ok(await exists(join(out, 'apps/api/prisma/migrations/20260718000100_auth_init/migration.sql')));
    assert.equal(await exists(join(out, 'apps/api/src/roles')), false, 'no RBAC');
    assert.equal(await exists(join(out, 'apps/api/src/permissions')), false, 'no RBAC');
    assert.equal(await exists(join(out, 'apps/api/src/files')), false, 'no Files');
    const lock = JSON.parse(await readFile(join(out, 'enistere.lock'), 'utf8'));
    assert.equal(lock.overlays.length, 1);
    assert.match(lock.overlays[0].digest, /^[0-9a-f]{64}$/);
  });

  it('NestJS + Next.js base carries no web Auth surface', async () => {
    const out = await gen('nest-next-base', { api: 'nestjs', web: 'nextjs', mobile: null }, ['base']);
    assert.equal(await exists(join(out, 'apps/web/src/core/auth')), false);
    assert.equal(await exists(join(out, 'apps/web/src/app/login')), false);
    assert.equal(await exists(join(out, 'apps/web/src/app/(protected)')), false);
    assert.equal(await exists(join(out, 'apps/web/src/app/api/auth')), false);
    const nav = await readFile(join(out, 'apps/web/src/core/composition/public-nav.ts'), 'utf8');
    assert.match(nav, /CAPABILITY_PUBLIC_NAV_LINKS[^=]*=\s*\[\]/);
    const pkg = JSON.parse(await readFile(join(out, 'apps/web/package.json'), 'utf8'));
    for (const dep of ['zod', 'react-hook-form', '@hookform/resolvers']) assert.ok(!pkg.dependencies[dep]);
  });

  it('NestJS + Next.js base+auth composes web Auth without Files', async () => {
    const out = await gen('nest-next-auth', { api: 'nestjs', web: 'nextjs', mobile: null }, ['base', 'auth']);
    assert.ok(await exists(join(out, 'apps/web/src/core/auth/session-state.ts')));
    assert.ok(await exists(join(out, 'apps/web/src/app/login/page.tsx')));
    assert.ok(await exists(join(out, 'apps/web/src/app/(protected)/layout.tsx')));
    assert.ok(await exists(join(out, 'apps/web/src/app/api/auth/login/route.ts')));
    const nav = await readFile(join(out, 'apps/web/src/core/composition/public-nav.ts'), 'utf8');
    assert.match(nav, /\/login/);
    const env = await readFile(join(out, 'apps/web/.env.example'), 'utf8');
    assert.match(env, /WEB_ALLOWED_ORIGINS=/);
    assert.equal(await exists(join(out, 'apps/web/src/core/files')), false);
    assert.equal(await exists(join(out, 'apps/web/src/app/api/files')), false);
    assert.ok(await exists(join(out, 'apps/api/src/auth/auth.module.ts')));
  });

  it('NestJS + Next.js + React Native base carries no mobile Auth surface', async () => {
    const out = await gen('triple-base', { api: 'nestjs', web: 'nextjs', mobile: 'react-native' }, ['base']);
    assert.equal(await exists(join(out, 'apps/mobile/src/auth')), false);
    assert.equal(await exists(join(out, 'apps/mobile/app/(app)')), false);
    assert.equal(await exists(join(out, 'apps/mobile/app/(public)')), false);
    const layout = await readFile(join(out, 'apps/mobile/app/_layout.tsx'), 'utf8');
    assert.ok(!/from '@\/auth'/.test(layout) && !/<AuthProvider/.test(layout));
    const capProv = await readFile(join(out, 'apps/mobile/src/composition/capability-providers.tsx'), 'utf8');
    assert.match(capProv, /return <>\{children\}<\/>/);
    const pkg = JSON.parse(await readFile(join(out, 'apps/mobile/package.json'), 'utf8'));
    for (const dep of ['expo-secure-store', 'zod', 'react-hook-form', '@hookform/resolvers']) assert.ok(!pkg.dependencies[dep]);
  });

  it('NestJS + Next.js + React Native base+auth composes mobile Auth without Files/telemetry business surface', async () => {
    const out = await gen('triple-auth', { api: 'nestjs', web: 'nextjs', mobile: 'react-native' }, ['base', 'auth']);
    assert.ok(await exists(join(out, 'apps/mobile/src/auth/auth-engine.ts')));
    assert.ok(await exists(join(out, 'apps/mobile/src/auth/AuthProvider.tsx')));
    assert.ok(await exists(join(out, 'apps/mobile/app/(app)/home.tsx')));
    assert.ok(await exists(join(out, 'apps/mobile/app/(public)/sign-in.tsx')));
    assert.ok(await exists(join(out, 'apps/mobile/src/api/with-auth-retry.ts')), '401 bridge present');
    assert.ok(await exists(join(out, 'apps/mobile/src/storage/expo-secure-storage.ts')), 'SecureStore seam present');
    const capProv = await readFile(join(out, 'apps/mobile/src/composition/capability-providers.tsx'), 'utf8');
    assert.match(capProv, /AuthProvider/);
    const pkg = JSON.parse(await readFile(join(out, 'apps/mobile/package.json'), 'utf8'));
    assert.ok(pkg.dependencies['expo-secure-store']);
    assert.equal(await exists(join(out, 'apps/mobile/src/upload')), false, 'no Files upload');
    assert.equal(await exists(join(out, 'apps/mobile/app/(app)/upload.tsx')), false, 'no Files upload route');
    const lock = JSON.parse(await readFile(join(out, 'enistere.lock'), 'utf8'));
    assert.equal(lock.overlays.length, 3);
    assert.ok(lock.overlays.every((o) => o.capability === 'auth'));
    assert.equal(lock.plan.generationMode, 'modular-overlay');
  });
});
