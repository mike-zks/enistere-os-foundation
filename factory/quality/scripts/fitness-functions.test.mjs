import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { loadStarterManifests } from '../../engine/starters.mjs';
import { loadCapabilityManifests } from '../../engine/capabilities.mjs';
import {
  runFitnessFunctions,
  runPipelineFitnessFunctions,
  ingestionBoundaryFindings,
  staticImports,
  factoryOwnedSources,
  sourceSpecifiers,
  RUNTIME_ZONES,
  REPO_ROOT,
} from './fitness-functions.mjs';

describe('architecture fitness functions', () => {
  it('the real Foundation satisfies all fitness functions', async () => {
    const starters = await loadStarterManifests(REPO_ROOT);
    const capabilities = await loadCapabilityManifests(REPO_ROOT);
    const report = runFitnessFunctions({ starters, capabilities });
    assert.deepEqual(report.findings, []);
    assert.equal(report.passed, true);
  });

  it('keeps every capability out of the zone the Factory owns', async () => {
    const starters = await loadStarterManifests(REPO_ROOT);
    const capabilities = await loadCapabilityManifests(REPO_ROOT);

    // The rule has to bite in both directions, or it proves nothing: an
    // undeclared write into the core zone must fail, and a declaration nobody
    // violates must fail too — a stale exception silently re-authorises the
    // regression it was written for.
    const undeclared = runFitnessFunctions({
      starters,
      capabilities,
      overlays: [['auth', 'angular', { files: [{ destination: 'src/app/core/auth' }] }]],
    });
    assert.ok(undeclared.findings.some(
      (finding) => finding.rule === 'capability-business-zone'
        && finding.detail.includes('src/app/core/auth into the core zone'),
    ));

    const stale = runFitnessFunctions({
      starters,
      capabilities,
      layoutGaps: new Map([
        ['auth/angular', { destinations: ['src/app/core/gone'], deadline: '2999-01-01' }],
      ]),
      overlays: [],
    });
    assert.ok(stale.findings.some(
      (finding) => finding.detail.includes('declares a layout gap that no longer exists'),
    ));

    // And an expired declaration stops excusing anything.
    const expired = runFitnessFunctions({
      starters,
      capabilities,
      layoutGaps: new Map([
        ['auth/angular', { destinations: ['src/app/core/auth'], deadline: '2000-01-01' }],
      ]),
      overlays: [['auth', 'angular', { files: [{ destination: 'src/app/core/auth' }] }]],
    });
    assert.ok(expired.findings.some((finding) => finding.detail.includes('layout gap expired')));
  });

  it('keeps the core independent of the business zone, in every language', async () => {
    const starters = await loadStarterManifests(REPO_ROOT);
    const capabilities = await loadCapabilityManifests(REPO_ROOT);

    // One breach per language the rule claims to read. A rule that only ever
    // understood TypeScript would still report zero findings on the other six
    // runtimes, and the silence would look exactly like conformity.
    const breaches = [
      ['nextjs', 'src/core/api/client.ts', "import { login } from '@/features/auth/login';"],
      ['nestjs', 'src/health/health.service.ts', "import { AuthService } from '../modules/auth/auth.service';"],
      ['flutter', 'lib/src/core/navigation/router.dart', "import '../../features/auth/login_screen.dart';"],
      ['fastapi', 'app/platform.py', 'from app.modules.auth import router'],
      ['fastapi', 'app/persistence/database.py', 'from ..modules.auth import model'],
      ['spring', 'src/main/java/com/enistere/core/config/SecurityConfig.java',
        'import com.enistere.core.modules.auth.AuthService;'],
      ['react-native', 'src/api/client.ts', "import { session } from '../features/auth/session';"],
      ['angular', 'src/app/core/api/client.ts', "import { Auth } from '../../features/auth/auth.service';"],
    ];
    for (const breach of breaches) {
      const report = runFitnessFunctions({ starters, capabilities, coreSources: [breach] });
      assert.ok(
        report.findings.some(
          (finding) => finding.rule === 'core-business-independence'
            && finding.detail.includes(breach[1]),
        ),
        `${breach[0]} breach went unnoticed: ${breach[2]}`,
      );
    }

    // The other direction must stay silent, or the rule would forbid the
    // dependency that is actually correct: business code builds on the core.
    const allowed = runFitnessFunctions({
      starters,
      capabilities,
      coreSources: [
        ['nextjs', 'src/core/api/client.ts', "import { env } from '@/core/config/env';"],
        ['flutter', 'lib/src/core/navigation/router.dart', "import '../../theme/tokens.dart';"],
        ['fastapi', 'app/main.py', 'from app.persistence import database'],
        ['spring', 'src/main/java/com/enistere/core/config/SecurityConfig.java',
          'import com.enistere.core.common.ApiError;'],
      ],
    });
    assert.deepEqual(
      allowed.findings.filter((finding) => finding.rule === 'core-business-independence'),
      [],
    );

    // The composition seam is the one file whose job is to import business
    // code, and it is exempt because the adapter registry generates it.
    const seam = runFitnessFunctions({
      starters,
      capabilities,
      coreSources: [
        ['fastapi', 'app/composition/capability_routers.py', 'from app.modules.auth import router'],
      ],
    });
    assert.deepEqual(
      seam.findings.filter((finding) => finding.rule === 'core-business-independence'),
      [],
    );
  });

  it('actually reads everything the Factory owns, in all seven runtimes', () => {
    // Without this, the rule above could pass by reading nothing at all — the
    // failure mode that let a dangling golden ship once already.
    const sources = factoryOwnedSources(REPO_ROOT);
    const perRuntime = new Map();
    for (const [runtime] of sources) perRuntime.set(runtime, (perRuntime.get(runtime) ?? 0) + 1);
    for (const runtime of Object.keys(RUNTIME_ZONES)) {
      assert.ok(
        (perRuntime.get(runtime) ?? 0) > 5,
        `${runtime}: only ${perRuntime.get(runtime) ?? 0} starter files read`,
      );
    }
    // The routing roots are the newest half of the rule, and the half a
    // careless refactor would silently drop: assert they are read by name.
    for (const [runtime, zone] of Object.entries(RUNTIME_ZONES)) {
      for (const root of zone.routes ?? []) {
        assert.ok(
          sources.some(([id, path]) => id === runtime && path.startsWith(root)),
          `${runtime}: nothing read under the routing root ${root}`,
        );
      }
    }
    // And it must read something to import from, not just files.
    const specifiers = sources.flatMap(([, path, source]) => sourceSpecifiers(path, source));
    assert.ok(specifiers.length > 500, `only ${specifiers.length} specifiers parsed`);
  });

  it('holds the routing roots to the same import frontier as the core', async () => {
    const starters = await loadStarterManifests(REPO_ROOT);
    const capabilities = await loadCapabilityManifests(REPO_ROOT);

    // A route file a starter ships is Factory-owned and replaced by a
    // regeneration, so it must not depend on the zone regeneration preserves.
    // A capability's own pages never reach this rule: it reads starters, and a
    // starter ships none.
    for (const breach of [
      ['nextjs', 'src/app/(public)/status/page.tsx',
        'import { HealthPanel } from "../../../features/health/health-panel.js";'],
      ['react-native', 'app/index.tsx', "import { Session } from '@/features/auth/session';"],
    ]) {
      const report = runFitnessFunctions({ starters, capabilities, coreSources: [breach] });
      assert.ok(
        report.findings.some(
          (finding) => finding.rule === 'core-business-independence'
            && finding.detail.includes(breach[1]),
        ),
        `${breach[0]} routing-root breach went unnoticed`,
      );
    }
  });

  it('flags a capability that both requires and conflicts the same capability', async () => {
    const starters = await loadStarterManifests(REPO_ROOT);
    const capabilities = await loadCapabilityManifests(REPO_ROOT);
    const reason = 'test-only conflict';
    const poisoned = capabilities.map((cap) => {
      if (cap.id === 'rbac') return { ...cap, conflicts: [{ id: 'auth', reason }] };
      if (cap.id === 'auth') return { ...cap, conflicts: [{ id: 'rbac', reason }] };
      return cap;
    });
    const report = runFitnessFunctions({ starters, capabilities: poisoned });
    assert.equal(report.passed, false);
    assert.ok(report.findings.some((f) => f.rule === 'capability-contradiction' && f.detail.includes('rbac')));
  });

  it('flags a requirement on an unknown capability', async () => {
    const starters = await loadStarterManifests(REPO_ROOT);
    const capabilities = await loadCapabilityManifests(REPO_ROOT);
    const poisoned = capabilities.map((cap) => (cap.id === 'files' ? { ...cap, requires: [...cap.requires, 'ghost'] } : cap));
    const report = runFitnessFunctions({ starters, capabilities: poisoned });
    assert.ok(report.findings.some((f) => f.rule === 'capability-closure' && f.detail.includes('ghost')));
  });

  it('forbids the legacy baseSource indirection', async () => {
    const starters = await loadStarterManifests(REPO_ROOT);
    const capabilities = await loadCapabilityManifests(REPO_ROOT);
    const poisoned = starters.map((starter) => (
      starter.id === 'angular'
        ? { ...starter, composition: { ...starter.composition, baseSource: 'starters/angular/base' } }
        : starter
    ));
    const report = runFitnessFunctions({ starters: poisoned, capabilities });
    assert.ok(report.findings.some(
      (finding) => finding.rule === 'single-source' && finding.detail.includes('baseSource'),
    ));
  });

  it('forbids capability implementations embedded in Mobile runtime sources', async () => {
    const starters = await loadStarterManifests(REPO_ROOT);
    const capabilities = await loadCapabilityManifests(REPO_ROOT);
    const report = runFitnessFunctions({
      starters,
      capabilities,
      repoRoot: '/virtual',
      pathExists: (path) => path === '/virtual/starters/react-native/src/notifications',
    });
    assert.ok(report.findings.some(
      (finding) => finding.rule === 'capability-free-runtime'
        && finding.detail.includes('src/notifications'),
    ));
  });
});

describe('pipeline fitness functions (ADR-046 boundary, FF6–FF8)', () => {
  it('the real single canonical pipeline satisfies FF6–FF8', () => {
    const report = runPipelineFitnessFunctions({ repoRoot: REPO_ROOT });
    assert.deepEqual(report.findings, []);
    assert.equal(report.passed, true);
  });

  it('FF6 flags a downstream module that imports the ingestion layer', () => {
    const byPath = ingestionBoundaryFindings('factory/engine/resolver.mjs', "import { normalizeBlueprint } from '../blueprint/normalize.mjs';");
    // Both the blueprint-path rule and the forbidden-symbol rule fire.
    assert.ok(byPath.length >= 1);
    assert.ok(byPath.every((f) => f.rule === 'ingestion-boundary'));
    assert.ok(byPath.some((f) => f.detail.includes('normalizeBlueprint')));

    const bySymbol = ingestionBoundaryFindings('x.mjs', "import { resolveStack } from './applications.mjs';");
    assert.ok(bySymbol.some((f) => f.rule === 'ingestion-boundary' && f.detail.includes('resolveStack')));
  });

  it('FF6 accepts a downstream module that only imports pure layers', () => {
    const clean = ingestionBoundaryFindings('factory/model/generation-plan.mjs', "import { stableDigest } from './canonical-system.mjs';\nimport { deepFreeze } from './immutable.mjs';");
    assert.deepEqual(clean, []);
  });

  it('staticImports parses default, named and aliased imports', () => {
    const parsed = staticImports("import a from 'x';\nimport { b, c as d } from 'y';\nimport { e } from 'z';");
    assert.deepEqual(parsed, [
      { names: ['a'], from: 'x' },
      { names: ['b', 'c'], from: 'y' },
      { names: ['e'], from: 'z' },
    ]);
  });
});
