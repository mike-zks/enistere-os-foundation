import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { buildCapabilityMatrix, loadCapabilityManifests } from '../engine/capabilities.mjs';
import { getTargetAdapter } from '../engine/target-adapters.mjs';
import { loadStarterManifests, STARTER_IDS, validateManifestConsistency, validateStarterManifest } from '../engine/starters.mjs';
import {
  mergePubspecSection,
  mergeRequirementsLock,
  validatePythonDependencies,
} from '../engine/overlay.mjs';

const root = resolve(import.meta.dirname, '../..');

it('loads seven independent starters with Platform Baseline v2 contracts', async () => {
  const manifests = await loadStarterManifests(root);
  assert.deepEqual(manifests.map((item) => item.id), STARTER_IDS);
  assert.ok(manifests.every((item) => item.schemaVersion === '2'));
  assert.ok(manifests.every((item) => item.baseline.contractVersion === '2.0.0'));
  assert.ok(manifests.every((item) => item.baseline.familyContract === `${item.kind}/2.0.0`));
  assert.ok(manifests.every((item) => item.composition.base === undefined));
  assert.ok(manifests.every((item) => item.composition.baseSource === undefined));
  const modular = manifests.filter((item) => item.composition.model === 'modular');
  assert.deepEqual(modular.map((item) => item.id), ['nestjs', 'spring', 'fastapi', 'nextjs', 'angular', 'react-native', 'flutter']);
  assert.ok(modular.every((item) => item.composition.readyCapabilities.length === 0 || item.composition.readyCapabilities.includes('auth')));
  assert.ok(manifests.filter((item) => item.composition.model !== 'modular').every((item) => item.composition.readyCapabilities.length === 0));
  assert.equal(manifests.filter((item) => item.kind === 'api').length, 3);
  assert.equal(manifests.filter((item) => item.kind === 'web').length, 2);
  assert.equal(manifests.filter((item) => item.kind === 'mobile').length, 2);
});

it('cross-validates starter and capability declarations', async () => {
  const starters = await loadStarterManifests(root);
  const capabilities = await loadCapabilityManifests(root);
  assert.deepEqual(validateManifestConsistency(starters, capabilities), []);
});

it('rejects the legacy capability-style base classification', async () => {
  const [manifest] = await loadStarterManifests(root);
  const legacy = structuredClone(manifest);
  legacy.composition.base = 'built-in';
  assert.ok(validateStarterManifest(legacy).some((issue) => issue.includes('composition.base is forbidden')));
});

it('rejects the legacy baseSource indirection', async () => {
  const [manifest] = await loadStarterManifests(root);
  const legacy = structuredClone(manifest);
  legacy.composition.baseSource = `starters/${manifest.id}/base`;
  assert.ok(validateStarterManifest(legacy).some(
    (issue) => issue.includes('composition.baseSource is forbidden'),
  ));
});

it('reports a truthful target support matrix', async () => {
  const matrix = buildCapabilityMatrix(await loadCapabilityManifests(root));
  assert.equal(matrix.auth.nextjs, 'ready');
  assert.equal(matrix.auth.spring, 'ready');
  assert.equal(matrix.rbac.nestjs, 'ready');
  assert.equal(matrix.rbac.nextjs, 'ready');
  assert.equal(matrix.rbac['react-native'], 'not-applicable');
  assert.equal(matrix.rbac.spring, 'ready');
  assert.equal(matrix.files.nestjs, 'ready');
  assert.equal(matrix.files.nextjs, 'ready');
  assert.equal(matrix.files['react-native'], 'ready');
  assert.equal(matrix.files.spring, 'ready');
  // Mobile family parity: both runtimes hold Authentication, neither is planned.
  assert.equal(matrix.auth['react-native'], 'ready');
  assert.equal(matrix.auth.flutter, 'ready');
});

describe('Angular composition seams', () => {
  it('lets a capability contribute providers, routes and interceptors', () => {
    const angular = getTargetAdapter('angular');
    // Angular was a declared target with an empty adapter: no integration kind,
    // no composition. That is why no capability could target it at all — the
    // gap ADR-074 measured was a missing seam, not missing capability code.
    assert.deepEqual(
      Object.keys(angular.integrationKinds).sort(),
      ['angular.http-interceptor', 'angular.provider', 'angular.route'],
    );
    assert.deepEqual(
      angular.composition.map((entry) => entry.destination),
      [
        'src/app/core/composition/capability-providers.ts',
        'src/app/core/composition/capability-routes.ts',
        'src/app/core/composition/capability-interceptors.ts',
      ],
    );
  });

  it('requires a contributed provider to be one value, not an array', async () => {
    // The composition file lists each symbol as ONE element of
    // `readonly (Provider | EnvironmentProviders)[]`. A capability exporting an
    // array does not type-check there — and Karma never noticed, because only
    // `ng build` compiles app.config.ts. `makeEnvironmentProviders` is Angular's
    // supported way to bundle any number of providers behind a single value.
    const source = await readFile(
      resolve(root, 'capabilities/auth/targets/angular/files/src/app/core/auth/auth.providers.ts'),
      'utf8',
    );
    assert.match(source, /AUTH_PROVIDERS: EnvironmentProviders = makeEnvironmentProviders\(/);
    assert.doesNotMatch(source, /AUTH_PROVIDERS:\s*readonly/);
  });

  it('orders contributed routes deterministically and refuses a collision', () => {
    const render = getTargetAdapter('angular').composition
      .find((entry) => entry.kinds.includes('angular.route')).render;

    const output = render([
      { kind: 'angular.route', path: 'z', importPath: './z', symbol: 'Z', title: 'Z', order: 2 },
      { kind: 'angular.route', path: 'a', importPath: './a', symbol: 'A', title: 'A', order: 1 },
    ]);
    // Two capabilities resolved in either order must yield the same file.
    assert.ok(output.indexOf("path: 'a'") < output.indexOf("path: 'z'"));

    assert.throws(
      () => render([
        { kind: 'angular.route', path: 'same', importPath: './a', symbol: 'A', order: 1 },
        { kind: 'angular.route', path: 'same', importPath: './b', symbol: 'B', order: 2 },
      ]),
      /two capabilities contribute the Angular route "same"/,
    );
  });

  it('keeps the baseline seams empty and consumed by the app', async () => {
    const seams = resolve(root, 'starters/angular/src/app');
    for (const seam of ['capability-providers', 'capability-routes', 'capability-interceptors']) {
      const source = await readFile(join(seams, 'core/composition', `${seam}.ts`), 'utf8');
      assert.match(source, /\[\]/, `${seam} must ship empty`);
    }
    // A seam nothing consumes is decorative: assert the app actually wires them.
    const config = await readFile(join(seams, 'app.config.ts'), 'utf8');
    assert.match(config, /CAPABILITY_INTERCEPTORS/);
    assert.match(config, /CAPABILITY_PROVIDERS/);
    const routes = await readFile(join(seams, 'app.routes.ts'), 'utf8');
    assert.match(routes, /CAPABILITY_ROUTES/);
  });
});

describe('Flutter composition seams', () => {
  it('lets a capability contribute overrides, routes and interceptors', () => {
    const flutter = getTargetAdapter('flutter');
    // Same missing-seam gap as Angular, and the same remedy: the three points
    // where a Riverpod app can be extended without a capability editing the
    // baseline — provider overrides, routes, Dio interceptors.
    assert.deepEqual(
      Object.keys(flutter.integrationKinds).sort(),
      ['flutter.interceptor', 'flutter.provider-override', 'flutter.route'],
    );
    assert.deepEqual(
      flutter.composition.map((entry) => entry.destination),
      [
        'lib/src/core/composition/capability_overrides.dart',
        'lib/src/core/composition/capability_routes.dart',
        'lib/src/core/composition/capability_interceptors.dart',
      ],
    );
  });

  it('orders contributed routes deterministically and refuses a collision', () => {
    const render = getTargetAdapter('flutter').composition
      .find((entry) => entry.kinds.includes('flutter.route')).render;

    const output = render([
      { kind: 'flutter.route', path: '/z', name: 'z', importPath: 'p:z', symbol: 'Z', order: 2 },
      { kind: 'flutter.route', path: '/a', name: 'a', importPath: 'p:a', symbol: 'A', order: 1 },
    ]);
    assert.ok(output.indexOf("path: '/a'") < output.indexOf("path: '/z'"));

    assert.throws(
      () => render([
        { kind: 'flutter.route', path: '/same', name: 'a', importPath: 'p:a', symbol: 'A', order: 1 },
        { kind: 'flutter.route', path: '/same', name: 'b', importPath: 'p:b', symbol: 'B', order: 2 },
      ]),
      /two capabilities contribute the Flutter route "\/same"/,
    );
  });

  it('appends contributed interceptors after the baseline ones', () => {
    const render = getTargetAdapter('flutter').composition
      .find((entry) => entry.kinds.includes('flutter.interceptor')).render;
    const output = render([
      { kind: 'flutter.interceptor', importPath: 'p:b', symbol: 'b', order: 2 },
      { kind: 'flutter.interceptor', importPath: 'p:a', symbol: 'a', order: 1 },
    ]);
    assert.ok(output.indexOf('  a,') < output.indexOf('  b,'));
    // The factory receives the Ref: an interceptor that must read a credential
    // has no other way to reach it without the capability owning the client.
    assert.match(output, /typedef CapabilityInterceptorFactory = Interceptor Function\(Ref ref\);/);
  });

  it('keeps the baseline seams empty and consumed by the app', async () => {
    const lib = resolve(root, 'starters/flutter/lib');
    for (const seam of ['capability_overrides', 'capability_routes', 'capability_interceptors']) {
      const source = await readFile(join(lib, 'src/core/composition', `${seam}.dart`), 'utf8');
      assert.match(source, /\[\];/, `${seam} must ship empty`);
    }
    const main = await readFile(join(lib, 'main.dart'), 'utf8');
    assert.match(main, /ProviderScope\(\s*overrides: capabilityOverrides/);
    const router = await readFile(join(lib, 'src/core/navigation/router.dart'), 'utf8');
    assert.match(router, /\.\.\.capabilityRoutes/);
    const dio = await readFile(join(lib, 'src/core/api/dio_provider.dart'), 'utf8');
    assert.match(dio, /capabilityInterceptors/);
  });

  it('composes capability interceptors before the terminal error mapping', async () => {
    const lib = resolve(root, 'starters/flutter/lib');
    const client = await readFile(join(lib, 'src/core/api/dio_client.dart'), 'utf8');
    const logging = client.indexOf('LoggingInterceptor');
    const contributed = client.indexOf('...capabilityInterceptors');
    const mapping = client.indexOf('ErrorInterceptor()');
    // ErrorInterceptor calls handler.reject, which ends the chain: an interceptor
    // composed after it would never observe a 401 and could never recover.
    assert.ok(logging < contributed && contributed < mapping);
  });

  it('exposes the router as a provider so a guard can ask something', async () => {
    const router = await readFile(
      resolve(root, 'starters/flutter/lib/src/core/navigation/router.dart'), 'utf8',
    );
    assert.match(router, /final routerProvider = Provider<GoRouter>/);
  });
});

describe('pubspec dependency merging', () => {
  const pubspec = [
    'name: mobile_flutter', '', 'dependencies:', '  flutter:', '    sdk: flutter',
    '  dio: ^5.10.0', '', 'dev_dependencies:', '  flutter_test:', '    sdk: flutter',
    '', 'flutter:', '  uses-material-design: true', '',
  ].join('\n');

  it('adds constraints to the right block, sorted, without touching the rest', () => {
    const merged = mergePubspecSection(
      pubspec, 'dependencies', { flutter_secure_storage: '^9.2.2', collection: '^1.19.0' }, 'auth/flutter',
    );
    // Sorted so two capabilities resolved in either order produce the same file.
    assert.ok(merged.indexOf('collection:') < merged.indexOf('flutter_secure_storage:'));
    // The insertion stops at the next top-level key: dev_dependencies and the
    // flutter section are untouched, and so is the blank line separating them.
    assert.match(merged, /  flutter_secure_storage: \^9\.2\.2\n\ndev_dependencies:/);
    assert.match(merged, /\nflutter:\n  uses-material-design: true/);
  });

  it('is a no-op on an identical constraint and refuses a conflicting one', () => {
    assert.equal(mergePubspecSection(pubspec, 'dependencies', { dio: '^5.10.0' }, 'x'), pubspec);
    assert.throws(
      () => mergePubspecSection(pubspec, 'dependencies', { dio: '^4.0.0' }, 'auth/flutter'),
      /auth\/flutter: dependency conflict on dio \(\^5\.10\.0 vs \^4\.0\.0\)/,
    );
  });

  it('refuses to invent a section that the pubspec does not declare', () => {
    assert.throws(
      () => mergePubspecSection('name: x\n', 'dependencies', { dio: '^5.10.0' }, 'auth/flutter'),
      /pubspec\.yaml has no dependencies section/,
    );
  });

  it('routes Flutter overlays to pub rather than to npm', () => {
    // Without this the adapter would default to npm and write a package.json
    // into a Dart application.
    assert.equal(getTargetAdapter('flutter').dependencyManager, 'pub');
  });
});

describe('FastAPI composition seams', () => {
  it('lets a capability contribute routers and lifespan hooks', () => {
    const fastapi = getTargetAdapter('fastapi');
    // Third runtime with the same missing-seam gap as Angular and Flutter.
    assert.deepEqual(
      Object.keys(fastapi.integrationKinds).sort(),
      ['fastapi.lifespan', 'fastapi.router'],
    );
    assert.deepEqual(
      fastapi.composition.map((entry) => entry.destination),
      ['app/composition/capability_routers.py', 'app/composition/capability_lifespan.py'],
    );
  });

  it('orders contributed routers and hooks deterministically', () => {
    const { composition } = getTargetAdapter('fastapi');
    for (const kind of ['fastapi.router', 'fastapi.lifespan']) {
      const render = composition.find((entry) => entry.kinds.includes(kind)).render;
      const output = render([
        { kind, importPath: 'app.z', symbol: 'z_thing', order: 2 },
        { kind, importPath: 'app.a', symbol: 'a_thing', order: 1 },
      ]);
      assert.ok(output.indexOf('    a_thing,') < output.indexOf('    z_thing,'));
    }
  });

  it('keeps the baseline seams empty and consumed by the app', async () => {
    const app = resolve(root, 'starters/fastapi/app');
    const routers = await readFile(join(app, 'composition/capability_routers.py'), 'utf8');
    assert.match(routers, /CAPABILITY_ROUTERS: tuple\[APIRouter, \.\.\.\] = \(\)/);
    const lifespans = await readFile(join(app, 'composition/capability_lifespan.py'), 'utf8');
    assert.match(lifespans, /CAPABILITY_LIFESPANS: tuple\[CapabilityLifespan, \.\.\.\] = \(\)/);

    // A seam nothing consumes is decorative.
    const main = await readFile(join(app, 'main.py'), 'utf8');
    assert.match(main, /for capability_router in CAPABILITY_ROUTERS:/);
    const platform = await readFile(join(app, 'platform.py'), 'utf8');
    // AsyncExitStack, not a plain loop: a hook that fails to start must not leave
    // the ones already entered open.
    assert.match(platform, /async with AsyncExitStack\(\) as stack:/);
    assert.match(platform, /for hook in CAPABILITY_LIFESPANS:/);
  });
});

describe('python lock merging', () => {
  // Sorted case-insensitively, exactly like the baseline locks.
  const lock = 'fastapi==0.139.2\ntyping_extensions==4.16.0\nuvicorn==0.51.0\n';

  it('requires a pinned transitive closure with its two subsets', () => {
    assert.deepEqual(
      validatePythonDependencies({ all: ['a==1', 'b==2'], runtime: ['a==1'], direct: ['a==1'] }),
      [],
    );
    // The starter installs from a lock: a range would resolve differently later.
    assert.deepEqual(
      validatePythonDependencies({ all: ['a>=1'], runtime: ['a>=1'], direct: ['a>=1'] }),
      [
        'dependencies.python.all entry is not a pinned requirement: a>=1',
        'dependencies.python.runtime entry is not a pinned requirement: a>=1',
        'dependencies.python.direct entry is not a pinned requirement: a>=1',
      ],
    );
    assert.deepEqual(
      validatePythonDependencies({ all: ['a==1'], runtime: ['c==3'], direct: ['a==1'] }),
      ['dependencies.python.runtime c==3 is missing from dependencies.python.all'],
    );
  });

  it('inserts pins sorted like the baseline locks', () => {
    const merged = mergeRequirementsLock(lock, ['SQLAlchemy==2.0.44', 'alembic==1.18.1'], 'x');
    // Case-insensitive, so `SQLAlchemy` lands between `fastapi` and
    // `typing_extensions` rather than ahead of every lowercase name.
    assert.equal(
      merged,
      'alembic==1.18.1\nfastapi==0.139.2\nSQLAlchemy==2.0.44\ntyping_extensions==4.16.0\nuvicorn==0.51.0\n',
    );
  });

  it('normalises package names the way PEP 503 does before comparing', () => {
    // `typing_extensions` and `typing-extensions` are one package: comparing the
    // raw strings would let an overlay pin the same distribution twice.
    assert.equal(mergeRequirementsLock(lock, ['typing-extensions==4.16.0'], 'x'), lock);
    assert.throws(
      () => mergeRequirementsLock(lock, ['typing-extensions==4.0.0'], 'auth/fastapi'),
      /auth\/fastapi: dependency conflict on typing-extensions \(4\.16\.0 vs 4\.0\.0\)/,
    );
  });

  it('reproduces the order pip itself produced in the real locks', async () => {
    // Adding nothing must return the file byte for byte. This is what proves the
    // comparator is pip's — sorting by the raw line would reorder
    // `pydantic_core` and `pydantic-settings`, rewriting a lock nobody touched.
    for (const file of ['requirements.lock', 'requirements.runtime.lock']) {
      const current = await readFile(resolve(root, 'starters/fastapi', file), 'utf8');
      assert.equal(mergeRequirementsLock(current, [], 'identity'), current, file);
    }
  });

  it('routes FastAPI overlays to python rather than to npm', () => {
    assert.equal(getTargetAdapter('fastapi').dependencyManager, 'python');
  });
});
