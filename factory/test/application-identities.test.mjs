import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { access, mkdtemp, readFile, readdir } from 'node:fs/promises';
import { constants } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { createDefaultBlueprint } from '../engine/blueprint.mjs';
import { generateProject } from '../engine/generator.mjs';
import {
  deriveApplicationIdentity,
  withApplicationIdentities,
} from '../model/application-identity.mjs';

async function exists(path) {
  try { await access(path, constants.F_OK); return true; } catch { return false; }
}

async function textFiles(root, extensions) {
  const files = [];
  const walk = async (directory) => {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const path = join(directory, entry.name);
      if (entry.isDirectory()) await walk(path);
      else if (extensions.some((extension) => entry.name.endsWith(extension))) files.push(path);
    }
  };
  await walk(root);
  return Promise.all(files.map((path) => readFile(path, 'utf8')));
}

function blueprint(stack, capabilities = []) {
  const value = createDefaultBlueprint('acme-vision');
  value.project.name = 'Acme Vision';
  value.stack = stack;
  value.capabilities = capabilities;
  return value;
}

describe('CSM-derived application identities', () => {
  it('normalizes reserved words, bounds machine ids and rejects collisions', () => {
    const identity = deriveApplicationIdentity({
      project: 'class-2fa',
      displayName: 'A'.repeat(100),
      application: { id: 'record-1', kind: 'api', runtime: 'spring' },
    });
    assert.equal(identity.maven.groupId, 'app.xclass.x2fa');
    assert.equal(identity.maven.packageName, 'app.xclass.x2fa.xrecord.x1');
    assert.match(identity.maven.mainClass, /^ClassX2faRecordX1Application$/u);

    const long = deriveApplicationIdentity({
      project: `a${'b'.repeat(62)}`,
      displayName: 'Long',
      application: { id: `c${'d'.repeat(62)}`, kind: 'mobile', runtime: 'flutter' },
    });
    assert.ok(long.canonical.length <= 63);
    assert.ok(long.dart.packageName.length <= 64);
    assert.match(long.canonical, /-[a-f0-9]{10}$/u);
    assert.throws(() => withApplicationIdentities({
      project: 'duplicate',
      displayName: 'Duplicate',
      applications: [
        { id: 'api', kind: 'api', runtime: 'nestjs' },
        { id: 'api', kind: 'api', runtime: 'spring' },
      ],
    }), /identity collision/u);
  });

  it('materializes each runtime identity in its executable coordinates', async () => {
    const root = await mkdtemp(join(tmpdir(), 'enistere-identities-'));
    const cases = [
      ['nestjs', { api: 'nestjs', web: null, mobile: null }],
      ['spring', { api: 'spring', web: null, mobile: null }],
      ['fastapi', { api: 'fastapi', web: null, mobile: null }],
      ['nextjs', { api: 'nestjs', web: 'nextjs', mobile: null }],
      ['angular', { api: 'nestjs', web: 'angular', mobile: null }],
      ['react-native', { api: 'nestjs', web: null, mobile: 'react-native' }],
      ['flutter', { api: 'nestjs', web: null, mobile: 'flutter' }],
    ];
    for (const [name, stack] of cases) await generateProject(blueprint(stack), join(root, name));

    const nest = JSON.parse(await readFile(join(root, 'nestjs/apps/api/package.json'), 'utf8'));
    assert.equal(nest.name, '@acme-vision/api');
    assert.match(await readFile(join(root, 'nestjs/apps/api/src/health/health.controller.ts'), 'utf8'), /acme-vision-api/u);

    assert.match(await readFile(join(root, 'spring/apps/api/pom.xml'), 'utf8'), /<groupId>app\.acme\.vision<\/groupId>[\s\S]*<artifactId>acme-vision-api<\/artifactId>/u);
    const springMain = join(root, 'spring/apps/api/src/main/java/app/acme/vision/api/AcmeVisionApiApplication.java');
    assert.equal(await exists(springMain), true);
    assert.equal(await exists(join(root, 'spring/apps/api/src/main/java/com/enistere/core')), false);

    assert.match(await readFile(join(root, 'fastapi/apps/api/pyproject.toml'), 'utf8'), /name = "acme-vision-api"/u);
    assert.match(await readFile(join(root, 'fastapi/apps/api/app/main.py'), 'utf8'), /Acme Vision — API/u);

    const next = JSON.parse(await readFile(join(root, 'nextjs/apps/web/package.json'), 'utf8'));
    assert.equal(next.name, '@acme-vision/web');
    assert.match(await readFile(join(root, 'nextjs/apps/web/Dockerfile'), 'utf8'), /--workspace=@acme-vision\/web/u);
    assert.match(await readFile(join(root, 'nextjs/apps/web/test/metadata.test.ts'), 'utf8'), /includes\("Acme Vision — Web"\)/u);

    const angular = JSON.parse(await readFile(join(root, 'angular/apps/web/angular.json'), 'utf8'));
    assert.deepEqual(Object.keys(angular.projects), ['acme-vision-web']);
    assert.equal(angular.projects['acme-vision-web'].architect.build.options.outputPath, 'dist/acme-vision-web');

    const expo = JSON.parse(await readFile(join(root, 'react-native/apps/mobile/app.json'), 'utf8')).expo;
    assert.equal(expo.name, 'Acme Vision — Mobile');
    assert.equal(expo.slug, 'acme-vision-mobile');
    assert.equal(expo.android.package, 'app.acme.vision.mobile');
    assert.equal(expo.ios.bundleIdentifier, 'app.acme.vision.mobile');

    assert.match(await readFile(join(root, 'flutter/apps/mobile/pubspec.yaml'), 'utf8'), /^name: acme_vision_mobile$/mu);
    assert.match(await readFile(join(root, 'flutter/apps/mobile/android/app/build.gradle.kts'), 'utf8'), /applicationId = "app\.acme\.vision\.mobile"/u);
    assert.equal(await exists(join(root, 'flutter/apps/mobile/android/app/src/main/kotlin/app/acme/vision/mobile/MainActivity.kt')), true);

    for (const name of cases.map(([runtime]) => runtime)) {
      const record = JSON.parse(await readFile(join(root, name, 'enistere.identity.json'), 'utf8'));
      assert.equal(record.project, 'acme-vision');
      assert.ok(record.applications.every((application) => application.identity.canonical.startsWith('acme-vision-')));
    }
  });

  it('rewrites package and import directives added by Spring and Flutter overlays', async () => {
    const root = await mkdtemp(join(tmpdir(), 'enistere-identity-overlays-'));
    const output = join(root, 'project');
    await generateProject(blueprint({ api: 'spring', web: null, mobile: 'flutter' }, ['auth']), output);
    const java = (await textFiles(join(output, 'apps/api'), ['.java'])).join('\n');
    const dart = (await textFiles(join(output, 'apps/mobile'), ['.dart'])).join('\n');
    assert.doesNotMatch(java, /(?:package|import) com\.enistere\.core/u);
    assert.match(java, /package app\.acme\.vision\.api/u);
    assert.doesNotMatch(dart, /package:mobile_flutter\//u);
    assert.match(dart, /package:acme_vision_mobile\//u);
  });
});
